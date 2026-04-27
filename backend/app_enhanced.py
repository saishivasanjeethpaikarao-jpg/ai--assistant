"""
Flask Backend API for Trading System - Enhanced Version
Uses: http://65.0.104.9/ - NSE & BSE Real-time Data
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

# Import enhanced API
from src.enhanced_stock_api import (
    get_api, Exchange, ResponseFormat, 
    EnhancedIndianStockAPI, asdict
)

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
            return jsonify({
                'error': str(e),
                'status': 'error'
            }), 500
    return decorated_function

def json_response(data, status=200, message=None):
    """Helper to create consistent JSON responses"""
    response = {
        'status': 'success' if status == 200 else 'error',
        'data': data,
        'timestamp': datetime.now().isoformat()
    }
    if message:
        response['message'] = message
    return jsonify(response), status

# ============================================================================
# HEALTH & STATUS
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    api = get_api()
    stats = api.get_stats()
    
    return json_response({
        'status': 'healthy',
        'version': '2.0',
        'api': 'Enhanced Indian Stock API',
        'base_url': 'http://65.0.104.9',
        'stats': stats
    })

@app.route('/api', methods=['GET'])
def api_info():
    """Get API information"""
    api = get_api()
    info = api.get_api_info()
    
    return json_response({
        'name': 'Trading System API',
        'version': info.get('version', '2.0'),
        'stock_api': 'http://65.0.104.9',
        'features': info.get('features', []),
        'exchanges': info.get('exchanges', {})
    })

# ============================================================================
# SEARCH ENDPOINTS
# ============================================================================

@app.route('/api/stocks/search', methods=['GET'])
@error_handler
def search_stocks():
    """Search stocks by company name or symbol"""
    query = request.args.get('q', '').strip()
    
    if not query:
        return json_response({'error': 'Please provide search query'}, 400)
    
    api = get_api()
    results = api.search(query)
    
    if not results:
        return json_response({
            'query': query,
            'results': [],
            'message': 'No results found'
        }, 200)
    
    return json_response({
        'query': query,
        'total_results': len(results),
        'results': [asdict(r) for r in results]
    })

# ============================================================================
# SINGLE STOCK ENDPOINTS
# ============================================================================

@app.route('/api/stocks/<symbol>', methods=['GET'])
@error_handler
def get_stock(symbol):
    """Get detailed stock information"""
    exchange = request.args.get('exchange', 'NSE').upper()
    res_format = request.args.get('format', 'num').lower()
    
    try:
        exchange_enum = Exchange[exchange]
        format_enum = ResponseFormat[res_format.upper()] if res_format in ['num', 'val'] else ResponseFormat.NUMERIC
    except KeyError:
        return json_response({
            'error': f'Invalid exchange or format',
            'valid_exchanges': ['NSE', 'BSE'],
            'valid_formats': ['num', 'val']
        }, 400)
    
    api = get_api()
    stock = api.get_stock(symbol.upper(), exchange_enum, format_enum)
    
    if not stock:
        return json_response({
            'error': f'Stock {symbol} not found on {exchange}'
        }, 404)
    
    return json_response(asdict(stock))

@app.route('/api/stocks/<symbol>/compare', methods=['GET'])
@error_handler
def compare_exchanges(symbol):
    """Compare stock price across NSE and BSE"""
    api = get_api()
    comparison = api.compare_exchanges(symbol.upper())
    
    return json_response(asdict(comparison))

# ============================================================================
# BATCH ENDPOINTS
# ============================================================================

@app.route('/api/stocks/batch', methods=['POST'])
@error_handler
def get_multiple_stocks():
    """Get multiple stocks at once"""
    data = request.json or {}
    symbols = data.get('symbols', [])
    res_format = data.get('format', 'num').lower()
    
    if not symbols:
        return json_response({'error': 'Please provide symbols list'}, 400)
    
    try:
        format_enum = ResponseFormat[res_format.upper()] if res_format in ['num', 'val'] else ResponseFormat.NUMERIC
    except KeyError:
        return json_response({'error': 'Invalid format'}, 400)
    
    api = get_api()
    stocks = api.get_multiple_stocks(symbols, format_enum)
    
    return json_response({
        'total': len(stocks),
        'stocks': [asdict(s) for s in stocks]
    })

# ============================================================================
# MARKET DATA ENDPOINTS
# ============================================================================

@app.route('/api/market/gainers', methods=['GET'])
@error_handler
def get_top_gainers():
    """Get top gaining stocks"""
    limit = int(request.args.get('limit', 10))
    
    api = get_api()
    gainers = api.get_top_gainers(limit)
    
    return json_response({
        'type': 'gainers',
        'total': len(gainers),
        'stocks': gainers
    })

@app.route('/api/market/losers', methods=['GET'])
@error_handler
def get_top_losers():
    """Get top losing stocks"""
    limit = int(request.args.get('limit', 10))
    
    api = get_api()
    losers = api.get_top_losers(limit)
    
    return json_response({
        'type': 'losers',
        'total': len(losers),
        'stocks': losers
    })

@app.route('/api/market/symbols', methods=['GET'])
@error_handler
def get_all_symbols():
    """Get all available stock symbols"""
    api = get_api()
    symbols = api.get_all_symbols()
    
    return json_response({
        'total': len(symbols),
        'symbols': symbols
    })

# ============================================================================
# PORTFOLIO ENDPOINTS (Using Market Tracker)
# ============================================================================

@app.route('/api/portfolio', methods=['GET'])
@error_handler
def get_portfolio():
    """Get user portfolio"""
    try:
        from src.market_tracker import get_portfolio
        
        portfolio = get_portfolio()
        holdings = [h.__dict__ for h in portfolio.holdings]
        
        return json_response({
            'holdings': holdings,
            'total_invested': portfolio.get_total_invested(),
            'total_current_value': portfolio.get_total_current_value(),
            'total_gains_losses': portfolio.get_total_gains_losses()
        })
    except ImportError:
        return json_response({'error': 'Portfolio module not available'}, 501)

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
    """Get watchlist"""
    try:
        from src.market_tracker import get_watchlist
        
        watchlist = get_watchlist()
        items = [item.__dict__ for item in watchlist.items]
        
        return json_response({'items': items})
    except ImportError:
        return json_response({'error': 'Watchlist module not available'}, 501)

@app.route('/api/watchlist/add', methods=['POST'])
@error_handler
def add_to_watchlist():
    """Add to watchlist"""
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
    """Remove from watchlist"""
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
    try:
        from src.alerts_system import get_alert_manager
        
        manager = get_alert_manager()
        alerts = [alert.__dict__ for alert in manager.alerts]
        
        return json_response({'alerts': alerts})
    except ImportError:
        return json_response({'error': 'Alerts module not available'}, 501)

@app.route('/api/alerts', methods=['POST'])
@error_handler
def create_alert():
    """Create price alert"""
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

# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@app.route('/api/analytics/<symbol>', methods=['GET'])
@error_handler
def get_analytics(symbol):
    """Get technical analysis"""
    try:
        from src.analytics_engine import Analytics
        
        analytics = Analytics()
        analysis = analytics.analyze_stock(symbol.upper())
        
        return json_response(analysis)
    except ImportError:
        return json_response({'error': 'Analytics module not available'}, 501)

@app.route('/api/trading/recommendations', methods=['GET'])
@error_handler
def get_recommendations():
    """Get AI recommendations"""
    try:
        from src.trading_advisor import StockRecommendationEngine
        
        engine = StockRecommendationEngine()
        recommendations = engine.get_top_recommendations()
        
        return json_response({'recommendations': recommendations})
    except ImportError:
        return json_response({'error': 'Trading advisor module not available'}, 501)

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
# CORS & STARTUP
# ============================================================================

@app.before_request
def log_request():
    """Log incoming request"""
    logger.info(f"{request.method} {request.path}")

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    debug = os.getenv('FLASK_DEBUG', 'False') == 'True'
    port = int(os.getenv('FLASK_PORT', 5000))
    
    print(f"""
    ╔══════════════════════════════════════════════════════════╗
    ║     TRADING SYSTEM - ENHANCED FLASK BACKEND API         ║
    ║                                                          ║
    ║  API: http://65.0.104.9/ (NSE & BSE Real-time Data)    ║
    ║  🚀 Server running on: http://localhost:{port}           ║
    ║  📚 API Root: http://localhost:{port}/api              ║
    ║  🔧 Debug Mode: {debug}                              ║
    ║                                                          ║
    ║  Features:                                               ║
    ║  ✓ Search stocks by name                               ║
    ║  ✓ Real-time NSE/BSE prices                            ║
    ║  ✓ Batch queries (multiple stocks)                     ║
    ║  ✓ Exchange comparison                                 ║
    ║  ✓ Top gainers/losers                                  ║
    ║  ✓ Portfolio management                                ║
    ║  ✓ Price alerts                                        ║
    ║  ✓ Technical analysis                                  ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        use_reloader=True
    )
