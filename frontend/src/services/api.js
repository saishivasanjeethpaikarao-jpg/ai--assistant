import axios from 'axios';

const getDefaultBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) return 'http://127.0.0.1:8000';
  if (typeof window !== 'undefined' && window.__TAURI__) return 'http://127.0.0.1:8000';
  return 'https://ai-assistant-8r3x.onrender.com';
};

const BASE_URL = getDefaultBaseUrl();

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
const getSystemPrompt = () => {
  const now = new Date().toLocaleString();
  return `You are Airis, an advanced Iron Man JARVIS-style AI assistant created by Sai Shiva Sanjeeth, a student developer from India.

PERSONALITY:
- Intelligent, witty, concise. Like JARVIS from Iron Man.
- Never verbose unless asked. 1-3 sentences for simple answers.
- Understand Indian context: Telugu cinema, Bollywood, cricket, NSE/BSE stocks, Indian culture, Telugu and Hindi languages.
- Reply in same language as user (English/Telugu/Hindi).
- Never say "Namaste" unless user greets in Hindi/Telugu first.
- Only introduce yourself when specifically asked.
- Creator is Sai Shiva Sanjeeth (only mention if asked).
- Never make up fake data or statistics.
- Current date: ${now}

CAPABILITIES:
- AI conversation with memory of last 10 messages
- Stock market analysis (NSE, BSE, global)
- Voice responses (TTS)
- Reminders and tasks
- File management (desktop only)
- App launching (desktop only)
- Web search (desktop only)`;
};

