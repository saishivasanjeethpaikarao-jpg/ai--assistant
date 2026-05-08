# 🤖 JARVIS - AI Personal Assistant System

> **A professional-grade AI personal assistant with a 12-layer autonomous intelligence system, modern dashboard UI, and serverless deployment.**

**JARVIS** is not just a chatbot—it's a complete personal AI assistant inspired by Iron Man's JARVIS system, featuring multi-mode operation, adaptive learning, and intelligent decision-making.

## 🎯 **Quick Start**

### Prerequisites
- Python 3.13+
- Virtual environment (`.venv/`)

### Launch JARVIS (2 terminals)

**Terminal 1 - Backend AI:**
```bash
python backend/dashboard_api.py
# Starts on http://localhost:5000
```

**Terminal 2 - Frontend Server:**
```bash
python frontend_server.py  
# Starts on http://localhost:8080
```

### Access Dashboard
```
Open browser: http://localhost:8080
```

## 🎨 **Features**

✅ **Modern Dashboard** - Professional dark theme with real-time stats  
✅ **Multi-Mode Operation** - Chat, Commands, Goals, Analytics, Trading  
✅ **12-Layer AI System** - Intent detection → Planning → Execution → Learning  
✅ **Adaptive Memory** - Learns preferences, strategies, and patterns  
✅ **Auto Intent Detection** - Classifies requests as COMMAND/GOAL/CHAT  
✅ **Safety Validation** - Validates decisions before action  
✅ **Self-Reflection** - Analyzes outcomes and improves  
✅ **Real-time Analytics** - Task tracking, interaction counts, learnings  
✅ **PWA Ready** - Installable app with offline support  
✅ **Serverless Deploy** - Ready for Netlify deployment  

## 🤖 **Operating Modes**

### 💬 **Chat Mode**
Natural conversation with your AI assistant. Perfect for questions and casual interaction.

### ⚡ **Command Mode**  
Execute system commands and immediate actions. LOW complexity, fast execution.

### 🎯 **Goal Planning Mode**
Strategic planning for complex multi-step tasks. HIGH complexity, comprehensive approach.

### 📊 **Analytics Mode**
Data analysis, metrics, and insights.

### 📈 **Trading Mode**
Stock market analysis and trading recommendations.

## 🧠 **12-Layer Architecture**

1. **Intent Detector** - Classifies input (COMMAND/GOAL/CHAT)
2. **Strategic Planner** - Creates execution plans
3. **Plan Critic** - Validates and improves plans
4. **Execution Engine** - Executes approved actions
5. **Decision Engine** - Makes intelligent decisions
6. **Safety Filter** - Validates for safety
7. **Self-Reflection** - Analyzes outcomes
8. **Adaptive Memory** - Stores learnings
9. **Replanning Engine** - Adjusts if needed
10. **Chat Mode** - Natural conversation
11. **Meta-Improvement** - Improves system
12. **Orchestrator** - Coordinates all layers

## 📊 **Dashboard**

```
┌─ JARVIS ─ 🤖 Online ──────────────────────────────────┐
├─ MODES ──┬─ DASHBOARD ───────────────┬─ SESSION INFO ─┤
│ 💬 Chat  │ AI Layers: 12/12         │ Mode: Chat     │
│ ⚡ Cmd   │ Memory: Active           │ Complexity: LOW│
│ 🎯 Goals │ Today's Stats            │ Intent: CHAT   │
│ 📊 Anal  │ Tasks: 0 | Learn: 0      │ Insights: -    │
│ 📈 Trade ├─ CHAT INTERFACE ──────────┤                │
│          │ [Response] [GOAL-HIGH]   │                │
│ 📋Brief  │ Tell me something... [S] │                │
│ 🔔 Rem   │ Mode: Goal Planning  ▼   │                │
│ 🧠 Mem   └───────────────────────────┴────────────────┘
```

## 📁 **Project Structure**

