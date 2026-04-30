# Jarvis AI Assistant - Modern Frontend

A sleek, minimal, and intelligent desktop UI built with React + Tauri.

## 🎨 Design Principles

- **Minimal & Clean**: No clutter, only essential UI elements
- **Dark Theme**: Default dark mode for reduced eye strain
- **Smooth Animations**: Framer Motion for subtle micro-interactions
- **Fast Response**: Optimized for speed and responsiveness
- **Keyboard-First**: Efficient navigation without mouse

## 🚀 Tech Stack

- **React 18** - UI framework
- **Tauri** - Desktop app shell (lightweight alternative to Electron)
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Zustand** - State management
- **React Markdown** - Markdown rendering
- **Axios** - API client

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── FloatingPanel.jsx    # Draggable floating window
│   │   ├── ChatInterface.jsx    # Chat with markdown support
│   │   ├── VoiceWaveform.jsx    # Real-time voice animation
│   │   ├── AgentTaskView.jsx    # Step-by-step execution view
│   │   ├── CommandInput.jsx     # Auto-suggesting command input
│   │   ├── Sidebar.jsx          # Memory, reminders, settings
│   │   └── Toast.jsx            # Notification system
│   ├── store/
│   │   └── useStore.js          # Zustand state management
│   ├── services/
│   │   └── api.js               # API integration
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── src-tauri/                   # Tauri configuration
│   └── tauri.conf.json
├── package.json
├── tailwind.config.js
├── vite.config.js
└── index.html
```

## 🛠️ Installation

### Prerequisites

- Node.js 18+
- Rust (for Tauri)
- Python backend running on `http://127.0.0.1:8000`

### Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Build Tauri app:**
```bash
npm run tauri:build
```

## 🎯 Features

### 1. Floating Assistant Panel
- Draggable floating window
- Expand/collapse states
- Always-on-top option
- Rounded corners, soft shadows

### 2. Chat Interface
- Clean message bubbles
- User vs AI distinction
- Markdown support
- Code block rendering
- Typing animation

### 3. Voice Interaction
- Real-time waveform animation
- Visual feedback for states:
  - Listening (green)
  - Thinking (yellow)
  - Speaking (blue)
- Microphone toggle

### 4. Agent Task View
- Step-by-step execution display
- Status indicators:
  - Pending (clock icon)
  - Running (spinner)
  - Done (checkmark)
  - Failed (X)

### 5. Command Input
- Auto-suggestions
- Command history
- Keyboard navigation (Tab, Arrow keys)
- Quick command execution

### 6. Sidebar
- Memory view
- Reminders
- Settings toggle
- Smooth tab transitions

### 7. Toast Notifications
- Success, error, warning, info types
- Auto-dismiss
- Smooth animations

## 🔌 API Integration

The frontend connects to your Python backend at `http://127.0.0.1:8000`:

### Endpoints Used

- `POST /mobile/chat` - Chat with AI
- `POST /run` - Execute commands
- `POST /trading/signal` - Get trading signals
- `GET /trading/market-summary` - Market overview

## 🎨 Customization

### Colors

Edit `tailwind.config.js` to customize the color scheme:

```javascript
colors: {
  gray: {
    950: '#0a0a0a',  // Background
    900: '#171717',  // Surface
    // ... more shades
  }
}
```

### Animations

Adjust animation speeds in components using Framer Motion:

```javascript
transition={{ duration: 0.2 }}  // Faster
transition={{ duration: 0.5 }}  // Slower
```

## 📱 Keyboard Shortcuts

- `Tab` - Auto-complete suggestions
- `Arrow Up/Down` - Navigate suggestions
- `Enter` - Send message / Execute command
- `Escape` - Close suggestions

## 🚀 Deployment

### Web Version

```bash
npm run build
# Output in /dist
```

### Desktop App (Tauri)

```bash
npm run tauri:build
# Output in /src-tauri/target/release
```

## 🐛 Troubleshooting

### API Connection Issues

If the frontend can't connect to the backend:

1. Ensure Python backend is running: `python api_server.py`
2. Check API URL in `src/services/api.js`
3. Verify CORS settings in `api_server.py`

### Tauri Build Issues

If Tauri build fails:

1. Ensure Rust is installed: `rustc --version`
2. Install Tauri CLI: `npm install -g @tauri-apps/cli`
3. Check system dependencies for your platform

## 📝 Notes

- The UI is designed to be minimal and fast
- All animations use Framer Motion for smooth transitions
- State management uses Zustand for simplicity
- The floating panel can be dragged anywhere on screen
- Voice waveform animates in real-time based on state

## 🎯 Future Enhancements

- [ ] Add voice recognition integration
- [ ] Implement WebSocket for real-time updates
- [ ] Add theme customization
- [ ] Create mobile-responsive design
- [ ] Add keyboard shortcut customization
