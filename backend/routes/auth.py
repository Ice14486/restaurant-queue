from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from models.user import (
    create_customer, create_staff, verify_password,
    public_user, UserRole,
)
from middleware.auth import generate_token

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _db():
    return current_app.db


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    required = ("email", "password", "name")
    if missing := [k for k in required if not data.get(k)]:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    if len(data["password"]) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    try:
        user = create_customer(_db(), data["email"], data["password"], data["name"])
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 409

    token = generate_token(str(user["_id"]), UserRole.CUSTOMER)
    return jsonify({"token": token, "user": public_user(user)}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    user = _db().users.find_one({"email": data.get("email", "").lower().strip()})
    if not user or not verify_password(data.get("password", ""), user["password_hash"]):
        return jsonify({"error": "Invalid email or password"}), 401

    restaurant_id = str(user["restaurant_id"]) if user.get("restaurant_id") else None
    token = generate_token(str(user["_id"]), user["role"], restaurant_id=restaurant_id)
    return jsonify({"token": token, "user": public_user(user)}), 200


@auth_bp.post("/staff/login")
def staff_login():
    data = request.get_json(silent=True) or {}
    restaurant_id = data.get("restaurant_id")
    staff_id = data.get("staff_id")
    pin = data.get("pin")

    if not all([restaurant_id, staff_id, pin]):
        return jsonify({"error": "restaurant_id, staff_id, and pin are required"}), 400

    try:
        rid = ObjectId(restaurant_id)
    except Exception:
        return jsonify({"error": "Invalid restaurant_id"}), 400

    user = _db().users.find_one({
        "staff_id": staff_id.strip(),
        "restaurant_id": rid,
        "role": {"$in": [UserRole.STAFF, UserRole.ADMIN]},
    })
    if not user or not verify_password(pin, user["password_hash"]):
        return jsonify({"error": "Invalid staff credentials"}), 401

    from datetime import datetime, timezone
    _db().users.update_one({"_id": user["_id"]}, {"$set": {"last_active": datetime.now(timezone.utc)}})

    token = generate_token(str(user["_id"]), user["role"], restaurant_id=str(rid))
    return jsonify({"token": token, "user": public_user(user)}), 200


@auth_bp.get("/me")
def me():
    from middleware.auth import _decode_token
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Unauthorized"}), 401
    try:
        claims = _decode_token(auth_header.split(" ", 1)[1])
    except Exception:
        return jsonify({"error": "Invalid token"}), 401

    user = _db().users.find_one({"_id": ObjectId(claims["sub"])})
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": public_user(user)}), 200
