import subprocess
import os
from typing import Tuple

from tools import ToolResult


def run_powershell(command: str, timeout: int = 30) -> ToolResult:
    """Run a PowerShell command safely.

    Restricted commands are blocked for safety.
    """
    blocked = [
        "Remove-Item", "rm ", "del ", "rd ", "Format-", "Out-File",
        "Set-Content", "Add-Content", "Clear-Content",
        "Stop-Process -Name", "taskkill",
        "shutdown", "restart-computer", "stop-computer",
        "reg ", "regedit", "sc config", "sc stop",
        "netsh", "ipconfig /release", "diskpart",
    ]

    for pattern in blocked:
        if pattern.lower() in command.lower():
            return ToolResult(
                success=False,
                message=f"Blocked for safety: command contains '{pattern}'"
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
