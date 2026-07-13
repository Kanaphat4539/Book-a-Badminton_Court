import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Update this with your NestJS backend URL
});

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

export default api;
