import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import i18n from '@/configs/i18n';
import type { ApiErrorResponse } from '@/types/api/Api';
import { handleSpecificError } from '@/utils/permissionErrorHandler';

const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increased to 30 seconds for all requests
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

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

// Helper function to log API errors
const logApiError = (error: AxiosError) => {
  const response = error.response;
  console.group('🚨 API Error');
  console.log('Message:', error.message);
  console.log('Code:', error.code);
  console.log('Status:', response?.status);
  console.log('Status Text:', response?.statusText);
  console.log('URL:', error.config?.url);
  console.log('Method:', error.config?.method);
  console.log('Response Data:', response?.data);
  console.groupEnd();
};

// Helper function to handle client errors (4xx)
const handleClientError = (status: number, errorMessage: string) => {
  switch (status) {
    case 403:
      handleSpecificError(errorMessage);
      break;
    case 400:
    case 409:
      toast.error(i18n.t(`error.${errorMessage}`));
      break;
    case 404:
      toast.error(i18n.t('error.NOT_FOUND'));
      break;
    default:
      toast.error(i18n.t(`error.${errorMessage}`));
  }
};

// Helper function to create standardized error response
const createErrorResponse = (message: string, statusCode: number, code: string) => ({
  success: false,
  message,
  statusCode,
  code
});

// Centralized error handling function
const handleApiError = (error: AxiosError) => {
  const response = error.response;

  // Log all errors for debugging
  logApiError(error);

  // Handle structured error responses from backend
  if (response?.data) {
    const errorData = response.data as ApiErrorResponse;
    const errorMessage = errorData.error?.message;

    if (errorMessage) {
      const errorCode = errorData.error.code;

      // Show toast notification for user-facing errors (except 409 conflicts)
      if (response.status >= 400 && response.status < 500) {
        if (response.status === 409) {
          // For 409 conflicts, return full error info without showing toast
          return {
            success: false,
            message: errorMessage,
            statusCode: response.status,
            code: errorCode || 'CONFLICT',
            error: errorData.error // Include full error object for component handling
          };
        } else {
          handleClientError(response.status, errorMessage);
        }
      } else {
        toast.error(i18n.t('error.system_error'));
      }

      // Return full error object including meta for validation errors
      return {
        success: false,
        message: errorMessage,
        statusCode: response.status,
        code: errorCode || 'UNKNOWN_ERROR',
        error: errorData.error // Include full error object with meta
      };
    }
  }

  // Handle network errors or unexpected responses
  if (error.code === 'NETWORK_ERROR' || !error.response) {
    toast.error(i18n.t('error.network_error'));
    return createErrorResponse(i18n.t('error.network_error'), 0, 'NETWORK_ERROR');
  }

  // Handle other unexpected errors
  toast.error(i18n.t('error.unknown_error'));
  return createErrorResponse(i18n.t('error.unknown_error'), response?.status || 500, 'UNKNOWN_ERROR');
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
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
            return Promise.reject(err instanceof Error ? err : new Error(String(err)));
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
        return Promise.reject(refreshError instanceof Error ? refreshError : new Error(String(refreshError)));
      }
    }

    // For all other errors, handle them centrally
    const handledError = handleApiError(error);
    // Don't throw error, just return it so component can handle gracefully
    return Promise.resolve({ data: handledError });
  }
);
