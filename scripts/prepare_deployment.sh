#!/bin/bash

# Clean Deployment Package Script
# This script prepares the project for GitHub/Netlify deployment

echo "🧹 Creating clean deployment structure..."

# Create directories
mkdir -p src/
mkdir -p tests/
mkdir -p docs/

# Copy core modules to src/
echo "📦 Organizing core modules..."
cp analytics_engine.py src/
cp alerts_system.py src/
cp backtest_engine.py src/
cp deployment_manager.py src/
cp firebase_sync.py src/
cp options_trading.py src/
cp indian_stock_api.py src/
cp market_tracker.py src/
cp trading_commands.py src/
cp trading_advisor.py src/

# Copy tests
echo "🧪 Copying tests..."
cp test_trading_commands.py tests/

# Copy documentation
echo "📚 Copying documentation..."
cp INTEGRATION_GUIDE.md docs/
cp TRADING_SYSTEM_COMPLETE.md docs/
cp README_DEPLOYMENT.md docs/README.md

# Create __init__.py for package
echo "# Trading System Package" > src/__init__.py

# Verify structure
echo ""
echo "✅ Deployment structure ready!"
echo ""
echo "📁 Final structure:"
tree -L 2 --charset ascii 2>/dev/null || find . -maxdepth 2 -type f -name "*.py" -o -name "*.md" -o -name "*.toml" -o -name "*.txt" | grep -E "(src/|tests/|docs/|setup|requirements|netlify|gitignore)" | sort

echo ""
echo "🚀 Ready to push to GitHub!"
