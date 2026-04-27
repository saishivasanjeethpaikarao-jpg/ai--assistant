# Trading System - Clean Deployment Files

## 📦 Essential Files for GitHub/Netlify Deployment

### Core Trading Modules (7 Phases)
- `analytics_engine.py` - Phase 2: Analytics
- `alerts_system.py` - Phase 3: Alerts  
- `backtest_engine.py` - Phase 5: Backtesting
- `deployment_manager.py` - Phase 7: Deployment
- `firebase_sync.py` - Phase 6: Cloud Sync
- `options_trading.py` - Phase 4: Options Trading
- `test_trading_commands.py` - Phase 1: Tests

### Core Foundation Modules
- `indian_stock_api.py` - Real-time NSE/BSE data
- `market_tracker.py` - Watchlist & Portfolio
- `trading_commands.py` - 40+ Trading Commands
- `trading_advisor.py` - AI Recommendations

### Configuration & Setup
- `requirements.txt` - Python dependencies
- `.env.template` - Environment variables template
- `.gitignore` - Git ignore rules
- `setup.py` - Package setup (if needed)

### Documentation
- `README.md` - Main documentation
- `INTEGRATION_GUIDE.md` - Integration guide
- `TRADING_SYSTEM_COMPLETE.md` - Complete reference

### Build Files (Optional)
- `netlify.toml` - Netlify configuration
- `requirements.txt` - All dependencies

---

## 🗑️ Files to Remove (Clean)

**Build Artifacts & Cache:**
- build/
- dist/
- __pycache__/
- *.log files
- *.pyc files

**Development & System Files:**
- .venv/ (keep dependencies in requirements.txt)
- .cursor/
- .vscode/
- .env (keep only .env.template)

**Old/Deprecated Code:**
- archive_deprecated/
- app/ (old)
- brain/ (old)
- core/ (old)
- actions/ (old)
- handlers/ (old)
- ai_integration/ (old)
- cloud/ (old)
- integrations/ (old)
- knowledge_base/ (old)
- logs/ (runtime)
- memory/ (runtime)
- notes_app/ (old)
- optimization/ (old)
- packaging/ (old)
- simple_website/ (old)
- todo_app/ (old)
- ui/ (old)
- voice/ (old)
- installer/ (old)

**Sensitive Files:**
- firebase_secrets.py (keep only .example)
- config_prefs.py (personalization)

**Old Applications:**
- app.py, assistant.py, app.spec
- analytics_dashboard.py
- advanced_trading.py, trading_advisor.py (keep trading_advisor.py)
- various *.bat, *.ps1, *.iss scripts
- *.exe, *.zip files

**Old Documentation:**
- PHASE_PLAN.md, NEW_FEATURES_v9.md
- CLEANUP_REPORT.md, CODE_ANALYSIS_REPORT.md
- FEATURES.md, ARCHITECTURE.md
- NSE_BSE_INTEGRATION.md
- IMPLEMENTATION_COMPLETE.md (keep TRADING_SYSTEM_COMPLETE.md)

**Miscellaneous:**
- TRADING_COMMANDS.md (old - use README instead)
- test.py, test_assistant.py, test_imports.py
- provider-rotation.js
- Various config files (keep minimal)

---

## ✅ Final Clean Structure

```
trading-system/
├── src/
│   ├── __init__.py
│   ├── analytics_engine.py
│   ├── alerts_system.py
│   ├── backtest_engine.py
│   ├── deployment_manager.py
│   ├── firebase_sync.py
│   ├── options_trading.py
│   ├── indian_stock_api.py
│   ├── market_tracker.py
│   ├── trading_commands.py
│   └── trading_advisor.py
├── tests/
│   └── test_trading_commands.py
├── docs/
│   ├── README.md
│   ├── INTEGRATION_GUIDE.md
│   └── TRADING_SYSTEM_COMPLETE.md
├── .env.template
├── .gitignore
├── requirements.txt
├── netlify.toml
└── setup.py
```

---

**Ready to push to GitHub and deploy on Netlify!**
