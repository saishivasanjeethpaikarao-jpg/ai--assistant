"""
Trading Router - Stock market data and portfolio management
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import database
import sqlite3

router = APIRouter()

class PortfolioItem(BaseModel):
    symbol: str
    quantity: float
    buy_price: float
    buy_date: Optional[str] = None

class WatchlistItem(BaseModel):
    symbol: str

def get_db():
    """Get database connection"""
    conn = sqlite3.connect("/opt/render/project/data/airis.db")
    conn.row_factory = sqlite3.Row
    return conn

@router.get("/market/indices")
def get_market_indices():
    """Get major market indices"""
    return {
        "indices": [
            {"symbol": "NIFTY50", "name": "Nifty 50", "value": 0, "change": 0},
            {"symbol": "SENSEX", "name": "BSE Sensex", "value": 0, "change": 0},
            {"symbol": "NIFTYIT", "name": "Nifty IT", "value": 0, "change": 0},
            {"symbol": "NIFTYBANK", "name": "Nifty Bank", "value": 0, "change": 0},
        ]
    }

@router.get("/market/quote")
def get_market_quote(symbol: str):
    """Get stock quote"""
    return {
        "symbol": symbol,
        "price": 0,
        "change": 0,
        "change_percent": 0,
        "high": 0,
        "low": 0,
        "volume": 0
    }

@router.get("/market/search")
def search_stocks(q: str):
    """Search for stocks"""
    return {
        "results": [
            {"symbol": "INFY", "name": "Infosys Limited"},
            {"symbol": "TCS", "name": "Tata Consultancy Services"},
            {"symbol": "WIPRO", "name": "Wipro Limited"},
        ]
    }

@router.get("/market/movers")
def get_market_movers():
    """Get top gainers and losers"""
    return {
        "gainers": [],
        "losers": []
    }

@router.get("/trading/portfolio")
def get_portfolio(user_id: Optional[str] = None):
    """Get user portfolio"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        if user_id:
            cursor.execute(
                "SELECT * FROM portfolio WHERE user_id = ?",
                (user_id,)
            )
        else:
            cursor.execute("SELECT * FROM portfolio")
        
        rows = cursor.fetchall()
        conn.close()
        
        portfolio = []
        for row in rows:
            portfolio.append({
                "id": row["id"],
                "symbol": row["symbol"],
                "quantity": row["quantity"],
                "buy_price": row["buy_price"],
                "buy_date": row["buy_date"]
            })
        
        return {"portfolio": portfolio}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trading/portfolio")
def add_to_portfolio(item: PortfolioItem, user_id: Optional[str] = None):
    """Add item to portfolio"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute(
            "INSERT INTO portfolio (user_id, symbol, quantity, buy_price, buy_date) VALUES (?, ?, ?, ?, ?)",
            (user_id, item.symbol, item.quantity, item.buy_price, item.buy_date)
        )
        conn.commit()
        portfolio_id = cursor.lastrowid
        conn.close()
        
        return {
            "success": True,
            "id": portfolio_id,
            "symbol": item.symbol
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/trading/portfolio/{symbol}")
def remove_from_portfolio(symbol: str, user_id: Optional[str] = None):
    """Remove item from portfolio"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        if user_id:
            cursor.execute(
                "DELETE FROM portfolio WHERE symbol = ? AND user_id = ?",
                (symbol, user_id)
            )
        else:
            cursor.execute("DELETE FROM portfolio WHERE symbol = ?", (symbol,))
        
        conn.commit()
        conn.close()
        
        return {"success": True, "message": f"Removed {symbol} from portfolio"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trading/watchlist")
def get_watchlist(user_id: Optional[str] = None):
    """Get user watchlist"""
    return {
        "watchlist": [
            {"symbol": "INFY", "name": "Infosys"},
            {"symbol": "TCS", "name": "TCS"},
        ]
    }

@router.post("/trading/watchlist")
def add_to_watchlist(item: WatchlistItem, user_id: Optional[str] = None):
    """Add to watchlist"""
    return {
        "success": True,
        "symbol": item.symbol
    }

@router.delete("/trading/watchlist/{symbol}")
def remove_from_watchlist(symbol: str, user_id: Optional[str] = None):
    """Remove from watchlist"""
    return {
        "success": True,
        "message": f"Removed {symbol} from watchlist"
    }
