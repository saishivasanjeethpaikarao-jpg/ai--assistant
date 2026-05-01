"""
Trading Command Handlers - Integration with NSE/BSE Stock Market API
Commands for real-time stock analysis, watchlist, and portfolio tracking
"""

import json
from typing import Dict, List, Optional
import logging

from indian_stock_api import get_api
from market_tracker import get_watchlist, get_portfolio
from trading_advisor import (
    StockRecommendationEngine,
    UserTradingProfile,
    PortfolioAdvisor
)

logger = logging.getLogger(__name__)


def get_stock_price(symbol: str, exchange: str = "NSE") -> str:
    """Get real-time stock price from NSE/BSE
    
    Usage: "get price RELIANCE" or "stock price TCS.BO"
    """
    try:
        api = get_api()
        
        # Search if symbol not found directly
        if not symbol:
            return "Please provide a stock symbol"
        
        stock = api.get_stock(symbol.upper(), exchange)
        if not stock:
            # Try searching
            results = api.search(symbol)
            if results:
                stock = api.get_stock(results[0].symbol, exchange)
        
        if not stock:
            return f"Could not find stock: {symbol}"
        
        return f"""
📊 {stock.company_name} ({stock.symbol})
Exchange: {stock.exchange} | Ticker: {stock.ticker}

💰 Price: ₹{stock.last_price:.2f}
📈 Change: {stock.change:+.2f} ({stock.percent_change:+.2f}%)
📌 Previous Close: ₹{stock.previous_close:.2f}

📊 Daily Range: ₹{stock.day_low:.2f} - ₹{stock.day_high:.2f}
📊 52-Week Range: ₹{stock.year_low:.2f} - ₹{stock.year_high:.2f}

📈 Volume: {stock.volume:,.0f} shares
💼 Market Cap: ₹{stock.market_cap:,.0f}
📊 P/E Ratio: {stock.pe_ratio:.2f}
💵 EPS: ₹{stock.earnings_per_share:.2f}
🎁 Dividend Yield: {stock.dividend_yield:.2f}%

🏢 Sector: {stock.sector}
🏭 Industry: {stock.industry}
📅 Last Update: {stock.timestamp}
"""
    except Exception as e:
        logger.error(f"Error getting stock price: {e}")
        return f"Error fetching stock data: {str(e)}"


def search_stock(query: str) -> str:
    """Search for stocks by name or symbol
    
    Usage: "search reliance" or "find INFY"
    """
    try:
        api = get_api()
        results = api.search(query)
        
        if not results:
            return f"No results found for: {query}"
        
        response = f"🔍 Search Results for '{query}':\n\n"
        for i, result in enumerate(results[:10], 1):
            response += f"{i}. {result.company_name} ({result.symbol})\n"
            response += f"   NSE: {result.nse_ticker} | BSE: {result.bse_ticker}\n"
        
        return response
    except Exception as e:
        logger.error(f"Error searching stocks: {e}")
        return f"Search error: {str(e)}"


def compare_exchanges(symbol: str) -> str:
    """Compare stock prices between NSE and BSE
    
    Usage: "compare RELIANCE" or "exchange comparison TCS"
    """
    try:
        api = get_api()
        comparison = api.compare_exchanges(symbol.upper())
        
        if not comparison:
            return f"Could not compare {symbol} on both exchanges"
        
        response = f"""
🔄 NSE vs BSE Comparison: {symbol}
{'='*50}

NSE Price: ₹{comparison['nse_price']:.2f}
BSE Price: ₹{comparison['bse_price']:.2f}
Difference: ₹{comparison['price_difference']:.2f} ({comparison['price_diff_percentage']:+.2f}%)

NSE Volume: {comparison['nse_volume']:,.0f}
BSE Volume: {comparison['bse_volume']:,.0f}

Arbitrage Opportunity: {'🟢 YES' if comparison['arbitrage_opportunity'] else '🔴 NO'}
Recommended Exchange: {comparison['recommended_exchange']}
"""
        return response
    except Exception as e:
        logger.error(f"Error comparing exchanges: {e}")
        return f"Comparison error: {str(e)}"


def get_market_gainers() -> str:
    """Get top gaining stocks
    
    Usage: "market gainers" or "top gainers"
    """
    try:
        api = get_api()
        gainers = api.get_top_gainers(10)
        
        if not gainers:
            return "No gainers data available"
        
        response = "🟢 TOP MARKET GAINERS:\n\n"
        for i, stock in enumerate(gainers, 1):
            response += f"{i}. {stock.symbol} - ₹{stock.last_price:.2f} ({stock.percent_change:+.2f}%)\n"
        
        return response
    except Exception as e:
        logger.error(f"Error getting gainers: {e}")
        return f"Error: {str(e)}"


