"""
AI Analysis Actions
Available tool-calls the Gemini agent can invoke to gather commit data.
"""

from db import DbCursor


def get_commit_details(repo_id: int, sha: str) -> dict:
    """Fetch full details of a single commit including diff stats."""
    with DbCursor() as cursor:
        cursor.execute(
            """
            SELECT sha, author_name, author_email, message,
                   additions, deletions, branch, committed_at, is_merge
            FROM commits
            WHERE repo_id = %s AND sha = %s
            """,
            (repo_id, sha),
        )
        row = cursor.fetchone()
    if not row:
        return {"error": f"Commit {sha} not found in repo {repo_id}"}
    return dict(row)


def get_contributor_commits(repo_id: int, author_email: str, limit: int = 20) -> list:
    """
    Fetch recent commits for a contributor.
    Returns sha, message, additions, deletions, branch, is_merge, committed_at.
    """
    with DbCursor() as cursor:
        cursor.execute(
            """
            SELECT sha, message, additions, deletions, branch,
                   is_merge, committed_at
            FROM commits
            WHERE repo_id = %s AND author_email = %s
            ORDER BY committed_at DESC
            LIMIT %s
            """,
            (repo_id, author_email, limit),
        )
        rows = cursor.fetchall()
    return [dict(r) for r in rows]


def get_repo_contributor_summary(repo_id: int) -> list:
    """
    Aggregate commit stats per contributor for a repo:
    commit_count, total_additions, total_deletions, merge_count, distinct branches.
    """
    with DbCursor() as cursor:
        cursor.execute(
            """
            SELECT
                author_name,
                author_email,
                COUNT(*)                          AS commit_count,
                SUM(additions)                    AS total_additions,
                SUM(deletions)                    AS total_deletions,
                SUM(is_merge)                     AS merge_count,
                GROUP_CONCAT(DISTINCT branch)     AS branches
            FROM commits
            WHERE repo_id = %s
            GROUP BY author_email, author_name
            ORDER BY commit_count DESC
            """,
            (repo_id,),
        )
        rows = cursor.fetchall()
    return [
        {
            **dict(r),
            "total_additions": int(r["total_additions"] or 0),
            "total_deletions": int(r["total_deletions"] or 0),
            "merge_count": int(r["merge_count"] or 0),
            "branches": r["branches"].split(",") if r["branches"] else [],
        }
        for r in rows
    ]


def get_commit_message_batch(repo_id: int, author_email: str, limit: int = 30) -> list:
    """
    Return just the commit messages + basic metadata for a contributor.
    Useful for LLM text-based analysis of commit quality/style.
    """
    with DbCursor() as cursor:
        cursor.execute(
            """
            SELECT sha, message, additions, deletions, is_merge, committed_at
            FROM commits
            WHERE repo_id = %s AND author_email = %s
            ORDER BY committed_at DESC
            LIMIT %s
            """,
            (repo_id, author_email, limit),
        )
        rows = cursor.fetchall()
    return [dict(r) for r in rows]


def get_repo_issues(repo_id: int) -> list:
    """Fetch all issues for a repo to cross-reference with commit activity."""
    with DbCursor() as cursor:
        cursor.execute(
            """
            SELECT author_email, title, state, created_at, updated_at, closed_at
            FROM issues
            WHERE repo_id = %s
            ORDER BY created_at DESC
            """,
            (repo_id,),
        )
        rows = cursor.fetchall()
    return [dict(r) for r in rows]


def get_commit_time_distribution(repo_id: int, author_email: str) -> dict:
    """
    Analyse the time-of-day / day-of-week pattern of commits.
    Unusual patterns (e.g. all commits at 3 AM in a 20-minute burst) can
    be a signal worth flagging.
    """
    with DbCursor() as cursor:
        cursor.execute(
            """
            SELECT
                HOUR(committed_at)          AS hour_of_day,
                DAYOFWEEK(committed_at)     AS day_of_week,
                COUNT(*)                    AS commit_count,
                MIN(committed_at)           AS earliest,
                MAX(committed_at)           AS latest
            FROM commits
            WHERE repo_id = %s AND author_email = %s
            GROUP BY hour_of_day, day_of_week
            ORDER BY day_of_week, hour_of_day
            """,
            (repo_id, author_email),
        )
        rows = cursor.fetchall()

    distribution = [dict(r) for r in rows]

    # Flag if >80 % of commits fall within a 2-hour window
    total = sum(r["commit_count"] for r in distribution)
    suspicious_burst = False
    if total > 3:
        for r in distribution:
            if r["commit_count"] / total > 0.8:
                suspicious_burst = True
                break

    return {"distribution": distribution, "suspicious_burst": suspicious_burst, "total_commits": total}