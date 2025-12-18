import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import i18n from '@/configs/i18n';
import type { ApiErrorResponse } from '@/types/api/Api';
import { handleSpecificError } from '@/utils/permissionErrorHandler';
import { convertMongoDecimalToNumbers } from '@/utils/mongodbDecimalConverter';
import { decryptResponseIfNeeded } from '@/utils/responseDecryption';

const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // Increased to 120 seconds for all requests
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
const handleClientError = (status: number, errorMessage: string, skipErrorToast = false) => {
  // Skip toast if explicitly requested (e.g., for expected 404s)
  if (skipErrorToast) {
    return;
  }

  // Helper to safely localize error messages
  const safeLocalize = (key: string, fallback: string): string => {
    try {
      const translated = i18n.t(key);
      // If translation returns the key itself, it means no translation found
      return translated === key ? fallback : translated;
    } catch {
      return fallback;
    }
  };

  switch (status) {
    case 403:
      handleSpecificError(errorMessage);
      break;
    case 400:
    case 409: {
      // Try to localize error, fallback to original message if not found
      const localizedError = safeLocalize(`error.${errorMessage}`, errorMessage);
      toast.error(localizedError);
      break;
    }
    case 404:
      toast.error(i18n.t('error.NOT_FOUND'));
      break;
    default: {
      const localizedDefault = safeLocalize(`error.${errorMessage}`, errorMessage);
      toast.error(localizedDefault);
    }
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
  // @ts-expect-error - Custom config property
  const skipErrorToast = error.config?.skipErrorToast || false;

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
          handleClientError(response.status, errorMessage, skipErrorToast);
        }
      } else {
        if (!skipErrorToast) {
          toast.error(i18n.t('error.system_error'));
        }
      }

      return createErrorResponse(errorMessage, response.status, errorCode || 'UNKNOWN_ERROR');
    }
  }

  // Handle network errors or unexpected responses
  if (error.code === 'NETWORK_ERROR' || !error.response) {
    if (!skipErrorToast) {
      toast.error(i18n.t('error.network_error'));
    }
    return createErrorResponse(i18n.t('error.network_error'), 0, 'NETWORK_ERROR');
  }

  // Handle other unexpected errors
  if (!skipErrorToast) {
    toast.error(i18n.t('error.unknown_error'));
  }
  return createErrorResponse(i18n.t('error.unknown_error'), response?.status || 500, 'UNKNOWN_ERROR');
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add language to query params for subscription endpoints
    const currentLang = i18n.language || 'vi';
    const validLang = ['en', 'vi'].includes(currentLang) ? currentLang : 'vi';

    // Add language param to subscription-related endpoints
    if (config.url?.includes('/subscriptions/packages')) {
      const separator = config.url.includes('?') ? '&' : '?';
      config.url = `${config.url}${separator}lang=${validLang}`;
    }

    // If data is FormData, remove Content-Type header to let axios set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Skip MongoDB Decimal conversion for blob responses (file downloads)
    // Blob responses should be returned as-is without any data transformation
    if (response.config.responseType === 'blob') {
      return response;
    }

    // Bước 1: Decrypt response nếu cần
    if (response.data) {
      try {
        response.data = decryptResponseIfNeeded(response.data);
      } catch (decryptError) {
        const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV;
        if (isDevelopment) {
          console.warn('⚠️ Failed to decrypt response (dev mode - may not be encrypted):', decryptError);
        } else {
          console.error('❌ Failed to decrypt response:', decryptError);
          throw new Error(
            `Response decryption failed: ${decryptError instanceof Error ? decryptError.message : String(decryptError)}`
          );
        }
      }
    }

    // Bước 2: Convert MongoDB Decimal values in response data for JSON responses only
    if (response.data) {
      response.data = convertMongoDecimalToNumbers(response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // Skip error handling for blob responses - let them be handled by the calling code
    if (originalRequest.responseType === 'blob') {
      // For blob responses with error status, try to parse error message from blob
      if (error.response && error.response.status >= 400) {
        try {
          const blob = error.response.data as Blob;
          const text = await blob.text();
          const errorData = JSON.parse(text);
          // If it's a JSON error response, create a proper error
          if (errorData.error) {
            const apiError = new Error(errorData.error.message || 'Download failed');
            // @ts-expect-error - Add custom properties
            apiError.response = error.response;
            return Promise.reject(apiError);
          }
        } catch {
          // If parsing fails, it's likely a real blob error, throw it
          return Promise.reject(error);
        }
      }
      // For blob responses, reject to let caller handle
      return Promise.reject(error);
    }

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
