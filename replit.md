# JARVIS AI Assistant

A professional-grade AI personal assistant with a 12-layer autonomous intelligence system, modern dashboard UI, and real-time interaction.

## Architecture

- **Frontend**: React + Vite app (`frontend/`) running on port 5000
- **Backend**: Python HTTP server (`backend/dashboard_api.py`) running on port 8000
- Both communicate via Vite's proxy (`/api` → `localhost:8000`)

## Running the App

Two workflows are configured:

1. **Start application** — `cd frontend && npm run dev` (port 5000, webview)
2. **Backend API** — `cd backend && python3 dashboard_api.py` (port 8000, console)

## Key Files

- `frontend/vite.config.js` — Vite config with proxy to backend, host `0.0.0.0`, port 5000, `allowedHosts: true`
- `frontend/src/App.jsx` — Main React component
- `frontend/src/services/api.js` — API client (uses `/api` proxy path)
- `frontend/src/store/useStore.js` — Zustand state store
- `backend/dashboard_api.py` — Python HTTP backend on port 8000
- `backend/system_coordinator.py` — 12-layer AI system coordinator
- `backend/autonomous_executor.py` — Orchestrates all AI layers

## Frontend Dependencies

Node.js packages managed in `frontend/package.json`:
- React 18, React Router, Axios, Zustand, react-icons, framer-motion
- Vite 4, @vitejs/plugin-react
- TailwindCSS v4, @tailwindcss/postcss, autoprefixer

## Backend Dependencies

Python packages: fastapi, uvicorn, python-dotenv, requests

## Environment Variables

Copy `.env.template` to `backend/.env` and fill in API keys:
- `GROQ_API_KEY` — for Groq LLM API
- `FIREBASE_API_KEY` — for Firebase authentication
- `FISH_AUDIO_API_KEY` — for voice TTS
- `ELEVENLABS_API_KEY` — optional voice API

## AI Modes

- Chat, Command, Goal Planning, Analytics, Trading
- 12-layer architecture: Intent → Planning → Execution → Reflection → Learning
