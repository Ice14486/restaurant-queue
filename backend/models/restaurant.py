from datetime import datetime, timezone
from bson import ObjectId


DEFAULT_HOURS = {
    day: {"open": "11:00", "close": "22:00", "closed": False}
    for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
}


def create_restaurant(db, name: str, description: str, cuisine: str, owner_user_id: str) -> dict:
    doc = {
        "name": name.strip(),
        "description": description.strip(),
        "cuisine": cuisine.strip(),
        "owner_id": ObjectId(owner_user_id),
        "operating_hours": DEFAULT_HOURS,
        "max_queue_capacity": 50,
        "avg_turn_time_minutes": 30,
        "is_accepting_queue": True,
        "current_queue_length": 0,
        "table_count": 10,
        "created_at": datetime.now(timezone.utc),
    }
    result = db.restaurants.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def serialize_restaurant(r: dict) -> dict:
    return {
        "id": str(r["_id"]),
        "name": r["name"],
        "description": r.get("description", ""),
        "cuisine": r.get("cuisine", ""),
        "operating_hours": r.get("operating_hours", {}),
        "max_queue_capacity": r.get("max_queue_capacity", 50),
        "avg_turn_time_minutes": r.get("avg_turn_time_minutes", 30),
        "is_accepting_queue": r.get("is_accepting_queue", True),
        "current_queue_length": r.get("current_queue_length", 0),
        "estimated_wait_minutes": r.get("current_queue_length", 0) * r.get("avg_turn_time_minutes", 30),
        "table_count": r.get("table_count", 10),
    }
