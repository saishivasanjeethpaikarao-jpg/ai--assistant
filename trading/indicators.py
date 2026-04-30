"""
Technical Indicators - RSI, Moving Averages, Volume
Data-driven analysis, not AI guesses.
"""

import logging
from typing import List, Optional
import numpy as np

logger = logging.getLogger(__name__)


class TechnicalIndicators:
    """Calculate technical indicators from price data."""
    
    @staticmethod
    def calculate_rsi(prices: List[float], period: int = 14) -> List[float]:
        """
        Calculate Relative Strength Index (RSI).
        
        Args:
            prices: List of closing prices
            period: RSI period (default 14)
            
        Returns:
            List of RSI values
        """
        if len(prices) < period + 1:
            return [50.0] * len(prices)  # Default neutral
        
        prices = np.array(prices)
        deltas = np.diff(prices)
        
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        
        avg_gains = np.convolve(gains, np.ones(period)/period, mode='valid')
        avg_losses = np.convolve(losses, np.ones(period)/period, mode='valid')
        
        rs = avg_gains / (avg_losses + 1e-10)  # Avoid division by zero
        rsi = 100 - (100 / (1 + rs))
        
        # Pad with neutral values
        rsi_full = [50.0] * period + rsi.tolist()
        
        return rsi_full
    
    @staticmethod
    def calculate_sma(prices: List[float], period: int) -> List[float]:
        """
        Calculate Simple Moving Average (SMA).
        
        Args:
            prices: List of closing prices
            period: SMA period
            
        Returns:
            List of SMA values
        """
        if len(prices) < period:
            return prices.copy()
        
        prices = np.array(prices)
        sma = np.convolve(prices, np.ones(period)/period, mode='valid')
        
        # Pad with None for initial values
        sma_full = [None] * (period - 1) + sma.tolist()
        
        return sma_full
    
    @staticmethod
    def calculate_ema(prices: List[float], period: int) -> List[float]:
        """
        Calculate Exponential Moving Average (EMA).
        
        Args:
            prices: List of closing prices
            period: EMA period
            
        Returns:
            List of EMA values
        """
        if len(prices) < period:
            return prices.copy()
        
        prices = np.array(prices)
        multiplier = 2 / (period + 1)
        
        ema = [prices[0]]
        for price in prices[1:]:
            ema.append((price * multiplier) + (ema[-1] * (1 - multiplier)))
        
        return ema
    
    @staticmethod
    def calculate_volume_trend(volumes: List[int], period: int = 20) -> List[str]:
        """
        Calculate volume trend (above/below average).
        
        Args:
            volumes: List of volume values
            period: Period for average
            
        Returns:
            List of "high", "normal", or "low"
        """
        if len(volumes) < period:
            return ["normal"] * len(volumes)
        
        volumes = np.array(volumes)
        avg_volume = np.mean(volumes[-period:])
        
        trends = []
        for vol in volumes:
            if vol > avg_volume * 1.5:
                trends.append("high")
            elif vol < avg_volume * 0.5:
                trends.append("low")
            else:
                trends.append("normal")
        
        return trends
    
    @staticmethod
    def get_latest_rsi(prices: List[float], period: int = 14) -> Optional[float]:
        """Get latest RSI value."""
        rsi_values = TechnicalIndicators.calculate_rsi(prices, period)
        return rsi_values[-1] if rsi_values else None
    
    @staticmethod
    def get_latest_sma(prices: List[float], period: int = 50) -> Optional[float]:
        """Get latest SMA value."""
        sma_values = TechnicalIndicators.calculate_sma(prices, period)
        return sma_values[-1] if sma_values and sma_values[-1] is not None else None
    
    @staticmethod
    def get_latest_ema(prices: List[float], period: int = 20) -> Optional[float]:
        """Get latest EMA value."""
        ema_values = TechnicalIndicators.calculate_ema(prices, period)
        return ema_values[-1] if ema_values else None
