from flask import Blueprint, jsonify, request, g
from auth.middleware import require_auth, require_role
from gitrepo.analyzer import sync_repo, sync_commits, get_student_stats, get_all_student_stats
from gitrepo.client import get_project
from db import DbCursor

gitrepo_bp = Blueprint("gitrepo", __name__, url_prefix="/gitrepo")


@gitrepo_bp.route("/repos", methods=["POST"])
@require_auth
@require_role("instructor", "ta")
def add_repo():
    """
    Register a new GitLab repo for analysis.
    Body: { "project_path": "group/reponame" }
    """
    data = request.get_json()
    project_path = data.get("project_path")

    if not project_path:
        return jsonify({"error": "project_path is required"}), 400

    project = sync_repo(project_path)

    return jsonify({
        "message": "Repo registered",
        "repo": {
            "gitlab_id": project["id"],
            "name": project["name"],
            "url": project["web_url"],
        }
    }), 201


@gitrepo_bp.route("/repos", methods=["GET"])
@require_auth
def list_repos():
    """List all tracked repos."""
    with DbCursor() as cursor:
        cursor.execute("SELECT * FROM repos ORDER BY created_at DESC")
        repos = cursor.fetchall()
    return jsonify(repos)


@gitrepo_bp.route("/repos/<int:repo_db_id>/sync", methods=["POST"])
@require_auth
@require_role("instructor", "ta")
def sync_repo_commits(repo_db_id):
    """
    Trigger a full commit sync for a repo.
    Pulls all commits from GitLab and stores them in the DB.
    """
    with DbCursor() as cursor:
        cursor.execute("SELECT * FROM repos WHERE id = %s", (repo_db_id,))
        repo = cursor.fetchone()

    if not repo:
        return jsonify({"error": "Repo not found"}), 404

    commits = sync_commits(repo["gitlab_id"], repo_db_id)

    return jsonify({
        "message": f"Synced {len(commits)} commits",
        "repo_id": repo_db_id
    })


@gitrepo_bp.route("/repos/<int:repo_db_id>/stats", methods=["GET"])
@require_auth
def repo_stats(repo_db_id):
    """
    Get per-student stats for a repo.
    Students see only their own. Instructors/TAs see all.
    """
    if g.user["role"] in ("instructor", "ta"):
        stats = get_all_student_stats(repo_db_id)
        return jsonify(stats)
    else:
        stats = get_student_stats(repo_db_id, g.user["id"])
        return jsonify(stats)


@gitrepo_bp.route("/repos/<int:repo_db_id>/commits", methods=["GET"])
@require_auth
def list_commits(repo_db_id):
    """
    List commits for a repo, optionally filtered by author email.
    Students are automatically filtered to their own commits.
    """
    with DbCursor() as cursor:
        if g.user["role"] in ("instructor", "ta"):
            author_email = request.args.get("author_email")
            if author_email:
                cursor.execute(
                    "SELECT * FROM commits WHERE repo_id = %s AND author_email = %s ORDER BY committed_at DESC",
                    (repo_db_id, author_email),
                )
            else:
                cursor.execute(
                    "SELECT * FROM commits WHERE repo_id = %s ORDER BY committed_at DESC",
                    (repo_db_id,),
                )
        else:
            cursor.execute(
                """
                SELECT c.* FROM commits c
                JOIN users u ON c.author_email = u.email
                WHERE c.repo_id = %s AND u.id = %s
                ORDER BY c.committed_at DESC
                """,
                (repo_db_id, g.user["id"]),
            )

        commits = cursor.fetchall()

    return jsonify(commits)