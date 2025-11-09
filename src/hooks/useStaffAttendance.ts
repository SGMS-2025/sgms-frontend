import { useState, useCallback, useEffect } from 'react';
import { attendanceApi } from '@/services/api/attendanceApi';
import { toast } from 'sonner';
import type {
  StaffAttendance,
  GetStaffAttendanceHistoryParams,
  StaffAttendanceHistoryResponse,
  GetAttendanceListParams
} from '@/types/api/StaffAttendance';
import { useTranslation } from 'react-i18next';

export interface ToggleAttendanceParams {
  username?: string;
  staffId?: string;
  branchId?: string;
  notes?: string;
}

export const useStaffAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const toggleAttendance = useCallback(async (data: ToggleAttendanceParams): Promise<StaffAttendance> => {
    setLoading(true);
    setError(null);
    const response = await attendanceApi.toggleAttendance(data);
    if (response.success) {
      setLoading(false);
      return response.data;
    }
    const fallbackMsg = t('attendance.error.toggle_failed');
    const messageKey = response.message ? `attendance.error.values.${response.message}` : '';
    const translated = messageKey ? t(messageKey) : '';
    const errorMessage = translated && translated !== messageKey ? translated : response.message || fallbackMsg;
    setError(errorMessage);
    setLoading(false);
    toast.error(errorMessage);
    return Promise.reject(new Error(errorMessage));
  }, []);

  return {
    toggleAttendance,
    loading,
    error
  };
};

export type AttendanceHistoryFilters = Partial<GetAttendanceListParams>;

export const useAttendanceHistory = (initialFilters?: AttendanceHistoryFilters) => {
  const [filters, setFilters] = useState<AttendanceHistoryFilters>(initialFilters || { sort: '-checkInTime' });
  const [items, setItems] = useState<StaffAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await attendanceApi.getAttendanceList(filters);
    if (res.success) {
      setItems(res.data);
    } else {
      setError(res.message || 'UNKNOWN_ERROR');
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      const res = await attendanceApi.getAttendanceList(filters);
      if (cancelled) return;
      if (res.success) {
        setItems(res.data);
      } else {
        setError(res.message || 'UNKNOWN_ERROR');
      }
      if (!cancelled) setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  return {
    items,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchAttendance
  };
};

// New hook for staff attendance history by staffId
export const useStaffAttendanceHistory = (staffId: string | null, initialFilters?: GetStaffAttendanceHistoryParams) => {
  const [filters, setFilters] = useState<GetStaffAttendanceHistoryParams>({
    page: 1,
    limit: 10,
    sortBy: 'checkInTime',
    sortOrder: 'desc',
    ...initialFilters
  });
  const [items, setItems] = useState<StaffAttendance[]>([]);
  const [pagination, setPagination] = useState<StaffAttendanceHistoryResponse['meta'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const fetchStaffAttendanceHistory = useCallback(async () => {
    if (!staffId) {
      setItems([]);
      setPagination(null);
      return;
    }

    setLoading(true);
    setError(null);

    const response = await attendanceApi.getStaffAttendanceHistory(staffId, filters);
    if (response.success) {
      setItems(response.data);
      setPagination(response.meta);
    } else {
      const errorMessage = response.message || t('attendance.error.fetch_failed');
      setError(errorMessage);
    }
    setLoading(false);
  }, [staffId, filters, t]);

  useEffect(() => {
    fetchStaffAttendanceHistory();
  }, [fetchStaffAttendanceHistory]);

  // Reset filters when modal opens (any time staffId is provided)
  useEffect(() => {
    if (staffId && initialFilters) {
      setFilters(initialFilters);
    }
  }, [staffId, initialFilters]);

  const updateFilters = useCallback((newFilters: Partial<GetStaffAttendanceHistoryParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      updateFilters({ page });
    },
    [updateFilters]
  );

  return {
    items,
    pagination,
    loading,
    error,
    filters,
    setFilters: updateFilters,
    goToPage,
    refetch: fetchStaffAttendanceHistory
  };
};
