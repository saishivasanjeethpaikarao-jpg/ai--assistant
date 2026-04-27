"""
Enhanced Indian Stock Market API Integration
Leveraging: http://65.0.104.9/ - NSE & BSE Real-time Data

Features:
- Search stocks by company name
- Real-time NSE/BSE prices
- Compare exchanges (NSE vs BSE)
- Batch stock queries
- Multiple response formats (num / val)
- 30+ pre-cached popular stocks
- No API keys required
- Rate limit: 60 requests/minute
"""

import requests
import json
import time
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Tuple
from enum import Enum
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

API_BASE_URL = "http://65.0.104.9"
CACHE_TTL = 300  # 5 minutes
RATE_LIMIT = 60  # requests per minute
REQUEST_TIMEOUT = 10

# ============================================================================
# ENUMS & DATA CLASSES
# ============================================================================

class Exchange(Enum):
    """Stock exchange"""
    NSE = "NSE"
    BSE = "BSE"

class ResponseFormat(Enum):
    """Response format types"""
    NUMERIC = "num"      # Numbers only
    VALUES = "val"       # Values with units

@dataclass
class StockPrice:
    """Stock price information"""
    symbol: str
    exchange: str
    ticker: str
    company_name: str
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
    last_update: str
    timestamp: str

@dataclass
class SearchResult:
    """Search result for stock"""
    symbol: str
    company_name: str
    match_type: str
    nse_ticker: str
    bse_ticker: str
    nse_url: str
    bse_url: str

@dataclass
class ExchangeComparison:
    """Comparison of stock across exchanges"""
    symbol: str
    nse_price: Optional[float]
    bse_price: Optional[float]
    nse_change: Optional[float]
    bse_change: Optional[float]
    difference: Optional[float]
    better_exchange: Optional[str]

# ============================================================================
# CACHE MANAGEMENT
# ============================================================================

class PriceCache:
    """Simple in-memory cache for stock prices"""
    
    def __init__(self, ttl_seconds=CACHE_TTL):
        self.cache = {}
        self.ttl = ttl_seconds
    
    def get(self, key: str) -> Optional[Dict]:
        """Get cached value if not expired"""
        if key in self.cache:
            data, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl:
                return data
            else:
                del self.cache[key]
        return None
    
    def set(self, key: str, value: Dict) -> None:
        """Set cached value with timestamp"""
        self.cache[key] = (value, time.time())
    
    def clear(self) -> None:
        """Clear all cache"""
        self.cache.clear()

# ============================================================================
# MAIN API CLASS
# ============================================================================

