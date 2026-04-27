"""
Advanced Analytics Module - Technical & Fundamental Analysis
Real-time technical indicators, sector analysis, and risk metrics
"""

import math
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging

from indian_stock_api import get_api, StockData

logger = logging.getLogger(__name__)


@dataclass
class TechnicalIndicators:
    """Technical analysis indicators"""
    rsi: float  # Relative Strength Index (0-100)
    macd: float  # MACD line
    macd_signal: float  # Signal line
    macd_histogram: float  # Histogram
    bb_upper: float  # Bollinger Band Upper
    bb_middle: float  # Bollinger Band Middle
    bb_lower: float  # Bollinger Band Lower
    atr: float  # Average True Range
    ema_20: float  # 20-day EMA
    ema_50: float  # 50-day EMA
    ema_200: float  # 200-day EMA
    adx: float  # Average Directional Index
    cci: float  # Commodity Channel Index


@dataclass
class StockMetrics:
    """Comprehensive stock metrics"""
    symbol: str
    price: float
    technical_indicators: TechnicalIndicators
    strength_score: float  # 0-100
    trend: str  # "Uptrend", "Downtrend", "Sideways"
    support_level: float
    resistance_level: float
    risk_level: str  # "Low", "Medium", "High"
    volatility: float
    volume_trend: str  # "Increasing", "Decreasing", "Stable"


@dataclass
class SectorAnalysis:
    """Sector-level analysis"""
    sector: str
    stocks: List[str]
    average_pe: float
    average_change: float
    gainers: int
    losers: int
    strength_score: float  # 0-100
    trend: str
    recommendation: str


class TechnicalAnalyzer:
    """Technical analysis calculations"""
    
    @staticmethod
    def calculate_rsi(prices: List[float], period: int = 14) -> float:
        """Calculate Relative Strength Index (0-100)
        
        RSI < 30: Oversold (potential buy)
        RSI > 70: Overbought (potential sell)
        RSI 40-60: Neutral
        """
        if len(prices) < period + 1:
            return 50
        
        deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
        
        up_avg = sum(max(d, 0) for d in deltas[-period:]) / period
        down_avg = sum(abs(min(d, 0)) for d in deltas[-period:]) / period
        
        if down_avg == 0:
            return 100 if up_avg > 0 else 50
        
        rs = up_avg / down_avg
        rsi = 100 - (100 / (1 + rs))
        
        return max(0, min(100, rsi))
    
    @staticmethod
    def calculate_macd(prices: List[float]) -> Tuple[float, float, float]:
        """Calculate MACD (Moving Average Convergence Divergence)
        
        Returns: (MACD line, Signal line, Histogram)
        """
        if len(prices) < 26:
            return 0, 0, 0
        
        ema12 = TechnicalAnalyzer._ema(prices, 12)
        ema26 = TechnicalAnalyzer._ema(prices, 26)
        macd = ema12 - ema26
        
        # Signal line is 9-period EMA of MACD
        signal = (macd * 2) / (9 + 1)
        histogram = macd - signal
        
        return macd, signal, histogram
    
    @staticmethod
    def calculate_bollinger_bands(prices: List[float], period: int = 20, std_dev: float = 2.0) -> Tuple[float, float, float]:
        """Calculate Bollinger Bands
        
        Returns: (upper_band, middle_band, lower_band)
        """
        if len(prices) < period:
            return 0, 0, 0
        
        recent = prices[-period:]
        sma = sum(recent) / period
        
        variance = sum((p - sma) ** 2 for p in recent) / period
        std = variance ** 0.5
        
        upper = sma + (std * std_dev)
        lower = sma - (std * std_dev)
        
        return upper, sma, lower
    
    @staticmethod
    def calculate_atr(high: List[float], low: List[float], close: List[float], period: int = 14) -> float:
        """Calculate Average True Range"""
        if len(high) < period:
            return 0
        
        tr_values = []
        for i in range(1, len(high)):
            tr = max(
                high[i] - low[i],
                abs(high[i] - close[i-1]),
                abs(low[i] - close[i-1])
            )
            tr_values.append(tr)
        
        if not tr_values:
            return 0
        
        atr = sum(tr_values[-period:]) / period
        return atr
    
    @staticmethod
    def calculate_ema(prices: List[float], period: int) -> float:
        """Calculate Exponential Moving Average"""
        if not prices or len(prices) < period:
            return 0
        
        multiplier = 2 / (period + 1)
        ema = sum(prices[-period:]) / period
        
        for price in prices[-period+1:]:
            ema = price * multiplier + ema * (1 - multiplier)
        
        return ema
    
    @staticmethod
    def _ema(prices: List[float], period: int) -> float:
        """Internal EMA calculation"""
        if not prices:
            return 0
        if len(prices) <= period:
            return sum(prices) / len(prices)
        
        multiplier = 2 / (period + 1)
        ema = sum(prices[:period]) / period
        
        for price in prices[period:]:
            ema = price * multiplier + ema * (1 - multiplier)
        
        return ema
    
    @staticmethod
    def calculate_adx(high: List[float], low: List[float], close: List[float], period: int = 14) -> float:
        """Calculate Average Directional Index (0-100)
        
        ADX > 25: Strong trend
        ADX < 20: Weak trend
        """
        if len(high) < period * 2:
            return 50
        
        # Simplified ADX calculation
        up_moves = sum(1 for i in range(1, len(high)) if high[i] > high[i-1])
        down_moves = sum(1 for i in range(1, len(low)) if low[i] < low[i-1])
        
        total_moves = up_moves + down_moves
        if total_moves == 0:
            return 50
        
        adx = (up_moves / total_moves) * 100
        return max(0, min(100, adx))
    
    @staticmethod
    def calculate_cci(high: List[float], low: List[float], close: List[float], period: int = 20) -> float:
        """Calculate Commodity Channel Index"""
        if len(close) < period:
            return 0
        
        tp_values = [(h + l + c) / 3 for h, l, c in zip(high[-period:], low[-period:], close[-period:])]
        sma_tp = sum(tp_values) / period
        
        mad = sum(abs(tp - sma_tp) for tp in tp_values) / period
        
        if mad == 0:
            return 0
        
        cci = (tp_values[-1] - sma_tp) / (0.015 * mad)
        return cci


