import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { timeOffApi } from '@/services/api/timeOffApi';
import type {
  TimeOff,
  TimeOffStats,
  TimeOffListParams,
  CreateTimeOffRequest,
  CreateTimeOffResponse,
  UpdateTimeOffRequest,
  UseTimeOffListReturn
} from '@/types/api/TimeOff';

export const useTimeOffList = (initialParams: TimeOffListParams = {}): UseTimeOffListReturn => {
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [stats, setStats] = useState<TimeOffStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseTimeOffListReturn['pagination']>(null);
  const [params, setParams] = useState<TimeOffListParams>(initialParams);
  const { t } = useTranslation();

  const fetchTimeOffs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const requestParams = {
      limit: 10,
      ...params
    };

    const [timeOffsResponse, statsResponse] = await Promise.all([
      timeOffApi.getTimeOffs(requestParams),
      timeOffApi.getTimeOffStats()
    ]);

    // Handle time offs response
    if (timeOffsResponse.success) {
      setTimeOffs(timeOffsResponse.data.data);

      // Use pagination data directly from common types
      setPagination(timeOffsResponse.data.pagination);
    } else {
      setError(timeOffsResponse.message || 'Failed to fetch time off requests');
      toast.error(t('timeoff.fetch_error'));
    }

    // Handle stats response
    if (statsResponse.success) {
      setStats(statsResponse.data);
    } else {
      // Stats error is not critical, just log it
      console.warn('Failed to fetch time off stats:', statsResponse.message);
    }

    setLoading(false);
  }, [params, t]);

  const refetch = useCallback(async () => {
    await fetchTimeOffs();
  }, [fetchTimeOffs]);

  const updateFilters = useCallback((newFilters: Partial<TimeOffListParams>) => {
    setParams((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  useEffect(() => {
    fetchTimeOffs();
  }, [fetchTimeOffs]);

  useEffect(() => {
    const handleRealtimeNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const notification = customEvent.detail;

      if (notification.category === 'timeoff' || notification.type?.includes('timeoff')) {
        setTimeout(() => {
          refetch();
        }, 500);
      }
    };

    globalThis.addEventListener('realtime-notification', handleRealtimeNotification);

    return () => {
      globalThis.removeEventListener('realtime-notification', handleRealtimeNotification);
    };
  }, [refetch]);

  return {
    timeOffs,
    stats,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    goToPage
  };
};

// Helper function to localize error messages
const localizeErrorMessage = (message: string, t: (key: string) => string, fallbackKey: string): string => {
  // Check for specific backend error codes and localize them
  if (message === 'TIME_CONFLICT') {
    return t('error.TIME_CONFLICT');
  } else if (message === 'INVALID_TIME_RANGE') {
    return t('error.INVALID_TIME_RANGE');
  } else if (message === 'MISSING_FIELDS') {
    return t('error.MISSING_FIELDS');
  } else if (message === 'TIMEOFF_NOT_FOUND') {
    return t('error.TIMEOFF_NOT_FOUND');
  } else if (message === 'CANNOT_CANCEL_APPROVED_TIMEOFF') {
    return t('error.CANNOT_CANCEL_APPROVED_TIMEOFF');
  } else if (message === 'INSUFFICIENT_PERMISSIONS') {
    return t('error.INSUFFICIENT_PERMISSIONS');
  } else if (message === 'CANNOT_APPROVE_OWN_REQUEST') {
    return t('error.CANNOT_APPROVE_OWN_REQUEST');
  } else if (message === 'TIME_OFF_ADVANCE_NOTICE_REQUIRED') {
    return t('error.TIME_OFF_ADVANCE_NOTICE_REQUIRED');
  }

  // Return the original message or fallback if no specific localization found
  return message || t(fallbackKey);
};

// Hook for time off operations
export const useTimeOffOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const createTimeOff = useCallback(
    async (data: CreateTimeOffRequest): Promise<CreateTimeOffResponse | null> => {
      setLoading(true);
      setError(null);

      const response = await timeOffApi.createTimeOff(data);

      if (response.success) {
        // Handle response with conflict info
        const responseData = response.data;

        if (responseData.hasConflicts) {
          // Show warning toast for conflicts
          toast.warning(t('warning.TIME_OFF_CONFLICTS_WITH_WORKSHIFTS'), {
            id: 'timeoff-create-conflict-warning',
            duration: 5000
          });

          // Also show success message
          toast.success(t('success.TIME_OFF_CREATED_WITH_CONFLICTS'), {
            id: 'timeoff-create-success-with-conflicts'
          });
        } else {
          // Normal success message
          toast.success(t('timeoff.created_successfully'), {
            id: 'timeoff-create-success'
          });
        }

        setLoading(false);
        return responseData;
      } else {
        const errorMessage = localizeErrorMessage(response.message, t, 'timeoff.create_error');
        setError(errorMessage);
        toast.error(errorMessage, {
          id: 'timeoff-create-error'
        });
        setLoading(false);
        return null;
      }
    },
    [t]
  );

  const updateTimeOff = useCallback(
    async (id: string, data: UpdateTimeOffRequest) => {
      setLoading(true);
      setError(null);

      const response = await timeOffApi.updateTimeOff(id, data);

      if (response.success) {
        toast.success(t('timeoff.updated_successfully'), {
          id: 'timeoff-update-success'
        });
        setLoading(false);
        return response.data;
      } else {
        const errorMessage = localizeErrorMessage(response.message, t, 'timeoff.update_error');
        setError(errorMessage);
        toast.error(errorMessage, {
          id: 'timeoff-update-error'
        });
        setLoading(false);
        return null;
      }
    },
    [t]
  );

  const deleteTimeOff = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      const response = await timeOffApi.deleteTimeOff(id);

      if (response.success) {
        toast.success(t('timeoff.deleted_successfully'), {
          id: 'timeoff-delete-success'
        });
        setLoading(false);
        return true;
      } else {
        setError(response.message || t('timeoff.delete_error'));
        toast.error(response.message || t('timeoff.delete_error'), {
          id: 'timeoff-delete-error'
        });
        setLoading(false);
        return false;
      }
    },
    [t]
  );

  const approveTimeOff = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      const response = await timeOffApi.approveTimeOff(id);

      if (response.success) {
        toast.success(t('timeoff.approved_successfully'), {
          id: 'timeoff-approve-success'
        });
        setLoading(false);
        return response.data;
      } else {
        // Handle specific error cases
        let errorMessage;
        if (response.message === 'ONLY_PENDING_TIME_OFF_CAN_BE_APPROVED') {
          errorMessage = t('error.ONLY_PENDING_TIME_OFF_CAN_BE_APPROVED');
        } else {
          errorMessage = localizeErrorMessage(response.message, t, 'timeoff.approve_error');
        }

        setError(errorMessage);
        toast.error(errorMessage, {
          id: 'timeoff-approve-error'
        });
        setLoading(false);
        return null;
      }
    },
    [t]
  );

  const rejectTimeOff = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      const response = await timeOffApi.rejectTimeOff(id);

      if (response.success) {
        toast.success(t('timeoff.rejected_successfully'), {
          id: 'timeoff-reject-success'
        });
        setLoading(false);
        return response.data;
      } else {
        const errorMessage = localizeErrorMessage(response.message, t, 'timeoff.reject_error');
        setError(errorMessage);
        toast.error(errorMessage, {
          id: 'timeoff-reject-error'
        });
        setLoading(false);
        return null;
      }
    },
    [t]
  );

  const cancelTimeOff = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      const response = await timeOffApi.cancelTimeOff(id);

      if (response.success) {
        toast.success(t('timeoff.cancelled_successfully'), {
          id: 'timeoff-cancel-success'
        });
        setLoading(false);
        return response.data;
      } else {
        const errorMessage = localizeErrorMessage(response.message, t, 'timeoff.cancel_error');
        setError(errorMessage);
        toast.error(errorMessage, {
          id: 'timeoff-cancel-error'
        });
        setLoading(false);
        return null;
      }
    },
    [t]
  );

  return {
    loading,
    error,
    createTimeOff,
    updateTimeOff,
    deleteTimeOff,
    approveTimeOff,
    rejectTimeOff,
    cancelTimeOff
  };
};

