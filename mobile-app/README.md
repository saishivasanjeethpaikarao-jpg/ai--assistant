# Jarvis AI - React Native Mobile App

Mobile app for Jarvis AI Assistant built with React Native and Expo.

## 📱 Features

- ✅ Chat interface with AI
- ✅ Voice input (speech-to-text)
- ✅ Voice output (text-to-speech)
- ✅ Dark theme
- ✅ Connects to Python backend API
- ✅ Cross-platform (iOS, Android)

## 🛠️ Prerequisites

- Node.js 18+
- Expo CLI
- Python backend running on `http://127.0.0.1:8000`

## 🚀 Installation

```bash
cd mobile-app
npm install
```

## 📲 Running the App

### Development

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

### Build for Production

```bash
# Build Android APK
eas build --platform android

# Build iOS IPA
eas build --platform ios
```

## 🔌 Backend Connection

The app connects to your Python backend at `http://127.0.0.1:8000`:

### Required Backend Endpoints

- `POST /mobile/chat` - Chat with AI
- `POST /run` - Execute commands
- `GET /mobile/status` - Check system status

### API Configuration

Edit `App.js` to change API URL:

```javascript
const API_URL = 'http://your-backend-url:8000';
```

## 🎨 Features Explained

### Chat Interface
- Clean message bubbles
- User (blue) vs AI (gray) distinction
- Auto-scroll to latest message
- Loading indicator

### Voice Input
- Tap microphone to start listening
- Tap stop button to stop
- Automatic speech-to-text
- Uses `@react-native-voice`

### Voice Output
- AI responses spoken aloud
- Uses `react-native-tts`
- Configurable language

### Tools Integration
The Python backend has tools for:
- File operations (files.py)
- Browser automation (browser.py)
- App launching (open_app)
- System commands

### Chat Memory
The Python backend has:
- Short-term memory (memory/reminders.py)
- Long-term memory (brain/brain.py)
- Adaptive memory (adaptive_memory.py)

## 📁 Project Structure

```
mobile-app/
├── App.js              # Main app component
├── package.json        # Dependencies
├── app.json           # Expo configuration
└── README.md          # This file
```

## 🔧 Dependencies

- `expo` - React Native framework
- `react-native-voice` - Speech recognition
- `react-native-tts` - Text-to-speech
- `axios` - HTTP client
- `@react-navigation/native` - Navigation

## 🚨 Troubleshooting

### Voice Not Working

Android:
- Ensure `RECORD_AUDIO` permission is granted in app.json
- Check device microphone permissions

iOS:
- Add microphone permission in Info.plist
- Test on physical device (simulator has limited support)

### Backend Connection Failed

- Ensure Python backend is running
- Check API_URL in App.js
- Verify network connectivity
- Check if backend allows CORS

### Build Errors

```bash
# Clear cache
expo start -c

# Reinstall dependencies
rm -rf node_modules
npm install
```

## 📱 Permissions

### Android
- `RECORD_AUDIO` - Voice input
- `INTERNET` - API calls

### iOS
- Microphone access (auto-added by Expo)

## 🚀 Deployment

### Google Play Store

1. Build APK with EAS
2. Create Google Play Developer account
3. Upload APK to Play Console
4. Fill store listing
5. Submit for review

### Apple App Store

1. Build IPA with EAS
2. Create Apple Developer account
3. Upload IPA to App Store Connect
4. Fill store listing
5. Submit for review

## 🔜 Future Enhancements

- [ ] Add push notifications
- [ ] Implement chat history persistence
- [ ] Add file upload/download
- [ ] Implement offline mode
- [ ] Add biometric authentication
- [ ] Create widget support

## 📄 License

MIT
