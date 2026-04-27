# 🌐 Web-First Trading System - Setup & Deployment Guide

## Overview

You now have a **complete web-first architecture**:
- ✅ **Flask Backend API** - REST endpoints for all trading features
- ✅ **React Frontend** - Modern web UI with TailwindCSS
- ✅ **Production-Ready** - Docker, CI/CD, and deployment configs

---

## Local Development Setup

### Prerequisites
```
Python 3.8+
Node.js 16+
npm or yarn
Git
```

### Step 1: Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.template ../.env.template

# Start Flask server
flask run
# Server runs on http://localhost:5000
```

### Step 2: Frontend Setup (New Terminal)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start React development server
npm start
# App runs on http://localhost:3000
```

### Step 3: Verify Everything Works

#### Backend Health Check
```bash
curl http://localhost:5000/api/health
# Should return: { "status": "healthy", "version": "1.0.0" }
```

#### Frontend
Visit http://localhost:3000 in your browser

Expected: Trading System dashboard with market overview

---

## API Endpoints

### Stock Endpoints
```
GET    /api/stocks                      # List all stocks
GET    /api/stocks/<symbol>             # Get stock details
GET    /api/stocks/search?q=<query>     # Search stocks
POST   /api/stocks/<symbol>/compare     # Compare exchanges
GET    /api/market/gainers              # Top gainers
GET    /api/market/losers               # Top losers
```

### Portfolio Endpoints
```
GET    /api/portfolio                   # Get portfolio
POST   /api/portfolio/add               # Add holding
PUT    /api/portfolio/<symbol>          # Update holding
DELETE /api/portfolio/<symbol>          # Remove holding
```

### Watchlist Endpoints
```
GET    /api/watchlist                   # Get watchlist
POST   /api/watchlist/add               # Add to watchlist
DELETE /api/watchlist/<symbol>          # Remove from watchlist
```

### Alerts Endpoints
```
GET    /api/alerts                      # Get all alerts
POST   /api/alerts                      # Create alert
DELETE /api/alerts/<id>                 # Delete alert
POST   /api/alerts/check                # Check all alerts
```

### Analytics Endpoints
```
GET    /api/analytics/<symbol>          # Get technical analysis
GET    /api/trading/recommendations     # Get recommendations
POST   /api/trading/analyze             # Analyze stock
GET    /api/options/strategies          # Get option strategies
POST   /api/options/calculate           # Calculate option price
POST   /api/backtest                    # Run backtest
```

---

## Frontend Architecture

### Pages
- **Dashboard** - Market overview with gainers/losers
- **Portfolio** - Manage stock holdings
- **Watchlist** - Track interested stocks
- **Alerts** - Manage price alerts
- **Trading** - Advanced trading tools
- **Stock Detail** - Detailed stock analysis

### Components
- Responsive navigation
- Stock cards
- Portfolio table
- Alert management form
- Real-time data refresh

---

## Deployment Guide

### Option 1: Deploy Backend to Railway.app (Recommended)

#### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Create new project

#### Step 2: Connect Git Repository
```bash
git add .
git commit -m "Web-first trading system"
git push origin main
```

#### Step 3: Deploy Backend
1. In Railway dashboard: "New → GitHub Repo"
2. Select your trading-system repo
3. Railway auto-detects Python/Flask
4. Set environment variables:
   - `FLASK_ENV` = `production`
   - `FLASK_DEBUG` = `False`
5. Click Deploy

#### Step 4: Get Backend URL
After deployment, you'll get:
```
https://trading-system-api.railway.app
```

### Option 2: Deploy Frontend to Netlify

#### Step 1: Prepare Frontend
```bash
cd frontend
npm run build
# Creates dist/ folder
```

#### Step 2: Deploy on Netlify
1. Go to https://netlify.com
2. Click "New site from Git"
3. Select GitHub repo
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Environment variables:
   - `REACT_APP_API_URL` = `https://trading-system-api.railway.app/api`
6. Deploy!

#### Step 3: Get Frontend URL
After deployment:
```
https://your-app-name.netlify.app
```

