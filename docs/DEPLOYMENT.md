# Deployment Guide — Jarvis AI Assistant

## Architecture

- **Frontend**: React + Vite → deploy to **Netlify** (free)
- **Backend**: Python HTTP server → deploy to **Render** (free)
- **AI**: Groq API (free at console.groq.com)

---

## 1. Backend → Render (Free)

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo: `saishivasanjeethpaikarao-jpg/ai--assistant`
3. Settings:
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python dashboard_api.py`
   - **Plan**: Free
4. Add Environment Variable:
   - `GROQ_API_KEY` = your key from console.groq.com
   - `GROQ_MODEL` = `llama-3.3-70b-versatile`
5. Deploy → copy the URL (e.g. `https://jarvis-ai-backend.onrender.com`)

---

## 2. Frontend → Netlify (Free)

1. Go to [netlify.com](https://netlify.com) → Add new site → Import from Git
2. Connect your GitHub repo
3. Build settings (auto-detected from `netlify.toml`):
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. Add Environment Variable in Netlify dashboard:
   - `VITE_API_URL` = your Render backend URL (e.g. `https://jarvis-ai-backend.onrender.com`)
5. Deploy!

---

## 3. Local Development

```bash
# Terminal 1 — Backend
cd backend && python dashboard_api.py

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Frontend at http://localhost:5000 — proxies /api to localhost:8000 automatically.

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `GROQ_API_KEY` | Backend (Render) | Free at console.groq.com |
| `GROQ_MODEL` | Backend (Render) | `llama-3.3-70b-versatile` |
| `VITE_API_URL` | Frontend (Netlify) | Your Render backend URL |

---

## Free Tier Limits

- **Render free**: spins down after 15 min inactivity (first request takes ~30s to wake)
- **Netlify free**: 100GB bandwidth/month, unlimited deploys
- **Groq free**: generous rate limits, fast inference

---

## Vibe Coder API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/vibe/agents` | List all 6 specialist agents |
| POST | `/api/vibe/code` | Generate code with agent routing |
| POST | `/api/vibe/run` | Execute Python code safely |
| POST | `/api/vibe/fix` | Auto-fix broken code with DebugAgent |
| POST | `/api/vibe/chat` | Ask questions about generated code |
| POST | `/api/vibe/detect` | Detect agent from prompt (debounced) |
