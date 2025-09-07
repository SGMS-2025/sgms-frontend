import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import i18n from '@/configs/i18n';
import type { ApiErrorResponse } from '@/types/api/Api';

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

// Centralized error handling function
const handleApiError = (error: AxiosError) => {
  const response = error.response;

  // Log all errors for debugging
  console.group('🚨 API Error');
  console.log('Message:', error.message);
  console.log('Code:', error.code);
  console.log('Status:', response?.status);
  console.log('Status Text:', response?.statusText);
  console.log('URL:', error.config?.url);
  console.log('Method:', error.config?.method);
  console.log('Response Data:', response?.data);
  console.groupEnd();

  if (response?.data) {
    const errorData = response.data as ApiErrorResponse;

    // Handle structured error responses from backend
    if (errorData.error && errorData.error.message) {
      const errorCode = errorData.error.code;
      const errorMessage = errorData.error.message;

      // Show toast notification for user-facing errors
      if (response.status >= 400 && response.status < 500) {
        toast.error(i18n.t(`error.${errorMessage}`));
      } else {
        toast.error(i18n.t('system_error'));
      }

      // Return a standardized error object
      return {
        success: false,
        message: errorMessage,
        statusCode: response.status,
        code: errorCode || 'UNKNOWN_ERROR'
      };
    }
  }

  // Handle network errors or unexpected responses
  if (error.code === 'NETWORK_ERROR' || !error.response) {
    toast.error(i18n.t('error.network_error'));
    return {
      success: false,
      message: i18n.t('error.network_error'),
      statusCode: 0,
      code: 'NETWORK_ERROR'
    };
  }

  // Handle other unexpected errors
  toast.error(i18n.t('error.unknown_error'));
  return {
    success: false,
    message: i18n.t('error.unknown_error'),
    statusCode: response?.status || 500,
    code: 'UNKNOWN_ERROR'
  };
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // Handle token refresh for 401 errors (except login endpoint)
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
        handleRefreshFailure();
        return Promise.reject(refreshError);
      }
    }

    // For all other errors, handle them centrally
    const handledError = handleApiError(error);
    // Don't throw error, just return it so component can handle gracefully
    return Promise.resolve({ data: handledError });
  }
);
