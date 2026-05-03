import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const axiosInstance = axios.create({
  baseURL: BASE_URL + '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

axiosInstance.interceptors.response.use(
  (r) => r.data,
  (e) => { console.error('API Error:', e); throw e; }
);

export const api = {
  // Core
  chat: (text, appState = null) => axiosInstance.post('/request', { message: text, ...(appState ? { app_state: appState } : {}) }),
  run: (cmd) => axiosInstance.post('/request', { message: cmd }),
  health: () => axiosInstance.get('/health'),
  // History
  getHistory: () => axiosInstance.get('/history'),
  clearHistory: () => axiosInstance.post('/history/clear', {}),
  // Settings
  getSettings: () => axiosInstance.get('/settings'),
  saveSettings: (settings, preferences) => axiosInstance.post('/settings', { settings, preferences }),
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
  // Market Data (Yahoo Finance)
  getMarketIndices: () => axiosInstance.get('/market/indices'),
  getMarketQuote: (symbol) => axiosInstance.get(`/market/quote?symbol=${encodeURIComponent(symbol)}`),
  searchStocks: (q) => axiosInstance.get(`/market/search?q=${encodeURIComponent(q)}`),
  getMarketMovers: () => axiosInstance.get('/market/movers'),
  getStockHistory: (symbol, period) => axiosInstance.get(`/market/history?symbol=${encodeURIComponent(symbol)}&period=${encodeURIComponent(period)}`),
  // Trading AI
  tradingChat: (message, context = '') => axiosInstance.post('/trading/chat', { message, context }),
  // Vibe Coder
  getVibeAgents: () => axiosInstance.get('/vibe/agents'),
  vibeCode: (prompt, agent_id = 'auto') => axiosInstance.post('/vibe/code', { prompt, agent_id }),
  vibeRun: (code, language = 'python') => axiosInstance.post('/vibe/run', { code, language }),
  vibeFix: (code, error) => axiosInstance.post('/vibe/fix', { code, error }),
  vibeChat: (message, code_context) => axiosInstance.post('/vibe/chat', { message, code_context }),
  vibeDetect: (prompt) => axiosInstance.post('/vibe/detect', { prompt }),
};

export default api;
