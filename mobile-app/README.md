# AIRIS Mobile App

React Native (Expo) mobile client for the AIRIS AI assistant backend.

## Features

- Chat with the AIRIS backend (`/mobile/chat`)
- Voice input (speech-to-text) via `@react-native-voice/voice`
- Voice output (text-to-speech) via `expo-speech`
- Connection status indicator (calls `/mobile/status`)
- Auto-restart TTS on demand per message
- Dark theme that matches the desktop app
- Cross-platform (iOS, Android, Web)

## Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Python backend running on `http://127.0.0.1:8000`
  - Either `backend/api_server.py` (port 8000, FastAPI) or
  - `backend/dashboard_api.py` (port 8000, stdlib HTTP)

## Installation

```bash
cd mobile-app
npm install
cp .env.example .env       # then edit .env if needed
```

## Running the App

### Development

```bash
# Start Expo dev server
npm start

# Run on Android (emulator or device via USB)
npm run android

# Run on iOS (Mac only, simulator or device)
npm run ios

# Run on web (browser)
npm run web
```

### Build for Production

```bash
# Build Android APK / AAB
eas build --platform android

# Build iOS IPA
eas build --platform ios
```

## Configuration

Set the backend URL in `mobile-app/.env`:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
EXPO_PUBLIC_ENABLE_VOICE=true
```

The default `http://127.0.0.1:8000` works for local development on the
same machine. For physical devices, replace with your machine's LAN IP
(e.g. `http://192.168.1.42:8000`) or your deployed backend URL.

To disable voice features entirely (e.g. backend doesn't support it),
set `EXPO_PUBLIC_ENABLE_VOICE=false`.

## Backend Endpoints Used

| Endpoint             | Method | Purpose                  |
| -------------------- | ------ | ------------------------ |
| `/mobile/status`     | GET    | Health + capabilities    |
| `/mobile/chat`       | POST   | Chat with AIRIS          |
| `/voice/synthesize`  | POST   | Optional premium TTS     |

The mobile app accepts both response shapes:
- `{"reply": "...", "success": true}` (from `dashboard_api.py`)
- `{"response": "...", "status": "success"}` (from `api_server.py`)

## Voice Permissions

### iOS

Edit `app.json` → `ios.infoPlist`:
- `NSMicrophoneUsageDescription` — required for voice input
- `NSSpeechRecognitionUsageDescription` — required for on-device STT

Both are already set in `app.json`.

### Android

Edit `app.json` → `android.permissions`:
- `RECORD_AUDIO` — voice input (already set)
- `INTERNET` — API calls (already set)

## Project Structure

```
mobile-app/
├── App.js                # Main component (chat + voice UI)
├── app.json              # Expo configuration
├── eas.json              # EAS Build configuration
├── package.json          # Dependencies
├── .env.example          # Environment variables template
├── assets/               # Icons, splash, favicon
└── README.md             # This file
```

## Troubleshooting

### "Offline" status

- Check `EXPO_PUBLIC_API_URL` in `.env`
- Make sure the backend is running: `curl http://127.0.0.1:8000/mobile/status`
- If testing on a physical device, use your machine's LAN IP, not `127.0.0.1`
- Ensure the backend has CORS configured for mobile origins

### Voice input doesn't work

- iOS simulator has limited microphone support — test on a real device
- Make sure microphone permission is granted (system Settings → AIRIS)
- On Android, some emulators don't include Google speech services —
  use a device or a Google APIs emulator image

### TTS doesn't speak

- The TTS toggle in the header is on by default
- If you set `EXPO_PUBLIC_ENABLE_VOICE=false` in `.env`, voice is hidden entirely

### Build errors

```bash
# Clear Expo cache
expo start -c

# Reinstall dependencies
rm -rf node_modules
npm install
```

## License

MIT
