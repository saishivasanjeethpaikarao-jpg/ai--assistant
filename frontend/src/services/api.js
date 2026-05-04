import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://ai-assistant-8r3x.onrender.com';

const axiosInstance = axios.create({
  baseURL: BASE_URL + '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

axiosInstance.interceptors.response.use(
  (r) => r.data,
  (e) => { console.error('API Error:', e); throw e; }
);

// ── Local Settings Storage ─────────────────────────────────────────────
const SETTINGS_KEY = 'airis_settings';
const PREFS_KEY = 'airis_preferences';

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
};

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

const bool = (v) => typeof v === 'string' ? v.trim().length > 0 : Boolean(v);

// ── Settings API (local-first, backend fallback) ───────────────────────
const settingsApi = {
  getSettings: async () => {
    const localS = localSettings.get();
    const localP = localSettings.getPrefs();

    // If we have local settings, use them immediately
    if (localS && Object.keys(localS).length > 0) {
      // Try to sync from backend in background (don't block)
      axiosInstance.get('/settings').then((res) => {
        if (res?.settings) {
          // Merge: local takes priority for API keys
          const merged = { ...res.settings, ...localS };
          localSettings.set(merged);
          if (res.preferences) localSettings.setPrefs({ ...res.preferences, ...localP });
        }
      }).catch(() => {});
      return buildSettingsResponse(localS, localP);
    }

    // No local settings — try backend
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
    // Always save locally first
    localSettings.set(settings);
    if (preferences) localSettings.setPrefs(preferences);

    // Try backend in background
    axiosInstance.post('/settings', { settings, preferences }).catch(() => {});

    return { success: true };
  },
};

// ── Chat API with local API key injection ──────────────────────────────
const chatApi = {
  chat: async (text, appState = null) => {
    const localS = localSettings.get();
    const groqKey = localS.groq_api_key;

    // If we have a local API key, call Groq directly
    if (groqKey) {
      try {
        const model = localS.groq_model || 'llama-3.3-70b-versatile';
        const systemPrompt = localS.system_prompt || 'You are Airis, an Iron Man-style AI assistant. Be helpful, concise, and intelligent.';

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

    // Fallback to backend
    return axiosInstance.post('/request', { message: text, ...(appState ? { app_state: appState } : {}) });
  },
};

export const api = {
  // Core
  chat: chatApi.chat,
  run: (cmd) => chatApi.chat(cmd),
  health: () => axiosInstance.get('/health'),

  // History
  getHistory: () => axiosInstance.get('/history'),
  clearHistory: () => axiosInstance.post('/history/clear', {}),

  // Settings — local first
  getSettings: settingsApi.getSettings,
  saveSettings: settingsApi.saveSettings,
  getProviderStatus: () => axiosInstance.get('/provider/status'),

  // System
  getSystemStatus: () => axiosInstance.get('/system/status'),
  getSystemLayers: () => axiosInstance.get('/system/layers'),
  getSystemPrompt: () => axiosInstance.get('/system/prompt'),
  saveSystemPrompt: (prompt) => axiosInstance.post('/system/prompt', { prompt }),

  // Reminders
  getReminders: () => axiosInstance.get('/reminders'),
  addReminder: (text, when) => axiosInstance.post('/reminders', { text, when }),

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
};
