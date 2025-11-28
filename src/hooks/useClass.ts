import { useState, useCallback } from 'react';
import { classApi } from '@/services/api/classApi';
import type { CreateClassDTO, UpdateClassDTO } from '@/types/Class';
import { toast } from 'sonner';

interface UseClassOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useClass = (options: UseClassOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create new class
   */
  const createClass = useCallback(
    async (data: CreateClassDTO) => {
      setLoading(true);
      setError(null);

      return classApi
        .createClass(data)
        .then((response) => {
          options.onSuccess?.();
          setLoading(false);
          return response;
        })
        .catch((error) => {
          const errorObj = error instanceof Error ? error : new Error('Failed to create class');
          setError(errorObj.message);
          options.onError?.(errorObj);
          setLoading(false);
          throw error;
        });
    },
    [options]
  );

  /**
   * Update existing class
   */
  const updateClass = useCallback(
    async (classId: string, data: UpdateClassDTO) => {
      setLoading(true);
      setError(null);

      return classApi
        .updateClass(classId, data)
        .then((response) => {
          options.onSuccess?.();
          setLoading(false);
          return response;
        })
        .catch((error) => {
          const errorObj = error instanceof Error ? error : new Error('Failed to update class');
          setError(errorObj.message);
          options.onError?.(errorObj);
          setLoading(false);
          throw error;
        });
    },
    [options]
  );

  /**
   * Toggle class status (ACTIVE <-> INACTIVE)
   */
  const toggleStatus = useCallback(
    async (classId: string) => {
      setLoading(true);
      setError(null);

      return classApi
        .toggleClassStatus(classId)
        .then((response) => {
          const newStatus = response.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          toast.success(`Class status updated to ${newStatus}`);
          options.onSuccess?.();
          setLoading(false);
          return response;
        })
        .catch((error) => {
          const errorObj = error instanceof Error ? error : new Error('Failed to toggle class status');
          setError(errorObj.message);
          options.onError?.(errorObj);
          setLoading(false);
          throw error;
        });
    },
    [options]
  );

  /**
   * Delete class
   */
  const deleteClass = useCallback(
    async (classId: string) => {
      setLoading(true);
      setError(null);

      return classApi
        .deleteClass(classId)
        .then((response) => {
          toast.success('Class deleted successfully');
          options.onSuccess?.();
          setLoading(false);
          return response;
        })
        .catch((error) => {
          const errorObj = error instanceof Error ? error : new Error('Failed to delete class');
          setError(errorObj.message);
          options.onError?.(errorObj);
          setLoading(false);
          throw error;
        });
    },
    [options]
  );

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createClass,
    updateClass,
    toggleStatus,
    deleteClass,
    loading,
    error,
    clearError
  };
};
