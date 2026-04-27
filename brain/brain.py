import os
import time
from memory.store import load_memory, save_memory, add_memory, get_memory

_current_user_id = None
_current_profile = {}
_guest_memory: dict[str, str] = {}

GUEST_USER_ID = "guest"


def set_active_user(user_id: str, email: str | None = None, phone: str | None = None) -> None:
    global _current_user_id, _current_profile, _guest_memory
    if _current_user_id == GUEST_USER_ID and user_id != GUEST_USER_ID:
        _guest_memory.clear()
    _current_user_id = user_id
    _current_profile = {"uid": user_id, "email": email, "phone": phone}


def get_active_user() -> dict:
    return _current_profile.copy() if _current_user_id else {}


def _user_id() -> str | None:
    return _current_user_id


def _is_guest_user() -> bool:
    return _current_user_id == GUEST_USER_ID


def remember_fact(key: str, value: str) -> str:
    if not _user_id():
        return "Login to save memories for your profile."
    if not key:
        return "I need a label for this memory."
    if not value:
        return "I need something to remember."
    if _is_guest_user():
        _guest_memory[key] = value
        return f"Remembered '{key}' for guest mode."
    add_memory(key, value, user_id=_user_id())
    return f"Remembered '{key}'."


def recall_fact(key: str) -> str:
    if not _user_id():
        return "Login to recall your profile memories."
    if not key:
        return "Tell me what to recall."
    if _is_guest_user():
        return _guest_memory.get(key, "Not found")
    return get_memory(key, user_id=_user_id())


def forget_fact(key: str) -> str:
    if not _user_id():
        return "Login to forget your profile memories."
    if not key:
        return "Tell me what to forget."
    if _is_guest_user():
        if key in _guest_memory:
            del _guest_memory[key]
            return f"Forgot '{key}' in guest mode."
        return f"I don't have a memory for '{key}'."
    data = load_memory(user_id=_user_id())
    if key in data:
        del data[key]
        save_memory(data, user_id=_user_id())
        return f"Forgot '{key}'."
    return f"I don't have a memory for '{key}'."


def list_memories() -> str:
    if not _user_id():
        return "Login to list your profile memories."
    if _is_guest_user():
        if not _guest_memory:
            return "I have no memories yet."
        lines = [f"{key}: {value}" for key, value in _guest_memory.items() if not key.startswith("profile.")]
        return "\n".join(lines) if lines else "I have no memories yet."
    data = load_memory(user_id=_user_id())
    if not data:
        return "I have no memories yet."
    lines = [f"{key}: {value}" for key, value in data.items() if not key.startswith("profile.")]
    return "\n".join(lines) if lines else "I have no memories yet."


def list_profile_values() -> str:
    if not _user_id():
        return "Login to list your profile settings."
    if _is_guest_user():
        profile_items = {
            key[len("profile."):]: value
            for key, value in _guest_memory.items()
            if key.startswith("profile.")
        }
    else:
        data = load_memory(user_id=_user_id())
        profile_items = {
            key[len("profile."):]: value
            for key, value in data.items()
            if key.startswith("profile.")
        }
    if not profile_items:
        return "I have no profile settings saved yet."
    lines = [f"{key}: {value}" for key, value in profile_items.items()]
    return "\n".join(lines)


def store_profile_value(key: str, value: str) -> str:
    if not _user_id():
        return "Login to save profile settings."
    if not key:
        return "Tell me which profile setting to save."
    if not value:
        return "Tell me what value to save."
    if _is_guest_user():
        _guest_memory[f"profile.{key}"] = value
        return f"Saved your {key} in guest mode."
    add_memory(f"profile.{key}", value, user_id=_user_id())
    return f"Saved your {key}."


def recall_profile_value(key: str) -> str:
    if not _user_id():
        return "Login to recall profile settings."
    if not key:
        return "Tell me which profile setting to recall."
    if _is_guest_user():
        value = _guest_memory.get(f"profile.{key}", "Not found")
    else:
        value = get_memory(f"profile.{key}", user_id=_user_id())
    if value == "Not found":
        return f"I don't have your {key} yet."
    return value


def learn_text(text: str) -> str:
    if not _user_id():
        return "Login to learn and save memories for your profile."
    if not text:
        return "Tell me what to learn."
    key = f"note_{int(time.time())}"
    if _is_guest_user():
        _guest_memory[key] = text
        return f"Learned and stored as '{key}' in guest mode."
    add_memory(key, text, user_id=_user_id())
    return f"Learned and stored as '{key}'."


def memory_context(max_items: int = 10) -> str:
    if not _user_id():
        return ""
    if _is_guest_user():
        if not _guest_memory:
            return ""
        lines = [f"{key}: {value}" for key, value in _guest_memory.items()]
        return "\n".join(lines[-max_items:])
    data = load_memory(user_id=_user_id())
    if not data:
        return ""
    lines = [f"{key}: {value}" for key, value in data.items()]
    return "\n".join(lines[-max_items:])


def profile_context(max_items: int = 10) -> str:
    if not _user_id():
        return ""
    data = load_memory(user_id=_user_id())
    profile_items = [
        f"{key[len('profile.'):]}: {value}"
        for key, value in data.items()
        if key.startswith("profile.")
    ]
    if not profile_items:
        return ""
    return "\n".join(profile_items[-max_items:])
