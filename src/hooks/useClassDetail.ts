import { useState, useEffect, useCallback } from 'react';
import { classApi } from '@/services/api/classApi';
import type { Class } from '@/types/Class';

/**
 * ============================================
 * useClassDetail Hook
 * ============================================
 *
 * Handles fetching and managing single class detail with:
 * - Auto-fetch on mount if classId provided
 * - Loading and error states
 * - Manual refetch capability
 * - Dependency on classId
 */

export const useClassDetail = (classId?: string) => {
  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch class detail
   */
  const fetchClassDetail = useCallback(async () => {
    if (!classId) {
      setClassData(null);
      return;
    }

    setLoading(true);
    setError(null);
    const response = await classApi.getClassById(classId);
    setClassData(response);
    setLoading(false);
  }, [classId]);

  /**
   * Auto-fetch on mount and when classId changes
   */
  useEffect(() => {
    fetchClassDetail();
  }, [fetchClassDetail]);

  /**
   * Manual refetch
   */
  const refetch = useCallback(async () => {
    await fetchClassDetail();
  }, [fetchClassDetail]);

  /**
   * Update local class data without refetch
   * (useful for optimistic updates)
   */
  const updateLocalData = useCallback((updates: Partial<Class>) => {
    setClassData((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return {
    classData,
    loading,
    error,
    refetch,
    updateLocalData
  };
};
