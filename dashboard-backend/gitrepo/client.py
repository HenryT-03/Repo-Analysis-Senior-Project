import requests
from config import GITLAB_URL, GITLAB_TOKEN, GITLAB_GROUP_NAME

def _headers():
    h = {"Content-Type": "application/json"}
    if GITLAB_TOKEN:
        h["PRIVATE-TOKEN"] = GITLAB_TOKEN
    return h

def get_group_projects() -> list[dict]:
    """Fetch all projects in a GitLab group (e.g. 'cs309/309Spring2017')."""
    
    resp = requests.get(
        f"{GITLAB_URL}/api/v4/groups/{GITLAB_GROUP_NAME}/projects",
        headers=_headers(),
        timeout=10,
        params={
            "per_page": 100,
            "include_subgroups": True
        }
    )

    resp.raise_for_status()
    return resp.json()        

def get_project(project_path: str) -> dict:
    """Fetch project metadata by path (e.g. 'group/repo')."""
    encoded = project_path.replace("/", "%2F")
    resp = requests.get(
        f"{GITLAB_URL}/api/v4/projects/{encoded}",
        headers=_headers(),
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def get_commits(project_id: int, per_page=100, page=1, author_email=None) -> list:
    """
    Fetch commits for a project.
    Optional filter by author_email for per-student analysis.
    """
    params = {"per_page": per_page, "page": page}
    if author_email:
        params["author"] = author_email

    resp = requests.get(
        f"{GITLAB_URL}/api/v4/projects/{project_id}/repository/commits",
        headers=_headers(),
        params=params,
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def get_commit_diff(project_id: int, commit_sha: str) -> list:
    """
    Get file diffs for a single commit.
    Returns list of diffs with 'diff', 'new_path', 'old_path', etc.
    """
    resp = requests.get(
        f"{GITLAB_URL}/api/v4/projects/{project_id}/repository/commits/{commit_sha}/diff",
        headers=_headers(),
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def get_commit_stats(project_id: int, commit_sha: str) -> dict:
    """
    Get additions/deletions stats for a single commit.
    Returns the full commit object including stats.additions and stats.deletions.
    """
    resp = requests.get(
        f"{GITLAB_URL}/api/v4/projects/{project_id}/repository/commits/{commit_sha}",
        headers=_headers(),
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def get_contributors(project_id: int) -> list:
    """
    Fetch all contributors (name, email, commit count) for a project.
    Useful for building the student list automatically.
    """
    resp = requests.get(
        f"{GITLAB_URL}/api/v4/projects/{project_id}/repository/contributors",
        headers=_headers(),
        params={"per_page": 100},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def get_branches(project_id: int) -> list:
    """List all branches — useful for tracking which branch commits were pushed to."""
    resp = requests.get(
        f"{GITLAB_URL}/api/v4/projects/{project_id}/repository/branches",
        headers=_headers(),
        params={"per_page": 100},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def get_all_commits_paginated(project_id: int, author_email=None) -> list:
    """Fetch ALL commits across all pages for a project."""
    all_commits = []
    page = 1
    while True:
        batch = get_commits(project_id, per_page=100, page=page, author_email=author_email)
        if not batch:
            break
        all_commits.extend(batch)
        page += 1
    return all_commits


#Jacob Methods
def get_project_commits(project_id: int) -> list:
    """
    Fetch commits with detailed stats (additions/deletions).
    """
    commits_resp = requests.get(
        f"{GITLAB_URL}/api/v4/projects/{project_id}/repository/commits",
        headers=_headers(),
        params={"per_page": 100},
        timeout=10,
    )
    commits_resp.raise_for_status()
    commits = commits_resp.json()

    detailed_commits = []

    for c in commits:
        sha = c["id"]

        detail_resp = requests.get(
            f"{GITLAB_URL}/api/v4/projects/{project_id}/repository/commits/{sha}",
            headers=_headers(),
            timeout=10,
        )
        detail_resp.raise_for_status()
        detail = detail_resp.json()

        detailed_commits.append({
            "id": sha,
            "repo_id": project_id,
            "author_name": c.get("author_name"),
            "author_email": c.get("author_email"),
            "message": c.get("title"),
            "branch": c.get("refs", ["main"])[0] if c.get("refs") else "main",
            "committed_at": c.get("committed_date"),
            "created_at": c.get("created_at"),

            "additions": detail.get("stats", {}).get("additions", 0),
            "deletions": detail.get("stats", {}).get("deletions", 0),

            "sha": sha
        })

    return detailed_commits

