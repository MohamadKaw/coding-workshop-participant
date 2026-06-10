"""
PostgreSQL connection management for Lambda.
"""
import os
from psycopg import connect

def get_db_connection(config):
    is_local = os.getenv('IS_LOCAL', 'false') == 'true'
    if not is_local:
        config = config + " sslmode=require"
    return connect(config)