def get_market_losers() -> str:
    """Get top losing stocks
    
    Usage: "market losers" or "top losers"
    """
    try:
        api = get_api()
        losers = api.get_top_losers(10)
        
        if not losers:
            return "No losers data available"
        
        response = "🔴 TOP MARKET LOSERS:\n\n"
        for i, stock in enumerate(losers, 1):
            response += f"{i}. {stock.symbol} - ₹{stock.last_price:.2f} ({stock.percent_change:+.2f}%)\n"
        
        return response
    except Exception as e:
        logger.error(f"Error getting losers: {e}")
        return f"Error: {str(e)}"


def get_market_summary() -> str:
    """Get overall market summary
    
    Usage: "market summary" or "market status"
    """
    try:
        api = get_api()
        summary = api.generate_market_summary()
        
        if not summary:
            return "Could not generate market summary"
        
        response = f"""
📊 MARKET SUMMARY
{'='*50}
📅 Timestamp: {summary['timestamp']}

📈 Gainers: {summary['gainers']}
📉 Losers: {summary['losers']}
Average Change: {summary['average_change']:+.2f}%

💹 Total Volume: {summary['total_volume']:,.0f}

🏆 Top Gainer: {summary['top_gainer'].symbol if summary['top_gainer'] else 'N/A'}
  {summary['top_gainer'].percent_change:+.2f}% - ₹{summary['top_gainer'].last_price:.2f}

📉 Top Loser: {summary['top_loser'].symbol if summary['top_loser'] else 'N/A'}
  {summary['top_loser'].percent_change:+.2f}% - ₹{summary['top_loser'].last_price:.2f}

Sentiment: {summary['market_sentiment']}
"""
        return response
    except Exception as e:
        logger.error(f"Error getting market summary: {e}")
        return f"Error: {str(e)}"


def add_to_watchlist(symbol: str, alert_price: Optional[float] = None, alert_type: str = "any") -> str:
    """Add stock to watchlist
    
    Usage: "add RELIANCE to watchlist" or "watch TCS at 3000"
    """
    try:
        watchlist = get_watchlist()
        if watchlist.add(symbol.upper(), alert_price=alert_price, alert_type=alert_type):
            msg = f"✅ Added {symbol} to watchlist"
            if alert_price:
                msg += f" with alert at ₹{alert_price:.2f}"
            return msg
        else:
            return f"❌ Failed to add {symbol} to watchlist (stock not found?)"
    except Exception as e:
        logger.error(f"Error adding to watchlist: {e}")
        return f"Error: {str(e)}"


def remove_from_watchlist(symbol: str) -> str:
    """Remove stock from watchlist
    
    Usage: "remove RELIANCE from watchlist"
    """
    try:
        watchlist = get_watchlist()
        if watchlist.remove(symbol.upper()):
            return f"✅ Removed {symbol} from watchlist"
        else:
            return f"❌ {symbol} not found in watchlist"
    except Exception as e:
        logger.error(f"Error removing from watchlist: {e}")
        return f"Error: {str(e)}"


def view_watchlist() -> str:
    """View all watchlist items
    
    Usage: "show watchlist" or "view watchlist"
    """
    try:
        watchlist = get_watchlist()
        items = watchlist.get_all()
        
        if not items:
            return "📋 Your watchlist is empty"
        
        response = "📋 YOUR WATCHLIST:\n\n"
        for item in items:
            response += f"📌 {item.symbol} ({item.exchange})\n"
            response += f"   Current Price: ₹{item.last_price:.2f}\n"
            if item.alert_price:
                response += f"   Alert: {item.alert_type.upper()} ₹{item.alert_price:.2f}\n"
            response += f"   Added: {item.added_date[:10]}\n\n"
        
        return response
    except Exception as e:
        logger.error(f"Error viewing watchlist: {e}")
        return f"Error: {str(e)}"


def add_portfolio_holding(symbol: str, quantity: float, buy_price: float) -> str:
    """Add holding to portfolio
    
    Usage: "add 10 RELIANCE at 2500" or "portfolio add TCS 5 3200"
    """
    try:
        portfolio = get_portfolio()
        if portfolio.add_holding(symbol.upper(), quantity, buy_price):
            return f"✅ Added {quantity} shares of {symbol} at ₹{buy_price:.2f} to portfolio"
        else:
            return f"❌ Failed to add holding (stock not found?)"
    except Exception as e:
        logger.error(f"Error adding portfolio holding: {e}")
        return f"Error: {str(e)}"


