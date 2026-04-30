"""
WebSocket Client for KivyMD UI - Real-time agent updates
Connects to ws_server.py to receive live orchestration updates.
"""

import json
import threading
import logging
from typing import Callable, Optional

try:
    import websockets
    _websockets_available = True
except ImportError:
    _websockets_available = False

logger = logging.getLogger(__name__)


class WebSocketClient:
    """WebSocket client for real-time agent updates."""
    
    def __init__(self, host: str = "localhost", port: int = 8765):
        self.host = host
        self.port = port
        self.websocket = None
        self.connected = False
        self.message_callback: Optional[Callable] = None
        self._thread: Optional[threading.Thread] = None
        self._running = False
        
    def set_message_callback(self, callback: Callable):
        """Set callback function for incoming messages."""
        self.message_callback = callback
        
    def connect(self) -> bool:
        """Connect to WebSocket server."""
        if not _websockets_available:
            logger.error("websockets library not available")
            return False
            
        try:
            import asyncio
            self._running = True
            self._thread = threading.Thread(target=self._run_loop, daemon=True)
            self._thread.start()
            return True
        except Exception as e:
            logger.error(f"Failed to connect: {e}")
            return False
            
    def _run_loop(self):
        """Run asyncio event loop in thread."""
        import asyncio
        asyncio.run(self._connect_and_listen())
        
    async def _connect_and_listen(self):
        """Connect and listen for messages."""
        uri = f"ws://{self.host}:{self.port}"
        
        while self._running:
            try:
                async with websockets.connect(uri) as websocket:
                    self.websocket = websocket
                    self.connected = True
                    logger.info(f"Connected to {uri}")
                    
                    if self.message_callback:
                        self.message_callback({"type": "connected", "data": "Connected to server"})
                    
                    async for message in websocket:
                        if not self._running:
                            break
                            
                        try:
                            data = json.loads(message)
                            if self.message_callback:
                                self.message_callback(data)
                        except json.JSONDecodeError:
                            logger.error("Invalid JSON received")
                            
            except Exception as e:
                self.connected = False
                logger.error(f"WebSocket error: {e}")
                if self.message_callback:
                    self.message_callback({"type": "error", "data": str(e)})
                
                # Reconnect after delay
                await asyncio.sleep(5)
                
    def send(self, text: str, max_loops: int = 3):
        """Send message to server."""
        if not self.connected or not self.websocket:
            logger.warning("Not connected")
            return False
            
        try:
            import asyncio
            message = json.dumps({"text": text, "max_loops": max_loops})
            
            # Send from async context
            async def _send():
                try:
                    await self.websocket.send(message)
                except Exception as e:
                    logger.error(f"Send failed: {e}")
                    
            # Run in existing event loop
            import asyncio
            loop = asyncio.get_event_loop()
            loop.create_task(_send())
            return True
            
        except Exception as e:
            logger.error(f"Failed to send: {e}")
            return False
            
    def disconnect(self):
        """Disconnect from server."""
        self._running = False
        self.connected = False
        if self._thread:
            self._thread.join(timeout=2)
        logger.info("Disconnected")


# Singleton instance for UI
_ws_client: Optional[WebSocketClient] = None


def get_websocket_client() -> WebSocketClient:
    """Get or create WebSocket client instance."""
    global _ws_client
    if _ws_client is None:
        _ws_client = WebSocketClient()
    return _ws_client
