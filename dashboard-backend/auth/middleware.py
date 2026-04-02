from functools import wraps
from flask import request, jsonify, g
import requests
import os
from db import DbCursor

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if os.getenv("DEV_MODE") == "true":
            g.user = {
                "id": 1,
                "email": "dev@test.com",
                "name": "Dev User",
                "role": "instructor",
                "gitlab_username": None
            }
            return f(*args, **kwargs)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ", 1)[1]

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

        g.user = db_user
        return f(*args, **kwargs)

    return decorated


def require_role(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if g.user["role"] not in roles:
                return jsonify({"error": "Insufficient permissions"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator