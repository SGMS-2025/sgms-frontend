import { useState, useEffect, useCallback, useRef } from 'react';
import { kpiApi } from '@/services/api/kpiApi';
import { socketService } from '@/services/socket/socketService';
import { createErrorWithMeta } from './utils/apiErrorHandler';
import type { FailedApiResponse } from './utils/apiErrorHandler';
import type {
  KPIConfig,
  KPIConfigWithAchievement,
  KPIDisplay,
  CreateKPIRequest,
  UpdateKPIRequest,
  KPIListParams,
  KPIDashboardData,
  KPIAchievement,
  PopulatedUser,
  UseKPIListReturn,
  UseMyKPIReturn,
  UseKPIDetailsReturn,
  UseKPIDashboardReturn,
  UseKPIDashboardParams
} from '@/types/api/KPI';
import { isKPIConfigPopulatedStaff, isKPIConfigPopulatedBranch, isPopulatedUser } from '@/types/api/KPI';
import type { Staff } from '@/types/api/Staff';
import type { Branch } from '@/types/api/Branch';
import type { KPIUpdateEvent } from '@/types/api/Socket';

// Transform KPI Config to Display format
// Note: This function doesn't have access to translation, so we use English fallback
const transformKPIToDisplay = (config: KPIConfig, achievement?: KPIAchievement): KPIDisplay => {
  // Handle staffId - can be string (ID) or object (populated Staff)
  let staffName = 'N/A';
  if (config.staffId) {
    if (isKPIConfigPopulatedStaff(config.staffId)) {
      const staff = config.staffId as Staff;
      // Check if userId is populated (object) or just an ID (string)
      if (isPopulatedUser(staff.userId)) {
        const user = staff.userId as PopulatedUser;
        staffName = user.fullName || user.username || 'N/A';
      } else {
        // userId is not populated or is just an ID
        staffName = 'N/A';
      }
    } else if (typeof config.staffId === 'string') {
      // If it's just an ID, we can't get the name - this shouldn't happen in practice
      staffName = 'N/A';
    }
  } else {
    // Branch-wide KPI (no specific staff) - but in practice, branch-wide KPIs still have staffId
    // So this case might not happen, but we handle it anyway
    staffName = 'All Staff';
  }

  // Handle branchId - can be string (ID) or object (populated Branch)
  let branchName = 'N/A';
  if (config.branchId) {
    if (isKPIConfigPopulatedBranch(config.branchId)) {
      const branch = config.branchId as Branch;
      branchName = branch.branchName || 'N/A';
    } else if (typeof config.branchId === 'string') {
      branchName = 'Unknown Branch';
    }
  }

  const period = `${new Date(config.startDate).toLocaleDateString('vi-VN')} - ${new Date(config.endDate).toLocaleDateString('vi-VN')}`;

  const actualRevenue = achievement?.actual?.revenue?.total || 0;
  const commission = achievement?.commission?.amount || 0;
  const ranking = achievement?.rankings?.branch;

  return {
    id: config._id,
    staffName,
    branchName,
    period,
    actualRevenue,
    commission,
    ranking,
    status: config.status
  };
};

// Hook for KPI list
export const useKPIList = (initialParams: KPIListParams = {}): UseKPIListReturn => {
  const [kpiList, setKpiList] = useState<KPIDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseKPIListReturn['pagination']>(null);
  const [params, setParams] = useState<KPIListParams>(initialParams);

  const fetchKPIList = useCallback(async () => {
    setLoading(true);
    setError(null);

    const requestParams = {
      limit: 10,
      ...params
    };

    const response = await kpiApi.getAchievements(requestParams).catch(() => ({
      success: false,
      message: 'Network error - Failed to fetch KPI list',
      data: [],
      pagination: {
        page: 1,
        totalPages: 0,
        total: 0,
        limit: 10,
        hasNext: false,
        hasPrev: false
      }
    }));

    if (response.success && response.data) {
      // Response.data is array of KPIConfigWithAchievement
      const transformedKPIs = response.data.map((item) => transformKPIToDisplay(item.config, item.achievement));
      setKpiList(transformedKPIs);

      // Transform pagination data (from response.pagination - always present in PaginatedApiResponse)
      const paginationData = response.pagination;
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
      setError(response.message || 'Failed to fetch KPI list');
    }

    setLoading(false);
  }, [params]);

  const refetch = useCallback(async () => {
    await fetchKPIList();
  }, [fetchKPIList]);

  const updateFilters = useCallback((newFilters: Partial<KPIListParams>) => {
    setParams((prev) => ({ ...prev, ...newFilters, page: 1 })); // Reset to page 1 when filters change
  }, []);

  const goToPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  useEffect(() => {
    fetchKPIList();
  }, [fetchKPIList]);

  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRefetchRef = useRef(false);

  useEffect(() => {
    const handleKPIEvent = (data: unknown) => {
      try {
        const kpiEventData = data as KPIUpdateEvent;
        // Convert both to string for comparison (handle ObjectId vs string)
        if (params.branchId) {
          const eventBranchId = String(kpiEventData.branchId || '');
          const filterBranchId = String(params.branchId || '');

          if (eventBranchId !== filterBranchId) {
            return;
          }
        }

        // This prevents multiple API calls when multiple KPI events are received quickly
        pendingRefetchRef.current = true;

        // Clear existing timeout
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }

        // Set new timeout
        debounceTimeoutRef.current = setTimeout(() => {
          if (pendingRefetchRef.current) {
            pendingRefetchRef.current = false;
            refetchRef.current();
          }
        }, 500); // Wait 500ms after last event
      } catch (error) {
        console.error('[useKPI] ❌ Error handling KPI event:', error);
      }
    };

    socketService.on('kpi:created', handleKPIEvent);
    socketService.on('kpi:updated', handleKPIEvent);

    return () => {
      socketService.off('kpi:created', handleKPIEvent);
      socketService.off('kpi:updated', handleKPIEvent);

      // Clear debounce timeout on cleanup
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      pendingRefetchRef.current = false;
    };
  }, [params.branchId]);

  return {
    kpiList,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    goToPage
  };
};

