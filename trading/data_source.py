"""
Real Trading Data Source - Yahoo Finance integration
Provides real market data, not AI-generated guesses.
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta

try:
    import yfinance as yf
    _yfinance_available = True
except ImportError:
    _yfinance_available = False

logger = logging.getLogger(__name__)


class RealDataSource:
    """Real market data provider using Yahoo Finance."""
    
    def __init__(self):
        self.available = _yfinance_available
        if not self.available:
            logger.warning("yfinance not available - trading data will be limited")
    
    def get_stock_data(self, symbol: str, period: str = "1mo") -> Optional[Dict]:
        """
        Get historical stock data.
        
        Args:
            symbol: Stock symbol (e.g., "RELIANCE.NS" for NSE)
            period: Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            
        Returns:
            Dictionary with OHLCV data or None
        """
        if not self.available:
            return None
        
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period)
            
            if hist.empty:
                logger.warning(f"No data found for {symbol}")
                return None
            
            # Convert to dictionary
            data = {
                "symbol": symbol,
                "period": period,
                "dates": hist.index.strftime("%Y-%m-%d").tolist(),
                "open": hist['Open'].tolist(),
                "high": hist['High'].tolist(),
                "low": hist['Low'].tolist(),
                "close": hist['Close'].tolist(),
                "volume": hist['Volume'].tolist(),
                "current_price": hist['Close'].iloc[-1]
            }
            
            logger.info(f"Retrieved {len(data['dates'])} data points for {symbol}")
            return data
            
        except Exception as e:
            logger.error(f"Failed to get data for {symbol}: {e}")
            return None
    
    def get_current_price(self, symbol: str) -> Optional[float]:
        """
        Get current stock price.
        
        Args:
            symbol: Stock symbol
            
        Returns:
            Current price or None
        """
        if not self.available:
            return None
        
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            if 'currentPrice' in info:
                return info['currentPrice']
            elif 'regularMarketPrice' in info:
                return info['regularMarketPrice']
            else:
                # Fallback to latest close
                hist = ticker.history(period="5d")
                if not hist.empty:
                    return hist['Close'].iloc[-1]
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get price for {symbol}: {e}")
            return None
    
    def get_company_info(self, symbol: str) -> Optional[Dict]:
        """
        Get company information.
        
        Args:
            symbol: Stock symbol
            
        Returns:
            Company info dictionary or None
        """
        if not self.available:
            return None
        
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            company_data = {
                "symbol": symbol,
                "name": info.get("longName", "N/A"),
                "sector": info.get("sector", "N/A"),
                "industry": info.get("industry", "N/A"),
                "market_cap": info.get("marketCap", 0),
                "pe_ratio": info.get("trailingPE", 0),
                "dividend_yield": info.get("dividendYield", 0),
                "52_week_high": info.get("fiftyTwoWeekHigh", 0),
                "52_week_low": info.get("fiftyTwoWeekLow", 0),
            }
            
            return company_data
            
        except Exception as e:
            logger.error(f"Failed to get company info for {symbol}: {e}")
            return None
    
    def get_nse_stocks(self) -> List[str]:
        """
        Get list of popular NSE stocks.
        
        Returns:
            List of NSE stock symbols
        """
        # Popular NSE stocks
        nse_stocks = [
            "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
            "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "KOTAKBANK.NS", "LT.NS",
            "HINDUNILVR.NS", "AXISBANK.NS", "BAJFINANCE.NS", "MARUTI.NS", "HCLTECH.NS"
        ]
        return nse_stocks


# Singleton instance
_data_source: Optional[RealDataSource] = None


def get_data_source() -> RealDataSource:
    """Get or create data source instance."""
    global _data_source
    if _data_source is None:
        _data_source = RealDataSource()
    return _data_source