// ── Chat API with multi-provider fallback ──────────────────────────────
const chatApi = {
  chat: async (text, appState = null) => {
    const settings = localSettings.get();
    const history = localSettings.getHistory();
    const recentHistory = history.slice(-10);
    const messages = [
      ...recentHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content || msg.text || ''
      })),
      { role: 'user', content: text }
    ];

    const updatedHistory = [...history, { role: 'user', content: text, timestamp: Date.now() }];

    // Sync to backend
    axiosInstance.post('/history', { role: 'user', content: text }).catch(() => {});

    // Prefer the backend orchestrator so desktop actions, trading, reminders,
    // and verified tool execution work from the main chat surface.
    try {
      const backend = await axiosInstance.post('/request', {
        message: text,
        history: recentHistory,
        ...(appState ? { app_state: appState } : {}),
      });

      const reply = backend?.reply || backend?.response || backend?.text || backend?.message;
      if (backend?.success && reply) {
        updatedHistory.push({
          role: 'assistant',
          content: reply,
          timestamp: Date.now(),
          provider: 'Airis Backend',
          mode: backend.mode || backend.intent,
        });
        localSettings.setHistory(updatedHistory.slice(-50));
        axiosInstance.post('/history', { role: 'assistant', content: reply }).catch(() => {});
        return { ...backend, response: reply, text: reply };
      }
    } catch (e) {
      console.warn('Backend orchestrator unavailable, trying browser providers...', e);
    }

    const providers = [
      {
        name: 'Claude',
        key: settings.anthropic_api_key || settings.claude_api_key,
        url: 'https://api.anthropic.com/v1/messages',
        model: settings.claude_model || 'claude-sonnet-4-20250514',
        type: 'anthropic'
      },
      {
        name: 'OpenAI',
        key: settings.openai_api_key,
        url: 'https://api.openai.com/v1/chat/completions',
        model: settings.openai_model || 'gpt-4o',
        type: 'openai'
      },
      {
        name: 'Gemini',
        key: settings.gemini_api_key,
        url: `https://generativelanguage.googleapis.com/v1beta/models/${settings.gemini_model || 'gemini-2.0-flash'}:generateContent?key=${settings.gemini_api_key}`,
        type: 'gemini'
      },
      {
        name: 'Groq',
        key: settings.groq_api_key,
        url: 'https://api.groq.com/openai/v1/chat/completions',
        model: settings.groq_model || 'llama-3.3-70b-versatile',
        type: 'openai'
      },
      {
        name: 'NVIDIA',
        key: settings.nvidia_nim_api_key,
        url: 'https://integrate.api.nvidia.com/v1/chat/completions',
        model: settings.nvidia_model || 'nvidia/llama-3.1-nemotron-70b',
        type: 'openai'
      },
      {
        name: 'Mistral',
        key: settings.mistral_api_key,
        url: 'https://api.mistral.ai/v1/chat/completions',
        model: settings.mistral_model || 'mistral-large-latest',
        type: 'openai'
      },
      {
        name: 'Together',
        key: settings.together_api_key,
        url: 'https://api.together.xyz/v1/chat/completions',
        model: settings.together_model || 'meta-llama/Llama-3-70b',
        type: 'openai'
      },
      {
        name: 'Ollama',
        key: 'no-key-needed',
        url: (settings.ollama_url || 'http://localhost:11434') + '/api/chat',
        model: settings.ollama_model || 'llama3.2',
        type: 'ollama'
      }
    ];

    // Reorder based on primary provider if selected
    const primary = settings.primary_provider;
    if (primary) {
      const idx = providers.findIndex(p => p.name.toLowerCase() === primary.toLowerCase());
      if (idx > -1) {
        const [p] = providers.splice(idx, 1);
        providers.unshift(p);
      }
    }

    const sysPrompt = getSystemPrompt();

    for (const provider of providers) {
      if (!provider.key && provider.type !== 'ollama') continue;

      try {
        let reply = '';
        if (provider.type === 'anthropic') {
          const res = await fetch(provider.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': provider.key,
              'anthropic-version': '2023-06-01',
              'dangerouslyAllowBrowser': 'true'
            },
            body: JSON.stringify({
              model: provider.model,
              max_tokens: 2048,
              system: sysPrompt,
              messages: messages,
            }),
          });
          if (!res.ok) throw new Error(`${provider.name} failed`);
          const data = await res.json();
          reply = data.content[0].text;
        } else if (provider.type === 'openai') {
          const res = await fetch(provider.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${provider.key}`,
            },
            body: JSON.stringify({
              model: provider.model,
              messages: [{ role: 'system', content: sysPrompt }, ...messages],
            }),
          });
          if (!res.ok) throw new Error(`${provider.name} failed`);
          const data = await res.json();
          reply = data.choices[0].message.content;
        } else if (provider.type === 'gemini') {
          const res = await fetch(provider.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
              system_instruction: { parts: [{ text: sysPrompt }] }
            }),
          });
          if (!res.ok) throw new Error(`${provider.name} failed`);
          const data = await res.json();
          reply = data.candidates[0].content.parts[0].text;
        } else if (provider.type === 'ollama') {
          const res = await fetch(provider.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: provider.model,
              messages: [{ role: 'system', content: sysPrompt }, ...messages],
              stream: false
            }),
          });
          if (!res.ok) throw new Error(`${provider.name} failed`);
          const data = await res.json();
          reply = data.message.content;
        }

        if (reply) {
          updatedHistory.push({ role: 'assistant', content: reply, timestamp: Date.now(), provider: provider.name });
          localSettings.setHistory(updatedHistory.slice(-50));
          axiosInstance.post('/history', { role: 'assistant', content: reply }).catch(() => {});
          return { success: true, response: reply, text: reply, provider: provider.name };
        }
      } catch (e) {
        console.warn(`${provider.name} failed, trying next...`, e);
      }
    }

    return {
      success: false,
      response: 'All AI providers failed. Please check your API keys in Settings.',
      text: ''
    };
  },
};

export const api = {
  // Core
  chat: chatApi.chat,
  visionChat: async (text, imageBase64) => {
    // Multi-modal support (Claude/GPT-4o Vision)
    const settings = localSettings.get();
    const key = settings.openai_api_key || settings.anthropic_api_key;
    if (!key) throw new Error("Vision requires OpenAI or Claude API key");

    if (settings.openai_api_key) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.openai_api_key}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
            ]
          }]
        })
      });
      const data = await res.json();
      return { reply: data.choices[0].message.content };
    } else {
       // Anthropic Vision
       const res = await fetch('https://api.anthropic.com/v1/messages', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'x-api-key': settings.anthropic_api_key,
           'anthropic-version': '2023-06-01',
           'dangerouslyAllowBrowser': 'true'
         },
         body: JSON.stringify({
           model: 'claude-3-5-sonnet-20240620',
           max_tokens: 1024,
           messages: [{
             role: 'user',
             content: [
               { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
               { type: 'text', text }
             ]
           }]
         })
       });
       const data = await res.json();
       return { reply: data.content[0].text };
    }
  },
  run: (cmd) => axiosInstance.post('/request', { message: cmd }),
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
    const hasProvider = bool(localS.groq_api_key) || bool(localS.anthropic_api_key) ||
      bool(localS.claude_api_key) || bool(localS.openai_api_key) || bool(localS.gemini_api_key) ||
      bool(localS.nvidia_nim_api_key) || bool(localS.mistral_api_key) ||
      bool(localS.together_api_key) || bool(localS.ollama_enabled);
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
   tradingChat: (message, context, preferences) => axiosInstance.post('/trading/chat', {
     message,
     context,
     preferences,
   }),

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

let currentPremiumAudio = null;

const stopSpeech = () => {
  window.speechSynthesis?.cancel();
  if (currentPremiumAudio) {
    currentPremiumAudio.pause();
    currentPremiumAudio.src = '';
    currentPremiumAudio = null;
  }
};

const speakText = async (text) => {
  const settings = JSON.parse(localStorage.getItem('airis_settings') || '{}');
  const referenceId = settings.fish_audio_reference_id;
  const provider = settings.preferred_voice_provider;

  if ((provider === 'fish' || (!provider && referenceId)) && referenceId) {
    try {
      const buffer = await api.tts(text, referenceId, settings.fish_audio_model || 's2-pro');
      if (currentPremiumAudio) {
        currentPremiumAudio.pause();
        currentPremiumAudio.src = '';
      }
      const audioUrl = URL.createObjectURL(new Blob([buffer], { type: 'audio/mpeg' }));
      const audio = new Audio(audioUrl);
      currentPremiumAudio = audio;
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (currentPremiumAudio === audio) currentPremiumAudio = null;
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        if (currentPremiumAudio === audio) currentPremiumAudio = null;
        browserSpeak(text);
      };
      await audio.play();
      return;
    } catch (e) {
      console.warn('Premium TTS failed, falling back to browser voice:', e);
    }
  }

  browserSpeak(text);
};

export { speakText, browserSpeak, stopSpeech };

// Stock Market API
export const stockAPI = {
  getGainers: async () => {
    try {
      const res = await axiosInstance.get('/market/movers');
      return { data: res.data?.gainers || [] };
    } catch (e) {
      console.error('Get gainers error:', e);
      return { data: [] };
    }
  },
  getLosers: async () => {
    try {
      const res = await axiosInstance.get('/market/movers');
      return { data: res.data?.losers || [] };
    } catch (e) {
      console.error('Get losers error:', e);
      return { data: [] };
    }
  },
  getIndices: async () => {
    try {
      const res = await axiosInstance.get('/market/indices');
      return { data: res.data || [] };
    } catch (e) {
      console.error('Get indices error:', e);
      return { data: [] };
    }
  },
  getQuote: async (symbol) => {
    try {
      const res = await axiosInstance.get(`/market/quote?symbol=${symbol}`);
      return res.data;
    } catch (e) {
      console.error('Get quote error:', e);
      return null;
    }
  },
  search: async (query) => {
    try {
      const res = await axiosInstance.get(`/market/search?q=${query}`);
      return { data: res.data || [] };
    } catch (e) {
      console.error('Search error:', e);
      return { data: [] };
    }
  },
};

// Standalone portfolio API (for Portfolio.jsx page)
export const portfolioAPI = {
  get: async () => axiosInstance.get('/trading/portfolio'),
  add: async (data) => axiosInstance.post('/trading/portfolio/add', data),
  remove: async (symbol) => axiosInstance.post('/trading/portfolio/remove', { symbol }),
};

