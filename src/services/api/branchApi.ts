import { api } from './api';
import type { BranchListResponse, BranchListParams } from '@/types/api/Branch';

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
  }
};
