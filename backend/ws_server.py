"""
WebSocket Server - Real-time streaming for AI Assistant
Provides live updates of agent thinking and execution steps.
"""

import sys
import os
import asyncio
import hashlib
import hmac
import json
import logging
import secrets
import websockets

# Setup path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from dotenv import load_dotenv
from config_paths import ensure_user_env, get_dotenv_path

# Initialize environment
ensure_user_env()
load_dotenv(get_dotenv_path(), override=True)

from orchestrator_v2 import SmartOrchestrator

logger = logging.getLogger(__name__)

# Initialize orchestrator
orchestrator = SmartOrchestrator(max_loops=3)


# Phase 1: WebSocket auth. Without this, anyone reaching ws://localhost:8765
# could run the orchestrator (which can call PowerShell etc.). The secret is
# derived from AIRIS_WS_SECRET; clients must present a token = sha256(secret).
_WS_SECRET = os.environ.get("AIRIS_WS_SECRET", "")
if not _WS_SECRET:
    # Generate a per-process secret if none provided so dev "just works" but
    # the token is logged at startup so the dev can copy it. In production
    # (AIRIS_ENV=prod) the secret MUST be set explicitly.
    if os.environ.get("AIRIS_ENV", "dev") == "prod":
        raise RuntimeError(
            "AIRIS_WS_SECRET must be set in production (AIRIS_ENV=prod)"
        )
    _WS_SECRET = secrets.token_hex(32)
    logger.warning(
        "AIRIS_WS_SECRET not set; generated ephemeral dev secret. "
        "Connections will require the token printed at startup."
    )
_WS_EXPECTED_TOKEN = hashlib.sha256(_WS_SECRET.encode("utf-8")).hexdigest()


def _extract_token(websocket) -> str:
    """Pull the bearer token from query string, header, or first message."""
    # 1. Query string: ?token=<...>
    try:
        from urllib.parse import urlparse, parse_qs
        path = getattr(websocket, "path", "") or ""
        qs = parse_qs(urlparse(path).query)
        if "token" in qs and qs["token"]:
            return qs["token"][0]
    except Exception:
        pass
    # 2. Header (some clients)
    try:
        req_headers = websocket.request_headers
        auth = req_headers.get("Authorization", "") or req_headers.get("authorization", "")
        if auth.lower().startswith("bearer "):
            return auth[7:].strip()
        custom = req_headers.get("X-Airis-Token", "")
        if custom:
            return custom.strip()
    except Exception:
        pass
    return ""


async def handler(websocket):
    """Handle WebSocket connections and messages."""
    # Phase 1: enforce auth on connection. Without a valid token we close
    # with code 1008 (policy violation). The orchestrator is NOT exposed
    # to unauthenticated clients.
    provided = _extract_token(websocket)
    if not hmac.compare_digest(provided, _WS_EXPECTED_TOKEN):
        logger.warning("WebSocket connection rejected: invalid token")
        try:
            await websocket.close(code=1008, reason="Unauthorized")
        except Exception:
            pass
        return

    logger.info("New WebSocket connection established (authenticated)")

    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                logger.info(f"Received message: {data}")
                
                if "text" in data:
                    goal = data["text"]
                    max_loops = data.get("max_loops", 3)
                    
                    # Update max_loops if provided
                    if max_loops:
                        orchestrator.max_loops = max_loops
                    
                    # Send initial status
                    await websocket.send(json.dumps({
                        "type": "status",
                        "data": "Thinking",
                        "message": f"Processing: {goal[:100]}..."
                    }))
                    
                    # Define callback for real-time updates
                    def callback(update):
                        """Send real-time updates to client."""
                        try:
                            # Use asyncio to send without blocking
                            asyncio.create_task(
                                websocket.send(json.dumps(update))
                            )
                        except Exception as e:
                            logger.error(f"Failed to send update: {e}")
                    
                    # Run agent with callback
                    try:
                        result = orchestrator.run_agent(goal, callback)
                        
                        # Send final result
                        await websocket.send(json.dumps({
                            "type": "final",
                            "data": result,
                            "status": "done"
                        }))
                        
                    except Exception as e:
                        logger.error(f"Agent execution failed: {e}")
                        await websocket.send(json.dumps({
                            "type": "error",
                            "data": str(e),
                            "status": "error"
                        }))
                
                elif "type" in data and data["type"] == "ping":
                    # Respond to ping
                    await websocket.send(json.dumps({"type": "pong"}))
                
                else:
                    await websocket.send(json.dumps({
                        "type": "error",
                        "data": "Invalid message format"
                    }))
                    
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error: {e}")
                await websocket.send(json.dumps({
                    "type": "error",
                    "data": "Invalid JSON"
                }))
            except Exception as e:
                logger.error(f"Message handling error: {e}")
                await websocket.send(json.dumps({
                    "type": "error",
                    "data": str(e)
                }))
                
    except websockets.exceptions.ConnectionClosed:
        logger.info("WebSocket connection closed")
    except Exception as e:
        logger.error(f"WebSocket handler error: {e}")


async def main():
    """Start the WebSocket server."""
    logger.info("Starting WebSocket server on ws://localhost:8765")
    print("🚀 WebSocket Server started")
    print("📍 ws://localhost:8765")
    print("📡 Ready for connections...")
    # Phase 1: print the expected token so dev can use it. In prod this is
    # a per-process ephemeral secret and the token is meaningless to anyone
    # who did not start the process.
    print(f"🔐 Expected token (Phase 1, dev only): {_WS_EXPECTED_TOKEN}")
    
    async with websockets.serve(handler, "localhost", 8765):
        await asyncio.Future()  # Run forever


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    asyncio.run(main())
