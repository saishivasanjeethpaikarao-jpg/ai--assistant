# AIRIS Development Guide

Setup, building, and troubleshooting for the AIRIS AI personal assistant.

## Prerequisites

- **Node.js** 18 or higher (20 recommended)
- **Python** 3.10 or higher
- **Rust** (only for building the Tauri desktop app from source)
- **Git**

For mobile development: Expo CLI and the EAS CLI (optional — Expo Go on a
phone works for quick testing).

## Initial setup

### 1. Clone and install

```bash
git clone https://github.com/yourusername/ai--assistant-pr1.git
cd ai--assistant-pr1
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 3. Install backend dependencies

```bash
cd backend
python -m venv .venv
# Activate the venv first (see below), then:
pip install -r requirements.txt
cd ..
```

**Activate the venv**:
- Windows: `.venv\Scripts\activate`
- macOS / Linux: `source .venv/bin/activate`

### 4. Configure environment

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set at least one provider key. The free
[Groq console](https://console.groq.com) is the fastest way to get started.

## Running in development

The backend runs on port 8000. The frontend dev server runs on port 5173
and proxies API calls to the backend.

**Terminal 1 — backend**:

```bash
# stdlib HTTP server (primary)
python backend/dashboard_api.py

# OR FastAPI
uvicorn backend.api_server:app --reload --port 8000
# or
python backend/main.py
```

**Terminal 2 — frontend**:

```bash
cd frontend
npm run dev
```

Open <http://localhost:5173>.

### Mobile app

```bash
cd mobile-app
cp .env.example .env       # set EXPO_PUBLIC_API_URL
npm install
npm start                  # then press a for Android, i for iOS
```

For physical devices, set `EXPO_PUBLIC_API_URL` to your machine's LAN IP
(for example `http://192.168.1.42:8000`), not `127.0.0.1`.

## Building

### Desktop (Tauri v1)

Tauri builds the desktop app from `frontend/src-tauri/`. The repo-root
`src-tauri/` directory is a leftover from a previous Tauri v2 attempt and
is not used.

```bash
cd frontend
npm install
npm run tauri:build
```

Output paths:

- Windows: `frontend/src-tauri/target/release/bundle/msi/`
- macOS:   `frontend/src-tauri/target/release/bundle/macos/`
- Linux:   `frontend/src-tauri/target/release/bundle/{deb,appimage}/`

For development runs with hot-reload:

```bash
cd frontend
npm run tauri:dev
```

### Mobile (EAS Build)

```bash
cd mobile-app
npm install -g eas-cli
eas login
eas build --platform android    # or ios
```

The build runs on Expo's cloud. Download the resulting APK / IPA via
`eas build:list`.

### Web (Netlify)

```bash
cd web-deploy
npm install -g netlify-cli
netlify init
netlify env:set GROQ_API_KEY your_key_here
netlify deploy --prod
```

The web build uses Netlify Functions
(`web-deploy/netlify/functions/chat.js`) for the chat backend.

## Tauri configuration

Tauri config: `frontend/src-tauri/tauri.conf.json`

Key settings:
- `productName`: `Airis`
- `version`: `3.0.0`
- `identifier`: `com.airis.app`
- `windows[0]`: 1280x860, dark theme, frameless, transparent
- `security.csp`: enabled

The Tauri shell allowlist is locked down to a small set of commands
(powershell, notepad, calc, etc.). Anything not on the allowlist will
fail at runtime.

## API surface

The backend exposes endpoints on port 8000. Common ones:

| Endpoint             | Method | Source            |
| -------------------- | ------ | ----------------- |
| `/`                  | GET    | `dashboard_api.py` / `api_server.py` |
| `/mobile/status`     | GET    | both              |
| `/mobile/chat`       | POST   | both (different response shapes) |
| `/api/chat`          | POST   | dashboard_api     |
| `/api/system/status` | GET    | dashboard_api     |
| `/api/system/layers` | GET    | dashboard_api     |
| `/api/capabilities`  | GET    | dashboard_api     |
| `/api/analytics`     | GET    | dashboard_api     |
| `/api/history`       | GET    | dashboard_api     |
| `/voice/synthesize`  | POST   | api_server        |
| `/trading/signal`    | POST   | api_server        |

`/mobile/chat` returns either `{reply, success}` (dashboard_api) or
`{response, status}` (api_server). Clients should accept both.

## Troubleshooting

### Backend won't start

- Check the venv is activated and dependencies are installed.
- Check `backend/.env` exists and is readable.
- Look at the traceback. `dashboard_api.py` writes the full Python
  traceback to the response on unhandled errors.

### CORS errors from the browser

`backend/cors_allowlist.py` controls the allowed origins. Add the
failing origin to `AIRIS_ALLOWED_ORIGINS` (comma-separated) in
`backend/.env`, or update the default list.

### Frontend can't reach the backend

- Verify the backend is running: `curl http://localhost:8000/`
- `frontend/vite.config.js` proxies `/api` and `/mobile` to port 8000
  in dev. If you changed the backend port, update the proxy.

### Tauri build fails

```bash
# Clear target and rebuild
cd frontend
rm -rf src-tauri/target
npm run tauri:build
```

Linux build hosts need:

```bash
sudo apt-get install -y libssl-dev libgtk-3-dev \
    libayatana-appindicator3-dev librsvg2-dev
```

### pyaudio / voice input fails

```bash
# Windows
pip install pipwin
pipwin install pyaudio

# macOS
brew install portaudio
pip install pyaudio

# Linux
sudo apt-get install portaudio19-dev
pip install pyaudio
```

### Mobile voice doesn't work

- iOS simulator has no microphone — test on a real device.
- Make sure `NSMicrophoneUsageDescription` and
  `NSSpeechRecognitionUsageDescription` are set in `mobile-app/app.json`
  (they are by default).
- On Android, use a Google APIs emulator image (stock emulators lack
  speech recognition).

### Self-improve refuses to apply a patch

Self-improve is opt-in. To allow it:

```env
AIRIS_SELF_IMPROVE_ALLOW=1
SELF_IMPROVE_AUTO_APPLY=False
```

The auto-apply flag is intentionally off by default. Patches generated
by the LLM are validated against a file allowlist before being saved.

## Deployment

### Render (backend)

The repository includes a Render deploy hook workflow. Set
`RENDER_DEPLOY_HOOK_URL` as a GitHub secret; pushing to `main` will
trigger a redeploy.

### Netlify (frontend)

`netlify.toml` at the repo root configures the build. The
`deploy.yml` workflow uses the Netlify CLI to publish on push to `main`.

### Docker

A `backend/Dockerfile` is included. Build and run:

```bash
docker build -f backend/Dockerfile -t airis:latest .
docker run -p 8000:8000 --env-file backend/.env airis:latest
```

## Project conventions

- Backend entry points: `dashboard_api.py` (stdlib, primary) and
  `api_server.py` (FastAPI, alt). Both listen on port 8000.
- Provider routing: `ai_switcher.py` — `with_fallback()` cycles through
  configured providers in priority order and falls back to Ollama.
- State (frontend): Zustand store in `frontend/src/store/useStore.js`.
- Voice: mobile uses `expo-speech` (TTS) and `@react-native-voice/voice`
  (STT). Web falls back to the browser's Web Speech API.

## Performance tips

- Use Groq for the fastest LLM response (free tier).
- Ollama is a fully-local fallback — slower but private.
- Market data is cached for 60 seconds by default in the trading module.
- The adaptive memory layer keeps the most recent 1,000 items by default.
