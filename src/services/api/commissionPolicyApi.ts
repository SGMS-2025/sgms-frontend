import type { ApiResponse, PaginatedApiResponse } from '@/types/api/Api';
import { api } from './api';
import type {
  CommissionPolicy,
  CreateCommissionPolicyRequest,
  UpdateCommissionPolicyRequest,
  CommissionPolicyListParams
} from '@/types/api/CommissionPolicy';

export interface CreateBulkCommissionPolicyRequest {
  scope: CreateCommissionPolicyRequest['scope'];
  branchId?: string;
  roleType?: string;
  servicePackageIds?: string[];
  membershipPlanIds?: string[];
  commissionRate: number;
  priority?: number;
  notes?: string;
}

export const commissionPolicyApi = {
  /**
   * Create a new commission policy
   */
  createPolicy: async (policyData: CreateCommissionPolicyRequest): Promise<ApiResponse<CommissionPolicy>> => {
    const response = await api.post<ApiResponse<CommissionPolicy>>('/commission-policies', policyData);
    return response.data;
  },

  /**
   * Create multiple commission policies in bulk
   */
  createBulkPolicies: async (bulkData: CreateBulkCommissionPolicyRequest): Promise<ApiResponse<CommissionPolicy[]>> => {
    const response = await api.post<ApiResponse<CommissionPolicy[]>>('/commission-policies/bulk', bulkData);
    return response.data;
  },

  /**
   * Get paginated list of commission policies
   */
  getPolicyList: async (params?: CommissionPolicyListParams): Promise<PaginatedApiResponse<CommissionPolicy[]>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `/commission-policies?${queryString}` : '/commission-policies';
    const response = await api.get<PaginatedApiResponse<CommissionPolicy[]>>(url);
    return response.data;
  },

  /**
   * Get commission policy by ID
   */
  getPolicyById: async (id: string): Promise<ApiResponse<CommissionPolicy>> => {
    const response = await api.get<ApiResponse<CommissionPolicy>>(`/commission-policies/${id}`);
    return response.data;
  },

  /**
   * Update commission policy
   */
  updatePolicy: async (
    id: string,
    updateData: UpdateCommissionPolicyRequest
  ): Promise<ApiResponse<CommissionPolicy>> => {
    const response = await api.patch<ApiResponse<CommissionPolicy>>(`/commission-policies/${id}`, updateData);
    return response.data;
  },

  /**
   * Delete commission policy (soft delete)
   */
  deletePolicy: async (id: string): Promise<ApiResponse<CommissionPolicy>> => {
    const response = await api.delete<ApiResponse<CommissionPolicy>>(`/commission-policies/${id}`);
    return response.data;
  },

  /**
   * Get commission policy statistics
   */
  getPolicyStats: async (
    params?: CommissionPolicyListParams
  ): Promise<ApiResponse<{ total: number; active: number; inactive: number }>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && key !== 'page' && key !== 'limit') {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `/commission-policies/stats?${queryString}` : '/commission-policies/stats';
    const response = await api.get<ApiResponse<{ total: number; active: number; inactive: number }>>(url);
    return response.data;
  }
};
