import { useState, useEffect, useCallback } from 'react';
import { scheduleApi } from '@/services/api/scheduleApi';
import type { Schedule, CreateScheduleRequest, UpdateScheduleRequest, GetSchedulesParams } from '@/types/api/Schedule';
import { socketService } from '@/services/socket/socketService';
import type { UseDataReturn, UseCreateReturn, UseUpdateReturn, UseDeleteReturn } from '@/types/hooks/HookTypes';

interface UseScheduleReturn
  extends UseDataReturn<Schedule>,
    UseCreateReturn<Schedule, CreateScheduleRequest>,
    UseUpdateReturn<Schedule, UpdateScheduleRequest>,
    UseDeleteReturn {
  getScheduleById: (id: string) => Promise<Schedule>;
  getSchedules: (params?: GetSchedulesParams) => Promise<void>;
  refreshSchedules: () => Promise<void>;
}

export const useSchedule = (initialParams?: GetSchedulesParams): UseScheduleReturn => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Use socketService directly

  // Fetch schedules
  const getSchedules = useCallback(
    async (params?: GetSchedulesParams) => {
      setLoading(true);
      setError(null);
      const response = await scheduleApi.getSchedules(params || initialParams);
      if (response.data?.schedules) {
        setSchedules(response.data.schedules);
      }
      setLoading(false);
    },
    [initialParams]
  );

  // Create schedule
  const createSchedule = useCallback(async (scheduleData: CreateScheduleRequest): Promise<Schedule> => {
    setLoading(true);
    setError(null);
    const response = await scheduleApi.createSchedule(scheduleData);
    const newSchedule = response.data;

    // Add to local state
    setSchedules((prev) => [newSchedule, ...prev]);

    setLoading(false);
    return newSchedule;
  }, []);

  // Update schedule
  const updateSchedule = useCallback(async (id: string, updateData: UpdateScheduleRequest): Promise<Schedule> => {
    setLoading(true);
    setError(null);
    const response = await scheduleApi.updateSchedule(id, updateData);
    const updatedSchedule = response.data;

    // Update local state
    setSchedules((prev) => prev.map((schedule) => (schedule._id === id ? updatedSchedule : schedule)));

    setLoading(false);
    return updatedSchedule;
  }, []);

  // Delete schedule
  const deleteSchedule = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    await scheduleApi.deleteSchedule(id);

    // Remove from local state
    setSchedules((prev) => prev.filter((schedule) => schedule._id !== id));
    setLoading(false);
  }, []);

  // Get single schedule by ID
  const getScheduleById = useCallback(async (id: string): Promise<Schedule> => {
    setLoading(true);
    setError(null);
    const response = await scheduleApi.getScheduleById(id);
    setLoading(false);
    return response.data;
  }, []);

  // Refresh schedules
  const refreshSchedules = useCallback(async (): Promise<void> => {
    await getSchedules();
  }, [getSchedules]);

  // Socket event listeners
  useEffect(() => {
    const handleScheduleCreated = (data: Record<string, unknown>) => {
      const schedule = data as unknown as Schedule;
      setSchedules((prev) => [schedule, ...prev]);
    };

    const handleScheduleUpdated = (data: Record<string, unknown>) => {
      const schedule = data as unknown as Schedule;
      setSchedules((prev) => prev.map((s) => (s._id === schedule._id ? schedule : s)));
    };

    const handleScheduleDeleted = (data: Record<string, unknown>) => {
      const scheduleId = data as unknown as string;
      setSchedules((prev) => prev.filter((s) => s._id !== scheduleId));
    };

    // Listen for schedule events
    socketService.on('schedule-created', handleScheduleCreated);
    socketService.on('schedule-updated', handleScheduleUpdated);
    socketService.on('schedule-deleted', handleScheduleDeleted);

    return () => {
      socketService.off('schedule-created', handleScheduleCreated);
      socketService.off('schedule-updated', handleScheduleUpdated);
      socketService.off('schedule-deleted', handleScheduleDeleted);
    };
  }, []);

  // Load initial data
  useEffect(() => {
    if (initialParams) {
      getSchedules();
    }
  }, [getSchedules, initialParams]);

  return {
    data: schedules,
    loading,
    error,
    refetch: refreshSchedules,
    create: createSchedule,
    update: updateSchedule,
    delete: deleteSchedule,
    getScheduleById,
    getSchedules,
    refreshSchedules
  };
};
