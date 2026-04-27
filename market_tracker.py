"""
Market Watchlist & Portfolio Tracker
Persistent storage and management of watched stocks and holdings
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict, field
import logging

from indian_stock_api import get_api, StockData

logger = logging.getLogger(__name__)

WATCHLIST_DIR = "memory"
WATCHLIST_FILE = os.path.join(WATCHLIST_DIR, "watchlist.json")
PORTFOLIO_FILE = os.path.join(WATCHLIST_DIR, "portfolio.json")


@dataclass
class WatchlistItem:
    """Item in user's watchlist"""
    symbol: str
    exchange: str  # NSE or BSE
    added_date: str
    alert_price: Optional[float] = None
    alert_type: str = "any"  # "above", "below", "any"
    notes: str = ""
    last_price: float = 0.0
    last_update: str = ""


@dataclass
class PortfolioHolding:
    """Holdings in user's portfolio"""
    symbol: str
    exchange: str
    quantity: float
    buy_price: float
    buy_date: str
    cost_basis: float = 0.0
    current_price: float = 0.0
    current_value: float = 0.0
    gain_loss: float = 0.0
    gain_loss_pct: float = 0.0
    last_update: str = ""
    notes: str = ""


class Watchlist:
    """Manage user's watchlist"""
    
    def __init__(self):
        self.api = get_api()
        self.items: Dict[str, WatchlistItem] = {}
        self.load()
    
    def add(self, symbol: str, exchange: str = "NSE", alert_price: Optional[float] = None, 
            alert_type: str = "any", notes: str = "") -> bool:
        """Add stock to watchlist"""
        try:
            key = f"{symbol}_{exchange}"
            
            # Verify stock exists
            stock = self.api.get_stock(symbol, exchange)
            if not stock:
                logger.warning(f"Stock {symbol} not found on {exchange}")
                return False
            
            item = WatchlistItem(
                symbol=symbol,
                exchange=exchange,
                added_date=datetime.now().isoformat(),
                alert_price=alert_price,
                alert_type=alert_type,
                notes=notes,
                last_price=stock.last_price,
                last_update=datetime.now().isoformat()
            )
            
            self.items[key] = item
            self.save()
            logger.info(f"Added {symbol} to watchlist")
            return True
        except Exception as e:
            logger.error(f"Error adding to watchlist: {e}")
            return False
    
    def remove(self, symbol: str, exchange: str = "NSE") -> bool:
        """Remove stock from watchlist"""
        try:
            key = f"{symbol}_{exchange}"
            if key in self.items:
                del self.items[key]
                self.save()
                logger.info(f"Removed {symbol} from watchlist")
                return True
            return False
        except Exception as e:
            logger.error(f"Error removing from watchlist: {e}")
            return False
    
    def get_all(self) -> List[WatchlistItem]:
        """Get all watchlist items with current prices"""
        try:
            items_list = list(self.items.values())
            
            # Update prices
            for item in items_list:
                stock = self.api.get_stock(item.symbol, item.exchange)
                if stock:
                    item.last_price = stock.last_price
                    item.last_update = datetime.now().isoformat()
            
            self.save()
            return items_list
        except Exception as e:
            logger.error(f"Error getting watchlist: {e}")
            return list(self.items.values())
    
    def get_price_changes(self) -> Dict:
        """Get price changes for watchlist items"""
        changes = {}
        for item in self.get_all():
            stock = self.api.get_stock(item.symbol, item.exchange)
            if stock:
                changes[item.symbol] = {
                    "current_price": stock.last_price,
                    "change": stock.change,
                    "change_pct": stock.percent_change,
                    "exchange": item.exchange
                }
        return changes
    
    def check_alerts(self) -> List[Dict]:
        """Check if any price alerts should trigger"""
        alerts = []
        for item in self.get_all():
            if not item.alert_price:
                continue
            
            stock = self.api.get_stock(item.symbol, item.exchange)
            if not stock:
                continue
            
            should_alert = False
            if item.alert_type == "above" and stock.last_price >= item.alert_price:
                should_alert = True
            elif item.alert_type == "below" and stock.last_price <= item.alert_price:
                should_alert = True
            elif item.alert_type == "any":
                should_alert = True
            
            if should_alert:
                alerts.append({
                    "symbol": item.symbol,
                    "exchange": item.exchange,
                    "current_price": stock.last_price,
                    "alert_price": item.alert_price,
                    "change": stock.percent_change,
                    "message": f"{item.symbol} is now at ₹{stock.last_price:.2f} (Target: ₹{item.alert_price:.2f})"
                })
        
        return alerts
    
    def get_summary(self) -> Dict:
        """Get watchlist summary"""
        items = self.get_all()
        gainers = [i for i in items if self.api.get_stock(i.symbol, i.exchange) and self.api.get_stock(i.symbol, i.exchange).percent_change > 0]
        losers = [i for i in items if self.api.get_stock(i.symbol, i.exchange) and self.api.get_stock(i.symbol, i.exchange).percent_change < 0]
        
        return {
            "total_items": len(items),
            "gainers": len(gainers),
            "losers": len(losers),
            "items": items
        }
    
    def save(self):
        """Save watchlist to file"""
        try:
            os.makedirs(WATCHLIST_DIR, exist_ok=True)
            with open(WATCHLIST_FILE, 'w') as f:
                data = {key: asdict(item) for key, item in self.items.items()}
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving watchlist: {e}")
    
    def load(self):
        """Load watchlist from file"""
        try:
            if os.path.exists(WATCHLIST_FILE):
                with open(WATCHLIST_FILE, 'r') as f:
                    data = json.load(f)
                    self.items = {
                        key: WatchlistItem(**item) 
                        for key, item in data.items()
                    }
            else:
                self.items = {}
        except Exception as e:
            logger.error(f"Error loading watchlist: {e}")
            self.items = {}


