from datetime import datetime, timezone
from bson import ObjectId


class TableStatus:
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    CLEANING = "cleaning"


def seed_tables(db, restaurant_id: str, count: int = 10) -> list:
    docs = [
        {
            "restaurant_id": ObjectId(restaurant_id),
            "table_number": i + 1,
            "capacity": 4,
            "status": TableStatus.AVAILABLE,
            "current_queue_entry_id": None,
            "updated_at": datetime.now(timezone.utc),
        }
        for i in range(count)
    ]
    db.tables.insert_many(docs)
    return docs


def serialize_table(t: dict) -> dict:
    return {
        "id": str(t["_id"]),
        "restaurant_id": str(t["restaurant_id"]),
        "table_number": t["table_number"],
        "capacity": t["capacity"],
        "status": t["status"],
        "current_queue_entry_id": str(t["current_queue_entry_id"]) if t.get("current_queue_entry_id") else None,
        "updated_at": t["updated_at"].isoformat() if t.get("updated_at") else None,
    }
