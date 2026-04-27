import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Stock APIs
export const stockAPI = {
  getAll: () => api.get('/stocks'),
  getBySymbol: (symbol) => api.get(`/stocks/${symbol}`),
  search: (query) => api.get(`/stocks/search?q=${query}`),
  compare: (symbol, data) => api.post(`/stocks/${symbol}/compare`, data),
  getGainers: () => api.get('/market/gainers'),
  getLosers: () => api.get('/market/losers'),
};

// Portfolio APIs
export const portfolioAPI = {
  get: () => api.get('/portfolio'),
  add: (data) => api.post('/portfolio/add', data),
  update: (symbol, data) => api.put(`/portfolio/${symbol}`, data),
  remove: (symbol) => api.delete(`/portfolio/${symbol}`),
};

// Watchlist APIs
export const watchlistAPI = {
  get: () => api.get('/watchlist'),
  add: (data) => api.post('/watchlist/add', data),
  remove: (symbol) => api.delete(`/watchlist/${symbol}`),
};

// Alerts APIs
export const alertsAPI = {
  getAll: () => api.get('/alerts'),
  create: (data) => api.post('/alerts', data),
  delete: (id) => api.delete(`/alerts/${id}`),
  check: () => api.post('/alerts/check'),
};

// Analytics APIs
export const analyticsAPI = {
  getAnalysis: (symbol) => api.get(`/analytics/${symbol}`),
  getRecommendations: () => api.get('/trading/recommendations'),
  analyzeStock: (data) => api.post('/trading/analyze', data),
};

// Options APIs
export const optionsAPI = {
  getStrategies: () => api.get('/options/strategies'),
  calculatePrice: (data) => api.post('/options/calculate', data),
};

// Backtesting APIs
export const backtestAPI = {
  run: (data) => api.post('/backtest', data),
};

// Error handler
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    throw error;
  }
);

export default api;
