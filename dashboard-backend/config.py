import os
from dotenv import load_dotenv

load_dotenv()

# Microsoft Auth
CLIENT_ID = os.getenv("MS_CLIENT_ID")
CLIENT_SECRET = os.getenv("MS_CLIENT_SECRET")
TENANT_ID = os.getenv("MS_TENANT_ID", "common")
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
REDIRECT_URI = os.getenv("REDIRECT_URI", "http://localhost:5000/auth/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# GitLab
GITLAB_URL = os.getenv("GITLAB_URL", "https://gitlab.com")
GITLAB_TOKEN = os.getenv("GITLAB_TOKEN")  # Personal access token for higher rate limits

# Flask
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-prod")

# Aiven MySQL
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT", 22580)),
    "user": os.getenv("DB_USER", "avnadmin"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME", "defaultdb"),
    "ssl_disabled": False,
    "ssl_ca": os.getenv("DB_SSL_CA"),        # Aiven CA cert path (recommended)
    "connection_timeout": 10,
    "pool_name": "main_pool",
    "pool_size": 5,
}