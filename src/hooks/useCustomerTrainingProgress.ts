import { useState, useEffect, useCallback } from 'react';
import { customerTrainingProgressApi } from '@/services/api/customerTrainingProgressApi';
import type {
  PTContract,
  TrainingProgressEntry,
  TrainingProgressStats,
  TrendDataPoint,
  ContractStatus,
  TrendInterval
} from '@/types/customerTrainingProgress';

// Hook for fetching contracts
export const useContracts = (status: ContractStatus = 'all') => {
  const [contracts, setContracts] = useState<PTContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await customerTrainingProgressApi.getContracts({ status });
    if (response.data) {
      setContracts(response.data);
    } else {
      setError('No data received');
    }
    setLoading(false);
  }, [status]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  return { contracts, loading, error, refetch: fetchContracts };
};

// Hook for fetching progress list with pagination
export const useProgressList = (
  contractId: string = 'all',
  status: ContractStatus = 'all',
  page: number = 1,
  limit: number = 20,
  dateRange?: { from?: string; to?: string }
) => {
  const [items, setItems] = useState<TrainingProgressEntry[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [contractsMeta, setContractsMeta] = useState({
    activeCount: 0,
    pastCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await customerTrainingProgressApi.listProgress({
      contractId,
      status,
      page,
      limit,
      from: dateRange?.from,
      to: dateRange?.to
    });

    if (response.data) {
      setItems(response.data.items || []);
      setPagination(
        response.data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1
        }
      );
      setContractsMeta(
        response.data.contractsMeta || {
          activeCount: 0,
          pastCount: 0
        }
      );
    } else {
      setError('No data received');
    }
    setLoading(false);
  }, [contractId, status, page, limit, dateRange?.from, dateRange?.to]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    items,
    pagination,
    contractsMeta,
    loading,
    error,
    refetch: fetchProgress
  };
};

// Hook for fetching statistics
export const useProgressStats = (contractId: string = 'all', status: ContractStatus = 'all') => {
  const [stats, setStats] = useState<TrainingProgressStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await customerTrainingProgressApi.getStats({ contractId, status });
    if (response.data) {
      setStats(response.data);
    } else {
      setError('No data received');
    }
    setLoading(false);
  }, [contractId, status]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};

// Hook for fetching trend data
export const useTrendData = (
  contractId: string = 'all',
  status: ContractStatus = 'all',
  interval: TrendInterval = 'day',
  dateRange?: { from?: string; to?: string }
) => {
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrend = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await customerTrainingProgressApi.getTrend({
      contractId,
      status,
      interval,
      from: dateRange?.from,
      to: dateRange?.to
    });
    if (response.data) {
      setTrendData(response.data);
    } else {
      setError('No data received');
    }
    setLoading(false);
  }, [contractId, status, interval, dateRange?.from, dateRange?.to]);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  return { trendData, loading, error, refetch: fetchTrend };
};

// Combined hook for complete training progress dashboard
export const useTrainingProgressDashboard = () => {
  const [selectedContract, setSelectedContract] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<ContractStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [interval, setInterval] = useState<TrendInterval>('day');

  const contracts = useContracts(selectedStatus);
  const progressList = useProgressList(selectedContract, selectedStatus, currentPage, 6, dateRange);
  const stats = useProgressStats(selectedContract, selectedStatus);
  const trend = useTrendData(selectedContract, selectedStatus, interval, dateRange);

  const refetchAll = useCallback(() => {
    contracts.refetch();
    progressList.refetch();
    stats.refetch();
    trend.refetch();
  }, [contracts, progressList, stats, trend]);

  return {
    // State
    selectedContract,
    selectedStatus,
    currentPage,
    dateRange,
    interval,

    // Setters
    setSelectedContract,
    setSelectedStatus,
    setCurrentPage,
    setDateRange,
    setInterval,

    // Data
    contracts: contracts.contracts,
    progressItems: progressList.items,
    pagination: progressList.pagination,
    contractsMeta: progressList.contractsMeta,
    stats: stats.stats,
    trendData: trend.trendData,

    // Loading states
    contractsLoading: contracts.loading,
    progressLoading: progressList.loading,
    statsLoading: stats.loading,
    trendLoading: trend.loading,

    // Errors
    contractsError: contracts.error,
    progressError: progressList.error,
    statsError: stats.error,
    trendError: trend.error,

    // Refetch
    refetchAll
  };
};
