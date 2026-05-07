import json, os, sqlite3
from config_paths import memory_package_dir

MEMORY_DB = os.path.join(memory_package_dir(), 'brain.db')
_memories = {}
_profile = {}
_active_user = 'default'

def _get_db():
    db_path = memory_package_dir()
    os.makedirs(db_path, exist_ok=True)
    db = sqlite3.connect(os.path.join(db_path, 'brain.db'))
    db.row_factory = sqlite3.Row
    db.execute("CREATE TABLE IF NOT EXISTS memories (user TEXT, key TEXT, value TEXT, PRIMARY KEY (user, key))")
    db.execute("CREATE TABLE IF NOT EXISTS profiles (user TEXT PRIMARY KEY, data TEXT)")
    return db

def _save():
    try:
        db = _get_db()
        # Save memories
        for key, value in _memories.items():
            db.execute("INSERT OR REPLACE INTO memories (user, key, value) VALUES (?, ?, ?)",
                        (_active_user, key, json.dumps(value)))
        # Save profile
        db.execute("INSERT OR REPLACE INTO profiles (user, data) VALUES (?, ?)",
                    (_active_user, json.dumps(_profile)))
        db.commit()
        db.close()
    except Exception as e:
        print(f"Memory save error: {e}")

def _load():
    global _memories, _profile
    try:
        db = _get_db()
        # Load memories
        rows = db.execute("SELECT key, value FROM memories WHERE user = ?", (_active_user,)).fetchall()
        _memories = {row['key']: json.loads(row['value']) for row in rows}
        # Load profile
        row = db.execute("SELECT data FROM profiles WHERE user = ?", (_active_user,)).fetchone()
        if row:
            _profile = json.loads(row['data'])
        db.close()
    except Exception as e:
        print(f"Memory load error: {e}")

def set_active_user(user):
    global _active_user, _memories, _profile
    _active_user = user
    _memories = {}
    _profile = {}
    _load()

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
