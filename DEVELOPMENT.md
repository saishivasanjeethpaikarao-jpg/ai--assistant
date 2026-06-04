# 🚀 AIRIS - AI Assistant Setup & Build Guide

## Prerequisites

- **Node.js** 18.x or higher
- **Python** 3.9+
- **Rust** (for desktop app builds)
- **Git**

## Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/yourusername/ai--assistant-pr1.git
cd ai--assistant-pr1

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
pip install -r backend/requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# LLM Providers
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.3-70b-versatile
CLAUDE_API_KEY=your_claude_key
OPENAI_API_KEY=your_openai_key

# Voice Services
FISH_AUDIO_API_KEY=your_fish_audio_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# Firebase
FIREBASE_API_KEY=your_firebase_key
FIREBASE_PROJECT_ID=your_project_id

# Optional
DEBUG=false
LOG_LEVEL=info
```

### 3. Start Development Servers

**Terminal 1 - Backend API:**
```bash
cd backend
python main.py          # Starts on http://localhost:8000
```

**Terminal 2 - Frontend (Vite Dev Server):**
```bash
cd frontend
npm run dev            # Starts on http://localhost:5173
```

**Terminal 3 - Voice Assistant (Optional):**
```bash
cd backend
python voice_assistant.py
```

### 4. Access the Application

- **Web UI:** http://localhost:5173
- **API Docs:** http://localhost:8000/docs
- **Settings:** http://localhost:5173/#/settings

---

## Building Desktop Apps

### Windows (Tauri)

```bash
# Install Rust if not already installed
rustup install stable

# Build
cd src-tauri
cargo tauri build

# Output: src-tauri/target/release/AIRIS.exe
```

### macOS (Tauri)

```bash
# Install system dependencies
xcode-select --install

# Build
cd src-tauri
cargo tauri build

# Output: src-tauri/target/release/bundle/macos/AIRIS.app
```

### Linux (Tauri)

```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get install -y libssl-dev libgtk-3-dev libayatana-appindicator3-dev

# Build
cd src-tauri
cargo tauri build

# Output: src-tauri/target/release/airis
```

---

## GitHub Actions Workflows

This project includes automated CI/CD pipelines:

### Build & Release
- Triggers on push to `main` or tag creation
- Builds desktop apps for Windows, macOS, Linux
- Creates Docker images
- Publishes GitHub releases

### Test & Quality
- Runs on every pull request
- Python lint & tests
- JavaScript tests
- Security scanning

### Deployment
- Auto-deploys to Render & Netlify on push to main
- Publishes Docker images on version tags

---

## Project Structure

```
.
├── frontend/           # React + Vite UI
│   ├── src/
│   ├── vite.config.js
│   └── package.json
├── backend/            # Python FastAPI server
│   ├── main.py
│   ├── dashboard_api.py
│   ├── system_coordinator.py
│   ├── voice_assistant.py
│   ├── requirements.txt
│   └── ...
├── src-tauri/          # Tauri desktop app (Rust)
│   ├── src/main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── .github/
│   └── workflows/      # CI/CD pipelines
└── ...
```

---

## API Endpoints

### Core
- `POST /request` - Main chat/command endpoint
- `GET /health` - System health check
- `GET /api/capabilities` - List all features
- `GET /api/system/layers` - Show 12-layer AI system status

### Market Data
- `GET /market/indices` - Stock indices
- `GET /market/quote?symbol=SYMBOL` - Stock quote
- `GET /market/search?q=QUERY` - Search stocks
- `GET /market/movers` - Market gainers/losers
- `GET /market/history?symbol=SYMBOL&period=30d` - Historical data

### Trading
- `GET /trading/portfolio` - Get user portfolio
- `POST /trading/portfolio/add` - Add stock
- `POST /trading/portfolio/remove` - Remove stock
- `POST /trading/chat` - Trading AI chat

### Voice
- `POST /voice/clone` - Clone voice from audio
- `POST /tts` - Text-to-speech

### Settings
- `GET /api/settings` - Get all settings
- `POST /api/settings` - Save settings
- `GET /api/analytics` - Usage analytics

---

## Troubleshooting

### pyaudio Installation Issues (Voice)
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

### Tauri Build Issues
```bash
# Clear cache and rebuild
cargo clean
cargo tauri build
```

### API Connection Issues
- Ensure backend is running: `http://localhost:8000/health`
- Check CORS settings in `backend/dashboard_api.py`
- Verify API key configuration in Settings

---

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes & test locally
3. Commit: `git commit -am 'Add feature'`
4. Push: `git push origin feature/my-feature`
5. Create Pull Request

---

## Deployment

### Render.com
```bash
git push main
# Auto-deploys via GitHub Actions
```

### Docker
```bash
docker build -f backend/Dockerfile -t airis:latest .
docker run -p 8000:8000 airis:latest
```

### Netlify
```bash
# Frontend automatically deploys on push to main
```

---

## Performance Tips

1. **Backend**: Use Groq API (fastest LLM provider)
2. **Voice**: Enable Fish Audio for premium voices
3. **Memory**: Limit adaptive memory to 1000 items
4. **Cache**: Market data cached for 60 seconds

---

## Support

- 📖 [Documentation](https://github.com/yourusername/ai--assistant-pr1/wiki)
- 🐛 [Issues](https://github.com/yourusername/ai--assistant-pr1/issues)
- 💬 [Discussions](https://github.com/yourusername/ai--assistant-pr1/discussions)

---

**Made with ❤️ by AIRIS Team**
