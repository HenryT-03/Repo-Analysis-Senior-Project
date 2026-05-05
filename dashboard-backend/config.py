import os
from dotenv import load_dotenv

load_dotenv()

# Microsoft Auth
CLIENT_ID = os.getenv("MS_CLIENT_ID")
CLIENT_SECRET = os.getenv("MS_CLIENT_SECRET")
TENANT_ID = os.getenv("MS_TENANT_ID", "common")
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
REDIRECT_URI = os.getenv("REDIRECT_URI", "http://localhost:5000/auth/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# GitLab
GITLAB_URL = os.getenv("GITLAB_URL", "https://git.las.iastate.edu")
GITLAB_TOKEN = os.getenv("GITLAB_URL","glpat-XpSTIB5NDxEctH7oVZiuKG86MQp1OjFpawk.01.0z1hwyb5n")  #os.getenv("GITLAB_TOKEN")  # Personal access token for higher rate limits
GITLAB_GROUP_NAME = "cs309%2F309Spring2017"

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
    "ssl_ca": os.getenv("DB_SSL_CA"),
    "connection_timeout": 10,
    "pool_name": "aiven_pool",
}

Demo1Start = "2017-01-01"
Demo1End = "2017-02-27"
Demo2Start = "2017-02-28"
Demo2End = "2017-03-28"
Demo3Start ="2017-03-29"
Demo3End = "2017-04-18"
Demo4Start = "2017-04-19"
Demo4End = "2017-05-19"

ExpectedCommitsWeekly = 1
ExpectedMergesDemo = 1