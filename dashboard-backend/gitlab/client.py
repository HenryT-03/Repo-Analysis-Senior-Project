"""GitLab API client for interacting with GitLab."""

import os
import requests
from config import GITLAB_URL, GITLAB_TOKEN

class GitLabClient:
    def __init__(self):
        self.base_url = GITLAB_URL
        self.token = GITLAB_TOKEN
        self.headers = {
            "PRIVATE-TOKEN": self.token,
            "Content-Type": "application/json"
        } if self.token else {}

    def get_project(self, project_id):
        """Get project details from GitLab."""
        if not self.token:
            return None
        
        url = f"{self.base_url}/api/v4/projects/{project_id}"
        resp = requests.get(url, headers=self.headers, timeout=10)
        if resp.status_code == 200:
            return resp.json()
        return None

    def list_projects(self):
        """List all projects."""
        if not self.token:
            return []
        
        url = f"{self.base_url}/api/v4/projects"
        resp = requests.get(url, headers=self.headers, timeout=10)
        if resp.status_code == 200:
            return resp.json()
        return []

    def get_project_commits(self, project_id, per_page=100):
        """Get commits from a project."""
        if not self.token:
            return []
        
        url = f"{self.base_url}/api/v4/projects/{project_id}/repository/commits"
        commits = []
        page = 1
        
        while True:
            resp = requests.get(
                url,
                headers=self.headers,
                params={"page": page, "per_page": per_page},
                timeout=10
            )
            if resp.status_code != 200 or not resp.json():
                break
            commits.extend(resp.json())
            page += 1
        
        return commits

def get_project(project_id):
    """Get project from GitLab."""
    client = GitLabClient()
    return client.get_project(project_id)

def list_projects():
    """List all GitLab projects."""
    client = GitLabClient()
    return client.list_projects()

def get_commits(project_id):
    """Get commits from GitLab project."""
    client = GitLabClient()
    return client.get_project_commits(project_id)
