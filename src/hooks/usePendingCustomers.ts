import { useState, useEffect, useCallback } from 'react';
import { classApi } from '@/services/api/classApi';
import type { PendingCustomer, GetPendingCustomersParams } from '@/types/Class';

/**
 * ============================================
 * usePendingCustomers Hook
 * ============================================
 *
 * Fetches eligible customers for enrollment in a specific class
 *
 * Eligible customers must satisfy ALL conditions:
 * ✅ 1. Have active contract with this service package
 * ✅ 2. Not already enrolled in this class (or already dropped)
 * ✅ 3. Contract has remaining sessions > 0
 * ✅ 4. Contract not expired
 * ✅ 5. Customer status = ACTIVE
 *
 * Features:
 * - Auto-fetch on mount
 * - Pagination support
 * - Search functionality
 * - Class availability info (available slots, is full)
 * - Manual refetch
 */

export const usePendingCustomers = (classId?: string, initialParams?: GetPendingCustomersParams) => {
  const [customers, setCustomers] = useState<PendingCustomer[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [classInfo, setClassInfo] = useState({
    availableSlots: 0,
    isFull: false,
    currentEnrollment: 0,
    capacity: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<GetPendingCustomersParams>(initialParams || {});

  /**
   * Fetch pending customers
   */
  const fetchCustomers = useCallback(
    async (pageNumber?: number) => {
      if (!classId) return;

      setLoading(true);
      setError(null);
      try {
        const response = await classApi.getPendingCustomers(classId, {
          ...params,
          page: pageNumber || params.page || 1
        });
        setCustomers(response.customers);
        setPagination(response.pagination);
        setClassInfo(response.classInfo);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch customers';
        setError(message);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    },
    [classId, params]
  );

  /**
   * Auto-fetch on mount and when dependencies change
   */
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  /**
   * Update filter parameters
   */
  const updateFilters = useCallback((newParams: Partial<GetPendingCustomersParams>) => {
    setParams((prev) => ({ ...prev, ...newParams, page: 1 }));
  }, []);

  /**
   * Go to specific page
   */
  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > pagination.totalPages) return;
      fetchCustomers(page);
    },
    [pagination.totalPages, fetchCustomers]
  );

  /**
   * Next page
   */
  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      goToPage(pagination.currentPage + 1);
    }
  }, [pagination, goToPage]);

  /**
   * Previous page
   */
  const prevPage = useCallback(() => {
    if (pagination.hasPrevPage) {
      goToPage(pagination.currentPage - 1);
    }
  }, [pagination, goToPage]);

  /**
   * Manual refetch
   */
  const refetch = useCallback(async () => {
    await fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    pagination,
    classInfo,
    loading,
    error,
    refetch,
    updateFilters,
    goToPage,
    nextPage,
    prevPage
  };
};
