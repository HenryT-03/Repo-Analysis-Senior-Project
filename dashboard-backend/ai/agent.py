"""
Gemini-powered team summary layer.

Important:
- This file no longer runs a multi-turn tool-calling agent per contributor.
- Local analysis gathers the scoped data first.
- Gemini gets one compact repo-level payload and returns one team summary.
- If Gemini fails or quota is exhausted, this returns None so routes.py falls back to local analysis.
"""

import json
import logging
import os

from google import genai

from ai.local_analysis import analyse_team_local
from ai.prompts import TEAM_SUMMARY_PROMPT, build_team_query

logger = logging.getLogger(__name__)

_client = None

MODEL_ID = os.getenv("GEMINI_MODEL_ID", "gemini-2.5-flash-lite")


def _get_client():
    global _client

    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY environment variable is not set")
        _client = genai.Client(api_key=api_key)

    return _client


def _extract_json(text: str):
    """
    Extract the first valid JSON object from arbitrary model text.
    Handles:
    - raw JSON
    - JSON after prose
    - JSON inside accidental surrounding text
    """
    if not text:
        return None

    decoder = json.JSONDecoder()

    for idx, char in enumerate(text):
        if char != "{":
            continue

        try:
            parsed, _ = decoder.raw_decode(text[idx:])
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            continue

    return None


def _call_gemini_team_summary(prompt: str) -> dict | None:
    model = _get_client()

    response = model.models.generate_content(
        model=MODEL_ID,
        contents=[
            {
                "role": "user",
                "parts": [
                    {
                        "text": (
                            f"System:\n{TEAM_SUMMARY_PROMPT}\n\n"
                            f"User:\n{prompt}"
                        )
                    }
                ],
            }
        ],
    )

    response_text = response.text or ""
    logger.warning("Gemini raw response: %s", response_text)

    parsed = _extract_json(response_text)
    if not parsed:
        logger.warning("Gemini response did not contain parseable JSON.")
        return None

    return parsed


def _normalise_team_result(
    repo_id: int,
    gemini_team: dict,
    local_result: dict,
    start_date: str = None,
    end_date: str = None,
) -> dict:
    local_team = local_result["team"]

    member_scores = gemini_team.get("member_scores") or local_team.get("member_scores", [])
    team_flags = gemini_team.get("team_flags") or local_team.get("team_flags", [])

    try:
        team_score = int(gemini_team.get("team_score", local_team.get("team_score", 0)))
    except Exception:
        team_score = int(local_team.get("team_score", 0))

    team_score = max(0, min(100, team_score))

    team_summary = (
        gemini_team.get("team_summary")
        or local_team.get("team_summary")
        or "Gemini returned no summary; local deterministic summary used."
    )

    return {
        "team": {
            "repo_id": repo_id,
            "team_score": team_score,
            "member_scores": member_scores,
            "team_flags": team_flags,
            "team_summary": team_summary,
            "source": "gemini",
            "date_range": {
                "start_date": start_date,
                "end_date": end_date,
            },
            "raw_stats": local_team.get("raw_stats", {}),
        },
        "individuals": local_result.get("individuals", []),
    }


def analyse_team(
    repo_id: int,
    start_date: str = None,
    end_date: str = None,
) -> dict | None:
    """
    Single Gemini call per repo.

    Returns:
      - Gemini-enhanced team result on success.
      - None on Gemini failure so the route can immediately use local fallback.
    """
    local_result = analyse_team_local(
        repo_id,
        start_date=start_date,
        end_date=end_date,
    )

    if not local_result:
        return None

    try:
        prompt = build_team_query(
            repo_id=repo_id,
            local_result=local_result,
            start_date=start_date,
            end_date=end_date,
        )

        gemini_team = _call_gemini_team_summary(prompt)
        if not gemini_team:
            return None

        return _normalise_team_result(
            repo_id=repo_id,
            gemini_team=gemini_team,
            local_result=local_result,
            start_date=start_date,
            end_date=end_date,
        )

    except Exception as exc:
        logger.error("Gemini team summary failed: %s", exc)
        return None