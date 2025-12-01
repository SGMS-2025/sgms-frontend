import { toast } from 'sonner';
import type { AsyncOperation, SuccessCallback, ErrorCallback, ErrorHandlerOptions } from '@/types/errorHandler';
import type { ApiErrorResponse } from '@/types/api/Api';
import { mapBackendToFrontendField, type FieldMappingContext } from './fieldMapper';

/**
 * @param message - Error message string from backend
 * @returns Normalized error key in uppercase with underscores
 */
export const normalizeErrorKey = (message: string): string => {
  if (!message) return '';
  // Convert to uppercase and replace spaces with underscores
  return message.toUpperCase().replace(/\s+/g, '_');
};

/**
 * Handle async operations with automatic error handling and user feedback
 * @param operation - The async operation to execute
 * @param successMessage - Success message to show
 * @param errorMessage - Error message to show
 * @returns Promise with result data or null if failed
 */
export const handleAsyncOperation = async <T = unknown>(
  operation: AsyncOperation<T>,
  successMessage: string,
  errorMessage: string
): Promise<T | null> => {
  try {
    const result = await operation();

    if (result.success) {
      toast.success(successMessage);
      return result.data || null;
    } else {
      toast.error(errorMessage);
      return null;
    }
  } catch (error) {
    console.error('Async operation failed:', error);
    toast.error(errorMessage);
    return null;
  }
};

/**
 * Handle async operations with custom success/error handling
 * @param operation - The async operation to execute
 * @param onSuccess - Success callback
 * @param onError - Error callback
 * @returns Promise with result data or null if failed
 */
export const handleAsyncOperationWithCallbacks = async <T = unknown>(
  operation: AsyncOperation<T>,
  onSuccess: SuccessCallback<T>,
  onError: ErrorCallback
): Promise<T | null> => {
  try {
    const result = await operation();

    if (result.success) {
      onSuccess(result.data!);
      return result.data || null;
    } else {
      onError(result.error || 'Unknown error');
      return null;
    }
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error('Async operation with callbacks failed:', errorObj);
    onError(errorObj);
    return null;
  }
};

/**
 * Handle async operations with options
 * @param operation - The async operation to execute
 * @param options - Error handler options
 * @returns Promise with result data or null if failed
 */
export const handleAsyncOperationWithOptions = async <T = unknown>(
  operation: AsyncOperation<T>,
  options: ErrorHandlerOptions = {}
): Promise<T | null> => {
  const {
    showSuccess = true,
    showError = true,
    successMessage = 'Operation completed successfully',
    errorMessage = 'Operation failed. Please try again.'
  } = options;

  try {
    const result = await operation();

    if (result.success) {
      if (showSuccess) {
        toast.success(successMessage);
      }
      return result.data || null;
    } else {
      if (showError) {
        toast.error(errorMessage);
      }
      return null;
    }
  } catch (error) {
    console.error('Async operation with options failed:', error);
    if (showError) {
      toast.error(errorMessage);
    }
    return null;
  }
};

/**
 * API error structure with meta information
 */
export interface ApiError extends Error {
  meta?: {
    details?: Array<{ field: string; message: string }>;
    field?: string;
  };
  code?: string;
  statusCode?: number;
}

/**
 * Options for handleApiErrorForForm function
 */
export interface FormErrorHandlerOptions {
  /** Context for field mapping ('staff' or 'customer') */
  context?: FieldMappingContext;
  /** Custom field mappings to override defaults */
  customFieldMappings?: Record<string, string>;
  /** Translation function */
  t?: (key: string) => string;
  /** Whether to handle 409 conflict errors specially */
  handleConflictErrors?: boolean;
  /** Special error key mappings for specific fields */
  errorKeyMappings?: Record<string, string>;
}

/**
 * Handle API errors for forms and return field-specific error messages
 * Processes error.meta.details array and error.meta.field to map backend fields to frontend fields
 *
 * @param error - API error object with meta information
 * @param options - Configuration options
 * @returns Record of field names to error messages
 *
 * @example
 * const errors = handleApiErrorForForm(error, {
 *   context: 'customer',
 *   t: (key) => i18n.t(key)
 * });
 * setErrors(errors);
 */
