import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl = error.config?.url || '';

    // Ignore 401 from login/register endpoints — let the login UI display the error message!
    if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register') || requestUrl.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    // Only redirect to login if the session token is truly expired or invalid on the core profile check
    if (error.response?.status === 401) {
      const message = String(error.response?.data?.message || '').toLowerCase();
      const isTokenExpired = message.includes('expired') || message.includes('malformed') || message.includes('missing');
      const isCoreAuth = requestUrl.includes('/auth/profile');

      if (isTokenExpired || isCoreAuth) {
        localStorage.removeItem('accessToken');
        const currentPath = window.location.pathname;
        if (currentPath !== '/workspace' && currentPath !== '/login' && currentPath !== '/portal/login') {
          window.location.href = '/workspace';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
