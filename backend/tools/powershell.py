import os
import re
import subprocess
from typing import Tuple

from tools import ToolResult


# Phase 1: positive cmdlet allowlist. The previous substring blocklist was
# trivially bypassed (tabs, Remove-Item, ri, del /q, Clear-RecycleBin -Force,
# case tricks, etc.). The first token of the command must be a known
# cmdlet verb followed by "-<noun>".
_ALLOWED_VERBS = {
    "Get", "Set", "Show", "Where", "Select", "Format", "Out",
    "Read", "Write", "Test", "Sort", "Group", "Measure",
    "Compare", "ConvertTo", "ConvertFrom", "Export", "Import",
}
# Verbs that are always destructive — require explicit opt-in.
_DESTRUCTIVE_VERBS = {
    "Stop", "Restart", "Remove", "Clear", "Disable",
    "Uninstall", "Rename", "Move", "Copy", "New", "Add", "Start",
}
_SAFE_MODE = os.environ.get("AIRIS_SAFE_MODE", "1") == "1"


def _has_unquoted_semicolon(command: str) -> bool:
    """Return True if `command` contains a ';' that is not inside a quoted string."""
    in_quote = None
    for ch in command:
        if in_quote:
            if ch == in_quote:
                in_quote = None
        else:
            if ch in ('"', "'"):
                in_quote = ch
            elif ch == ";":
                return True
    return False


def _first_cmdlet_verb(command: str) -> str:
    """Return the verb (before the first '-') of the first cmdlet, or ''.

    Handles leading parens, pipes, redirections, and ``$var = ...``
    assignments so expressions like ``(Get-Process).Count`` or
    ``$x = Get-Date`` resolve to ``Get``.
    """
    s = command.strip()
    if not s:
        return ""
    # Strip leading redirections / pipes / open parens
    s = s.lstrip("|>$(")
    s = s.lstrip()
    # Assignment: "$var = cmdlet" or "x = cmdlet"
    if "=" in s:
        s = s.split("=", 1)[1].strip()
    first = s.split(maxsplit=1)[0] if s else ""
    if "-" not in first:
        return ""
    return first.split("-", 1)[0]


def run_powershell(command: str, timeout: int = 30, allow_extended: bool = False) -> ToolResult:
    """Run a PowerShell command safely with a positive cmdlet allowlist.

    Args:
        command: The PowerShell command string to run.
        timeout: Maximum execution time in seconds.
        allow_extended: Required for destructive verbs (Stop/Restart/Remove/...).
            Callers (e.g. the dashboard's "are you sure?" button) must pass
            ``True`` explicitly.
    """
    if _has_unquoted_semicolon(command):
        return ToolResult(
            success=False,
            message="Rejected: unquoted ';' not allowed in PowerShell commands",
        )

    verb = _first_cmdlet_verb(command)
    if not verb:
        return ToolResult(
            success=False,
            message="Rejected: command must start with a recognized cmdlet (Verb-Noun)",
        )
    if verb not in _ALLOWED_VERBS and verb not in _DESTRUCTIVE_VERBS:
        return ToolResult(
            success=False,
            message=f"Rejected: cmdlet verb '{verb}' is not on the allowlist",
        )
    if verb in _DESTRUCTIVE_VERBS:
        if _SAFE_MODE and not allow_extended:
            return ToolResult(
                success=False,
                message=(
                    f"Rejected: destructive verb '{verb}' requires "
                    f"AIRIS_SAFE_MODE=0 OR explicit allow_extended=True"
                ),
            )
        if not allow_extended:
            return ToolResult(
                success=False,
                message=f"Rejected: '{verb}' requires explicit allow_extended=True",
            )

    try:
        result = subprocess.run(
            ["powershell", "-NoProfile", "-Command", command],
            capture_output=True, text=True, timeout=timeout
        )
        if result.returncode == 0:
            output = result.stdout.strip()
            return ToolResult(
                success=True,
                message=output if output else "Command executed successfully",
                data={"output": output, "returncode": result.returncode}
            )
        else:
            return ToolResult(
                success=False,
                message=result.stderr.strip() or f"Exit code: {result.returncode}",
                data={"stderr": result.stderr, "returncode": result.returncode}
            )
    except subprocess.TimeoutExpired:
        return ToolResult(success=False, message="Command timed out")
    except FileNotFoundError:
        return ToolResult(success=False, message="PowerShell not found")
    except Exception as e:
        return ToolResult(success=False, message=str(e))
