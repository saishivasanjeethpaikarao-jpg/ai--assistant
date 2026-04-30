"""
Real Trading Intelligence Module
Data-driven trading signals using real market data.
"""

from .data_source import RealDataSource, get_data_source
from .indicators import TechnicalIndicators
from .signal_generator import SignalGenerator, TradingSignal

__all__ = [
    'RealDataSource',
    'get_data_source',
    'TechnicalIndicators',
    'SignalGenerator',
    'TradingSignal'
]
