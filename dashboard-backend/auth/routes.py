import os

from flask import Blueprint, redirect, request, jsonify, session
import requests
from config import CLIENT_ID, CLIENT_SECRET, AUTHORITY, REDIRECT_URI, FRONTEND_URL
from db import DbCursor

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.route("/login")
def login():
    if os.getenv("DEV_MODE") == "true":
        return redirect(f"{FRONTEND_URL}/?token=dev-token")
    
    auth_url = (
        f"{AUTHORITY}/oauth2/v2.0/authorize"
        f"?client_id={CLIENT_ID}"
        "&response_type=code"
        f"&redirect_uri={REDIRECT_URI}"
        "&scope=openid profile email"
        "&response_mode=query"
    )
    return redirect(auth_url)


@auth_bp.route("/callback")
def auth_callback():
    """
    Handle OAuth callback from Microsoft.
    Exchanges code for token, upserts user in DB,
    then redirects frontend with token in query param.
    """
    code = request.args.get("code")
    error = request.args.get("error")

    if error:
        return jsonify({"error": error, "description": request.args.get("error_description")}), 400

    if not code:
        return jsonify({"error": "No code returned from Microsoft"}), 400

    # Exchange code for tokens
    token_resp = requests.post(
        f"{AUTHORITY}/oauth2/v2.0/token",
        data={
            "client_id": CLIENT_ID,
            "scope": "openid profile email",
            "code": code,
            "redirect_uri": REDIRECT_URI,
            "grant_type": "authorization_code",
            "client_secret": CLIENT_SECRET,
        },
        timeout=10,
    )
    token_data = token_resp.json()

    if "error" in token_data:
        return jsonify({"error": token_data["error"], "description": token_data.get("error_description")}), 400

    access_token = token_data["access_token"]

    # Fetch user profile from Microsoft Graph
    ms_user = requests.get(
        "https://graph.microsoft.com/v1.0/me",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=5,
    ).json()

    microsoft_id = ms_user.get("id")
    email = ms_user.get("mail") or ms_user.get("userPrincipalName")
    name = ms_user.get("displayName")

    # Upsert user in DB
    with DbCursor() as cursor:
        cursor.execute("SELECT id, role FROM users WHERE microsoft_id = %s", (microsoft_id,))
        existing = cursor.fetchone()

        if not existing:
            cursor.execute(
                "INSERT INTO users (microsoft_id, email, name, role) VALUES (%s, %s, %s, 'student')",
                (microsoft_id, email, name),
            )
            user_id = cursor.lastrowid
            role = "student"
        else:
            user_id = existing["id"]
            role = existing["role"]
            # Keep email/name in sync with Microsoft
            cursor.execute(
                "UPDATE users SET email = %s, name = %s WHERE id = %s",
                (email, name, user_id),
            )

    # Send token to frontend so it can store it and use for API calls
    # In production, consider httpOnly cookie instead of query param
    return redirect(f"{FRONTEND_URL}/auth/success?token={access_token}&role={role}")


@auth_bp.route("/me")
def me():
    if os.getenv("DEV_MODE") == "true":
        return jsonify({
            "id": 1,
            "email": "dev@test.com",
            "name": "Dev User",
            "role": "instructor",
            "gitlab_username": None
        })
    
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Not authenticated"}), 401

    token = auth_header.split(" ", 1)[1]
    ms_user = requests.get(
        "https://graph.microsoft.com/v1.0/me",
        headers={"Authorization": f"Bearer {token}"},
        timeout=5,
    ).json()

    microsoft_id = ms_user.get("id")

    with DbCursor() as cursor:
        cursor.execute(
            "SELECT id, email, name, role, gitlab_username FROM users WHERE microsoft_id = %s",
            (microsoft_id,),
        )
        user = cursor.fetchone()

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(user)