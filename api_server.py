"""
API Server - FastAPI backend for AI Assistant
Provides HTTP endpoints for orchestrator and mobile app interaction.
"""

import sys
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import logging

# Setup path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from dotenv import load_dotenv
from config_paths import ensure_user_env, get_dotenv_path

# Initialize environment
ensure_user_env()
load_dotenv(get_dotenv_path(), override=True)

from orchestrator_v2 import SmartOrchestrator
from trading.signal_generator import SignalGenerator, get_data_source

logger = logging.getLogger(__name__)

app = FastAPI(title="AI Assistant API", version="2.0")

# Initialize orchestrator
orchestrator = SmartOrchestrator(max_loops=3)

# Initialize trading signal generator
signal_generator = SignalGenerator()


class InputRequest(BaseModel):
    text: str
    max_loops: Optional[int] = 3


class TradingRequest(BaseModel):
    symbol: str


class StatusResponse(BaseModel):
    status: str
    message: str


@app.get("/")
def root():
    """Health check endpoint."""
    return {"status": "online", "service": "AI Assistant API v2.0"}


@app.get("/status")
def status():
    """Get system status."""
    return {
        "status": "ready",
        "orchestrator": "active",
        "max_loops": orchestrator.max_loops
    }


@app.post("/run")
def run_task(request: InputRequest):
    """
    Execute a task through the SmartOrchestrator.
    
    Args:
        request: InputRequest with text and optional max_loops
        
    Returns:
        Result from orchestrator execution
    """
    try:
        # Update max_loops if provided
        if request.max_loops:
            orchestrator.max_loops = request.max_loops
        
        result = orchestrator.run(request.text)
        return {"result": result, "status": "success"}
    except Exception as e:
        logger.error(f"Task execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/intent")
def detect_intent(request: InputRequest):
    """
    Detect intent of input without full execution.
    
    Args:
        request: InputRequest with text
        
    Returns:
        Detected intent (COMMAND/GOAL/CHAT)
    """
    try:
        intent = orchestrator.detect_intent(request.text)
        return {"intent": intent, "status": "success"}
    except Exception as e:
        logger.error(f"Intent detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- Mobile App Endpoints ---

@app.get("/mobile/status")
def mobile_status():
    """Get mobile app status."""
    return {
        "status": "online",
        "features": {
            "chat": True,
            "voice": True,
            "trading": True,
            "multi_agent": True
        }
    }


@app.post("/mobile/chat")
def mobile_chat(request: InputRequest):
    """
    Mobile chat endpoint.
    
    Args:
        request: InputRequest with text
        
    Returns:
        Chat response
    """
    try:
        result = orchestrator.run(request.text)
        return {"response": result, "status": "success"}
    except Exception as e:
        logger.error(f"Mobile chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- Trading Endpoints ---

@app.post("/trading/signal")
def get_trading_signal(request: TradingRequest):
    """
    Get trading signal for a stock.
    
    Args:
        request: TradingRequest with symbol
        
    Returns:
        Trading signal with entry, target, stop-loss
    """
    try:
        signal = signal_generator.generate_signal(request.symbol)
        if signal:
            return {
                "symbol": signal.symbol,
                "signal": signal.signal,
                "confidence": signal.confidence,
                "entry": signal.entry,
                "target": signal.target,
                "stop_loss": signal.stop_loss,
                "reasoning": signal.reasoning,
                "status": "success"
            }
        else:
            raise HTTPException(status_code=404, detail="Could not generate signal")
    except Exception as e:
        logger.error(f"Trading signal failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/trading/market-summary")
def market_summary():
    """
    Get market summary for popular stocks.
    
    Returns:
        Market summary with buy/sell/hold counts
    """
    try:
        data_source = get_data_source()
        symbols = data_source.get_nse_stocks()
        summary = signal_generator.get_market_summary(symbols)
        return summary
    except Exception as e:
        logger.error(f"Market summary failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/trading/stock/{symbol}")
def get_stock_info(symbol: str):
    """
    Get stock information.
    
    Args:
        symbol: Stock symbol
        
    Returns:
        Stock information
    """
    try:
        data_source = get_data_source()
        info = data_source.get_company_info(symbol)
        if info:
            return info
        else:
            raise HTTPException(status_code=404, detail="Stock not found")
    except Exception as e:
        logger.error(f"Stock info failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting AI Assistant API Server...")
    print("📍 http://127.0.0.1:8000")
    print("📱 Mobile endpoints: /mobile/*")
    print("📈 Trading endpoints: /trading/*")
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