// Hook for My KPI (for staff)
export const useMyKPI = (): UseMyKPIReturn => {
  const [myKPIs, setMyKPIs] = useState<KPIConfigWithAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyKPI = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await kpiApi.getMyKPI().catch(() => ({
      success: false,
      message: 'Network error - Failed to fetch my KPI',
      data: []
    }));

    if (response.success && response.data) {
      setMyKPIs(response.data);
    } else {
      setError(response.message || 'Failed to fetch my KPI');
    }

    setLoading(false);
  }, []);

  const refetch = useCallback(async () => {
    await fetchMyKPI();
  }, [fetchMyKPI]);

  useEffect(() => {
    fetchMyKPI();
  }, [fetchMyKPI]);

  return {
    myKPIs,
    loading,
    error,
    refetch
  };
};

// Hook for KPI details
export const useKPIDetails = (id: string | null): UseKPIDetailsReturn => {
  const [kpiConfig, setKpiConfig] = useState<KPIConfig | null>(null);
  const [achievement, setAchievement] = useState<KPIAchievement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKPIDetails = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    const response = await kpiApi.getAchievementById(id).catch(() => ({
      success: false,
      message: 'Network error - Failed to fetch KPI details',
      data: null
    }));

    if (response.success && response.data) {
      setKpiConfig(response.data.config);
      setAchievement(response.data.achievement);
    } else {
      setError(response.message || 'Failed to fetch KPI details');
    }

    setLoading(false);
  }, [id]);

  const refetch = useCallback(async () => {
    await fetchKPIDetails();
  }, [fetchKPIDetails]);

  useEffect(() => {
    fetchKPIDetails();
  }, [fetchKPIDetails]);

  return {
    kpiConfig,
    achievement,
    loading,
    error,
    refetch
  };
};

// Hook for creating KPI
export const useCreateKPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createKPI = useCallback(async (kpiData: CreateKPIRequest) => {
    setLoading(true);
    setError(null);

    const response = await kpiApi.createKPI(kpiData).catch(() => ({
      success: false,
      message: 'Network error - Failed to create KPI',
      data: null
    }));

    if (response.success) {
      setLoading(false);
      // Response.data can be either KPIConfig (individual) or { count, message, kpiConfigs } (branch-wide)
      return response.data;
    } else {
      const errorMsg = response.message || 'Failed to create KPI';
      setError(errorMsg);
      setLoading(false);
      throw new Error(errorMsg);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createKPI,
    loading,
    error,
    resetError
  };
};

// Hook for updating KPI
export const useUpdateKPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateKPI = useCallback(async (id: string, updateData: UpdateKPIRequest) => {
    setLoading(true);
    setError(null);

    const response = await kpiApi.updateKPI(id, updateData).catch(() => ({
      success: false,
      message: 'Network error - Failed to update KPI',
      data: null
    }));

    if (response.success) {
      setLoading(false);
      return response.data;
    } else {
      setError(response.message || 'Failed to update KPI');
      setLoading(false);
      return createErrorWithMeta(response as FailedApiResponse, 'Failed to update KPI');
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateKPI,
    loading,
    error,
    resetError
  };
};

// Hook for disabling KPI
export const useDisableKPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disableKPI = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const response = await kpiApi.disableKPI(id).catch(() => ({
      success: false,
      message: 'Network error - Failed to disable KPI',
      data: null
    }));

    if (response.success) {
      setLoading(false);
      return response.data;
    } else {
      const errorMsg = response.message || 'Failed to disable KPI';
      setError(errorMsg);
      setLoading(false);
      throw new Error(errorMsg);
    }
  }, []);

  return {
    disableKPI,
    loading,
    error
  };
};

// Hook for recalculating KPI
export const useRecalculateKPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recalculateKPI = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const response = await kpiApi.recalculateKPI(id).catch(() => ({
      success: false,
      message: 'Network error - Failed to recalculate KPI',
      data: null
    }));

    if (response.success) {
      setLoading(false);
      return response.data;
    } else {
      const errorMsg = response.message || 'Failed to recalculate KPI';
      setError(errorMsg);
      setLoading(false);
      throw new Error(errorMsg);
    }
  }, []);

  return {
    recalculateKPI,
    loading,
    error
  };
};

// Hook for KPI dashboard
export const useKPIDashboard = (params?: UseKPIDashboardParams): UseKPIDashboardReturn => {
  const [dashboardData, setDashboardData] = useState<KPIDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await kpiApi.getDashboard(params).catch(() => ({
      success: false,
      message: 'Network error - Failed to fetch KPI dashboard',
      data: null
    }));

    if (response.success && response.data) {
      setDashboardData(response.data);
    } else {
      setError(response.message || 'Failed to fetch KPI dashboard');
    }

    setLoading(false);
  }, [params]);

  const refetch = useCallback(async () => {
    await fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    dashboardData,
    loading,
    error,
    refetch
  };
};