```
jarvis-ai/
├── frontend/                   # React-based Cursor IDE-style UI
│   ├── src/
│   │   ├── components/         # ActivityBar, Sidebar, ChatInterface, etc.
│   │   ├── store/              # Zustand state management
│   │   └── App.jsx             # Main app component
│   ├── index.html              # Entry point
│   └── package.json            # Dependencies
│
├── backend/                    # Python backend
│   ├── dashboard_api.py        # HTTP server (port 5000)
│   ├── system_coordinator.py   # 12-layer orchestrator
│   ├── autonomous_executor.py  # Execution engine
│   ├── advanced_system.py      # Layer definitions
│   ├── mode_router.py          # Mode detection
│   ├── main_legacy.py          # Legacy entry point
│   ├── voice/                  # Voice processing (consolidated)
│   │   ├── speech_to_text.py   # STT module
│   │   ├── text_to_speech.py   # TTS module
│   │   ├── voice_pipeline.py  # Voice orchestration
│   │   ├── voice_config.py     # Voice personality config
│   │   ├── premium_voice_manager.py  # Fish Audio/ElevenLabs
│   │   └── fish_audio.py       # Fish Audio integration
│   ├── memory/                 # Memory system (consolidated)
│   │   ├── adaptive_memory.py  # Adaptive learning
│   │   ├── reminders.py        # Reminder system
│   │   └── store.py            # Memory storage
│   ├── tools/                  # JARVIS tools layer
│   │   ├── app_launcher.py     # Launch applications
│   │   ├── web_browser.py      # Browser automation
│   │   ├── file_editor.py      # File operations
│   │   ├── system_control.py   # System controls
│   │   └── trading_tools.py    # Trading integration
│   ├── self_improve/           # Self-improvement system
│   │   ├── logger.py           # Interaction logging
│   │   ├── patch_generator.py  # Patch generation
│   │   └── patch_apply.py      # Patch application
│   └── trading/                # Trading analysis
│
├── mobile-app/                 # React Native mobile app
│   ├── App.js                  # Main mobile app
│   ├── app.json                # Expo config
│   └── package.json            # Mobile dependencies
│
├── web-deploy/                 # Serverless web deployment
│   ├── frontend/               # Simple HTML/CSS/JS
│   ├── netlify/
│   │   └── functions/
│   │       └── chat.js         # Netlify function
│   └── netlify.toml            # Netlify config
│
├── frontend_server.py          # Dev server (port 8080)
└── DEPLOYMENT_GUIDE.md        # Production guide
```

## 🔌 **API Endpoints**

```
POST /api/request
  { "message": "your request" }
  → { "reply": "...", "response": {...} }

GET /api/health
  → { "status": "healthy" }

GET /api/system/status  
  → System info & stats
```

## 🚀 **Deploy to Netlify**

```bash
npm install netlify-cli -g
netlify init
netlify env:set OPENAI_API_KEY your_key
netlify deploy
```

## 🧪 **Testing**

```bash
# Test via API
python -c "
import urllib.request, json
data = json.dumps({'message': 'hello'}).encode()
req = urllib.request.Request('http://localhost:5000/api/request',
  data=data, headers={'Content-Type': 'application/json'}, method='POST')
print(json.loads(urllib.request.urlopen(req).read())['reply'])
"

# Test system
python tests/test_12_layer_system.py
```

## 📚 **Documentation**

- [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) - Technical deep dive
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Production deployment
- [FEATURES.md](FEATURES.md) - Complete feature list

## 🎓 **How It Works**

1. User sends message via dashboard
2. API routes to backend (`/api/request`)
3. **Intent Detector** classifies request
4. **Strategic Planner** creates plan
5. **Execution Engine** runs plan
6. **Self-Reflection** analyzes results
7. **Adaptive Memory** stores learnings
8. Response displayed in dashboard

## ✅ **Status**

