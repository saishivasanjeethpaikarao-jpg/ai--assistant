import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://ai-assistant-8r3x.onrender.com';

const axiosInstance = axios.create({
  baseURL: BASE_URL + '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
});

axiosInstance.interceptors.response.use(
  (r) => r.data,
  (e) => { console.error('API Error:', e); throw e }
);

// ── Detect Tauri Desktop ────────────────────────────────────────────────
export const isTauri = () => {
  return typeof window !== 'undefined' && window.__TAURI__ !== undefined;
};

// ── Single Source of Truth: localStorage ─────────────────────────────────
const SETTINGS_KEY = 'airis_settings';
const PREFS_KEY = 'airis_preferences';
const HISTORY_KEY = 'airis_chat_history';

const localSettings = {
  get: () => {
    try {
      const s = localStorage.getItem(SETTINGS_KEY);
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  },
  set: (data) => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(data)); } catch {}
  },
  getPrefs: () => {
    try {
      const p = localStorage.getItem(PREFS_KEY);
      return p ? JSON.parse(p) : {};
    } catch { return {}; }
  },
  setPrefs: (data) => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(data)); } catch {}
  },
  getHistory: () => {
    try {
      const h = localStorage.getItem(HISTORY_KEY);
      return h ? JSON.parse(h) : [];
    } catch { return []; }
  },
  setHistory: (data) => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(data)); } catch {}
  },
};

const bool = (v) => typeof v === 'string' ? v.trim().length > 0 : Boolean(v);

const buildSettingsResponse = (settings, preferences) => {
  const s = { ...settings };
  s.groq_api_key_set = bool(s.groq_api_key);
  s.fish_audio_api_key_set = bool(s.fish_audio_api_key);
  s.elevenlabs_api_key_set = bool(s.elevenlabs_api_key);
  s.firebase_api_key_set = bool(s.firebase_api_key);

  const providers = [];
  if (s.groq_api_key) {
    providers.push({
      name: 'Groq',
      model: s.groq_model || 'llama-3.3-70b-versatile',
      enabled: true,
      base_url: 'https://api.groq.com/openai/v1',
    });
  }

  return { success: true, settings: s, preferences, providers };
};

