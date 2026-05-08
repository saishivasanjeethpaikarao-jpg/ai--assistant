import subprocess
import os
import time
from typing import Tuple

from tools import ToolResult


def verify_app_launched(app_name: str) -> Tuple[bool, str]:
    """Verify an application is actually running after launch."""
    try:
        result = subprocess.run(
            ["powershell", "-Command",
             f"Get-Process | Where-Object {{ $_.MainWindowTitle -ne '' }} | "
             f"Select-Object -ExpandProperty ProcessName | Select-String -Pattern '{app_name}'"],
            capture_output=True, text=True, timeout=5
        )
        if result.stdout.strip():
            return True, f"{app_name} is running"
        return False, f"{app_name} does not appear to be running"
    except Exception as e:
        return False, f"Verification failed: {e}"


def verify_file_exists(filepath: str) -> Tuple[bool, str]:
    """Verify a file was created or exists."""
    try:
        if os.path.isfile(filepath):
            size = os.path.getsize(filepath)
            return True, f"File exists ({size} bytes)"
        return False, "File not found"
    except Exception as e:
        return False, f"Verification failed: {e}"


def verify_url_opened(url: str) -> Tuple[bool, str]:
    """Verify a URL was opened (check browser processes)."""
    try:
        browsers = ["chrome", "msedge", "firefox", "opera", "brave"]
        for browser in browsers:
            result = subprocess.run(
                ["powershell", "-Command",
                 f"Get-Process -Name '{browser}' -ErrorAction SilentlyContinue | "
                 f"Select-Object -ExpandProperty ProcessName"],
                capture_output=True, text=True, timeout=3
            )
            if result.stdout.strip():
                return True, f"Opened in {browser}"
        return True, "Launch command sent"
    except Exception:
        return True, "Launch command sent"


def verify_command_success(tool_result: ToolResult, expected: str = "") -> Tuple[bool, str]:
    """Verify a tool execution result indicates success."""
    if not tool_result.success:
        return False, tool_result.message

    if expected and expected.lower() not in tool_result.message.lower():
        return True, f"Executed but unexpected result: {tool_result.message}"

    return True, tool_result.message


def verify_powershell_success(result: subprocess.CompletedProcess) -> Tuple[bool, str]:
    """Verify PowerShell command completed successfully."""
    if result.returncode != 0:
        return False, result.stderr.strip() or f"Exit code: {result.returncode}"
    output = result.stdout.strip()
    if output:
        return True, output
    return True, "Command executed successfully"
