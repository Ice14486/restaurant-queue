from functools import wraps
from datetime import datetime, timezone, timedelta
from flask import request, g, jsonify
import jwt
from bson import ObjectId
from config import Config


def _decode_token(token: str) -> dict:
    return jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])


def generate_token(user_id: str, role: str, restaurant_id: str | None = None) -> str:
    expiry_hours = (
        Config.STAFF_SESSION_TIMEOUT_MINUTES / 60
        if role in ("staff", "admin")
        else Config.JWT_EXPIRY_HOURS
    )
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=expiry_hours),
        "iat": datetime.now(timezone.utc),
    }
    if restaurant_id:
        payload["restaurant_id"] = restaurant_id
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")


def require_auth(f):
    """Attach decoded JWT claims to flask.g; reject missing/expired tokens."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing authorization token"}), 401
        token = auth_header.split(" ", 1)[1]
        try:
            g.claims = _decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated


def require_role(*roles):
    """Decorator — must be placed after @require_auth."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(g, "claims") or g.claims.get("role") not in roles:
                return jsonify({"error": "Insufficient permissions"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


def require_restaurant_staff(f):
    """Ensures staff can only manage their own restaurant."""
    @wraps(f)
    def decorated(*args, **kwargs):
        restaurant_id = kwargs.get("restaurant_id") or request.json.get("restaurant_id")
        if str(g.claims.get("restaurant_id")) != str(restaurant_id):
            return jsonify({"error": "Access denied: wrong restaurant"}), 403
        return f(*args, **kwargs)
    return decorated
