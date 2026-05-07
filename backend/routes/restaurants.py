from flask import Blueprint, request, jsonify, current_app, g
from bson import ObjectId
from models.restaurant import create_restaurant, serialize_restaurant
from models.table import seed_tables, serialize_table
from middleware.auth import require_auth, require_role
from models.user import UserRole

restaurants_bp = Blueprint("restaurants", __name__, url_prefix="/api/restaurants")


def _db():
    return current_app.db


@restaurants_bp.get("/")
def list_restaurants():
    query = {}
    if search := request.args.get("q"):
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"cuisine": {"$regex": search, "$options": "i"}},
        ]
    cursor = _db().restaurants.find(query).sort("name", 1).limit(50)
    return jsonify({"restaurants": [serialize_restaurant(r) for r in cursor]}), 200


@restaurants_bp.get("/<restaurant_id>")
def get_restaurant(restaurant_id: str):
    try:
        r = _db().restaurants.find_one({"_id": ObjectId(restaurant_id)})
    except Exception:
        return jsonify({"error": "Invalid restaurant_id"}), 400
    if not r:
        return jsonify({"error": "Restaurant not found"}), 404
    return jsonify({"restaurant": serialize_restaurant(r)}), 200


@restaurants_bp.post("/")
@require_auth
@require_role(UserRole.ADMIN)
def create():
    data = request.get_json(silent=True) or {}
    required = ("name", "description", "cuisine")
    if missing := [k for k in required if not data.get(k)]:
        return jsonify({"error": f"Missing fields: {missing}"}), 400
    r = create_restaurant(_db(), data["name"], data["description"], data["cuisine"], g.claims["sub"])
    seed_tables(_db(), str(r["_id"]), data.get("table_count", 10))
    return jsonify({"restaurant": serialize_restaurant(r)}), 201


@restaurants_bp.get("/<restaurant_id>/tables")
@require_auth
@require_role(UserRole.STAFF, UserRole.ADMIN)
def list_tables(restaurant_id: str):
    tables = list(_db().tables.find({"restaurant_id": ObjectId(restaurant_id)}))
    return jsonify({"tables": [serialize_table(t) for t in tables]}), 200
