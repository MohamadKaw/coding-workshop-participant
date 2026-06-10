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
    elif http_method == "GET" and "users" in path:
        return get_users()
    elif http_method == "GET" and "setup" in path:
        return setup_db()
    elif http_method == "GET" and "migrate" in path:
        return migrate_db()
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


def get_users():
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("SELECT id, username, role FROM users;")
        rows = cur.fetchall()
    users = [{"id": r[0], "username": r[1], "role": r[2]} for r in rows]
    return response(200, users)


def migrate_db():
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("""
            DROP TABLE IF EXISTS project_users CASCADE;
            CREATE TABLE project_users (
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                individual_id INTEGER REFERENCES individuals(id) ON DELETE CASCADE,
                PRIMARY KEY (project_id, individual_id)
            );
        """)
        conn.commit()
    return response(200, {"message": "Migration complete!"})


def setup_db():
    conn = get_db_connection(PG_CONFIG)
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'Viewer',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS teams (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                location VARCHAR(100) NOT NULL,
                leader_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS individuals (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                role VARCHAR(100) NOT NULL,
                team_id INTEGER REFERENCES teams(id),
                location VARCHAR(100),
                is_direct BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS achievements (
                id SERIAL PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                team_id INTEGER REFERENCES teams(id),
                month INTEGER NOT NULL,
                year INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                status VARCHAR(20) DEFAULT 'Green',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS project_users (
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                individual_id INTEGER REFERENCES individuals(id) ON DELETE CASCADE,
                PRIMARY KEY (project_id, individual_id)
            );
            CREATE TABLE IF NOT EXISTS deliverables (
                id SERIAL PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                assigned_to INTEGER REFERENCES individuals(id),
                status VARCHAR(50) DEFAULT 'Not Started',
                rag_status VARCHAR(10) DEFAULT 'Green',
                depends_on INTEGER REFERENCES deliverables(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            INSERT INTO users (username, password_hash, role) VALUES
                ('admin', 'admin123', 'Admin'),
                ('manager', 'manager123', 'Manager'),
                ('viewer', 'viewer123', 'Viewer')
            ON CONFLICT (username) DO NOTHING;
        """)
        conn.commit()
    return response(200, {"message": "Database setup complete!"})


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body)
    }