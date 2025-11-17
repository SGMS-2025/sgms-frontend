import { useState, useEffect, useCallback, useRef } from 'react';
import { classApi } from '@/services/api/classApi';
import type { Class, GetClassesParams } from '@/types/Class';

export const useClassList = (initialParams: GetClassesParams = {}) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<GetClassesParams>(initialParams);

  // Update params when initialParams change (using ref to track previous values)
  const prevParamsRef = useRef<GetClassesParams>(initialParams);

  useEffect(() => {
    // Only update if values actually changed
    const prev = prevParamsRef.current;
    const hasChanged =
      prev.branchId !== initialParams.branchId ||
      prev.status !== initialParams.status ||
      prev.search !== initialParams.search ||
      prev.servicePackageId !== initialParams.servicePackageId ||
      prev.page !== initialParams.page ||
      prev.limit !== initialParams.limit;

    if (hasChanged) {
      prevParamsRef.current = initialParams;
      setParams((prev) => ({ ...prev, ...initialParams }));
    }
  }, [
    initialParams.branchId,
    initialParams.status,
    initialParams.search,
    initialParams.servicePackageId,
    initialParams.page,
    initialParams.limit
  ]);

  /**
   * Fetch classes with current parameters
   */
  const fetchClasses = useCallback(
    async (pageNumber?: number) => {
      setLoading(true);
      setError(null);
      try {
        const response = await classApi.getClasses({
          ...params,
          page: pageNumber || params.page || 1
        });
        setClasses(response.classes);
        setPagination(response.pagination);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch classes';
        setError(message);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    },
    [params]
  );

  /**
   * Auto-fetch on mount and when params change
   */
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  /**
   * Update filter parameters
   */
  const updateFilters = useCallback((newParams: Partial<GetClassesParams>) => {
    setParams((prev) => ({ ...prev, ...newParams, page: 1 })); // Reset to page 1 on filter change
  }, []);

  /**
   * Go to specific page
   */
  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > pagination.totalPages) return;
      fetchClasses(page);
    },
    [pagination.totalPages, fetchClasses]
  );

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      goToPage(pagination.currentPage + 1);
    }
  }, [pagination, goToPage]);

  /**
   * Go to previous page
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
    await fetchClasses();
  }, [fetchClasses]);

  return {
    classes,
    pagination,
    loading,
    error,
    refetch,
    updateFilters,
    goToPage,
    nextPage,
    prevPage
  };
};
