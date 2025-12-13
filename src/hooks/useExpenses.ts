import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { expensesApi } from '@/services/api/expensesApi';
import type {
  Expense,
  ExpenseListParams,
  ExpenseListResponse,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseStats
} from '@/types/api/Expenses';

interface UseExpensesParams extends ExpenseListParams {
  autoFetch?: boolean;
}

interface UseExpensesReturn {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  pagination: ExpenseListResponse['pagination'] | null;
  refetch: () => Promise<void>;
  updateFilters: (newFilters: Partial<ExpenseListParams>) => void;
}

export const useExpenses = (params: UseExpensesParams = {}): UseExpensesReturn => {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ExpenseListResponse['pagination'] | null>(null);
  const [currentParams, setCurrentParams] = useState<ExpenseListParams>(params);

  const fetchExpenses = useCallback(
    async (fetchParams: ExpenseListParams = currentParams) => {
      setLoading(true);
      setError(null);

      const response = await expensesApi.getExpenses(fetchParams);

      if (response.success) {
        // Check if response.data is an array (direct expenses) or object with expenses property
        if (Array.isArray(response.data)) {
          setExpenses(response.data);
          setPagination({
            page: 1,
            limit: 10,
            total: response.data.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          });
        } else {
          setExpenses(response.data.expenses);
          setPagination(response.data.pagination);
        }
      } else {
        console.error('❌ API Error:', response.message);
        setError(response.message);
        toast.error(t('expenses.fetch_error', 'Có lỗi xảy ra khi tải danh sách chi phí'));
      }

      setLoading(false);
    },
    [currentParams, t]
  );

  const refetch = useCallback(async () => {
    await fetchExpenses();
  }, [fetchExpenses]);

  const updateFilters = useCallback(
    (newFilters: Partial<ExpenseListParams>) => {
      const updatedParams = { ...currentParams, ...newFilters };
      setCurrentParams(updatedParams);
      fetchExpenses(updatedParams);
    },
    [currentParams, fetchExpenses]
  );

  useEffect(() => {
    if (params.autoFetch !== false) {
      fetchExpenses();
    }
  }, [fetchExpenses, params.autoFetch]);

  return {
    expenses,
    loading,
    error,
    pagination,
    refetch,
    updateFilters
  };
};

interface UseExpenseOperationsReturn {
  createExpense: (data: CreateExpenseRequest) => Promise<Expense | null>;
  updateExpense: (id: string, data: UpdateExpenseRequest) => Promise<Expense | null>;
  disableExpense: (id: string) => Promise<boolean>;
  getExpenseById: (id: string) => Promise<Expense | null>;
  loading: boolean;
  error: string | null;
  resetError: () => void;
}

export const useExpenseOperations = (): UseExpenseOperationsReturn => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExpense = useCallback(
    async (data: CreateExpenseRequest): Promise<Expense | null> => {
      setLoading(true);
      setError(null);

      const response = await expensesApi.createExpense(data);

      if (response.success) {
        toast.success(t('expenses.create_success', 'Tạo chi phí thành công'));
        setLoading(false);
        return response.data;
      } else {
        setError(response.message);
        toast.error(t('expenses.create_error', 'Có lỗi xảy ra khi tạo chi phí'));
        setLoading(false);
        return null;
      }
    },
    [t]
  );

  const updateExpense = useCallback(
    async (id: string, data: UpdateExpenseRequest): Promise<Expense | null> => {
      setLoading(true);
      setError(null);

      const response = await expensesApi.updateExpense(id, data);

      if (response.success) {
        toast.success(t('expenses.update_success', 'Cập nhật chi phí thành công'));
        setLoading(false);
        return response.data;
      } else {
        setError(response.message);
        toast.error(t('expenses.update_error', 'Có lỗi xảy ra khi cập nhật chi phí'));
        setLoading(false);
        return null;
      }
    },
    [t]
  );

  const disableExpense = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      const response = await expensesApi.disableExpense(id);

      if (response.success) {
        toast.success(t('expenses.delete_success', 'Xóa chi phí thành công'));
        setLoading(false);
        return true;
      } else {
        setError(response.message);
        toast.error(t('expenses.delete_error', 'Có lỗi xảy ra khi xóa chi phí'));
        setLoading(false);
        return false;
      }
    },
    [t]
  );

  const getExpenseById = useCallback(
    async (id: string): Promise<Expense | null> => {
      setLoading(true);
      setError(null);

      const response = await expensesApi.getExpenseById(id);

      if (response.success) {
        return response.data;
      } else {
        setError(response.message);
        toast.error(t('expenses.fetch_error', 'Có lỗi xảy ra khi tải thông tin chi phí'));
        return null;
      }
    },
    [t]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createExpense,
    updateExpense,
    disableExpense,
    getExpenseById,
    loading,
    error,
    resetError
  };
};

interface UseExpenseDetailsReturn {
  expense: Expense | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useExpenseDetails = (expenseId: string | null): UseExpenseDetailsReturn => {
  const { t } = useTranslation();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpense = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      const response = await expensesApi.getExpenseById(id);

      if (response.success) {
        setExpense(response.data);
      } else {
        setError(response.message);
        toast.error(t('expenses.fetch_error', 'Có lỗi xảy ra khi tải thông tin chi phí'));
      }

      setLoading(false);
    },
    [t]
  );

  const refetch = useCallback(async () => {
    if (expenseId) {
      await fetchExpense(expenseId);
    }
  }, [expenseId, fetchExpense]);

  useEffect(() => {
    if (expenseId) {
      fetchExpense(expenseId);
    } else {
      setExpense(null);
    }
  }, [expenseId, fetchExpense]);

  return {
    expense,
    loading,
    error,
    refetch
  };
};

interface UseExpenseStatsReturn {
  stats: ExpenseStats | null;
  loading: boolean;
  error: string | null;
  refetch: (filters?: ExpenseListParams) => Promise<void>;
}

/**
 * Fetch aggregated expense statistics with optional filters
 */
export const useExpenseStats = (): UseExpenseStatsReturn => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(
    async (filters: ExpenseListParams = {}) => {
      setLoading(true);
      setError(null);

      try {
        const response = await expensesApi.getExpenseStats(filters);

        if (response.success) {
          // Some backends wrap stats inside data.stats; fallback to raw data
          const payload = (response.data as unknown as { stats?: ExpenseStats }).stats || response.data;
          setStats(payload as ExpenseStats);
        } else {
          setError(response.message);
          console.error('❌ Expense stats error:', response.message);
          toast.error(t('expenses.stats_error', 'Không thể tải thống kê chi phí'));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('❌ Expense stats exception:', err);
        toast.error(t('expenses.stats_error', 'Không thể tải thống kê chi phí'));
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  return {
    stats,
    loading,
    error,
    refetch
  };
};
