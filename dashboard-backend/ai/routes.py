from flask import Blueprint, jsonify, request
from auth.middleware import require_auth, require_role

from ai.agent import analyse_team
from ai.local_analysis import analyse_team_local
from config import (
    Demo1Start,
    Demo1End,
    Demo2Start,
    Demo2End,
    Demo3Start,
    Demo3End,
    Demo4Start,
    Demo4End,
)

ai_bp = Blueprint("ai", __name__, url_prefix="/ai")


DEMO_RANGES = {
    "1": (Demo1Start, Demo1End),
    "2": (Demo2Start, Demo2End),
    "3": (Demo3Start, Demo3End),
    "4": (Demo4Start, Demo4End),
    "Demo 1": (Demo1Start, Demo1End),
    "Demo 2": (Demo2Start, Demo2End),
    "Demo 3": (Demo3Start, Demo3End),
    "Demo 4": (Demo4Start, Demo4End),
}


def _get_analysis_range():
    body = request.get_json(silent=True) or {}

    start_date = (
        request.args.get("start")
        or request.args.get("start_date")
        or body.get("start")
        or body.get("start_date")
    )
    end_date = (
        request.args.get("end")
        or request.args.get("end_date")
        or body.get("end")
        or body.get("end_date")
    )

    if start_date or end_date:
        return start_date, end_date

    demo = request.args.get("demo") or body.get("demo")
    return DEMO_RANGES.get(str(demo), (None, None))


@ai_bp.route("/repos/<int:repo_id>/analyse", methods=["POST"])
@require_auth
@require_role("instructor", "ta")
def run_team_analysis(repo_id: int):
    """
    Primary path:
      1. Run local scoped analysis immediately.
      2. Try one Gemini team-summary call.
      3. If Gemini fails/quota is exhausted, return local fallback.
      4. Do NOT persist either result.
    """
    start_date, end_date = _get_analysis_range()

    try:
        gemini_result = analyse_team(
            repo_id,
            start_date=start_date,
            end_date=end_date,
        )

        if gemini_result and gemini_result.get("team"):
            gemini_result["team"]["source"] = "gemini"
            gemini_result["team"]["date_range"] = {
                "start_date": start_date,
                "end_date": end_date,
            }
            return jsonify(gemini_result), 200

    except Exception as exc:
        print(f"[AI] Gemini failed for repo {repo_id}; falling back to local analysis: {exc}")

    local_result = analyse_team_local(
        repo_id,
        start_date=start_date,
        end_date=end_date,
    )

    if not local_result:
        return jsonify({
            "error": "Gemini failed and local fallback failed",
            "repo_id": repo_id,
            "date_range": {
                "start_date": start_date,
                "end_date": end_date,
            },
        }), 500

    local_result["team"]["source"] = "local_fallback"
    local_result["team"]["date_range"] = {
        "start_date": start_date,
        "end_date": end_date,
    }

    return jsonify(local_result), 200


@ai_bp.route("/repos/<int:repo_id>/analyse-local", methods=["POST"])
@require_auth
@require_role("instructor", "ta")
def run_team_analysis_local(repo_id: int):
    """
    Explicit local-only route.
    Useful for testing. Does NOT call Gemini. Does NOT persist.
    """
    start_date, end_date = _get_analysis_range()

    result = analyse_team_local(
        repo_id,
        start_date=start_date,
        end_date=end_date,
    )

    if not result:
        return jsonify({
            "error": "Local analysis failed",
            "repo_id": repo_id,
            "date_range": {
                "start_date": start_date,
                "end_date": end_date,
            },
        }), 500

    result["team"]["source"] = "local_only"
    result["team"]["date_range"] = {
        "start_date": start_date,
        "end_date": end_date,
    }

    return jsonify(result), 200


@ai_bp.route("/scores/all", methods=["GET"])
@require_auth
@require_role("instructor", "ta")
def get_all_team_scores():
    """
    No persisted analysis policy:
    return empty list so dashboard starts clean after reload.
    """
    return jsonify([]), 200