// Hook for single time off
export const useTimeOff = (id: string) => {
  const [timeOff, setTimeOff] = useState<TimeOff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const fetchTimeOff = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    const response = await timeOffApi.getTimeOffById(id);

    if (response.success) {
      setTimeOff(response.data);
    } else {
      setError(response.message || t('timeoff.fetch_error'));
      toast.error(response.message || t('timeoff.fetch_error'));
    }

    setLoading(false);
  }, [id, t]);

  useEffect(() => {
    fetchTimeOff();
  }, [fetchTimeOff]);

  return {
    timeOff,
    loading,
    error,
    refetch: fetchTimeOff
  };
};

// Hook for time off requests by staff
export const useTimeOffsByStaff = (staffId: string, params: TimeOffListParams = {}) => {
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const fetchTimeOffsByStaff = useCallback(async () => {
    if (!staffId) return;

    setLoading(true);
    setError(null);

    const response = await timeOffApi.getTimeOffsByStaff(staffId, params);

    if (response.success) {
      setTimeOffs(response.data.data);
    } else {
      setError(response.message || t('timeoff.fetch_error'));
      toast.error(response.message || t('timeoff.fetch_error'));
    }

    setLoading(false);
  }, [staffId, params, t]);

  useEffect(() => {
    fetchTimeOffsByStaff();
  }, [fetchTimeOffsByStaff]);

  return {
    timeOffs,
    loading,
    error,
    refetch: fetchTimeOffsByStaff
  };
};
