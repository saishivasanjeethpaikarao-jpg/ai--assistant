import asyncio
import json
import os
import sqlite3
from core.event_bus import EventBus

try:
    from config_paths import user_data_dir
except ImportError:
    user_data_dir = None


def _default_db_path():
    render_data_dir = os.environ.get("RENDER_DATA_DIR")
    if render_data_dir:
        return os.path.join(render_data_dir, "settings.db")
    if user_data_dir:
        return os.path.join(user_data_dir(), "settings.db")
    return os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "settings.db")


DB_PATH = os.environ.get("AIRIS_DB_PATH", _default_db_path())
_active_user = {"uid": "guest", "email": None, "phone": None}
bus = EventBus()

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("CREATE TABLE IF NOT EXISTS brain_memory (key TEXT PRIMARY KEY, value TEXT)")
    conn.commit()
    conn.row_factory = sqlite3.Row
    return conn

def _publish_memory_updated(key, value):
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        try:
            asyncio.run(bus.publish("memory_updated", {"key": key, "value": value}))
        except RuntimeError:
            pass
    else:
        loop.create_task(bus.publish("memory_updated", {"key": key, "value": value}))


def remember_fact(key, value):
    with get_db() as conn:
        conn.execute("INSERT OR REPLACE INTO brain_memory (key, value) VALUES (?, ?)", (key, json.dumps(value)))
        conn.commit()
    _publish_memory_updated(key, value)
    return f"Remembered {key}."

def recall_fact(key):
    with get_db() as conn:
        row = conn.execute("SELECT value FROM brain_memory WHERE key = ?", (key,)).fetchone()
    return json.loads(row[0]) if row else None

def forget_fact(key):
    with get_db() as conn:
        conn.execute("DELETE FROM brain_memory WHERE key = ?", (key,))
        conn.commit()

def list_memories():
    with get_db() as conn:
        rows = conn.execute("SELECT key, value FROM brain_memory").fetchall()
    return {k: json.loads(v) for k, v in rows}

def memory_context():
    memories = list_memories()
    return '\n'.join(f'{k}: {v}' for k, v in memories.items())

def store_profile_value(key, value):
    remember_fact(f"profile_{key}", value)

def recall_profile_value(key):
    return recall_fact(f"profile_{key}")

def list_profile_values():
    memories = list_memories()
    return {k.replace("profile_", ""): v for k, v in memories.items() if k.startswith("profile_")}

def profile_context():
    profiles = list_profile_values()
    return '\n'.join(f'{k}: {v}' for k, v in profiles.items())

def set_active_user(uid, email=None, phone=None):
    global _active_user
    _active_user = {"uid": uid or "guest", "email": email, "phone": phone}
    return _active_user

def get_active_user():
    return dict(_active_user)

def learn_text(text):
    pass # Placeholder for advanced learning
