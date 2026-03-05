from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import mysql.connector
import bcrypt

app = Flask(__name__)
CORS(app)

# Database connection, local database for now
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="password",
    database="repo_analysis"
)

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

# store repo info
cursor = db.cursor()
cursor.execute("""
INSERT INTO repos (id, name, description, created_at)
VALUES (%s,%s,%s,NOW())
ON DUPLICATE KEY UPDATE
name=VALUES(name)
""", (
    project["id"],
    project["name"],
    project["description"]
))
db.commit()


@app.route("/api/signup", methods=["POST"])
def create_user():
    data = request.json
    username = data["username"]
    email = data.get("email")
    password = data["password"]
    role = data["role"]

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO users (username, email, password_hash, role) VALUES (%s,%s,%s,%s)",
        (username, email, password_hash, role)
    )
    db.commit()
    user_id = cursor.lastrowid
    cursor.close()

    return jsonify({"id": user_id, "username": username, "role": role}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    username = data["username"]
    password = data["password"]

    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE username=%s", (username,))
    user = cursor.fetchone()
    cursor.close()

    if user and bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        return jsonify({"id": user["id"], "username": user["username"], "role": user["role"]})
    return jsonify({"error": "Invalid credentials"}), 401

if __name__ == "__main__":
    app.run(debug=True)
