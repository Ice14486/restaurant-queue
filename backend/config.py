import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/restaurant_queue")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev_secret_replace_in_prod")
    JWT_EXPIRY_HOURS: int = int(os.getenv("JWT_EXPIRY_HOURS", "24"))
    STAFF_SESSION_TIMEOUT_MINUTES: int = int(os.getenv("STAFF_SESSION_TIMEOUT_MINUTES", "60"))
    _cors_origins = os.getenv("CORS_ORIGINS", "*").strip()
    CORS_ORIGINS: list[str] | str = "*" if _cors_origins == "*" else _cors_origins.split(",")
    PORT: int = int(os.getenv("PORT", "6001"))
    DEBUG: bool = os.getenv("FLASK_ENV", "production") == "development"
