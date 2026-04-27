"""
Advanced Trading Analysis Engine with ML-based predictions.
Includes technical indicators, risk analysis, and portfolio optimization.
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import hashlib

try:
    import numpy as np
except ImportError:
    np = None

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    import requests
except ImportError:
    requests = None


class TechnicalIndicators:
    """Calculate technical indicators for stock analysis."""
    
    @staticmethod
    def calculate_rsi(prices: List[float], period: int = 14) -> float:
        """Calculate Relative Strength Index (RSI)."""
        if not prices or len(prices) < period + 1:
            return 50.0
        
        deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
        seed = deltas[:period]
        up = sum([x for x in seed if x > 0]) / period
        down = -sum([x for x in seed if x < 0]) / period
        rs = up / down if down != 0 else 0
        rsi = 100 - (100 / (1 + rs)) if rs >= 0 else 0
        return round(rsi, 2)
    
    @staticmethod
    def calculate_macd(prices: List[float]) -> Tuple[float, float, float]:
        """Calculate MACD (Moving Average Convergence Divergence)."""
        if not prices or len(prices) < 26:
            return 0.0, 0.0, 0.0
        
        # EMA calculation
        def ema(data, span):
            result = [data[0]]
            multiplier = 2 / (span + 1)
            for i in range(1, len(data)):
                result.append(data[i] * multiplier + result[-1] * (1 - multiplier))
            return result[-1]
        
        ema_12 = ema(prices, 12)
        ema_26 = ema(prices, 26)
        macd_line = ema_12 - ema_26
        
        # Signal line (9-period EMA of MACD)
        if len(prices) >= 35:
            signal_line = ema([ema_12 - ema_26], 9)
        else:
            signal_line = macd_line
        
        histogram = macd_line - signal_line
        return round(macd_line, 4), round(signal_line, 4), round(histogram, 4)
    
    @staticmethod
    def calculate_bollinger_bands(prices: List[float], period: int = 20) -> Dict:
        """Calculate Bollinger Bands."""
        if not prices or len(prices) < period:
            return {"upper": 0, "middle": 0, "lower": 0}
        
        recent = prices[-period:]
        sma = sum(recent) / period
        variance = sum((x - sma) ** 2 for x in recent) / period
        std_dev = variance ** 0.5
        
        return {
            "upper": round(sma + (std_dev * 2), 2),
            "middle": round(sma, 2),
            "lower": round(sma - (std_dev * 2), 2),
            "std_dev": round(std_dev, 2)
        }
    
    @staticmethod
    def calculate_stochastic(prices: List[float], period: int = 14) -> Dict:
        """Calculate Stochastic Oscillator."""
        if not prices or len(prices) < period:
            return {"k": 50, "d": 50}
        
        recent = prices[-period:]
        low_min = min(recent)
        high_max = max(recent)
        
        k_percent = 100 * (prices[-1] - low_min) / (high_max - low_min) if high_max != low_min else 50
        d_percent = k_percent  # Simplified D calculation
        
        return {
            "k": round(k_percent, 2),
            "d": round(d_percent, 2),
            "signal": "overbought" if k_percent > 80 else "oversold" if k_percent < 20 else "neutral"
        }


class RiskAnalysis:
    """Analyze trading risk and portfolio risk."""
    
    @staticmethod
    def calculate_volatility(prices: List[float], period: int = 30) -> float:
        """Calculate annualized volatility."""
        if not prices or len(prices) < period:
            return 0.0
        
        recent = prices[-period:]
        returns = [(recent[i] - recent[i-1]) / recent[i-1] for i in range(1, len(recent))]
        variance = sum(x ** 2 for x in returns) / len(returns)
        daily_vol = variance ** 0.5
        annual_vol = daily_vol * (252 ** 0.5) * 100  # 252 trading days
        return round(annual_vol, 2)
    
    @staticmethod
    def calculate_sharpe_ratio(returns: List[float], risk_free_rate: float = 0.02) -> float:
        """Calculate Sharpe Ratio for portfolio."""
        if not returns or len(returns) < 2:
            return 0.0
        
        avg_return = sum(returns) / len(returns)
        variance = sum((x - avg_return) ** 2 for x in returns) / len(returns)
        std_dev = variance ** 0.5
        
        if std_dev == 0:
            return 0.0
        
        sharpe = (avg_return - risk_free_rate) / std_dev
        return round(sharpe, 4)
    
    @staticmethod
    def calculate_max_drawdown(prices: List[float]) -> float:
        """Calculate maximum drawdown percentage."""
        if not prices or len(prices) < 2:
            return 0.0
        
        running_max = prices[0]
        max_drawdown = 0.0
        
        for price in prices[1:]:
            if price > running_max:
                running_max = price
            drawdown = (running_max - price) / running_max
            if drawdown > max_drawdown:
                max_drawdown = drawdown
        
        return round(max_drawdown * 100, 2)
    
    @staticmethod
    def value_at_risk(returns: List[float], confidence: float = 0.95) -> float:
        """Calculate Value at Risk (VaR)."""
        if not returns or len(returns) < 2:
            return 0.0
        
        sorted_returns = sorted(returns)
        var_index = int(len(returns) * (1 - confidence))
        return round(sorted_returns[var_index] * 100, 2)


class PortfolioOptimizer:
    """Optimize portfolio allocation."""
    
    @staticmethod
    def calculate_efficient_frontier(stocks: Dict[str, List[float]]) -> List[Dict]:
        """Calculate efficient frontier points."""
        recommendations = []
        
        if not stocks:
            return recommendations
        
        # Simple random portfolio generation
        num_portfolios = 100
        stock_names = list(stocks.keys())
        
        for _ in range(num_portfolios):
            # Random weights
            weights = np.random.random(len(stock_names)) if np else [1/len(stock_names)] * len(stock_names)
            if np:
                weights /= weights.sum()
            
            # Calculate portfolio metrics
            portfolio_return = sum(weights[i] * (stocks[stock_names[i]][-1] - stocks[stock_names[i]][0]) / stocks[stock_names[i]][0] 
                                 for i in range(len(stock_names)))
            
            recommendations.append({
                "allocation": {stock_names[i]: round(weights[i] * 100, 1) for i in range(len(stock_names))},
                "expected_return": round(portfolio_return * 100, 2),
                "risk_level": "low" if portfolio_return < 0.05 else "medium" if portfolio_return < 0.15 else "high"
            })
        
        return sorted(recommendations, key=lambda x: x['expected_return'], reverse=True)[:10]
    
    @staticmethod
    def calculate_rebalancing(current_allocation: Dict[str, float], target_allocation: Dict[str, float]) -> Dict:
        """Calculate rebalancing actions needed."""
        rebalancing = {}
        
        for stock, target_pct in target_allocation.items():
            current_pct = current_allocation.get(stock, 0)
            diff = target_pct - current_pct
            
            if abs(diff) > 0.1:  # Only rebalance if > 0.1% difference
                rebalancing[stock] = {
                    "current": round(current_pct, 2),
                    "target": round(target_pct, 2),
                    "action": "buy" if diff > 0 else "sell",
                    "percentage": round(abs(diff), 2)
                }
        
        return rebalancing


class MLPrediction:
    """Simple ML-based price prediction."""
    
    @staticmethod
    def simple_moving_average_prediction(prices: List[float], days_forward: int = 5) -> Dict:
        """Predict future price using moving averages."""
        if not prices or len(prices) < 20:
            return {"prediction": prices[-1] if prices else 0, "confidence": 0}
        
        sma_5 = sum(prices[-5:]) / 5
        sma_20 = sum(prices[-20:]) / 20
        
        # Simple trend-based prediction
        trend = (sma_5 - sma_20) / sma_20
        predicted_price = prices[-1] * (1 + trend * (days_forward / 20))
        
        confidence = min(abs(trend) * 100, 85)  # Cap confidence at 85%
        
        return {
            "current_price": round(prices[-1], 2),
            "predicted_price": round(predicted_price, 2),
            "change_percent": round((predicted_price - prices[-1]) / prices[-1] * 100, 2),
            "confidence": round(confidence, 1),
            "days_forward": days_forward,
            "trend": "bullish" if trend > 0 else "bearish"
        }
    
    @staticmethod
    def support_resistance_levels(prices: List[float]) -> Dict:
        """Identify support and resistance levels."""
        if not prices or len(prices) < 20:
            return {"support": [], "resistance": []}
        
        recent = prices[-100:] if len(prices) >= 100 else prices
        
        # Find local extremes
        resistance = []
        support = []
        
        for i in range(1, len(recent) - 1):
            if recent[i] > recent[i-1] and recent[i] > recent[i+1]:
                resistance.append(round(recent[i], 2))
            elif recent[i] < recent[i-1] and recent[i] < recent[i+1]:
                support.append(round(recent[i], 2))
        
        # Get top 3 of each
        resistance = sorted(set(resistance), reverse=True)[:3]
        support = sorted(set(support))[:3]
        
        return {
            "support": support,
            "resistance": resistance,
            "current_price": round(prices[-1], 2)
        }


class AdvancedTradingAnalyzer:
    """Complete trading analysis with all indicators and ML predictions."""
    
    def __init__(self):
        self.indicators = TechnicalIndicators()
        self.risk = RiskAnalysis()
        self.optimizer = PortfolioOptimizer()
        self.ml = MLPrediction()
    
    def analyze_stock(self, symbol: str, prices: List[float]) -> Dict:
        """Comprehensive analysis of a single stock."""
        if not prices or len(prices) < 14:
            return {"symbol": symbol, "error": "Insufficient price data"}
        
        return {
            "symbol": symbol,
            "current_price": round(prices[-1], 2),
            "price_change_7d": round((prices[-1] - prices[-7]) / prices[-7] * 100, 2) if len(prices) >= 7 else 0,
            "technical_indicators": {
                "rsi": self.indicators.calculate_rsi(prices),
                "macd": dict(zip(["line", "signal", "histogram"], self.indicators.calculate_macd(prices))),
                "bollinger_bands": self.indicators.calculate_bollinger_bands(prices),
                "stochastic": self.indicators.calculate_stochastic(prices)
            },
            "risk_metrics": {
                "volatility_annual": self.risk.calculate_volatility(prices),
                "max_drawdown": self.risk.calculate_max_drawdown(prices),
                "var_95": self.risk.calculate_value_at_risk([prices[i] / prices[i-1] - 1 for i in range(1, len(prices))])
            },
            "prediction": self.ml.simple_moving_average_prediction(prices),
            "support_resistance": self.ml.support_resistance_levels(prices),
            "recommendation": self._generate_recommendation(prices)
        }
    
    def analyze_portfolio(self, holdings: Dict[str, Tuple[float, List[float]]]) -> Dict:
        """Analyze entire portfolio."""
        stocks_data = {symbol: data[1] for symbol, data in holdings.items()}
        stock_values = {symbol: data[0] for symbol, data in holdings.items()}
        
        portfolio_value = sum(stock_values.values())
        allocation = {symbol: value / portfolio_value for symbol, value in stock_values.items()}
        
        stock_analyses = {symbol: self.analyze_stock(symbol, prices) 
                         for symbol, prices in stocks_data.items()}
        
        # Calculate portfolio metrics
        portfolio_returns = []
        for symbol, prices in stocks_data.items():
            if len(prices) > 1:
                returns = [(prices[i] - prices[i-1]) / prices[i-1] for i in range(1, len(prices))]
                portfolio_returns.extend(returns)
        
        return {
            "portfolio_value": round(portfolio_value, 2),
            "allocation": {k: round(v * 100, 1) for k, v in allocation.items()},
            "stocks": stock_analyses,
            "portfolio_metrics": {
                "sharpe_ratio": self.risk.calculate_sharpe_ratio(portfolio_returns) if portfolio_returns else 0,
                "volatility": self.risk.calculate_volatility(list(stocks_data.values())[0] if stocks_data else []),
            },
            "rebalancing_recommendations": self.optimizer.calculate_rebalancing(
                allocation, 
                {k: 1/len(allocation) for k in allocation}
            ),
            "efficient_frontier": self.optimizer.calculate_efficient_frontier(stocks_data)
        }
    
    def _generate_recommendation(self, prices: List[float]) -> Dict:
        """Generate buy/sell recommendation."""
        if len(prices) < 14:
            return {"action": "hold", "reason": "Insufficient data"}
        
        rsi = self.indicators.calculate_rsi(prices)
        macd_line, signal_line, _ = self.indicators.calculate_macd(prices)
        bollinger = self.indicators.calculate_bollinger_bands(prices)
        
        signals = 0
        
        # RSI signals
        if rsi < 30:
            signals += 1
        elif rsi > 70:
            signals -= 1
        
        # MACD signals
        if macd_line > signal_line:
            signals += 1
        else:
            signals -= 1
        
        # Bollinger Band signals
        if prices[-1] < bollinger["lower"]:
            signals += 1
        elif prices[-1] > bollinger["upper"]:
            signals -= 1
        
        if signals >= 2:
            return {"action": "buy", "confidence": 85, "reason": "Multiple bullish signals"}
        elif signals <= -2:
            return {"action": "sell", "confidence": 85, "reason": "Multiple bearish signals"}
        else:
            return {"action": "hold", "confidence": 70, "reason": "Mixed signals"}


# Export analyzer
analyzer = AdvancedTradingAnalyzer()


def get_trading_analysis(symbol: str, prices: List[float]) -> str:
    """Get detailed trading analysis for a stock."""
    analysis = analyzer.analyze_stock(symbol, prices)
    
    output = f"""
