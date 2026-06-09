"""
PostgreSQL connection management for Lambda.
"""
from psycopg import connect

def get_db_connection(config):
    """
    Always creates a fresh connection - correct approach for Lambda.
    """
    return connect(config)