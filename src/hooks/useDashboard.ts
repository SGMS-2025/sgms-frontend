import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardApi } from '@/services/api/dashboardApi';
import type {
  DashboardSummary,
  RevenueChartDataPoint,
  TrendDataPoint,
  PackageStatistics,
  DashboardSummaryParams,
  RevenueChartParams,
  TrendsParams,
  PackageStatisticsParams
} from '@/services/api/dashboardApi';

export interface UseDashboardSummaryResult {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseRevenueChartResult {
  data: RevenueChartDataPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseTrendsResult {
  data: TrendDataPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UsePackageStatisticsResult {
  packages: PackageStatistics[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch dashboard summary
 */
export const useDashboardSummary = (params?: DashboardSummaryParams): UseDashboardSummaryResult => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract individual values to use as dependencies
  const branchId = params?.branchId;
  const period = params?.period;
  const startDate = params?.startDate;
  const endDate = params?.endDate;

  // Use ref to track if we're already fetching to prevent concurrent calls
  const isFetchingRef = useRef(false);

  const fetchSummary = useCallback(async () => {
    // Prevent concurrent calls
    if (isFetchingRef.current) {
      return;
    }

    // Build params object from current values
    const currentParams = {
      branchId,
      period,
      startDate,
      endDate
    };

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await dashboardApi.getDashboardSummary(currentParams);
      if (response.success && response.data) {
        setSummary(response.data);
      } else {
        setError(response.message || 'Failed to fetch dashboard summary');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard summary');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [branchId, period, startDate, endDate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
};

/**
 * Hook to fetch revenue chart data
 */
export const useRevenueChart = (params?: RevenueChartParams): UseRevenueChartResult => {
  const [data, setData] = useState<RevenueChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract individual values to use as dependencies
  const branchId = params?.branchId;
  const startDate = params?.startDate;
  const endDate = params?.endDate;
  const groupBy = params?.groupBy;
  const breakdown = params?.breakdown;

  // Use ref to track if we're already fetching to prevent concurrent calls
  const isFetchingRef = useRef(false);

  const fetchChart = useCallback(async () => {
    // Prevent concurrent calls
    if (isFetchingRef.current) {
      return;
    }

    // Build params object from current values
    const currentParams = {
      branchId,
      startDate,
      endDate,
      groupBy,
      breakdown
    };

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await dashboardApi.getRevenueChart(currentParams);
      if (response.success && response.data) {
        setData(response.data.data || []);
      } else {
        setError(response.message || 'Failed to fetch revenue chart');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch revenue chart');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [branchId, startDate, endDate, groupBy, breakdown]);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  return { data, loading, error, refetch: fetchChart };
};

/**
 * Hook to fetch trends data
 */
export const useTrends = (params?: TrendsParams): UseTrendsResult => {
  const [data, setData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract individual values to use as dependencies
  const type = params?.type;
  const year = params?.year;
  const interval = params?.interval;
  const branchId = params?.branchId;

  // Use ref to track if we're already fetching to prevent concurrent calls
  const isFetchingRef = useRef(false);

  const fetchTrends = useCallback(async () => {
    // Prevent concurrent calls
    if (isFetchingRef.current) {
      return;
    }

    // Build params object from current values
    const currentParams = {
      type,
      year,
      interval,
      branchId
    };

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await dashboardApi.getTrends(currentParams);
      if (response.success && response.data) {
        setData(response.data.data || []);
      } else {
        setError(response.message || 'Failed to fetch trends');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trends');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [type, year, interval, branchId]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  return { data, loading, error, refetch: fetchTrends };
};

/**
 * Hook to fetch package statistics
 */
export const usePackageStatistics = (params?: PackageStatisticsParams): UsePackageStatisticsResult => {
  const [packages, setPackages] = useState<PackageStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract individual values to use as dependencies
  const branchId = params?.branchId;
  const year = params?.year;

  // Use ref to track if we're already fetching to prevent concurrent calls
  const isFetchingRef = useRef(false);

  const fetchPackages = useCallback(async () => {
    // Prevent concurrent calls
    if (isFetchingRef.current) {
      return;
    }

    // Build params object from current values
    const currentParams = {
      branchId,
      year
    };

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await dashboardApi.getPackageStatistics(currentParams);
      if (response.success && response.data) {
        setPackages(response.data.packages || []);
      } else {
        setError(response.message || 'Failed to fetch package statistics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch package statistics');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [branchId, year]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  return { packages, loading, error, refetch: fetchPackages };
};
