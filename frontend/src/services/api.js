import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// AI Assistant APIs
export const assistantAPI = {
  chat: (text) => api.post('/mobile/chat', { text }),
  run: (text) => api.post('/run', { text }),
  intent: (text) => api.post('/intent', { text }),
  status: () => api.get('/status'),
};

// Trading APIs
export const tradingAPI = {
  getSignal: (symbol) => api.post('/trading/signal', { symbol }),
  getMarketSummary: () => api.get('/trading/market-summary'),
  getStockInfo: (symbol) => api.get(`/trading/stock/${symbol}`),
};

// Mobile APIs
export const mobileAPI = {
  status: () => api.get('/mobile/status'),
  chat: (text) => api.post('/mobile/chat', { text }),
};

// Convenience methods used by App.jsx
api.chat = (text) => api.post('/request', { input: text });
api.run = (text) => api.post('/request', { input: text });

// Error handler
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    throw error;
  }
);

export { api };
export default api;
