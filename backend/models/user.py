from datetime import datetime, timezone
from bson import ObjectId
import bcrypt


class UserRole:
    CUSTOMER = "customer"
    STAFF = "staff"
    ADMIN = "admin"


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_customer(db, email: str, password: str, name: str) -> dict:
    if db.users.find_one({"email": email.lower()}):
        raise ValueError("Email already registered")
    doc = {
        "email": email.lower().strip(),
        "password_hash": hash_password(password),
        "name": name.strip(),
        "role": UserRole.CUSTOMER,
        "google_id": None,
        "active_queue_entry_id": None,
        "created_at": datetime.now(timezone.utc),
    }
    result = db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def create_staff(db, restaurant_id: str, staff_id: str, pin: str, name: str, role: str = UserRole.STAFF) -> dict:
    if db.users.find_one({"staff_id": staff_id, "restaurant_id": ObjectId(restaurant_id)}):
        raise ValueError("Staff ID already exists for this restaurant")
    doc = {
        "staff_id": staff_id.strip(),
        "password_hash": hash_password(pin),
        "name": name.strip(),
        "role": role,
        "restaurant_id": ObjectId(restaurant_id),
        "last_active": None,
        "created_at": datetime.now(timezone.utc),
    }
    result = db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def public_user(user: dict) -> dict:
    """Strip sensitive fields before returning to client."""
    return {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user.get("role"),
        "restaurant_id": str(user["restaurant_id"]) if user.get("restaurant_id") else None,
        "active_queue_entry_id": str(user["active_queue_entry_id"]) if user.get("active_queue_entry_id") else None,
    }
