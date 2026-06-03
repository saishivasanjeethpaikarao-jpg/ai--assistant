"""
Database utilities for Airis backend
Handles SQLite connections and schema initialization
"""

import sqlite3
import os
import json
from typing import Dict, Any, Optional

DB_PATH = os.getenv("DB_PATH", "/opt/render/project/data/airis.db")

def get_db_connection():
    """Get SQLite database connection"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database schema"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Settings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Preferences table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS preferences (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Chat history table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Reminders table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            text TEXT NOT NULL,
            when_due TIMESTAMP,
            completed BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Brain memory table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS brain_memory (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Trading portfolio table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS portfolio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            symbol TEXT NOT NULL,
            quantity REAL,
            buy_price REAL,
            buy_date TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()

def get_setting(key: str) -> Optional[Any]:
    """Get a setting value"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    if row:
        try:
            return json.loads(row[0])
        except:
            return row[0]
    return None

def set_setting(key: str, value: Any) -> None:
    """Set a setting value"""
    conn = get_db_connection()
    cursor = conn.cursor()
    json_value = json.dumps(value) if not isinstance(value, str) else value
    cursor.execute(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
        (key, json_value)
    )
    conn.commit()
    conn.close()

def get_all_settings() -> Dict[str, Any]:
    """Get all settings"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM settings")
    rows = cursor.fetchall()
    conn.close()
    
    result = {}
    for key, value in rows:
        try:
            result[key] = json.loads(value)
        except:
            result[key] = value
    return result

def get_preference(key: str) -> Optional[Any]:
    """Get a preference value"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM preferences WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    if row:
        try:
            return json.loads(row[0])
        except:
            return row[0]
    return None

def set_preference(key: str, value: Any) -> None:
    """Set a preference value"""
    conn = get_db_connection()
    cursor = conn.cursor()
    json_value = json.dumps(value) if not isinstance(value, str) else value
    cursor.execute(
        "INSERT OR REPLACE INTO preferences (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
        (key, json_value)
    )
    conn.commit()
    conn.close()

def get_all_preferences() -> Dict[str, Any]:
    """Get all preferences"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM preferences")
    rows = cursor.fetchall()
    conn.close()
    
    result = {}
    for key, value in rows:
        try:
            result[key] = json.loads(value)
        except:
            result[key] = value
    return result

# Initialize database on import
init_db()
