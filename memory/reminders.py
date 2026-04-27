import json
import os
import re
from datetime import datetime, timedelta

from config_paths import memory_package_dir

BASE_DIR = memory_package_dir()
USERS_DIR = os.path.join(BASE_DIR, "users")
DEFAULT_FILE = os.path.join(BASE_DIR, "reminders.json")
_GUEST_REMINDERS: list[dict] = []
GUEST_USER_ID = "guest"

os.makedirs(USERS_DIR, exist_ok=True)


def _reminder_file(user_id: str | None = None) -> str | None:
    if user_id is None or user_id == GUEST_USER_ID:
        return None
    safe_id = ''.join(c for c in user_id if c.isalnum() or c in ('-', '_'))
    return os.path.join(USERS_DIR, f"{safe_id}_reminders.json")


def load_reminders(user_id: str | None = None) -> list:
    if user_id is None:
        return []
    if user_id == GUEST_USER_ID:
        return list(_GUEST_REMINDERS)
    path = _reminder_file(user_id)
    if not path or not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except Exception:
            return []


def save_reminders(reminders: list, user_id: str | None = None) -> None:
    if user_id is None:
        return
    if user_id == GUEST_USER_ID:
        _GUEST_REMINDERS.clear()
        _GUEST_REMINDERS.extend(reminders)
        return
    path = _reminder_file(user_id)
    if not path:
        return
    with open(path, "w", encoding="utf-8") as f:
        json.dump(reminders, f, indent=2)


def parse_reminder_schedule(text: str) -> str:
    normalized = text.lower()
    if "tomorrow" in normalized and "at" not in normalized:
        return "tomorrow"
    if "today" in normalized and "at" not in normalized:
        return "today"

    match = re.search(r"(today|tomorrow)\s*(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?", normalized)
    if match:
        when_day = match.group(1)
        hour = int(match.group(2))
        minute = int(match.group(3) or "0")
        suffix = match.group(4)
        if suffix == "pm" and hour < 12:
            hour += 12
        if suffix == "am" and hour == 12:
            hour = 0
        return f"{when_day} at {hour:02d}:{minute:02d}"

    match = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)?", normalized)
    if match:
        hour = int(match.group(1))
        minute = int(match.group(2) or "0")
        suffix = match.group(3)
        if suffix == "pm" and hour < 12:
            hour += 12
        if suffix == "am" and hour == 12:
            hour = 0
        return f"today at {hour:02d}:{minute:02d}"

    return "soon"


def _parse_when_to_datetime(when_text: str) -> datetime | None:
    if not when_text:
        return None
    normalized = when_text.strip().lower()
    now = datetime.now()
    if normalized == "soon":
        return now + timedelta(minutes=5)
    if normalized == "today":
        return None
    if normalized == "tomorrow":
        return None

    match = re.match(r"(today|tomorrow) at (\d{1,2}):?(\d{2})?\s*(am|pm)?", normalized)
    if match:
        day = match.group(1)
        hour = int(match.group(2))
        minute = int(match.group(3) or "0")
        suffix = match.group(4)
        if suffix == "pm" and hour < 12:
            hour += 12
        if suffix == "am" and hour == 12:
            hour = 0
        target = now if day == "today" else now + timedelta(days=1)
        return target.replace(hour=hour, minute=minute, second=0, microsecond=0)

    match = re.match(r"(\d{1,2}):?(\d{2})?\s*(am|pm)?", normalized)
    if match:
        hour = int(match.group(1))
        minute = int(match.group(2) or "0")
        suffix = match.group(3)
        if suffix == "pm" and hour < 12:
            hour += 12
        if suffix == "am" and hour == 12:
            hour = 0
        candidate = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if candidate < now:
            candidate += timedelta(days=1)
        return candidate

    return None


def add_reminder(text: str, when_text: str, user_id: str | None = None) -> str:
    reminders = load_reminders(user_id)
    reminder = {
        "text": text.strip(),
        "when": when_text.strip() or parse_reminder_schedule(text),
        "created": datetime.now().isoformat(),
    }
    reminders.append(reminder)
    save_reminders(reminders, user_id)
    return reminder


def list_reminders(user_id: str | None = None) -> list:
    return load_reminders(user_id)


def delete_reminder_at(user_id: str | None, index: int) -> bool:
    reminders = load_reminders(user_id)
    if 0 <= index < len(reminders):
        reminders.pop(index)
        save_reminders(reminders, user_id)
        return True
    return False


def set_reminder_completed(user_id: str | None, index: int, completed: bool = True) -> bool:
    reminders = load_reminders(user_id)
    if 0 <= index < len(reminders):
        reminders[index]["completed"] = bool(completed)
        save_reminders(reminders, user_id)
        return True
    return False


def due_reminders(user_id: str | None = None, within_minutes: int = 1) -> list:
    now = datetime.now()
    window_end = now + timedelta(minutes=within_minutes)
    reminders = []
    for reminder in load_reminders(user_id):
        when_text = reminder.get("when", "")
        reminder_dt = _parse_when_to_datetime(when_text)
        if reminder_dt and now <= reminder_dt <= window_end:
            reminders.append(reminder)
    return reminders


def clear_reminder(query: str, user_id: str | None = None) -> str:
    if not query:
        return "Tell me which reminder to clear."
    reminders = load_reminders(user_id)
    if not reminders:
        return "You have no reminders to clear."
    filtered = [r for r in reminders if query.lower() not in r.get("text", "").lower()]
    if len(filtered) == len(reminders):
        return f"No reminder matched '{query}'."
    save_reminders(filtered, user_id)
    return f"Cleared reminders matching '{query}'."
