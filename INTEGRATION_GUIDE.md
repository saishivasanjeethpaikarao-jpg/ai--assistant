# Integration Guide - Connect All 7 Phases

## Quick Integration Into assistant_core.py

### Step 1: Add Imports at Top of assistant_core.py

```python
# === PHASE 1: Testing ===
from test_trading_commands import run_full_test_suite

# === PHASE 2: Analytics ===
from analytics_engine import Analytics, TechnicalAnalyzer

# === PHASE 3: Alerts ===
from alerts_system import get_alert_manager, AlertChannel, AlertPriority

# === PHASE 4: Options ===
from options_trading import (
    OptionChain, OptionsStrategies, OptionChainAnalyzer,
    BlackScholes, OptionType
)

# === PHASE 5: Backtesting ===
from backtest_engine import (
    BacktestEngine, HistoricalDataSimulator, BacktestComparison
)

# === PHASE 6: Cloud Sync ===
from firebase_sync import get_firebase_auth, get_cloud_sync

# === PHASE 7: Deployment ===
from deployment_manager import get_release_manager, VersionManager
```

### Step 2: Initialize Managers in __init__

```python
def __init__(self):
    # ... existing code ...
    
    # Initialize enhanced trading modules
    self.analytics = Analytics()
    self.alert_manager = get_alert_manager()
    self.option_chain = OptionChain()
    self.backtest_engine = BacktestEngine(100000)
    self.firebase_auth = get_firebase_auth()
    self.cloud_sync = get_cloud_sync()
    self.release_manager = get_release_manager()
```

### Step 3: Add Command Handlers

#### Analytics Commands
```python
def handle_analytics_command(self, command: str, symbol: str):
    """Handle analytics requests"""
    if "technical" in command or "indicator" in command:
        metrics = self.analytics.get_stock_metrics(symbol)
        if metrics:
            return f"""
Technical Analysis for {symbol}:
📊 Indicators:
  RSI: {metrics.technical_indicators.rsi:.2f} {'(Overbought)' if metrics.technical_indicators.rsi > 70 else '(Oversold)' if metrics.technical_indicators.rsi < 30 else '(Neutral)'}
  MACD: {metrics.technical_indicators.macd:.4f}
  BB Upper: ₹{metrics.technical_indicators.bb_upper:.2f}
  BB Middle: ₹{metrics.technical_indicators.bb_middle:.2f}
  BB Lower: ₹{metrics.technical_indicators.bb_lower:.2f}

📈 Metrics:
  Trend: {metrics.trend}
  Strength: {metrics.strength_score:.2f}%
  Support: ₹{metrics.support_level:.2f}
  Resistance: ₹{metrics.resistance_level:.2f}
  Volatility: {metrics.volatility:.4f}
  Risk Level: {metrics.risk_level}
"""
    
    elif "report" in command:
        report = self.analytics.generate_analytics_report(symbol)
        return json.dumps(report, indent=2)
```

#### Alerts Commands
```python
def handle_alerts_command(self, command: str, *args):
    """Handle alert management"""
    if "create" in command and "alert" in command:
        symbol = args[0] if args else ""
        if "above" in command:
            alert_id = self.alert_manager.create_price_alert(
                symbol, "above", float(args[1]), 
                channels=[AlertChannel.EMAIL, AlertChannel.PUSH],
                priority=AlertPriority.HIGH
            )
            return f"✅ Alert created: {alert_id}\nMonitoring {symbol} above ₹{args[1]}"
        elif "below" in command:
            alert_id = self.alert_manager.create_price_alert(
                symbol, "below", float(args[1]),
                channels=[AlertChannel.EMAIL, AlertChannel.PUSH],
                priority=AlertPriority.HIGH
            )
            return f"✅ Alert created: {alert_id}\nMonitoring {symbol} below ₹{args[1]}"
    
    elif "check" in command:
        triggered = self.alert_manager.check_alerts()
        if triggered:
            return f"🔔 {len(triggered)} alert(s) triggered!\n" + "\n".join([
                f"  • {msg}" for alerts in triggered.values() for msg in alerts
            ])
        return "✅ All alerts clear, no triggers."
    
    elif "list" in command:
        alerts = self.alert_manager.list_alerts()
        if not alerts:
            return "No alerts configured"
        
        result = "📋 Active Alerts:\n"
        for alert in alerts:
            result += f"  • {alert.symbol}: {alert.condition} (Priority: {alert.priority.value})\n"
        return result
    
    elif "status" in command:
        status = self.alert_manager.get_alert_status()
        return f"""
Alert Status:
  Total: {status['total_alerts']}
  Enabled: {status['enabled']}
  Disabled: {status['disabled']}
  Triggered: {status['triggered']}
"""
```

