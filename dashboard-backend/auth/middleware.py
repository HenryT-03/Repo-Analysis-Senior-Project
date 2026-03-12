from functools import wraps
from flask import request, jsonify, g
import requests
from db import DbCursor

def require_auth(f):
    """
    Decorator that validates the Microsoft Bearer token on protected routes.
    Attaches the current user dict to flask.g.user.

    Frontend should send: Authorization: Bearer <access_token>
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ", 1)[1]

        # Validate token by calling MS Graph
        resp = requests.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5,
        )

        if resp.status_code != 200:
            return jsonify({"error": "Invalid or expired token"}), 401

        ms_user = resp.json()
        microsoft_id = ms_user.get("id")

        with DbCursor() as cursor:
            cursor.execute(
                "SELECT id, microsoft_id, email, name, role FROM users WHERE microsoft_id = %s",
                (microsoft_id,),
            )
            db_user = cursor.fetchone()

        if not db_user:
            return jsonify({"error": "User not registered"}), 403

        g.user = db_user  # Available in route as g.user
        return f(*args, **kwargs)

    return decorated


def require_role(*roles):
    """
    Decorator that restricts a route to specific roles.
    Must be used AFTER @require_auth.

    Example:
        @require_auth
        @require_role("instructor", "ta")
        def admin_route(): ...
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if g.user["role"] not in roles:
                return jsonify({"error": "Insufficient permissions"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator