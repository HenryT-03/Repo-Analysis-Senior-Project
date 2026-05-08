import requests
from flask import Blueprint, jsonify, request, g
from auth.middleware import require_auth, require_role
from gitrepo.analyzer import sync_repo, sync_commits, get_student_stats, get_all_student_stats, sync_all_projects, sync_project_commits, get_internal_repo_id, sync_all_data, get_all_repos, sync_project_issues
from gitrepo.client import get_project, get_group_projects, get_contributors, get_project_commits, get_config, set_config
from db import DbCursor

gitrepo_bp = Blueprint("gitrepo", __name__, url_prefix="/gitrepo")

@gitrepo_bp.route("/debug/all", methods=["GET"])
@require_auth
@require_role("instructor", "ta")
def debug_all():
    with DbCursor() as cursor:
        cursor.execute("""
            SELECT id, gitlab_id, name, total_commits
            FROM repos
            ORDER BY name
        """)
        repos = cursor.fetchall()

        result = []

        for repo in repos:
            cursor.execute("""
                SELECT id, name, email, commits, additions, deletions
                FROM contributors
                WHERE repo_id = %s
            """, (repo["id"],))
            contributors = cursor.fetchall()

            enriched_contributors = []

            for c in contributors:
                cursor.execute("""
                    SELECT sha, author_name, author_email, message,
                           additions, deletions, branch, committed_at,
                           is_merge
                    FROM commits
                    WHERE repo_id = %s AND author_email = %s
                    ORDER BY committed_at DESC
                """, (repo["id"], c["email"]))
                commit_history = cursor.fetchall()

                enriched_contributors.append({
                    **dict(c),
                    "commit_history": commit_history,
                })

            result.append({
                "id": repo["id"],
                "gitlab_id": repo["gitlab_id"],
                "name": repo["name"],
                "total_commits": repo["total_commits"],
                "contributors": enriched_contributors,
            })

    return jsonify({"repos": result})

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

@gitrepo_bp.route("/projects/<int:project_id>/contributors", methods=["GET"])
def fetch_contributors(project_id):
    """
    Get per-project contributor stats from the database.
    """
    with DbCursor() as cursor:
        cursor.execute(
            """
            SELECT name, email, commits, additions, deletions
            FROM contributors
            WHERE repo_id = %s
            """,
            (project_id,),
        )
        contributors = cursor.fetchall()

    return jsonify({"contributors": contributors})

@gitrepo_bp.route("/projects/<int:project_id>/commits", methods=["GET"])
def get_commits(project_id):
    repo_internal_id = get_internal_repo_id(project_id)

    if not repo_internal_id:
        return jsonify({"error": "Repo not found"}), 404

    start = request.args.get("start")
    end = request.args.get("end")

    commit_query = """
        SELECT sha, author_name, author_email, message,
               additions, deletions, branch, committed_at, is_merge
        FROM commits
        WHERE repo_id = %s
    """
    params = [repo_internal_id]

    if start:
        commit_query += " AND committed_at >= %s"
        params.append(start)
    if end:
        commit_query += " AND committed_at <= %s"
        params.append(end)

    commit_query += " ORDER BY committed_at DESC"

    issue_query = """
        SELECT author_email,
               SUM(1) as issues_created,
               SUM(CASE WHEN state = 'closed' THEN 1 ELSE 0 END) as issues_closed,
               SUM(CASE WHEN updated_at != created_at THEN 1 ELSE 0 END) as issues_updated
        FROM issues
        WHERE repo_id = %s
    """
    issue_params = [repo_internal_id]

    if start:
        issue_query += " AND created_at >= %s"
        issue_params.append(start)
    if end:
        issue_query += " AND created_at <= %s"
        issue_params.append(end)

    issue_query += " GROUP BY author_email"

    with DbCursor() as cursor:
        cursor.execute(commit_query, params)
        commits = cursor.fetchall()

        cursor.execute(issue_query, issue_params)
        issue_rows = cursor.fetchall()

    issue_map = {
        row["author_email"]: {
            "issues_created": row["issues_created"],
            "issues_closed": row["issues_closed"],
            "issues_updated": row["issues_updated"],
        }
        for row in issue_rows
    }
    for commit in commits:
        email = commit.get("author_email", "")
        stats = issue_map.get(email, {
            "issues_created": 0,
            "issues_closed": 0,
            "issues_updated": 0,
        })
        commit.update(stats)

    return jsonify(commits)

@gitrepo_bp.route("/syncProjects", methods=["POST"])
@require_auth
@require_role("instructor", "ta")
def sync_projects():
    sync_all_projects()
    return jsonify({"message": "Sync completed"}), 200

