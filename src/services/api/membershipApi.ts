import { api } from './api';
import type {
  CancelMembershipPayload,
  MembershipContract,
  MembershipPlan,
  CreateMembershipPlanRequest,
  UpdateMembershipPlanRequest,
  MembershipPlanListParams,
  PublicMembershipPlanParams,
  CreatePublicMembershipContractPayload,
  CreatePublicMembershipContractResponse,
  CreatePublicMembershipContractPayOSPayload,
  CreatePublicMembershipContractPayOSResponse
} from '../../types/api/Membership';
import type { MembershipRegistrationFormData, MembershipContractResponse } from '../../types/api/Customer';
import type { BackendPaginationResponse } from '../../types/api/Branch';

export const membershipApi = {
  /**
   * Cancel a membership contract
   */
  cancelMembership: async (contractId: string, payload: CancelMembershipPayload): Promise<{ message: string }> => {
    const response = await api.patch(`/membership-contracts/${contractId}/cancel`, payload);
    return response.data.data;
  },

  /**
   * Create membership contract for a customer (staff/owner flow)
   */
  createMembershipContract: async (
    customerId: string,
    data: MembershipRegistrationFormData
  ): Promise<MembershipContractResponse> => {
    const response = await api.post(`/customers/${customerId}/memberships`, data);
    return response.data;
  },

  /**
   * Get membership contracts for a customer
   */
  getCustomerMemberships: async (customerId: string): Promise<MembershipContract[]> => {
    const response = await api.get(`/customers/${customerId}/memberships`);
    return response.data;
  },

  /**
   * Get membership contracts for the authenticated customer (public flow)
   */
  getMyMembershipContracts: async (params: { branchId?: string }): Promise<MembershipContract[]> => {
    const response = await api.get('/membership-contracts/public', { params });
    return response.data.data;
  },

  /**
   * Cancel membership contract (public flow)
   */
  cancelPublicMembershipContract: async (
    contractId: string,
    payload: { reason?: string }
  ): Promise<{ success: boolean; data: MembershipContract; message?: string }> => {
    const response = await api.patch(`/membership-contracts/public/${contractId}/cancel`, payload);
    return response.data;
  },

  /**
   * Get membership plans
   */
  getMembershipPlans: async (
    params: MembershipPlanListParams,
    branchIds: string[]
  ): Promise<{
    success: boolean;
    data: { plans: MembershipPlan[]; pagination: BackendPaginationResponse | null };
    message?: string;
  }> => {
    const response = await api.get('/membership-plans', {
      params: { ...params, branchIds: branchIds.join(',') }
    });
    return response.data;
  },

  /**
   * Get public membership plans
   */
  getPublicMembershipPlans: async (
    params: PublicMembershipPlanParams
  ): Promise<{
    success: boolean;
    data?: { plans: MembershipPlan[]; pagination: BackendPaginationResponse | null };
    message?: string;
  }> => {
    const response = await api.get('/membership-plans/public', { params });
    const payload = response.data;

    if (payload?.success) {
      const rawData = payload.data;
      if (Array.isArray(rawData)) {
        return {
          ...payload,
          data: {
            plans: rawData,
            pagination: null
          }
        };
      }
      return payload;
    }

    return payload;
  },

  /**
   * Create membership contract from public flow (customer self-service)
   */
  createPublicMembershipContract: async (
    payload: CreatePublicMembershipContractPayload
  ): Promise<{ success: boolean; data: CreatePublicMembershipContractResponse; message?: string }> => {
    const response = await api.post('/membership-contracts/public', payload);
    return response.data;
  },

  /**
   * Create membership contract with PayOS payment (customer self-service)
   */
  createPublicMembershipContractPayOS: async (
    payload: CreatePublicMembershipContractPayOSPayload
  ): Promise<{ success: boolean; data: CreatePublicMembershipContractPayOSResponse; message?: string }> => {
    const response = await api.post('/membership-contracts/public/payos', payload);
    return response.data;
  },

  /**
   * Create membership plan
   */
  createMembershipPlan: async (
    data: CreateMembershipPlanRequest
  ): Promise<{ success: boolean; data: MembershipPlan; message?: string }> => {
    const response = await api.post('/membership-plans', data);
    return response.data;
  },

  /**
   * Update membership plan
   */
  updateMembershipPlan: async (
    id: string,
    data: UpdateMembershipPlanRequest,
    branchIds?: string[]
  ): Promise<{ success: boolean; data: MembershipPlan; message?: string }> => {
    // If updateScope is already provided, use the data as-is (for branches update)
    if (data.updateScope) {
      const payload = branchIds ? { ...data, branchId: branchIds } : data;
      const response = await api.patch(`/membership-plans/${id}`, payload);
      return response.data;
    }

    // Otherwise, wrap in template update format (legacy support)
    const { name, description, price, currency, durationInMonths, benefits, isActive, ...rest } = data;

    const payload: {
      updateScope: 'template';
      data?: Record<string, unknown>;
      branchId?: string[];
    } = {
      updateScope: 'template'
    };

    // Wrap legacy fields in data object
    if (
      name ||
      description ||
      price !== undefined ||
      currency ||
      durationInMonths !== undefined ||
      benefits ||
      isActive !== undefined
    ) {
      payload.data = {};
      if (name !== undefined) payload.data.name = name;
      if (description !== undefined) payload.data.description = description;
      if (price !== undefined) payload.data.price = price;
      if (currency !== undefined) payload.data.currency = currency;
      if (durationInMonths !== undefined) payload.data.durationInMonths = durationInMonths;
      if (benefits !== undefined) payload.data.benefits = benefits;
      if (isActive !== undefined) payload.data.isActive = isActive;
    }

    // Add branchId if provided
    if (branchIds && branchIds.length > 0) {
      payload.branchId = branchIds;
    } else if (rest.branchId) {
      payload.branchId = rest.branchId;
    }

    const response = await api.patch(`/membership-plans/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle membership plan status
   */
  toggleMembershipPlanStatus: async (
    id: string,
    data: { isActive: boolean; branchId: string[] }
  ): Promise<{ success: boolean; data: MembershipPlan; message?: string }> => {
    const response = await api.patch(`/membership-plans/${id}/toggle-status`, data);
    return response.data;
  },

  /**
   * Extend a membership contract (public flow for customer)
   */
  extendMembership: async (
    contractId: string,
    payload: { extensionMonths: number; notes?: string }
  ): Promise<{ success: boolean; data: MembershipContract; message?: string }> => {
    const response = await api.patch(`/membership-contracts/public/${contractId}/extend`, payload);
    return response.data;
  },

  /**
   * Confirm QR Bank payment
   */
  confirmQRBankPayment: async (
    contractId: string
  ): Promise<{ success: boolean; data: MembershipContract; message?: string }> => {
    const response = await api.patch(`/membership-contracts/${contractId}/confirm-payment`);
    return response.data;
  }
};