class EnhancedIndianStockAPI:
    """
    Enhanced wrapper for Indian Stock Market API
    http://65.0.104.9/
    """
    
    def __init__(self, base_url: str = API_BASE_URL):
        self.base_url = base_url
        self.cache = PriceCache()
        self.request_count = 0
        self.last_request_time = 0
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Trading-System/1.0'
        })
    
    def _make_request(self, endpoint: str, params: Dict = None) -> Dict:
        """
        Make API request with rate limiting and caching
        """
        # Rate limiting
        time_since_last = time.time() - self.last_request_time
        if time_since_last < (60 / RATE_LIMIT):
            time.sleep((60 / RATE_LIMIT) - time_since_last)
        
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = self.session.get(url, params=params, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            self.last_request_time = time.time()
            self.request_count += 1
            
            return response.json()
        
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    # ========================================================================
    # SEARCH ENDPOINTS
    # ========================================================================
    
    def search(self, query: str) -> List[SearchResult]:
        """
        Search for stocks by company name or symbol
        
        Args:
            query: Company name or stock symbol
            
        Returns:
            List of search results
        """
        cache_key = f"search_{query.lower()}"
        cached = self.cache.get(cache_key)
        if cached:
            logger.info(f"Cache hit for search: {query}")
            return [SearchResult(**r) for r in cached]
        
        response = self._make_request('/search', {'q': query})
        
        if response.get('status') == 'success':
            results = []
            for item in response.get('results', []):
                result = SearchResult(
                    symbol=item.get('symbol'),
                    company_name=item.get('company_name'),
                    match_type=item.get('match_type'),
                    nse_ticker=item.get('symbol', '') + '.NS',
                    bse_ticker=item.get('symbol', '') + '.BO',
                    nse_url=f"/stock?symbol={item.get('symbol')}.NS",
                    bse_url=f"/stock?symbol={item.get('symbol')}.BO"
                )
                results.append(result)
            
            # Cache results
            self.cache.set(cache_key, [asdict(r) for r in results])
            return results
        
        return []
    
    # ========================================================================
    # SINGLE STOCK ENDPOINTS
    # ========================================================================
    
    def get_stock(self, symbol: str, exchange: Exchange = Exchange.NSE, 
                  response_format: ResponseFormat = ResponseFormat.NUMERIC) -> Optional[StockPrice]:
        """
        Get single stock details
        
        Args:
            symbol: Stock symbol (e.g., 'RELIANCE', 'ITC')
            exchange: NSE or BSE (default: NSE)
            response_format: Response format (num or val)
            
        Returns:
            StockPrice object or None
        """
        # Add exchange suffix if not present
        if not (symbol.endswith('.NS') or symbol.endswith('.BO')):
            symbol = f"{symbol}.{exchange.value[0:2]}"
        
        cache_key = f"stock_{symbol}_{response_format.value}"
        cached = self.cache.get(cache_key)
        if cached:
            logger.info(f"Cache hit for stock: {symbol}")
            return StockPrice(**cached)
        
        params = {
            'symbol': symbol,
            'res': response_format.value
        }
        
        response = self._make_request('/stock', params)
        
        if response.get('status') == 'success':
            data = response.get('data', {})
            stock = StockPrice(
                symbol=response.get('symbol'),
                exchange=response.get('exchange'),
                ticker=response.get('ticker'),
                company_name=data.get('company_name'),
                last_price=self._extract_numeric(data.get('last_price')),
                change=self._extract_numeric(data.get('change')),
                percent_change=self._extract_numeric(data.get('percent_change')),
                previous_close=self._extract_numeric(data.get('previous_close')),
                open=self._extract_numeric(data.get('open')),
                day_high=self._extract_numeric(data.get('day_high')),
                day_low=self._extract_numeric(data.get('day_low')),
                year_high=self._extract_numeric(data.get('year_high')),
                year_low=self._extract_numeric(data.get('year_low')),
                volume=self._extract_numeric(data.get('volume')),
                market_cap=self._extract_numeric(data.get('market_cap')),
                pe_ratio=self._extract_numeric(data.get('pe_ratio')),
                dividend_yield=self._extract_numeric(data.get('dividend_yield')),
                book_value=self._extract_numeric(data.get('book_value')),
                earnings_per_share=self._extract_numeric(data.get('earnings_per_share')),
                sector=data.get('sector'),
                industry=data.get('industry'),
                currency=data.get('currency'),
                last_update=data.get('last_update'),
                timestamp=data.get('timestamp')
            )
            
            # Cache result
            self.cache.set(cache_key, asdict(stock))
            return stock
        
        logger.warning(f"Failed to fetch stock {symbol}: {response.get('message')}")
        return None
    
    # ========================================================================
    # BATCH ENDPOINTS
    # ========================================================================
    
    def get_multiple_stocks(self, symbols: List[str], 
                          response_format: ResponseFormat = ResponseFormat.NUMERIC) -> List[StockPrice]:
        """
        Get multiple stocks in one request
        
        Args:
            symbols: List of stock symbols
            response_format: Response format
            
        Returns:
            List of StockPrice objects
        """
        # Join symbols with comma
        symbols_str = ','.join(symbols)
        cache_key = f"batch_{symbols_str}_{response_format.value}"
        
        cached = self.cache.get(cache_key)
        if cached:
            logger.info(f"Cache hit for batch: {symbols}")
            return [StockPrice(**s) for s in cached]
        
        params = {
            'symbols': symbols_str,
            'res': response_format.value
        }
        
        response = self._make_request('/stock/list', params)
        
        stocks = []
        if response.get('status') == 'success':
            for item in response.get('stocks', []):
                stock = StockPrice(
                    symbol=item.get('symbol'),
                    exchange=item.get('exchange'),
                    ticker=item.get('ticker'),
                    company_name=item.get('company_name'),
                    last_price=self._extract_numeric(item.get('last_price')),
                    change=self._extract_numeric(item.get('change')),
                    percent_change=self._extract_numeric(item.get('percent_change')),
                    previous_close=0,
                    open=self._extract_numeric(item.get('open', 0)),
                    day_high=self._extract_numeric(item.get('day_high', 0)),
                    day_low=self._extract_numeric(item.get('day_low', 0)),
                    year_high=self._extract_numeric(item.get('year_high', 0)),
                    year_low=self._extract_numeric(item.get('year_low', 0)),
                    volume=self._extract_numeric(item.get('volume')),
                    market_cap=self._extract_numeric(item.get('market_cap')),
                    pe_ratio=self._extract_numeric(item.get('pe_ratio')),
                    dividend_yield=0,
                    book_value=0,
                    earnings_per_share=0,
                    sector=item.get('sector', ''),
                    industry='',
                    currency='INR',
                    last_update=datetime.now().isoformat(),
                    timestamp=response.get('timestamp', datetime.now().isoformat())
                )
                stocks.append(stock)
            
            # Cache results
            self.cache.set(cache_key, [asdict(s) for s in stocks])
        
        return stocks
    
    # ========================================================================
    # MARKET DATA ENDPOINTS
    # ========================================================================
    
    def get_all_symbols(self) -> List[Dict]:
        """Get all available cached symbols"""
        cache_key = "all_symbols"
        cached = self.cache.get(cache_key)
        if cached:
            return cached
        
        response = self._make_request('/symbols')
        
        if response.get('status') == 'success':
            symbols = response.get('symbols', [])
            self.cache.set(cache_key, symbols)
            return symbols
        
        return []
    
    def get_top_gainers(self, limit: int = 10) -> List[Dict]:
        """
        Get top gaining stocks
        Note: Fetch gainers from popular symbols and sort by change
        """
        popular_symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 
                          'SBIN', 'BHARTIARTL', 'HINDUNILVR', 'IOC', 'ASIANPAINT']
        
        stocks = self.get_multiple_stocks(popular_symbols)
        
        # Sort by percent_change descending
        gainers = sorted(stocks, key=lambda x: x.percent_change, reverse=True)
        
        return [asdict(s) for s in gainers[:limit]]
    
    def get_top_losers(self, limit: int = 10) -> List[Dict]:
        """
        Get top losing stocks
        """
        popular_symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK',
                          'SBIN', 'BHARTIARTL', 'HINDUNILVR', 'IOC', 'ASIANPAINT']
        
        stocks = self.get_multiple_stocks(popular_symbols)
        
        # Sort by percent_change ascending
        losers = sorted(stocks, key=lambda x: x.percent_change)
        
        return [asdict(s) for s in losers[:limit]]
    
    # ========================================================================
    # COMPARISON ENDPOINTS
    # ========================================================================
    
    def compare_exchanges(self, symbol: str) -> ExchangeComparison:
        """
        Compare stock price across NSE and BSE
        
        Args:
            symbol: Stock symbol
            
        Returns:
            ExchangeComparison with prices on both exchanges
        """
        nse_stock = self.get_stock(symbol, Exchange.NSE)
        bse_stock = self.get_stock(symbol, Exchange.BSE)
        
        nse_price = nse_stock.last_price if nse_stock else None
        bse_price = bse_stock.last_price if bse_stock else None
        
        difference = None
        if nse_price and bse_price:
            difference = abs(nse_price - bse_price)
        
        better_exchange = None
        if nse_price and bse_price:
            better_exchange = "NSE" if nse_price > bse_price else "BSE"
        
        return ExchangeComparison(
            symbol=symbol,
            nse_price=nse_price,
            bse_price=bse_price,
            nse_change=nse_stock.change if nse_stock else None,
            bse_change=bse_stock.change if bse_stock else None,
            difference=difference,
            better_exchange=better_exchange
        )
    
    # ========================================================================
    # UTILITY METHODS
    # ========================================================================
    
    def _extract_numeric(self, value) -> float:
        """Extract numeric value from response (handles both num and val formats)"""
        if isinstance(value, dict):
            return float(value.get('value', 0))
        elif isinstance(value, (int, float)):
            return float(value)
        else:
            try:
                return float(value)
            except (TypeError, ValueError):
                return 0.0
    
    def get_api_info(self) -> Dict:
        """Get API information and status"""
        response = self._make_request('/')
        return response
    
    def get_stats(self) -> Dict:
        """Get API usage statistics"""
        return {
            'total_requests': self.request_count,
            'cache_size': len(self.cache.cache),
            'base_url': self.base_url,
            'cache_ttl': self.cache.ttl
        }

# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_api_instance = None

def get_api() -> EnhancedIndianStockAPI:
    """Get or create API singleton instance"""
    global _api_instance
    if _api_instance is None:
        _api_instance = EnhancedIndianStockAPI()
    return _api_instance

# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == '__main__':
    api = get_api()
    
    print("=== API Info ===")
    info = api.get_api_info()
    print(f"Version: {info.get('version')}")
    print(f"Status: {info.get('status')}")
    print()
    
    print("=== Search Example ===")
    results = api.search('reliance')
    for r in results:
        print(f"Symbol: {r.symbol}, Company: {r.company_name}")
    print()
    
    print("=== Single Stock ===")
    stock = api.get_stock('RELIANCE')
    print(f"Symbol: {stock.symbol}, Price: ₹{stock.last_price}, Change: {stock.percent_change}%")
    print()
    
    print("=== Multiple Stocks ===")
    stocks = api.get_multiple_stocks(['TCS', 'INFY', 'HDFCBANK'])
    for s in stocks:
        print(f"{s.symbol}: ₹{s.last_price} ({s.percent_change:+.2f}%)")
    print()
    
    print("=== Top Gainers ===")
    gainers = api.get_top_gainers()
    for g in gainers[:3]:
        print(f"{g['symbol']}: {g['percent_change']:+.2f}%")
    print()
    
    print("=== Exchange Comparison ===")
    comp = api.compare_exchanges('RELIANCE')
    print(f"NSE: ₹{comp.nse_price}, BSE: ₹{comp.bse_price}, Difference: ₹{comp.difference}")
    print()
    
    print("=== API Stats ===")
    stats = api.get_stats()
    print(json.dumps(stats, indent=2))
