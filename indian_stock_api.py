"""
Indian Stock Market API Client
Wrapper for free NSE & BSE real-time stock data API
Base URL: http://65.0.104.9/
"""

import requests
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

BASE_URL = "http://65.0.104.9"


@dataclass
class StockData:
    """Real-time stock data from NSE/BSE"""
    symbol: str
    company_name: str
    exchange: str  # NSE or BSE
    ticker: str
    last_price: float
    change: float
    percent_change: float
    previous_close: float
    open: float
    day_high: float
    day_low: float
    year_high: float
    year_low: float
    volume: float
    market_cap: float
    pe_ratio: float
    dividend_yield: float
    book_value: float
    earnings_per_share: float
    sector: str
    industry: str
    currency: str
    timestamp: str


@dataclass
class SearchResult:
    """Search result for a stock"""
    symbol: str
    company_name: str
    nse_ticker: str
    bse_ticker: str
    match_type: str


class IndianStockAPI:
    """Client for Indian Stock Market API"""
    
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.popular_stocks = [
            "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
            "BHARTIARTL", "SBIN", "ITC", "HINDUNILVR", "IOC",
            "LT", "ASIANPAINT", "MARUTI", "BAJFINANCE", "TITAN",
            "WIPRO", "ADANIGREEN", "SUNPHARMA", "TATASTEEL", "AXISBANK",
            "JSWSTEEL", "ULTRACEMCO", "GRASIM", "HINDALCO", "NTPC"
        ]
    
    def search(self, query: str) -> List[SearchResult]:
        """Search for stocks by company name or symbol"""
        try:
            response = self.session.get(
                f"{self.base_url}/search",
                params={"q": query},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "success":
                results = []
                for item in data.get("results", []):
                    results.append(SearchResult(
                        symbol=item.get("symbol", ""),
                        company_name=item.get("company_name", ""),
                        nse_ticker=f"{item.get('symbol', '')}.NS",
                        bse_ticker=f"{item.get('symbol', '')}.BO",
                        match_type=item.get("match_type", "")
                    ))
                return results
            return []
        except Exception as e:
            logger.error(f"Search error: {e}")
            return []
    
    def get_stock(self, symbol: str, exchange: str = "NSE", res: str = "num") -> Optional[StockData]:
        """Get single stock details
        
        Args:
            symbol: Stock symbol (e.g., 'RELIANCE')
            exchange: 'NSE' or 'BSE'
            res: 'num' (numbers only) or 'val' (with units)
        """
        try:
            # Add exchange suffix
            ticker = f"{symbol}.NS" if exchange == "NSE" else f"{symbol}.BO"
            
            response = self.session.get(
                f"{self.base_url}/stock",
                params={"symbol": ticker, "res": res},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "success":
                stock_data = data.get("data", {})
                
                # Handle different response formats
                if res == "val":
                    # Extract numeric values from units format
                    stock_data = self._extract_numeric_values(stock_data)
                
                return StockData(
                    symbol=symbol,
                    company_name=stock_data.get("company_name", ""),
                    exchange=data.get("exchange", exchange),
                    ticker=data.get("ticker", ticker),
                    last_price=self._get_value(stock_data, "last_price"),
                    change=self._get_value(stock_data, "change"),
                    percent_change=self._get_value(stock_data, "percent_change"),
                    previous_close=self._get_value(stock_data, "previous_close"),
                    open=self._get_value(stock_data, "open"),
                    day_high=self._get_value(stock_data, "day_high"),
                    day_low=self._get_value(stock_data, "day_low"),
                    year_high=self._get_value(stock_data, "year_high"),
                    year_low=self._get_value(stock_data, "year_low"),
                    volume=self._get_value(stock_data, "volume"),
                    market_cap=self._get_value(stock_data, "market_cap"),
                    pe_ratio=self._get_value(stock_data, "pe_ratio"),
                    dividend_yield=self._get_value(stock_data, "dividend_yield"),
                    book_value=self._get_value(stock_data, "book_value"),
                    earnings_per_share=self._get_value(stock_data, "earnings_per_share"),
                    sector=stock_data.get("sector", ""),
                    industry=stock_data.get("industry", ""),
                    currency=stock_data.get("currency", "INR"),
                    timestamp=stock_data.get("timestamp", datetime.now().isoformat())
                )
            else:
                logger.warning(f"API error for {symbol}: {data.get('message')}")
                return None
        except Exception as e:
            logger.error(f"Error fetching stock {symbol}: {e}")
            return None
    
    def get_multiple_stocks(self, symbols: List[str], exchange: str = "NSE", res: str = "num") -> List[StockData]:
        """Get data for multiple stocks
        
        Args:
            symbols: List of stock symbols
            exchange: 'NSE' or 'BSE'
            res: 'num' or 'val'
        """
        try:
            # Format symbols with exchange suffix
            tickers = [f"{sym}.NS" if exchange == "NSE" else f"{sym}.BO" for sym in symbols]
            symbols_str = ",".join(tickers)
            
            response = self.session.get(
                f"{self.base_url}/stock/list",
                params={"symbols": symbols_str, "res": res},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "success":
                results = []
                for stock in data.get("stocks", []):
                    if res == "val":
                        stock = self._extract_numeric_values(stock)
                    
                    results.append(StockData(
                        symbol=stock.get("symbol", ""),
                        company_name=stock.get("company_name", ""),
                        exchange=stock.get("exchange", exchange),
                        ticker=stock.get("ticker", ""),
                        last_price=self._get_value(stock, "last_price"),
                        change=self._get_value(stock, "change"),
                        percent_change=self._get_value(stock, "percent_change"),
                        previous_close=self._get_value(stock, "previous_close"),
                        open=self._get_value(stock, "open"),
                        day_high=self._get_value(stock, "day_high"),
                        day_low=self._get_value(stock, "day_low"),
                        year_high=self._get_value(stock, "year_high"),
                        year_low=self._get_value(stock, "year_low"),
                        volume=self._get_value(stock, "volume"),
                        market_cap=self._get_value(stock, "market_cap"),
                        pe_ratio=self._get_value(stock, "pe_ratio"),
                        dividend_yield=self._get_value(stock, "dividend_yield"),
                        book_value=self._get_value(stock, "book_value"),
                        earnings_per_share=self._get_value(stock, "earnings_per_share"),
                        sector=stock.get("sector", ""),
                        industry=stock.get("industry", ""),
                        currency=stock.get("currency", "INR"),
                        timestamp=datetime.now().isoformat()
                    ))
                return results
            return []
        except Exception as e:
            logger.error(f"Error fetching multiple stocks: {e}")
            return []
    
    def get_symbols(self) -> List[Dict]:
        """Get list of all available cached symbols"""
        try:
            response = self.session.get(
                f"{self.base_url}/symbols",
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "success":
                return data.get("symbols", [])
            return []
        except Exception as e:
            logger.error(f"Error fetching symbols: {e}")
            return []
    
    def compare_exchanges(self, symbol: str) -> Dict:
        """Compare stock prices between NSE and BSE"""
        try:
            nse_data = self.get_stock(symbol, "NSE", "num")
            bse_data = self.get_stock(symbol, "BSE", "num")
            
            if nse_data and bse_data:
                nse_price = nse_data.last_price
                bse_price = bse_data.last_price
                price_diff = nse_price - bse_price
                price_diff_pct = (price_diff / bse_price * 100) if bse_price > 0 else 0
                
                return {
                    "symbol": symbol,
                    "nse_price": nse_price,
                    "bse_price": bse_price,
                    "price_difference": price_diff,
                    "price_diff_percentage": price_diff_pct,
                    "nse_volume": nse_data.volume,
                    "bse_volume": bse_data.volume,
                    "arbitrage_opportunity": abs(price_diff_pct) > 0.5,  # >0.5% difference
                    "recommended_exchange": "NSE" if nse_data.volume > bse_data.volume else "BSE"
                }
            return {}
        except Exception as e:
            logger.error(f"Error comparing exchanges: {e}")
            return {}
    
    def get_top_gainers(self, limit: int = 10) -> List[StockData]:
        """Get top gaining stocks from popular list"""
        gainers = []
        for symbol in self.popular_stocks[:limit]:
            stock = self.get_stock(symbol)
            if stock and stock.percent_change > 0:
                gainers.append(stock)
        
        gainers.sort(key=lambda x: x.percent_change, reverse=True)
        return gainers[:limit]
    
    def get_top_losers(self, limit: int = 10) -> List[StockData]:
        """Get top losing stocks from popular list"""
        losers = []
        for symbol in self.popular_stocks[:limit]:
            stock = self.get_stock(symbol)
            if stock and stock.percent_change < 0:
                losers.append(stock)
        
        losers.sort(key=lambda x: x.percent_change)
        return losers[:limit]
    
    def get_sector_leaders(self, sector: str) -> List[StockData]:
        """Get top stocks in a sector"""
        stocks = []
        for symbol in self.popular_stocks:
            stock = self.get_stock(symbol)
            if stock and stock.sector == sector:
                stocks.append(stock)
        
        stocks.sort(key=lambda x: x.percent_change, reverse=True)
        return stocks
    
    def generate_market_summary(self) -> Dict:
        """Generate daily market summary"""
        popular = self.get_multiple_stocks(self.popular_stocks[:10])
        
        if not popular:
            return {}
        
        gainers = [s for s in popular if s.percent_change > 0]
        losers = [s for s in popular if s.percent_change < 0]
        
        avg_change = sum(s.percent_change for s in popular) / len(popular)
        total_volume = sum(s.volume for s in popular)
        
        return {
            "timestamp": datetime.now().isoformat(),
            "total_stocks_tracked": len(popular),
            "gainers": len(gainers),
            "losers": len(losers),
            "average_change": avg_change,
            "total_volume": total_volume,
            "top_gainer": max(popular, key=lambda x: x.percent_change) if popular else None,
            "top_loser": min(popular, key=lambda x: x.percent_change) if popular else None,
            "market_sentiment": "Bullish" if avg_change > 0.5 else ("Bearish" if avg_change < -0.5 else "Neutral")
        }
    
    @staticmethod
    def _get_value(data: Dict, key: str) -> float:
        """Extract numeric value handling both num and val formats"""
        value = data.get(key, 0)
        if isinstance(value, dict):
            return float(value.get("value", 0))
        return float(value) if value else 0
    
    @staticmethod
    def _extract_numeric_values(data: Dict) -> Dict:
        """Convert values-with-units format to numeric"""
        extracted = {}
        for key, value in data.items():
            if isinstance(value, dict) and "value" in value:
                extracted[key] = value["value"]
            else:
                extracted[key] = value
        return extracted


# Singleton instance
_api_instance = None


def get_api() -> IndianStockAPI:
    """Get singleton API instance"""
    global _api_instance
    if _api_instance is None:
        _api_instance = IndianStockAPI()
    return _api_instance
