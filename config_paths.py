"""Writable app data paths for dev and frozen (PyInstaller) builds."""

from __future__ import annotations

import os
import shutil
import sys


def is_frozen() -> bool:
    return bool(getattr(sys, "frozen", False)) and hasattr(sys, "_MEIPASS")


def bundle_dir() -> str:
    if is_frozen():
        return getattr(sys, "_MEIPASS", os.path.dirname(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))


def user_data_dir() -> str:
    if sys.platform == "win32":
        base = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
        d = os.path.join(base, "JarvisAI")
    else:
        d = os.path.join(os.path.expanduser("~"), ".config", "jarvis-ai")
    os.makedirs(d, exist_ok=True)
    return d


def get_dotenv_path() -> str:
    if is_frozen():
        return os.path.join(user_data_dir(), ".env")
    return os.path.join(bundle_dir(), ".env")


def memory_package_dir() -> str:
    """Directory for memory/*.json data (writable when frozen)."""
    if is_frozen():
        p = os.path.join(user_data_dir(), "memory_data")
        os.makedirs(p, exist_ok=True)
        return p
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "memory")


def ensure_user_env() -> str:
    """Ensure a writable .env exists (copy template on first run for EXE)."""
    path = get_dotenv_path()
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return path
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    template = os.path.join(bundle_dir(), ".env.template")
    if os.path.isfile(template):
        try:
            shutil.copy(template, path)
        except OSError:
            open(path, "a", encoding="utf-8").close()
    else:
        open(path, "a", encoding="utf-8").close()
    return path