export const handleApiErrorForForm = (
  error: ApiError,
  options: FormErrorHandlerOptions = {}
): Record<string, string> => {
  const {
    context = 'staff',
    customFieldMappings,
    t = (key: string) => key,
    handleConflictErrors = true,
    errorKeyMappings = {}
  } = options;

  const fieldErrors: Record<string, string> = {};

  // Check if this is a 409 conflict error
  const isConflictError = error.statusCode === 409 || error.code === 'MONGO_DUPLICATE_KEY' || error.code === 'CONFLICT';

  // Handle errors with meta.details array (preferred format)
  if (error?.meta?.details && Array.isArray(error.meta.details) && error.meta.details.length > 0) {
    error.meta.details.forEach((detail: { field: string; message: string }) => {
      // Map backend field to frontend field
      let frontendField = mapBackendToFrontendField(detail.field, context, customFieldMappings);

      // Determine error key
      let errorKey: string;

      // Special handling for conflict errors - check field mapping first
      if (isConflictError && detail.field === 'username') {
        // Username duplicate means email duplicate - always map to email field
        frontendField = 'email';
        errorKey = errorKeyMappings[detail.field] || 'EMAIL_ALREADY_EXISTS';
      } else if (isConflictError && detail.field === 'phoneNumber') {
        errorKey = errorKeyMappings[detail.field] || 'PHONE_NUMBER_ALREADY_EXISTS';
      } else if (isConflictError && detail.field === 'email') {
        errorKey = errorKeyMappings[detail.field] || 'EMAIL_ALREADY_EXISTS';
      } else if (errorKeyMappings[detail.field]) {
        // Use custom error key mapping
        errorKey = errorKeyMappings[detail.field];
      } else if (isConflictError) {
        // Generic conflict error
        errorKey = normalizeErrorKey(detail.message || error.message || 'DUPLICATE_ENTRY');
      } else {
        // Use normalized error key from message
        errorKey = normalizeErrorKey(detail.message || error.message || '');
      }

      // Translate and set error
      const translatedMessage = t(`error.${errorKey}`);
      fieldErrors[frontendField] = translatedMessage;
    });
  }
  // Handle single field error (error.meta.field)
  else if (error?.meta?.field) {
    let frontendField = mapBackendToFrontendField(error.meta.field, context, customFieldMappings);
    let errorKey: string;

    // Special handling for conflict errors - check field mapping first
    if (isConflictError && error.meta.field === 'username') {
      // Username duplicate means email duplicate - always map to email field
      frontendField = 'email';
      errorKey = errorKeyMappings[error.meta.field] || 'EMAIL_ALREADY_EXISTS';
    } else if (isConflictError && error.meta.field === 'phoneNumber') {
      errorKey = errorKeyMappings[error.meta.field] || 'PHONE_NUMBER_ALREADY_EXISTS';
    } else if (isConflictError && error.meta.field === 'email') {
      errorKey = errorKeyMappings[error.meta.field] || 'EMAIL_ALREADY_EXISTS';
    } else if (errorKeyMappings[error.meta.field]) {
      errorKey = errorKeyMappings[error.meta.field];
    } else if (isConflictError) {
      errorKey = normalizeErrorKey(error.message || 'DUPLICATE_ENTRY');
    } else {
      errorKey = normalizeErrorKey(error.message || '');
    }

    const translatedMessage = t(`error.${errorKey}`);
    fieldErrors[frontendField] = translatedMessage;
  }
  // Fallback: Try to parse field from error message
  else if (isConflictError && handleConflictErrors) {
    const errorMsg = error.message || '';
    let frontendField: string | null = null;
    let errorKey = 'DUPLICATE_ENTRY';

    // Try to detect field from error message
    if (errorMsg.toLowerCase().includes('email') || errorMsg.includes('email_1')) {
      frontendField = 'email';
      errorKey = 'EMAIL_ALREADY_EXISTS';
    } else if (errorMsg.toLowerCase().includes('phone') || errorMsg.includes('phoneNumber_1')) {
      frontendField = context === 'customer' ? 'phone' : 'phoneNumber';
      errorKey = 'PHONE_NUMBER_ALREADY_EXISTS';
    } else if (error.code === 'MONGO_DUPLICATE_KEY') {
      // For generic duplicate key errors, try to infer from common fields
      // This is a best-effort fallback
      if (errorMsg.toLowerCase().includes('username')) {
        frontendField = context === 'customer' ? 'email' : 'username';
        errorKey = context === 'customer' ? 'EMAIL_ALREADY_EXISTS' : 'USERNAME_ALREADY_EXISTS';
      }
    }

    if (frontendField) {
      const translatedMessage = t(`error.${errorKey}`);
      fieldErrors[frontendField] = translatedMessage;
    }
  }
  return fieldErrors;
};

