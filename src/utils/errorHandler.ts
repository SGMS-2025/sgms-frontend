import { toast } from 'sonner';
import type { AsyncOperation, SuccessCallback, ErrorCallback, ErrorHandlerOptions } from '@/types/errorHandler';

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
