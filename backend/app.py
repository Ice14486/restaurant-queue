from flask import Flask, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pymongo import MongoClient
from config import Config

socketio = SocketIO()


def create_app() -> Flask:
    app = Flask(__name__)

    # ── Database ─────────────────────────────────────────────
    client = MongoClient(Config.MONGO_URI)
    app.db = client.get_default_database()
    _ensure_indexes(app.db)

    # ── Extensions ───────────────────────────────────────────
    CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)
    Limiter(
        get_remote_address,
        app=app,
        default_limits=["200 per minute"],
        storage_uri="memory://",
    )

    socketio.init_app(
        app,
        cors_allowed_origins=Config.CORS_ORIGINS,
        async_mode="threading",
        logger=Config.DEBUG,
        engineio_logger=Config.DEBUG,
    )
    app.socketio = socketio

    # ── Blueprints ───────────────────────────────────────────
    from routes.auth import auth_bp
    from routes.restaurants import restaurants_bp
    from routes.queues import queues_bp
    from routes.staff import staff_bp

    for bp in (auth_bp, restaurants_bp, queues_bp, staff_bp):
        app.register_blueprint(bp)

    # ── Socket events ────────────────────────────────────────
    from sockets.queue_events import register_events
    register_events(socketio, app.db)

    # ── Health check ─────────────────────────────────────────
    @app.get("/health")
    def health():
        return jsonify({"status": "ok"}), 200

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app


def _ensure_indexes(db):
    db.users.create_index("email", sparse=True)
    db.users.create_index([("staff_id", 1), ("restaurant_id", 1)], sparse=True)
    db.queue_entries.create_index([("restaurant_id", 1), ("status", 1), ("position", 1)])
    db.queue_entries.create_index([("user_id", 1), ("joined_at", -1)])
    db.restaurants.create_index("name")
    db.tables.create_index([("restaurant_id", 1), ("table_number", 1)])


if __name__ == "__main__":
    app = create_app()
    socketio.run(app, host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)
