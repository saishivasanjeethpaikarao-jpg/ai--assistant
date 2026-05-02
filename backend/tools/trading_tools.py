"""
Trading Tools — Market analysis, recommendations, and execution.
Integrates with the trading subsystem for AIRIS assistant.
"""

from typing import Dict, Any, Optional
from . import ToolResult, ToolCategory


class TradingTools:
    """Trading-related tools for AIRIS."""
    
    def __init__(self):
        self.category = ToolCategory.TRADING
    
    def analyze_symbol(self, symbol: str) -> ToolResult:
        """Analyze a trading symbol (stock, crypto, etc.)."""
        try:
            # Import from trading subsystem
            from trading.signal_generator import SignalGenerator
            from trading.data_source import get_data_source
            
            data_source = get_data_source()
            signal_gen = SignalGenerator()
            
            # Get company info
            info = data_source.get_company_info(symbol)
            
            # Generate signals
            signals = signal_gen.generate_signals(symbol)
            
            return ToolResult(
                success=True,
                message=f"Analysis complete for {symbol}",
                data={
                    "symbol": symbol,
                    "info": info,
                    "signals": signals
                }
            )
        except Exception as e:
            return ToolResult(
                success=False,
                message=f"Analysis failed: {str(e)}"
            )
    
    def get_watchlist(self) -> ToolResult:
        """Get current trading watchlist."""
        try:
            from trading.signal_generator import SignalGenerator
            
            signal_gen = SignalGenerator()
            watchlist = signal_gen.get_watchlist()
            
            return ToolResult(
                success=True,
                message=f"Watchlist has {len(watchlist)} items",
                data={"watchlist": watchlist}
            )
        except Exception as e:
            return ToolResult(
                success=False,
                message=f"Failed to get watchlist: {str(e)}"
            )
    
    def add_to_watchlist(self, symbol: str) -> ToolResult:
        """Add symbol to watchlist."""
        try:
            from trading.signal_generator import SignalGenerator
            
            signal_gen = SignalGenerator()
            signal_gen.add_to_watchlist(symbol)
            
            return ToolResult(
                success=True,
                message=f"Added {symbol} to watchlist"
            )
        except Exception as e:
            return ToolResult(
                success=False,
                message=f"Failed to add to watchlist: {str(e)}"
            )
    
    def get_market_summary(self) -> ToolResult:
        """Get overall market summary."""
        try:
            from trading.signal_generator import SignalGenerator
            from trading.data_source import get_data_source
            
            data_source = get_data_source()
            signal_gen = SignalGenerator()
            
            # Get market indices
            indices = data_source.get_market_indices()
            
            # Get top movers
            movers = data_source.get_top_movers()
            
            return ToolResult(
                success=True,
                message="Market summary retrieved",
                data={
                    "indices": indices,
                    "top_movers": movers
                }
            )
        except Exception as e:
            return ToolResult(
                success=False,
                message=f"Failed to get market summary: {str(e)}"
            )


# Singleton instance
trading_tools = TradingTools()


# Register tools
from . import tool_registry

tool_registry.register("trading_analyze", trading_tools.analyze_symbol)
tool_registry.register("trading_watchlist", trading_tools.get_watchlist)
tool_registry.register("trading_add_watchlist", trading_tools.add_to_watchlist)
tool_registry.register("trading_market_summary", trading_tools.get_market_summary)
