# Airis AI Assistant

Iron Man–style AI assistant: 12-layer brain, voice in/out, bilingual (English + Telugu), PC control, Indian stock trading, self-improvement, wake-word activation, voice cloning.

## Architecture

- **Frontend**: React + Vite (`frontend/`) on port 5000 — inline styles, full light theme
- **Backend**: Python HTTP server (`backend/dashboard_api.py`) on port 8000
- Vite proxy: `/api` → `localhost:8000`
- **Auth**: Firebase Authentication (Google, GitHub, Email/Password, Anonymous/Guest) via `frontend/src/firebase.js`
- **Routing**: React Router v6 — `/` landing, `/login` auth, `/app` protected main app, `/trading` full trading dashboard, `/download` platform download page
- **Desktop**: Tauri wrapper (`frontend/src-tauri/`) — builds native Windows/Mac/Linux app (`npm run tauri:build`)
- **Mobile**: Expo/React Native app (`mobile-app/`) — iOS & Android, connects to backend via `/mobile/chat`

## Design System

- Background: `#F5F4F2`
- Primary blue: `#437DFD`
- Secondary blue: `#2C76FF`
- Accent coral: `#FD5B5D`
- Success green: `#00C48C`
- Dark: `#0C0C0C`
- Muted: `#888` / `#aaa`
- Card: `#fff` with `rgba(0,0,0,0.07-0.08)` border
- Font: DM Sans (imported in index.css)
- All inline styles, no Tailwind usage

## Settings — 9 tabs (full light theme)

AI Engine · Voice & Speech · Language · Wake Word · Voice Clone · System Prompt · Notifications · Appearance · All API Keys

## Trading Page (`/trading`) — Full standalone dashboard

**Route**: `/trading` — accessible without auth (open page), navigated from LandingPage "Open Trading Dashboard" button and back-arrow returns to `/app`.

**Layout**: Left sidebar (230px, live market data) + Main area (4 tabs)

**Tabs**:
1. **AI Assistant** — Chat with Groq-powered trading expert (`/api/trading/chat`), specialized system prompt for Indian market analysis. Sends live market context (indices, movers, portfolio, watchlist) with every message. Quick action chips, stock symbol autocomplete in input.
2. **Portfolio** — Add positions (symbol, qty, buy price), track real-time P&L, average-down calculation on duplicate adds, total invested/current/P&L summary bar, refresh prices button. Persisted in `localStorage` (`airis_tp_portfolio`). Includes a **PortfolioChart** (recharts AreaChart) showing portfolio value over 7d/30d/90d with per-stock stacked breakdown toggle.
3. **Watchlist** — Search and add stocks, live price cards with change%, click to open quote modal, remove button. Auto-refresh every 60s. Persisted in `localStorage` (`airis_tp_watchlist`).
4. **Market** — All indices grid, sector heatmap (colour-coded by change%), full gainers/losers table.

**Quote Modal** — Click any stock anywhere to open modal: full quote card (price, Δ, O/H/L, 52W, Vol, Mkt Cap), "Add to Watchlist" and "Add to Portfolio" buttons.

**Backend**: `POST /api/trading/chat` — specialized trading expert system prompt, accepts `{message, context}`, uses same Groq/Ollama provider chain as main chat.

**Persistence**: Portfolio and watchlist in localStorage (no backend DB needed).

## Trading Panel (Sidebar) — Live Yahoo Finance (yfinance 1.3.0)

**Backend endpoints** (`/api/market/*`):
- `GET /api/market/indices` — NIFTY 50, SENSEX, BANK NIFTY, NIFTY IT, MIDCAP 50, FMCG, AUTO, PHARMA
- `GET /api/market/quote?symbol=RELIANCE` — Full quote (price, change, open/high/low, 52W, market cap)
- `GET /api/market/search?q=tata` — Fuzzy search across 80+ NSE stocks by name/symbol
- `GET /api/market/movers` — Top 6 gainers + top 6 losers from Nifty 50 universe (TATAMOTORS removed — delisted; replaced with EICHERMOT)
- 60-second server-side cache to avoid Yahoo Finance rate limits

**Ticker symbols**: NSE stocks use `.NS` suffix (e.g. `RELIANCE.NS`), indices use `^NSEI`, `^BSESN`, `^NSEBANK`, `^CNXIT`

**Frontend TradingPanel** (`Sidebar.jsx`):
- Index chips: NIFTY + SENSEX in top row, BANK NIFTY + IT in second row
- Search bar: instant client-side filter + click to fetch full quote card
- Tab bar: Watchlist | Gainers | Losers | All Indices
- Watchlist: persisted in localStorage, live prices, add/remove with ★
- Quote card: symbol, company name, price, Δ%, open/high/low/prev, 52W H/L, mkt cap
- Auto-refresh every 60 seconds

## Sidebar Panels (7)

Chat History · Memory · Trading · Reminders · Skills/Capabilities (29) · Analytics · 12-Layer Brain

## ActivityBar — 9 top items + 2 bottom

chat · memory · trading · reminders · skills · analytics · brain · vibe (VibeCoder IDE) · canvas
command · settings

- Portal-based tooltips (fixed positioning via getBoundingClientRect, rendered in document.body)
- Top section scrollable with hidden scrollbar (`scrollbar-width: none`, `.ab-scroll::-webkit-scrollbar{display:none}`)
- User avatar at bottom (shows Firebase user photo/initials, click to sign out)

