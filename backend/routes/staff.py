from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, current_app, g
from bson import ObjectId
from models.queue_entry import QueueStatus, serialize_entry
from models.table import serialize_table, TableStatus
from middleware.auth import require_auth, require_role
from models.user import UserRole, create_staff, public_user

staff_bp = Blueprint("staff", __name__, url_prefix="/api/staff")


def _db():
    return current_app.db


def _emit_queue(app, restaurant_id: str):
    from routes.queues import _emit
    _emit(app, restaurant_id)


@staff_bp.post("/call-next")
@require_auth
@require_role(UserRole.STAFF, UserRole.ADMIN)
def call_next():
    restaurant_id = g.claims.get("restaurant_id")
    next_entry = _db().queue_entries.find_one(
        {"restaurant_id": ObjectId(restaurant_id), "status": QueueStatus.WAITING},
        sort=[("position", 1)],
    )
    if not next_entry:
        return jsonify({"message": "Queue is empty"}), 200

    _db().queue_entries.update_one(
        {"_id": next_entry["_id"]},
        {"$set": {"status": QueueStatus.CALLED, "called_at": datetime.now(timezone.utc)}},
    )
    current_app.socketio.emit(
        "your_turn",
        {"entry_id": str(next_entry["_id"]), "message": "Your table is ready!"},
        room=f"user_{str(next_entry['user_id'])}",
    )
    _emit_queue(current_app._get_current_object(), restaurant_id)
    return jsonify({"entry": serialize_entry({**next_entry, "status": QueueStatus.CALLED})}), 200


@staff_bp.post("/seat/<entry_id>")
@require_auth
@require_role(UserRole.STAFF, UserRole.ADMIN)
def seat_party(entry_id: str):
    data = request.get_json(silent=True) or {}
    table_id = data.get("table_id")
    restaurant_id = g.claims.get("restaurant_id")

    try:
        entry = _db().queue_entries.find_one({"_id": ObjectId(entry_id)})
    except Exception:
        return jsonify({"error": "Invalid entry_id"}), 400

    if not entry or entry["status"] != QueueStatus.CALLED:
        return jsonify({"error": "Entry must be in CALLED state to be seated"}), 409
    if str(entry["restaurant_id"]) != restaurant_id:
        return jsonify({"error": "Access denied"}), 403

    _db().queue_entries.update_one(
        {"_id": entry["_id"]},
        {"$set": {"status": QueueStatus.SEATED, "seated_at": datetime.now(timezone.utc)}},
    )
    _db().restaurants.update_one(
        {"_id": entry["restaurant_id"]},
        {"$inc": {"current_queue_length": -1}},
    )
    _db().users.update_one(
        {"_id": entry["user_id"]},
        {"$set": {"active_queue_entry_id": None}},
    )

    if table_id:
        try:
            _db().tables.update_one(
                {"_id": ObjectId(table_id), "restaurant_id": ObjectId(restaurant_id)},
                {"$set": {
                    "status": TableStatus.OCCUPIED,
                    "current_queue_entry_id": entry["_id"],
                    "updated_at": datetime.now(timezone.utc),
                }},
            )
        except Exception:
            pass

    from routes.queues import _resequence
    _resequence(_db(), restaurant_id)
    _emit_queue(current_app._get_current_object(), restaurant_id)
    return jsonify({"message": "Party seated"}), 200


@staff_bp.post("/tables/<table_id>/status")
@require_auth
@require_role(UserRole.STAFF, UserRole.ADMIN)
def update_table_status(table_id: str):
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    valid = (TableStatus.AVAILABLE, TableStatus.OCCUPIED, TableStatus.CLEANING, TableStatus.RESERVED)
    if new_status not in valid:
        return jsonify({"error": f"status must be one of {valid}"}), 400

    restaurant_id = g.claims.get("restaurant_id")
    result = _db().tables.update_one(
        {"_id": ObjectId(table_id), "restaurant_id": ObjectId(restaurant_id)},
        {"$set": {
            "status": new_status,
            "current_queue_entry_id": None,
            "updated_at": datetime.now(timezone.utc),
        }},
    )
    if result.matched_count == 0:
        return jsonify({"error": "Table not found"}), 404

    table = _db().tables.find_one({"_id": ObjectId(table_id)})
    current_app.socketio.emit(
        "table_update",
        serialize_table(table),
        room=f"restaurant_{restaurant_id}",
    )
    return jsonify({"table": serialize_table(table)}), 200


@staff_bp.patch("/settings")
@require_auth
@require_role(UserRole.ADMIN)
def update_settings():
    data = request.get_json(silent=True) or {}
    restaurant_id = g.claims.get("restaurant_id")
    allowed_keys = {"operating_hours", "max_queue_capacity", "avg_turn_time_minutes",
                    "is_accepting_queue", "table_count"}
    update = {k: v for k, v in data.items() if k in allowed_keys}
    if not update:
        return jsonify({"error": "No valid fields to update"}), 400

    _db().restaurants.update_one({"_id": ObjectId(restaurant_id)}, {"$set": update})
    restaurant = _db().restaurants.find_one({"_id": ObjectId(restaurant_id)})
    from models.restaurant import serialize_restaurant
    return jsonify({"restaurant": serialize_restaurant(restaurant)}), 200


@staff_bp.post("/create-staff")
@require_auth
@require_role(UserRole.ADMIN)
def add_staff():
    data = request.get_json(silent=True) or {}
    restaurant_id = g.claims.get("restaurant_id")
    required = ("staff_id", "pin", "name")
    if missing := [k for k in required if not data.get(k)]:
        return jsonify({"error": f"Missing fields: {missing}"}), 400
    try:
        user = create_staff(_db(), restaurant_id, data["staff_id"], data["pin"], data["name"])
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 409
    return jsonify({"user": public_user(user)}), 201
