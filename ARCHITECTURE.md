# Jarvis AI - Phase 1 Architecture

## System Overview

Jarvis is built as a modular, production-ready Windows desktop AI assistant with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│           User Interface Layer                       │
│  (PyQt6 GUI / CLI / Voice / System Tray)           │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│      Message Queue & Threading Manager               │
│  (Async, non-blocking, priority-based)              │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│         Core Processing Engine                       │
│  ┌─────────────────────────────────────────────┐    │
│  │  Command Engine (Routing & Execution)       │    │
│  │  Voice Manager (STT + TTS)                  │    │
│  │  Configuration Manager                      │    │
│  │  Logger (Centralized)                       │    │
│  └─────────────────────────────────────────────┘    │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│        Application Layer                             │
│  ┌─────────────────────────────────────────────┐    │
│  │  Voice Module (STT, TTS)                    │    │
│  │  Actions (Browser, Files, System)           │    │
│  │  Brain (Memory, Profile)                    │    │
│  │  External APIs (OpenAI, Google, Groq)       │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

## Core Modules

### 1. **core/logger.py**
- Centralized logging system
- File + console output
- Rotating log files
- Singleton pattern

```python
from core import logger
logger.info("System starting")
logger.error("Something went wrong")
```

### 2. **core/message_queue.py**
- Thread-safe command queue
- Priority-based execution
- Prevents UI freezing
- Background processor thread

```python
from core import message_queue, CommandPriority
message_queue.put_text("search for python", priority=CommandPriority.HIGH)
message_queue.start_processor(command_handler)
```

### 3. **core/config.py**
- Centralized configuration
- Environment variable loading
- Config persistence
- Dataclass-based settings

```python
from core import config
config.voice.rate = 150
config.save()
```

### 4. **core/command_engine.py**
- Smart command routing
- Keyword matching
- Handler registry
- Fallback support

```python
from core import command_engine
command_engine.register(
    keywords=["search"],
    handler=search_handler,
    description="Search the web"
)
result = command_engine.execute("search for cats")
```

### 5. **core/voice_manager.py**
- Coordinates voice operations
- State management
- Async listening + speaking
- Threading-safe

```python
from core import voice_manager, VoiceState
voice_manager.listen_async(on_result, on_error)
voice_manager.speak_async("Hello world")
```

### 6. **voice/speech_to_text.py**
- Google Speech Recognition (online)
- PocketSphinx (offline fallback)
- Async + blocking modes
- Error handling + timeouts

```python
from voice import stt
text = stt.listen_once()
stt.listen_async(on_result, on_error)
```

### 7. **voice/text_to_speech.py**
- pyttsx3 (offline)
- ElevenLabs (online, natural voice)
- Async + blocking modes
- Configurable rate + volume

```python
from voice import tts
tts.speak("Hello world")
tts.speak_async("Goodbye", on_complete=callback)
```

## Threading Model

### No Blocking UI
All heavy operations run in background threads:

```
Main Thread (UI/CLI)
    │
    ├─ Listen to user input
    │
    └─ Queue Command → Message Queue
                           │
                      Processor Thread (core/message_queue.py)
                           │
                           ├─ Get Command
                           │
                           ├─ Route via Command Engine
                           │
                           ├─ Execute Handler
                           │
                           └─ Callback to UI (result)

Voice Thread (voice/speech_to_text.py)
    └─ Listen for speech
       └─ Call callback with result

TTS Thread (voice/text_to_speech.py)
    └─ Synthesize speech
       └─ Play audio
```

## Command Execution Flow

```
User Input ("search for AI")
    ↓
Message Queue (PRIORITY: NORMAL)
    ↓
Command Engine Router
    │
    ├─ Keyword Match? "search" → Search Handler ✓
    │  │
    │  └─ Handler Execution
    │     ├─ Parse query: "AI"
    │     ├─ Call browser.search_google("AI")
    │     └─ Return result: "Searching for AI..."
    │
    ├─ No match? → Fallback Handler (if set)
    │
    └─ Still no match? → "Command not recognized"
```

## Error Handling Strategy

### Graceful Degradation
1. **Preferred method fails** → Try fallback
2. **All methods fail** → Log error + return user-friendly message
3. **Critical error** → Don't crash, notify user

Example (STT):
```
Try: Google Speech Recognition
  │
  ├─ Success? → Return text
  │
  └─ Fail? (network error)
      │
      └─ Try: PocketSphinx (offline)
          │
          ├─ Success? → Return text
          │
          └─ Fail?
              │
              └─ Return: "Sorry, I couldn't understand you."
                 (Don't crash)
```

## Configuration System

### Config File: `jarvis_config.json`
```json
{
  "voice": {
    "engine": "pyttsx3",
    "rate": 150,
    "volume": 0.9,
    "language": "en-US",
    "use_offline": true,
    "timeout_secs": 10.0
  },
  "wake_word": {
    "enabled": false,
    "keyword": "jarvis",
    "sensitivity": 0.5,
    "model_type": "pvporcupine"
  },
  "ui": {
    "theme": "dark",
    "floating_mode": true,
    "start_minimized": true,
    "show_waveform": true,
    "auto_hide_delay": 5000
  },
  "command": {
    "safe_mode": true,
    "max_retries": 3,
    "timeout_secs": 30.0,
    "enable_code_execution": false
  }
}
```

### Environment Variables
```
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
GROQ_API_KEY=...
ELEVENLABS_API_KEY=...
```

## Phase 1 Deliverables ✅

- [x] Centralized logging
- [x] Thread-safe message queue
- [x] Smart command engine
- [x] Configuration system
- [x] Voice manager
- [x] Speech-to-text (online + offline)
- [x] Text-to-speech (multiple engines)
- [x] Main entry point (CLI)

## Testing Phase 1

```bash
# Test 1: Run interactive CLI
python jarvis_main.py

# Test 2: Try built-in commands
You: help
Jarvis: Available commands...

You: briefing
Jarvis: Good morning! It's Monday, April 19, 2024...

You: status
Jarvis: ✓ Jarvis is running normally...

# Test 3: Check logs
cat logs/jarvis_20240419.log

# Check system state
You: help
You: exit
```

## Next Steps (Phase 2)

- [ ] Integration with existing AI providers (OpenAI, Google, Groq)
- [ ] Better command handlers
- [ ] Voice interaction (voice in → voice out)
- [ ] Continuous listening mode
- [ ] Error recovery + auto-restart

---

**Status**: Phase 1 Complete ✅  
**Current Version**: 1.0.0-Phase1  
**Build Date**: April 19, 2024
