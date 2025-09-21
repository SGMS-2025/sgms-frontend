import { useState, useEffect, useCallback } from 'react';
import { staffApi } from '@/services/api/staffApi';
import type { Staff } from '@/types/api/Staff';
import { useAuthState } from './useAuth';

export const useCurrentUserStaff = () => {
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthState();

  const fetchCurrentUserStaff = useCallback(async () => {
    if (!user) {
      setCurrentStaff(null);
      return;
    }

    // Only fetch staff info if user has STAFF role
    if (user.role !== 'STAFF') {
      setCurrentStaff(null);
      return;
    }

    setLoading(true);
    setError(null);

    const response = await staffApi.getCurrentUserStaff();

    if (response.success) {
      if (response.data) {
        setCurrentStaff(response.data);
      } else {
        setCurrentStaff(null);
      }
    } else {
      setError(response.message || 'Failed to fetch current user staff information');
      setCurrentStaff(null);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCurrentUserStaff();
  }, [fetchCurrentUserStaff]);

  return {
    currentStaff,
    loading,
    error,
    refetch: fetchCurrentUserStaff
  };
};