class Portfolio:
    """Manage user's investment portfolio"""
    
    def __init__(self):
        self.api = get_api()
        self.holdings: Dict[str, PortfolioHolding] = {}
        self.load()
    
    def add_holding(self, symbol: str, quantity: float, buy_price: float, 
                   exchange: str = "NSE", buy_date: Optional[str] = None, notes: str = "") -> bool:
        """Add a holding to portfolio"""
        try:
            # Verify stock exists
            stock = self.api.get_stock(symbol, exchange)
            if not stock:
                logger.warning(f"Stock {symbol} not found on {exchange}")
                return False
            
            key = f"{symbol}_{exchange}"
            cost_basis = quantity * buy_price
            
            holding = PortfolioHolding(
                symbol=symbol,
                exchange=exchange,
                quantity=quantity,
                buy_price=buy_price,
                buy_date=buy_date or datetime.now().isoformat(),
                cost_basis=cost_basis,
                current_price=stock.last_price,
                current_value=quantity * stock.last_price,
                gain_loss=(quantity * stock.last_price) - cost_basis,
                gain_loss_pct=((quantity * stock.last_price - cost_basis) / cost_basis * 100) if cost_basis > 0 else 0,
                last_update=datetime.now().isoformat(),
                notes=notes
            )
            
            self.holdings[key] = holding
            self.save()
            logger.info(f"Added {quantity} shares of {symbol} to portfolio")
            return True
        except Exception as e:
            logger.error(f"Error adding holding: {e}")
            return False
    
    def remove_holding(self, symbol: str, exchange: str = "NSE") -> bool:
        """Remove a holding from portfolio"""
        try:
            key = f"{symbol}_{exchange}"
            if key in self.holdings:
                del self.holdings[key]
                self.save()
                logger.info(f"Removed {symbol} from portfolio")
                return True
            return False
        except Exception as e:
            logger.error(f"Error removing holding: {e}")
            return False
    
    def update_prices(self) -> bool:
        """Update current prices for all holdings"""
        try:
            for key, holding in self.holdings.items():
                stock = self.api.get_stock(holding.symbol, holding.exchange)
                if stock:
                    holding.current_price = stock.last_price
                    holding.current_value = holding.quantity * stock.last_price
                    holding.gain_loss = holding.current_value - holding.cost_basis
                    holding.gain_loss_pct = (holding.gain_loss / holding.cost_basis * 100) if holding.cost_basis > 0 else 0
                    holding.last_update = datetime.now().isoformat()
            
            self.save()
            return True
        except Exception as e:
            logger.error(f"Error updating prices: {e}")
            return False
    
    def get_all_holdings(self) -> List[PortfolioHolding]:
        """Get all portfolio holdings with updated prices"""
        self.update_prices()
        return list(self.holdings.values())
    
    def get_portfolio_value(self) -> Tuple[float, float, float, float]:
        """Get total portfolio value and gains/losses
        
        Returns:
            (total_cost_basis, total_current_value, total_gain_loss, total_gain_loss_pct)
        """
        holdings = self.get_all_holdings()
        
        total_cost = sum(h.cost_basis for h in holdings)
        total_value = sum(h.current_value for h in holdings)
        total_gain = total_value - total_cost
        total_gain_pct = (total_gain / total_cost * 100) if total_cost > 0 else 0
        
        return total_cost, total_value, total_gain, total_gain_pct
    
    def get_diversification(self) -> Dict[str, float]:
        """Get portfolio allocation by symbol"""
        holdings = self.get_all_holdings()
        total_value = sum(h.current_value for h in holdings)
        
        if total_value == 0:
            return {}
        
        return {
            h.symbol: (h.current_value / total_value * 100)
            for h in holdings
        }
    
    def get_sector_allocation(self) -> Dict[str, float]:
        """Get portfolio allocation by sector"""
        holdings = self.get_all_holdings()
        sector_value = {}
        total_value = sum(h.current_value for h in holdings)
        
        for holding in holdings:
            stock = self.api.get_stock(holding.symbol, holding.exchange)
            if stock:
                sector = stock.sector or "Unknown"
                if sector not in sector_value:
                    sector_value[sector] = 0
                sector_value[sector] += holding.current_value
        
        if total_value == 0:
            return {}
        
        return {
            sector: (value / total_value * 100)
            for sector, value in sector_value.items()
        }
    
    def get_gainers(self, limit: int = 5) -> List[PortfolioHolding]:
        """Get top performing holdings"""
        holdings = self.get_all_holdings()
        holdings.sort(key=lambda h: h.gain_loss_pct, reverse=True)
        return holdings[:limit]
    
    def get_losers(self, limit: int = 5) -> List[PortfolioHolding]:
        """Get worst performing holdings"""
        holdings = self.get_all_holdings()
        holdings.sort(key=lambda h: h.gain_loss_pct)
        return holdings[:limit]
    
    def get_summary(self) -> Dict:
        """Get portfolio summary"""
        holdings = self.get_all_holdings()
        total_cost, total_value, total_gain, total_gain_pct = self.get_portfolio_value()
        
        return {
            "total_holdings": len(holdings),
            "total_cost_basis": total_cost,
            "total_current_value": total_value,
            "total_gain_loss": total_gain,
            "total_gain_loss_pct": total_gain_pct,
            "diversification": self.get_diversification(),
            "sector_allocation": self.get_sector_allocation(),
            "best_performer": self.get_gainers(1)[0] if self.get_gainers(1) else None,
            "worst_performer": self.get_losers(1)[0] if self.get_losers(1) else None
        }
    
    def save(self):
        """Save portfolio to file"""
        try:
            os.makedirs(WATCHLIST_DIR, exist_ok=True)
            with open(PORTFOLIO_FILE, 'w') as f:
                data = {key: asdict(holding) for key, holding in self.holdings.items()}
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving portfolio: {e}")
    
    def load(self):
        """Load portfolio from file"""
        try:
            if os.path.exists(PORTFOLIO_FILE):
                with open(PORTFOLIO_FILE, 'r') as f:
                    data = json.load(f)
                    self.holdings = {
                        key: PortfolioHolding(**holding)
                        for key, holding in data.items()
                    }
            else:
                self.holdings = {}
        except Exception as e:
            logger.error(f"Error loading portfolio: {e}")
            self.holdings = {}


# Singleton instances
_watchlist_instance = None
_portfolio_instance = None


def get_watchlist() -> Watchlist:
    """Get singleton watchlist instance"""
    global _watchlist_instance
    if _watchlist_instance is None:
        _watchlist_instance = Watchlist()
    return _watchlist_instance


def get_portfolio() -> Portfolio:
    """Get singleton portfolio instance"""
    global _portfolio_instance
    if _portfolio_instance is None:
        _portfolio_instance = Portfolio()
    return _portfolio_instance
