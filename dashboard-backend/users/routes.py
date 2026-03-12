from flask import Blueprint, jsonify, request, g
from auth.middleware import require_auth, require_role
from db import DbCursor

users_bp = Blueprint("users", __name__, url_prefix="/users")


@users_bp.route("/me/gitlab", methods=["PUT"])
@require_auth
def update_gitlab_username():
    """
    Student links their GitLab username to their account.
    This is how commits get matched to users.
    Body: { "gitlab_username": "johndoe" }
    """
    data = request.get_json()
    username = data.get("gitlab_username", "").strip()

    if not username:
        return jsonify({"error": "gitlab_username is required"}), 400

    with DbCursor() as cursor:
        cursor.execute(
            "UPDATE users SET gitlab_username = %s WHERE id = %s",
            (username, g.user["id"]),
        )

    return jsonify({"message": "GitLab username updated", "gitlab_username": username})


@users_bp.route("/", methods=["GET"])
@require_auth
@require_role("instructor", "ta")
def list_users():
    """List all users. Instructors and TAs only."""
    with DbCursor() as cursor:
        cursor.execute(
            "SELECT id, email, name, role, gitlab_username FROM users ORDER BY name"
        )
        users = cursor.fetchall()
    return jsonify(users)


@users_bp.route("/<int:user_id>/role", methods=["PUT"])
@require_auth
@require_role("instructor")
def update_role(user_id):
    """
    Change a user's role. Instructors only.
    Body: { "role": "ta" }
    """
    data = request.get_json()
    role = data.get("role")

    if role not in ("student", "ta", "instructor"):
        return jsonify({"error": "Invalid role"}), 400

    with DbCursor() as cursor:
        cursor.execute("UPDATE users SET role = %s WHERE id = %s", (role, user_id))

    return jsonify({"message": f"Role updated to {role}"})