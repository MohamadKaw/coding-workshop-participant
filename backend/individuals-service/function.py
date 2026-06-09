"""
Individuals Service - CRUD operations for individuals.
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
    individual_id = path_parts[-1] if len(path_parts) > 0 and path_parts[-1].isdigit() else None
    body = json.loads(event.get("body") or "{}")

    if http_method == "POST":
        return create_individual(body)
    elif http_method == "GET" and individual_id:
        return get_individual(individual_id)
    elif http_method == "GET":
        return get_all_individuals()
    elif http_method == "PUT" and individual_id:
        return update_individual(individual_id, body)
    elif http_method == "DELETE" and individual_id:
        return delete_individual(individual_id)
    else:
        return response(405, {"error": "Method not allowed"})


def create_individual(body):
    name = body.get("name")
    role = body.get("role")
    team_id = body.get("team_id")
    location = body.get("location")
    is_direct = body.get("is_direct", True)

    if not name or not role:
        return response(400, {"error": "name and role are required"})

    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO individuals (name, role, team_id, location, is_direct) VALUES (%s, %s, %s, %s, %s) RETURNING id;",
            (name, role, team_id, location, is_direct)
        )
        individual_id = cur.fetchone()[0]
        conn.commit()

    return response(201, {"id": individual_id, "name": name, "role": role, "team_id": team_id, "location": location, "is_direct": is_direct})


def get_all_individuals():
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("SELECT id, name, role, team_id, location, is_direct FROM individuals;")
        rows = cur.fetchall()

    individuals = [{"id": r[0], "name": r[1], "role": r[2], "team_id": r[3], "location": r[4], "is_direct": r[5]} for r in rows]
    return response(200, individuals)


def get_individual(individual_id):
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("SELECT id, name, role, team_id, location, is_direct FROM individuals WHERE id = %s;", (individual_id,))
        row = cur.fetchone()

    if not row:
        return response(404, {"error": "Individual not found"})

    return response(200, {"id": row[0], "name": row[1], "role": row[2], "team_id": row[3], "location": row[4], "is_direct": row[5]})


def update_individual(individual_id, body):
    name = body.get("name")
    role = body.get("role")
    team_id = body.get("team_id")
    location = body.get("location")
    is_direct = body.get("is_direct", True)

    if not name or not role:
        return response(400, {"error": "name and role are required"})

    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE individuals SET name = %s, role = %s, team_id = %s, location = %s, is_direct = %s WHERE id = %s;",
            (name, role, team_id, location, is_direct, individual_id)
        )
        conn.commit()

    return response(200, {"id": individual_id, "name": name, "role": role, "team_id": team_id, "location": location, "is_direct": is_direct})


def delete_individual(individual_id):
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("DELETE FROM individuals WHERE id = %s;", (individual_id,))
        conn.commit()

    return response(204, {})


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body)
    }