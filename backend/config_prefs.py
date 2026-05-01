"""User preferences (appearance, notifications, AI key mode) — JSON in app data dir."""

from __future__ import annotations

import json
import os

from config_paths import user_data_dir

PREFS_PATH = os.path.join(user_data_dir(), "preferences.json")

DEFAULT_PREFS: dict = {
    "appearance": "dark",
    "density": "comfortable",
    "notifications_reminders": True,
    "notifications_sound": True,
    "voice_priority": "fish,eleven,self",
    "api_key_mode": "global",
    "ollama_enabled": True,
    "inline_api_keys": {},
}


def load_prefs() -> dict:
    if not os.path.isfile(PREFS_PATH):
        return DEFAULT_PREFS.copy()
    try:
        with open(PREFS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            return DEFAULT_PREFS.copy()
        out = DEFAULT_PREFS.copy()
        out.update(data)
        if not isinstance(out.get("inline_api_keys"), dict):
            out["inline_api_keys"] = {}
        return out
    except (OSError, json.JSONDecodeError):
        return DEFAULT_PREFS.copy()


def save_prefs(updates: dict) -> None:
    cur = load_prefs()
    patch = dict(updates)
    if "inline_api_keys" in patch:
        cur["inline_api_keys"] = dict(patch.pop("inline_api_keys") or {})
    cur.update(patch)
    os.makedirs(os.path.dirname(PREFS_PATH), exist_ok=True)
    with open(PREFS_PATH, "w", encoding="utf-8") as f:
        json.dump(cur, f, indent=2, ensure_ascii=False)