#### Options Commands
```python
def handle_options_command(self, command: str, *args):
    """Handle options trading"""
    if "chain" in command:
        symbol = args[0] if args else "NIFTY"
        underlying_price = float(args[1]) if len(args) > 1 else 18000
        volatility = float(args[2]) if len(args) > 2 else 0.15
        
        chain = self.option_chain.analyze_option_chain(
            symbol, "2024-01-25", underlying_price, volatility
        )
        
        result = f"Option Chain for {symbol} @ ₹{underlying_price}:\n\n"
        result += "CALLS:\n"
        for call in chain["calls"][:5]:
            result += f"  {call['strike']}: ₹{call['price']} (Δ:{call['greeks']['delta']:.3f})\n"
        
        result += "\nPUTS:\n"
        for put in chain["puts"][:5]:
            result += f"  {put['strike']}: ₹{put['price']} (Δ:{put['greeks']['delta']:.3f})\n"
        
        return result
    
    elif "strategy" in command:
        if "bull" in command and "call" in command:
            strategy = OptionsStrategies.bull_call_spread(
                args[0], float(args[1]), "2024-01-25",
                float(args[2]), float(args[3]), 0.15
            )
            return json.dumps(strategy, indent=2)
        
        elif "iron" in command and "condor" in command:
            strategy = OptionsStrategies.iron_condor(
                args[0], float(args[1]), "2024-01-25", 0.15
            )
            return json.dumps(strategy, indent=2)
        
        elif "straddle" in command:
            strategy = OptionsStrategies.straddle(
                args[0], float(args[1]), "2024-01-25",
                float(args[2]), 0.15
            )
            return json.dumps(strategy, indent=2)
```

#### Backtesting Commands
```python
def handle_backtest_command(self, command: str, *args):
    """Handle backtesting"""
    if "backtest" in command:
        symbol = args[0] if args else "RELIANCE"
        
        # Generate sample data
        simulator = HistoricalDataSimulator()
        ohlcv_data = simulator.generate_sample_data(
            symbol, "2023-01-01", "2024-01-01", 
            initial_price=2500, trend="uptrend"
        )
        
        if "sma" in command:
            engine = BacktestEngine(100000)
            result = engine.backtest_simple_moving_average(symbol, ohlcv_data)
        
        elif "bollinger" in command:
            engine = BacktestEngine(100000)
            result = engine.backtest_bollinger_bands(symbol, ohlcv_data)
        
        elif "momentum" in command:
            engine = BacktestEngine(100000)
            result = engine.backtest_momentum(symbol, ohlcv_data)
        
        else:
            engine = BacktestEngine(100000)
            result = engine.backtest_simple_moving_average(symbol, ohlcv_data)
        
        return f"""
Backtest Results for {result.strategy_name}:
  Symbol: {symbol}
  Period: {result.start_date} to {result.end_date}
  
Capital:
  Initial: ₹{result.initial_capital:,.0f}
  Final: ₹{result.final_value:,.0f}
  Return: {result.total_return_pct:+.2f}%

Trades:
  Total: {result.total_trades}
  Winning: {result.winning_trades}
  Losing: {result.losing_trades}
  Win Rate: {result.win_rate:.2f}%

Metrics:
  Profit Factor: {result.profit_factor:.2f}
  Avg Win: ₹{result.avg_win:,.0f}
  Avg Loss: ₹{result.avg_loss:,.0f}
  Expectancy: ₹{result.expectancy:,.0f}
  
Risk:
  Max Drawdown: {result.max_drawdown:.2f}%
  Sharpe Ratio: {result.sharpe_ratio:.2f}
  Sortino Ratio: {result.sortino_ratio:.2f}
  Calmar Ratio: {result.calmar_ratio:.2f}
"""
```

