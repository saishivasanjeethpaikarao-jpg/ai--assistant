# 🚀 Web-First Trading System - Quick Start

## 5-Minute Setup

### Start Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
flask run
```
**Backend ready:** http://localhost:5000/api/health

### Start Frontend (New Terminal)
```bash
cd frontend
npm install
npm start
```
**Frontend ready:** http://localhost:3000

### Done! 🎉
- Dashboard: http://localhost:3000
- API: http://localhost:5000
- Gainers/Losers visible on dashboard

---

## Or Use Docker

```bash
docker-compose up
# Everything starts automatically
```

---

## Deploy Instantly

### Backend → Railway.app
1. Connect GitHub repo
2. Railway auto-detects Python
3. Deploy with one click
4. Get URL like: `https://trading-api.railway.app`

### Frontend → Netlify
1. Connect GitHub repo
2. Build: `npm run build`
3. Publish: `dist`
4. Set `REACT_APP_API_URL` env var
5. Deploy with one click
6. Get URL like: `https://trading-app.netlify.app`

---

## Architecture

```
💻 Frontend (React)
    ↓
🔄 REST API (Flask)
    ↓
📊 Trading Logic (Python)
    ↓
📈 Stock API (NSE/BSE)
```

---

## API Endpoints

All endpoints at: `http://localhost:5000/api`

**Stocks:**
- `GET /stocks` - All stocks
- `GET /stocks/RELIANCE` - Stock details
- `GET /market/gainers` - Top gainers

**Portfolio:**
- `GET /portfolio` - Your holdings
- `POST /portfolio/add` - Add stock

**More:** See `WEB_DEPLOYMENT_GUIDE.md`

---

## Next Steps

1. ✅ Run locally (done!)
2. ⬜ Add authentication (optional)
3. ⬜ Deploy backend
4. ⬜ Deploy frontend
5. ⬜ Add more features

---

## Troubleshooting

**Backend won't start?**
```bash
pip install -r backend/requirements.txt
```

**Frontend won't start?**
```bash
cd frontend && npm install
```

**Can't connect?**
Make sure both are running and check URLs:
- Backend: `http://localhost:5000/api`
- Frontend: `http://localhost:3000`

---

**Ready to revolutionize trading with web-first architecture!** 🌐✨
