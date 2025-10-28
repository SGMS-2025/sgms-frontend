import { useCallback, useEffect, useState } from 'react';
import { transactionApi } from '@/services/api/transactionApi';
import type {
  Transaction,
  TransactionListData,
  TransactionListParams,
  TransactionStatus
} from '@/types/api/Transaction';

export interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  pagination: TransactionListData['pagination'] | null;
  query: TransactionListParams;
  setQuery: (updates: Partial<TransactionListParams>) => void;
  goToPage: (page: number) => void;
  refetch: () => Promise<void>;
}

const DEFAULT_STATUS: TransactionStatus | 'ALL' = 'ALL';

export const useTransactions = (initialQuery: TransactionListParams = {}): UseTransactionsResult => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<TransactionListData['pagination'] | null>(null);
  const [query, setQueryState] = useState<TransactionListParams>({
    page: 1,
    limit: 20,
    sortBy: 'occurredAt',
    sortOrder: 'desc',
    status: DEFAULT_STATUS,
    ...initialQuery
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await transactionApi.getTransactions(query);

    if (response.success) {
      setTransactions(response.data.items);
      setPagination(response.data.pagination);
    } else {
      setError(response.message || 'Failed to fetch transactions');
    }

    setLoading(false);
  }, [query]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const updateQuery = useCallback((updates: Partial<TransactionListParams>) => {
    setQueryState((prev) => {
      const next = { ...prev, ...updates };
      if (updates.page === undefined) {
        next.page = 1;
      }
      return next;
    });
  }, []);

  const goToPage = useCallback((page: number) => {
    setQueryState((prev) => ({
      ...prev,
      page: Math.max(1, page)
    }));
  }, []);

  const refetch = useCallback(async () => {
    await fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    pagination,
    query,
    setQuery: updateQuery,
    goToPage,
    refetch
  };
};
