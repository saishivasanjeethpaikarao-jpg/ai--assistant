# 🚀 Enhanced Trading System API - Complete Guide

## Overview

Your trading system now integrates with **http://65.0.104.9/** - a powerful free Indian Stock Market API with:
- ✅ Real-time NSE & BSE data
- ✅ No API keys required
- ✅ 30+ pre-cached popular stocks
- ✅ Flexible response formats
- ✅ Search, compare, batch queries
- ✅ Rate limited to 60 req/min

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                React Web App (Frontend)              │
│              http://localhost:3000                   │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│          Flask Backend API                           │
│      http://localhost:5000/api                       │
│                                                      │
│  ├─ Enhanced Stock API Client                       │
│  ├─ Market Tracker (Portfolio/Watchlist)            │
│  ├─ Alerts System (Notifications)                   │
│  └─ Analytics Engine (Technical Analysis)           │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│    Indian Stock Market API (http://65.0.104.9)      │
│                                                      │
│  Real-time NSE/BSE Data, Search, Compare            │
└─────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Health & Status

#### Check API Health
```
GET /api/health

Response:
{
  "status": "success",
  "data": {
    "status": "healthy",
    "version": "2.0",
    "api": "Enhanced Indian Stock API",
    "stats": {
      "total_requests": 42,
      "cache_size": 15
    }
  }
}
```

#### Get API Info
```
GET /api

Response:
{
  "status": "success",
  "data": {
    "name": "Trading System API",
    "version": "2.0",
    "stock_api": "http://65.0.104.9",
    "features": [
      "Support for both NSE and BSE exchanges",
      "Real-time stock prices",
      "Search by company name",
      "Batch queries",
      ...
    ]
  }
}
```

---

### Stock Search

#### Search by Company Name or Symbol
```
GET /api/stocks/search?q=reliance

Response:
{
  "status": "success",
  "data": {
    "query": "reliance",
    "total_results": 1,
    "results": [
      {
        "symbol": "RELIANCE",
        "company_name": "Reliance Industries Limited",
        "match_type": "exact",
        "nse_ticker": "RELIANCE.NS",
        "bse_ticker": "RELIANCE.BO",
        "nse_url": "/stock?symbol=RELIANCE.NS",
        "bse_url": "/stock?symbol=RELIANCE.BO"
      }
    ]
  }
}
```

**Examples:**
```
GET /api/stocks/search?q=tata
GET /api/stocks/search?q=hdfc
GET /api/stocks/search?q=indian oil
GET /api/stocks/search?q=infosys
```

---

### Single Stock

#### Get Stock Details (Default NSE)
```
GET /api/stocks/RELIANCE

Response:
{
  "status": "success",
  "data": {
    "symbol": "RELIANCE",
    "exchange": "NSE",
    "ticker": "RELIANCE.NS",
    "company_name": "Reliance Industries Limited",
    "last_price": 2456.75,
    "change": 12.3,
    "percent_change": 0.5,
    "previous_close": 2444.45,
    "open": 2450.0,
    "day_high": 2468.9,
    "day_low": 2445.2,
    "year_high": 2856.0,
    "year_low": 2220.3,
    "volume": 8234567,
    "market_cap": 16645678900000.0,
    "pe_ratio": 27.35,
    "dividend_yield": 0.35,
    "sector": "Energy",
    "industry": "Oil & Gas Integrated"
  }
}
```

#### Get Stock from Specific Exchange
```
GET /api/stocks/RELIANCE?exchange=NSE
GET /api/stocks/RELIANCE?exchange=BSE
```

#### Get with Different Format
```
GET /api/stocks/RELIANCE?format=num   (numbers only)
GET /api/stocks/RELIANCE?format=val   (with units)
```

---

### Multiple Stocks (Batch)

#### Get Multiple Stocks at Once
```
POST /api/stocks/batch

Request Body:
{
  "symbols": ["TCS", "INFY", "HDFCBANK"],
  "format": "num"
}

Response:
{
  "status": "success",
  "data": {
    "total": 3,
    "stocks": [
      {
        "symbol": "TCS",
        "last_price": 3456.75,
        "percent_change": -0.36,
        ...
      },
      ...
    ]
  }
}
```

**Mixed NSE/BSE:**
```
{
  "symbols": ["TCS.NS", "RELIANCE.BO", "INFY.NS"]
}
```

---

### Market Data

#### Top Gainers
```
GET /api/market/gainers
GET /api/market/gainers?limit=20

Response:
{
  "status": "success",
  "data": {
    "type": "gainers",
    "total": 10,
    "stocks": [
      {
        "symbol": "STOCK1",
        "percent_change": 5.25,
        ...
      },
      ...
    ]
  }
}
```

#### Top Losers
```
GET /api/market/losers
GET /api/market/losers?limit=20
```

#### Stock Comparison (NSE vs BSE)
```
GET /api/stocks/RELIANCE/compare

Response:
{
  "status": "success",
  "data": {
    "symbol": "RELIANCE",
    "nse_price": 2456.75,
    "bse_price": 2456.50,
    "nse_change": 12.3,
    "bse_change": 12.05,
    "difference": 0.25,
    "better_exchange": "NSE"
  }
}
```

#### All Available Symbols
```
GET /api/market/symbols

Response:
{
  "status": "success",
  "data": {
    "total": 30,
    "symbols": [
      {
        "symbol": "RELIANCE",
        "nse_ticker": "RELIANCE.NS",
        "bse_ticker": "RELIANCE.BO"
      },
      ...
    ]
  }
}
```

---

### Portfolio Management

#### Get Portfolio
```
GET /api/portfolio

Response:
{
  "status": "success",
  "data": {
    "holdings": [
      {
        "symbol": "TCS",
        "quantity": 10,
        "buy_price": 3400.0,
        "current_price": 3456.75,
        "gain_loss": 567.5
      }
    ],
    "total_invested": 34000,
    "total_current_value": 34567.5,
    "total_gains_losses": 567.5
  }
}
```

#### Add to Portfolio
```
POST /api/portfolio/add

Request Body:
{
  "symbol": "TCS",
  "quantity": 10,
  "buy_price": 3400.0
}
```

#### Update Portfolio Holding
```
PUT /api/portfolio/TCS

Request Body:
{
  "quantity": 15,
  "buy_price": 3450.0
}
```

#### Remove from Portfolio
```
DELETE /api/portfolio/TCS
```

---

### Watchlist

#### Get Watchlist
```
GET /api/watchlist
```

#### Add to Watchlist
```
POST /api/watchlist/add

Request Body:
{
  "symbol": "INFY",
  "reason": "Interested in long-term",
  "target_price": 1800.0
}
```

#### Remove from Watchlist
```
DELETE /api/watchlist/INFY
```

---

### Alerts

#### Get All Alerts
```
GET /api/alerts
```

#### Create Alert
```
POST /api/alerts

Request Body:
{
  "symbol": "RELIANCE",
  "target_price": 2500.0,
  "type": "price",
  "channels": ["in_app", "email"]
}
```

#### Delete Alert
```
DELETE /api/alerts/<alert_id>
```

---

### Analytics

#### Get Technical Analysis
```
GET /api/analytics/TCS

Response:
{
  "status": "success",
  "data": {
    "symbol": "TCS",
    "technical_indicators": {
      "rsi": 65.5,
      "macd": 0.25,
      "bollinger_bands": {...},
      ...
    },
    "sentiment": "bullish"
  }
}
```

#### Get Trading Recommendations
```
GET /api/trading/recommendations

Response:
{
  "status": "success",
  "data": {
    "recommendations": [
      {
        "symbol": "TCS",
        "recommendation": "BUY",
        "confidence": 0.85,
        "target_price": 3600
      },
      ...
    ]
  }
}
```

---

## Popular Stocks

### List of 30+ Pre-cached Stocks

| Company | Symbol | NSE | BSE |
|---------|--------|-----|-----|
| Reliance Industries | RELIANCE | RELIANCE.NS | RELIANCE.BO |
| Tata Consultancy Services | TCS | TCS.NS | TCS.BO |
| HDFC Bank | HDFCBANK | HDFCBANK.NS | HDFCBANK.BO |
| Infosys | INFY | INFY.NS | INFY.BO |
| ICICI Bank | ICICIBANK | ICICIBANK.NS | ICICIBANK.BO |
| State Bank of India | SBIN | SBIN.NS | SBIN.BO |
| Bharti Airtel | BHARTIARTL | BHARTIARTL.NS | BHARTIARTL.BO |
| ITC Limited | ITC | ITC.NS | ITC.BO |
| Hindustan Unilever | HINDUNILVR | HINDUNILVR.NS | HINDUNILVR.BO |
| Indian Oil | IOC | IOC.NS | IOC.BO |
| Larsen & Toubro | LT | LT.NS | LT.BO |
| Asian Paints | ASIANPAINT | ASIANPAINT.NS | ASIANPAINT.BO |
| Maruti Suzuki | MARUTI | MARUTI.NS | MARUTI.BO |
| Bajaj Finance | BAJFINANCE | BAJFINANCE.NS | BAJFINANCE.BO |
| Titan Company | TITAN | TITAN.NS | TITAN.BO |

---

## Response Formats

### Format: num (Numbers Only)
```json
{
  "last_price": 2456.75,
  "change": 12.3,
  "percent_change": 0.5,
  "pe_ratio": 27.35,
  "market_cap": 16645678900000.0
}
```

### Format: val (With Units)
```json
{
  "last_price": {
    "value": 2456.75,
    "unit": "INR"
  },
  "change": {
    "value": 12.3,
    "unit": "INR"
  },
  "percent_change": {
    "value": 0.5,
    "unit": "%"
  },
  "pe_ratio": {
    "value": 27.35,
    "unit": "x"
  },
  "market_cap": {
    "value": 166456.79,
    "unit": "Crores INR"
  }
}
```

---

## Usage Examples

### Example 1: Get Stock Price
```bash
curl "http://localhost:5000/api/stocks/RELIANCE"
```

### Example 2: Search Stock
```bash
curl "http://localhost:5000/api/stocks/search?q=reliance"
```

### Example 3: Compare Exchanges
```bash
curl "http://localhost:5000/api/stocks/TCS/compare"
```

### Example 4: Get Top Gainers
```bash
curl "http://localhost:5000/api/market/gainers?limit=10"
```

### Example 5: Add to Portfolio
```bash
curl -X POST "http://localhost:5000/api/portfolio/add" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "TCS",
    "quantity": 10,
    "buy_price": 3400.0
  }'
```

### Example 6: Batch Query
```bash
curl -X POST "http://localhost:5000/api/stocks/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": ["TCS", "INFY", "HDFCBANK"],
    "format": "num"
  }'
```

---

## Error Responses

### Invalid Symbol
```json
{
  "status": "error",
  "error": "Stock INVALID not found on NSE",
  "timestamp": "2024-01-15T10:30:45.123456"
}
```

### Missing Parameters
```json
{
  "status": "error",
  "error": "Please provide search query",
  "timestamp": "2024-01-15T10:30:45.123456"
}
```

### Rate Limited
```json
{
  "status": "error",
  "error": "Rate limit exceeded",
  "message": "Maximum 60 requests per minute"
}
```

---

## Best Practices

1. **Use Batch Queries** - Fetch multiple stocks in one request
2. **Cache Results** - Responses are cached for 5 minutes
3. **Choose Format** - Use `num` for calculations, `val` for display
4. **Default Exchange** - NSE is default, specify `.BO` for BSE
5. **Search First** - Always search to get correct symbol
6. **Rate Limiting** - Limit to 60 requests per minute
7. **Error Handling** - Always check `status` field in response

---

## Testing

### Using Python
```python
import requests

# Search
response = requests.get('http://localhost:5000/api/stocks/search?q=tcs')
print(response.json())

# Get Stock
response = requests.get('http://localhost:5000/api/stocks/TCS')
print(response.json())

# Batch Query
response = requests.post(
  'http://localhost:5000/api/stocks/batch',
  json={'symbols': ['TCS', 'INFY']}
)
print(response.json())
```

### Using JavaScript/React
```javascript
// Fetch stock
const response = await fetch('http://localhost:5000/api/stocks/TCS');
const data = await response.json();
console.log(data);

// Search
const search = await fetch(
  'http://localhost:5000/api/stocks/search?q=reliance'
);
const results = await search.json();
console.log(results);
```

---

## Performance Tips

1. **Cache at Frontend** - Store responses locally
2. **Batch Requests** - Use `/stocks/batch` instead of multiple calls
3. **Limit Polling** - Don't refresh more than every 30 seconds
4. **Use Compression** - Enable gzip compression
5. **Minimize Requests** - Fetch only needed data

---

## Troubleshooting

### "No results found"
- Check spelling of company name
- Try using stock symbol (TCS, INFY, etc.)

### "Stock not found on NSE"
- Stock may be on BSE only
- Use `/stocks/search` to find correct symbol
- Try with exchange parameter

### "Rate limit exceeded"
- Reduce request frequency
- Implement caching
- Use batch queries

### "Connection refused"
- Ensure backend is running: `flask run`
- Check if port 5000 is available
- Check firewall settings

---

## Deployment

### Production Environment
```bash
# Use Gunicorn instead of Flask development server
gunicorn --bind 0.0.0.0:5000 --workers 4 app_enhanced:app

# Or using Docker
docker build -t trading-api backend/
docker run -p 5000:5000 trading-api
```

### Environment Variables
```
FLASK_ENV=production
FLASK_DEBUG=False
FLASK_PORT=5000
```

---

## API Rate Limits

- **Maximum**: 60 requests per minute
- **Per IP**: Shared limit across all requests
- **Caching**: Results cached for 5 minutes
- **Batch**: No additional limit for batch queries

---

## Support

For issues or questions:
1. Check API health: `GET /api/health`
2. Review error response message
3. Check API documentation: `/api`
4. Verify stock symbol: `/api/stocks/search`

---

**Your API is ready for production!** 🚀
