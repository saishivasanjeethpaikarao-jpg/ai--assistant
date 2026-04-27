# Personal AI Assistant

A Windows-based Python assistant with voice triggers, popup chat, file handling, PowerShell execution, browser search, and multi-provider AI fallback.

**📚 Documentation**: See [FEATURES.md](FEATURES.md) for complete feature list and [ARCHITECTURE.md](ARCHITECTURE.md) for system design.

## Quick Start

1. Install dependencies:
   ```powershell
   python -m pip install -r requirements.txt
   ```
2. Copy `.env.template` to `.env` and fill in your provider keys.
   - `FIREBASE_API_KEY` is required for sign in / sign up.
   - If you want guest mode, you can skip Firebase login and continue as Guest.
   - Guest mode uses ephemeral memory and reminders that do not persist after logout or app restart.
3. Start the assistant CLI (optional):
   ```powershell
   python assistant.py
   ```
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
