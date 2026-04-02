from gitrepo.client import (
    get_project,
    get_all_commits_paginated,
    get_commit_stats,
    get_contributors,
)
from db import DbCursor
from datetime import datetime


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