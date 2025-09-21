import type { ApiResponse } from '@/types/api/Api';
import type { DiscountCampaign, DiscountCampaignListResponse, DiscountCampaignListParams } from '@/types/api/Discount';
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

  createCampaign: async (campaignData: Partial<DiscountCampaign>): Promise<ApiResponse<DiscountCampaign>> => {
    const response = await api.post('/discount-campaigns', campaignData);
    return response.data;
  },

  updateCampaign: async (
    campaignId: string,
    updateData: Partial<DiscountCampaign>
  ): Promise<ApiResponse<DiscountCampaign>> => {
    const response = await api.put(`/discount-campaigns/${campaignId}`, updateData);
    return response.data;
  },

  deleteCampaign: async (campaignId: string): Promise<ApiResponse<void>> => {
    const response = await api.patch(`/discount-campaigns/${campaignId}/status`);
    return response.data;
  }
};
