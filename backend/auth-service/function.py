"""
Auth Service - User authentication and JWT token management.
"""

import json
import logging
import os
import hashlib
import hmac
import base64
import time
from postgres_service import get_db_connection

logger = logging.getLogger()
logger.setLevel(logging.INFO)

PG_CONFIG = (
    f"host={os.getenv('POSTGRES_HOST', 'localhost')} "
    f"port={os.getenv('POSTGRES_PORT', '5432')} "
    f"user={os.getenv('POSTGRES_USER', 'test')} "
    f"password={os.getenv('POSTGRES_PASS', 'test')} "
    f"dbname={os.getenv('POSTGRES_NAME', 'test')} "
    f"connect_timeout=15"
)

SECRET_KEY = os.getenv("JWT_SECRET", "simple-secret-key")


def handler(event=None, context=None):
    http_method = (
        event.get("httpMethod") or
        event.get("requestContext", {}).get("http", {}).get("method", "")
    )
    path = (
        event.get("path") or
        event.get("rawPath") or
        "/"
    )
    body = json.loads(event.get("body") or "{}")

    if http_method == "POST" and "login" in path:
        return login(body)
    elif http_method == "POST" and "register" in path:
        return register(body)
    else:
        return response(405, {"error": "Method not allowed"})


def register(body):
    username = body.get("username")
    password = body.get("password")
    role = body.get("role", "Viewer")

    if not username or not password:
        return response(400, {"error": "username and password are required"})

    if role not in ["Admin", "Manager", "Contributor", "Viewer"]:
        return response(400, {"error": "Invalid role"})

    password_hash = hash_password(password)

    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE username = %s;", (username,))
        if cur.fetchone():
            return response(400, {"error": "Username already exists"})

        cur.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (%s, %s, %s) RETURNING id;",
            (username, password_hash, role)
        )
        user_id = cur.fetchone()[0]
        conn.commit()

    return response(201, {"id": user_id, "username": username, "role": role})


def login(body):
    username = body.get("username")
    password = body.get("password")

    if not username or not password:
        return response(400, {"error": "username and password are required"})

    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("SELECT id, password_hash, role FROM users WHERE username = %s;", (username,))
        row = cur.fetchone()

    if not row or not verify_password(password, row[1]):
        return response(401, {"error": "Invalid username or password"})

    token = generate_token(row[0], username, row[2])
    return response(200, {"token": token, "username": username, "role": row[2]})


def hash_password(password):
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
    return base64.b64encode(salt + key).decode()


def verify_password(password, stored_hash):
    decoded = base64.b64decode(stored_hash.encode())
    salt = decoded[:16]
    stored_key = decoded[16:]
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
    return hmac.compare_digest(key, stored_key)


def generate_token(user_id, username, role):
    payload = f"{user_id}:{username}:{role}:{int(time.time()) + 86400}"
    signature = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    token_data = base64.b64encode(f"{payload}:{signature}".encode()).decode()
    return token_data


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body)
    }