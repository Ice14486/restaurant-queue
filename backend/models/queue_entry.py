from datetime import datetime, timezone
from bson import ObjectId


class QueueStatus:
    WAITING = "waiting"
    CALLED = "called"
    SEATED = "seated"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


def create_queue_entry(db, restaurant_id: str, user_id: str, party_size: int) -> dict:
    restaurant = db.restaurants.find_one({"_id": ObjectId(restaurant_id)})
    if not restaurant:
        raise ValueError("Restaurant not found")
    if not restaurant.get("is_accepting_queue"):
        raise ValueError("Restaurant is not accepting queue entries right now")

    position = db.queue_entries.count_documents({
        "restaurant_id": ObjectId(restaurant_id),
        "status": QueueStatus.WAITING,
    }) + 1

    avg_turn = restaurant.get("avg_turn_time_minutes", 30)
    doc = {
        "restaurant_id": ObjectId(restaurant_id),
        "user_id": ObjectId(user_id),
        "party_size": party_size,
        "status": QueueStatus.WAITING,
        "position": position,
        "estimated_wait_minutes": (position - 1) * avg_turn,
        "queue_number": _next_queue_number(db, restaurant_id),
        "joined_at": datetime.now(timezone.utc),
        "called_at": None,
        "seated_at": None,
        "cancelled_at": None,
    }
    result = db.queue_entries.insert_one(doc)
    doc["_id"] = result.inserted_id

    db.restaurants.update_one(
        {"_id": ObjectId(restaurant_id)},
        {"$inc": {"current_queue_length": 1}},
    )
    return doc


def serialize_entry(e: dict) -> dict:
    return {
        "id": str(e["_id"]),
        "restaurant_id": str(e["restaurant_id"]),
        "user_id": str(e["user_id"]),
        "party_size": e["party_size"],
        "status": e["status"],
        "position": e["position"],
        "estimated_wait_minutes": e.get("estimated_wait_minutes", 0),
        "queue_number": e.get("queue_number"),
        "joined_at": e["joined_at"].isoformat() if e.get("joined_at") else None,
        "called_at": e["called_at"].isoformat() if e.get("called_at") else None,
        "seated_at": e["seated_at"].isoformat() if e.get("seated_at") else None,
        "cancelled_at": e["cancelled_at"].isoformat() if e.get("cancelled_at") else None,
    }


def _next_queue_number(db, restaurant_id: str) -> int:
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    count = db.queue_entries.count_documents({
        "restaurant_id": ObjectId(restaurant_id),
        "joined_at": {"$gte": today_start},
    })
    return count + 1
