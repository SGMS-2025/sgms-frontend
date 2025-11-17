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
      const response = await classApi.createClass(data);
      toast.success('Class created successfully');
      options.onSuccess?.();
      setLoading(false);
      return response;
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
      const response = await classApi.updateClass(classId, data);
      toast.success('Class updated successfully');
      options.onSuccess?.();
      setLoading(false);
      return response;
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
      const response = await classApi.toggleClassStatus(classId);
      const newStatus = response.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      toast.success(`Class status updated to ${newStatus}`);
      options.onSuccess?.();
      setLoading(false);
      return response;
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
      const response = await classApi.deleteClass(classId);
      toast.success('Class deleted successfully');
      options.onSuccess?.();
      setLoading(false);
      return response;
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
