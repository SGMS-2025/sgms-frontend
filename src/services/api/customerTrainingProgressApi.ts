import { api } from './api';
import type { ApiResponse } from '@/types/api/Api';
import type {
  PTContract,
  TrainingProgressListResponse,
  TrainingProgressStats,
  TrendDataPoint,
  GetContractsParams,
  ListProgressParams,
  GetStatsParams,
  GetTrendParams
} from '@/types/customerTrainingProgress';

export const customerTrainingProgressApi = {
  /**
   * Get customer's PT contracts filtered by status
   */
  getContracts: async (params?: GetContractsParams): Promise<ApiResponse<PTContract[]>> => {
    const response = await api.get<ApiResponse<PTContract[]>>('/customers/me/training-progress/contracts', {
      params
    });
    return response.data;
  },

  /**
   * Get customer's training progress entries with pagination
   */
  listProgress: async (params?: ListProgressParams): Promise<ApiResponse<TrainingProgressListResponse>> => {
    const response = await api.get<ApiResponse<TrainingProgressListResponse>>('/customers/me/training-progress', {
      params
    });
    return response.data;
  },

  /**
   * Get customer's training progress statistics
   */
  getStats: async (params?: GetStatsParams): Promise<ApiResponse<TrainingProgressStats>> => {
    const response = await api.get<ApiResponse<TrainingProgressStats>>('/customers/me/training-progress/stats', {
      params
    });
    return response.data;
  },

  /**
   * Get customer's training progress trend data
   */
  getTrend: async (params?: GetTrendParams): Promise<ApiResponse<TrendDataPoint[]>> => {
    const response = await api.get<ApiResponse<TrendDataPoint[]>>('/customers/me/training-progress/trend', {
      params
    });
    return response.data;
  }
};