---

## Docker & Docker Compose (Local Development)

### Build Backend Image
```bash
docker build -t trading-system-backend backend/
```

### Run with Docker Compose
```bash
# Start both backend and frontend
docker-compose up

# Backend: http://localhost:5000
# Frontend: http://localhost:3000
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=development
      - FLASK_DEBUG=True
    volumes:
      - ./src:/app/src
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api
    depends_on:
      - backend
```

---

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v --cov=.
```

### Frontend Tests
```bash
cd frontend
npm test
```

---

## Environment Configuration

### Backend (.env)
```
FLASK_ENV=production
FLASK_DEBUG=False
FLASK_PORT=5000

# API
STOCK_API_URL=http://65.0.104.9/

# Alerts (Optional)
ALERT_EMAIL_SENDER=your-email@gmail.com
ALERT_EMAIL_PASSWORD=your-password
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token

# Firebase (Optional)
FIREBASE_API_KEY=your-key
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api  # Dev
REACT_APP_API_URL=https://api.example.com/api  # Prod
```

---

## File Structure

```
trading-system/
├── backend/
│   ├── app.py                       # Flask app
│   ├── requirements.txt             # Dependencies
│   ├── Dockerfile                   # Docker config
│   ├── railway.toml                 # Railway config
│   └── routes/
│       ├── stocks.py
│       ├── portfolio.py
│       ├── alerts.py
│       └── analytics.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   ├── components/
│   │   └── services/
│   ├── package.json
│   ├── netlify.toml
│   └── vite.config.js
│
├── src/
│   ├── indian_stock_api.py
│   ├── market_tracker.py
│   ├── trading_commands.py
│   ├── analytics_engine.py
│   ├── alerts_system.py
│   ├── options_trading.py
│   ├── backtest_engine.py
│   └── firebase_sync.py
│
└── docker-compose.yml
```

---

## Troubleshooting

### Backend Issues

**"ModuleNotFoundError: No module named 'flask'"**
```bash
pip install -r backend/requirements.txt
```

**"Cannot connect to stock API"**
- Check internet connection
- Verify API URL in .env
- API might be rate limited

### Frontend Issues

**"Cannot GET /"**
- Make sure backend is running
- Check REACT_APP_API_URL in .env

**"npm start fails"**
```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

### Deployment Issues

**Railway deployment fails**
- Check buildlog in Railway dashboard
- Ensure Dockerfile is in backend/
- Verify Python version compatibility

**Netlify deployment fails**
- Check build logs
- Ensure `npm run build` works locally
- Verify environment variables

---

## Performance Optimization

### Backend
- Use caching for API calls
- Implement rate limiting
- Add database indexing
- Monitor response times

### Frontend
- Code splitting with React.lazy()
- Image optimization
- CSS/JS minification
- Service workers for offline

---

## Security Checklist

- [ ] No API keys in code
- [ ] Use .env for sensitive data
- [ ] CORS properly configured
- [ ] HTTPS enabled on production
- [ ] Input validation on both sides
- [ ] SQL injection prevention
- [ ] Rate limiting enabled
- [ ] Authentication implemented

---

## Monitoring & Logging

### Backend
```python
import logging
logging.basicConfig(level=logging.INFO)
```

### Production Monitoring
- Railway dashboard for backend
- Netlify analytics for frontend
- Error tracking with Sentry
- Performance monitoring

---

## Next Steps

1. ✅ Setup local development
2. ✅ Test all endpoints
3. ✅ Deploy backend to Railway
4. ✅ Deploy frontend to Netlify
5. ✅ Connect frontend to backend
6. ✅ Test production build
7. ✅ Monitor and optimize

---

## Support & Documentation

- **API Docs**: Visit `/api/health` on backend
- **Frontend Docs**: Check `frontend/src/` structure
- **Backend Code**: See `backend/app.py` for endpoints
- **Integration**: See `INTEGRATION_GUIDE.md`

---

**Your web-first trading system is ready!** 🚀

Any issues? Check the troubleshooting section or review the code comments.
