"""
System commands handler - Volume, brightness, time, shutdown, etc.
"""

from typing import Dict, Any
from datetime import datetime
import os
import subprocess

from core.logger import logger


def system_info_handler(cmd: str, context: Dict[str, Any]) -> str:
    """Get system information."""
    try:
        import platform
        
        system_info = {
            "os": platform.system(),
            "platform": platform.platform(),
            "hostname": os.environ.get("COMPUTERNAME", "Unknown"),
            "username": os.environ.get("USERNAME", "Unknown"),
        }
        
        response = f"System: {system_info['os']} {system_info['platform']}\n"
        response += f"Computer: {system_info['hostname']}\n"
        response += f"User: {system_info['username']}"
        
        logger.debug("System info retrieved")
        return response
    
    except Exception as e:
        logger.error(f"System info handler error: {e}")
        return f"Unable to get system info: {str(e)}"


def time_handler(cmd: str, context: Dict[str, Any]) -> str:
    """Get current time."""
    try:
        now = datetime.now()
        time_str = now.strftime("%I:%M %p")
        date_str = now.strftime("%A, %B %d, %Y")
        return f"It's {time_str} on {date_str}"
    
    except Exception as e:
        logger.error(f"Time handler error: {e}")
        return f"Error getting time: {str(e)}"


def date_handler(cmd: str, context: Dict[str, Any]) -> str:
    """Get current date."""
    try:
        now = datetime.now()
        return f"Today is {now.strftime('%A, %B %d, %Y')}"
    
    except Exception as e:
        logger.error(f"Date handler error: {e}")
        return f"Error getting date: {str(e)}"


def volume_handler(cmd: str, context: Dict[str, Any]) -> str:
    """Handle volume control (Windows only)."""
    try:
        cmd_lower = cmd.lower()
        
        if "mute" in cmd_lower:
            os.system("nircmd.exe mutesysvolume 1")
            return "Muting volume..."
        elif "unmute" in cmd_lower:
            os.system("nircmd.exe mutesysvolume 0")
            return "Unmuting volume..."
        elif "max" in cmd_lower or "full" in cmd_lower:
            os.system("nircmd.exe setsysvolume 65535")
            return "Setting volume to maximum..."
        elif "min" in cmd_lower or "low" in cmd_lower:
            os.system("nircmd.exe setsysvolume 16384")
            return "Setting volume to low..."
        else:
            return "Volume control - try: mute, unmute, max, min"
    
    except Exception as e:
        logger.debug(f"Volume control not available: {e}")
        return "Volume control not available on this system"


def shutdown_handler(cmd: str, context: Dict[str, Any]) -> str:
    """Handle shutdown/restart."""
    cmd_lower = cmd.lower()
    
    # Safety check - require explicit command
    if "shutdown" in cmd_lower and ("now" in cmd_lower or "immediately" in cmd_lower):
        try:
            logger.warning("Shutdown initiated by user")
            os.system("shutdown /s /t 30")
            return "Shutting down in 30 seconds..."
        except Exception as e:
            logger.error(f"Shutdown error: {e}")
            return "Unable to shutdown"
    
    elif "restart" in cmd_lower and ("now" in cmd_lower or "immediately" in cmd_lower):
        try:
            logger.warning("Restart initiated by user")
            os.system("shutdown /r /t 30")
            return "Restarting in 30 seconds..."
        except Exception as e:
            logger.error(f"Restart error: {e}")
            return "Unable to restart"
    
    elif "restart" in cmd_lower or "reboot" in cmd_lower:
        return "Say 'restart immediately' to confirm restart"
    
    elif "shutdown" in cmd_lower:
        return "Say 'shutdown now' to confirm shutdown"
    
    else:
        return "Unknown system command"


def lock_handler(cmd: str, context: Dict[str, Any]) -> str:
    """Lock the computer."""
    try:
        logger.info("Locking computer")
        os.system("rundll32.exe user32.dll,LockWorkStation")
        return "Locking computer..."
    except Exception as e:
        logger.error(f"Lock handler error: {e}")
        return "Unable to lock computer"
