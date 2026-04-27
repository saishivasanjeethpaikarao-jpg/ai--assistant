"""
Handlers module - Command handlers for various operations.
"""

from handlers.web_search import search_handler, youtube_handler
from handlers.app_launcher import app_launcher_handler, file_open_handler
from handlers.system_commands import (
    system_info_handler,
    time_handler,
    date_handler,
    volume_handler,
    shutdown_handler,
    lock_handler,
)

__all__ = [
    "search_handler",
    "youtube_handler",
    "app_launcher_handler",
    "file_open_handler",
    "system_info_handler",
    "time_handler",
    "date_handler",
    "volume_handler",
    "shutdown_handler",
    "lock_handler",
]
