"""
Auth Service - Simple login with plain text passwords for workshop.
"""

import json
import logging
import os
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
    else:
        return response(405, {"error": "Method not allowed"})


def login(body):
    username = body.get("username")
    password = body.get("password")

    if not username or not password:
        return response(400, {"error": "username and password are required"})

    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, username, role, password_hash FROM users WHERE username = %s;",
            (username,)
        )
        row = cur.fetchone()

    if not row or row[3] != password:
        return response(401, {"error": "Invalid username or password"})

    return response(200, {
        "token": f"{row[1]}:{row[2]}",
        "username": row[1],
        "role": row[2]
    })


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body)
    }