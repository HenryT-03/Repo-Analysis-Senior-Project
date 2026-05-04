from gitrepo.client import (
    get_project,
    get_all_commits_paginated,
    get_commit_stats,
    get_contributors,
    get_group_projects,
    get_project_commits,
)
from db import DbCursor
from datetime import datetime
import requests
from config import GITLAB_URL, GITLAB_TOKEN, GITLAB_GROUP_NAME

def _headers():
    h = {"Content-Type": "application/json"}
    if GITLAB_TOKEN:
        h["PRIVATE-TOKEN"] = GITLAB_TOKEN
    return h


def sync_repo(project_path: str) -> dict:
    """
    Fetch project from GitLab and upsert into repos table.
    Returns the project dict.
    """
    project = get_project(project_path)

    with DbCursor() as cursor:
        cursor.execute(
            """
            INSERT INTO repos (gitlab_id, name, description, namespace, url, created_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                description = VALUES(description)
            """,
            (
                project["id"],
                project["name"],
                project.get("description"),
                project["namespace"]["full_path"],
                project["web_url"],
            ),
        )

    return project


def sync_commits(project_id: int, repo_db_id: int) -> list:
    """
    Pull all commits from GitLab for a project, enrich with stats,
    and upsert into commits table.
    Returns list of raw commit dicts.
    """
    commits = get_all_commits_paginated(project_id)

    with DbCursor() as cursor:
        for commit in commits:
            # stats.additions / stats.deletions may already be on commit object
            # but we call get_commit_stats for guaranteed detail
            stats_data = get_commit_stats(project_id, commit["id"])
            stats = stats_data.get("stats", {})

            # Extract branch info from refs if available
            branch = commit.get("refs") or "unknown"

            cursor.execute(
                """
                INSERT INTO commits
                    (sha, repo_id, author_name, author_email, message,
                     additions, deletions, branch, committed_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    additions = VALUES(additions),
                    deletions = VALUES(deletions)
                """,
                (
                    commit["id"],
                    repo_db_id,
                    commit.get("author_name"),
                    commit.get("author_email"),
                    commit.get("message", "")[:1000],  # truncate huge messages
                    stats.get("additions", 0),
                    stats.get("deletions", 0),
                    branch if isinstance(branch, str) else str(branch),
                    commit.get("committed_date"),
                ),
            )

    return commits


def get_student_stats(repo_db_id: int, user_id: int) -> dict:
    """
    Aggregate commit stats for a single student on a repo.
    Returns: commit_count, total_additions, total_deletions, branches_pushed_to.
    """
    with DbCursor() as cursor:
        # Join users.gitlab_username → commits.author_email
        cursor.execute(
            """
            SELECT u.gitlab_username, u.email
            FROM users u
            WHERE u.id = %s
            """,
            (user_id,),
        )
        user = cursor.fetchone()

        if not user:
            return {}

        # Match by gitlab_username or email
        cursor.execute(
            """
            SELECT
                COUNT(*)                  AS commit_count,
                SUM(additions)            AS total_additions,
                SUM(deletions)            AS total_deletions,
                GROUP_CONCAT(DISTINCT branch) AS branches
            FROM commits
            WHERE repo_id = %s
              AND (author_email = %s OR author_name = %s)
            """,
            (repo_db_id, user["email"], user.get("gitlab_username")),
        )
        stats = cursor.fetchone()

    return {
        "commit_count": stats["commit_count"] or 0,
        "total_additions": int(stats["total_additions"] or 0),
        "total_deletions": int(stats["total_deletions"] or 0),
        "branches": stats["branches"].split(",") if stats["branches"] else [],
    }


def get_all_student_stats(repo_db_id: int) -> list:
    """
    Get commit stats for ALL contributors on a repo in one query.
    Used by instructors/TAs to see the class overview.
    """
    with DbCursor() as cursor:
        cursor.execute(
            """
            SELECT
                author_name,
                author_email,
                COUNT(*)       AS commit_count,
                SUM(additions) AS total_additions,
                SUM(deletions) AS total_deletions,
                GROUP_CONCAT(DISTINCT branch) AS branches
            FROM commits
            WHERE repo_id = %s
            GROUP BY author_email, author_name
            ORDER BY commit_count DESC
            """,
            (repo_db_id,),
        )
        rows = cursor.fetchall()

    return [
        {
            **row,
            "total_additions": int(row["total_additions"] or 0),
            "total_deletions": int(row["total_deletions"] or 0),
            "branches": row["branches"].split(",") if row["branches"] else [],
        }
        for row in rows
    ]


