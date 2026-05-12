import asyncio
import logging
from typing import Any, Callable, Dict, Set

logger = logging.getLogger(__name__)

class EventBus:
    def __init__(self):
        self._subscribers: Dict[str, Set[Callable]] = {}

    def subscribe(self, event_type: str, callback: Callable):
        if event_type not in self._subscribers:
            self._subscribers[event_type] = set()
        self._subscribers[event_type].add(callback)
        logger.debug(f"Subscribed to {event_type}")

    def unsubscribe(self, event_type: str, callback: Callable):
        if event_type in self._subscribers:
            self._subscribers[event_type].discard(callback)
            logger.debug(f"Unsubscribed from {event_type}")

    async def publish(self, event_type: str, data: Any = None):
        if event_type not in self._subscribers:
            return

        tasks = []
        for callback in self._subscribers[event_type]:
            try:
                if asyncio.iscoroutinefunction(callback):
                    tasks.append(callback(data))
                else:
                    tasks.append(asyncio.to_thread(callback, data))
            except Exception as e:
                logger.error(f"Error publishing event {event_type} to {callback}: {e}")

        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for result in results:
                if isinstance(result, Exception):
                    logger.error(f"Error in event handler for {event_type}: {result}")

# Global instance
event_bus = EventBus()
