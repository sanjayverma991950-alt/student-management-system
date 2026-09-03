import axios from 'axios';

// Use deployed backend URL from env, with fallback to live Render backend
const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://student-management-system-ss8i.onrender.com'
    : '');

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
