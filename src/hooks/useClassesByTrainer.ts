import { useState, useEffect, useCallback } from 'react';
import { classApi } from '@/services/api/classApi';
import type { Class } from '@/types/Class';

interface UseClassesByTrainerOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook to fetch all classes assigned to a specific trainer (PT)
 * Used in WorkShift detail modal to show PT's classes
 *
 * @param staffId - The trainer's staff ID
 * @param options - Configuration options
 * @returns Object with classes, loading, error, and refetch function
 */
export const useClassesByTrainer = (staffId?: string | null, options: UseClassesByTrainerOptions = {}) => {
  const { enabled = true, refetchInterval } = options;

  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch function
  const fetchClasses = useCallback(async () => {
    if (!staffId || !enabled) {
      setClasses([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const data = await classApi.getClassesByTrainer(staffId);
    setClasses(data || []);
    setLoading(false);
  }, [staffId, enabled]);

  // Auto-fetch on mount and when staffId changes
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Optional: refetch at intervals
  useEffect(() => {
    if (!refetchInterval || refetchInterval <= 0) return;

    const interval = setInterval(fetchClasses, refetchInterval);
    return () => clearInterval(interval);
  }, [fetchClasses, refetchInterval]);

  return {
    classes,
    loading,
    error,
    refetch: fetchClasses
  };
};

export default useClassesByTrainer;