/**
 * Extract error message from API error response for toast notifications
 * Handles various error response formats and returns a normalized error key
 *
 * @param response - API response that may contain error information
 * @param defaultErrorKey - Default error key to use if extraction fails
 * @returns Normalized error key string
 *
 * @example
 * const errorKey = extractApiErrorMessage(response, 'register_failed');
 * toast.error(t(`error.${errorKey}`, { defaultValue: errorKey }));
 */
export const extractApiErrorMessage = (response: unknown, defaultErrorKey: string = 'operation_failed'): string => {
  const errorResponse = response as ApiErrorResponse & { message?: string; code?: string };
  let errorKey = defaultErrorKey;

  // Priority order for error extraction:
  // 1. error.meta.details (field-specific errors with details array)
  // 2. response.message (top-level, from API interceptor - most common format)
  // 3. error.message (nested, from raw backend response)
  // 4. error.code / response.code (fallback)

  // Check for error details from backend (409 conflict errors with field info)
  if (
    errorResponse.error?.meta?.details &&
    Array.isArray(errorResponse.error.meta.details) &&
    errorResponse.error.meta.details.length > 0
  ) {
    // Get first error detail (highest priority - field-specific errors)
    const detail = errorResponse.error.meta.details[0];
    errorKey = detail.message || detail.field || defaultErrorKey;
  } else if (
    typeof response === 'object' &&
    response !== null &&
    'message' in response &&
    typeof (response as { message: unknown }).message === 'string'
  ) {
    // Use response message (from API interceptor format: { success: false, message: "...", ... })
    // API interceptor copies error.message to top-level message, so this is the processed format
    errorKey = (response as { message: string }).message;
  } else if (errorResponse.error?.message) {
    // Use error message from nested error object (raw backend format)
    // Note: This has same value as response.message when from API interceptor
    errorKey = errorResponse.error.message;
  } else if (errorResponse.error?.code) {
    // Use error code from backend as fallback
    errorKey = errorResponse.error.code;
  } else if (
    typeof response === 'object' &&
    response !== null &&
    'code' in response &&
    typeof (response as { code: unknown }).code === 'string'
  ) {
    // Use response code
    errorKey = (response as { code: string }).code;
  }

  // Normalize error key (uppercase, replace spaces with underscores)
  // If already normalized (uppercase with underscores), return as-is
  const normalized = normalizeErrorKey(errorKey);
  return normalized;
};

/**
 * Extract and translate error message from API response for toast notifications
 * Combines extraction and translation in one function
 *
 * @param response - API response that may contain error information
 * @param t - Translation function
 * @param defaultErrorKey - Default error key to use if extraction fails
 * @returns Translated error message
 *
 * @example
 * const errorMessage = extractAndTranslateApiError(response, t, 'register_failed');
 * toast.error(errorMessage);
 */
export const extractAndTranslateApiError = (
  response: unknown,
  t: (key: string, options?: { defaultValue?: string }) => string,
  defaultErrorKey: string = 'operation_failed'
): string => {
  const errorKey = extractApiErrorMessage(response, defaultErrorKey);
  return t(`error.${errorKey}`, { defaultValue: errorKey });
};
