import { api } from './api';
import type { ApiResponse } from '@/types/api/Api';
import type { PaginationResponse } from '@/types/common/BaseTypes';
import type {
  Transaction,
  TransactionListData,
  TransactionListParams,
  TransactionSummary
} from '@/types/api/Transaction';

type RawTransactionResponse = ApiResponse<Transaction[]> & {
  pagination?: PaginationResponse;
  meta?: {
    summary?: TransactionSummary;
    [key: string]: unknown;
  };
};

const normalizeParams = (params: TransactionListParams): Record<string, unknown> => {
  const { status, method, type, branchId, subjectType, ...rest } = params;
  const normalized: Record<string, unknown> = { ...rest };

  if (status && status !== 'ALL') {
    normalized.status = status;
  }

  if (method && method !== 'ALL') {
    normalized.method = method;
  }

  if (type && type !== 'ALL') {
    normalized.type = type;
  }

  if (branchId && branchId !== 'ALL') {
    normalized.branchId = branchId;
  }

  if (subjectType && subjectType !== 'ALL') {
    normalized.subjectType = subjectType;
  }

  Object.keys(normalized).forEach((key) => {
    const value = normalized[key];
    if (value === undefined || value === null || value === '') {
      delete normalized[key];
    }
  });

  return normalized;
};

const fallbackPagination = (items: Transaction[], params: TransactionListParams): PaginationResponse => {
  const limit = params.limit ?? Math.max(items.length, 1);
  const page = params.page ?? 1;

  return {
    page,
    limit,
    total: items.length,
    totalPages: items.length === 0 ? 0 : Math.ceil(items.length / limit),
    hasNext: false,
    hasPrev: page > 1
  };
};

const parseTransactionResponse = (
  raw: RawTransactionResponse,
  params: TransactionListParams
): ApiResponse<TransactionListData> => {
  const items = raw.data ?? [];
  const pagination = raw.pagination ?? fallbackPagination(items, params);
  const summary = raw.meta?.summary;

  return {
    success: raw.success,
    message: raw.message,
    data: {
      items,
      pagination,
      summary
    },
    requestId: raw.requestId ?? '',
    timestamp: raw.timestamp ?? new Date().toISOString()
  };
};

const fetchTransactions = async (url: string, params: TransactionListParams = {}) => {
  const response = await api.get(url, {
    params: normalizeParams(params)
  });

  return parseTransactionResponse(response.data as RawTransactionResponse, params);
};

export const transactionApi = {
  getTransactions: async (params: TransactionListParams = {}): Promise<ApiResponse<TransactionListData>> => {
    return fetchTransactions('/transactions', params);
  },
  getMyTransactions: async (params: TransactionListParams = {}): Promise<ApiResponse<TransactionListData>> => {
    return fetchTransactions('/transactions/me', params);
  }
};
