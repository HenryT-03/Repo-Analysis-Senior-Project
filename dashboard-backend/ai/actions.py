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


def get_contributor_commits(
    repo_id: int,
    author_email: str,
    limit: int = 20,
    start_date: str = None,
    end_date: str = None,
) -> list:
    """
    Fetch recent commits for a contributor.
    Returns sha, message, additions, deletions, branch, is_merge, committed_at.
    Optional start_date/end_date filters allow demo-window analysis.
    """
    query = """
        SELECT sha, message, additions, deletions, branch,
               is_merge, committed_at
        FROM commits
        WHERE repo_id = %s
          AND author_email = %s
    """
    params = [repo_id, author_email]

    if start_date:
        query += " AND committed_at >= %s"
        params.append(start_date)

    if end_date:
        query += " AND committed_at <= %s"
        params.append(end_date)

    query += " ORDER BY committed_at DESC LIMIT %s"
    params.append(limit)

    with DbCursor() as cursor:
        cursor.execute(query, params)
        rows = cursor.fetchall()

    return [dict(r) for r in rows]


def get_repo_contributor_summary(
    repo_id: int,
    start_date: str = None,
    end_date: str = None,
) -> list:
    """
    Aggregate commit stats per contributor for a repo:
    commit_count, total_additions, total_deletions, merge_count, distinct branches.

    Optional start_date/end_date filters allow per-demo analysis windows.
    """
    query = """
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
          AND author_email IS NOT NULL
          AND author_email != ''
    """
    params = [repo_id]

    if start_date:
        query += " AND committed_at >= %s"
        params.append(start_date)

    if end_date:
        query += " AND committed_at <= %s"
        params.append(end_date)

    query += """
        GROUP BY author_email, author_name
        ORDER BY commit_count DESC
    """

    with DbCursor() as cursor:
        cursor.execute(query, params)
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


def get_commit_message_batch(
    repo_id: int,
    author_email: str,
    limit: int = 30,
    start_date: str = None,
    end_date: str = None,
) -> list:
    """
    Return commit messages + basic metadata for a contributor.
    Useful for LLM text-based analysis of commit quality/style.

    Optional start_date/end_date filters allow demo-window analysis.
    """
    query = """
        SELECT sha, message, additions, deletions, is_merge, committed_at
        FROM commits
        WHERE repo_id = %s
          AND author_email = %s
    """
    params = [repo_id, author_email]

    if start_date:
        query += " AND committed_at >= %s"
        params.append(start_date)

    if end_date:
        query += " AND committed_at <= %s"
        params.append(end_date)

    query += " ORDER BY committed_at DESC LIMIT %s"
    params.append(limit)

    with DbCursor() as cursor:
        cursor.execute(query, params)
        rows = cursor.fetchall()

    return [dict(r) for r in rows]


def get_repo_issues(
    repo_id: int,
    start_date: str = None,
    end_date: str = None,
) -> list:
    """
    Fetch issues for a repo to cross-reference with commit activity.

    Optional start_date/end_date filters by issue creation date.
    """
    query = """
        SELECT author_email, title, state, created_at, updated_at, closed_at
        FROM issues
        WHERE repo_id = %s
    """
    params = [repo_id]

    if start_date:
        query += " AND created_at >= %s"
        params.append(start_date)

    if end_date:
        query += " AND created_at <= %s"
        params.append(end_date)

    query += " ORDER BY created_at DESC"

    with DbCursor() as cursor:
        cursor.execute(query, params)
        rows = cursor.fetchall()

    return [dict(r) for r in rows]


def get_commit_time_distribution(
    repo_id: int,
    author_email: str,
    start_date: str = None,
    end_date: str = None,
) -> dict:
    """
    Analyse the time-of-day / day-of-week pattern of commits.

    Unusual patterns, such as most commits landing in one narrow bucket,
    can be a signal worth flagging.

    Optional start_date/end_date filters allow demo-window analysis.
    """
    query = """
        SELECT
            HOUR(committed_at)          AS hour_of_day,
            DAYOFWEEK(committed_at)     AS day_of_week,
            COUNT(*)                    AS commit_count,
            MIN(committed_at)           AS earliest,
            MAX(committed_at)           AS latest
        FROM commits
        WHERE repo_id = %s
          AND author_email = %s
    """
    params = [repo_id, author_email]

    if start_date:
        query += " AND committed_at >= %s"
        params.append(start_date)

    if end_date:
        query += " AND committed_at <= %s"
        params.append(end_date)

    query += """
        GROUP BY hour_of_day, day_of_week
        ORDER BY day_of_week, hour_of_day
    """

    with DbCursor() as cursor:
        cursor.execute(query, params)
        rows = cursor.fetchall()

    distribution = [dict(r) for r in rows]

    total = sum(r["commit_count"] for r in distribution)
    suspicious_burst = False

    # Flag if >80% of commits fall within one hour/day bucket.
    if total > 3:
        for r in distribution:
            if r["commit_count"] / total > 0.8:
                suspicious_burst = True
                break

    return {
        "distribution": distribution,
        "suspicious_burst": suspicious_burst,
        "total_commits": total,
    }