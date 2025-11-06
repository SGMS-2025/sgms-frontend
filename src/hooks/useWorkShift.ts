import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { workShiftApi } from '@/services/api/workShiftApi';
import { isVirtualWorkShift } from '@/utils/workshiftUtils';
import type {
  WorkShift,
  WorkShiftStats,
  WorkShiftListParams,
  CreateWorkShiftRequest,
  UpdateWorkShiftRequest,
  UseWorkShiftListReturn
} from '@/types/api/WorkShift';

export const useWorkShiftList = (initialParams: WorkShiftListParams = {}): UseWorkShiftListReturn => {
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [stats, setStats] = useState<WorkShiftStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseWorkShiftListReturn['pagination']>(null);
  const [params, setParams] = useState<WorkShiftListParams>(initialParams);
  const { t } = useTranslation();

  const fetchWorkShifts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const requestParams = {
      limit: 10,
      ...params
    };

    const [workShiftsResponse, statsResponse] = await Promise.all([
      workShiftApi.getWorkShifts(requestParams),
      workShiftApi.getWorkShiftStats()
    ]);

    // Handle work shifts response
    if (workShiftsResponse.success) {
      setWorkShifts(workShiftsResponse.data.data);

      // Transform pagination data to match frontend interface
      const paginationData = workShiftsResponse.data.pagination;
      const transformedPagination = {
        currentPage: paginationData.page,
        totalPages: paginationData.pages,
        totalItems: paginationData.total,
        itemsPerPage: paginationData.limit,
        hasNextPage: paginationData.page < paginationData.pages,
        hasPrevPage: paginationData.page > 1
      };
      setPagination(transformedPagination);
    } else {
      setError(workShiftsResponse.message || 'Failed to fetch work shifts');
      toast.error(t('workshift.fetch_error'));
    }

    // Handle stats response
    if (statsResponse.success) {
      setStats(statsResponse.data);
    } else {
      // Stats error is not critical, just log it
      console.warn('Failed to fetch work shift stats:', statsResponse.message);
    }

    setLoading(false);
  }, [params, t]);

  const refetch = useCallback(async () => {
    await fetchWorkShifts();
  }, [fetchWorkShifts]);

  const updateFilters = useCallback((newFilters: Partial<WorkShiftListParams>) => {
    setParams((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  useEffect(() => {
    fetchWorkShifts();
  }, [fetchWorkShifts]);

  useEffect(() => {
    const handleRealtimeNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const notification = customEvent.detail;

      // Check if it's a WorkShift notification
      if (notification.category === 'workshift' || notification.type?.includes('workshift')) {
        // Refetch data after a short delay to ensure backend has processed
        setTimeout(() => {
          refetch();
        }, 500);
      }
    };

    // Listen to global realtime-notification event
    globalThis.addEventListener('realtime-notification', handleRealtimeNotification);

    return () => {
      globalThis.removeEventListener('realtime-notification', handleRealtimeNotification);
    };
  }, [refetch]);

  return {
    workShifts,
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
  } else if (message === 'WORKSHIFT_NOT_FOUND') {
    return t('error.WORKSHIFT_NOT_FOUND');
  } else if (message === 'CANNOT_DISABLE_PAST_SHIFT') {
    return t('error.CANNOT_DISABLE_PAST_SHIFT');
  } else if (message === 'MANAGER_CANNOT_CREATE_WORKSHIFT') {
    return t('error.MANAGER_CANNOT_CREATE_WORKSHIFT');
  }

  // Return the original message or fallback if no specific localization found
  return message || t(fallbackKey);
};

// Hook for work shift operations
export const useWorkShiftOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const createWorkShift = useCallback(
    async (data: CreateWorkShiftRequest) => {
      setLoading(true);
      setError(null);

      const response = await workShiftApi.createWorkShift(data);

      if (response.success) {
        toast.success(t('workshift.created_successfully'), {
          id: 'workshift-create-success' // Unique ID to prevent duplicates
        });
        setLoading(false);
        return response.data;
      } else {
        const errorMessage = localizeErrorMessage(response.message, t, 'workshift.create_error');
        setError(errorMessage);
        toast.error(errorMessage, {
          id: 'workshift-create-error' // Unique ID to prevent duplicates
        });
        setLoading(false);
        return null;
      }
    },
    [t]
  );

  const updateWorkShift = useCallback(
    async (id: string, data: UpdateWorkShiftRequest) => {
      // Don't update if it's a virtual workshift
      if (isVirtualWorkShift({ _id: id })) {
        toast.error(t('workshift.cannot_edit_virtual'), {
          id: 'workshift-virtual-error'
        });
        return null;
      }

      setLoading(true);
      setError(null);

      const response = await workShiftApi.updateWorkShift(id, data);

      if (response.success) {
        toast.success(t('workshift.updated_successfully'), {
          id: 'workshift-update-success'
        });
        setLoading(false);
        return response.data;
      } else {
        const errorMessage = localizeErrorMessage(response.message, t, 'workshift.update_error');
        setError(errorMessage);
        toast.error(errorMessage, {
          id: 'workshift-update-error'
        });
        setLoading(false);
        return null;
      }
    },
    [t]
  );

  const deleteWorkShift = useCallback(
    async (id: string) => {
      // Don't delete if it's a virtual workshift
      if (isVirtualWorkShift({ _id: id })) {
        toast.error(t('workshift.cannot_delete_virtual'), {
          id: 'workshift-virtual-error'
        });
        return false;
      }

      setLoading(true);
      setError(null);

      const response = await workShiftApi.deleteWorkShift(id);

      if (response.success) {
        toast.success(t('workshift.deleted_successfully'), {
          id: 'workshift-delete-success'
        });
        setLoading(false);
        return true;
      } else {
        setError(response.message || t('workshift.delete_error'));
        toast.error(response.message || t('workshift.delete_error'), {
          id: 'workshift-delete-error'
        });
        setLoading(false);
        return false;
      }
    },
    [t]
  );

  const disableWorkShift = useCallback(
    async (id: string) => {
      // Don't disable if it's a virtual workshift
      if (isVirtualWorkShift({ _id: id })) {
        toast.error(t('workshift.cannot_disable_virtual'), {
          id: 'workshift-virtual-error'
        });
        return null;
      }

      setLoading(true);
      setError(null);

      const response = await workShiftApi.disableWorkShift(id);

      if (response.success) {
        toast.success(t('workshift.disabled_successfully'), {
          id: 'workshift-disable-success'
        });
        setLoading(false);
        return response.data;
      } else {
        const errorMessage = localizeErrorMessage(response.message, t, 'workshift.disable_error');
        setError(errorMessage);
        toast.error(errorMessage, {
          id: 'workshift-disable-error'
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
    createWorkShift,
    updateWorkShift,
    deleteWorkShift,
    disableWorkShift
  };
};

// Hook for single work shift
export const useWorkShift = (id: string) => {
  const [workShift, setWorkShift] = useState<WorkShift | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const fetchWorkShift = useCallback(async () => {
    if (!id) return;

    // Don't fetch if it's a virtual workshift
    if (isVirtualWorkShift({ _id: id })) {
      setLoading(false);
      setError(null);
      setWorkShift(null);
      return;
    }

    setLoading(true);
    setError(null);

    const response = await workShiftApi.getWorkShiftById(id);

    if (response.success) {
      setWorkShift(response.data);
    } else {
      setError(response.message || t('workshift.fetch_error'));
      toast.error(response.message || t('workshift.fetch_error'));
    }

    setLoading(false);
  }, [id, t]);

  useEffect(() => {
    fetchWorkShift();
  }, [fetchWorkShift]);

  return {
    workShift,
    loading,
    error,
    refetch: fetchWorkShift
  };
};
