"""
App Launcher Tool — Open applications by name.
"""

import subprocess
import os
import platform
from typing import Dict
from backend.tools import ToolResult, tool_registry


# Common Windows app paths
COMMON_APPS = {
    "chrome": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "firefox": "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
    "edge": "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "notepad": "notepad.exe",
    "calculator": "calc.exe",
    "paint": "mspaint.exe",
    "word": "C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
    "excel": "C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE",
    "powerpoint": "C:\\Program Files\\Microsoft Office\\root\\Office16\\POWERPNT.EXE",
    "vs-code": "C:\\Users\\santo\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
    "vscode": "C:\\Users\\santo\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
    "python": "python.exe",
    "terminal": "cmd.exe",
    "powershell": "powershell.exe",
    "task-manager": "taskmgr.exe",
    "settings": "ms-settings:",
}


def launch_app(app_name: str, args: str = "") -> ToolResult:
    """
    Launch an application.
    
    Args:
        app_name: Name of app (see COMMON_APPS)
        args: Optional command-line arguments
    """
    if platform.system() != "Windows":
        return ToolResult(
            success=False,
            message="App launching only works on Windows desktop app. Download the desktop EXE from the releases page."
        )
    app_name = app_name.lower().strip()
    
    # Check if app is in registry
    if app_name in COMMON_APPS:
        executable = COMMON_APPS[app_name]
    else:
        # Try as direct executable
        executable = app_name
    
    try:
        cmd = [executable]
        if args:
            cmd.extend(args.split())
        subprocess.Popen(cmd)
        
        return ToolResult(
            success=True,
            message=f"Launching {app_name}..."
        )
    except Exception as e:
        return ToolResult(
            success=False,
            message=f"Failed to launch {app_name}: {str(e)}"
        )


def list_available_apps() -> ToolResult:
    """List all available apps."""
    return ToolResult(
        success=True,
        message=f"Available apps: {', '.join(COMMON_APPS.keys())}",
        data={"apps": list(COMMON_APPS.keys())}
    )


def is_app_running(app_name: str) -> ToolResult:
    """Check if an app is running."""
    try:
        result = subprocess.run(
            ['tasklist'],
            capture_output=True, text=True
        )
        is_running = app_name.lower() in result.stdout.lower()
        is_running = result.returncode == 0
        return ToolResult(
            success=True,
            message=f"{app_name} is {'running' if is_running else 'not running'}",
            data={"running": is_running}
        )
    except Exception as e:
        return ToolResult(success=False, message=f"Check failed: {e}")


def close_app(app_name: str) -> ToolResult:
    """Close an application."""
    try:
        subprocess.run(['taskkill', '/IM', f'{app_name}.exe', '/F'])
        return ToolResult(
            success=True,
            message=f"Closing {app_name}..."
        )
    except Exception as e:
        return ToolResult(success=False, message=f"Close failed: {e}")


# Register tools
tool_registry.register("launch_app", launch_app)
tool_registry.register("list_apps", list_available_apps)
tool_registry.register("is_app_running", is_app_running)
tool_registry.register("close_app", close_app)
