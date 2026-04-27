"""
Application launcher - Open Windows applications.
"""

import os
import subprocess
from typing import Dict, Any
from pathlib import Path

from core.logger import logger


# Application shortcuts database
APP_SHORTCUTS = {
    "chrome": {
        "paths": [
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        ],
        "aliases": ["browser", "google", "chromium"]
    },
    "firefox": {
        "paths": [
            "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
            "C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe",
        ],
        "aliases": ["firefox browser"]
    },
    "vscode": {
        "paths": [
            "C:\\Users\\santo\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
            "C:\\Program Files\\Microsoft VS Code\\Code.exe",
            "C:\\Program Files (x86)\\Microsoft VS Code\\Code.exe",
        ],
        "aliases": ["vs code", "visual studio", "editor", "code"]
    },
    "explorer": {
        "paths": ["explorer.exe"],
        "aliases": ["file manager", "files", "file explorer"]
    },
    "notepad": {
        "paths": ["notepad.exe"],
        "aliases": ["text editor", "notepad++"]
    },
    "notepad++": {
        "paths": [
            "C:\\Program Files\\Notepad++\\notepad++.exe",
            "C:\\Program Files (x86)\\Notepad++\\notepad++.exe",
        ],
        "aliases": ["np++", "npp"]
    },
    "discord": {
        "paths": [
            "C:\\Users\\santo\\AppData\\Local\\Discord\\app-1.0.9014\\Discord.exe",
            "%LOCALAPPDATA%\\Discord\\app-1.0.9014\\Discord.exe",
        ],
        "aliases": ["discord app"]
    },
    "spotify": {
        "paths": [
            "C:\\Users\\santo\\AppData\\Roaming\\Spotify\\spotify.exe",
            "%APPDATA%\\Spotify\\spotify.exe",
        ],
        "aliases": ["music", "spotify app"]
    },
    "steam": {
        "paths": [
            "C:\\Program Files (x86)\\Steam\\steam.exe",
        ],
        "aliases": ["gaming", "steam app"]
    },
}


def find_app_path(app_name: str) -> str | None:
    """Find path to application executable."""
    app_name = app_name.lower().strip()
    
    # Check exact match
    if app_name in APP_SHORTCUTS:
        for path in APP_SHORTCUTS[app_name]["paths"]:
            if os.path.exists(path):
                return path
    
    # Check aliases
    for app_key, app_info in APP_SHORTCUTS.items():
        if app_name in app_info["aliases"]:
            for path in app_info["paths"]:
                if os.path.exists(path):
                    return path
    
    return None


def app_launcher_handler(cmd: str, context: Dict[str, Any]) -> str:
    """Handle application launch requests."""
    # Extract app name
    app_name = cmd.lower()
    for trigger in ["open", "launch", "start", "run", "open app"]:
        if trigger in app_name:
            app_name = app_name.replace(trigger, "").strip()
            break
    
    if not app_name or len(app_name) < 2:
        available = ", ".join([k for k in APP_SHORTCUTS.keys()])
        return f"Available apps: {available}"
    
    try:
        app_path = find_app_path(app_name)
        
        if not app_path:
            available = ", ".join([k for k in APP_SHORTCUTS.keys()][:5])
            return f"App '{app_name}' not found. Try: {available}"
        
        logger.info(f"Launching: {app_path}")
        os.startfile(app_path)
        
        # Get display name
        display_name = next((k for k in APP_SHORTCUTS if app_path in APP_SHORTCUTS[k]["paths"]), app_name)
        return f"Launching {display_name}..."
    
    except Exception as e:
        logger.error(f"App launcher error: {e}")
        return f"Unable to launch app: {str(e)}"


def file_open_handler(cmd: str, context: Dict[str, Any]) -> str:
    """Handle file open requests."""
    # Extract file path
    file_path = cmd.lower()
    for trigger in ["open", "open file", "show"]:
        if trigger in file_path:
            file_path = file_path.replace(trigger, "").strip()
            break
    
    if not file_path:
        return "Which file would you like me to open?"
    
    # Expand paths
    file_path = os.path.expandvars(file_path)
    
    if not os.path.exists(file_path):
        # Try to find in common locations
        possibilities = [
            Path.home() / file_path,
            Path.home() / "Desktop" / file_path,
            Path.home() / "Documents" / file_path,
        ]
        
        found = False
        for p in possibilities:
            if p.exists():
                file_path = str(p)
                found = True
                break
        
        if not found:
            return f"File not found: {file_path}"
    
    try:
        logger.info(f"Opening file: {file_path}")
        os.startfile(file_path)
        return f"Opening {os.path.basename(file_path)}..."
    
    except Exception as e:
        logger.error(f"File open handler error: {e}")
        return f"Unable to open file: {str(e)}"
