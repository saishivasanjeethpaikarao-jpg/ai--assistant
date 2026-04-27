# 🚀 Production Deployment Guide: Web-First AI Assistant

Complete step-by-step guide to deploy the web platform to production (Railway + Netlify).

---

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Backend Deployment (Railway)](#backend-deployment-railway)
3. [Frontend Deployment (Netlify)](#frontend-deployment-netlify)
4. [Environment Configuration](#environment-configuration)
5. [Domain Setup](#domain-setup)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Backend Ready ✅
- [ ] `backend/app_enhanced.py` exists and has all 20+ endpoints
- [ ] `backend/requirements.txt` has all dependencies
- [ ] `backend/Dockerfile` is configured
- [ ] `backend/railway.toml` exists
- [ ] `.env.template` exists with all variables
- [ ] Tests pass: `pytest` ✅
- [ ] No hardcoded credentials (all use env vars)
- [ ] CORS configured for frontend domain
- [ ] Database (Firebase) authenticated

### Frontend Ready ✅
- [ ] `frontend/package.json` has all dependencies
- [ ] `frontend/src/App.jsx` with routing
- [ ] `frontend/src/services/api.js` configured
- [ ] All page components exist
- [ ] `frontend/Dockerfile` configured
- [ ] `frontend/netlify.toml` exists
- [ ] `.env.example` exists
- [ ] Build succeeds: `npm run build` ✅
- [ ] No hardcoded backend URLs (use env vars)

### Git Ready ✅
- [ ] All code committed
- [ ] No secrets in git history
- [ ] Main branch is production-ready
- [ ] GitHub repository public
- [ ] GitHub token available

---

## Backend Deployment (Railway)

### Step 1: Create Railway Account

```bash
# Visit https://railway.app
# Sign up with GitHub (recommended)
# Authorize Railway to access your GitHub repositories
```

### Step 2: Create New Project

```
1. Click "New Project"
2. Select "GitHub Repo"
3. Authorize GitHub connection
4. Select your repository
5. Click "Deploy"
```

### Step 3: Configure Environment Variables

Railway Dashboard → Project Settings → Variables

```env
# Flask Configuration
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-secret-key-here-change-this
FLASK_APP=app_enhanced.py

# Firebase Configuration
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# AI Provider Keys (at least one required)
GEMINI_API_KEY=your-gemini-key-or-leave-empty
OPENAI_API_KEY=your-openai-key-or-leave-empty
GROQ_API_KEY=your-groq-key-or-leave-empty

# Stock Market API
STOCK_API_URL=http://65.0.104.9/

# Frontend Configuration
FRONTEND_URL=https://your-app.netlify.app

# CORS Settings
CORS_ORIGINS=https://your-app.netlify.app,https://your-domain.com

# TTS Services
ELEVENLABS_API_KEY=your-elevenlabs-key-or-leave-empty
FISH_AUDIO_API_KEY=your-fish-audio-key-or-leave-empty

# Notifications
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

TELEGRAM_BOT_TOKEN=your-telegram-token
```

**To get SECRET_KEY:**
```python
python -c "import secrets; print(secrets.token_hex(32))"
```

### Step 4: Configure Build Settings

Railway → Project → Settings

```
Build Command: (auto-detected from Dockerfile)
Start Command: gunicorn --bind 0.0.0.0:$PORT app_enhanced:app
Buildpack: (leave as Dockerfile)
```

### Step 5: Monitor Deployment

```
Railway Dashboard → Deployments

Status indicators:
🟢 Building → Deploying → ✅ Active
🔴 Failed → Check logs → Fix → Redeploy
```

### Step 6: Get Production URL

```
Railway Dashboard → Project → Domains

Public URL: https://trading-api-abc123.railway.app

This is your PRODUCTION_BACKEND_URL
```

### Step 7: Test Backend

```bash
# Test health endpoint
curl https://trading-api-abc123.railway.app/api/health

Expected Response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}

# Test stock search
curl "https://trading-api-abc123.railway.app/api/stocks/search?q=TCS"

Expected Response:
{
  "status": "success",
  "data": [
    {
      "symbol": "TCS",
      "name": "Tata Consultancy Services",
      "exchange": "NSE",
      ...
    }
  ]
}
```

---

## Frontend Deployment (Netlify)

### Step 1: Create Netlify Account

```bash
# Visit https://netlify.com
# Sign up with GitHub
# Authorize Netlify to access repositories
```

### Step 2: Create New Site

```
1. Click "New Site from Git"
2. Select GitHub
3. Select your repository
4. Click "Deploy site"
```

### Step 3: Configure Build Settings

Netlify → Site Settings → Build & Deploy

```
Build Command: npm run build
Publish Directory: dist
Node Version: 18.x
```

### Step 4: Set Environment Variables

Netlify → Site Settings → Environment

```env
REACT_APP_API_URL=https://trading-api-abc123.railway.app/api
REACT_APP_ENV=production
REACT_APP_VERSION=1.0.0

# Optional: Analytics
REACT_APP_GTAG_ID=G-XXXXXXXXXX
```

### Step 5: Configure Redirects for SPA

Create `frontend/netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
```

### Step 6: Monitor Deployment

```
Netlify → Deploys

Each commit to main branch triggers:
1. Build (npm run build)
2. Deploy (to CDN)
3. Publish (go live)

Status: ✅ Published
```

### Step 7: Get Production URL

```
Netlify Dashboard → Domain Settings

Site URL: https://trading-app-abc123.netlify.app

This is your PRODUCTION_FRONTEND_URL
```

### Step 8: Test Frontend

```bash
# Visit in browser
https://trading-app-abc123.netlify.app

Expected:
✅ Dashboard loads
✅ Can see top gainers/losers
✅ Search works
✅ Portfolio page loads
✅ No console errors
```

---

## Environment Configuration

### Create `.env` Files (Locally)

```bash
# .env - Local development
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

```bash
# .env.production - Production
REACT_APP_API_URL=https://trading-api-abc123.railway.app/api
REACT_APP_ENV=production
```

### Backend Environment

```bash
# backend/.env - Local
FLASK_ENV=development
FLASK_DEBUG=True
DATABASE_URL=sqlite:///app.db
```

```bash
# backend/.env.production - Production (via Railway)
FLASK_ENV=production
FLASK_DEBUG=False
DATABASE_URL=postgresql://... (if using Postgres)
```

### Secrets Management

**Never commit secrets!**

```bash
# 1. Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore

# 2. Use .env.example for reference
cp .env .env.example
# Edit .env.example to remove real values
```

---

## Domain Setup

### Option 1: Use Netlify/Railway Domains
```
Frontend: https://trading-app.netlify.app
Backend: https://trading-api.railway.app
✅ Works immediately
❌ Branded domains
```

### Option 2: Custom Domain

#### Buy Domain
```
Registrars: GoDaddy, Namecheap, Google Domains, Route 53
Cost: $10-15/year
```

#### Point to Netlify (Frontend)

**Netlify Dashboard → Domain Settings → Custom Domain**

```
1. Add domain: trading.yourdomain.com
2. Note the nameservers:
   - dns1.p03.nsone.net
   - dns2.p03.nsone.net
   - dns3.p03.nsone.net
   - dns4.p03.nsone.net

3. Go to registrar (GoDaddy, etc.)
4. Update nameservers → point to Netlify
5. Wait 24-48 hours for DNS propagation

Verify with:
dig trading.yourdomain.com
nslookup trading.yourdomain.com
```

#### Point to Railway (Backend)

**Railway Dashboard → Custom Domain**

```
1. Add domain: api.yourdomain.com
2. Get CNAME target from Railway
3. Go to registrar
4. Create CNAME record:
   api → trailing-dot-from-railway
5. Wait for DNS propagation

Verify with:
curl https://api.yourdomain.com/api/health
```

#### Update Frontend API URL

After DNS propagates:

```bash
# Update .env
REACT_APP_API_URL=https://api.yourdomain.com/api

# Redeploy to Netlify
git push origin main
```

---

## Monitoring & Maintenance

### Backend Monitoring (Railway)

```
Railway → Metrics

Monitor:
✅ CPU Usage (target < 30%)
✅ Memory Usage (target < 256MB)
✅ Deployment Status
✅ Recent Logs
✅ Error Rate
```

**View Logs:**
```bash
# In Railway Dashboard
Logs → Real-time streaming
Filter by: Level (error, warn, info)
```

### Frontend Monitoring (Netlify)

```
Netlify → Analytics

Monitor:
✅ Build Status
✅ Deployment History
✅ Load Time
✅ Error Rate
✅ Uptime
```

### Health Checks

```bash
# Daily health check script
# health-check.sh

#!/bin/bash

# Backend health
BACKEND_HEALTH=$(curl -s https://api.yourdomain.com/api/health | grep -q "healthy" && echo "✅" || echo "❌")

# Frontend health  
FRONTEND_HEALTH=$(curl -s https://trading.yourdomain.com | grep -q "DOCTYPE" && echo "✅" || echo "❌")

# Stock API health
STOCK_API_HEALTH=$(curl -s http://65.0.104.9/getSymbols | grep -q "symbols" && echo "✅" || echo "❌")

echo "Backend: $BACKEND_HEALTH"
echo "Frontend: $FRONTEND_HEALTH"
echo "Stock API: $STOCK_API_HEALTH"

if [ "$BACKEND_HEALTH" != "✅" ]; then
  # Alert admin
  echo "ALERT: Backend is down!" | mail -s "Backend Alert" admin@yourdomain.com
fi
```

**Run daily:**
```bash
# Add to crontab
0 9 * * * /path/to/health-check.sh
```

### Backup Strategy

```bash
# Backup Firebase data weekly
# backup-firebase.sh

#!/bin/bash

firebase firestore:export gs://your-bucket/backups/$(date +%Y%m%d)

# Backup code repository
git push origin main
git push --tags

# Backup environment variables
# Manual: Screenshot or export from Railway/Netlify dashboards
```

### Update Strategy

```bash
# Rolling updates (zero downtime)

1. Update code locally
2. Run tests: pytest
3. Commit & push to main
4. GitHub Actions runs tests
5. If passing:
   - Railway auto-deploys backend
   - Netlify auto-deploys frontend
6. Monitor logs for errors
7. Rollback if needed (previous deployment)
```

---

## Troubleshooting

### Backend Issues

#### Issue: 502 Bad Gateway
```
Cause: Backend not responding
Solution:
1. Check Railway Logs
2. Verify environment variables are set
3. Check if port 5000 is exposed
4. Restart deployment in Railway
```

#### Issue: CORS Error
```
Browser console: "Cross-Origin Request Blocked"

Solution:
1. Check CORS_ORIGINS environment variable
2. Verify frontend URL matches
3. In Flask app:
   CORS(app, resources={
     r"/api/*": {
       "origins": os.getenv("CORS_ORIGINS").split(",")
     }
   })
4. Redeploy backend
```

#### Issue: Database Connection Error
```
Cause: Firebase credentials incorrect
Solution:
1. Verify FIREBASE_PROJECT_ID
2. Verify service account JSON (if using)
3. Check Firebase rules allow read/write
4. In Firebase Console → Database → Rules
```

### Frontend Issues

#### Issue: Blank White Page
```
Cause: Build failed or API URL wrong
Solution:
1. Check Netlify build logs
2. Verify REACT_APP_API_URL in environment
3. Check browser console for errors
4. Try: npm run build locally
```

#### Issue: "Cannot GET /"
```
Cause: SPA routing not configured
Solution:
1. Verify netlify.toml has redirect rules:
   from = "/*"
   to = "/index.html"
   status = 200
2. Redeploy to Netlify
```

#### Issue: Styles Not Loading
```
Cause: TailwindCSS build issue
Solution:
1. Verify npm install completed
2. Check build command includes Tailwind
3. In package.json: "build": "vite build"
4. Verify postcss.config.js exists
5. Rebuild: npm run build
```

### API Integration Issues

#### Issue: Stock Data Not Loading
```
Cause: Stock API unreachable
Solution:
1. Check if http://65.0.104.9/ is up
2. Verify internet connection from Railway
3. Add retry logic with exponential backoff
4. Monitor Stock API rate limits (60 req/min)
```

#### Issue: Slow API Responses
```
Cause: Caching not working
Solution:
1. Check PriceCache in enhanced_stock_api.py
2. Verify 5-minute TTL is set
3. Monitor API call frequency
4. Add Redis cache layer if needed
```

### Performance Issues

#### Issue: Slow Page Load
```
Solution:
1. Enable gzip compression
2. Optimize images
3. Lazy-load components
4. Cache API responses
5. Use CDN (Netlify/Railway automatic)
```

#### Issue: High Memory Usage
```
Solution:
1. Monitor process memory in Railway
2. Reduce cache TTL if memory > 256MB
3. Implement max cache size
4. Use pagination instead of loading all data
```

---

## Production Checklist

Before going live:

- [ ] Backend deployed & responding
- [ ] Frontend deployed & displaying
- [ ] API endpoints tested
- [ ] Database connected
- [ ] Environment variables set
- [ ] CORS configured
- [ ] SSL/TLS certificates valid
- [ ] Domain DNS propagated
- [ ] Monitoring enabled
- [ ] Backup strategy enabled
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error logging enabled
- [ ] Analytics configured
- [ ] Team access restricted
- [ ] CI/CD pipeline working

---

## Post-Deployment Tasks

### 1. User Communication
```
📧 Email users: "New web platform live!"
🔗 Share URLs: https://trading.yourdomain.com
📱 Update app stores: Desktop app still available
💬 Share on social media / forums
```

### 2. Collect Feedback
```
📊 Add feedback form to web app
📧 Email feedback to admin@yourdomain.com
🐛 Create GitHub issues from feedback
📈 Track feature requests
```

### 3. Monitor Metrics
```
✅ Daily DAU (Daily Active Users)
✅ API response times
✅ Error rates
✅ User retention
✅ Most-used features
```

### 4. Plan Phase 2
```
📋 Add voice interface
📋 Add file manager
📋 Add search interface
📋 Add memory browser
(See WEB_FEATURE_ROADMAP.md)
```

---

## Command Reference

### Deploy Backend
```bash
# From local
git push origin main
# Railway auto-deploys

# Or manual redeploy
railway up
```

### Deploy Frontend
```bash
# From local
git push origin main
# Netlify auto-deploys

# Or manual build & deploy
npm run build
netlify deploy --prod
```

### View Logs
```bash
# Backend logs
railway logs

# Frontend logs
netlify logs

# Tail live logs
railway logs -f
```

### Rollback
```bash
# Railway rollback
railway rollback

# Netlify rollback
# Dashboard → Deploys → Click previous → Publish
```

### SSH into Backend (Railway)
```bash
# Not recommended (use logs instead)
# Railway doesn't support SSH directly
# Use logs for debugging
```

---

## Cost Estimation (Monthly)

| Service | Free Tier | Cost | Notes |
|---------|-----------|------|-------|
| Railway (Backend) | $5 credit | $7-15 | Based on usage |
| Netlify (Frontend) | 100GB bandwidth | Free-$20 | Auto-scales |
| Firebase (DB) | 1GB storage | Free-$25+ | Based on usage |
| Domain | N/A | $12/year | One-time yearly |
| **Total** | - | **$0-50** | Very affordable |

---

## Support & Resources

### Railway Docs
- https://docs.railway.app/

### Netlify Docs
- https://docs.netlify.com/

### Firebase Docs
- https://firebase.google.com/docs

### Python Flask Docs
- https://flask.palletsprojects.com/

### React Docs
- https://react.dev/

---

## Success! 🎉

Your web-first AI Personal Assistant is now **live in production**!

```
✅ Backend: https://api.yourdomain.com
✅ Frontend: https://trading.yourdomain.com
✅ Real-time data: Stock market live
✅ Global accessibility: Anyone can access
✅ Scalable: Handles growth automatically
✅ Monitoring: Know if something breaks
```

**Next Steps:**
1. Share with users
2. Collect feedback
3. Monitor metrics
4. Plan Phase 2 features
5. Scale to support more users

---

**Questions?** Check the troubleshooting section above or create a GitHub issue!
