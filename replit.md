# Airis AI Assistant

Iron Man–style AI assistant: 12-layer brain, voice in/out, bilingual (English + Telugu), PC control, Indian stock trading, self-improvement, wake-word activation, voice cloning.

## Architecture

- **Frontend**: React + Vite (`frontend/`) on port 5000 — inline styles, light theme matching landing page
- **Backend**: Python HTTP server (`backend/dashboard_api.py`) on port 8000
- Vite proxy: `/api` → `localhost:8000`
- **Auth**: Firebase Authentication (Google, GitHub, Email/Password, Anonymous/Guest) via `frontend/src/firebase.js`
- **Routing**: React Router v6 — `/` landing, `/login` auth, `/app` protected main app

## Design System

- Background: `#F5F4F2`
- Primary blue: `#437DFD`
- Accent coral: `#FD5B5D`
- Dark: `#0C0C0C`
- Muted: `#777` / `#aaa`
- Card: `rgba(255,255,255,0.82)` with `rgba(0,0,0,0.08)` border
- Font: DM Sans (imported in index.css)

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

- `/` → `LandingPage.jsx` — Light theme landing with holographic sphere, hero, features, capabilities, pricing, FAQ, CTA
- `/login` → `LoginPage.jsx` — Google, GitHub, email/password sign-in + sign-up + password reset + "Continue as Guest"
- `/app` → `ProtectedApp` (in App.jsx) — main chat interface, requires auth (or guest/anonymous)
- `frontend/src/firebase.js` — Firebase app init; uses `VITE_FIREBASE_API_KEY` env secret
- `frontend/src/contexts/AuthContext.jsx` — auth state, sign-in methods, signInAnonymously for guest mode
- `frontend/public/airis-sphere.png` — holographic iridescent sphere logo asset

## Components (all light theme, blue/coral accents)

- `ActivityBar.jsx` — Left icon rail (52px wide), shows real Firebase user avatar/initials, click to sign out
- `Sidebar.jsx` — 240px panel for Chat/Memory/Trading/Reminders/Skills/Analytics/Brain
- `ChatInterface.jsx` — Main chat area with EmptyState, MessageBubble, voice, TTS
- `StatusBar.jsx` — 26px bottom bar showing AI/mic/voice state
- `ConversationHistory.jsx` — Right sidebar (272px) for conversation history
- `CommandPalette.jsx` — Fuzzy-search command modal (⌘K)

## Frontend Dependencies

Node.js packages managed in `frontend/package.json`:
- React 18, React Router v6, Axios, Zustand, react-icons, framer-motion
- Firebase 10 (auth)
- Vite 4, @vitejs/plugin-react
- TailwindCSS v4, @tailwindcss/postcss, autoprefixer

## Backend Dependencies

Python packages: fastapi, uvicorn, python-dotenv, requests

## Environment Variables

- `VITE_FIREBASE_API_KEY` — Firebase auth (Replit secret, used in frontend)
- `GROQ_API_KEY` — for Groq LLM API (backend .env)
- `FISH_AUDIO_API_KEY` — for voice TTS (backend .env)
- `ELEVENLABS_API_KEY` — optional voice API (backend .env)

## AI Modes

- Chat, Command, Goal Planning, Analytics, Trading
- 12-layer architecture: Intent → Planning → Execution → Reflection → Learning
