import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  PTCustomer,
  UsePTCustomerListOptions,
  PTCustomerPagination,
  UsePTCustomerListReturn,
  PTCustomerStats,
  PTCustomerFilters
} from '@/types/api/Customer';
import { customerApi } from '@/services/api/customerApi';

export const usePTCustomerList = (options: UsePTCustomerListOptions): UsePTCustomerListReturn => {
  const [customerList, setCustomerList] = useState<PTCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PTCustomerPagination | null>(null);
  const [params, setParams] = useState<UsePTCustomerListOptions>(() => {
    return options;
  });

  // Update params when options change (but preserve page changes from goToPage)
  // Only update if values actually changed to prevent unnecessary re-renders
  useEffect(() => {
    setParams((prevParams) => {
      // Check if any value actually changed
      const hasChanged =
        prevParams.trainerId !== options.trainerId ||
        prevParams.limit !== options.limit ||
        prevParams.branchId !== options.branchId ||
        prevParams.status !== options.status ||
        prevParams.packageType !== options.packageType;

      // If nothing changed, return previous params to prevent unnecessary updates
      if (!hasChanged) {
        return prevParams;
      }

      const newParams = {
        ...options,
        page: prevParams.page || options.page || 1 // Preserve current page if it exists
      };
      return newParams;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.limit, options.branchId, options.status, options.packageType, options.trainerId]);

  const fetchCustomers = useCallback(async () => {
    if (!params.trainerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const requestParams = {
      limit: params.limit || 10,
      page: params.page || 1,
      sortBy: 'contractStartDate',
      sortOrder: 'desc' as const,
      ...(params.branchId && { branchId: params.branchId }),
      ...(params.status && { status: params.status }),
      ...(params.packageType && { packageType: params.packageType })
    };

    const response = await customerApi.getCustomersByTrainer(params.trainerId, requestParams);

    if (response.success) {
      setCustomerList(response.data.customers);

      // Transform pagination data
      const paginationData = response.data.pagination;
      setPagination({
        page: paginationData.page,
        limit: paginationData.limit,
        total: paginationData.total,
        totalPages: paginationData.totalPages,
        hasNext: paginationData.hasNext,
        hasPrev: paginationData.hasPrev
      });
    } else {
      setError(response.message || 'Failed to fetch PT customers');
    }

    setLoading(false);
  }, [params.trainerId, params.limit, params.page, params.branchId, params.status, params.packageType]);

  const refetch = useCallback(async () => {
    await fetchCustomers();
  }, [fetchCustomers]);

  const goToPage = useCallback((page: number) => {
    setParams((prev) => {
      const newParams = { ...prev, page };
      return newParams;
    });
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Fetch stats
  const [stats, setStats] = useState<PTCustomerStats>({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!params.trainerId) return;

      try {
        const response = await customerApi.getTrainerCustomerStats(params.trainerId, {
          branchId: params.branchId,
          packageType: params.packageType
        });

        if (response.success && response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch customer stats:', error);
        // Keep default stats on error
      }
    };

    fetchStats();
  }, [params.trainerId, params.branchId, params.packageType]);

  return {
    customerList,
    loading,
    error,
    pagination,
    stats,
    refetch,
    goToPage
  };
};

// Hook for filtering and sorting PT customers
export const usePTCustomerFilters = (customers: PTCustomer[]) => {
  const [filters, setFilters] = useState<PTCustomerFilters>({
    searchTerm: '',
    statusFilter: 'ALL',
    expirationFilter: 'ALL',
    sessionsFilter: 'ALL',
    sortBy: 'NEAREST_EXPIRATION'
  });

  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.searchTerm);
    }, 350);
    return () => clearTimeout(timer);
  }, [filters.searchTerm]);

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem('ptCustomerFilters', JSON.stringify(filters));
  }, [filters]);

  // Load filters from localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem('ptCustomerFilters');
    if (savedFilters) {
      const parsedFilters = JSON.parse(savedFilters);
      setFilters((prev) => ({ ...prev, ...parsedFilters }));
    }
  }, []);

  const filteredAndSortedCustomers = useMemo(() => {
    const filtered = customers.filter((customer) => {
      // Search filter
      const matchesSearch =
        customer.fullName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        customer.phone.includes(debouncedSearch);

      // Status filter
      const matchesStatus = filters.statusFilter === 'ALL' || customer.package.status === filters.statusFilter;

      // Expiration filter
      let matchesExpiration = true;
      if (filters.expirationFilter !== 'ALL') {
        const endDate = new Date(customer.package.endDate);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (filters.expirationFilter === '7') {
          matchesExpiration = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
        } else if (filters.expirationFilter === '14') {
          matchesExpiration = daysUntilExpiry <= 14 && daysUntilExpiry > 0;
        } else if (filters.expirationFilter === '30') {
          matchesExpiration = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
        }
      }

      // Sessions filter
      let matchesSessions = true;
      if (filters.sessionsFilter !== 'ALL') {
        const threshold = parseInt(filters.sessionsFilter);
        matchesSessions = customer.package.sessionsRemaining <= threshold;
      }

      return matchesSearch && matchesStatus && matchesExpiration && matchesSessions;
    });

    return filtered;
  }, [customers, debouncedSearch, filters]);

  const updateFilters = useCallback((newFilters: Partial<PTCustomerFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  return {
    filters,
    filteredAndSortedCustomers,
    updateFilters
  };
};

// Utility functions for PT customers
export const usePTCustomerUtils = () => {
  const getRemainingDays = useCallback((endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }, []);

  const calculateProgress = useCallback((customer: PTCustomer) => {
    if (customer.package.totalSessions > 0) {
      return (customer.package.sessionsUsed / customer.package.totalSessions) * 100;
    }
    const start = new Date(customer.package.startDate).getTime();
    const end = new Date(customer.package.endDate).getTime();
    const now = Date.now();
    return Math.min(((now - start) / (end - start)) * 100, 100);
  }, []);

  const getUrgencyLevel = useCallback(
    (customer: PTCustomer) => {
      if (customer.package.status === 'EXPIRED') return 'expired';
      if (customer.package.status === 'PENDING_ACTIVATION') return 'pending';

      // For MEMBERSHIP_KPI customers (no sessions), only check expiration days
      if (customer.contractType === 'MEMBERSHIP_KPI') {
        const days = getRemainingDays(customer.package.endDate);
        // Only mark as urgent if expiring within 7 days
        if (days > 0 && days <= 7) return 'urgent';
        return 'active';
      }

      // For PT_PACKAGE customers, check both expiration and sessions
      const days = getRemainingDays(customer.package.endDate);
      if (days > 0 && days <= 7) return 'urgent';

      // Check sessions only for PT packages
      if (customer.package.sessionsRemaining <= 3 && customer.package.sessionsRemaining > 0) return 'urgent';

      return 'active';
    },
    [getRemainingDays]
  );

  return {
    getRemainingDays,
    formatDate,
    calculateProgress,
    getUrgencyLevel
  };
};
