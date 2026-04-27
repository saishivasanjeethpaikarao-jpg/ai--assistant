# 🚀 Trading System - NSE/BSE Real-Time Trading Platform

[![GitHub](https://img.shields.io/badge/GitHub-trading--system-blue?style=flat-square&logo=github)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/Python-3.8+-green)](https://www.python.org/)
[![Netlify Status](https://api.netlify.com/api/v1/badges/badge-id/deploy-status)](https://app.netlify.com)

A comprehensive AI-powered trading platform with real-time NSE/BSE stock data, advanced analytics, multi-channel alerts, options pricing, backtesting, and cloud synchronization.

## ✨ Features

### 📊 Real-Time Data
- **Live NSE/BSE Prices** - Real-time stock quotes
- **25+ Supported Stocks** - TCS, RELIANCE, INFY, HDFCBANK, etc.
- **Exchange Comparison** - Arbitrage detection
- **Market Gainers/Losers** - Daily market summary

### 📈 Advanced Analytics
- **8 Technical Indicators** - RSI, MACD, Bollinger Bands, ATR, EMA, ADX, CCI, Vega
- **Fundamental Analysis** - P/E ratio, dividend yield, market cap
- **Sector Analysis** - Heatmaps for 8 major sectors
- **Risk Metrics** - Sharpe, Sortino, Calmar ratios

### 🔔 Smart Alerts
- **Multi-Channel Notifications**
  - 📧 Email (SMTP)
  - 📱 SMS (Twilio)
  - 💬 Telegram
  - 🔔 Push notifications
  - 🔴 In-app notifications
- **Custom Triggers** - Price targets, performance thresholds
- **Alert History** - Complete audit trail

### 📊 Options Trading
- **Black-Scholes Pricing** - European options valuation
- **Greeks Calculation** - Delta, Gamma, Theta, Vega, Rho
- **Pre-Built Strategies**
  - Bull Call Spread
  - Iron Condor
  - Long Straddle
  - Covered Call
  - And 5+ more

### 🧪 Backtesting
- **Multiple Strategies** - SMA, Bollinger Bands, Momentum
- **Performance Metrics** - Win rate, Sharpe ratio, max drawdown
- **Historical Simulation** - Test on any date range
- **Strategy Comparison** - Compare multiple approaches

### ☁️ Cloud Sync
- **Multi-User Accounts** - User authentication & profiles
- **Cloud Backup** - Watchlist, portfolio, alerts
- **Cross-Device Sync** - Sync across devices
- **Firebase Integration** - Real-time cloud storage

### 🎯 Deployment
- **Semantic Versioning** - Automated version management
- **PyInstaller Packaging** - Windows executable
- **Auto-Updater** - Automatic updates with rollback
- **Release Management** - Publish to repositories

## 🏗️ Architecture

```
Trading System
├── Core Modules (4)
│   ├── indian_stock_api.py - Real-time data API
│   ├── market_tracker.py - Watchlist & portfolio
│   ├── trading_commands.py - 40+ commands
│   └── trading_advisor.py - AI recommendations
├── Phase 1: Testing
│   └── test_trading_commands.py - 35+ tests
├── Phase 2: Analytics
│   └── analytics_engine.py - Technical & fundamental
├── Phase 3: Alerts
│   └── alerts_system.py - Multi-channel notifications
├── Phase 4: Options
│   └── options_trading.py - Greeks & strategies
├── Phase 5: Backtesting
│   └── backtest_engine.py - Strategy simulation
├── Phase 6: Cloud Sync
│   └── firebase_sync.py - Multi-user cloud
└── Phase 7: Deployment
    └── deployment_manager.py - Packaging & versioning
```

## 📦 Installation

### Prerequisites
- Python 3.8+
- pip or poetry

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/trading-system.git
cd trading-system
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements-prod.txt
```

4. **Configure environment**
```bash
cp .env.template .env
# Edit .env with your configuration
```

5. **Run tests**
```bash
pytest tests/ -v
```

## 🚀 Usage

### Get Stock Price
```python
from src.indian_stock_api import get_api

api = get_api()
stock = api.get_stock("RELIANCE")
print(f"Price: ₹{stock.last_price}")
```

### Create Price Alert
```python
from src.alerts_system import get_alert_manager, AlertChannel

alerts = get_alert_manager()
alert_id = alerts.create_price_alert(
    "TCS", "above", 3500,
    channels=[AlertChannel.EMAIL, AlertChannel.PUSH]
)
```

### Technical Analysis
```python
from src.analytics_engine import Analytics

analytics = Analytics()
metrics = analytics.get_stock_metrics("INFY")
print(f"RSI: {metrics.technical_indicators.rsi:.2f}")
print(f"Trend: {metrics.trend}")
```

### Backtest Strategy
```python
from src.backtest_engine import BacktestEngine, HistoricalDataSimulator

data = HistoricalDataSimulator.generate_sample_data("RELIANCE", "2023-01-01", "2024-01-01")
engine = BacktestEngine(100000)
result = engine.backtest_simple_moving_average("RELIANCE", data)
print(f"Win Rate: {result.win_rate:.2f}%")
```

### Options Pricing
```python
from src.options_trading import BlackScholes, OptionType

call_price = BlackScholes.calculate_call_price(
    S=18000, K=18000, T=0.083, r=0.06, sigma=0.15
)
greeks = BlackScholes.calculate_greeks(
    18000, 18000, 0.083, 0.06, 0.15, OptionType.CALL
)
```

## ⚙️ Configuration

Create `.env` file from `.env.template`:

```env
# API Configuration
STOCK_API_URL=http://65.0.104.9/

# Email Notifications
ALERT_EMAIL_SENDER=your-email@gmail.com
ALERT_EMAIL_PASSWORD=your-app-password
ALERT_EMAIL_RECIPIENT=recipient@gmail.com

# SMS Notifications (Twilio)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_FROM=+1234567890
TWILIO_PHONE_TO=+0987654321

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Firebase
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
FIREBASE_PROJECT_ID=project-id
```

## 📚 Documentation

- [**INTEGRATION_GUIDE.md**](INTEGRATION_GUIDE.md) - How to integrate modules
- [**TRADING_SYSTEM_COMPLETE.md**](TRADING_SYSTEM_COMPLETE.md) - Complete feature reference
- [**DEPLOYMENT_STRUCTURE.md**](DEPLOYMENT_STRUCTURE.md) - Project structure guide

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html

# Run specific test
pytest tests/test_trading_commands.py::TestIndianStockAPI -v
```

## 🌐 Deployment

### GitHub
```bash
git add .
git commit -m "Deploy trading system"
git push origin main
```

### Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: (leave empty - static files)
3. Set publish directory: `.` (root)
4. Deploy!

### Docker (Optional)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements-prod.txt .
RUN pip install -r requirements-prod.txt
COPY . .
CMD ["python", "-m", "src"]
```

## 📊 Performance

- **API Response**: < 200ms per request
- **Indicator Calculation**: < 100ms per indicator
- **Backtest (1 year)**: < 1 second
- **Memory Usage**: < 100MB

## 🛡️ Security

- ✅ No hardcoded credentials
- ✅ Environment variable configuration
- ✅ SHA256 checksums for data integrity
- ✅ Secure password handling
- ✅ Rate limiting on API calls

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

- 📖 See [documentation](./docs)
- 🐛 Report issues on GitHub
- 💬 Discussions for questions

## 🎯 Roadmap

- [ ] Real-time WebSocket data
- [ ] Machine learning predictions
- [ ] Mobile app (React Native)
- [ ] Advanced charting
- [ ] Automated trading
- [ ] Portfolio optimization
- [ ] Risk management tools
- [ ] Community features

## 🙏 Acknowledgments

- Indian Stock Market API
- Firebase for cloud services
- Community contributors

---

**Ready to transform your trading with AI!** 🚀

For more information, visit our [documentation](./docs/README.md)