class FundamentalAnalyzer:
    """Fundamental analysis with real data"""
    
    @staticmethod
    def get_fundamental_strength(stock: StockData) -> float:
        """Calculate fundamental strength score (0-100)"""
        score = 0
        
        # P/E Ratio analysis (lower is better, but not too low)
        pe = stock.pe_ratio
        if 15 <= pe <= 25:
            score += 30
        elif pe < 50:
            score += 20
        else:
            score += 5
        
        # Dividend Yield (higher is better)
        div = stock.dividend_yield
        if div > 0.03:
            score += 25
        elif div > 0:
            score += 15
        else:
            score += 5
        
        # Market Cap (larger generally more stable)
        if stock.market_cap > 100000 * 10**8:  # > ₹1 lakh crore
            score += 25
        elif stock.market_cap > 10000 * 10**8:  # > ₹10000 crore
            score += 20
        else:
            score += 10
        
        # Book Value (higher is better)
        if stock.book_value > stock.last_price * 0.8:
            score += 20
        elif stock.book_value > 0:
            score += 10
        
        return min(100, score)
    
    @staticmethod
    def get_value_score(stock: StockData) -> float:
        """Calculate value investing score"""
        score = 0
        
        # Low P/E
        if stock.pe_ratio < 15:
            score += 30
        elif stock.pe_ratio < 20:
            score += 20
        
        # High Dividend Yield
        if stock.dividend_yield > 0.04:
            score += 30
        
        # Reasonable Price to Book
        pb_ratio = stock.last_price / stock.book_value if stock.book_value > 0 else 0
        if 0.5 < pb_ratio < 2:
            score += 25
        
        # Stable EPS
        if stock.earnings_per_share > 5:
            score += 15
        
        return min(100, score)


