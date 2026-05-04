import requests
import config
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
def get_config() -> dict:
    """Return all global configuration values."""
    return {
        "Demo1Start": config.Demo1Start,
        "Demo1End": config.Demo1End,
        "Demo2Start": config.Demo2Start,
        "Demo2End": config.Demo2End,
        "Demo3Start": config.Demo3Start,
        "Demo3End": config.Demo3End,
        "Demo4Start": config.Demo4Start,
        "Demo4End": config.Demo4End,
        "ExpectedCommitsWeekly": config.ExpectedCommitsWeekly,
        "GITLAB_GROUP_NAME": config.GITLAB_GROUP_NAME,
        "ExpectedMergesDemo": config.ExpectedMergesDemo
    }

def set_config(updates: dict) -> dict:
    """Update one or more global configuration values. Returns the updated config."""
    allowed = {
        "Demo1Start", "Demo1End",
        "Demo2Start", "Demo2End",
        "Demo3Start", "Demo3End",
        "Demo4Start", "Demo4End",
        "ExpectedCommitsWeekly",
        "ExpectedMergesDemo",
        "GITLAB_GROUP_NAME",
    }
    unknown = set(updates.keys()) - allowed
    if unknown:
        raise ValueError(f"Unknown config keys: {unknown}")

    for key, value in updates.items():
        setattr(config, key, value)
    return get_config()


def get_project_commits(project_id: int):
    commits = []
    page = 1

    while True:
        resp = requests.get(
            f"{GITLAB_URL}/api/v4/projects/{project_id}/repository/commits",
            headers=_headers(),
            params={"per_page": 100, "page": page},
            timeout=10,
        )
        resp.raise_for_status()

        batch = resp.json()
        if not batch:
            break

        commits.extend(batch)

        # We know how many pages there will be, so iterte through them until done
        total_pages = int(resp.headers.get("X-Total-Pages", 1))
        if page >= total_pages:
            break

        page += 1
    return commits