def view_portfolio() -> str:
    """View portfolio summary
    
    Usage: "show portfolio" or "portfolio status"
    """
    try:
        portfolio = get_portfolio()
        summary = portfolio.get_summary()
        
        if summary['total_holdings'] == 0:
            return "💼 Your portfolio is empty"
        
        total_cost, total_value, total_gain, total_gain_pct = portfolio.get_portfolio_value()
        
        response = f"""
💼 PORTFOLIO SUMMARY
{'='*50}
Total Holdings: {summary['total_holdings']}

Cost Basis: ₹{total_cost:,.2f}
Current Value: ₹{total_value:,.2f}
Total Gain/Loss: ₹{total_gain:,.2f} ({total_gain_pct:+.2f}%)

ALLOCATION:
"""
        for symbol, pct in summary['diversification'].items():
            response += f"  {symbol}: {pct:.1f}%\n"
        
        if summary['sector_allocation']:
            response += "\nSECTOR ALLOCATION:\n"
            for sector, pct in summary['sector_allocation'].items():
                response += f"  {sector}: {pct:.1f}%\n"
        
        return response
    except Exception as e:
        logger.error(f"Error viewing portfolio: {e}")
        return f"Error: {str(e)}"


def get_stock_analysis(symbol: str) -> str:
    """Get detailed stock analysis with BUY/SELL recommendation
    
    Usage: "analyze RELIANCE" or "stock analysis TCS"
    """
    try:
        user_profile = UserTradingProfile(
            risk_tolerance="medium",
            investment_amount=10000,
            preferred_sectors=["TECH", "FINANCE"],
            exclude_sectors=[],
            trading_style="swing_trading",
            experience_level="intermediate",
            stop_loss_percentage=5,
            take_profit_percentage=15,
            max_positions=5
        )
        
        engine = StockRecommendationEngine(user_profile)
        analysis = engine.analyze_stock(symbol.upper())
        
        if not analysis:
            return f"Could not analyze {symbol}"
        
        signal = engine.generate_trading_signal(symbol.upper())
        
        response = f"""
📊 STOCK ANALYSIS: {analysis.company_name}
{'='*50}

🎯 RECOMMENDATION: {signal.signal} (Confidence: {signal.confidence:.0f}%)

💰 PRICING:
Current Price: ₹{analysis.current_price:.2f}
Entry Price: ₹{analysis.entry_price:.2f}
Target Price: ₹{analysis.target_price:.2f}
Stop Loss: ₹{analysis.stop_loss_price:.2f}
Risk/Reward: {analysis.risk_reward_ratio:.2f}

📈 FUNDAMENTALS (Score: {analysis.fundamental_score:.0f}/100):
P/E Ratio: {analysis.pe_ratio:.2f}
EPS: ₹{analysis.eps:.2f}
Dividend Yield: {analysis.dividend_yield:.2f}%

🔧 TECHNICALS (Score: {analysis.technical_score:.0f}/100):
Momentum: {analysis.momentum_score:.0f}/100

💬 SENTIMENT (Score: {analysis.sentiment_score:.0f}/100):
{chr(10).join([f"  • {news}" for news in analysis.recent_news])}

Overall Score: {analysis.overall_score:.0f}/100
Recommendation: {analysis.recommendation}
"""
        return response
    except Exception as e:
        logger.error(f"Error analyzing stock: {e}")
        return f"Error: {str(e)}"


def get_trading_recommendations() -> str:
    """Get AI trading recommendations for Indian market
    
    Usage: "trading recommendations" or "recommend trades"
    """
    try:
        user_profile = UserTradingProfile(
            risk_tolerance="medium",
            investment_amount=50000,
            preferred_sectors=["TECH", "FINANCE", "AUTO"],
            exclude_sectors=[],
            trading_style="swing_trading",
            experience_level="intermediate",
            stop_loss_percentage=5,
            take_profit_percentage=15,
            max_positions=5
        )
        
        advisor = PortfolioAdvisor(user_profile)
        trades = advisor.suggest_trades()
        
        if not trades['suggested_trades']:
            return "No buy recommendations at this time"
        
        response = f"""
🎯 TRADING RECOMMENDATIONS
{'='*50}
Investment Amount: ₹{trades['investment_amount']:,.0f}
Date: {trades['timestamp'][:10]}

SUGGESTED TRADES:
"""
        for i, trade in enumerate(trades['suggested_trades'], 1):
            response += f"""
{i}. {trade['symbol']} - {trade['company']}
   Action: {trade['action']}
   Quantity: {trade['quantity']} shares
   Entry: ₹{trade['entry_price']:.2f}
   Target: ₹{trade['target_price']:.2f}
   Stop Loss: ₹{trade['stop_loss']:.2f}
   Risk/Reward: {trade['risk_reward']:.2f}
   Confidence: {trade['confidence']}
"""
        
        return response
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        return f"Error: {str(e)}"
