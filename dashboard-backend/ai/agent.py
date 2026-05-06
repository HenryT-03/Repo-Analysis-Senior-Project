"""
Gemini-powered commit quality agent.
Mirrors the scaffolded agentic loop from the brief, adapted for commit analysis.
"""

import os
import json
import re
import logging
from datetime import datetime

from google import genai

from ai.actions import (
    get_contributor_commits,
    get_commit_message_batch,
    get_commit_time_distribution,
    get_repo_contributor_summary,
    get_repo_issues,
)
from ai.prompts import (
    SYSTEM_PROMPT,
    TEAM_SUMMARY_PROMPT,
    build_contributor_query,
    build_team_query,
)
from db import DbCursor

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Client setup
# ---------------------------------------------------------------------------

_client = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY environment variable is not set")
        _client = genai.Client(api_key=api_key)
    return _client


MODEL_ID = "gemini-2.5-flash-lite"

# ---------------------------------------------------------------------------
# Available actions registry (same pattern as the scaffold)
# ---------------------------------------------------------------------------

AVAILABLE_ACTIONS = {
    "get_contributor_commits": get_contributor_commits,
    "get_commit_message_batch": get_commit_message_batch,
    "get_commit_time_distribution": get_commit_time_distribution,
    "get_repo_contributor_summary": get_repo_contributor_summary,
    "get_repo_issues": get_repo_issues,
}

# ---------------------------------------------------------------------------
# JSON extraction helper
# ---------------------------------------------------------------------------


def _extract_json(text: str):
    """
    Pull the first JSON object out of the model response.
    Returns a dict or None.
    """
    try:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            raw = match.group(0)
            # Normalise fancy quotes
            raw = raw.replace("\u201c", '"').replace("\u201d", '"')
            return json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.debug("JSON decode failed: %s | raw: %.200s", exc, text)
    return None


# ---------------------------------------------------------------------------
# Core agent loop
# ---------------------------------------------------------------------------


def run_agent(user_query: str, system_prompt: str = SYSTEM_PROMPT, max_turns: int = 6) -> dict | None:
    """
    Agentic loop: send query, handle tool calls, return final Answer dict.
    Returns the parsed Answer JSON dict, or None on failure.
    """
    client = _get_client()
    messages = [{"role": "user", "parts": [{"text": user_query}]}]

    for turn in range(max_turns):
        logger.debug("Agent turn %d", turn)

        response = client.models.generate_content(
            model=MODEL_ID,
            contents=messages,
            config={"system_instruction": system_prompt},
        )
        response_text = response.text
        logger.debug("Model: %.300s", response_text)

        # ── Terminal condition ──────────────────────────────────────────────
        if "Answer:" in response_text and "Action:" not in response_text:
            # Extract the JSON that follows "Answer:"
            answer_part = response_text.split("Answer:", 1)[1].strip()
            parsed = _extract_json(answer_part)
            if parsed:
                return parsed
            logger.warning("Could not parse Answer JSON from: %.300s", answer_part)
            return None

        # ── Tool-call condition ─────────────────────────────────────────────
        action_json = _extract_json(response_text)
        if action_json and "function_name" in action_json:
            func_name = action_json["function_name"]
            func_args = action_json.get("function_parms", {})

            if func_name not in AVAILABLE_ACTIONS:
                logger.error("Unknown function requested: %s", func_name)
                break

            logger.debug("Calling %s(%s)", func_name, func_args)
            try:
                result = AVAILABLE_ACTIONS[func_name](**func_args)
            except Exception as exc:
                result = {"error": str(exc)}

            messages.append({"role": "model", "parts": [{"text": response_text}]})
            messages.append(
                {
                    "role": "user",
                    "parts": [{"text": f"Action_Response: {json.dumps(result, default=str)}"}],
                }
            )
        else:
            # Model replied with plain text but no Answer / action — give up
            logger.warning("No parsable action or Answer in model response.")
            break

    return None


# ---------------------------------------------------------------------------
# High-level analysis helpers
# ---------------------------------------------------------------------------


def analyse_contributor(repo_id: int, author_email: str) -> dict | None:
    """Run the agentic loop for one contributor and return the score dict."""
    query = build_contributor_query(repo_id, author_email)
    result = run_agent(query, system_prompt=SYSTEM_PROMPT)
    if result:
        result["repo_id"] = repo_id
        result["author_email"] = author_email
    return result


def analyse_team(repo_id: int) -> dict | None:
    """
    Analyse every contributor in a repo, then produce a team summary.
    Stores individual + team results in ai_analysis table.
    """
    # Get all contributors for this repo
    with DbCursor() as cursor:
        cursor.execute(
            """
            SELECT DISTINCT author_email, author_name
            FROM commits
            WHERE repo_id = %s AND author_email IS NOT NULL AND author_email != ''
            """,
            (repo_id,),
        )
        contributors = cursor.fetchall()

    if not contributors:
        return None

    individual_results = []
    for contrib in contributors:
        email = contrib["author_email"]
        result = analyse_contributor(repo_id, email)
        if result:
            individual_results.append(result)
            _persist_individual(repo_id, email, result)

    if not individual_results:
        return None

    # Team summary
    query = build_team_query(repo_id, individual_results)
    team_result = run_agent(query, system_prompt=TEAM_SUMMARY_PROMPT)
    if team_result:
        team_result["repo_id"] = repo_id
        _persist_team(repo_id, team_result)

    return {
        "team": team_result,
        "individuals": individual_results,
    }


