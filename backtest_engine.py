"""
Backtesting Engine - Strategy Performance Analysis
Historical data simulation, strategy testing, and detailed performance metrics
"""

import json
import os
from typing import Dict, List, Tuple, Optional, Callable
from dataclasses import dataclass, asdict, field
from datetime import datetime, timedelta
from enum import Enum
import logging
import statistics

logger = logging.getLogger(__name__)

BACKTEST_DIR = "memory/backtests"


class TradeType(Enum):
    """Buy or Sell"""
    BUY = "buy"
    SELL = "sell"


class OrderStatus(Enum):
    """Order states"""
    PENDING = "pending"
    FILLED = "filled"
    CANCELLED = "cancelled"


@dataclass
class Trade:
    """Individual trade record"""
    id: str
    symbol: str
    entry_date: str
    entry_price: float
    entry_type: TradeType
    quantity: int
    exit_date: Optional[str] = None
    exit_price: Optional[float] = None
    profit_loss: Optional[float] = None
    profit_loss_pct: Optional[float] = None
    duration_days: Optional[int] = None


@dataclass
class BacktestResult:
    """Backtest performance metrics"""
    strategy_name: str
    symbol: str
    start_date: str
    end_date: str
    initial_capital: float
    final_value: float
    total_return: float
    total_return_pct: float
    
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    
    total_profit: float
    total_loss: float
    profit_factor: float
    
    avg_trade_return: float
    avg_win: float
    avg_loss: float
    expectancy: float
    
    max_drawdown: float
    sharpe_ratio: float
    sortino_ratio: float
    calmar_ratio: float
    
    trades: List[Trade] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            "strategy_name": self.strategy_name,
            "symbol": self.symbol,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "initial_capital": self.initial_capital,
            "final_value": self.final_value,
            "total_return": f"${self.total_return:.2f}",
            "total_return_pct": f"{self.total_return_pct:.2f}%",
            "total_trades": self.total_trades,
            "winning_trades": self.winning_trades,
            "losing_trades": self.losing_trades,
            "win_rate": f"{self.win_rate:.2f}%",
            "total_profit": f"${self.total_profit:.2f}",
            "total_loss": f"${self.total_loss:.2f}",
            "profit_factor": f"{self.profit_factor:.2f}",
            "avg_trade_return": f"${self.avg_trade_return:.2f}",
            "avg_win": f"${self.avg_win:.2f}",
            "avg_loss": f"${self.avg_loss:.2f}",
            "expectancy": f"${self.expectancy:.2f}",
            "max_drawdown": f"{self.max_drawdown:.2f}%",
            "sharpe_ratio": f"{self.sharpe_ratio:.2f}",
            "sortino_ratio": f"{self.sortino_ratio:.2f}",
            "calmar_ratio": f"{self.calmar_ratio:.2f}"
        }


@dataclass
class OHLCV:
    """OHLCV price data"""
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class HistoricalDataSimulator:
    """Simulate historical price data"""
    
    @staticmethod
    def generate_sample_data(symbol: str, start_date: str, end_date: str,
                           initial_price: float = 100, trend: str = "neutral") -> List[OHLCV]:
        """Generate realistic OHLCV data for backtesting
        
        trend: "uptrend", "downtrend", "neutral", "volatile"
        """
        ohlcv_data = []
        
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        
        current_date = start
        current_price = initial_price
        
        while current_date <= end:
            # Skip weekends
            if current_date.weekday() >= 5:
                current_date += timedelta(days=1)
                continue
            
            # Generate price movement based on trend
            if trend == "uptrend":
                daily_return = 0.002  # 0.2% average
                volatility = 0.01
            elif trend == "downtrend":
                daily_return = -0.002
                volatility = 0.01
            elif trend == "volatile":
                daily_return = 0
                volatility = 0.03
            else:  # neutral
                daily_return = 0
                volatility = 0.01
            
            # Generate OHLCV
            open_price = current_price
            close_price = open_price * (1 + daily_return + (volatility * (0.5 - __import__('random').random())))
            high_price = max(open_price, close_price) * (1 + abs(volatility * __import__('random').random()))
            low_price = min(open_price, close_price) * (1 - abs(volatility * __import__('random').random()))
            volume = int(1000000 * (0.5 + __import__('random').random()))
            
            ohlcv_data.append(OHLCV(
                date=current_date.strftime("%Y-%m-%d"),
                open=round(open_price, 2),
                high=round(high_price, 2),
                low=round(low_price, 2),
                close=round(close_price, 2),
                volume=volume
            ))
            
            current_price = close_price
            current_date += timedelta(days=1)
        
        return ohlcv_data


class BacktestEngine:
    """Main backtesting engine"""
    
    def __init__(self, initial_capital: float = 100000):
        self.initial_capital = initial_capital
        self.current_cash = initial_capital
        self.positions: Dict[str, Dict] = {}
        self.trades: List[Trade] = []
        self.equity_curve: List[Tuple[str, float]] = []
        self.trade_counter = 0
    
    def backtest_simple_moving_average(self, symbol: str, ohlcv_data: List[OHLCV],
                                      short_window: int = 20,
                                      long_window: int = 50) -> BacktestResult:
        """Backtest Simple Moving Average crossover strategy
        
        Buy: When SMA(20) > SMA(50)
        Sell: When SMA(20) < SMA(50)
        """
        closes = [float(d.close) for d in ohlcv_data]
        
        for i in range(len(ohlcv_data)):
            if i < long_window:
                continue
            
            short_sma = statistics.mean(closes[i-short_window:i])
            long_sma = statistics.mean(closes[i-long_window:i])
            
            current_price = ohlcv_data[i].close
            date = ohlcv_data[i].date
            
            # Buy signal
            if short_sma > long_sma and symbol not in self.positions:
                shares = int(self.current_cash / current_price)
                if shares > 0:
                    self._enter_position(symbol, date, current_price, TradeType.BUY, shares)
            
            # Sell signal
            elif short_sma < long_sma and symbol in self.positions:
                shares = self.positions[symbol]["quantity"]
                self._exit_position(symbol, date, current_price, shares)
            
            # Record equity
            self.equity_curve.append((date, self._calculate_total_equity(symbol, current_price)))
        
        # Close any remaining positions
        if symbol in self.positions and len(ohlcv_data) > 0:
            last_price = ohlcv_data[-1].close
            last_date = ohlcv_data[-1].date
            shares = self.positions[symbol]["quantity"]
            self._exit_position(symbol, last_date, last_price, shares)
        
        return self._generate_backtest_result(symbol, "SMA Crossover", ohlcv_data)
    
    def backtest_bollinger_bands(self, symbol: str, ohlcv_data: List[OHLCV],
                                window: int = 20, num_std: float = 2.0) -> BacktestResult:
        """Backtest Bollinger Bands strategy
        
        Buy: Price touches lower band
        Sell: Price touches upper band
        """
        closes = [float(d.close) for d in ohlcv_data]
        
        for i in range(len(ohlcv_data)):
            if i < window:
                continue
            
            # Calculate Bollinger Bands
            sma = statistics.mean(closes[i-window:i])
            std = statistics.stdev(closes[i-window:i])
            upper_band = sma + (std * num_std)
            lower_band = sma - (std * num_std)
            
            current_price = ohlcv_data[i].close
            date = ohlcv_data[i].date
            
            # Buy when price touches lower band
            if current_price <= lower_band and symbol not in self.positions:
                shares = int(self.current_cash * 0.95 / current_price)
                if shares > 0:
                    self._enter_position(symbol, date, current_price, TradeType.BUY, shares)
            
            # Sell when price touches upper band
            elif current_price >= upper_band and symbol in self.positions:
                shares = self.positions[symbol]["quantity"]
                self._exit_position(symbol, date, current_price, shares)
            
            self.equity_curve.append((date, self._calculate_total_equity(symbol, current_price)))
        
        # Close remaining positions
        if symbol in self.positions and len(ohlcv_data) > 0:
            last_price = ohlcv_data[-1].close
            last_date = ohlcv_data[-1].date
            shares = self.positions[symbol]["quantity"]
            self._exit_position(symbol, last_date, last_price, shares)
        
        return self._generate_backtest_result(symbol, "Bollinger Bands", ohlcv_data)
    
    def backtest_momentum(self, symbol: str, ohlcv_data: List[OHLCV],
                         momentum_window: int = 14) -> BacktestResult:
        """Backtest Momentum strategy
        
        Buy: Momentum crosses above zero
        Sell: Momentum crosses below zero
        """
        closes = [float(d.close) for d in ohlcv_data]
        
        for i in range(len(ohlcv_data)):
            if i < momentum_window:
                continue
            
            # Calculate momentum
            momentum = closes[i] - closes[i-momentum_window]
            
            current_price = ohlcv_data[i].close
            date = ohlcv_data[i].date
            
            # Buy signal
            if momentum > 0 and symbol not in self.positions:
                shares = int(self.current_cash * 0.95 / current_price)
                if shares > 0:
                    self._enter_position(symbol, date, current_price, TradeType.BUY, shares)
            
            # Sell signal
            elif momentum < 0 and symbol in self.positions:
                shares = self.positions[symbol]["quantity"]
                self._exit_position(symbol, date, current_price, shares)
            
            self.equity_curve.append((date, self._calculate_total_equity(symbol, current_price)))
        
        # Close remaining positions
        if symbol in self.positions and len(ohlcv_data) > 0:
            last_price = ohlcv_data[-1].close
            last_date = ohlcv_data[-1].date
            shares = self.positions[symbol]["quantity"]
            self._exit_position(symbol, last_date, last_price, shares)
        
        return self._generate_backtest_result(symbol, "Momentum", ohlcv_data)
    
    def _enter_position(self, symbol: str, date: str, price: float,
                       trade_type: TradeType, quantity: int):
        """Enter a trading position"""
        cost = price * quantity
        if cost <= self.current_cash:
            self.current_cash -= cost
            self.positions[symbol] = {
                "entry_date": date,
                "entry_price": price,
                "quantity": quantity
            }
            self.trade_counter += 1
    
    def _exit_position(self, symbol: str, date: str, price: float, quantity: int):
        """Exit a trading position"""
        if symbol in self.positions:
            entry = self.positions[symbol]
            proceeds = price * quantity
            self.current_cash += proceeds
            
            profit_loss = (price - entry["entry_price"]) * quantity
            profit_loss_pct = (profit_loss / (entry["entry_price"] * quantity)) * 100
            
            duration = (datetime.strptime(date, "%Y-%m-%d") - 
                       datetime.strptime(entry["entry_date"], "%Y-%m-%d")).days
            
            trade = Trade(
                id=f"trade_{self.trade_counter}",
                symbol=symbol,
                entry_date=entry["entry_date"],
                entry_price=entry["entry_price"],
                entry_type=TradeType.BUY,
                quantity=quantity,
                exit_date=date,
                exit_price=price,
                profit_loss=profit_loss,
                profit_loss_pct=profit_loss_pct,
                duration_days=duration
            )
            
            self.trades.append(trade)
            del self.positions[symbol]
    
    def _calculate_total_equity(self, symbol: str, current_price: float) -> float:
        """Calculate total portfolio equity"""
        equity = self.current_cash
        
        for pos_symbol, position in self.positions.items():
            if pos_symbol == symbol:
                equity += current_price * position["quantity"]
        
        return equity
    
    def _generate_backtest_result(self, symbol: str, strategy_name: str,
                                ohlcv_data: List[OHLCV]) -> BacktestResult:
        """Generate comprehensive backtest results"""
        
        if not ohlcv_data:
            return None
        
        final_value = self._calculate_total_equity(symbol, ohlcv_data[-1].close)
        total_return = final_value - self.initial_capital
        total_return_pct = (total_return / self.initial_capital) * 100
        
        # Trade statistics
        winning_trades = [t for t in self.trades if t.profit_loss > 0]
        losing_trades = [t for t in self.trades if t.profit_loss < 0]
        
        win_rate = (len(winning_trades) / len(self.trades) * 100) if self.trades else 0
        
        total_profit = sum(t.profit_loss for t in winning_trades)
        total_loss = abs(sum(t.profit_loss for t in losing_trades))
        profit_factor = total_profit / total_loss if total_loss > 0 else 0
        
        # Average returns
        avg_trade_return = statistics.mean([t.profit_loss for t in self.trades]) if self.trades else 0
        avg_win = statistics.mean([t.profit_loss for t in winning_trades]) if winning_trades else 0
        avg_loss = statistics.mean([t.profit_loss for t in losing_trades]) if losing_trades else 0
        
        # Expectancy
        expectancy = (win_rate / 100 * avg_win) - ((100 - win_rate) / 100 * abs(avg_loss))
        
        # Risk metrics
        equity_returns = [float(e[1]) for e in self.equity_curve]
        max_drawdown = self._calculate_max_drawdown(equity_returns)
        sharpe_ratio = self._calculate_sharpe_ratio(equity_returns)
        sortino_ratio = self._calculate_sortino_ratio(equity_returns)
        calmar_ratio = total_return_pct / max_drawdown if max_drawdown > 0 else 0
        
        return BacktestResult(
            strategy_name=strategy_name,
            symbol=symbol,
            start_date=ohlcv_data[0].date,
            end_date=ohlcv_data[-1].date,
            initial_capital=self.initial_capital,
            final_value=final_value,
            total_return=total_return,
            total_return_pct=total_return_pct,
            total_trades=len(self.trades),
            winning_trades=len(winning_trades),
            losing_trades=len(losing_trades),
            win_rate=win_rate,
            total_profit=total_profit,
            total_loss=total_loss,
            profit_factor=profit_factor,
            avg_trade_return=avg_trade_return,
            avg_win=avg_win,
            avg_loss=avg_loss,
            expectancy=expectancy,
            max_drawdown=max_drawdown,
            sharpe_ratio=sharpe_ratio,
            sortino_ratio=sortino_ratio,
            calmar_ratio=calmar_ratio,
            trades=self.trades
        )
    
    @staticmethod
    def _calculate_max_drawdown(equity_curve: List[float]) -> float:
        """Calculate maximum drawdown percentage"""
        if not equity_curve:
            return 0
        
        peak = equity_curve[0]
        max_dd = 0
        
        for equity in equity_curve:
            if equity > peak:
                peak = equity
            
            dd = (peak - equity) / peak * 100
            if dd > max_dd:
                max_dd = dd
        
        return max_dd
    
    @staticmethod
    def _calculate_sharpe_ratio(returns: List[float], risk_free_rate: float = 0.06) -> float:
        """Calculate Sharpe Ratio"""
        if len(returns) < 2:
            return 0
        
        daily_returns = []
        for i in range(1, len(returns)):
            daily_return = (returns[i] - returns[i-1]) / returns[i-1]
            daily_returns.append(daily_return)
        
        if not daily_returns:
            return 0
        
        avg_return = statistics.mean(daily_returns)
        std_dev = statistics.stdev(daily_returns) if len(daily_returns) > 1 else 0
        
        if std_dev == 0:
            return 0
        
        sharpe = (avg_return - risk_free_rate / 252) / std_dev
        return sharpe
    
    @staticmethod
    def _calculate_sortino_ratio(returns: List[float], risk_free_rate: float = 0.06) -> float:
        """Calculate Sortino Ratio (only penalizes downside volatility)"""
        if len(returns) < 2:
            return 0
        
        daily_returns = []
        for i in range(1, len(returns)):
            daily_return = (returns[i] - returns[i-1]) / returns[i-1]
            daily_returns.append(daily_return)
        
        if not daily_returns:
            return 0
        
        avg_return = statistics.mean(daily_returns)
        
        # Downside volatility
        downside_returns = [r for r in daily_returns if r < 0]
        downside_std = statistics.stdev(downside_returns) if len(downside_returns) > 1 else 0
        
        if downside_std == 0:
            return 0
        
        sortino = (avg_return - risk_free_rate / 252) / downside_std
        return sortino


class BacktestComparison:
    """Compare multiple strategies"""
    
    @staticmethod
    def compare_strategies(symbol: str, ohlcv_data: List[OHLCV]) -> Dict[str, Dict]:
        """Compare different trading strategies"""
        
        results = {}
        
        # Test SMA strategy
        engine1 = BacktestEngine(100000)
        results["SMA_Crossover"] = engine1.backtest_simple_moving_average(symbol, ohlcv_data).to_dict()
        
        # Test Bollinger Bands strategy
        engine2 = BacktestEngine(100000)
        results["Bollinger_Bands"] = engine2.backtest_bollinger_bands(symbol, ohlcv_data).to_dict()
        
        # Test Momentum strategy
        engine3 = BacktestEngine(100000)
        results["Momentum"] = engine3.backtest_momentum(symbol, ohlcv_data).to_dict()
        
        return results
    
    @staticmethod
    def save_backtest_results(results: BacktestResult, filename: str = None):
        """Save backtest results to file"""
        try:
            os.makedirs(BACKTEST_DIR, exist_ok=True)
            
            if filename is None:
                filename = f"backtest_{results.symbol}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            filepath = os.path.join(BACKTEST_DIR, filename)
            
            with open(filepath, 'w') as f:
                json.dump(results.to_dict(), f, indent=2)
            
            logger.info(f"Backtest results saved to {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Error saving backtest results: {e}")
            return None
