import json, os, sqlite3

# BUG FIX #10: Use SQLite for persistent memory storage
DATA_DIR = os.environ.get('RENDER_DATA_DIR', '/opt/render/project/data')
os.makedirs(DATA_DIR, exist_ok=True)
MEMORY_DB = os.path.join(DATA_DIR, 'brain_memory.db')
MEMORY_FILE = os.path.join(DATA_DIR, 'memory.json')  # Legacy fallback
_memories = {}
_profile = {}
_active_user = 'default'

def _get_db():
    """Get SQLite connection for brain memory."""
    conn = sqlite3.connect(MEMORY_DB)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS memories (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS profile (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    return conn

def _save():
    """Save to both SQLite and JSON for redundancy."""
    try:
        conn = _get_db()
        # Save memories
        for key, value in _memories.items():
            conn.execute(
                "INSERT OR REPLACE INTO memories (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
                (key, json.dumps(value) if not isinstance(value, str) else value)
            )
        # Save profile
        for key, value in _profile.items():
            conn.execute(
                "INSERT OR REPLACE INTO profile (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
                (key, json.dumps(value) if not isinstance(value, str) else value)
            )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[Brain] SQLite save error: {e}")
    
    # Fallback: also save to JSON
    try:
        with open(MEMORY_FILE, 'w') as f:
            json.dump({'memories': _memories, 'profile': _profile}, f)
    except Exception as e:
        print(f"[Brain] JSON save error: {e}")

def _load():
    """Load from SQLite first, fallback to JSON."""
    global _memories, _profile
    
    # Try SQLite first
    try:
        conn = _get_db()
        
        # Load memories
        rows = conn.execute("SELECT key, value FROM memories").fetchall()
        for key, value in rows:
            try:
                _memories[key] = json.loads(value)
            except:
                _memories[key] = value
        
        # Load profile
        rows = conn.execute("SELECT key, value FROM profile").fetchall()
        for key, value in rows:
            try:
                _profile[key] = json.loads(value)
            except:
                _profile[key] = value
        
        conn.close()
        if _memories or _profile:
            return  # Successfully loaded from SQLite
    except Exception as e:
        print(f"[Brain] SQLite load error: {e}")
    
    # Fallback to JSON
    if os.path.exists(MEMORY_FILE):
        try:
            with open(MEMORY_FILE) as f:
                data = json.load(f)
                _memories = data.get('memories', {})
                _profile = data.get('profile', {})
        except Exception as e:
            print(f"[Brain] JSON load error: {e}")

_load()

def set_active_user(user): global _active_user; _active_user = user
def get_active_user(): return _active_user
def remember_fact(key, value): _memories[key] = value; _save()
def recall_fact(key): return _memories.get(key)
def forget_fact(key): _memories.pop(key, None); _save()
def list_memories(): return dict(_memories)
def store_profile_value(key, value): _profile[key] = value; _save()
def recall_profile_value(key): return _profile.get(key)
def list_profile_values(): return dict(_profile)
def learn_text(text): pass
def memory_context(): return '\n'.join(f'{k}: {v}' for k, v in _memories.items())
def profile_context(): return '\n'.join(f'{k}: {v}' for k, v in _profile.items())
