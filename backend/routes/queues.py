from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, current_app, g
from bson import ObjectId
from models.queue_entry import (
    create_queue_entry, serialize_entry, QueueStatus,
)
from middleware.auth import require_auth, require_role
from models.user import UserRole

queues_bp = Blueprint("queues", __name__, url_prefix="/api/queues")


def _db():
    return current_app.db


def _emit(app, restaurant_id: str):
    """Broadcast updated queue snapshot to all subscribers of this restaurant."""
    with app.app_context():
        entries = list(_db().queue_entries.find({
            "restaurant_id": ObjectId(restaurant_id),
            "status": QueueStatus.WAITING,
        }).sort("position", 1))
        app.socketio.emit(
            "queue_update",
            {"restaurant_id": restaurant_id, "queue": [serialize_entry(e) for e in entries]},
            room=f"restaurant_{restaurant_id}",
        )


@queues_bp.post("/join")
@require_auth
@require_role(UserRole.CUSTOMER)
def join_queue():
    data = request.get_json(silent=True) or {}
    restaurant_id = data.get("restaurant_id")
    party_size = int(data.get("party_size", 1))

    if not restaurant_id:
        return jsonify({"error": "restaurant_id is required"}), 400
    if not 1 <= party_size <= 20:
        return jsonify({"error": "party_size must be between 1 and 20"}), 400

    # Single-queue rule: reject if already in a queue
    user = _db().users.find_one({"_id": ObjectId(g.claims["sub"])})
    if user and user.get("active_queue_entry_id"):
        active = _db().queue_entries.find_one({"_id": user["active_queue_entry_id"]})
        if active and active["status"] == QueueStatus.WAITING:
            return jsonify({"error": "You are already in a queue. Leave it before joining another."}), 409

    try:
        entry = create_queue_entry(_db(), restaurant_id, g.claims["sub"], party_size)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    _db().users.update_one(
        {"_id": ObjectId(g.claims["sub"])},
        {"$set": {"active_queue_entry_id": entry["_id"]}},
    )

    _emit(current_app._get_current_object(), restaurant_id)
    return jsonify({"entry": serialize_entry(entry)}), 201


@queues_bp.get("/my-status")
@require_auth
@require_role(UserRole.CUSTOMER)
def my_status():
    user = _db().users.find_one({"_id": ObjectId(g.claims["sub"])})
    if not user or not user.get("active_queue_entry_id"):
        return jsonify({"entry": None}), 200
    entry = _db().queue_entries.find_one({"_id": user["active_queue_entry_id"]})
    if not entry:
        return jsonify({"entry": None}), 200
    return jsonify({"entry": serialize_entry(entry)}), 200


@queues_bp.post("/<entry_id>/cancel")
@require_auth
def cancel(entry_id: str):
    try:
        oid = ObjectId(entry_id)
    except Exception:
        return jsonify({"error": "Invalid entry_id"}), 400

    entry = _db().queue_entries.find_one({"_id": oid})
    if not entry:
        return jsonify({"error": "Queue entry not found"}), 404

    role = g.claims.get("role")
    if role == UserRole.CUSTOMER and str(entry["user_id"]) != g.claims["sub"]:
        return jsonify({"error": "Not your queue entry"}), 403
    if role in (UserRole.STAFF, UserRole.ADMIN):
        if str(entry["restaurant_id"]) != g.claims.get("restaurant_id"):
            return jsonify({"error": "Access denied"}), 403

    if entry["status"] not in (QueueStatus.WAITING, QueueStatus.CALLED):
        return jsonify({"error": "Entry cannot be cancelled in its current state"}), 409

    _db().queue_entries.update_one(
        {"_id": oid},
        {"$set": {"status": QueueStatus.CANCELLED, "cancelled_at": datetime.now(timezone.utc)}},
    )
    _db().restaurants.update_one(
        {"_id": entry["restaurant_id"]},
        {"$inc": {"current_queue_length": -1}},
    )
    _db().users.update_one(
        {"_id": entry["user_id"]},
        {"$set": {"active_queue_entry_id": None}},
    )
    _resequence(_db(), str(entry["restaurant_id"]))
    _emit(current_app._get_current_object(), str(entry["restaurant_id"]))
    return jsonify({"message": "Cancelled"}), 200


@queues_bp.get("/restaurant/<restaurant_id>")
@require_auth
@require_role(UserRole.STAFF, UserRole.ADMIN)
def restaurant_queue(restaurant_id: str):
    entries = list(_db().queue_entries.find({
        "restaurant_id": ObjectId(restaurant_id),
        "status": {"$in": [QueueStatus.WAITING, QueueStatus.CALLED]},
    }).sort("position", 1))
    return jsonify({"queue": [serialize_entry(e) for e in entries]}), 200


@queues_bp.get("/history")
@require_auth
@require_role(UserRole.CUSTOMER)
def history():
    entries = list(_db().queue_entries.find(
        {"user_id": ObjectId(g.claims["sub"])},
        sort=[("joined_at", -1)],
        limit=30,
    ))
    result = []
    for e in entries:
        serialized = serialize_entry(e)
        restaurant = _db().restaurants.find_one({"_id": e["restaurant_id"]}, {"name": 1})
        serialized["restaurant_name"] = restaurant["name"] if restaurant else "Unknown"
        result.append(serialized)
    return jsonify({"history": result}), 200


def _resequence(db, restaurant_id: str):
    """Recalculate position numbers after a cancellation."""
    waiting = list(db.queue_entries.find(
        {"restaurant_id": ObjectId(restaurant_id), "status": QueueStatus.WAITING},
        sort=[("joined_at", 1)],
    ))
    restaurant = db.restaurants.find_one({"_id": ObjectId(restaurant_id)})
    avg_turn = restaurant.get("avg_turn_time_minutes", 30) if restaurant else 30
    for idx, entry in enumerate(waiting):
        db.queue_entries.update_one(
            {"_id": entry["_id"]},
            {"$set": {"position": idx + 1, "estimated_wait_minutes": idx * avg_turn}},
        )
