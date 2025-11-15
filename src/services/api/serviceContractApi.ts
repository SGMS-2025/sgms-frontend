import { api } from './api';
import type { PTRegistrationFormData, ClassRegistrationFormData, ServiceContractResponse } from '@/types/api/Package';

export const serviceContractApi = {
  /**
   * Create service contract for a customer (PT or Class)
   */
  createServiceContract: async (
    customerId: string,
    data: PTRegistrationFormData | ClassRegistrationFormData
  ): Promise<ServiceContractResponse> => {
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
   * Extend a service contract
   * Note: This endpoint is not yet implemented on the backend
   */
  extendServiceContract: async (
    contractId: string,
    payload: { extensionMonths: number; notes?: string }
  ): Promise<{ success: boolean; message?: string }> => {
    const response = await api.patch(`/service-contracts/${contractId}/extend`, payload);
    return response.data;
  }
};
