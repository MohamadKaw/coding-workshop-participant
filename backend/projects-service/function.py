"""
Projects Service - CRUD operations for projects and deliverables.
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
    path_parts = [p for p in path.strip("/").split("/") if p]

    # Routes:
    # /projects                          GET, POST
    # /projects/{id}                     GET, PUT, DELETE
    # /projects/{id}/users               GET, POST
    # /projects/{id}/users/{user_id}     DELETE
    # /projects/{id}/deliverables        GET, POST
    # /deliverables/{id}                 GET, PUT, DELETE

    if len(path_parts) == 0 or path_parts[0] != 'projects' and path_parts[0] != 'deliverables':
        return response(404, {"error": "Not found"})

    # /deliverables/{id}
    if path_parts[0] == 'deliverables':
        deliverable_id = path_parts[1] if len(path_parts) > 1 else None
        if http_method == 'GET' and deliverable_id:
            return get_deliverable(deliverable_id)
        elif http_method == 'PUT' and deliverable_id:
            return update_deliverable(deliverable_id, body)
        elif http_method == 'DELETE' and deliverable_id:
            return delete_deliverable(deliverable_id)
        return response(405, {"error": "Method not allowed"})

    # /projects
    project_id = path_parts[1] if len(path_parts) > 1 else None
    sub = path_parts[2] if len(path_parts) > 2 else None
    sub_id = path_parts[3] if len(path_parts) > 3 else None

    if not project_id:
        if http_method == 'GET':
            return get_all_projects()
        elif http_method == 'POST':
            return create_project(body)

    elif sub == 'users':
        if http_method == 'GET':
            return get_project_users(project_id)
        elif http_method == 'POST':
            return add_project_user(project_id, body)
        elif http_method == 'DELETE' and sub_id:
            return remove_project_user(project_id, sub_id)

    elif sub == 'deliverables':
        if http_method == 'GET':
            return get_project_deliverables(project_id)
        elif http_method == 'POST':
            return create_deliverable(project_id, body)

    elif not sub:
        if http_method == 'GET':
            return get_project(project_id)
        elif http_method == 'PUT':
            return update_project(project_id, body)
        elif http_method == 'DELETE':
            return delete_project(project_id)

    return response(405, {"error": "Method not allowed"})


# ── Projects ──────────────────────────────────────────────

def get_all_projects():
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("""
            SELECT p.id, p.name, p.description, p.status, p.created_at,
                   COALESCE(
                       json_agg(
                           json_build_object('id', u.id, 'username', u.username)
                       ) FILTER (WHERE u.id IS NOT NULL), '[]'
                   ) as users
            FROM projects p
            LEFT JOIN project_users pu ON p.id = pu.project_id
            LEFT JOIN users u ON pu.user_id = u.id
            GROUP BY p.id
            ORDER BY p.id;
        """)
        rows = cur.fetchall()
    projects = [{"id": r[0], "name": r[1], "description": r[2], "status": r[3], "created_at": str(r[4]), "users": r[5]} for r in rows]
    return response(200, projects)


def get_project(project_id):
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("""
            SELECT p.id, p.name, p.description, p.status, p.created_at,
                   COALESCE(
                       json_agg(
                           json_build_object('id', u.id, 'username', u.username)
                       ) FILTER (WHERE u.id IS NOT NULL), '[]'
                   ) as users
            FROM projects p
            LEFT JOIN project_users pu ON p.id = pu.project_id
            LEFT JOIN users u ON pu.user_id = u.id
            WHERE p.id = %s
            GROUP BY p.id;
        """, (project_id,))
        row = cur.fetchone()
    if not row:
        return response(404, {"error": "Project not found"})
    return response(200, {"id": row[0], "name": row[1], "description": row[2], "status": row[3], "created_at": str(row[4]), "users": row[5]})


def create_project(body):
    name = body.get("name")
    description = body.get("description", "")
    status = body.get("status", "Green")
    user_ids = body.get("user_ids", [])

    if not name:
        return response(400, {"error": "name is required"})

    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO projects (name, description, status) VALUES (%s, %s, %s) RETURNING id;",
            (name, description, status)
        )
        project_id = cur.fetchone()[0]
        for user_id in user_ids:
            cur.execute(
                "INSERT INTO project_users (project_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
                (project_id, user_id)
            )
        conn.commit()
    return response(201, {"id": project_id, "name": name, "description": description, "status": status, "user_ids": user_ids})


def update_project(project_id, body):
    name = body.get("name")
    description = body.get("description", "")
    status = body.get("status", "Green")
    user_ids = body.get("user_ids", [])

    if not name:
        return response(400, {"error": "name is required"})

    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE projects SET name = %s, description = %s, status = %s WHERE id = %s;",
            (name, description, status, project_id)
        )
        cur.execute("DELETE FROM project_users WHERE project_id = %s;", (project_id,))
        for user_id in user_ids:
            cur.execute(
                "INSERT INTO project_users (project_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
                (project_id, user_id)
            )
        conn.commit()
    return response(200, {"id": project_id, "name": name, "description": description, "status": status, "user_ids": user_ids})


def delete_project(project_id):
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("DELETE FROM projects WHERE id = %s;", (project_id,))
        conn.commit()
    return response(204, {})


# ── Project Users ─────────────────────────────────────────

def get_project_users(project_id):
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("""
            SELECT u.id, u.username, u.role
            FROM users u
            JOIN project_users pu ON u.id = pu.user_id
            WHERE pu.project_id = %s;
        """, (project_id,))
        rows = cur.fetchall()
    users = [{"id": r[0], "username": r[1], "role": r[2]} for r in rows]
    return response(200, users)


def add_project_user(project_id, body):
    user_id = body.get("user_id")
    if not user_id:
        return response(400, {"error": "user_id is required"})
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO project_users (project_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
            (project_id, user_id)
        )
        conn.commit()
    return response(201, {"project_id": project_id, "user_id": user_id})


def remove_project_user(project_id, user_id):
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM project_users WHERE project_id = %s AND user_id = %s;",
            (project_id, user_id)
        )
        conn.commit()
    return response(204, {})


# ── Deliverables ──────────────────────────────────────────

def get_project_deliverables(project_id):
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("""
            SELECT d.id, d.title, d.description, d.project_id, d.assigned_to,
                   d.status, d.rag_status, d.depends_on, u.username as assigned_username
            FROM deliverables d
            LEFT JOIN users u ON d.assigned_to = u.id
            WHERE d.project_id = %s
            ORDER BY d.id;
        """, (project_id,))
        rows = cur.fetchall()
    deliverables = [{"id": r[0], "title": r[1], "description": r[2], "project_id": r[3],
                     "assigned_to": r[4], "status": r[5], "rag_status": r[6],
                     "depends_on": r[7], "assigned_username": r[8]} for r in rows]
    return response(200, deliverables)


def get_deliverable(deliverable_id):
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("""
            SELECT d.id, d.title, d.description, d.project_id, d.assigned_to,
                   d.status, d.rag_status, d.depends_on, u.username as assigned_username
            FROM deliverables d
            LEFT JOIN users u ON d.assigned_to = u.id
            WHERE d.id = %s;
        """, (deliverable_id,))
        row = cur.fetchone()
    if not row:
        return response(404, {"error": "Deliverable not found"})
    return response(200, {"id": row[0], "title": row[1], "description": row[2], "project_id": row[3],
                          "assigned_to": row[4], "status": row[5], "rag_status": row[6],
                          "depends_on": row[7], "assigned_username": row[8]})


def create_deliverable(project_id, body):
    title = body.get("title")
    description = body.get("description", "")
    assigned_to = body.get("assigned_to") or None
    status = body.get("status", "Not Started")
    rag_status = body.get("rag_status", "Green")
    depends_on = body.get("depends_on") or None

    if not title:
        return response(400, {"error": "title is required"})

    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO deliverables (title, description, project_id, assigned_to, status, rag_status, depends_on) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id;",
            (title, description, project_id, assigned_to, status, rag_status, depends_on)
        )
        deliverable_id = cur.fetchone()[0]
        conn.commit()
    return response(201, {"id": deliverable_id, "title": title, "description": description,
                          "project_id": project_id, "assigned_to": assigned_to,
                          "status": status, "rag_status": rag_status, "depends_on": depends_on})


def update_deliverable(deliverable_id, body):
    title = body.get("title")
    description = body.get("description", "")
    assigned_to = body.get("assigned_to") or None
    status = body.get("status", "Not Started")
    rag_status = body.get("rag_status", "Green")
    depends_on = body.get("depends_on") or None

    if not title:
        return response(400, {"error": "title is required"})

    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE deliverables SET title=%s, description=%s, assigned_to=%s, status=%s, rag_status=%s, depends_on=%s WHERE id=%s;",
            (title, description, assigned_to, status, rag_status, depends_on, deliverable_id)
        )
        conn.commit()
    return response(200, {"id": deliverable_id, "title": title, "description": description,
                          "assigned_to": assigned_to, "status": status,
                          "rag_status": rag_status, "depends_on": depends_on})


def delete_deliverable(deliverable_id):
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("DELETE FROM deliverables WHERE id = %s;", (deliverable_id,))
        conn.commit()
    return response(204, {})


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body)
    }