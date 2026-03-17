import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      // Only redirect if not already on login/register pages
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    
    // Always reject with the error for component-level handling
    return Promise.reject(error);
  },
);

export default api;
