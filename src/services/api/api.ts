import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

console.log('API URL:', API_URL);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

const handleRefreshFailure = () => {
  localStorage.removeItem('user');

  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

// Add request interceptor để theo dõi request
api.interceptors.request.use(
  (config) => {
    console.log('Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('Response Error:', error.message, error.response?.status, error.config?.url);
    console.error('Error details:', error.response?.data);
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/login')) {
      if (isRefreshing) {
        // If already refreshing, add request to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/users/refresh');

        processQueue(null, null);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, process queue and logout
        processQueue(refreshError, null);
        isRefreshing = false;

        // Handle logout when refresh fails
        handleRefreshFailure();

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
