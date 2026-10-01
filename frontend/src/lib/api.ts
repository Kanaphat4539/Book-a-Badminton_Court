import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});

const sessionErrors = new WeakSet<object>();

export function isSessionExpiredError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && sessionErrors.has(error);
}

// Add a request interceptor to add the JWT token to requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (typeof window !== 'undefined' && axios.isAxiosError(error) && error.response?.status === 401) {
      const path = error.config?.url?.split('?')[0];
      // Wrong credentials must still be handled by the login/register form.
      if (path !== '/auth/login' && path !== '/auth/register') {
        const token = localStorage.getItem('token');
        const authorization = error.config?.headers?.Authorization;
        sessionErrors.add(error);
        // An in-flight request from an old session must not clear a new login.
        if (token && authorization === `Bearer ${token}`) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.replace('/login');
          }
        }
      }
    }
    // Never turn a failed request into a successful response.
    return Promise.reject(error);
  }
);

export default api;
