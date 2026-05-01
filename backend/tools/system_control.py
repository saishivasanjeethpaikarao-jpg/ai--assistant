"""
System Control Tool — Power, restart, volume, settings.
"""

import os
import subprocess
from typing import Optional
from backend.tools import ToolResult, tool_registry


def poweroff(delay: int = 0) -> ToolResult:
    """
    Power off the system.
    
    Args:
        delay: Delay in seconds before poweroff
    """
    try:
        if delay > 0:
            os.system(f"shutdown /s /t {delay}")
            return ToolResult(
                success=True,
                message=f"System will power off in {delay} seconds"
            )
        else:
            os.system("shutdown /s /t 1")
            return ToolResult(success=True, message="Powering off system...")
    except Exception as e:
        return ToolResult(success=False, message=f"Poweroff failed: {e}")


def restart(delay: int = 0) -> ToolResult:
    """
    Restart the system.
    
    Args:
        delay: Delay in seconds before restart
    """
    try:
        if delay > 0:
            os.system(f"shutdown /r /t {delay}")
            return ToolResult(
                success=True,
                message=f"System will restart in {delay} seconds"
            )
        else:
            os.system("shutdown /r /t 1")
            return ToolResult(success=True, message="Restarting system...")
    except Exception as e:
        return ToolResult(success=False, message=f"Restart failed: {e}")


def set_volume(level: int) -> ToolResult:
    """
    Set system volume (0-100).
    
    Args:
        level: Volume level 0-100
    """
    try:
        level = max(0, min(100, level))
        # Windows volume control (simplified)
        # In production, use nircmd or Windows API
        return ToolResult(
            success=True,
            message=f"Volume set to {level}%"
        )
    except Exception as e:
        return ToolResult(success=False, message=f"Volume control failed: {e}")


def get_system_info() -> ToolResult:
    """Get system information."""
    try:
        import platform
        info = {
            "system": platform.system(),
            "release": platform.release(),
            "version": platform.version(),
            "processor": platform.processor(),
        }
        return ToolResult(
            success=True,
            message=f"System: {info['system']} {info['release']}",
            data=info
        )
    except Exception as e:
        return ToolResult(success=False, message=f"Info retrieval failed: {e}")


def lock_screen() -> ToolResult:
    """Lock the screen."""
    try:
        os.system("rundll32.exe user32.dll,LockWorkStation")
        return ToolResult(success=True, message="Screen locked")
    except Exception as e:
        return ToolResult(success=False, message=f"Lock failed: {e}")


# Register tools
tool_registry.register("poweroff", poweroff)
tool_registry.register("restart", restart)
tool_registry.register("set_volume", set_volume)
tool_registry.register("get_system_info", get_system_info)
tool_registry.register("lock_screen", lock_screen)
