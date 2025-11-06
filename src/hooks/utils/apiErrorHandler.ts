/**
 * Extended Error type with API error metadata
 */
export type ApiErrorWithMeta = Error & {
  meta?: { details?: Array<{ field: string; message: string }>; field?: string };
  code?: string;
  statusCode?: number;
};

/**
 * API Response type when success is false
 */
export type FailedApiResponse = {
  success: false;
  message: string;
  error?: {
    message?: string;
    code?: string;
    statusCode?: number;
    meta?: { details?: Array<{ field: string; message: string }>; field?: string };
  };
  code?: string;
  statusCode?: number;
};

/**
 * Creates an error object with metadata from an API response for inline form error handling
 * @param response - The API response that failed (success: false)
 * @param defaultMessage - Default error message if response.message is not available
 * @returns Error object with meta information, wrapped in a rejected Promise
 */
export function createErrorWithMeta(response: FailedApiResponse, defaultMessage: string): Promise<never> {
  const errorMessage = response.message || defaultMessage;
  const errorWithMeta = new Error(errorMessage) as ApiErrorWithMeta;

  // Extract error metadata from response
  errorWithMeta.meta = response.error?.meta || {};
  errorWithMeta.code = response.code || response.error?.code;
  errorWithMeta.statusCode = response.statusCode || response.error?.statusCode;

  // Return error object in a rejected Promise
  return Promise.reject(errorWithMeta);
}
