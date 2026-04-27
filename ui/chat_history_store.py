"""Persist chat sessions for Memory / History panel."""

from __future__ import annotations

import json
import os
from datetime import datetime

from config_paths import is_frozen, user_data_dir

if is_frozen():
    HISTORY_PATH = os.path.join(user_data_dir(), "ui_chat_history.json")
else:
    _BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    HISTORY_PATH = os.path.join(_BASE, "memory", "ui_chat_history.json")


def _ensure():
    os.makedirs(os.path.dirname(HISTORY_PATH), exist_ok=True)


def load_sessions() -> list[dict]:
    if not os.path.exists(HISTORY_PATH):
        return []
    try:
        with open(HISTORY_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def save_sessions(sessions: list[dict]) -> None:
    _ensure()
    try:
        with open(HISTORY_PATH, "w", encoding="utf-8") as f:
            json.dump(sessions, f, indent=2, ensure_ascii=False)
    except Exception:
        pass


def append_turn(user_text: str, assistant_text: str) -> None:
    sessions = load_sessions()
    now = datetime.now().isoformat()
    day_key = datetime.now().strftime("%Y-%m-%d")
    preview = (user_text or "")[:80]
    entry = {
        "id": now,
        "ts": now,
        "day": day_key,
        "title": preview or "Chat",
        "preview": (assistant_text or "")[:200],
        "messages": [
            {"role": "user", "text": user_text, "ts": now},
            {"role": "assistant", "text": assistant_text, "ts": now},
        ],
    }
    sessions.insert(0, entry)
    sessions = sessions[:200]
    save_sessions(sessions)
