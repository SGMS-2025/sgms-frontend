import { useState, useEffect, useCallback } from 'react';
import { scheduleApi } from '@/services/api/scheduleApi';
import type { Schedule, GetSchedulesParams } from '@/types/api/Schedule';

interface UsePTSchedulesOptions {
  enabled?: boolean;
  refetchInterval?: number;
  type?: 'PERSONAL_TRAINING' | 'CLASS' | 'ALL';
  status?: Schedule['status'];
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Hook to fetch PT 1-1 schedules (PERSONAL_TRAINING type) for a specific trainer
 * Used in WorkShift detail modal to show PT's 1-1 schedules
 *
 * @param staffId - The trainer's staff ID (Staff._id)
 * @param options - Configuration options
 * @returns Object with schedules, loading, error, and refetch function
 */
export const usePTSchedules = (staffId?: string | null, options: UsePTSchedulesOptions = {}) => {
  const { enabled = true, refetchInterval, type = 'PERSONAL_TRAINING', status, dateFrom, dateTo } = options;

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch function
  const fetchSchedules = useCallback(async () => {
    if (!staffId || !enabled) {
      setSchedules([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: GetSchedulesParams = {
        ptId: staffId,
        limit: 100,
        page: 1
      };

      if (type !== 'ALL') {
        params.type = type;
      }

      if (status) {
        params.status = status;
      }

      if (dateFrom) {
        params.dateFrom = dateFrom;
      }

      if (dateTo) {
        params.dateTo = dateTo;
      }

      const response = await scheduleApi.getSchedules(params);

      if (response.success) {
        // Response structure from PaginationHelper:
        const schedulesData = response.data.data || response.data.schedules || [];

        setSchedules(schedulesData);
      } else {
        console.error('[usePTSchedules] Failed to fetch schedules:', response.message);
        setError(new Error(response.message || 'Failed to fetch schedules'));
        setSchedules([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch schedules'));
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [staffId, enabled, type, status, dateFrom, dateTo]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Optional: refetch at intervals
  useEffect(() => {
    if (!refetchInterval || refetchInterval <= 0) return;

    const interval = setInterval(fetchSchedules, refetchInterval);
    return () => clearInterval(interval);
  }, [fetchSchedules, refetchInterval]);

  return {
    schedules,
    loading,
    error,
    refetch: fetchSchedules
  };
};

export default usePTSchedules;
