from flask_socketio import join_room, leave_room, emit
import jwt
from middleware.auth import _decode_token


def register_events(socketio, db):

    @socketio.on("connect")
    def on_connect(auth):
        token = (auth or {}).get("token", "")
        try:
            claims = _decode_token(token)
            user_id = claims["sub"]
            role = claims["role"]
            join_room(f"user_{user_id}")
            if role in ("staff", "admin") and claims.get("restaurant_id"):
                join_room(f"restaurant_{claims['restaurant_id']}")
            emit("connected", {"status": "ok", "user_id": user_id})
        except (jwt.InvalidTokenError, KeyError):
            return False  # Reject unauthenticated socket connections

    @socketio.on("subscribe_restaurant")
    def on_subscribe(data):
        restaurant_id = (data or {}).get("restaurant_id")
        if restaurant_id:
            join_room(f"restaurant_{restaurant_id}")
            emit("subscribed", {"restaurant_id": restaurant_id})

    @socketio.on("unsubscribe_restaurant")
    def on_unsubscribe(data):
        restaurant_id = (data or {}).get("restaurant_id")
        if restaurant_id:
            leave_room(f"restaurant_{restaurant_id}")

    @socketio.on("disconnect")
    def on_disconnect():
        pass
