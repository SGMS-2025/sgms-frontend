import { useCallback, useEffect, useRef, useState } from 'react';
import { transactionApi } from '@/services/api/transactionApi';
import type {
  Transaction,
  TransactionListData,
  TransactionListParams,
  TransactionStatus,
  TransactionSummary
} from '@/types/api/Transaction';

export interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  pagination: TransactionListData['pagination'] | null;
  summary: TransactionSummary | null;
  query: TransactionListParams;
  setQuery: (updates: Partial<TransactionListParams>) => void;
  goToPage: (page: number) => void;
  refetch: () => Promise<void>;
}

const DEFAULT_STATUS: TransactionStatus | 'ALL' = 'ALL';

const calculateSummary = (items: Transaction[]): TransactionSummary => {
  return items.reduce<TransactionSummary>(
    (acc, transaction) => {
      const amount = transaction.amount || 0;

      if (transaction.type === 'RECEIPT') {
        acc.totalAmount += amount;
        acc.totalCount += 1;

        if (transaction.status === 'SETTLED') {
          acc.settledAmount += amount;
          acc.settledCount += 1;
        } else if (transaction.status === 'PENDING') {
          acc.pendingAmount += amount;
          acc.pendingCount += 1;
        } else if (transaction.status === 'FAILED') {
          acc.failedAmount += amount;
          acc.failedCount += 1;
        }
      } else if (transaction.type === 'REFUND') {
        acc.totalAmount -= amount;
        acc.totalCount += 1;

        if (transaction.status === 'SETTLED') {
          acc.settledAmount -= amount;
          acc.settledCount += 1;
        } else if (transaction.status === 'PENDING') {
          acc.pendingAmount -= amount;
          acc.pendingCount += 1;
        } else if (transaction.status === 'FAILED') {
          acc.failedAmount -= amount;
          acc.failedCount += 1;
        }
      }

      return acc;
    },
    {
      totalAmount: 0,
      settledAmount: 0,
      pendingAmount: 0,
      failedAmount: 0,
      totalCount: 0,
      settledCount: 0,
      pendingCount: 0,
      failedCount: 0
    }
  );
};

export const useTransactions = (initialQuery: TransactionListParams = {}): UseTransactionsResult => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<TransactionListData['pagination'] | null>(null);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [query, setQueryState] = useState<TransactionListParams>({
    page: 1,
    limit: 20,
    sortBy: 'occurredAt',
    sortOrder: 'desc',
    status: DEFAULT_STATUS,
    ...initialQuery
  });
  const activeRequestRef = useRef(0);

  const fetchTransactions = useCallback(async () => {
    const requestId = ++activeRequestRef.current;
    setLoading(true);
    setError(null);

    try {
      const response = await transactionApi.getTransactions(query);

      // Only update state if this is the latest request to avoid stale data overriding filtered results
      if (requestId !== activeRequestRef.current) {
        return;
      }

      if (response.success) {
        const items = response.data.items;
        setTransactions(items);
        setPagination(response.data.pagination);
        setSummary(response.data.summary ?? calculateSummary(items));
      } else {
        setError(response.message || 'Failed to fetch transactions');
        setTransactions([]);
        setPagination(null);
        setSummary(null);
      }
    } catch (error) {
      if (requestId === activeRequestRef.current) {
        const message = error instanceof Error ? error.message : 'Failed to fetch transactions';
        setError(message);
        setTransactions([]);
        setPagination(null);
        setSummary(null);
      }
    } finally {
      if (requestId === activeRequestRef.current) {
        setLoading(false);
      }
    }
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
    summary,
    query,
    setQuery: updateQuery,
    goToPage,
    refetch
  };
};
