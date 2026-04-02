"""GitLab repository analysis functions."""

from db import DbCursor
from gitlab.client import get_project, get_commits
from datetime import datetime

def sync_repo(project_path):
    """
    Register or update a GitLab repository in the database.
    
    Args:
        project_path: GitLab project path (e.g., "group/project")
    
    Returns:
        Project details dict
    """
    # Extract project ID from path (simplified - in reality you'd query GitLab API)
    # For now, store the path as the identifier
    with DbCursor() as cursor:
        cursor.execute(
            """
            INSERT INTO repos (gitlab_id, name, path, created_at, updated_at)
            VALUES (%s, %s, %s, NOW(), NOW())
            ON DUPLICATE KEY UPDATE updated_at = NOW()
            """,
            (hash(project_path), project_path.split("/")[-1], project_path)
        )
        cursor.execute(
            "SELECT * FROM repos WHERE path = %s",
            (project_path,)
        )
        repo = cursor.fetchone()
    
    return {
        "id": repo["id"] if repo else None,
        "name": project_path.split("/")[-1],
        "path": project_path,
        "web_url": f"https://gitlab.com/{project_path}"
    }

def sync_commits(gitlab_id, repo_db_id):
    """
    Sync commits from GitLab for a repository.
    
    Args:
        gitlab_id: GitLab project ID
        repo_db_id: Database repo ID
    
    Returns:
        List of synced commits
    """
    commits = get_commits(gitlab_id)
    synced = []
    
    with DbCursor() as cursor:
        for commit in commits:
            cursor.execute(
                """
                INSERT INTO commits 
                (repo_id, sha, author_email, author_name, message, committed_at, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
                ON DUPLICATE KEY UPDATE updated_at = NOW()
                """,
                (
                    repo_db_id,
                    commit.get("id"),
                    commit.get("author_email", "unknown"),
                    commit.get("author_name", "Unknown"),
                    commit.get("message", ""),
                    commit.get("created_at"),
                )
            )
            synced.append(commit)
    
    return synced

def get_student_stats(repo_db_id, user_id):
    """
    Get commit statistics for a specific student.
    
    Args:
        repo_db_id: Database repo ID
        user_id: User ID
    
    Returns:
        Dict with student statistics
    """
    with DbCursor() as cursor:
        cursor.execute(
            """
            SELECT u.name, u.gitlab_username, u.email, COUNT(*) as total_commits
            FROM commits c
            JOIN users u ON c.author_email = u.email
            WHERE c.repo_id = %s AND u.id = %s
            GROUP BY u.id
            """,
            (repo_db_id, user_id)
        )
        stats = cursor.fetchone()
    
    return stats or {"error": "No commits found"}

def get_all_student_stats(repo_db_id):
    """
    Get commit statistics for all students in a repository.
    
    Args:
        repo_db_id: Database repo ID
    
    Returns:
        List of student statistics
    """
    with DbCursor() as cursor:
        cursor.execute(
            """
            SELECT 
                u.id,
                u.name as student,
                u.gitlab_username as username,
                COUNT(*) as totalCommits,
                COUNT(CASE WHEN c.message NOT LIKE 'Merge%' THEN 1 END) as meaningful,
                COUNT(CASE WHEN c.message LIKE 'Merge%' THEN 1 END) as merge,
                0 as trivial,
                'Good' as commitRating,
                '' as linesPlusMinus,
                'YES' as mergedToMain,
                0 as issuesCreated,
                0 as issuesUpdated,
                'YES' as branches,
                'NO' as isKotlin,
                'NO' as feBeConsist,
                '' as autoNotes,
                u.team
            FROM commits c
            JOIN users u ON c.author_email = u.email
            WHERE c.repo_id = %s
            GROUP BY u.id, u.name, u.gitlab_username
            ORDER BY u.name
            """,
            (repo_db_id,)
        )
        stats = cursor.fetchall() or []
    
    return stats