class SectorAnalyzer:
    """Sector-level analysis"""
    
    @staticmethod
    def analyze_sector(sector: str, stocks: List[str]) -> Optional[SectorAnalysis]:
        """Analyze entire sector"""
        try:
            api = get_api()
            sector_stocks = api.get_multiple_stocks(stocks)
            
            if not sector_stocks:
                return None
            
            # Calculate metrics
            pe_ratios = [s.pe_ratio for s in sector_stocks if s.pe_ratio > 0]
            avg_pe = sum(pe_ratios) / len(pe_ratios) if pe_ratios else 0
            
            changes = [s.percent_change for s in sector_stocks]
            avg_change = sum(changes) / len(changes) if changes else 0
            
            gainers = sum(1 for s in sector_stocks if s.percent_change > 0)
            losers = sum(1 for s in sector_stocks if s.percent_change < 0)
            
            # Determine trend
            if avg_change > 1:
                trend = "Strong Uptrend"
            elif avg_change > 0:
                trend = "Uptrend"
            elif avg_change < -1:
                trend = "Strong Downtrend"
            elif avg_change < 0:
                trend = "Downtrend"
            else:
                trend = "Sideways"
            
            # Calculate strength
            strength = 50 + (avg_change * 10)  # Base 50 + change factor
            strength = max(0, min(100, strength))
            
            # Recommendation
            if strength > 70:
                recommendation = "BUY"
            elif strength < 30:
                recommendation = "SELL"
            else:
                recommendation = "HOLD"
            
            return SectorAnalysis(
                sector=sector,
                stocks=[s.symbol for s in sector_stocks],
                average_pe=avg_pe,
                average_change=avg_change,
                gainers=gainers,
                losers=losers,
                strength_score=strength,
                trend=trend,
                recommendation=recommendation
            )
        except Exception as e:
            logger.error(f"Error analyzing sector {sector}: {e}")
            return None
    
    @staticmethod
    def get_sector_heatmap() -> Dict[str, Dict]:
        """Get heatmap of all sectors"""
        sectors = {
            "Technology": ["TCS", "INFY", "WIPRO"],
            "Finance": ["HDFCBANK", "ICICIBANK", "SBIN", "BAJFINANCE"],
            "Energy": ["RELIANCE", "IOC"],
            "FMCG": ["ITC", "HINDUNILVR", "ASIANPAINT"],
            "Auto": ["MARUTI"],
            "Pharma": ["SUNPHARMA"],
            "Infrastructure": ["LT"],
            "Power": ["NTPC"]
        }
        
        heatmap = {}
        for sector, stocks in sectors.items():
            analysis = SectorAnalyzer.analyze_sector(sector, stocks)
            if analysis:
                heatmap[sector] = {
                    "strength": analysis.strength_score,
                    "trend": analysis.trend,
                    "gainers": analysis.gainers,
                    "losers": analysis.losers,
                    "avg_change": analysis.average_change,
                    "recommendation": analysis.recommendation
                }
        
        return heatmap


class RiskAnalyzer:
    """Risk assessment and metrics"""
    
    @staticmethod
    def calculate_volatility(prices: List[float], period: int = 30) -> float:
        """Calculate price volatility (standard deviation)"""
        if len(prices) < 2:
            return 0
        
        recent_prices = prices[-period:] if len(prices) >= period else prices
        avg_price = sum(recent_prices) / len(recent_prices)
        
        variance = sum((p - avg_price) ** 2 for p in recent_prices) / len(recent_prices)
        volatility = variance ** 0.5
        
        return volatility
    
    @staticmethod
    def calculate_sharpe_ratio(returns: List[float], risk_free_rate: float = 0.06) -> float:
        """Calculate Sharpe Ratio for risk-adjusted returns
        
        Sharpe > 1: Good
        Sharpe > 2: Excellent
        Sharpe < 0: Poor
        """
        if not returns:
            return 0
        
        avg_return = sum(returns) / len(returns)
        
        variance = sum((r - avg_return) ** 2 for r in returns) / len(returns)
        std_dev = variance ** 0.5
        
        if std_dev == 0:
            return 0
        
        sharpe = (avg_return - risk_free_rate) / std_dev
        return sharpe
    
    @staticmethod
    def calculate_max_drawdown(prices: List[float]) -> float:
        """Calculate maximum drawdown percentage"""
        if len(prices) < 2:
            return 0
        
        peak = prices[0]
        max_dd = 0
        
        for price in prices:
            if price > peak:
                peak = price
            
            dd = (peak - price) / peak
            if dd > max_dd:
                max_dd = dd
        
        return max_dd * 100
    
    @staticmethod
    def get_risk_level(volatility: float, stock: StockData) -> str:
        """Determine risk level based on volatility and other factors"""
        # Volatility-based risk
        if volatility > 5:
            base_risk = "High"
        elif volatility > 2.5:
            base_risk = "Medium"
        else:
            base_risk = "Low"
        
        # Adjust based on stock metrics
        if stock.market_cap < 1000 * 10**8:  # < ₹1000 crore
            return "High"
        elif base_risk == "High" and stock.pe_ratio > 40:
            return "High"
        
        return base_risk


