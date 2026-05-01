# AI Assistant - Web Deploy

A simple, working AI assistant that can be deployed as a website and converted to an installable app.

## 🚀 Quick Start

### Prerequisites
- OpenAI API key
- Netlify account (free)

### Deployment Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Netlify**
   - Go to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Select this folder

3. **Configure Build Settings**
   - Build command: **leave empty**
   - Publish directory: `frontend`
   - Functions directory: `netlify/functions`

4. **Add Environment Variable**
   - Go to Site settings → Environment variables
   - Add: `OPENAI_API_KEY` = your OpenAI API key

5. **Deploy**
   - Netlify will automatically deploy
   - Your site will be live at `https://your-site-name.netlify.app`

## 📱 Convert to App (PWA)

Using [PWABuilder](https://www.pwabuilder.com/):

1. Deploy your site first (step above)
2. Open PWABuilder
3. Paste your Netlify URL
4. Click "Generate"
5. Download APK for Android or IPA for iOS

## 📁 Project Structure

```
web-deploy/
│
├── frontend/
│   ├── index.html      # Chat UI
│   ├── style.css       # Dark theme styling
│   └── script.js       # Chat logic
│
├── netlify/
│   └── functions/
│       └── chat.js     # OpenAI serverless function
│
├── netlify.toml        # Netlify configuration
└── README.md           # This file
```

## 🔧 How It Works

1. **Frontend** (`frontend/`)
   - Simple HTML/CSS/JS chat interface
   - Sends messages to Netlify function
   - Displays AI responses

2. **Backend** (`netlify/functions/chat.js`)
   - Serverless function on Netlify
   - Receives message from frontend
   - Calls OpenAI API
   - Returns AI response

3. **Configuration** (`netlify.toml`)
   - Tells Netlify where to find frontend and functions
   - Handles routing

## 🎨 Features

- ✅ Real AI responses (OpenAI GPT-4o-mini)
- ✅ Dark theme
- ✅ Mobile responsive
- ✅ Enter key to send
- ✅ Error handling
- ✅ Deployable as website
- ✅ Convertible to installable app

## 🔑 Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Create new API key
4. Copy the key (starts with `sk-...`)
5. Add to Netlify environment variables

## 🚧 Current Limitations

- ❌ No chat memory (each message is independent)
- ❌ No voice input/output
- ❌ No multi-agent AI
- ❌ No automation tools
- ❌ No file access

## 🚀 Next Upgrades

To make this a full-featured assistant:

1. **Add Chat Memory**
   - Store conversation history
   - Send previous messages to AI
   - Use database (Supabase, Firebase)

2. **Add Voice**
   - Web Speech API for input
   - Text-to-speech for output
   - Microphone button in UI

3. **Add Tools**
   - Browser automation
   - File access
   - System commands

4. **Convert to React Native**
   - Build native mobile app
   - Better performance
   - Native features

## 📝 Environment Variables

Required:
- `OPENAI_API_KEY` - Your OpenAI API key

## 🐛 Troubleshooting

### "Error: No response from AI"
- Check OPENAI_API_KEY is set in Netlify
- Verify API key is valid
- Check OpenAI API status

### "405 Method not allowed"
- Ensure you're using POST request
- Check netlify/functions/chat.js

### Deployment fails
- Verify netlify.toml configuration
- Check publish directory is set to `frontend`
- Ensure functions directory is set to `netlify/functions`

## 📄 License

MIT

## 🤝 Contributing

This is a simple starter. Feel free to extend it!
