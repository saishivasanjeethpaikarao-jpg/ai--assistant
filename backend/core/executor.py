import subprocess
import os
from typing import List, Optional

from tools import ToolResult, tool_registry
from tools.verifier import verify_command_success


class VerifiedExecutor:
    """Execution layer that verifies every action and never fakes results.

    Wraps ToolRegistry with verification. Every execution result
    includes a `verified` field confirming the action actually happened.
    """

    def __init__(self):
        self._history: List[dict] = []

    def execute(self, tool_name: str, **kwargs) -> dict:
        """Execute a tool and verify the result.

        Returns dict with: success, message, verified, error
        """
        result = tool_registry.execute(tool_name, **kwargs)

        verified, verify_msg = verify_command_success(result)
        entry = {
            "tool": tool_name,
            "args": kwargs,
            "success": result.success,
            "message": result.message,
            "verified": verified,
            "verification": verify_msg,
            "data": result.data,
        }
        self._history.append(entry)

        return entry

    def run_powershell(self, command: str, timeout: int = 30) -> dict:
        """Run a PowerShell command safely with verification."""
        try:
            result = subprocess.run(
                ["powershell", "-NoProfile", "-Command", command],
                capture_output=True, text=True, timeout=timeout
            )
            success = result.returncode == 0
            entry = {
                "tool": "powershell",
                "command": command,
                "success": success,
                "message": result.stdout.strip() or result.stderr.strip(),
                "verified": success,
                "verification": "Exit code 0" if success else f"Exit code {result.returncode}",
            }
            self._history.append(entry)
            return entry
        except subprocess.TimeoutExpired:
            entry = {
                "tool": "powershell",
                "command": command,
                "success": False,
                "message": "Command timed out",
                "verified": False,
                "verification": "Timeout",
            }
            self._history.append(entry)
            return entry
        except Exception as e:
            entry = {
                "tool": "powershell",
                "command": command,
                "success": False,
                "message": str(e),
                "verified": False,
                "verification": "Execution error",
            }
            self._history.append(entry)
            return entry

    def verify_only(self, tool_name: str, **kwargs) -> dict:
        """Run verification without executing (checks last result)."""
        if not self._history:
            return {"verified": False, "message": "No prior execution to verify"}

        last = self._history[-1]
        if last["tool"] != tool_name:
            return {"verified": False, "message": f"Last tool was {last['tool']}, not {tool_name}"}

        return {"verified": last["verified"], "message": last["verification"]}

    def get_history(self) -> List[dict]:
        return list(self._history)

    def clear_history(self) -> None:
        self._history.clear()


_executor_instance = None


def get_executor() -> VerifiedExecutor:
    global _executor_instance
    if _executor_instance is None:
        _executor_instance = VerifiedExecutor()
    return _executor_instance