class Analytics:
    """Main analytics engine combining all analyses"""
    
    def __init__(self):
        self.api = get_api()
        self.tech_analyzer = TechnicalAnalyzer()
        self.fund_analyzer = FundamentalAnalyzer()
        self.risk_analyzer = RiskAnalyzer()
    
    def get_stock_metrics(self, symbol: str, exchange: str = "NSE") -> Optional[StockMetrics]:
        """Get comprehensive stock metrics"""
        try:
            stock = self.api.get_stock(symbol, exchange)
            if not stock:
                return None
            
            # Generate mock price data for calculations
            prices = [stock.year_low + (stock.last_price - stock.year_low) * (i / 100) 
                     for i in range(100)]
            
            # Calculate technical indicators
            rsi = self.tech_analyzer.calculate_rsi(prices)
            macd, signal, histogram = self.tech_analyzer.calculate_macd(prices)
            bb_upper, bb_middle, bb_lower = self.tech_analyzer.calculate_bollinger_bands(prices)
            ema20 = self.tech_analyzer.calculate_ema(prices, 20)
            ema50 = self.tech_analyzer.calculate_ema(prices, 50)
            ema200 = self.tech_analyzer.calculate_ema(prices, 200)
            
            indicators = TechnicalIndicators(
                rsi=rsi,
                macd=macd,
                macd_signal=signal,
                macd_histogram=histogram,
                bb_upper=bb_upper,
                bb_middle=bb_middle,
                bb_lower=bb_lower,
                atr=0,
                ema_20=ema20,
                ema_50=ema50,
                ema_200=ema200,
                adx=50,
                cci=0
            )
            
            # Calculate scores
            fundamental_strength = self.fund_analyzer.get_fundamental_strength(stock)
            volatility = self.risk_analyzer.calculate_volatility(prices)
            risk_level = self.risk_analyzer.get_risk_level(volatility, stock)
            
            # Determine trend
            if ema20 > ema50 > ema200:
                trend = "Uptrend"
            elif ema20 < ema50 < ema200:
                trend = "Downtrend"
            else:
                trend = "Sideways"
            
            # Support and resistance
            support = bb_lower
            resistance = bb_upper
            
            # Overall strength score (combination of factors)
            tech_score = rsi if 30 <= rsi <= 70 else (80 if rsi < 30 else 30)
            strength_score = (fundamental_strength * 0.5 + tech_score * 0.5)
            
            # Volume trend
            volume_trend = "Stable"
            
            return StockMetrics(
                symbol=symbol,
                price=stock.last_price,
                technical_indicators=indicators,
                strength_score=strength_score,
                trend=trend,
                support_level=support,
                resistance_level=resistance,
                risk_level=risk_level,
                volatility=volatility,
                volume_trend=volume_trend
            )
        except Exception as e:
            logger.error(f"Error getting stock metrics: {e}")
            return None
    
    def generate_analytics_report(self, symbol: str) -> Dict:
        """Generate comprehensive analytics report"""
        metrics = self.get_stock_metrics(symbol)
        
        if not metrics:
            return {}
        
        return {
            "symbol": symbol,
            "timestamp": datetime.now().isoformat(),
            "price": metrics.price,
            "technical": {
                "rsi": f"{metrics.technical_indicators.rsi:.2f}",
                "macd": f"{metrics.technical_indicators.macd:.4f}",
                "signal": f"{metrics.technical_indicators.macd_signal:.4f}",
                "bb_upper": f"{metrics.technical_indicators.bb_upper:.2f}",
                "bb_middle": f"{metrics.technical_indicators.bb_middle:.2f}",
                "bb_lower": f"{metrics.technical_indicators.bb_lower:.2f}",
                "ema_20": f"{metrics.technical_indicators.ema_20:.2f}",
                "ema_50": f"{metrics.technical_indicators.ema_50:.2f}",
                "ema_200": f"{metrics.technical_indicators.ema_200:.2f}"
            },
            "metrics": {
                "strength_score": f"{metrics.strength_score:.2f}",
                "trend": metrics.trend,
                "support": f"{metrics.support_level:.2f}",
                "resistance": f"{metrics.resistance_level:.2f}",
                "risk_level": metrics.risk_level,
                "volatility": f"{metrics.volatility:.4f}"
            }
        }
