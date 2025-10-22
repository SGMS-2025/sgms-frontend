import { api } from './api';
import type { ApiResponse } from '@/types/api/Api';
import type {
  PaymentLedgerQuery,
  PaymentLedgerResponse,
  CustomerPaymentHistoryQuery,
  CustomerPaymentHistoryResponse
} from '@/types/api/Payment';

export interface PayOSPaymentData {
  orderCode: number;
  amount: number;
  description: string;
  accountName?: string;
  accountNumber?: string;
  bin?: string;
  checkoutUrl: string;
  qrCode: string | null;
  qrString?: string | null;
  paymentLinkId?: string;
  payment?: Record<string, unknown> | null;
}

export interface CreatePaymentLinkParams {
  customerId: string;
  branchId: string;
  contractId: string;
  contractType: 'service' | 'membership';
  amount: number;
  description: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface CreatePaymentLinkResponse {
  success: boolean;
  data: PayOSPaymentData;
  message: string;
}

export interface CancelPaymentLinkResponse {
  success: boolean;
  data: {
    transaction: unknown;
    statusChanged: boolean;
    message?: string;
  };
  message: string;
}

/**
 * Payment API service for PayOS integration
 */
export const paymentApi = {
  /**
   * Create PayOS payment link for a contract
   * @param params Payment link creation parameters
   * @returns Payment link data with QR code
   */
  createPayOSPaymentLink: async (params: CreatePaymentLinkParams): Promise<CreatePaymentLinkResponse> => {
    // Map our parameters to match backend PayOS service expectations
    const payload = {
      amount: params.amount,
      description: params.description,
      returnUrl: params.returnUrl,
      cancelUrl: params.cancelUrl,
      customerId: params.customerId,
      branchId: params.branchId,
      subjectType: params.contractType === 'service' ? 'SERVICE' : 'MEMBERSHIP',
      subjectId: params.contractId,
      paymentType: params.contractType === 'service' ? 'SERVICE_PACKAGE' : 'MEMBERSHIP_PLAN'
    };

    const response = await api.post('/payos/payment-links', payload);

    // Map backend response to frontend structure
    const backendData = response.data?.data ?? {};
    const paymentRecord = backendData.payment ?? null;

    const mergedMetadata =
      (backendData.metadata && typeof backendData.metadata === 'object' ? backendData.metadata : undefined) ??
      (paymentRecord?.metadata && typeof paymentRecord.metadata === 'object' ? paymentRecord.metadata : undefined) ??
      {};
    const payosMeta =
      mergedMetadata && typeof (mergedMetadata as { payos?: unknown }).payos === 'object'
        ? ((mergedMetadata as { payos?: unknown }).payos as Record<string, unknown>)
        : {};

    const resolveString = (...values: unknown[]): string | undefined => {
      for (const value of values) {
        if (typeof value === 'string' && value.trim().length > 0) {
          return value.trim();
        }
      }
      return undefined;
    };

    const resolveNumber = (...values: unknown[]): number | undefined => {
      for (const value of values) {
        if (typeof value === 'number' && Number.isFinite(value)) {
          return value;
        }
        if (typeof value === 'string') {
          const parsed = Number(value.trim());
          if (Number.isFinite(parsed)) {
            return parsed;
          }
        }
      }
      return undefined;
    };

    const orderCodeValue =
      resolveNumber(backendData.orderCode, backendData.order_code, payosMeta.orderCode, payosMeta.order_code) ?? 0;

    const accountNumber = resolveString(
      backendData.bankAccountNumber,
      paymentRecord?.bankAccountNumber,
      payosMeta.bankAccountNumber,
      payosMeta.accountNumber
    );

    const accountName = resolveString(
      backendData.bankAccountName,
      paymentRecord?.bankAccountName,
      payosMeta.bankAccountName,
      payosMeta.accountName
    );

    const bankCode = resolveString(backendData.bankCode, paymentRecord?.bankCode, payosMeta.bankCode, payosMeta.bin);

    const checkoutUrl = resolveString(
      backendData.paymentLink,
      backendData.paymentUrl,
      backendData.checkoutUrl,
      payosMeta.checkoutUrl,
      payosMeta.paymentUrl
    );

    const qrCode =
      resolveString(backendData.qrCode, payosMeta.qrCode, payosMeta.qrImage, payosMeta.qr_code_url) ?? null;
    const qrString =
      resolveString(backendData.qrString, payosMeta.qrString, payosMeta.qrContent, payosMeta.qr_data) ?? null;

    const paymentLinkId =
      resolveString(
        backendData.paymentLinkId,
        backendData.payment_link_id,
        payosMeta.paymentLinkId,
        payosMeta.payment_link_id
      ) ?? undefined;

    return {
      success: true,
      data: {
        orderCode: orderCodeValue,
        amount: resolveNumber(backendData.amount, payosMeta.amount, params.amount) ?? params.amount,
        description: resolveString(backendData.description, params.description) ?? params.description,
        accountName: accountName ?? '',
        accountNumber: accountNumber ?? '',
        bin: bankCode ?? '',
        checkoutUrl: checkoutUrl ?? '',
        qrCode,
        qrString,
        paymentLinkId,
        payment: paymentRecord
      },
      message: response.data?.message ?? 'Payment link created successfully'
    };
  },

  /**
   * Cancel an existing PayOS payment link by order code
   */
  cancelPayOSPaymentLink: async (orderCode: number, reason?: string): Promise<CancelPaymentLinkResponse> => {
    const response = await api.post(`/payos/payment-links/${orderCode}/cancel`, {
      reason
    });
    return response.data;
  },

  /**
   * Fetch customer payment ledger (contracts + summaries)
   */
  getCustomerPaymentLedger: async (params: PaymentLedgerQuery): Promise<ApiResponse<PaymentLedgerResponse>> => {
    // Filter out undefined values to avoid sending invalid parameters
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );

    const response = await api.get('/debt-payments/ledger', {
      params: {
        ...filteredParams,
        page: params.page ?? 1,
        limit: params.limit ?? 10
      }
    });
    return response.data;
  },

  /**
   * Fetch payment history for a specific customer
   */
  getCustomerPaymentHistory: async (
    customerId: string,
    params: CustomerPaymentHistoryQuery = {}
  ): Promise<ApiResponse<CustomerPaymentHistoryResponse>> => {
    const response = await api.get(`/debt-payments/customer/${customerId}/payments`, {
      params: {
        ...params,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        includePending: params.includePending ?? true
      }
    });

    return response.data;
  },

  /**
   * Poll PayOS payment status by payment link ID
   */
  getPayOSPaymentStatus: async (
    paymentLinkId: string,
    orderCode?: number | string
  ): Promise<ApiResponse<{ status: string }>> => {
    const response = await api.get(`/payos/payment-links/${paymentLinkId}`, {
      params: orderCode ? { orderCode } : undefined
    });
    return response.data;
  }
};
