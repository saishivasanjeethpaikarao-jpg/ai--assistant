import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.response.use(
  (r) => r.data,
  (e) => { console.error('API Error:', e); throw e; }
);

export const api = {
  // Core
  chat: (text) => axiosInstance.post('/request', { message: text }),
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
  // Vibe Coder
  getVibeAgents: () => axiosInstance.get('/vibe/agents'),
  vibeCode: (prompt, agent_id = 'auto') => axiosInstance.post('/vibe/code', { prompt, agent_id }),
  vibeRun: (code, language = 'python') => axiosInstance.post('/vibe/run', { code, language }),
};

export default api;