📊 ADVANCED TRADING ANALYSIS: {symbol}
{'='*50}

💰 Price Information:
  Current: ${analysis['current_price']}
  7-Day Change: {analysis['price_change_7d']}%

🔍 Technical Indicators:
  RSI: {analysis['technical_indicators']['rsi']} {'(Overbought)' if analysis['technical_indicators']['rsi'] > 70 else '(Oversold)' if analysis['technical_indicators']['rsi'] < 30 else ''}
  MACD Line: {analysis['technical_indicators']['macd']['line']}
  Signal Line: {analysis['technical_indicators']['macd']['signal']}
  
  Bollinger Bands:
    Upper: ${analysis['technical_indicators']['bollinger_bands']['upper']}
    Middle: ${analysis['technical_indicators']['bollinger_bands']['middle']}
    Lower: ${analysis['technical_indicators']['bollinger_bands']['lower']}
  
  Stochastic: %K={analysis['technical_indicators']['stochastic']['k']} ({analysis['technical_indicators']['stochastic']['signal']})

⚠️ Risk Metrics:
  Annual Volatility: {analysis['risk_metrics']['volatility_annual']}%
  Max Drawdown: {analysis['risk_metrics']['max_drawdown']}%
  VaR (95%): {analysis['risk_metrics']['var_95']}%

