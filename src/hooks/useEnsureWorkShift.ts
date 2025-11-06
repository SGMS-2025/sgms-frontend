import { useState } from 'react';
import { workShiftApi } from '@/services/api/workShiftApi';
import { calculateWorkShiftHours, isVirtualWorkShift } from '@/utils/workshiftUtils';
import type { WorkShift, VirtualWorkShift, CreateWorkShiftRequest } from '@/types/api/WorkShift';

interface UseEnsureWorkShiftReturn {
  ensureWorkShiftExists: (workShift: WorkShift | VirtualWorkShift) => Promise<WorkShift | null>;
  isCreating: boolean;
  error: string | null;
}

/**
 * Hook to ensure a workshift exists in database before operations like timeoff/reschedule
 * If workshift is virtual, creates it in DB first
 */
export const useEnsureWorkShift = (): UseEnsureWorkShiftReturn => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureWorkShiftExists = async (workShift: WorkShift | VirtualWorkShift): Promise<WorkShift | null> => {
    // If not virtual, return as-is
    if (!isVirtualWorkShift(workShift)) {
      return workShift;
    }

    // If virtual, create it in DB
    setIsCreating(true);
    setError(null);

    try {
      const totalHours = calculateWorkShiftHours(workShift.startTime, workShift.endTime);

      const createRequest: CreateWorkShiftRequest = {
        staffId: workShift.staffId._id,
        branchId: workShift.branchId._id,
        startTime: workShift.startTime,
        endTime: workShift.endTime,
        totalHours,
        dayOfTheWeek: workShift.dayOfTheWeek
      };

      const response = await workShiftApi.createWorkShift(createRequest);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to create workshift');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workshift';
      setError(errorMessage);
      console.error('Error creating workshift from virtual:', err);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    ensureWorkShiftExists,
    isCreating,
    error
  };
};
