import mysql.connector
from mysql.connector import pooling
from config import DB_CONFIG

_pool = None

def get_pool():
    """Initialize connection pool once, reuse after."""
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(**DB_CONFIG)
    return _pool

def get_db():
    """Get a connection from the pool. Use as context manager."""
    return get_pool().get_connection()

class DbCursor:
    """
    Context manager for safe cursor + connection handling.

    Usage:
        with DbCursor() as cursor:
            cursor.execute("SELECT ...")
            results = cursor.fetchall()
        # connection auto-committed and returned to pool
    """
    def __init__(self, dictionary=True, auto_commit=True):
        self.dictionary = dictionary
        self.auto_commit = auto_commit
        self.conn = None
        self.cursor = None

    def __enter__(self):
        self.conn = get_db()
        self.cursor = self.conn.cursor(dictionary=self.dictionary)
        return self.cursor

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None and self.auto_commit:
            self.conn.commit()
        else:
            self.conn.rollback()
        self.cursor.close()
        self.conn.close()  # Returns to pool, doesn't actually close
        return False  # Don't suppress exceptions