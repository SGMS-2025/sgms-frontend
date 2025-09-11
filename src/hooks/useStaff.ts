import { useState, useEffect, useCallback } from 'react';
import { staffApi } from '@/services/api/staffApi';
import type { Staff, StaffStats, StaffDisplay, StaffListParams, UseStaffListReturn } from '@/types/api/Staff';

const transformStaffToDisplay = (staff: Staff): StaffDisplay => ({
  id: staff._id,
  name: staff.userId.fullName || staff.userId.username,
  jobTitle: staff.jobTitle,
  email: staff.userId.email,
  phone: staff.userId.phoneNumber || '',
  salary: staff.salary.toLocaleString('vi-VN'),
  branch: staff.branchId.branchName,
  status: staff.status,
  selected: staff.selected || false
});

export const useStaffList = (initialParams: StaffListParams = {}): UseStaffListReturn => {
  const [staffList, setStaffList] = useState<StaffDisplay[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseStaffListReturn['pagination']>(null);
  const [params, setParams] = useState<StaffListParams>(initialParams);

  const fetchStaffList = useCallback(async () => {
    setLoading(true);
    setError(null);

    const requestParams = {
      limit: 10,
      ...params
    };

    const [staffResponse, statsResponse] = await Promise.all([
      staffApi.getStaffList(requestParams),
      staffApi.getStaffStats()
    ]);

    // Handle staff list response
    if (staffResponse.success) {
      const transformedStaff = staffResponse.data.staffList.map(transformStaffToDisplay);
      setStaffList(transformedStaff);

      // Transform pagination data to match frontend interface
      const paginationData = staffResponse.data.pagination;
      const transformedPagination = {
        currentPage: paginationData.page,
        totalPages: paginationData.totalPages,
        totalItems: paginationData.total,
        itemsPerPage: paginationData.limit,
        hasNextPage: paginationData.hasNext,
        hasPrevPage: paginationData.hasPrev
      };
      setPagination(transformedPagination);
    } else {
      setError(staffResponse.message || 'Failed to fetch staff list');
    }

    // Handle stats response
    if (statsResponse.success) {
      setStats(statsResponse.data);
    } else {
      // Stats error is not critical, just log it
      console.warn('Failed to fetch staff stats:', statsResponse.message);
    }

    setLoading(false);
  }, [params]);

  const refetch = useCallback(async () => {
    await fetchStaffList();
  }, [fetchStaffList]);

  const updateFilters = useCallback((newFilters: Partial<StaffListParams>) => {
    setParams((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  useEffect(() => {
    fetchStaffList();
  }, [fetchStaffList]);

  return {
    staffList,
    stats,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    goToPage
  };
};

// Hook for staff stats only
export const useStaffStats = () => {
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await staffApi.getStaffStats();

    if (response.success) {
      setStats(response.data);
    } else {
      setError(response.message || 'Failed to fetch staff stats');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};

// Hook for getting staff details by ID
export const useStaffDetails = (staffId: string | null) => {
  const [staffDetails, setStaffDetails] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStaffDetails = useCallback(async () => {
    if (!staffId) return;

    setLoading(true);
    setError(null);

    const response = await staffApi.getStaffById(staffId);

    if (response.success) {
      setStaffDetails(response.data);
    } else {
      setError(response.message || 'Failed to fetch staff details');
    }

    setLoading(false);
  }, [staffId]);

  const refetch = useCallback(async () => {
    await fetchStaffDetails();
  }, [fetchStaffDetails]);

  return {
    staffDetails,
    loading,
    error,
    refetch
  };
};
