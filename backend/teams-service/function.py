"""
Teams Service - CRUD operations for teams.
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
    # Lambda Function URLs use requestContext.http, API Gateway uses httpMethod/path
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
    team_id = path_parts[-1] if len(path_parts) > 0 and path_parts[-1].isdigit() else None
    body = json.loads(event.get("body") or "{}")

    if http_method == "POST":
        return create_team(body)
    elif http_method == "GET" and team_id:
        return get_team(team_id)
    elif http_method == "GET":
        return get_all_teams()
    elif http_method == "PUT" and team_id:
        return update_team(team_id, body)
    elif http_method == "DELETE" and team_id:
        return delete_team(team_id)
    else:
        return response(405, {"error": "Method not allowed"})


def create_team(body):
    name = body.get("name")
    location = body.get("location")
    leader_id = body.get("leader_id")

    if not name or not location:
        return response(400, {"error": "name and location are required"})

    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO teams (name, location, leader_id) VALUES (%s, %s, %s) RETURNING id;",
            (name, location, leader_id)
        )
        team_id = cur.fetchone()[0]
        conn.commit()

    return response(201, {"id": team_id, "name": name, "location": location, "leader_id": leader_id})


def get_all_teams():
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("SELECT id, name, location, leader_id FROM teams;")
        rows = cur.fetchall()

    teams = [{"id": r[0], "name": r[1], "location": r[2], "leader_id": r[3]} for r in rows]
    return response(200, teams)


def get_team(team_id):
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("SELECT id, name, location, leader_id FROM teams WHERE id = %s;", (team_id,))
        row = cur.fetchone()

    if not row:
        return response(404, {"error": "Team not found"})

    return response(200, {"id": row[0], "name": row[1], "location": row[2], "leader_id": row[3]})


def update_team(team_id, body):
    name = body.get("name")
    location = body.get("location")
    leader_id = body.get("leader_id")

    if not name or not location:
        return response(400, {"error": "name and location are required"})

    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE teams SET name = %s, location = %s, leader_id = %s WHERE id = %s;",
            (name, location, leader_id, team_id)
        )
        conn.commit()

    return response(200, {"id": team_id, "name": name, "location": location, "leader_id": leader_id})


def delete_team(team_id):
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("DELETE FROM teams WHERE id = %s;", (team_id,))
        conn.commit()

    return response(204, {})


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body)
    }