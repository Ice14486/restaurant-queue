from bson import ObjectId


def is_valid_object_id(value: str) -> bool:
    try:
        ObjectId(value)
        return True
    except Exception:
        return False


def paginate(cursor, page: int = 1, per_page: int = 20) -> tuple:
    total = cursor.count()
    items = list(cursor.skip((page - 1) * per_page).limit(per_page))
    return items, total
