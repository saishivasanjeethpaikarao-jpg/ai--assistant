# AIRIS — AI Personal Assistant

A personal AI assistant with a 12-layer autonomous intelligence system,
multi-provider LLM routing, voice I/O, and trading research tools.

AIRIS is delivered as:
- A **React + Tauri desktop app** (Windows / macOS / Linux)
- A **React Native (Expo) mobile app** (iOS / Android)
- A **Python backend** with a REST API and a dashboard frontend
- A **serverless web build** (Netlify)

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/yourusername/ai--assistant-pr1.git
cd ai--assistant-pr1

# Frontend
cd frontend && npm install && cd ..

# Backend
cd backend && pip install -r requirements.txt && cd ..
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# edit backend/.env and add at least one provider key (e.g. GROQ_API_KEY)
```

### 3. Run in dev

```bash
# Terminal 1 — backend (FastAPI / stdlib HTTP, port 8000)
python backend/dashboard_api.py
# or
uvicorn backend.api_server:app --reload --port 8000

# Terminal 2 — frontend (Vite, port 5173)
cd frontend
npm run dev
```

Open <http://localhost:5173>. The frontend talks to the backend on
<http://localhost:8000>.

### 4. Mobile app (optional)

```bash
cd mobile-app
cp .env.example .env       # set EXPO_PUBLIC_API_URL
npm install
npm run android            # or `npm run ios` on macOS
```

## Features

- **Multi-mode chat**: chat, commands, goals, analytics, trading
- **12-layer AI system**: intent detection → planning → execution → reflection → memory
- **Multi-provider LLM**: Groq, OpenAI, Anthropic, Gemini, NVIDIA NIM,
  Mistral, Together, Ollama (local fallback)
- **Voice I/O**: STT via `@react-native-voice` (mobile) and Web Speech
  (web); TTS via Fish Audio, ElevenLabs, or `expo-speech`
- **Trading research**: NSE / BSE symbols, options strategies, market
  summary, watchlist, signals
- **Adaptive memory**: short-term reminders and long-term brain with
  learned strategies
- **Self-improve (opt-in)**: gated behind `AIRIS_SELF_IMPROVE_ALLOW=1`
  and `SELF_IMPROVE_AUTO_APPLY=False` (default)

## Project layout

```
.
├── backend/                # Python backend
│   ├── dashboard_api.py    # stdlib HTTP server (port 8000, primary)
│   ├── api_server.py       # FastAPI server (port 8000, alt)
│   ├── api_server_minimal.py
│   ├── app_enhanced.py
│   ├── main.py             # FastAPI entry (port 8000)
│   ├── orchestrator_v2.py  # 12-layer orchestrator
│   ├── ai_switcher.py      # Provider router + fallback
│   ├── trading/            # Trading analysis
│   ├── voice/              # TTS / STT modules
│   ├── memory/             # Adaptive memory, reminders
│   ├── tools/              # PowerShell, files, browser
│   ├── self_improve/       # Patch generator / applier (opt-in)
│   └── cors_allowlist.py   # CORS origin list
│
├── frontend/               # React + Vite + Tauri
│   ├── src/
│   │   ├── components/     # ChatInterface, FloatingPanel, etc.
│   │   ├── services/       # api.js, voice.js
│   │   ├── store/          # Zustand
│   │   └── App.jsx
│   ├── src-tauri/          # Tauri (Rust) shell, v1
│   ├── vite.config.js
│   └── package.json
│
├── mobile-app/             # React Native (Expo) app
│   ├── App.js              # Chat + voice UI
│   ├── app.json
│   ├── package.json
│   └── .env.example
│
├── web-deploy/             # Static site for Netlify
│   ├── frontend/           # Plain HTML/CSS/JS
│   └── netlify/functions/chat.js
│
├── .github/workflows/      # CI/CD
│   ├── build-and-release.yml
│   ├── build-desktop.yml
│   ├── build-mobile.yml
│   ├── deploy.yml
│   └── test-quality.yml
│
├── .env.example            # Repo-root env template
├── backend/.env.example    # Backend env template
├── mobile-app/.env.example # Mobile env template
├── README.md
├── DEVELOPMENT.md          # Setup, build, troubleshooting
└── ROADMAP.md              # Audit findings and phased plan
```

## API

The backend exposes its endpoints on port 8000. See `backend/dashboard_api.py`
and `backend/api_server.py` for the full list. The most-used routes:

| Endpoint             | Method | Purpose                       |
| -------------------- | ------ | ----------------------------- |
| `/`                  | GET    | Health check                  |
| `/mobile/status`     | GET    | Mobile app capabilities       |
| `/mobile/chat`       | POST   | Mobile chat (tolerant shape)  |
| `/api/chat`          | POST   | Web dashboard chat            |
| `/api/system/status` | GET    | System status                 |
| `/api/system/layers` | GET    | 12-layer system status        |
| `/api/capabilities`  | GET    | Feature list                  |
| `/api/analytics`     | GET    | Usage analytics               |
| `/voice/synthesize`  | POST   | Premium TTS                   |
| `/trading/signal`    | POST   | Stock trading signal          |

The mobile app accepts both `{reply, success}` and `{response, status}`
response shapes for `/mobile/chat`.

## Configuration

All configuration is via environment variables. Templates are at:
- `backend/.env.example` (Python backend)
- `mobile-app/.env.example` (Expo, only `EXPO_PUBLIC_*` vars)
- `.env.example` (repo root, copy of the backend one)

Key variables:

- `GROQ_API_KEY` — recommended free LLM provider
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `NVIDIA_NIM_API_KEY`, `MISTRAL_API_KEY`, `TOGETHER_API_KEY`
- `OLLAMA_URL` — local fallback when cloud providers fail
- `FISH_AUDIO_API_KEY`, `ELEVENLABS_API_KEY` — premium TTS
- `FIREBASE_*` — optional cloud auth
- `AIRIS_SAFE_MODE` — `1` (default) requires confirmation for destructive actions
- `AIRIS_SELF_IMPROVE_ALLOW` — `0` (default) disables self-apply
- `AIRIS_PORT` — backend port (default 8000)

## Building

### Desktop (Tauri)

```bash
cd frontend
npm install
npm run tauri:build
# Output: frontend/src-tauri/target/release/bundle/{msi,deb,appimage,...}
```

The Tauri v1 source lives in `frontend/src-tauri/`. The repo-root
`src-tauri/` directory that some files reference is unused and ignored.

### Mobile (Expo / EAS)

```bash
cd mobile-app
npm install
eas build --platform android    # or ios
# APK is uploaded to Expo; download via `eas build:list`
```

### Web (Netlify)

```bash
cd web-deploy
netlify deploy --prod
```

The web build uses Netlify Functions for the chat backend
(`web-deploy/netlify/functions/chat.js`).

## CI/CD

GitHub Actions workflows under `.github/workflows/`:

- **build-and-release.yml** — desktop Tauri builds for Windows, macOS,
  Linux; uploads to GitHub Releases on tag push
- **build-desktop.yml** — alternative desktop workflow
- **build-mobile.yml** — Android APK via EAS
- **deploy.yml** — backend (Render) + frontend (Netlify) on push to main
- **test-quality.yml** — flake8, bandit, pytest, eslint, frontend build

## Security

- CORS is restricted to an allowlist (`backend/cors_allowlist.py`).
  The default list includes `localhost` and `127.0.0.1` on dev ports.
- Self-improve is opt-in and refuses to edit files outside an explicit
  allowlist.
- PowerShell commands are sanitized and run with confirmation in safe
  mode.
- Tauri CSP is enabled in `frontend/src-tauri/tauri.conf.json`.
- API keys entered in the browser are stored in `localStorage`. The
  recommended path is to set them on the backend instead.

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for:
- Full setup instructions
- Building desktop / mobile / web targets
- Tauri configuration
- Troubleshooting (Tauri, pyaudio, mobile voice, CORS)
- Deployment to Render, Netlify, and Docker

## License

MIT