#### Cloud Sync Commands
```python
def handle_cloud_command(self, command: str, *args):
    """Handle cloud operations"""
    if "login" in command or "signin" in command:
        email = args[0] if args else input("Email: ")
        password = args[1] if len(args) > 1 else input("Password: ")
        
        success, message = self.firebase_auth.sign_in(email, password)
        if success:
            return f"✅ Logged in as {email}"
        else:
            return f"❌ Login failed: {message}"
    
    elif "signup" in command or "register" in command:
        email = args[0] if args else input("Email: ")
        password = args[1] if len(args) > 1 else input("Password: ")
        username = args[2] if len(args) > 2 else email.split("@")[0]
        
        success, message = self.firebase_auth.sign_up(email, password, username)
        if success:
            return f"✅ Account created: {email}"
        else:
            return f"❌ Registration failed: {message}"
    
    elif "sync" in command:
        if self.firebase_auth.is_authenticated():
            watchlist_data = get_watchlist().get_summary()
            portfolio_data = get_portfolio().get_summary()
            
            w_success, w_msg = self.cloud_sync.sync_watchlist_to_cloud(watchlist_data)
            p_success, p_msg = self.cloud_sync.sync_portfolio_to_cloud(portfolio_data)
            
            return f"""
Cloud Sync:
  Watchlist: {'✅' if w_success else '❌'}
  Portfolio: {'✅' if p_success else '❌'}
  Status: {self.cloud_sync.get_sync_status()}
"""
        else:
            return "❌ Not logged in"
    
    elif "status" in command:
        if self.firebase_auth.is_authenticated():
            status = self.cloud_sync.get_sync_status()
            return f"☁️ Cloud Status: {json.dumps(status, indent=2)}"
        else:
            return "❌ Not logged in"
```

#### Deployment Commands
```python
def handle_deployment_command(self, command: str, *args):
    """Handle deployment operations"""
    if "version" in command:
        current = self.release_manager.version_manager.current_version
        return f"Current Version: {current.full_version()}"
    
    elif "build" in command:
        version_type = args[0] if args else "patch"
        success, exe_path = self.release_manager.create_release(version_type)
        
        if success:
            return f"✅ Build successful!\nExecutable: {exe_path}"
        else:
            return f"❌ Build failed: {exe_path}"
    
    elif "release" in command:
        success, exe_path = self.release_manager.create_release()
        if success:
            # Get latest release
            latest = self.release_manager.get_latest_release()
            success, pub_path = self.release_manager.publish_release(latest)
            
            if success:
                return f"✅ Release published!\nPath: {pub_path}"
            else:
                return f"❌ Publish failed: {pub_path}"
    
    elif "update" in command:
        updater = AutoUpdater()
        has_update, new_version = updater.check_for_updates()
        
        if has_update:
            return f"📦 Update available: {new_version.full_version()}"
        else:
            return "✅ Already on latest version"
```

### Step 4: Route Commands in Main Handler

