"""
JWT verification helpers for protected Flask routes.
Verifies tokens by calling the Supabase Auth REST API directly,
which works with both old JWT keys and new sb_secret_... key formats.
"""
import os
import requests as _requests
from functools import wraps
from flask import request, jsonify
from supabase import create_client

_supabase = None


def get_supabase():
    global _supabase
    if _supabase is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        _supabase = create_client(url, key)
    return _supabase


class _User:
    def __init__(self, data: dict):
        self.id = data.get("id")
        self.email = data.get("email")
        self.raw = data


def _verify_token(token: str) -> _User:
    """Call Supabase Auth /user endpoint directly to verify the access token."""
    url = os.environ["SUPABASE_URL"].rstrip("/")
    resp = _requests.get(
        f"{url}/auth/v1/user",
        headers={
            "Authorization": f"Bearer {token}",
            "apikey": os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        },
        timeout=10,
    )
    if resp.status_code != 200:
        raise Exception(f"Auth failed: {resp.status_code} {resp.text}")
    return _User(resp.json())


def require_auth(f):
    """Decorator: verify Bearer JWT from Supabase Auth."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing authorization header"}), 401
        token = auth_header.split(" ", 1)[1]
        try:
            request.current_user = _verify_token(token)
        except Exception as e:
            print(f"[auth] Token verification failed: {e}")
            return jsonify({"error": "Invalid or expired token"}), 401
        return f(*args, **kwargs)
    return decorated


def require_role(*roles):
    """Decorator: require specific role(s) in profiles table."""
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated(*args, **kwargs):
            user = request.current_user
            sb = get_supabase()
            result = sb.table("profiles").select("role").eq("id", str(user.id)).single().execute()
            if not result.data or result.data.get("role") not in roles:
                return jsonify({"error": "Insufficient permissions"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator
