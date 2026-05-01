"""
Options Trading Module - NIFTY & BANKNIFTY Strategies
Greeks calculation, strategy builder, and options chain analysis
"""

import math
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
import logging

logger = logging.getLogger(__name__)

# Constants
RISK_FREE_RATE = 0.06  # 6% annual
TRADING_DAYS_PER_YEAR = 252


class OptionType(Enum):
    """Call or Put"""
    CALL = "CALL"
    PUT = "PUT"


class OptionStrategy(Enum):
    """Common options strategies"""
    BULL_CALL_SPREAD = "bull_call_spread"
    BEAR_CALL_SPREAD = "bear_call_spread"
    BULL_PUT_SPREAD = "bull_put_spread"
    BEAR_PUT_SPREAD = "bear_put_spread"
    LONG_CALL = "long_call"
    LONG_PUT = "long_put"
    COVERED_CALL = "covered_call"
    PROTECTIVE_PUT = "protective_put"
    IRON_CONDOR = "iron_condor"
    BUTTERFLY = "butterfly"
    STRADDLE = "straddle"
    STRANGLE = "strangle"


@dataclass
class GreekLetters:
    """Option Greeks"""
    delta: float    # Rate of change of option price w.r.t. underlying
    gamma: float    # Rate of change of delta
    theta: float    # Time decay per day
    vega: float     # Sensitivity to volatility (per 1% change)
    rho: float      # Sensitivity to interest rates


@dataclass
class OptionContract:
    """Single option contract"""
    symbol: str     # NIFTY, BANKNIFTY, etc.
    expiry: str     # YYYY-MM-DD
    strike: float
    option_type: OptionType
    current_price: float
    current_iv: float  # Implied Volatility
    underlying_price: float
    bid_price: float
    ask_price: float
    bid_quantity: int
    ask_quantity: int
    open_interest: int
    volume: int
    last_update: str


@dataclass
class OptionPosition:
    """Option trading position"""
    id: str
    symbol: str
    contracts: List[OptionContract]
    strategy: OptionStrategy
    entry_date: str
    quantity: int
    entry_premium: float
    current_value: float
    greeks: GreekLetters
    profit_loss: float
    profit_loss_pct: float


class BlackScholes:
    """Black-Scholes options pricing model"""
    
    @staticmethod
    def calculate_call_price(S: float, K: float, T: float, r: float, sigma: float) -> float:
        """Calculate European call option price
        
        S: Current stock price
        K: Strike price
        T: Time to expiry (in years)
        r: Risk-free rate
        sigma: Volatility (standard deviation)
        """
        if T <= 0:
            return max(S - K, 0)
        
        d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
        d2 = d1 - sigma * math.sqrt(T)
        
        call_price = S * BlackScholes._norm_cdf(d1) - K * math.exp(-r * T) * BlackScholes._norm_cdf(d2)
        return call_price
    
    @staticmethod
    def calculate_put_price(S: float, K: float, T: float, r: float, sigma: float) -> float:
        """Calculate European put option price"""
        if T <= 0:
            return max(K - S, 0)
        
        d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
        d2 = d1 - sigma * math.sqrt(T)
        
        put_price = K * math.exp(-r * T) * BlackScholes._norm_cdf(-d2) - S * BlackScholes._norm_cdf(-d1)
        return put_price
    
    @staticmethod
    def calculate_greeks(S: float, K: float, T: float, r: float, sigma: float,
                        option_type: OptionType) -> GreekLetters:
        """Calculate option Greeks"""
        
        if T <= 0:
            return GreekLetters(delta=0, gamma=0, theta=0, vega=0, rho=0)
        
        d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
        d2 = d1 - sigma * math.sqrt(T)
        
        # Delta
        if option_type == OptionType.CALL:
            delta = BlackScholes._norm_cdf(d1)
        else:
            delta = BlackScholes._norm_cdf(d1) - 1
        
        # Gamma
        gamma = BlackScholes._norm_pdf(d1) / (S * sigma * math.sqrt(T))
        
        # Theta (per day)
        if option_type == OptionType.CALL:
            theta = -(S * BlackScholes._norm_pdf(d1) * sigma / (2 * math.sqrt(T)) + 
                     r * K * math.exp(-r * T) * BlackScholes._norm_cdf(d2)) / TRADING_DAYS_PER_YEAR
        else:
            theta = -(S * BlackScholes._norm_pdf(d1) * sigma / (2 * math.sqrt(T)) - 
                     r * K * math.exp(-r * T) * BlackScholes._norm_cdf(-d2)) / TRADING_DAYS_PER_YEAR
        
        # Vega (per 1% change in volatility)
        vega = S * BlackScholes._norm_pdf(d1) * math.sqrt(T) / 100
        
        # Rho (per 1% change in interest rate)
        if option_type == OptionType.CALL:
            rho = K * T * math.exp(-r * T) * BlackScholes._norm_cdf(d2) / 100
        else:
            rho = -K * T * math.exp(-r * T) * BlackScholes._norm_cdf(-d2) / 100
        
        return GreekLetters(delta=delta, gamma=gamma, theta=theta, vega=vega, rho=rho)
    
    @staticmethod
    def _norm_cdf(x: float) -> float:
        """Cumulative normal distribution"""
        return (1 + math.erf(x / math.sqrt(2))) / 2
    
    @staticmethod
    def _norm_pdf(x: float) -> float:
        """Probability density function"""
        return math.exp(-0.5 * x ** 2) / math.sqrt(2 * math.pi)


class OptionChain:
    """Option chain analysis"""
    
    @staticmethod
    def analyze_option_chain(symbol: str, expiry: str, underlying_price: float,
                            volatility: float) -> Dict:
        """Analyze option chain for a given expiry"""
        
        # Generate ATM and surrounding strikes
        strikes = OptionChain._generate_strikes(underlying_price)
        
        chain_data = {
            "symbol": symbol,
            "expiry": expiry,
            "underlying_price": underlying_price,
            "timestamp": datetime.now().isoformat(),
            "calls": [],
            "puts": []
        }
        
        # Calculate days to expiry
        expiry_date = datetime.strptime(expiry, "%Y-%m-%d")
        days_to_expiry = (expiry_date - datetime.now()).days
        T = days_to_expiry / 365.0
        
        for strike in strikes:
            # Call option
            call_price = BlackScholes.calculate_call_price(
                underlying_price, strike, T, RISK_FREE_RATE, volatility
            )
            call_greeks = BlackScholes.calculate_greeks(
                underlying_price, strike, T, RISK_FREE_RATE, volatility, OptionType.CALL
            )
            
            chain_data["calls"].append({
                "strike": strike,
                "price": round(call_price, 2),
                "greeks": {
                    "delta": round(call_greeks.delta, 4),
                    "gamma": round(call_greeks.gamma, 6),
                    "theta": round(call_greeks.theta, 4),
                    "vega": round(call_greeks.vega, 4),
                    "rho": round(call_greeks.rho, 4)
                }
            })
            
            # Put option
            put_price = BlackScholes.calculate_put_price(
                underlying_price, strike, T, RISK_FREE_RATE, volatility
            )
            put_greeks = BlackScholes.calculate_greeks(
                underlying_price, strike, T, RISK_FREE_RATE, volatility, OptionType.PUT
            )
            
            chain_data["puts"].append({
                "strike": strike,
                "price": round(put_price, 2),
                "greeks": {
                    "delta": round(put_greeks.delta, 4),
                    "gamma": round(put_greeks.gamma, 6),
                    "theta": round(put_greeks.theta, 4),
                    "vega": round(put_greeks.vega, 4),
                    "rho": round(put_greeks.rho, 4)
                }
            })
        
        return chain_data
    
    @staticmethod
    def _generate_strikes(underlying_price: float, count: int = 11) -> List[float]:
        """Generate strike prices around underlying"""
        # Generate 5 OTM and 5 ITM strikes + ATM
        step = (underlying_price * 0.05)  # 5% steps
        strikes = []
        
        for i in range(-(count // 2), (count // 2) + 1):
            strike = underlying_price + (i * step)
            strikes.append(round(strike, 2))
        
        return sorted(strikes)
    
    @staticmethod
    def find_atm_straddle(symbol: str, underlying_price: float) -> Tuple[float, float]:
        """Find ATM straddle strike"""
        step = (underlying_price * 0.05)
        atm = round(underlying_price / step) * step
        return atm, atm
    
    @staticmethod
    def get_iv_rank(symbol: str, timeframe: str = "30d") -> float:
        """Get IV rank (0-100) indicating volatility level
        
        IV Rank < 25: Low volatility
        IV Rank 25-75: Normal volatility
        IV Rank > 75: High volatility
        """
        # Simplified IV rank calculation
        # In production, would use historical IV data
        return 50.0


class OptionsStrategies:
    """Common options strategies builder"""
    
    @staticmethod
    def bull_call_spread(symbol: str, underlying_price: float, expiry: str,
                        long_strike: float, short_strike: float,
                        volatility: float) -> Dict:
        """Bull Call Spread - Buy lower call, sell higher call
        
        Max profit: (Short strike - Long strike) - Net debit
        Max loss: Net debit paid
        Breakeven: Long strike + Net debit
        """
        T = (datetime.strptime(expiry, "%Y-%m-%d") - datetime.now()).days / 365.0
        
        long_call = BlackScholes.calculate_call_price(underlying_price, long_strike, T, RISK_FREE_RATE, volatility)
        short_call = BlackScholes.calculate_call_price(underlying_price, short_strike, T, RISK_FREE_RATE, volatility)
        
        net_debit = long_call - short_call
        max_profit = (short_strike - long_strike) - net_debit
        max_loss = net_debit
        breakeven = long_strike + net_debit
        
        return {
            "strategy": "Bull Call Spread",
            "symbol": symbol,
            "expiry": expiry,
            "long_call": round(long_call, 2),
            "short_call": round(short_call, 2),
            "net_debit": round(net_debit, 2),
            "max_profit": round(max_profit, 2),
            "max_loss": round(max_loss, 2),
            "breakeven": round(breakeven, 2),
            "profit_range": f"{long_strike} - {breakeven}",
            "recommendation": "Use when mildly bullish"
        }
    
    @staticmethod
    def iron_condor(symbol: str, underlying_price: float, expiry: str,
                   volatility: float) -> Dict:
        """Iron Condor - Sell OTM call spread and OTM put spread
        
        Max profit: Total credit received
        Max loss: (Upper short strike - Upper long strike)
        Ideal for: Low volatility, sideways market
        """
        T = (datetime.strptime(expiry, "%Y-%m-%d") - datetime.now()).days / 365.0
        
        # Generate strikes
        atm = underlying_price
        step = atm * 0.05
        
        call_short_strike = atm + (2 * step)  # 2 steps OTM
        call_long_strike = atm + (3 * step)   # 3 steps OTM
        put_short_strike = atm - (2 * step)   # 2 steps OTM
        put_long_strike = atm - (3 * step)    # 3 steps OTM
        
        # Call spread
        call_long = BlackScholes.calculate_call_price(underlying_price, call_long_strike, T, RISK_FREE_RATE, volatility)
        call_short = BlackScholes.calculate_call_price(underlying_price, call_short_strike, T, RISK_FREE_RATE, volatility)
        
        # Put spread
        put_long = BlackScholes.calculate_put_price(underlying_price, put_long_strike, T, RISK_FREE_RATE, volatility)
        put_short = BlackScholes.calculate_put_price(underlying_price, put_short_strike, T, RISK_FREE_RATE, volatility)
        
        total_credit = (call_short - call_long) + (put_short - put_long)
        max_profit = total_credit
        max_loss = (call_short_strike - call_long_strike) - total_credit
        
        return {
            "strategy": "Iron Condor",
            "symbol": symbol,
            "expiry": expiry,
            "call_short_strike": call_short_strike,
            "call_long_strike": call_long_strike,
            "put_short_strike": put_short_strike,
            "put_long_strike": put_long_strike,
            "total_credit": round(total_credit, 2),
            "max_profit": round(max_profit, 2),
            "max_loss": round(max_loss, 2),
            "profit_range": f"{put_short_strike} - {call_short_strike}",
            "recommendation": "Use in low volatility environment"
        }
    
    @staticmethod
    def straddle(symbol: str, underlying_price: float, expiry: str,
                strike: float, volatility: float) -> Dict:
        """Long Straddle - Buy call and put at same strike
        
        Max profit: Unlimited
        Max loss: Total premium paid
        Breakeven: Strike +/- Total premium
        Best for: High volatility expected
        """
        T = (datetime.strptime(expiry, "%Y-%m-%d") - datetime.now()).days / 365.0
        
        call_price = BlackScholes.calculate_call_price(underlying_price, strike, T, RISK_FREE_RATE, volatility)
        put_price = BlackScholes.calculate_put_price(underlying_price, strike, T, RISK_FREE_RATE, volatility)
        
        total_premium = call_price + put_price
        breakeven_up = strike + total_premium
        breakeven_down = strike - total_premium
        
        return {
            "strategy": "Long Straddle",
            "symbol": symbol,
            "expiry": expiry,
            "strike": strike,
            "call_price": round(call_price, 2),
            "put_price": round(put_price, 2),
            "total_premium": round(total_premium, 2),
            "max_loss": round(total_premium, 2),
            "breakeven_up": round(breakeven_up, 2),
            "breakeven_down": round(breakeven_down, 2),
            "recommendation": "Use when expecting high volatility"
        }
    
    @staticmethod
    def covered_call(symbol: str, stock_price: float, call_strike: float,
                    call_premium: float) -> Dict:
        """Covered Call - Own stock, sell call
        
        Max profit: Call strike - Stock price + Premium
        Max loss: Stock price - Premium
        Breakeven: Stock price - Premium
        """
        max_profit = (call_strike - stock_price) + call_premium
        max_loss = stock_price - call_premium
        breakeven = stock_price - call_premium
        
        return {
            "strategy": "Covered Call",
            "symbol": symbol,
            "stock_price": round(stock_price, 2),
            "call_strike": round(call_strike, 2),
            "call_premium": round(call_premium, 2),
            "max_profit": round(max_profit, 2),
            "max_loss": round(max_loss, 2),
            "breakeven": round(breakeven, 2),
            "recommendation": "Use to generate income from stock holdings"
        }


class OptionsAnalytics:
    """Options analytics and insights"""
    
    @staticmethod
    def find_support_resistance_from_options(option_chain: Dict) -> Tuple[float, float]:
        """Find support and resistance levels from open interest"""
        
        # Find highest OI call strike (resistance)
        max_call_oi = 0
        resistance = 0
        for call in option_chain["calls"]:
            if call.get("open_interest", 0) > max_call_oi:
                max_call_oi = call["open_interest"]
                resistance = call["strike"]
        
        # Find highest OI put strike (support)
        max_put_oi = 0
        support = 0
        for put in option_chain["puts"]:
            if put.get("open_interest", 0) > max_put_oi:
                max_put_oi = put["open_interest"]
                support = put["strike"]
        
        return support, resistance
    
    @staticmethod
    def calculate_implied_volatility_rank(symbol: str, timeframe: str = "30d") -> float:
        """Calculate IV rank for option selection"""
        # Would integrate with real data
        return 50.0
    
    @staticmethod
    def get_strategy_recommendation(underlying_price: float, market_sentiment: str,
                                   volatility: float) -> List[str]:
        """Recommend options strategies based on market conditions"""
        
        recommendations = []
        
        if market_sentiment == "bullish":
            if volatility > 25:
                recommendations.append("Bull Call Spread - Limited risk, defined profit")
                recommendations.append("Call Ratio Spread - High probability")
            else:
                recommendations.append("Long Call - Lower cost")
                recommendations.append("Covered Call - Income generation")
        
        elif market_sentiment == "bearish":
            if volatility > 25:
                recommendations.append("Bear Put Spread - Limited risk")
                recommendations.append("Put Ratio Spread - High probability")
            else:
                recommendations.append("Long Put - Lower cost")
                recommendations.append("Protective Put - Hedge positions")
        
        else:  # Neutral
            if volatility > 30:
                recommendations.append("Iron Condor - Sell volatility")
                recommendations.append("Strangle - Profitable on wide range")
            else:
                recommendations.append("Straddle - Low cost entry")
                recommendations.append("Calendar Spread - Sell time decay")
        
        return recommendations
