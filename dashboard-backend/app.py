from flask import Flask, jsonify, request
from flask_cors import CORS
from git import Repo
import requests

app = Flask(__name__)
CORS(app)

GITLAB_URL = "https://gitlab.com"
PROJECT_PATH = "gitlab-org/gitlab"

project = requests.get(
    f"{GITLAB_URL}/api/v4/projects/{PROJECT_PATH.replace('/', '%2F')}"
).json()
print(project)

project_id = project["id"]
commits = requests.get(
    f"https://gitlab.com/api/v4/projects/{project_id}/repository/commits",
    params={"per_page": 100}
).json()

@app.route("/api/hello", methods=["GET"])
def hello():
    return jsonify(message=f"Project ID: {project_id}")

@app.route("/api/add", methods=["POST"])
def add():
    data = request.json
    return jsonify(result=data["a"] + data["b"])

if __name__ == "__main__":
    app.run(debug=True)
