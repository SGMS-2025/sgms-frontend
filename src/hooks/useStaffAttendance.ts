import { useState, useCallback, useEffect } from 'react';
import { attendanceApi } from '@/services/api/attendanceApi';
import { toast } from 'sonner';
import type { StaffAttendance } from '@/types/api/StaffAttendance';
import { useTranslation } from 'react-i18next';
import type { GetAttendanceListParams } from '@/types/api/StaffAttendance';

export interface ToggleAttendanceParams {
  username?: string;
  staffId?: string;
  branchId?: string;
  workShiftId?: string;
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