```python
def process_text_command(self, text: str) -> str:
    """Route text commands to appropriate handlers"""
    text_lower = text.lower()
    
    # === PHASE 2: Analytics ===
    if any(x in text_lower for x in ["technical", "indicator", "rsi", "macd", "bollinger", "ema"]):
        symbol = self.extract_symbol(text)
        return self.handle_analytics_command(text_lower, symbol)
    
    # === PHASE 3: Alerts ===
    if "alert" in text_lower or "notify" in text_lower:
        args = self.extract_args(text)
        return self.handle_alerts_command(text_lower, *args)
    
    # === PHASE 4: Options ===
    if "option" in text_lower or "strike" in text_lower or "call" in text_lower or "put" in text_lower:
        args = self.extract_args(text)
        return self.handle_options_command(text_lower, *args)
    
    # === PHASE 5: Backtesting ===
    if "backtest" in text_lower or "test strategy" in text_lower:
        args = self.extract_args(text)
        return self.handle_backtest_command(text_lower, *args)
    
    # === PHASE 6: Cloud Sync ===
    if any(x in text_lower for x in ["login", "signin", "signup", "cloud", "sync"]):
        args = self.extract_args(text)
        return self.handle_cloud_command(text_lower, *args)
    
    # === PHASE 7: Deployment ===
    if any(x in text_lower for x in ["version", "build", "release", "update", "deploy"]):
        args = self.extract_args(text)
        return self.handle_deployment_command(text_lower, *args)
    
    # ... rest of existing command handlers ...
```

### Step 5: Helper Functions

```python
def extract_symbol(self, text: str) -> str:
    """Extract stock symbol from text"""
    symbols = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", 
               "MARUTI", "SUNPHARMA", "ITC", "WIPRO"]
    
    for symbol in symbols:
        if symbol.lower() in text.lower():
            return symbol
    return "RELIANCE"

def extract_args(self, text: str) -> list:
    """Extract numeric and string arguments"""
    import re
    
    # Find numbers (prices, quantities, etc.)
    numbers = re.findall(r'\d+\.?\d*', text)
    
    # Find words after keywords
    args = []
    words = text.split()
    
    for i, word in enumerate(words):
        if word in numbers:
            args.append(word)
        elif i > 0 and words[i-1] in ["to", "at", "above", "below"]:
            args.append(word)
    
    return args
```

## Example Voice Commands After Integration

```
"Show me technical analysis for Reliance"
→ Displays RSI, MACD, Bollinger Bands, support/resistance

"Create an alert for TCS above 3500"
→ Sets up alert with email and push notifications

"Give me an options chain for NIFTY"
→ Shows call/put prices with Greeks

"Backtest momentum strategy on Reliance"
→ Runs historical backtest with performance metrics

"Sync my portfolio to cloud"
→ Uploads watchlist and portfolio to Firebase

"Build and release version"
→ Creates new executable and publishes release
```

---

## Testing the Integration

```python
# Run test suite
from test_trading_commands import run_full_test_suite

result = run_full_test_suite()
print(f"Tests Passed: {result['passed']}/{result['total']}")

# Verify all modules import
from analytics_engine import Analytics
from alerts_system import get_alert_manager
from options_trading import OptionChain
from backtest_engine import BacktestEngine
from firebase_sync import get_firebase_auth
from deployment_manager import get_release_manager

print("✅ All modules successfully imported!")
```

---

## Configuration Needed

### Email Notifications (Phase 3)
```bash
export ALERT_EMAIL_SENDER="your-email@gmail.com"
export ALERT_EMAIL_PASSWORD="your-app-password"
export ALERT_EMAIL_RECIPIENT="recipient@gmail.com"
```

### SMS Notifications (Phase 3)
```bash
export TWILIO_ACCOUNT_SID="your-sid"
export TWILIO_AUTH_TOKEN="your-token"
export TWILIO_PHONE_FROM="+1234567890"
export TWILIO_PHONE_TO="+0987654321"
```

### Firebase Configuration (Phase 6)
Create `firebase_secrets.py`:
```python
FIREBASE_API_KEY = "your-api-key"
FIREBASE_AUTH_DOMAIN = "project.firebaseapp.com"
FIREBASE_PROJECT_ID = "project-id"
FIREBASE_STORAGE_BUCKET = "project.appspot.com"
FIREBASE_MESSAGING_SENDER_ID = "sender-id"
FIREBASE_APP_ID = "app-id"
```

---

**Integration Complete!** All 7 phases are now ready to use. 🚀
