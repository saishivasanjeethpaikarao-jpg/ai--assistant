"""
Flask Backend API for Trading System
Web-first approach with REST endpoints
"""

import os
import logging
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
app.config['JSON_SORT_KEYS'] = False
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# MIDDLEWARE & UTILITIES
# ============================================================================

def error_handler(f):
    """Decorator for consistent error handling"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error in {f.__name__}: {str(e)}")
            return jsonify({'error': str(e), 'status': 'error'}), 500
    return decorated_function

def json_response(data, status=200):
    """Helper to create consistent JSON responses"""
    return jsonify({
        'status': 'success' if status == 200 else 'error',
        'data': data,
        'timestamp': datetime.now().isoformat()
    }), status

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return json_response({
        'status': 'healthy',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })

# ============================================================================
# STOCK ENDPOINTS
# ============================================================================

@app.route('/api/stocks', methods=['GET'])
@error_handler
def get_stocks():
    """Get list of all available stocks"""
    from src.indian_stock_api import get_api
    
    api = get_api()
    stocks = [
        "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK",
        "SBIN", "BAJAJFINSV", "BHARTIARTL", "WIPRO", "LT",
        "MARUTI", "ASIANPAINT", "NESTLEIND", "ADANIPORTS",
        "TECHM", "KOTAKBANK", "ULTRACEMCO", "SUNPHARMA",
        "AXISBANK", "JSWSTEEL"
    ]
    return json_response({'stocks': stocks})

@app.route('/api/stocks/<symbol>', methods=['GET'])
@error_handler
def get_stock(symbol):
    """Get detailed stock information"""
    from src.indian_stock_api import get_api
    
    api = get_api()
    stock = api.get_stock(symbol.upper())
    
    if stock:
        return json_response(stock.__dict__)
    return json_response({'error': f'Stock {symbol} not found'}, 404)

@app.route('/api/stocks/search', methods=['GET'])
@error_handler
def search_stocks():
    """Search stocks by name or symbol"""
    from src.indian_stock_api import get_api
    
    query = request.args.get('q', '')
    api = get_api()
    results = api.search(query)
    
    return json_response({'results': [r.__dict__ if hasattr(r, '__dict__') else r for r in results]})

@app.route('/api/stocks/<symbol>/compare', methods=['POST'])
@error_handler
def compare_exchanges(symbol):
    """Compare stock across NSE and BSE"""
    from src.indian_stock_api import get_api
    
    api = get_api()
    comparison = api.compare_exchanges(symbol.upper())
    
    return json_response(comparison)

@app.route('/api/market/gainers', methods=['GET'])
@error_handler
def get_top_gainers():
    """Get top gaining stocks"""
    from src.indian_stock_api import get_api
    
    api = get_api()
    gainers = api.get_top_gainers()
    
    return json_response({'gainers': gainers})

@app.route('/api/market/losers', methods=['GET'])
@error_handler
def get_top_losers():
    """Get top losing stocks"""
    from src.indian_stock_api import get_api
    
    api = get_api()
    losers = api.get_top_losers()
    
    return json_response({'losers': losers})

# ============================================================================
# PORTFOLIO ENDPOINTS
# ============================================================================

@app.route('/api/portfolio', methods=['GET'])
@error_handler
def get_portfolio():
    """Get user portfolio"""
    from src.market_tracker import get_portfolio
    
    portfolio = get_portfolio()
    holdings = [h.__dict__ for h in portfolio.holdings]
    
    return json_response({
        'holdings': holdings,
        'total_invested': portfolio.get_total_invested(),
        'total_current_value': portfolio.get_total_current_value(),
        'total_gains_losses': portfolio.get_total_gains_losses()
    })

@app.route('/api/portfolio/add', methods=['POST'])
@error_handler
def add_to_portfolio():
    """Add stock to portfolio"""
    from src.market_tracker import get_portfolio
    
    data = request.json
    portfolio = get_portfolio()
    portfolio.add_holding(
        symbol=data['symbol'],
        quantity=float(data['quantity']),
        buy_price=float(data['buy_price']),
        date_added=data.get('date_added', datetime.now().isoformat())
    )
    portfolio.save()
    
    return json_response({'message': 'Stock added to portfolio'}, 201)

@app.route('/api/portfolio/<symbol>', methods=['PUT'])
@error_handler
def update_portfolio(symbol):
    """Update portfolio holding"""
    from src.market_tracker import get_portfolio
    
    data = request.json
    portfolio = get_portfolio()
    
    for holding in portfolio.holdings:
        if holding.symbol == symbol.upper():
            holding.quantity = float(data.get('quantity', holding.quantity))
            holding.buy_price = float(data.get('buy_price', holding.buy_price))
            break
    
    portfolio.save()
    return json_response({'message': 'Portfolio updated'})

@app.route('/api/portfolio/<symbol>', methods=['DELETE'])
@error_handler
def remove_from_portfolio(symbol):
    """Remove stock from portfolio"""
    from src.market_tracker import get_portfolio
    
    portfolio = get_portfolio()
    portfolio.holdings = [h for h in portfolio.holdings if h.symbol != symbol.upper()]
    portfolio.save()
    
    return json_response({'message': 'Stock removed from portfolio'})

# ============================================================================
# WATCHLIST ENDPOINTS
# ============================================================================

@app.route('/api/watchlist', methods=['GET'])
@error_handler
def get_watchlist():
    """Get user watchlist"""
    from src.market_tracker import get_watchlist
    
    watchlist = get_watchlist()
    items = [item.__dict__ for item in watchlist.items]
    
    return json_response({'items': items})

@app.route('/api/watchlist/add', methods=['POST'])
@error_handler
def add_to_watchlist():
    """Add stock to watchlist"""
    from src.market_tracker import get_watchlist
    
    data = request.json
    watchlist = get_watchlist()
    watchlist.add_item(
        symbol=data['symbol'],
        reason=data.get('reason', ''),
        target_price=float(data.get('target_price', 0))
    )
    watchlist.save()
    
    return json_response({'message': 'Added to watchlist'}, 201)

@app.route('/api/watchlist/<symbol>', methods=['DELETE'])
@error_handler
def remove_from_watchlist(symbol):
    """Remove stock from watchlist"""
    from src.market_tracker import get_watchlist
    
    watchlist = get_watchlist()
    watchlist.items = [item for item in watchlist.items if item.symbol != symbol.upper()]
    watchlist.save()
    
    return json_response({'message': 'Removed from watchlist'})

# ============================================================================
# ALERTS ENDPOINTS
# ============================================================================

@app.route('/api/alerts', methods=['GET'])
@error_handler
def get_alerts():
    """Get all alerts"""
    from src.alerts_system import get_alert_manager
    
    manager = get_alert_manager()
    alerts = [alert.__dict__ for alert in manager.alerts]
    
    return json_response({'alerts': alerts})

@app.route('/api/alerts', methods=['POST'])
@error_handler
def create_alert():
    """Create new alert"""
    from src.alerts_system import get_alert_manager
    
    data = request.json
    manager = get_alert_manager()
    
    alert_id = manager.create_price_alert(
        symbol=data['symbol'],
        target_price=float(data['target_price']),
        alert_type=data.get('type', 'price'),
        channels=data.get('channels', ['in_app'])
    )
    
    return json_response({'alert_id': alert_id, 'message': 'Alert created'}, 201)

@app.route('/api/alerts/<alert_id>', methods=['DELETE'])
@error_handler
def delete_alert(alert_id):
    """Delete alert"""
    from src.alerts_system import get_alert_manager
    
    manager = get_alert_manager()
    manager.delete_alert(alert_id)
    
    return json_response({'message': 'Alert deleted'})

@app.route('/api/alerts/check', methods=['POST'])
@error_handler
def check_alerts():
    """Manually check all alerts"""
    from src.alerts_system import get_alert_manager
    
    manager = get_alert_manager()
    triggered = manager.check_alerts()
    
    return json_response({
        'triggered_count': len(triggered),
        'triggered_alerts': triggered
    })

# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@app.route('/api/analytics/<symbol>', methods=['GET'])
@error_handler
def get_analytics(symbol):
    """Get technical analysis for stock"""
    from src.analytics_engine import Analytics
    
    analytics = Analytics()
    analysis = analytics.analyze_stock(symbol.upper())
    
    return json_response(analysis)

@app.route('/api/trading/recommendations', methods=['GET'])
@error_handler
def get_recommendations():
    """Get AI trading recommendations"""
    from src.trading_advisor import StockRecommendationEngine
    
    engine = StockRecommendationEngine()
    recommendations = engine.get_top_recommendations()
    
    return json_response({'recommendations': recommendations})

@app.route('/api/trading/analyze', methods=['POST'])
@error_handler
def analyze_stock():
    """Analyze specific stock"""
    from src.trading_advisor import StockRecommendationEngine
    
    data = request.json
    engine = StockRecommendationEngine()
    analysis = engine.analyze_stock(data['symbol'])
    
    return json_response(analysis)

# ============================================================================
# OPTIONS ENDPOINTS
# ============================================================================

@app.route('/api/options/strategies', methods=['GET'])
@error_handler
def get_option_strategies():
    """Get available options strategies"""
    from src.options_trading import OptionsStrategies
    
    strategies = {
        'bull_call_spread': 'Bullish with limited risk/reward',
        'bear_call_spread': 'Bearish with limited risk/reward',
        'iron_condor': 'Neutral - sell volatility',
        'straddle': 'Bullish/bearish on volatility',
        'covered_call': 'Earn premium on holding',
        'protective_put': 'Insurance for holding'
    }
    
    return json_response({'strategies': strategies})

@app.route('/api/options/calculate', methods=['POST'])
@error_handler
def calculate_option_price():
    """Calculate option price using Black-Scholes"""
    from src.options_trading import BlackScholes
    
    data = request.json
    bs = BlackScholes(
        spot_price=float(data['spot_price']),
        strike_price=float(data['strike_price']),
        time_to_expiry=float(data['time_to_expiry']),
        risk_free_rate=float(data.get('risk_free_rate', 0.05)),
        volatility=float(data.get('volatility', 0.25))
    )
    
    call_price = bs.calculate_call_price()
    put_price = bs.calculate_put_price()
    greeks = bs.calculate_greeks()
    
    return json_response({
        'call_price': call_price,
        'put_price': put_price,
        'greeks': greeks
    })

# ============================================================================
# BACKTESTING ENDPOINTS
# ============================================================================

@app.route('/api/backtest', methods=['POST'])
@error_handler
def run_backtest():
    """Run backtest on strategy"""
    from src.backtest_engine import BacktestEngine
    
    data = request.json
    engine = BacktestEngine()
    
    result = engine.backtest_simple_moving_average(
        symbol=data['symbol'],
        short_window=int(data.get('short_window', 20)),
        long_window=int(data.get('long_window', 50))
    )
    
    return json_response({
        'symbol': data['symbol'],
        'total_return': result.total_return,
        'win_rate': result.win_rate,
        'sharpe_ratio': result.sharpe_ratio,
        'max_drawdown': result.max_drawdown
    })

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return json_response({'error': 'Endpoint not found'}, 404)

@app.errorhandler(500)
def internal_error(error):
    return json_response({'error': 'Internal server error'}, 500)

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    debug = os.getenv('FLASK_DEBUG', 'False') == 'True'
    port = int(os.getenv('FLASK_PORT', 5000))
    
    print(f"""
    ╔══════════════════════════════════════════════════════════╗
    ║     TRADING SYSTEM - FLASK BACKEND API                   ║
    ║                                                          ║
    ║  🚀 Server running on: http://localhost:{port}           ║
    ║  📚 API Docs: http://localhost:{port}/api/health         ║
    ║  🔧 Debug Mode: {debug}                              ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        use_reloader=True
    )
