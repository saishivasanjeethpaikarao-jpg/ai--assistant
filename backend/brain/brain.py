import sqlite3
import os
import json
import asyncio
from core.event_bus import EventBus

DB_PATH = os.environ.get('RENDER_DATA_DIR', '/opt/render/project/data') + '/settings.db'
bus = EventBus()

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("CREATE TABLE IF NOT EXISTS brain_memory (key TEXT PRIMARY KEY, value TEXT)")
    conn.commit()
    return conn

async def remember_fact(key, value):
    conn = get_db()
    conn.execute("INSERT OR REPLACE INTO brain_memory (key, value) VALUES (?, ?)", (key, json.dumps(value)))
    conn.commit()
    conn.close()
    await bus.publish("memory_updated", {"key": key, "value": value})

def recall_fact(key):
    conn = get_db()
    row = conn.execute("SELECT value FROM brain_memory WHERE key = ?", (key,)).fetchone()
    conn.close()
    return json.loads(row[0]) if row else None

def forget_fact(key):
    conn = get_db()
    conn.execute("DELETE FROM brain_memory WHERE key = ?", (key,))
    conn.commit()
    conn.close()

def list_memories():
    conn = get_db()
    rows = conn.execute("SELECT key, value FROM brain_memory").fetchall()
    conn.close()
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

def learn_text(text):
    pass # Placeholder for advanced learning
