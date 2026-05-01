"""
WebSocket Server - Real-time streaming for AI Assistant
Provides live updates of agent thinking and execution steps.
"""

import sys
import os
import asyncio
import json
import logging
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


async def handler(websocket):
    """Handle WebSocket connections and messages."""
    logger.info("New WebSocket connection established")
    
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
    
    async with websockets.serve(handler, "localhost", 8765):
        await asyncio.Future()  # Run forever


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    asyncio.run(main())
