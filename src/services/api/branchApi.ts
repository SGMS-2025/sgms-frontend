import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type {
  BranchListResponse,
  BranchListParams,
  Branch,
  CreateAndUpdateBranchRequest,
  MyBranchesApiResponse
} from '@/types/api/Branch';
import type { BranchWorkingConfig, BranchWorkingConfigRequest } from '@/types/api/BranchWorkingConfig';

export const branchApi = {
  /**
   * Get list of branches/gyms
   */
  getBranches: async (params?: BranchListParams): Promise<BranchListResponse> => {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const url = queryString ? `/branches?${queryString}` : '/branches';

    const response = await api.get<BranchListResponse>(url);
    return response.data;
  },

  /**
   * Get top gyms for landing page (first 3 active gyms with highest rating)
   */
  getTopGyms: async (): Promise<BranchListResponse> => {
    const response = await api.get<BranchListResponse>('/branches', {
      params: {
        limit: 3,
        sortBy: 'rating',
        sortOrder: 'desc',
        isActive: true
      }
    });
    return response.data;
  },

  /**
   * Search gyms by name or location
   */
  searchGyms: async (searchTerm: string, limit?: number): Promise<BranchListResponse> => {
    const response = await api.get<BranchListResponse>('/branches', {
      params: {
        search: searchTerm,
        limit: limit || 10,
        isActive: true
      }
    });
    return response.data;
  },

  // Get my branches (owner only)
  getMyBranches: async (params: BranchListParams = {}): Promise<MyBranchesApiResponse> => {
    const response = await api.get('/branches/my-branches', { params });
    return response.data;
  },

  // Get branches with role-based filtering (for authenticated users)
  getBranchesWithAuth: async (params?: BranchListParams): Promise<BranchListResponse> => {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const url = queryString ? `/branches/authenticated?${queryString}` : '/branches/authenticated';

    const response = await api.get<BranchListResponse>(url);
    return response.data;
  },

  // Get branch detail by ID (public)
  getBranchDetail: async (branchId: string): Promise<ApiResponse<Branch>> => {
    const response = await api.get(`/branches/public/${branchId}`);
    return response.data;
  },

  // Get branch detail by ID (protected - for authenticated users)
  getBranchDetailProtected: async (branchId: string): Promise<ApiResponse<Branch>> => {
    const response = await api.get(`/branches/${branchId}`);
    return response.data;
  },

  // Create new branch (owner only)
  createBranch: async (data: CreateAndUpdateBranchRequest): Promise<ApiResponse<Branch>> => {
    const response = await api.post('/branches', data);
    return response.data;
  },

  // Update branch (owner only)
  updateBranch: async (branchId: string, data: CreateAndUpdateBranchRequest): Promise<ApiResponse<Branch>> => {
    const response = await api.put(`/branches/${branchId}`, data);
    return response.data;
  },

  // Toggle branch status (owner only)
  toggleBranchStatus: async (branchId: string): Promise<ApiResponse<Branch>> => {
    const response = await api.patch(`/branches/${branchId}/status`);
    return response.data;
  },

  /** Get working config of a branch */
  getBranchWorkingConfig: async (
    branchId: string
  ): Promise<{ success: boolean; message: string; data: BranchWorkingConfig }> => {
    const response = await api.get(`/branches/${branchId}/working-config`);
    return response.data;
  },
  /** Update working config of a branch */
  updateBranchWorkingConfig: async (
    branchId: string,
    data: BranchWorkingConfigRequest
  ): Promise<{ success: boolean; message: string; data: BranchWorkingConfig }> => {
    const response = await api.post(`/branches/${branchId}/working-config`, data);
    return response.data;
  }
};