#Jacob Methods
def sync_contributors_of_project(project_id):
    contributors = get_contributors(project_id)

    with DbCursor() as cursor:
        cursor.execute("DELETE FROM contributors WHERE repo_id = %s", (project_id,))

        for c in contributors:
            cursor.execute(
                """
                INSERT INTO contributors (repo_id, gitlab_user_id, name, email, commits, additions, deletions)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    project_id,
                    c.get("id") or c.get("user_id") or None,
                    c.get("name") or c.get("username") or "Unknown",
                    c.get("email") or None,
                    c.get("commits", 0),
                    c.get("additions", 0),
                    c.get("deletions", 0),
                ),
            )

def upsert_project_with_stats(project, contributors):
    total_commits = sum(c.get("commits", 0) for c in contributors)

    with DbCursor() as cursor:
        cursor.execute(
            """
            INSERT INTO repos (gitlab_id, name, total_commits)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                total_commits = VALUES(total_commits)
            """,
            (project["id"], project["name"], total_commits),
        )
    sync_contributors_of_project(project["id"])

def sync_all_projects():
    projects = get_group_projects()
    for p in projects:
        contributors = get_contributors(p["id"])
        upsert_project_with_stats(p, contributors)

def sync_project_commits(project_id: int):
    commits = get_project_commits(project_id)

    repo_internal_id = get_internal_repo_id(project_id)

    if not repo_internal_id:
        raise Exception("Repo not found in DB. Run /syncProjects first.")

    with DbCursor() as cursor:
        for c in commits:
            sha = c["id"]

            detail_resp = requests.get(
                f"{GITLAB_URL}/api/v4/projects/{project_id}/repository/commits/{sha}",
                headers=_headers(),
                timeout=10,
            )
            detail_resp.raise_for_status()
            detail = detail_resp.json()
            is_merge = len(detail.get("parent_ids", [])) > 1

            cursor.execute(
                """
                INSERT INTO commits (
                    sha, repo_id, author_name, author_email,
                    message, additions, deletions,
                    branch, committed_at, is_merge
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    author_name = VALUES(author_name),
                    author_email = VALUES(author_email),
                    message = VALUES(message),
                    additions = VALUES(additions),
                    deletions = VALUES(deletions),
                    branch = VALUES(branch),
                    committed_at = VALUES(committed_at),
                    is_merge = VALUES(is_merge)
                """,
                (
                    sha,
                    repo_internal_id,
                    c.get("author_name"),
                    c.get("author_email"),
                    c.get("title"),
                    detail.get("stats", {}).get("additions", 0),
                    detail.get("stats", {}).get("deletions", 0),
                    "main",
                    c.get("committed_date"),
                    is_merge,
                ),
            )

def sync_project_issues(project_id: int):
    resp = requests.get(
        f"{GITLAB_URL}/api/v4/projects/{project_id}/issues",
        headers=_headers(),
        params={"per_page": 100},
        timeout=10,
    )
    resp.raise_for_status()
    issues = resp.json()

    repo_internal_id = get_internal_repo_id(project_id)
    with DbCursor() as cursor:
        for issue in issues:
            cursor.execute("""
                INSERT INTO issues (
                    gitlab_id, repo_id, author_name, author_email,
                    title, state, created_at, updated_at, closed_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    state = VALUES(state),
                    updated_at = VALUES(updated_at),
                    closed_at = VALUES(closed_at)
            """, (
                issue["iid"],
                repo_internal_id,
                issue["author"]["name"],
                issue["author"].get("email", ""),
                issue["title"],
                issue["state"],
                issue["created_at"],
                issue["updated_at"],
                issue.get("closed_at"),
            ))


def get_all_repos():
    with DbCursor() as cursor:
        cursor.execute("SELECT id, gitlab_id FROM repos")
        return cursor.fetchall()

def sync_all_data():
    sync_all_projects()
    repos = get_all_repos()
    results = []
    errors = []
    for i, repo in enumerate(repos):
        gitlab_id = repo["gitlab_id"]
        print(f"[{i+1}/{len(repos)}] Syncing repo {gitlab_id}...")
        try:
            sync_project_commits(gitlab_id)
            sync_project_issues(gitlab_id)
            results.append(gitlab_id)
            print(f"Done")
        except Exception as e:
            errors.append({"project_id": gitlab_id, "error": str(e)})
            print(f"Failed: {e}")
    return {"synced": len(results), "failed": len(errors), "errors": errors}


# Temporary helper function, need to rename gitlab_id to id later in commits table
def get_internal_repo_id(gitlab_project_id: int):
    with DbCursor() as cursor:
        cursor.execute(
            "SELECT id FROM repos WHERE gitlab_id = %s",
            (gitlab_project_id,),
        )
        row = cursor.fetchone()
        return row["id"] if row else None
    