# ---------------------------------------------------------------------------
# Persistence helpers
# ---------------------------------------------------------------------------


def _persist_individual(repo_id: int, author_email: str, result: dict):
    """Upsert individual AI analysis result into ai_scores table."""
    try:
        with DbCursor() as cursor:
            cursor.execute(
                """
                INSERT INTO ai_scores
                    (repo_id, author_email, total_score, dimension_json,
                     flags_json, summary, analysed_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
                ON DUPLICATE KEY UPDATE
                    total_score    = VALUES(total_score),
                    dimension_json = VALUES(dimension_json),
                    flags_json     = VALUES(flags_json),
                    summary        = VALUES(summary),
                    analysed_at    = NOW()
                """,
                (
                    repo_id,
                    author_email,
                    result.get("total_score", 0),
                    json.dumps(result.get("dimensions", {})),
                    json.dumps(result.get("flags", [])),
                    result.get("summary", ""),
                ),
            )
    except Exception as exc:
        logger.error("Failed to persist individual score: %s", exc)


def _persist_team(repo_id: int, result: dict):
    """Upsert team-level AI analysis result into ai_team_scores table."""
    try:
        with DbCursor() as cursor:
            cursor.execute(
                """
                INSERT INTO ai_team_scores
                    (repo_id, team_score, member_scores_json,
                     flags_json, summary, analysed_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                ON DUPLICATE KEY UPDATE
                    team_score          = VALUES(team_score),
                    member_scores_json  = VALUES(member_scores_json),
                    flags_json          = VALUES(flags_json),
                    summary             = VALUES(summary),
                    analysed_at         = NOW()
                """,
                (
                    repo_id,
                    result.get("team_score", 0),
                    json.dumps(result.get("member_scores", [])),
                    json.dumps(result.get("team_flags", [])),
                    result.get("team_summary", ""),
                ),
            )
    except Exception as exc:
        logger.error("Failed to persist team score: %s", exc)


# ---------------------------------------------------------------------------
# Cached read helpers (for API routes)
# ---------------------------------------------------------------------------


def get_cached_individual(repo_id: int, author_email: str) -> dict | None:
    with DbCursor() as cursor:
        cursor.execute(
            """
            SELECT total_score, dimension_json, flags_json, summary, analysed_at
            FROM ai_scores
            WHERE repo_id = %s AND author_email = %s
            """,
            (repo_id, author_email),
        )
        row = cursor.fetchone()
    if not row:
        return None
    return {
        "total_score": row["total_score"],
        "dimensions": json.loads(row["dimension_json"] or "{}"),
        "flags": json.loads(row["flags_json"] or "[]"),
        "summary": row["summary"],
        "analysed_at": str(row["analysed_at"]),
    }


def get_cached_team(repo_id: int) -> dict | None:
    with DbCursor() as cursor:
        cursor.execute(
            """
            SELECT team_score, member_scores_json, flags_json, summary, analysed_at
            FROM ai_team_scores
            WHERE repo_id = %s
            """,
            (repo_id,),
        )
        row = cursor.fetchone()
    if not row:
        return None
    return {
        "team_score": row["team_score"],
        "member_scores": json.loads(row["member_scores_json"] or "[]"),
        "team_flags": json.loads(row["flags_json"] or "[]"),
        "team_summary": row["summary"],
        "analysed_at": str(row["analysed_at"]),
    }

# ---------------------------------------------------------------------------
# Fallback method
# ---------------------------------------------------------------------------

def heuristic_team_analysis(repo_id: int) -> dict | None:
    contributors = get_repo_contributor_summary(repo_id)
    if not contributors:
        return None

    member_scores = []
    flags = []

    for c in contributors:
        commit_count = c["commit_count"]
        lines = c["total_additions"] + c["total_deletions"]
        merges = c["merge_count"]

        score = 0

        if commit_count >= 8:
            score += 25
        elif commit_count >= 5:
            score += 18
        elif commit_count >= 2:
            score += 10

        if lines >= 200:
            score += 25
        elif lines >= 50:
            score += 15
        elif lines > 0:
            score += 8

        if "main" in c["branches"]:
            score += 25
        elif len(c["branches"]) > 1:
            score += 12

        score += 25

        member_scores.append({
            "email": c["author_email"],
            "score": max(0, min(100, score)),
        })

    team_score = round(sum(m["score"] for m in member_scores) / len(member_scores))

    if max(m["score"] for m in member_scores) - min(m["score"] for m in member_scores) >= 40:
        flags.append("Large contribution imbalance between team members")

    return {
        "repo_id": repo_id,
        "team_score": team_score,
        "member_scores": member_scores,
        "team_flags": flags,
        "team_summary": (
            f"Heuristic fallback score based on commit count, lines changed, branches, "
            f"and team balance. Gemini analysis was unavailable, so this does not include "
            f"LLM-based commit-message or integrity review."
        ),
        "source": "heuristic",
    }