// ── Tauri Shell: Open Apps on Desktop ────────────────────────────────────
const tauriShell = {
  openApp: async (appName) => {
    if (!isTauri()) return { success: false, error: 'Not running in Tauri' };
    try {
      const { Command } = window.__TAURI__.shell;

      const commands = {
        chrome: ['cmd', ['/c', 'start', 'chrome']],
        'google chrome': ['cmd', ['/c', 'start', 'chrome']],
        vscode: ['cmd', ['/c', 'start', 'code']],
        'vs code': ['cmd', ['/c', 'start', 'code']],
        'visual studio code': ['cmd', ['/c', 'start', 'code']],
        notepad: ['cmd', ['/c', 'start', 'notepad']],
        explorer: ['cmd', ['/c', 'start', 'explorer']],
        terminal: ['cmd', ['/c', 'start', 'cmd']],
        powershell: ['cmd', ['/c', 'start', 'powershell']],
        calculator: ['cmd', ['/c', 'start', 'calc']],
        settings: ['cmd', ['/c', 'start', 'ms-settings:']],
        edge: ['cmd', ['/c', 'start', 'msedge']],
        firefox: ['cmd', ['/c', 'start', 'firefox']],
      };

      const entry = commands[appName.toLowerCase()];
      if (!entry) return { success: false, error: `Unknown app: ${appName}` };

      const [program, args] = entry;
      await new Command(program, args).execute();
      return { success: true, message: `Opened ${appName}` };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },
};

// ── Settings API (local-first, backend fallback) ────────────────────────
const settingsApi = {
  getSettings: async () => {
    const localS = localSettings.get();
    const localP = localSettings.getPrefs();

    if (localS && Object.keys(localS).length > 0) {
      axiosInstance.get('/settings').then((res) => {
        if (res?.settings) {
          const merged = { ...res.settings, ...localS };
          localSettings.set(merged);
          if (res.preferences) localSettings.setPrefs({ ...res.preferences, ...localP });
        }
      }).catch(() => {});
      return buildSettingsResponse(localS, localP);
    }

    try {
      const res = await axiosInstance.get('/settings');
      if (res?.settings) {
        localSettings.set(res.settings);
        if (res.preferences) localSettings.setPrefs(res.preferences);
        return res;
      }
    } catch {}

    return buildSettingsResponse({}, {});
  },

  saveSettings: async (settings, preferences) => {
    localSettings.set(settings);
    if (preferences) localSettings.setPrefs(preferences);
    axiosInstance.post('/settings', { settings, preferences }).catch(() => {});
    return { success: true };
  },
};

// ── Natural System Prompt ────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Airis, an Iron Man-style AI assistant. Be helpful, concise, and natural.

Rules:
- Talk naturally like a smart assistant. Don't introduce yourself on every message.
- Only say your name if someone asks "what is your name" or "who are you"
- Only mention your creator if someone asks "who made you" or "who created you" - then say Sai Shiva Sanjeeth
- Never say "Namaste" unless user speaks in Hindi/Telugu
- Never repeat greetings after the first message
- Be brief and direct. Don't use bullet points for simple answers.
- Current year is 2026. You have real-time knowledge via Groq API.
- For "open [app]" on web: say "App launching only works on the Airis desktop app"
- Never make up fake data like fake account balances or stock positions
- You understand Telugu, Hindi and Indian context`;

// ── Chat API with Claude + Groq + conversation context ───────────────
const chatApi = {
  chat: async (text, appState = null) => {
    const settings = localSettings.get();

    // Load conversation history for context
    const history = localSettings.getHistory();
    const recentHistory = history.slice(-10);
    const messages = [
      ...recentHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content || msg.text || ''
      })),
      { role: 'user', content: text }
    ];

    // Save current message to history
    const updatedHistory = [...history, { role: 'user', content: text, timestamp: Date.now() }];

    // Try Claude first (smartest)
    if (settings.claude_api_key) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': settings.claude_api_key,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            system: SYSTEM_PROMPT,
            messages: messages,
          }),
        });

        if (!response.ok) throw new Error('Claude error');
        const data = await response.json();
        const reply = data.content[0].text;

        updatedHistory.push({ role: 'assistant', content: reply, timestamp: Date.now() });
        localStorage.setItem('airis_chat_history', JSON.stringify(updatedHistory.slice(-50)));

        return { success: true, response: reply, text: reply };
      } catch (e) {
        console.warn('Claude failed, falling back to Groq:', e);
      }
    }

    // Try Groq
    if (settings.groq_api_key) {
      try {
        const model = settings.groq_model || 'llama-3.3-70b-versatile';
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.groq_api_key}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...messages
            ],
            max_tokens: 2048,
            temperature: 0.7,
          }),
        });

        if (!response.ok) throw new Error('Groq error');
        const data = await response.json();
        const reply = data.choices[0].message.content;

        updatedHistory.push({ role: 'assistant', content: reply, timestamp: Date.now() });
        localStorage.setItem('airis_chat_history', JSON.stringify(updatedHistory.slice(-50)));

        return { success: true, response: reply, text: reply };
      } catch (e) {
        console.warn('Groq failed:', e);
      }
    }

    return {
      success: false,
      response: 'No AI provider configured. Add your Groq or Claude API key in Settings → AI Engine.',
      text: ''
    };
  },
};

export const api = {
  // Core
  chat: chatApi.chat,
  run: (cmd) => chatApi.chat(cmd),
  health: () => axiosInstance.get('/health'),

  // History (persistent localStorage — never lost on refresh)
  saveHistory: (messages) => {
    try {
      const trimmed = messages.slice(-50);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    } catch {}
  },
  loadHistory: () => {
    try {
      const h = localStorage.getItem(HISTORY_KEY);
      return h ? JSON.parse(h) : [];
    } catch { return []; }
  },
  clearHistory: async () => {
    localStorage.removeItem(HISTORY_KEY);
    try { await axiosInstance.post('/history/clear', {}); } catch (e) { console.warn('Failed to clear history on backend:', e); }
    return { success: true };
  },
  getHistory: () => {
    const h = localStorage.getItem(HISTORY_KEY);
    const messages = h ? JSON.parse(h) : [];
    return Promise.resolve({ messages });
  },

  // Settings — local first
  getSettings: settingsApi.getSettings,
  saveSettings: settingsApi.saveSettings,
  getProviderStatus: async () => {
    const localS = localSettings.get();
    const hasProvider = bool(localS.groq_api_key);
    try {
      const r = await axiosInstance.get('/provider/status');
      return { has_provider: r.has_provider || hasProvider };
    } catch {
      return { has_provider: hasProvider };
    }
  },

   // System
   getSystemStatus: () => axiosInstance.get('/system/status'),
   getSystemLayers: () => axiosInstance.get('/system/layers'),
   getSystemPrompt: () => axiosInstance.get('/system/prompt'),
   saveSystemPrompt: (prompt) => axiosInstance.post('/system/prompt', { prompt }),

   // Reminders
   getReminders: () => axiosInstance.get('/reminders'),
   addReminder: (text, when) => axiosInstance.post('/reminders', { text, when }),
   deleteReminder: (index) => axiosInstance.post('/reminders/delete', { index }),
   completeReminder: (index) => axiosInstance.post('/reminders/complete', { index }),

   // Memory
   getMemoryStats: () => axiosInstance.get('/memory/stats'),

   // Capabilities
   getCapabilities: () => axiosInstance.get('/capabilities'),

   // Analytics
   getAnalytics: () => axiosInstance.get('/analytics'),

  // TTS / Voice Cloning
   ttsConfig: () => axiosInstance.get('/tts/config'),
   tts: (text, reference_id, model) => axiosInstance.post('/tts', { text, reference_id, model }, { responseType: 'arraybuffer' }),
   cloneVoice: (name, audio_b64, content_type) => axiosInstance.post('/voice/clone', { name, audio_b64, content_type }),

   // Market Data
   getMarketIndices: () => axiosInstance.get('/market/indices'),
   getMarketQuote: (symbol) => axiosInstance.get(`/market/quote?symbol=${encodeURIComponent(symbol)}`),
   searchStocks: (q) => axiosInstance.get(`/market/search?q=${encodeURIComponent(q)}`),
   getMarketMovers: () => axiosInstance.get('/market/movers'),

   // Tauri shell (desktop only)
   openApp: tauriShell.openApp,
   isTauri: isTauri,

   // Trading data persistence (auth required)
   getPortfolio: (uid, token) => axiosInstance.get('/trading/portfolio', {
     headers: { Authorization: `Bearer ${token}` }
   }),
   savePortfolio: (portfolio, uid, token) => axiosInstance.post('/trading/portfolio', { portfolio }, {
     headers: { Authorization: `Bearer ${token}` }
   }),
   getWatchlist: (uid, token) => axiosInstance.get('/trading/watchlist', {
     headers: { Authorization: `Bearer ${token}` }
   }),
   saveWatchlist: (watchlist, uid, token) => axiosInstance.post('/trading/watchlist', { watchlist }, {
     headers: { Authorization: `Bearer ${token}` }
   }),
};

// ── Speech / TTS ─────────────────────────────────────────────────────────

const browserSpeak = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const settings = JSON.parse(localStorage.getItem('airis_settings') || '{}');
  const utterance = new SpeechSynthesisUtterance(text);

  const setVoiceAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    const personality = settings.voice_personality || 'airis';

    let voice = null;
    if (personality === 'airis') {
      voice = voices.find(v => v.name.includes('Daniel') && v.lang === 'en-GB')
        || voices.find(v => v.lang === 'en-GB')
        || voices.find(v => v.lang.startsWith('en'));
    } else {
      voice = voices.find(v => v.name.includes('Samantha'))
        || voices.find(v => v.lang === 'en-US');
    }

    if (voice) utterance.voice = voice;
    utterance.rate = parseFloat(settings.voice_rate || 150) / 150;
    utterance.volume = parseFloat(settings.voice_volume || 0.9);
    utterance.pitch = parseFloat(settings.voice_pitch || 1.0);

    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
  } else {
    setVoiceAndSpeak();
  }
};

const speakText = (text) => {
  const settings = JSON.parse(localStorage.getItem('airis_settings') || '{}');
  const fishKey = settings.fish_audio_api_key;
  const referenceId = settings.fish_audio_reference_id;
  const provider = settings.preferred_voice_provider || 'browser';

  if (provider === 'fish' && fishKey && referenceId) {
    fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fishKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        reference_id: referenceId,
        model: settings.fish_audio_model || 's2-pro',
        format: 'mp3',
      }),
    })
    .then(r => {
      if (!r.ok) throw new Error('Fish Audio TTS failed');
      return r.arrayBuffer();
    })
    .then(buffer => {
      const blob = new Blob([buffer], { type: 'audio/mpeg' });
      const audio = new Audio(URL.createObjectURL(blob));
      audio.play();
    })
    .catch(() => browserSpeak(text));
  } else if (provider === 'eleven' && settings.elevenlabs_api_key) {
    fetch(`https://api.elevenlabs.io/v1/text-to-speech/${settings.elevenlabs_voice_id || 'Rachel'}`, {
      method: 'POST',
      headers: {
        'xi-api-key': settings.elevenlabs_api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
      }),
    })
    .then(r => r.arrayBuffer())
    .then(buffer => {
      const audio = new Audio(URL.createObjectURL(new Blob([buffer], { type: 'audio/mpeg' })));
      audio.play();
    })
    .catch(() => browserSpeak(text));
  } else {
    browserSpeak(text);
  }
};

export { speakText, browserSpeak };

// Standalone portfolio API (for Portfolio.jsx page)
export const portfolioAPI = {
  get: async () => axiosInstance.get('/trading/portfolio'),
  add: async (data) => axiosInstance.post('/trading/portfolio/add', data),
  remove: async (symbol) => axiosInstance.post('/trading/portfolio/remove', { symbol }),
};

