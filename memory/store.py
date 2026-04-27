import json
import os

from config_paths import memory_package_dir

BASE_DIR = memory_package_dir()
USERS_DIR = os.path.join(BASE_DIR, "users")
DEFAULT_FILE = os.path.join(BASE_DIR, "memory.json")

os.makedirs(USERS_DIR, exist_ok=True)


def _memory_file(user_id: str | None = None) -> str:
    if not user_id:
        return DEFAULT_FILE
    safe_id = ''.join(c for c in user_id if c.isalnum() or c in ('-', '_'))
    return os.path.join(USERS_DIR, f"{safe_id}.json")


def load_memory(user_id: str | None = None):
    path = _memory_file(user_id)
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except Exception:
            return {}


def save_memory(data, user_id: str | None = None):
    path = _memory_file(user_id)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def add_memory(key: str, value: str, user_id: str | None = None):
    data = load_memory(user_id)
    data[key] = value
    save_memory(data, user_id)


def get_memory(key: str, user_id: str | None = None):
    data = load_memory(user_id)
    return data.get(key, "Not found")