🤖 ML Prediction ({analysis['prediction']['days_forward']} days):
  Predicted Price: ${analysis['prediction']['predicted_price']}
  Expected Change: {analysis['prediction']['change_percent']}%
  Confidence: {analysis['prediction']['confidence']}%
  Trend: {analysis['prediction']['trend'].upper()}

📍 Support & Resistance:
  Support Levels: {', '.join(f'${x}' for x in analysis['support_resistance']['support'])}
  Resistance Levels: {', '.join(f'${x}' for x in analysis['support_resistance']['resistance'])}

💡 RECOMMENDATION:
  Action: {analysis['recommendation']['action'].upper()}
  Confidence: {analysis['recommendation']['confidence']}%
  Reason: {analysis['recommendation']['reason']}
"""
    return output.strip()


def get_portfolio_analysis(holdings: Dict[str, Tuple[float, List[float]]]) -> str:
    """Get portfolio analysis and recommendations."""
    analysis = analyzer.analyze_portfolio(holdings)
    
    allocation_str = "\n  ".join(f"{k}: {v}%" for k, v in analysis['allocation'].items())
    stocks_summary = "\n  ".join(
        f"{sym}: {data['current_price']} | {data['recommendation']['action'].upper()} ({data['recommendation']['confidence']}%)"
        for sym, data in analysis['stocks'].items()
    )
    
    output = f"""
