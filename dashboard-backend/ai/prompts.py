"""
Prompts for the commit-quality AI agent.

The Gemini path is intentionally single-call per repo:
1. Backend gathers all scoped data locally.
2. Gemini receives one compact JSON payload.
3. Gemini returns one team-level JSON result.

This avoids the old per-contributor tool loop that exhausted quota.
"""

import json


TEAM_SUMMARY_PROMPT = """
You are a TA assistant summarising a team's repository contribution quality.

You will receive JSON produced by deterministic local analysis.
The data is already filtered to the selected demo/date range when a date range is present.

Your job:
- Use the provided local scores and stats.
- Produce a concise team-level summary.
- Do not invent commits, contributors, dates, or issues.
- Do not request more data.
- Do not call tools.
- Return only valid JSON.

Output schema:
{
  "repo_id": <int>,
  "team_score": <0-100>,
  "member_scores": [
    {"email": "...", "name": "...", "score": <0-100>}
  ],
  "team_flags": ["..."],
  "team_summary": "..."
}

Scoring rules:
- team_score should usually be the arithmetic mean of member scores.
- You may adjust slightly only if the local data clearly shows a team-level issue.
- Highlight contribution imbalance when one or more members did much less work.
- Mention the date range if present.
- Be concise and useful for an instructor.
"""


def build_team_query(
    repo_id: int,
    local_result: dict,
    start_date: str = None,
    end_date: str = None,
) -> str:
    date_context = ""
    if start_date or end_date:
        date_context = (
            f"Date range: {start_date or 'beginning'} to {end_date or 'present'}.\n"
        )

    return (
        f"Repo ID: {repo_id}\n"
        f"{date_context}"
        "Local deterministic analysis JSON:\n"
        f"{json.dumps(local_result, indent=2, default=str)}\n\n"
        "Return only the team-level JSON object matching the required schema."
    )