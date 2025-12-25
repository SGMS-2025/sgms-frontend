import type { ApiResponse } from '@/types/api/Api';
import type {
  DiscountCampaign,
  DiscountCampaignListResponse,
  DiscountCampaignListParams,
  DiscountCampaignApiData
} from '@/types/api/Discount';
import { api } from './api';

export const discountCampaignApi = {
  getCampaignList: async (params?: DiscountCampaignListParams): Promise<ApiResponse<DiscountCampaignListResponse>> => {
    const response = await api.get('/discount-campaigns', { params });
    return response.data;
  },

  getCampaignById: async (campaignId: string): Promise<ApiResponse<DiscountCampaign>> => {
    const response = await api.get(`/discount-campaigns/${campaignId}`);
    return response.data;
  },

  createCampaign: async (campaignData: DiscountCampaignApiData): Promise<ApiResponse<DiscountCampaign>> => {
    const response = await api.post('/discount-campaigns', campaignData);
    return response.data;
  },

  updateCampaign: async (
    campaignId: string,
    updateData: DiscountCampaignApiData
  ): Promise<ApiResponse<DiscountCampaign>> => {
    const response = await api.put(`/discount-campaigns/${campaignId}`, updateData);
    return response.data;
  },

  deleteCampaign: async (campaignId: string): Promise<ApiResponse<void>> => {
    const response = await api.patch(`/discount-campaigns/${campaignId}/status`);
    return response.data;
  },

  /**
   * Get all active campaigns (for dropdowns, etc.)
   * @param params - Optional filters (packageType, branchId)
   */
  getActiveCampaigns: async (params?: {
    packageType?: string;
    branchId?: string;
  }): Promise<ApiResponse<DiscountCampaign[]>> => {
    const response = await api.get<ApiResponse<DiscountCampaign[]>>('/discount-campaigns/active', { params });
    return response.data;
  },

  /**
   * Get active campaigns for a specific branch
   * @param branchId - Branch ID
   * @param params - Optional filters (packageType)
   */
  getActiveCampaignsByBranch: async (
    branchId: string,
    params?: { packageType?: string }
  ): Promise<ApiResponse<DiscountCampaign[]>> => {
    const response = await api.get<ApiResponse<DiscountCampaign[]>>('/discount-campaigns/active', {
      params: { branchId, ...params }
    });
    return response.data;
  },

  /**
   * Get campaign statistics
   */
  getCampaignStats: async (params?: {
    branchId?: string;
  }): Promise<ApiResponse<import('@/types/api/Discount').DiscountCampaignStats>> => {
    const response = await api.get('/discount-campaigns/stats', { params });
    return response.data;
  }
};
