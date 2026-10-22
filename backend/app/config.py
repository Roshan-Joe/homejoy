import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "")
DATABASE_NAME = os.getenv("DATABASE_NAME", "homejoy")

# SECRET_KEY must be provided via environment variable; refuse startup on missing or insecure key
SECRET_KEY = os.getenv("SECRET_KEY")
INSECURE_KEYS = {
    "homejoy_secret_key_default_12345",
    "homejoy_super_secret_key_change_this",
    "replace_with_a_secure_random_secret_key_in_production_min_32_chars"
}
if not SECRET_KEY or not SECRET_KEY.strip() or SECRET_KEY.strip() in INSECURE_KEYS:
    raise RuntimeError(
        "CRITICAL SECURITY CONFIGURATION ERROR: SECRET_KEY environment variable is missing, "
        "empty, or set to an insecure default. The server refuses to start without a valid SECRET_KEY."
    )

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173,http://127.0.0.1:5173")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID") or os.getenv("VITE_GOOGLE_CLIENT_ID", "1066758342444-bc5l8981qaa641h0dlkuqonr9rgtvicc.apps.googleusercontent.com")
ADMIN_SETUP_SECRET = os.getenv("ADMIN_SETUP_SECRET", "")

# SMTP Email Configuration (built-in smtplib, zero cost)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "noreply@homejoy.care"))
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")
EMAIL_MODE = os.getenv("EMAIL_MODE", "console").lower()  # "smtp" | "console"
AUTO_SEND_DAILY_REPORTS = os.getenv("AUTO_SEND_DAILY_REPORTS", "false").lower() in ("true", "1", "yes")
AUTO_SEND_TIME = os.getenv("AUTO_SEND_TIME", "20:00")  # IST time format HH:MM