| Component | Status |
|-----------|--------|
| Core System | ✅ Ready |
| Dashboard | ✅ Live |
| API Server | ✅ Running |
| Mode Routing | ✅ Active |
| Adaptive Memory | ✅ Learning |
| PWA Support | ✅ Ready |
| Deployment | ✅ Ready |

## 🚀 **Start JARVIS Now**

```bash
# Terminal 1
python backend/dashboard_api.py

# Terminal 2  
python frontend_server.py

# Browser
http://localhost:8080
```

**Welcome to JARVIS. How can I assist you today?** 🤖

## 🧠 The 12 Layers

1. **Intent Detector** - Classifies input type & complexity
2. **Strategic Planner** - Creates optimal execution plans
3. **Plan Critic** - Validates and improves plans
4. **Execution Engine** - Converts steps to commands
5. **Decision Engine** - Chooses best options
6. **Safety Filter** - Validates command safety
7. **Self-Reflection** - Evaluates execution outcomes
8. **Adaptive Memory** - Learns and stores knowledge
9. **Re-Planning Engine** - Recovers from failures
10. **Chat Mode** - Natural conversation
11. **Meta-Improvement** - System optimization
12. **Orchestrator** - Coordinates all layers

## 📊 Complete Workflow

```
User Input
    ↓
[Layer 1] Intent Detection
    ↓
IF COMMAND: Execute → Safety Check → Run
IF GOAL: Plan → Critique → Execute → Safety → Run
IF CHAT: Respond → Learn
    ↓
[Layer 7] Reflect on Results
[Layer 8] Store Learnings
[Layer 9] Replan if Failed
    ↓
Output + Memories Stored
```

## 🧪 Testing

### Run Full Test Suite
   or double-click `run_assistant.bat`.

4. Start the independent desktop UI app:
   ```powershell
   python app.py
   ```
   or double-click `run_app.bat`.

## Packaging and installation

- To build a Windows executable, run:
  ```powershell
  package_windows.bat
  ```
  This installs dependencies and builds from `app.spec` (PyInstaller + Kivy/KivyMD) to create `dist\PersonalAIAssistant.exe`.

- To build a Store-ready MSIX package, run:
  ```powershell
  package_windows_store.bat
  ```
  This creates `dist\PersonalAIAssistant.msix`, and will generate a temporary code-signing certificate if needed.
  Before submitting to the Microsoft Store, update the `Publisher` value in `AppxManifest.xml` to match your Store publisher identity.

- Branding metadata for the EXE is configured in `version_info.txt`.
- Optional app icon: add `assets/app.ico` before building to embed a custom icon.

- To launch the built desktop app:
  ```powershell
  run_desktop_app.bat
  ```

- To install it on your Desktop (folder + shortcut), run:
  ```powershell
  install_desktop_app.bat
  ```
  This also enables auto-start on Windows login.

- To manually enable/disable auto-start:
  ```powershell
  enable_autostart.bat
  disable_autostart.bat
  ```

- To run the app directly on Windows without packaging:
  ```powershell
  run_app.bat
  ```

## App UI

The app is built with KivyMD for a modern cross-platform interface that can run on Windows and be packaged for Android.

- `app.py` launches the KivyMD application UI
- `assistant_core.py` contains the cross-platform assistant backend

## Supported providers

- Gemini
- OpenAI
- Groq
- Ollama local fallback

## Local Ollama Setup

Install Ollama separately on Windows or Android and set `OLLAMA_URL` in your `.env`:

```env
OLLAMA_URL=http://localhost:11434
```

If Ollama is running locally, the assistant will use it automatically when cloud providers are unavailable.

## Firebase Login

This app now supports Firebase authentication for app users.

Add your Firebase config values to `.env`:

```env
FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
```

Then launch the app with:

```powershell
python app.py
```

Login with your email or phone number and password. Phone numbers are supported as a login identifier by mapping them to a Firebase login alias.

