import type { ApiResponse } from '@/types/api/Api';

export type PaymentContractType = 'MEMBERSHIP' | 'SERVICE';

export interface PaymentLedgerQuery {
  branchId?: string | null;
  customerId?: string | null;
  contractType?: PaymentContractType | 'ALL' | null;
  status?: string | null;
  paymentMethod?: string | null;
  search?: string | null;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentLedgerFilters {
  branchId: string | null;
  customerId: string | null;
  contractType: PaymentContractType | 'ALL';
  status: string | 'ALL';
  paymentMethod: string | 'ALL';
  search: string;
}

export interface PaymentLedgerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PendingTransferSummary {
  paymentTransactionId: string;
  amount: number;
  status: string;
  paymentMethod: string;
  orderCode: string | null;
  paymentCode: string | null;
  checkoutUrl: string | null;
  qrCode: string | null;
  qrString: string | null;
  createdAt: string;
  expiresAt: string | null;
  bankAccount: {
    name?: string | null;
    number?: string | null;
    bankCode?: string | null;
  };
}

export interface LastPaymentSummary {
  transactionId: string;
  amount: number;
  method: string;
  occurredAt: string;
  note: string | null;
  recordedBy: {
    id: string | null;
    name: string;
  } | null;
}

export interface PaymentSummaryByMethod {
  CASH: number;
  BANK_TRANSFER: number;
  CARD: number;
  QR_CODE: number;
}

export interface PaymentLedgerItem {
  contractId: string;
  contractType: PaymentContractType;
  contractName: string;
  customer: {
    id: string | null;
    name: string;
    phone: string;
    email: string;
  };
  branch: {
    id: string | null;
    name: string;
  } | null;
  status: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  paymentSummary: {
    totalPaid: number;
    paidByMethod: PaymentSummaryByMethod;
    pendingAmount: number;
    pendingTransfers: PendingTransferSummary[];
    lastPayment: LastPaymentSummary | null;
  };
}

export interface PaymentLedgerResponse {
  items: PaymentLedgerItem[];
  pagination: PaymentLedgerPagination;
  filters: PaymentLedgerFilters;
}

export interface CustomerPaymentHistoryQuery {
  branchId?: string | null;
  contractType?: PaymentContractType | null;
  contractId?: string | null;
  method?: string | null;
  status?: string | null;
  includePending?: boolean;
  page?: number;
  limit?: number;
}

export interface CustomerPaymentHistoryTransaction {
  transactionId: string;
  contractId: string;
  contractType: PaymentContractType;
  contractName: string;
  branch: {
    id: string | null;
    name: string;
  } | null;
  amount: number;
  method: string;
  occurredAt: string;
  note: string | null;
  status: string;
  referenceCode: string | null;
  recordedBy: {
    id: string | null;
    name: string;
    email: string;
  } | null;
}

export interface CustomerPaymentHistoryPendingTransfer extends PendingTransferSummary {
  contractId: string;
  contractType: PaymentContractType;
  contractName: string;
  branch: {
    id: string | null;
    name: string;
  } | null;
}

export interface CustomerPaymentHistorySummary {
  totalTransactions: number;
  totalAmount: number;
  amountByMethod: Record<string, number>;
  pendingAmount: number;
}

export interface CustomerPaymentHistoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CustomerPaymentHistoryResponse {
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  summary: CustomerPaymentHistorySummary;
  pagination: CustomerPaymentHistoryPagination;
  transactions: CustomerPaymentHistoryTransaction[];
  pendingTransfers: CustomerPaymentHistoryPendingTransfer[];
}

export type PaymentLedgerApiResponse = ApiResponse<PaymentLedgerResponse>;
export type CustomerPaymentHistoryApiResponse = ApiResponse<CustomerPaymentHistoryResponse>;
