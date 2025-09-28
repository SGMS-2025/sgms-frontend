import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { workShiftApi } from '@/services/api/workShiftApi';
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
        toast.success(t('workshift.created_successfully'));
        setLoading(false);
        return response.data;
      } else {
        setError(response.message || t('workshift.create_error'));
        toast.error(response.message || t('workshift.create_error'));
        setLoading(false);
        return null;
      }
    },
    [t]
  );

  const updateWorkShift = useCallback(
    async (id: string, data: UpdateWorkShiftRequest) => {
      setLoading(true);
      setError(null);

      const response = await workShiftApi.updateWorkShift(id, data);

      if (response.success) {
        toast.success(t('workshift.updated_successfully'));
        setLoading(false);
        return response.data;
      } else {
        setError(response.message || t('workshift.update_error'));
        toast.error(response.message || t('workshift.update_error'));
        setLoading(false);
        return null;
      }
    },
    [t]
  );

  const deleteWorkShift = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      const response = await workShiftApi.deleteWorkShift(id);

      if (response.success) {
        toast.success(t('workshift.deleted_successfully'));
        setLoading(false);
        return true;
      } else {
        setError(response.message || t('workshift.delete_error'));
        toast.error(response.message || t('workshift.delete_error'));
        setLoading(false);
        return false;
      }
    },
    [t]
  );

  const disableWorkShift = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      const response = await workShiftApi.disableWorkShift(id);

      if (response.success) {
        toast.success(t('workshift.disabled_successfully'));
        setLoading(false);
        return response.data;
      } else {
        setError(response.message || t('workshift.disable_error'));
        toast.error(response.message || t('workshift.disable_error'));
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
