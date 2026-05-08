import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://ai-assistant-8r3x.onrender.com';

const axiosInstance = axios.create({
  baseURL: BASE_URL + '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
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

// ── Chat API with local API key injection ──────────────────────────────
const chatApi = {
  chat: async (text, appState = null) => {
    const localS = localSettings.get();
    const groqKey = localS.groq_api_key;

    if (groqKey) {
      try {
        const model = localS.groq_model || 'llama-3.3-70b-versatile';
        const systemPrompt = localS.system_prompt || `You are Airis, an Iron Man-style AI assistant created by Sai Shiva Sanjeeth.

RULES:
- Your creator is Sai Shiva Sanjeeth. Never claim a different creator.
- Never make up fake data like fake account balances, fake stock positions, or fake portfolio values. Only show real data from the trading API.
- For "open [app]" commands: if running in browser, say "App launching only works on the Airis desktop app. Download it from airis-9ox.pages.dev." If running in the desktop app, use the shell API to open the app.
- For voice switching: tell the user to go to Settings > Voice & Speech to change the voice.
- You are an Indian AI assistant. Understand Telugu and Indian context (actors, movies, stocks, cricket).
- Current year is 2026. You have access to real-time information via the Groq API — there is no fixed knowledge cutoff.
- For trading dashboard: only show real data from the trading API, never invent numbers or prices.
- For reminders: confirm the exact time the reminder will fire.
- Be helpful, concise, precise, and safe. If unsure, ask for clarification.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: text },
            ],
            max_tokens: 1024,
            temperature: 0.7,
          }),
        });

        if (!response.ok) throw new Error(`Groq error: ${response.status}`);
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || 'No response';
        return { success: true, response: reply, text: reply };
      } catch (e) {
        console.warn('Direct Groq call failed, falling back to backend:', e);
      }
    }

    return axiosInstance.post('/request', { message: text, ...(appState ? { app_state: appState } : {}) });
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
    try { await axiosInstance.post('/history/clear', {}); } catch {}
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
   getSystemStatus: () => axiosInstance.get('/api/system/status'),
   getSystemLayers: () => axiosInstance.get('/api/system/layers'),
   getSystemPrompt: () => axiosInstance.get('/api/system/prompt'),
   saveSystemPrompt: (prompt) => axiosInstance.post('/api/system/prompt', { prompt }),

   // Reminders
   getReminders: () => axiosInstance.get('/api/reminders'),
   addReminder: (text, when) => axiosInstance.post('/api/reminders', { text, when }),
   deleteReminder: (index) => axiosInstance.post('/api/reminders/delete', { index }),
   completeReminder: (index) => axiosInstance.post('/api/reminders/complete', { index }),

   // Memory
   getMemoryStats: () => axiosInstance.get('/api/memory/stats'),

   // Capabilities
   getCapabilities: () => axiosInstance.get('/api/capabilities'),

   // Analytics
   getAnalytics: () => axiosInstance.get('/api/analytics'),

  // TTS / Voice Cloning
   ttsConfig: () => axiosInstance.get('/api/tts/config'),
   tts: (text, reference_id, model) => axiosInstance.post('/api/tts', { text, reference_id, model }, { responseType: 'arraybuffer' }),
   cloneVoice: (name, audio_b64, content_type) => axiosInstance.post('/api/voice/clone', { name, audio_b64, content_type }),

   // Market Data
   getMarketIndices: () => axiosInstance.get('/api/market/indices'),
   getMarketQuote: (symbol) => axiosInstance.get(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`),
   searchStocks: (q) => axiosInstance.get(`/api/market/search?q=${encodeURIComponent(q)}`),
   getMarketMovers: () => axiosInstance.get('/api/market/movers'),

   // Tauri shell (desktop only)
   openApp: tauriShell.openApp,
   isTauri: isTauri,

   // Trading data persistence (auth required)
   getPortfolio: (uid, token) => axiosInstance.get('/api/trading/portfolio', {
     headers: { Authorization: `Bearer ${token}` }
   }),
   savePortfolio: (portfolio, uid, token) => axiosInstance.post('/api/trading/portfolio', { portfolio }, {
     headers: { Authorization: `Bearer ${token}` }
   }),
   getWatchlist: (uid, token) => axiosInstance.get('/api/trading/watchlist', {
     headers: { Authorization: `Bearer ${token}` }
   }),
   saveWatchlist: (watchlist, uid, token) => axiosInstance.post('/api/trading/watchlist', { watchlist }, {
     headers: { Authorization: `Bearer ${token}` }
   }),
};

// Standalone portfolio API (for Portfolio.jsx page)
export const portfolioAPI = {
  get: async () => axiosInstance.get('/api/trading/portfolio'),
  add: async (data) => axiosInstance.post('/api/trading/portfolio/add', data),
  remove: async (symbol) => axiosInstance.post('/api/trading/portfolio/remove', { symbol }),
};