## VibeCoder (Full IDE — Chat-to-Build)

- Project list stored in `localStorage` (`airis_vp` key)
- File tree with create/rename/delete/upload
- Multi-file editor with tabs
- Live preview iframe (position:absolute)
- Multi-file preview (inlines CSS/JS references)
- Download files
- Key: `airis_vf_{projectId}` for files
- **View modes**: Chat (default), Code, Split, Preview
- **Chat mode**: 340px AI side panel + full live preview — default view (mobile: full-width chat only)
- **Chat-to-create**: No-project screen has direct chat input + quick-build chips (Restaurant, E-commerce, Portfolio, SaaS, Music Player, Todo)
- **AI side panel**: example prompts when empty, quick-action chips after messages (Make it responsive, Add dark mode, Add animations, etc.)
- **System prompt**: Elite full-stack developer instructions — complete files, CDN libs, responsive, modern UI
- `handleSend(overrideMsg?)` — accepts optional message param for chip/example clicks
- `pendingMsgRef` + useEffect tracks chat message to send after project creation

## CanvasBoard

- Drawing canvas: pen, shapes, colors, export PNG
- Accessible from ActivityBar (`canvas` panel)

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
| `/api/clone-voice` | POST | Clone voice via Fish Audio |
| `/api/tts/config` | GET | TTS configuration |

## Running the App

Two workflows:

1. **Start application** — `cd frontend && npm run dev` (port 5000, webview)
2. **Backend API** — `cd backend && python3 dashboard_api.py` (port 8000, console)

## GitHub

- Remote: `https://github.com/saishivasanjeethpaikarao-jpg/ai--assistant`
- GitHub Actions workflow: `.github/workflows/deploy.yml`
- Deploys frontend to GitHub Pages on push to main
- Base path: `/ai--assistant/` (set via `VITE_BASE_PATH` env var in GitHub Actions)
- GitHub Pages URL: `https://saishivasanjeethpaikarao-jpg.github.io/ai--assistant/`
- To enable: go to repo Settings → Pages → Source: GitHub Actions

## Key Files

- `frontend/vite.config.js` — Vite config; `base` from `VITE_BASE_PATH` env (for GitHub Pages)
- `frontend/src/App.jsx` — Main React component; `FULL_PANELS = ['settings','vibe','canvas']`
- `frontend/src/services/api.js` — API client (uses `/api` proxy path)
- `frontend/src/store/useStore.js` — Zustand state store
- `backend/dashboard_api.py` — Python HTTP backend on port 8000
- `backend/system_coordinator.py` — 12-layer AI system coordinator
- `backend/autonomous_executor.py` — Orchestrates all AI layers
- `.github/workflows/deploy.yml` — GitHub Actions for GitHub Pages

## Pages & Auth Flow

- `/` → `LandingPage.jsx` — Light theme landing with holographic sphere
- `/login` → `LoginPage.jsx` — Google, GitHub, email/password + "Continue as Guest"
- `/app` → `ProtectedApp` — main chat interface, requires auth (or guest/anonymous)
- `frontend/src/firebase.js` — Firebase app init; uses `VITE_FIREBASE_API_KEY` env secret
- `frontend/src/contexts/AuthContext.jsx` — auth state, signInAnonymously for guest mode
- `frontend/public/airis-sphere.png` — holographic iridescent sphere logo

## Components

- `ActivityBar.jsx` — Left icon rail (52px), portal tooltips, scrollable, Firebase avatar
- `Sidebar.jsx` — 240px panel (Chat/Memory/Trading/Reminders/Skills/Analytics/Brain)
- `ChatInterface.jsx` — Main chat with file/image/document attachments (paperclip button)
- `AgentTaskView.jsx` — Expandable task progress view with progress bar and step details
- `Settings.jsx` — Full light theme, 9 tabs, card-based layout
- `VibeCoder.jsx` — Full Replit-style IDE with file tree, multi-file editor, live preview
- `CanvasBoard.jsx` — Drawing canvas (pen/shapes/colors/export PNG)
- `StatusBar.jsx` — 26px bottom bar
- `ConversationHistory.jsx` — Right sidebar (272px) for conversation history
- `CommandPalette.jsx` — Fuzzy-search command modal (⌘K)

## Frontend Dependencies

Node.js packages in `frontend/package.json`:
- React 18, React Router v6, Axios, Zustand, react-icons, framer-motion
- Firebase 10 (auth)
- Vite 4, @vitejs/plugin-react

## Backend Dependencies

Python packages: fastapi, uvicorn, python-dotenv, requests

## Environment Variables

- `VITE_FIREBASE_API_KEY` — Firebase auth (Replit secret, used in frontend)
- `VITE_BASE_PATH` — Base path for GitHub Pages builds (e.g. `/ai--assistant/`)
- `GROQ_API_KEY` — for Groq LLM API (backend .env)
- `FISH_AUDIO_API_KEY` — for voice TTS (backend .env)
- `ELEVENLABS_API_KEY` — optional voice API (backend .env)

## AI Modes

- Chat, Command, Goal Planning, Analytics, Trading
- 12-layer architecture: Intent → Planning → Execution → Reflection → Learning
- Default model: `llama-3.3-70b-versatile` (Groq)
