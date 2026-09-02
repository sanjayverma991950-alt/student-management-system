import axios from 'axios';

// Use deployed backend URL from .env, fallback to localhost for local dev
const baseURL = import.meta.env.VITE_API_URL || '';

const axiosInstance = axios.create({
  baseURL,
});

// Attach token to every request automatically
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
