/**
 * Generic result type for async operations
 */
export interface AsyncResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: Error | string;
}

/**
 * Error handler operation type
 */
export type AsyncOperation<T = unknown> = () => Promise<AsyncResult<T>>;

/**
 * Success callback type
 */
export type SuccessCallback<T = unknown> = (data: T) => void;

/**
 * Error callback type
 */
export type ErrorCallback = (error: Error | string) => void;

/**
 * Error handler options
 */
export interface ErrorHandlerOptions {
  showSuccess?: boolean;
  showError?: boolean;
  successMessage?: string;
  errorMessage?: string;
}
