# Airis AI Assistant

Iron Man–style AI assistant: 12-layer brain, voice in/out, bilingual (English + Telugu), PC control, Indian stock trading, self-improvement, wake-word activation, voice cloning.

## Architecture

- **Frontend**: React + Vite (`frontend/`) on port 5000 — inline styles, Spline-inspired light theme
- **Backend**: Python HTTP server (`backend/dashboard_api.py`) on port 8000
- Vite proxy: `/api` → `localhost:8000`
- **Auth**: Firebase Authentication (Google, GitHub, Email/Password) via `frontend/src/firebase.js`
- **Routing**: React Router v6 — `/` landing, `/login` auth, `/app` protected main app

## Settings — 9 tabs

AI Engine · Voice & Speech · Language · Wake Word · Voice Clone · System Prompt · Notifications · Appearance · All API Keys

## Sidebar Panels (7)

Chat History · Memory · Trading · Reminders · Skills/Capabilities (29) · Analytics · 12-Layer Brain

## Backend API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/request` | POST | Send message to AI |
| `/api/settings` | GET/POST | All settings + API keys |
| `/api/provider/status` | GET | Groq/Ollama/ElevenLabs status |
| `/api/capabilities` | GET | 29 capabilities list |
| `/api/system/layers` | GET | 12-layer AI brain info |
| `/api/system/prompt` | GET/POST | System prompt |
| `/api/reminders` | GET/POST | Reminders |
| `/api/memory/stats` | GET | Memory stats |
| `/api/analytics` | GET | Usage analytics |

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

## Pages & Auth Flow

- `/` → `LandingPage.jsx` — Spline-inspired landing with holographic sphere, hero, features, testimonials, CTA
- `/login` → `LoginPage.jsx` — Google, GitHub, email/password sign-in + sign-up + password reset
- `/app` → `ProtectedApp` (in App.jsx) — main chat interface, requires auth
- `frontend/src/firebase.js` — Firebase app init; uses `GOOGLE_API_KEY` secret via Vite `envPrefix`
- `frontend/src/contexts/AuthContext.jsx` — auth state, sign-in methods, error handling
- `frontend/public/airis-sphere.png` — holographic iridescent sphere logo asset

## Frontend Dependencies

Node.js packages managed in `frontend/package.json`:
- React 18, React Router v6, Axios, Zustand, react-icons, framer-motion
- Firebase 10 (auth)
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
