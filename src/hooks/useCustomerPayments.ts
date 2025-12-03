import { useEffect, useState, useCallback } from 'react';
import { paymentApi } from '@/services/api/paymentApi';
import type {
  PaymentLedgerItem,
  PaymentLedgerPagination,
  PaymentLedgerFilters,
  PaymentLedgerQuery,
  CustomerPaymentHistoryQuery,
  CustomerPaymentHistoryResponse
} from '@/types/api/Payment';

interface UsePaymentLedgerState {
  items: PaymentLedgerItem[];
  loading: boolean;
  error: string | null;
  pagination: PaymentLedgerPagination | null;
  filters: PaymentLedgerFilters | null;
}

export const useCustomerPaymentLedger = (initialQuery: PaymentLedgerQuery = {}) => {
  const [state, setState] = useState<UsePaymentLedgerState>({
    items: [],
    loading: true,
    error: null,
    pagination: null,
    filters: null
  });

  const [query, setQuery] = useState<PaymentLedgerQuery>({
    page: 1,
    limit: 10,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    ...initialQuery
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    // TODO: Implement getCustomerPaymentLedger method in paymentApi.ts
    // The backend endpoint for payment ledger doesn't exist yet
    // For now, return empty state with error message
    setState({
      items: [],
      loading: false,
      error: 'Payment ledger feature is not yet implemented',
      pagination: null,
      filters: null
    });

    // Uncomment when getCustomerPaymentLedger is implemented:
    // await paymentApi
    //   .getCustomerPaymentLedger(query)
    //   .then(
    //     (response: {
    //       success: boolean;
    //       data: { items?: PaymentLedgerItem[]; pagination?: PaymentLedgerPagination; filters?: PaymentLedgerFilters };
    //       message: string;
    //     }) => {
    //       if (response.success) {
    //         setState({
    //           items: response.data.items || [],
    //           loading: false,
    //           error: null,
    //           pagination: response.data.pagination || null,
    //           filters: response.data.filters || null
    //         });
    //       } else {
    //         setState((prev) => ({
    //           ...prev,
    //           loading: false,
    //           error: response.message || 'Failed to fetch payment ledger'
    //         }));
    //       }
    //     }
    //   )
    //   .catch((error: unknown) => {
    //     setState((prev) => ({
    //       ...prev,
    //       loading: false,
    //       error: (error as Error).message || 'Failed to fetch payment ledger'
    //     }));
    //   });
  }, [query]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateQuery = (updater: Partial<PaymentLedgerQuery>) => {
    setQuery((prev) => ({
      ...prev,
      ...updater,
      page: updater.page ?? prev.page ?? 1
    }));
  };

  const goToPage = (page: number) => {
    setQuery((prev) => ({
      ...prev,
      page
    }));
  };

  return {
    ...state,
    query,
    setQuery: updateQuery,
    refetch: fetchData,
    goToPage
  };
};

interface UseCustomerPaymentHistoryState {
  data: CustomerPaymentHistoryResponse | null;
  loading: boolean;
  error: string | null;
}

export const useCustomerPaymentHistory = (
  customerId: string | null,
  initialQuery: CustomerPaymentHistoryQuery = {}
) => {
  const [state, setState] = useState<UseCustomerPaymentHistoryState>({
    data: null,
    loading: true,
    error: null
  });

  const [query, setQuery] = useState<CustomerPaymentHistoryQuery>({
    includePending: true,
    page: 1,
    limit: 20,
    ...initialQuery
  });

  const fetchData = useCallback(async () => {
    if (!customerId) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    await paymentApi
      .getCustomerPaymentHistory(customerId, query)
      .then((response) => {
        if (response.success) {
          setState({
            data: response.data,
            loading: false,
            error: null
          });
        } else {
          setState({
            data: null,
            loading: false,
            error: response.message || 'Failed to fetch customer payment history'
          });
        }
      })
      .catch((error) => {
        setState({
          data: null,
          loading: false,
          error: (error as Error).message || 'Failed to fetch customer payment history'
        });
      });
  }, [customerId, query]);

  useEffect(() => {
    if (customerId) {
      fetchData();
    }
  }, [customerId, fetchData]);

  const updateQuery = (updater: Partial<CustomerPaymentHistoryQuery>) => {
    setQuery((prev) => ({
      ...prev,
      ...updater,
      page: updater.page ?? prev.page ?? 1
    }));
  };

  return {
    ...state,
    query,
    setQuery: updateQuery,
    refetch: fetchData
  };
};
