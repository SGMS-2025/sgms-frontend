import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type {
  FeatureListResponse,
  FeatureListParams,
  Feature,
  CreateFeatureRequest,
  UpdateFeatureRequest
} from '@/types/api/Feature';

export const featureApi = {
  /**
   * Get list of features
   */
  getFeatures: async (params?: FeatureListParams): Promise<FeatureListResponse> => {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const url = queryString ? `/features?${queryString}` : '/features';

    const response = await api.get<FeatureListResponse>(url);
    return response.data;
  },

  /**
   * Get all active features (for dropdowns, etc.)
   */
  getActiveFeatures: async (): Promise<ApiResponse<Feature[]>> => {
    const response = await api.get<ApiResponse<Feature[]>>('/features/active');
    return response.data;
  },

  /**
   * Get feature by ID
   */
  getFeatureById: async (featureId: string): Promise<ApiResponse<Feature>> => {
    const response = await api.get<ApiResponse<Feature>>(`/features/${featureId}`);
    return response.data;
  },

  /**
   * Create new feature
   */
  createFeature: async (data: CreateFeatureRequest, branchId?: string): Promise<ApiResponse<Feature>> => {
    const searchParams = new URLSearchParams();
    if (branchId) {
      searchParams.append('branchId', branchId);
    }

    const queryString = searchParams.toString();
    const url = queryString ? `/features?${queryString}` : '/features';

    const response = await api.post<ApiResponse<Feature>>(url, data);
    return response.data;
  },

  /**
   * Update feature
   */
  updateFeature: async (featureId: string, data: UpdateFeatureRequest): Promise<ApiResponse<Feature>> => {
    const response = await api.patch<ApiResponse<Feature>>(`/features/${featureId}`, data);
    return response.data;
  },

  /**
   * Archive feature (soft delete)
   */
  archiveFeature: async (featureId: string): Promise<ApiResponse<Feature>> => {
    const response = await api.patch<ApiResponse<Feature>>(`/features/${featureId}/archive`);
    return response.data;
  },

  /**
   * Restore archived feature
   */
  restoreFeature: async (featureId: string): Promise<ApiResponse<Feature>> => {
    const response = await api.patch<ApiResponse<Feature>>(`/features/${featureId}/restore`);
    return response.data;
  }
};