@gitrepo_bp.route("/syncAllData", methods=["POST"])
@require_auth
@require_role("instructor", "ta")
def sync_all_commits_route():
    try:
        result = sync_all_data()

        return jsonify({
            "message": "Bulk commit sync completed",
            "summary": result
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@gitrepo_bp.route("/projects/<int:project_id>/syncCommits", methods=["POST"])
@require_auth
@require_role("instructor", "ta")
def sync_commits(project_id):
    try:
        sync_project_commits(project_id)
        sync_project_issues(project_id)  # ← add this
        return jsonify({"message": "Commits and issues synced"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
@gitrepo_bp.route("/projects", methods=["GET"])
def fetch_projects():
    with DbCursor() as cursor:
        cursor.execute("SELECT gitlab_id, name, total_commits FROM repos")
        repos = cursor.fetchall()

        result = []

        for r in repos:
            cursor.execute(
                """
                SELECT id, name, commits
                FROM contributors
                WHERE repo_id = %s
                """,
                (r["gitlab_id"],),
            )
            contributors = cursor.fetchall()

            result.append({
                "id": r["gitlab_id"],
                "name": r["name"],
                "totalCommits": r["total_commits"],
                "students": contributors
            })

    return jsonify({
        "count": len(result),
        "data": result
    })

@gitrepo_bp.route("/user/repos", methods=["GET"])
@require_auth
def get_user_repos():
    """Get repos that the current user is a contributor to."""
    user_email = g.user["email"]

    with DbCursor() as cursor:
        # For instructors and TAs, return all repos
        if g.user["role"] in ("instructor", "ta"):
            cursor.execute("SELECT id, name, total_commits FROM repos ORDER BY name")
            repos = cursor.fetchall()
        else:
            # For students, only return repos they contribute to
            cursor.execute("""
                SELECT DISTINCT r.id, r.name, r.total_commits
                FROM repos r
                JOIN contributors c ON r.id = c.repo_id
                WHERE c.email = %s
                ORDER BY r.name
            """, (user_email,))
            repos = cursor.fetchall()

    return jsonify(repos)

@gitrepo_bp.route("/config", methods=["GET"])
def get_config_route():
    return jsonify(get_config())

@gitrepo_bp.route("/config", methods=["POST"])
def set_config_route():
    updates = request.get_json()
    if not updates:
        return jsonify({"error": "No data provided"}), 400
    try:
        updated = set_config(updates)
        return jsonify(updated)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    
    
@gitrepo_bp.route("/fetchAll", methods=["GET"])
def fetch_all():
    """
    Fetch all projects with nested contributors and commits from the DB.
    """
    try:
        with DbCursor() as cursor:
            cursor.execute("SELECT * FROM repos")
            repos = cursor.fetchall()

            cursor.execute("SELECT * FROM contributors")
            contributors = cursor.fetchall()

            cursor.execute("SELECT * FROM commits")
            commits = cursor.fetchall()

            cursor.execute("SELECT * FROM issues")
            issues = cursor.fetchall()

        # Group commits by repo_id
        commits_by_repo = {}
        for commit in commits:
            repo_id = commit["repo_id"]
            commits_by_repo.setdefault(repo_id, []).append(commit)

        # Group contributors by repo_id
        contributors_by_repo = {}
        for contributor in contributors:
            repo_id = contributor["repo_id"]
            contributors_by_repo.setdefault(repo_id, []).append(contributor)

        # Group issues by repo_id
        issues_by_repo = {}
        for issue in issues:
            repo_id = issue["repo_id"]
            issues_by_repo.setdefault(repo_id, []).append(issue)

        
        commits_by_email = {}
        for commit in commits:
            repo_id = commit["repo_id"]  # this is the internal DB id
            email = commit.get("author_email")
            commits_by_email.setdefault((repo_id, email), []).append(commit)

        with DbCursor() as cursor:
            cursor.execute("SELECT id, gitlab_id FROM repos")
            repo_id_map = {row["gitlab_id"]: row["id"] for row in cursor.fetchall()}

        result = []
        for repo in repos:
            gitlab_id = repo["gitlab_id"]
            internal_id = repo_id_map.get(gitlab_id)

            nested_contributors = []
            for c in contributors_by_repo.get(gitlab_id, []):
                email = c.get("email")
                nested_contributors.append({

                    "id": c["id"],
                    "name": c["name"],
                    "email": email,
                    "commits": c["commits"],
                    "additions": c.get("additions", 0),
                    "deletions": c.get("deletions", 0),
                    "commit_history": commits_by_email.get((internal_id, email), []),
                })
            result.append({
                "id": gitlab_id,           
                "name": repo["name"],
                "total_commits": repo["total_commits"],
                "contributors": nested_contributors,
                "issues": issues_by_repo.get(gitlab_id, []),
            })

        return jsonify({
            "counts": {
                "repos": len(repos),
                "contributors": len(contributors),
                "commits": len(commits),
                "issues": len(issues),
            },
            "repos": result,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@gitrepo_bp.route("/deleteAll", methods=["DELETE"])
def delete_all():
    """
    Delete all data from repos, contributors, commits, and issues tables.
    """
    try:
        with DbCursor() as cursor:
            cursor.execute("DELETE FROM commits")
            cursor.execute("DELETE FROM issues")
            cursor.execute("DELETE FROM contributors")
            cursor.execute("DELETE FROM repos")

        return jsonify({"message": "All data deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500