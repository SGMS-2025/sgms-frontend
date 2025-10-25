import { api } from './api';
import type {
  RefundSuggestion,
  CancelMembershipPayload,
  MembershipContract,
  MembershipPlan,
  MembershipPlanListParams,
  PublicMembershipPlanParams,
  CreatePublicMembershipContractPayload,
  CreatePublicMembershipContractResponse,
  CreatePublicMembershipContractPayOSPayload,
  CreatePublicMembershipContractPayOSResponse
} from '../../types/api/Membership';
import type { BackendPaginationResponse } from '../../types/api/Branch';

export const membershipApi = {
  /**
   * Get refund suggestion for a membership contract
   */
  getRefundSuggestion: async (contractId: string): Promise<RefundSuggestion> => {
    const response = await api.get(`/membership-contracts/${contractId}/refund-suggestion`);
    return response.data.data;
  },

  /**
   * Cancel a membership contract
   */
  cancelMembership: async (contractId: string, payload: CancelMembershipPayload): Promise<{ message: string }> => {
    const response = await api.patch(`/membership-contracts/${contractId}/cancel`, payload);
    return response.data.data;
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
  ): Promise<{ success: boolean; data: MembershipPlan[]; message?: string }> => {
    const response = await api.get('/membership-plans/public', { params });
    return response.data;
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
    data: Partial<MembershipPlan>
  ): Promise<{ success: boolean; data: MembershipPlan; message?: string }> => {
    const response = await api.post('/membership-plans', data);
    return response.data;
  },

  /**
   * Update membership plan
   */
  updateMembershipPlan: async (
    id: string,
    data: Partial<MembershipPlan>
  ): Promise<{ success: boolean; data: MembershipPlan; message?: string }> => {
    const response = await api.put(`/membership-plans/${id}`, data);
    return response.data;
  },

  /**
   * Toggle membership plan status
   */
  toggleMembershipPlanStatus: async (
    id: string
  ): Promise<{ success: boolean; data: MembershipPlan; message?: string }> => {
    const response = await api.patch(`/membership-plans/${id}/toggle-status`);
    return response.data;
  }
};
