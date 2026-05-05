from flask import Blueprint, jsonify
from auth.middleware import require_auth, require_role

from ai.agent import analyse_team
from ai.local_analysis import analyse_team_local

ai_bp = Blueprint("ai", __name__, url_prefix="/ai")


@ai_bp.route("/repos/<int:repo_id>/analyse", methods=["POST"])
@require_auth
@require_role("instructor", "ta")
def run_team_analysis(repo_id: int):
    """
    Primary path:
      1. Try Gemini analysis.
      2. If Gemini fails or returns no result, fall back to local deterministic analysis.
      3. Do NOT persist either result.
    """
    try:
        gemini_result = analyse_team(repo_id)

        if gemini_result and gemini_result.get("team"):
            gemini_result["team"]["source"] = "gemini"
            return jsonify(gemini_result), 200

    except Exception as exc:
        print(f"[AI] Gemini failed for repo {repo_id}; falling back to local analysis: {exc}")

    local_result = analyse_team_local(repo_id)

    if not local_result:
        return jsonify({
            "error": "Gemini failed and local fallback failed",
            "repo_id": repo_id,
        }), 500

    local_result["team"]["source"] = "local_fallback"

    return jsonify(local_result), 200


@ai_bp.route("/repos/<int:repo_id>/analyse-local", methods=["POST"])
@require_auth
@require_role("instructor", "ta")
def run_team_analysis_local(repo_id: int):
    """
    Explicit local-only route.
    Useful for testing. Does NOT call Gemini. Does NOT persist.
    """
    result = analyse_team_local(repo_id)

    if not result:
        return jsonify({"error": "Local analysis failed", "repo_id": repo_id}), 500

    result["team"]["source"] = "local_only"

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