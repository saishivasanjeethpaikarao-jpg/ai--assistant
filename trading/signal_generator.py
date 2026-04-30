"""
Trading Signal Generator - Data-driven signals
Uses real data and indicators, not AI guesses.
"""

import logging
from typing import Dict, List, Optional, Tuple
from .data_source import get_data_source
from .indicators import TechnicalIndicators

logger = logging.getLogger(__name__)


class TradingSignal:
    """Trading signal with confidence and reasoning."""
    
    def __init__(self, symbol: str, signal: str, confidence: float, 
                 entry: float, target: float, stop_loss: float, 
                 reasoning: List[str]):
        self.symbol = symbol
        self.signal = signal  # "BUY", "SELL", "HOLD"
        self.confidence = confidence  # 0-100
        self.entry = entry
        self.target = target
        self.stop_loss = stop_loss
        self.reasoning = reasoning


class SignalGenerator:
    """Generate trading signals from real data and indicators."""
    
    def __init__(self):
        self.data_source = get_data_source()
        self.indicators = TechnicalIndicators()
    
    def generate_signal(self, symbol: str) -> Optional[TradingSignal]:
        """
        Generate trading signal for a stock.
        
        Args:
            symbol: Stock symbol
            
        Returns:
            TradingSignal or None
        """
        # Get historical data
        data = self.data_source.get_stock_data(symbol, period="3mo")
        if not data:
            logger.error(f"Could not get data for {symbol}")
            return None
        
        prices = data['close']
        current_price = data['current_price']
        
        # Calculate indicators
        rsi = self.indicators.get_latest_rsi(prices, 14)
        sma_50 = self.indicators.get_latest_sma(prices, 50)
        sma_200 = self.indicators.get_latest_sma(prices, 200)
        ema_20 = self.indicators.get_latest_ema(prices, 20)
        
        # Generate signal based on indicators
        signal, confidence, reasoning = self._analyze_indicators(
            current_price, rsi, sma_50, sma_200, ema_20
        )
        
        # Calculate entry, target, stop-loss
        entry = current_price
        target, stop_loss = self._calculate_levels(
            current_price, signal, prices[-20:]
        )
        
        return TradingSignal(
            symbol=symbol,
            signal=signal,
            confidence=confidence,
            entry=entry,
            target=target,
            stop_loss=stop_loss,
            reasoning=reasoning
        )
    
    def _analyze_indicators(self, price: float, rsi: Optional[float],
                           sma_50: Optional[float], sma_200: Optional[float],
                           ema_20: Optional[float]) -> Tuple[str, float, List[str]]:
        """
        Analyze indicators and generate signal.
        
        Returns:
            Tuple of (signal, confidence, reasoning)
        """
        buy_signals = 0
        sell_signals = 0
        reasoning = []
        
        # RSI Analysis
        if rsi:
            if rsi < 30:
                buy_signals += 2
                reasoning.append(f"RSI ({rsi:.1f}) indicates oversold - potential buy")
            elif rsi > 70:
                sell_signals += 2
                reasoning.append(f"RSI ({rsi:.1f}) indicates overbought - potential sell")
            elif rsi < 40:
                buy_signals += 1
                reasoning.append(f"RSI ({rsi:.1f}) approaching oversold")
            elif rsi > 60:
                sell_signals += 1
                reasoning.append(f"RSI ({rsi:.1f}) approaching overbought")
        
        # Moving Average Analysis
        if sma_50 and sma_200:
            if price > sma_50 > sma_200:
                buy_signals += 2
                reasoning.append("Price above 50-day and 200-day MA - bullish trend")
            elif price < sma_50 < sma_200:
                sell_signals += 2
                reasoning.append("Price below 50-day and 200-day MA - bearish trend")
            elif price > sma_50:
                buy_signals += 1
                reasoning.append("Price above 50-day MA - short-term bullish")
            elif price < sma_50:
                sell_signals += 1
                reasoning.append("Price below 50-day MA - short-term bearish")
        
        # EMA Analysis
        if ema_20:
            if price > ema_20:
                buy_signals += 1
                reasoning.append("Price above 20-day EMA - upward momentum")
            elif price < ema_20:
                sell_signals += 1
                reasoning.append("Price below 20-day EMA - downward momentum")
        
        # Determine signal
        if buy_signals >= 3:
            signal = "BUY"
            confidence = min(85, 60 + buy_signals * 5)
        elif sell_signals >= 3:
            signal = "SELL"
            confidence = min(85, 60 + sell_signals * 5)
        elif buy_signals > sell_signals:
            signal = "BUY"
            confidence = 55
        elif sell_signals > buy_signals:
            signal = "SELL"
            confidence = 55
        else:
            signal = "HOLD"
            confidence = 50
            reasoning.append("Mixed signals - no clear direction")
        
        return signal, confidence, reasoning
    
    def _calculate_levels(self, current_price: float, signal: str,
                         recent_prices: List[float]) -> Tuple[float, float]:
        """
        Calculate target and stop-loss levels.
        
        Returns:
            Tuple of (target, stop_loss)
        """
        # Calculate ATR-like volatility
        if len(recent_prices) > 1:
            volatility = max(recent_prices) - min(recent_prices)
        else:
            volatility = current_price * 0.02  # Default 2%
        
        if signal == "BUY":
            target = current_price + (volatility * 1.5)
            stop_loss = current_price - (volatility * 0.8)
        elif signal == "SELL":
            target = current_price - (volatility * 1.5)
            stop_loss = current_price + (volatility * 0.8)
        else:  # HOLD
            target = current_price
            stop_loss = current_price
        
        return target, stop_loss
    
    def get_market_summary(self, symbols: List[str]) -> Dict:
        """
        Get summary of signals for multiple stocks.
        
        Args:
            symbols: List of stock symbols
            
        Returns:
            Dictionary with market summary
        """
        signals = []
        buy_count = 0
        sell_count = 0
        hold_count = 0
        
        for symbol in symbols:
            try:
                signal = self.generate_signal(symbol)
                if signal:
                    signals.append(signal)
                    if signal.signal == "BUY":
                        buy_count += 1
                    elif signal.signal == "SELL":
                        sell_count += 1
                    else:
                        hold_count += 1
            except Exception as e:
                logger.error(f"Failed to generate signal for {symbol}: {e}")
        
        return {
            "total_analyzed": len(symbols),
            "buy_signals": buy_count,
            "sell_signals": sell_count,
            "hold_signals": hold_count,
            "signals": signals[:10]  # Limit to top 10
        }
