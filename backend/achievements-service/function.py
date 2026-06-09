"""
Achievements Service - CRUD operations for team achievements.
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

    path_parts = [p for p in path.strip("/").split("/") if p]
    achievement_id = path_parts[-1] if len(path_parts) > 0 and path_parts[-1].isdigit() else None
    body = json.loads(event.get("body") or "{}")

    if http_method == "POST":
        return create_achievement(body)
    elif http_method == "GET" and achievement_id:
        return get_achievement(achievement_id)
    elif http_method == "GET":
        return get_all_achievements()
    elif http_method == "PUT" and achievement_id:
        return update_achievement(achievement_id, body)
    elif http_method == "DELETE" and achievement_id:
        return delete_achievement(achievement_id)
    else:
        return response(405, {"error": "Method not allowed"})


def create_achievement(body):
    title = body.get("title")
    description = body.get("description")
    team_id = body.get("team_id")
    month = body.get("month")
    year = body.get("year")

    if not title or not team_id or not month or not year:
        return response(400, {"error": "title, team_id, month and year are required"})

    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO achievements (title, description, team_id, month, year) VALUES (%s, %s, %s, %s, %s) RETURNING id;",
            (title, description, team_id, month, year)
        )
        achievement_id = cur.fetchone()[0]
        conn.commit()

    return response(201, {"id": achievement_id, "title": title, "description": description, "team_id": team_id, "month": month, "year": year})


def get_all_achievements():
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("SELECT id, title, description, team_id, month, year FROM achievements;")
        rows = cur.fetchall()

    achievements = [{"id": r[0], "title": r[1], "description": r[2], "team_id": r[3], "month": r[4], "year": r[5]} for r in rows]
    return response(200, achievements)


def get_achievement(achievement_id):
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("SELECT id, title, description, team_id, month, year FROM achievements WHERE id = %s;", (achievement_id,))
        row = cur.fetchone()

    if not row:
        return response(404, {"error": "Achievement not found"})

    return response(200, {"id": row[0], "title": row[1], "description": row[2], "team_id": row[3], "month": row[4], "year": row[5]})


def update_achievement(achievement_id, body):
    title = body.get("title")
    description = body.get("description")
    team_id = body.get("team_id")
    month = body.get("month")
    year = body.get("year")

    if not title or not team_id or not month or not year:
        return response(400, {"error": "title, team_id, month and year are required"})

    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE achievements SET title = %s, description = %s, team_id = %s, month = %s, year = %s WHERE id = %s;",
            (title, description, team_id, month, year, achievement_id)
        )
        conn.commit()

    return response(200, {"id": achievement_id, "title": title, "description": description, "team_id": team_id, "month": month, "year": year})


def delete_achievement(achievement_id):
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("DELETE FROM achievements WHERE id = %s;", (achievement_id,))
        conn.commit()

    return response(204, {})


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body)
    }