📈 PORTFOLIO ANALYSIS
{'='*50}

💼 Portfolio Value: ${analysis['portfolio_value']}

📊 Current Allocation:
  {allocation_str}

📌 Stock Recommendations:
  {stocks_summary}

📊 Portfolio Metrics:
  Sharpe Ratio: {analysis['portfolio_metrics']['sharpe_ratio']}
  Volatility: {analysis['portfolio_metrics']['volatility']}%

🔄 Rebalancing Recommendations:
"""
    
    if analysis['rebalancing_recommendations']:
        for stock, rebal in analysis['rebalancing_recommendations'].items():
            output += f"\n  {stock}:\n"
            output += f"    Current: {rebal['current']}% → Target: {rebal['target']}%\n"
            output += f"    Action: {rebal['action'].upper()} {rebal['percentage']}%"
    else:
        output += "\n  Portfolio is well-balanced. No rebalancing needed."
    
    if analysis['efficient_frontier']:
        output += f"\n\n🎯 Top Efficient Portfolios:\n"
        for i, port in enumerate(analysis['efficient_frontier'][:3], 1):
            alloc_str = ", ".join(f"{k}={v}%" for k, v in port['allocation'].items())
            output += f"\n  {i}. Return: {port['expected_return']}% | Risk: {port['risk_level']}\n     {alloc_str}"
    
    return output.strip()