## Features

- Voice wake phrases: `hey ai`, `assistant`, `hey 23`
- Clap wake trigger: clap **two times**, then say wake phrase, then speak command
- Commands:
  - `open url https://...`
  - `open <app|file|folder>`
  - `run <PowerShell command>`
  - `guest` (CLI guest mode)
  - `Continue as Guest` (app guest mode)
  - `search <query>`
  - `trading help <market/symbol/timeframe>`
  - `trading help india <symbol/timeframe>`
  - `trade analysis <symbol>`
  - `trade analysis india <symbol>`
  - `analyze market <symbol>`
  - `analyze india market <symbol>`
  - `trading research <topic>`
  - `india trading research <topic>`
  - `trade plan <symbol and strategy>`
  - `india trade plan <symbol and strategy>`
  - `indian options strategy <symbol/index + view>`
  - `options strategy india <symbol/index + view>`
  - `nifty options strategy <view>`
  - `banknifty options strategy <view>`
  - `open tradingview`
  - `open nse`
  - `open bse`
  - `open moneycontrol`
  - `open economic calendar`
  - `create file <path>`
  - `read file <path>`
  - `edit file <path>`
  - `play <song|file>`
  - `git status`
  - `git commit <message>`
  - `power off` / `shutdown pc`
  - `restart pc`
  - `safe mode on` / `safe mode off` / `safe mode status`
  - `remember <key> is <value>`
  - `learn <text>`
  - `recall <key>`
  - `forget <key>`
  - `list memories`
  - `show profile`
  - `set my name to <name>`
  - `what is my name`
  - `what is my <preference>`
  - `set reminder <text> at <time>`
  - `remind me to <text> at <time>`
  - `show reminders`
  - `daily briefing`
  - `clear reminder <text>`
  - `chat`

The assistant now starts a background reminder monitor after login, gives you a daily briefing of active reminders, and sends desktop notifications when reminders are due.

## Brain and memory

The assistant can learn facts and store them persistently in `memory/memory.json`.
Use `remember`, `learn`, and `recall` to teach the assistant and ask it what it knows.

## Jarvis/Siri improvement roadmap

This project is evolving into a Jarvis/Siri-style assistant in phases:

1. Voice persona and app readiness
   - Add a consistent assistant persona and name
   - Use wake-word voice flow with chat UI
   - Keep responses concise and user-focused
2. Personal memory and user profile
   - Save user facts to `memory/memory.json`
   - Recall and forget profile memories
   - Use memory context to improve AI replies
3. Smart skills and automation
   - Open apps, browse the web, create and read files
   - Run safe PowerShell commands and system controls
   - Add reminders, daily briefings, and proactive suggestions
4. App polish and packaging
   - Better UI and voice activity feedback
   - Package as Windows desktop app
   - Add app branding and installer support

## Provider Fallback

The assistant tries providers in this order:
1. Gemini
2. OpenAI
3. Groq
4. Ollama (local fallback)

If cloud providers fail, it automatically switches to the next provider.

## Jarvis-style voice flow

When running the app, the assistant can listen in the background:
1. Double clap to activate
2. Say `hey ai`
3. Speak your command

The assistant gives spoken replies for command results and chat answers.

### Safe mode (recommended)

Safe mode is enabled by default and asks for `yes/no` confirmation before:
- `run <powershell command>`
- `power off` / `shutdown pc`
- `restart pc`

### Self-improve safety whitelist

Self-improve mode can only edit approved core files listed in `assistant_core.py` under `SELF_IMPROVE_ALLOWED_FILES`.
It will refuse any file outside that whitelist.

## Trading assistant mode

The assistant can provide structured trading research and suggestions, including:
- market context and trend
- support/resistance levels
- bullish/bearish/neutral bias with confidence
- setup ideas with entry/stop/target ranges
- risk management guidance

Trading output is educational analysis, not guaranteed financial advice.
