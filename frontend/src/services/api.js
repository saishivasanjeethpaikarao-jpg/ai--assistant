import axios from 'axios';

const API_BASE_URL = '/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    throw error;
  }
);

export const api = {
  chat: (text) => axiosInstance.post('/request', { message: text }),
  run: (command) => axiosInstance.post('/request', { message: command }),
  health: () => axiosInstance.get('/health'),
  getSettings: () => axiosInstance.get('/settings'),
  saveSettings: (settings, preferences) => axiosInstance.post('/settings', { settings, preferences }),
  getProviderStatus: () => axiosInstance.get('/provider/status'),
  getHistory: () => axiosInstance.get('/history'),
  clearHistory: () => axiosInstance.post('/history/clear', {}),
};

export default api;
