"""
Thread-safe message queue for async command handling.
Prevents UI freezing by decoupling voice/input from command execution.
"""

import queue
import threading
from typing import Callable, Any, Optional
from dataclasses import dataclass
from enum import Enum

from core.logger import logger


class CommandPriority(Enum):
    """Command execution priority levels."""
    LOW = 3
    NORMAL = 2
    HIGH = 1
    CRITICAL = 0


@dataclass
class Command:
    """Represents a command in the queue."""
    text: str
    priority: CommandPriority = CommandPriority.NORMAL
    callback: Optional[Callable[[str], None]] = None
    context: Optional[dict] = None
    
    def __lt__(self, other):
        """Allow priority queue comparison."""
        return self.priority.value < other.priority.value


class MessageQueue:
    """Thread-safe message queue for commands."""
    
    def __init__(self, max_size: int = 100):
        self.queue = queue.PriorityQueue(maxsize=max_size)
        self.lock = threading.RLock()
        self.is_processing = False
        self._handler_thread = None
        self._stop_event = threading.Event()
    
    def put(self, command: Command) -> None:
        """Add command to queue."""
        try:
            self.queue.put((command.priority.value, id(command), command), block=False)
            logger.debug(f"Command queued: {command.text[:50]}")
        except queue.Full:
            logger.warning(f"Command queue full, dropping: {command.text[:50]}")
    
    def put_text(
        self,
        text: str,
        priority: CommandPriority = CommandPriority.NORMAL,
        callback: Optional[Callable] = None,
        context: Optional[dict] = None
    ) -> None:
        """Convenience method to queue text command."""
        cmd = Command(text=text, priority=priority, callback=callback, context=context)
        self.put(cmd)
    
    def get(self, timeout: Optional[float] = None) -> Optional[Command]:
        """Retrieve next command from queue."""
        try:
            _, _, cmd = self.queue.get(timeout=timeout)
            return cmd
        except queue.Empty:
            return None
    
    def size(self) -> int:
        """Get current queue size."""
        return self.queue.qsize()
    
    def clear(self) -> None:
        """Clear all commands from queue."""
        with self.lock:
            while not self.queue.empty():
                try:
                    self.queue.get_nowait()
                except queue.Empty:
                    break
            logger.info("Command queue cleared")
    
    def start_processor(self, handler: Callable[[Command], str]) -> None:
        """Start background thread to process commands."""
        if self._handler_thread is not None and self._handler_thread.is_alive():
            logger.warning("Processor already running")
            return
        
        self._stop_event.clear()
        self._handler_thread = threading.Thread(
            target=self._process_loop,
            args=(handler,),
            daemon=True,
            name="CommandProcessor"
        )
        self._handler_thread.start()
        logger.info("Command processor started")
    
    def stop_processor(self) -> None:
        """Stop the background processor."""
        self._stop_event.set()
        if self._handler_thread:
            self._handler_thread.join(timeout=5)
            self._handler_thread = None
        logger.info("Command processor stopped")
    
    def _process_loop(self, handler: Callable[[Command], str]) -> None:
        """Main processing loop (runs in thread)."""
        while not self._stop_event.is_set():
            try:
                cmd = self.get(timeout=1)
                if cmd is None:
                    continue
                
                self.is_processing = True
                try:
                    logger.debug(f"Processing: {cmd.text[:50]}")
                    result = handler(cmd)
                    
                    # Call callback if provided
                    if cmd.callback:
                        cmd.callback(result)
                    
                    logger.debug(f"Completed: {cmd.text[:50]}")
                except Exception as e:
                    logger.exception(f"Error processing command: {cmd.text[:50]}")
                    if cmd.callback:
                        cmd.callback(f"Error: {str(e)}")
                finally:
                    self.is_processing = False
            
            except Exception as e:
                logger.exception("Unexpected error in command processor")


# Singleton instance
message_queue = MessageQueue()
