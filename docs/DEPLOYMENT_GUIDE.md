# AI Assistant - Complete Working System

A full-stack AI chat assistant with a 12-layer autonomous AI backend, modern web UI, and serverless deployment option.

## ✅ What's Working

- **12-Layer AI System**: Intent detection, planning, execution, safety, reflection, adaptive memory
- **Real-time Chat UI**: Clean, responsive web interface with PWA support
- **Local Backend**: Python HTTP server connecting to AI system on port 5000
- **Frontend Server**: Serves chat UI on port 8080
- **End-to-End**: User message → Frontend → Backend AI → Response displayed

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.13+
- Virtual environment created and activated (`.venv/`)

### Run Both Servers

**Terminal 1 - Backend AI System:**
```bash
cd c:\Users\santo\ai-assistant
python backend/dashboard_api.py
# Starts on http://localhost:5000
# API: POST /api/request { "message": "your message" }
```

**Terminal 2 - Frontend Dev Server:**
```bash
cd c:\Users\santo\ai-assistant
python frontend_server.py
# Starts on http://localhost:8080
# Open browser to http://localhost:8080
```

### Test in Browser
1. Open http://localhost:8080
2. Type message and send
3. See AI response from backend

## 📁 Key Files

**Frontend (Port 8080):**
- `frontend/index.html` - Chat UI
- `frontend/script.js` - Chat logic
- `frontend/api-client.js` - API communication
- `frontend/style.css` - Modern styling
- `frontend/manifest.json` - PWA configuration
- `frontend/sw.js` - Service Worker (offline support)

**Backend (Port 5000):**
- `backend/dashboard_api.py` - HTTP server & API endpoints
- `backend/system_coordinator.py` - Orchestrates 12 AI layers
- `backend/autonomous_executor.py` - Executes AI pipeline
- `backend/advanced_system.py` - Layer definitions
- `backend/memory/adaptive_memory.py` - Learning & storage

**Deployment:**
- `netlify/functions/chat.js` - Serverless backend function
- `netlify.toml` - Build & deploy configuration
- `frontend_server.py` - Local dev server

## 🔧 API Endpoints

```
POST /api/request
  Body: { "message": "user input" }
  Returns: { "reply": "...", "thinking": [...], "response": {...} }

GET /api/health
  Returns: { "status": "healthy" }

GET /api/system/status
  Returns system info and stats

GET /api/system/knowledge
  Returns learned patterns and strategies

GET /api/history
  Returns request history
```

## 📦 Deployment to Netlify

1. **Connect to Netlify:**
   ```bash
   npm install netlify-cli -g
   netlify init
   ```

2. **Set Environment Variables:**
   - `OPENAI_API_KEY` - Fallback AI (optional)
   - `BACKEND_URL` - Production backend URL

3. **Deploy:**
   ```bash
   netlify deploy
   ```

4. **Access:**
   - Web: https://your-site.netlify.app
   - PWA: Install from browser menu

## 🎯 Architecture

```
User Browser
    ↓
Frontend UI (http://localhost:8080)
    ↓
Chat API Client (api-client.js)
    ↓
Backend API (http://localhost:5000/api/request)
    ↓
System Coordinator (12-layer AI)
    ↓
Adaptive Memory (learning & storage)
    ↓
Response → Display in Chat
```

## 💡 Features

✅ Real-time chat interface
✅ 12-layer autonomous AI system
✅ Adaptive memory (learns from interactions)
✅ Request history tracking
✅ PWA support (installable app)
✅ Offline capability (Service Worker)
✅ Serverless deployment ready
✅ CORS enabled for cross-origin requests
✅ Clean, modern UI with gradients & animations
✅ Responsive design (mobile-friendly)

## 🧪 Testing

**Test Backend API:**
```python
import urllib.request, json
data = json.dumps({'message': 'hello'}).encode('utf-8')
req = urllib.request.Request('http://localhost:5000/api/request',
    data=data, headers={'Content-Type': 'application/json'}, method='POST')
response = urllib.request.urlopen(req)
result = json.loads(response.read())
print(result['reply'])
```

**Test Frontend:**
- Open http://localhost:8080
- Type any message
- Verify response appears

## 📊 System Info

- **Total AI Layers**: 12
- **Chat Interface**: HTML5 + Vanilla JS
- **Backend**: Python 3.13
- **Frontend**: Pure JavaScript (no framework)
- **PWA**: Fully configured and ready
- **API**: RESTful JSON endpoints
- **Memory**: JSON file storage + LocalStorage

## ⚙️ Configuration

Edit `backend/system_prompt_config.py` to customize:
- System prompt
- AI personality
- Layer behaviors
- Response generation

## 🐛 Troubleshooting

**"Connection refused" on http://localhost:5000:**
- Ensure `python backend/dashboard_api.py` is running

**"Service Unavailable" 503 in chat:**
- Check backend is processing requests
- See backend terminal for errors

**Chat UI won't load:**
- Verify `python frontend_server.py` is running
- Check http://localhost:8080 directly

**Offline not working:**
- Service Worker may not have registered
- Check browser console for errors
- Clear cache and reload

## 📝 Next Steps

1. ✅ Local testing complete
2. ✅ API endpoints verified
3. → Deploy to Netlify for production
4. → Configure custom domain
5. → Set up monitoring & analytics

---

**Status**: ✅ Ready for production deployment

Start servers and open http://localhost:8080 to chat!
