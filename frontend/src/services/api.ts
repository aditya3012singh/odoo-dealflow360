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

// Internal DB/Prisma patterns to mask
const INTERNAL_DB_PATTERNS = [
  /prisma/i,
  /prismaclient/i,
  /invocation/i,
  /unique constraint/i,
  /foreign key constraint/i,
  /null constraint/i,
  /syntax error/i,
  /syntaxerror/i,
  /prepared statement/i,
  /database/i,
  /postgres/i,
  /econnrefused/i,
  /relation .* does not exist/i,
  /table .* does not exist/i,
  /column .* does not exist/i,
  /\.ts:\d+/i,
  /\.js:\d+/i,
  /stack trace/i,
];

export function sanitizeErrorMessage(rawMessage: any): string {
  if (!rawMessage) return 'Internal server error. Please try again later.';
  const str = String(rawMessage);
  const isInternal = INTERNAL_DB_PATTERNS.some((p) => p.test(str));
  return isInternal ? 'Internal server error. Please try again later.' : str;
}

// Response interceptor - handle and sanitize errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl = error.config?.url || '';

    // 1. Sanitize error messages: mask any raw Prisma, SQL, or database exceptions
    if (error.response?.data) {
      if (typeof error.response.data === 'object') {
        if (error.response.data.message) {
          error.response.data.message = sanitizeErrorMessage(error.response.data.message);
        }
        if (error.response.data.error) {
          error.response.data.error = sanitizeErrorMessage(error.response.data.error);
        }
      } else if (typeof error.response.data === 'string') {
        const sanitized = sanitizeErrorMessage(error.response.data);
        error.response.data = {
          success: false,
          message: sanitized,
        };
      }
    }

    if (error.message) {
      error.message = sanitizeErrorMessage(error.message);
    }

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
