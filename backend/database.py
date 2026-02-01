"""
SQLite database setup for NeuMe Parent Monitor.
Creates tables on startup; each insert is committed immediately (crash-safe).
"""

import sqlite3
import os

# Database file lives next to this script
DB_PATH = os.path.join(os.path.dirname(__file__), "neume.db")


def get_connection():
    """Return a new connection to the SQLite database."""
    return sqlite3.connect(DB_PATH)


def init_db():
    """
    Create tables if they do not exist.
    Called once when the Flask app starts.
    """
    conn = get_connection()
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                start_time TEXT NOT NULL,
                end_time TEXT,
                status TEXT NOT NULL DEFAULT 'running'
            );

            CREATE TABLE IF NOT EXISTS focus_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                focus_score INTEGER NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            );

            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                event_type TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            );
        """)
        conn.commit()
    finally:
        conn.close()
