import { api } from './api';
import type { PTRegistrationFormData, ClassRegistrationFormData, ServiceContractResponse } from '@/types/api/Package';

export interface SchedulingCapacity {
  contractId: string;
  customerName: string;
  packageName: string;
  packageType: string;
  sessionCount: number;
  sessionsRemaining: number;
  completedSessions: number;
  existingSchedules: number;
  availableForScheduling: number;
  canCreateSchedule: boolean;
  message: string;
}

export const serviceContractApi = {
  /**
   * Create service contract for a customer (PT or Class)
   */
  createServiceContract: async (
    customerId: string,
    data: PTRegistrationFormData | ClassRegistrationFormData,
    transferReceiptFile?: File | null
  ): Promise<ServiceContractResponse> => {
    // If transfer receipt file is provided, use FormData
    if (transferReceiptFile) {
      const formData = new FormData();
      // Append all form fields
      Object.entries(data).forEach(([key, value]) => {
        // Skip undefined and null values, but allow empty strings
        if (value !== undefined && value !== null) {
          // For optional fields, only append if it has a value
          if (key === 'discountCampaignId' || key === 'referrerStaffId' || key === 'primaryTrainerId') {
            if (value) {
              formData.append(key, value.toString());
            }
          } else if (Array.isArray(value)) {
            // Handle array fields (e.g., branchId)
            value.forEach((item) => formData.append(key, item.toString()));
          } else {
            // For required fields, always append
            formData.append(key, value.toString());
          }
        }
      });
      // Append transfer receipt file
      formData.append('transferReceipt', transferReceiptFile);

      // Don't set Content-Type header - let axios set it automatically with boundary
      const response = await api.post<ServiceContractResponse>(`/customers/${customerId}/service-contracts`, formData);
      return response.data;
    }

    // Otherwise, use regular JSON request
    const response = await api.post<ServiceContractResponse>(`/customers/${customerId}/service-contracts`, data);
    return response.data;
  },

  /**
   * Get service contracts for a customer
   */
  getCustomerServiceContracts: async (customerId: string): Promise<ServiceContractResponse> => {
    const response = await api.get<ServiceContractResponse>(`/customers/${customerId}/service-contracts`);
    return response.data;
  },

  /**
   * Cancel a service contract
   */
  cancelServiceContract: async (
    contractId: string,
    payload: {
      cancelReason: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; message?: string }> => {
    const response = await api.patch(`/service-contracts/${contractId}/cancel`, payload);
    return response.data;
  },

  /**
   * Confirm QR Bank payment for a service contract
   */
  confirmQRBankPayment: async (contractId: string): Promise<{ success: boolean; data?: unknown; message?: string }> => {
    const response = await api.patch(`/service-contracts/${contractId}/confirm-payment`);
    return response.data;
  },

  /**
   * Extend a service contract
   * Note: This endpoint is not yet implemented on the backend
   */
  extendServiceContract: async (
    contractId: string,
    payload: { extensionMonths: number; notes?: string }
  ): Promise<{ success: boolean; message?: string }> => {
    const response = await api.patch(`/service-contracts/${contractId}/extend`, payload);
    return response.data;
  },

  /**
   * Get scheduling capacity for a PT contract
   * Returns information about available slots for creating schedules
   */
  getSchedulingCapacity: async (contractId: string): Promise<SchedulingCapacity> => {
    const response = await api.get(`/service-contracts/${contractId}/scheduling-capacity`);
    return response.data.data;
  }
};
