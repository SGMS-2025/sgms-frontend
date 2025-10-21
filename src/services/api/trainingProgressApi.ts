import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type {
  TrainingProgress,
  TrainingProgressListParams,
  TrainingProgressListResponse,
  CreateTrainingProgressRequest,
  UpdateTrainingProgressRequest,
  TrainingProgressStats,
  TrainingProgressTrend,
  TrainingProgressPhoto
} from '@/types/api/TrainingProgress';

export const trainingProgressApi = {
  // List with pagination
  getTrainingProgressList: async (
    params: TrainingProgressListParams = {}
  ): Promise<ApiResponse<TrainingProgressListResponse>> => {
    const response = await api.get('/training-progress', { params });
    return response.data;
  },

  // Create new record
  createTrainingProgress: async (data: CreateTrainingProgressRequest): Promise<ApiResponse<TrainingProgress>> => {
    const response = await api.post('/training-progress', data);
    return response.data;
  },

  // Update record
  updateTrainingProgress: async (
    progressId: string,
    data: UpdateTrainingProgressRequest
  ): Promise<ApiResponse<TrainingProgress>> => {
    const response = await api.put(`/training-progress/${progressId}`, data);
    return response.data;
  },

  // Soft delete
  deleteTrainingProgress: async (progressId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/training-progress/${progressId}`);
    return response.data;
  },

  // Statistics
  getCustomerProgressStats: async (
    customerId: string,
    params?: { startDate?: string; days?: number }
  ): Promise<ApiResponse<TrainingProgressStats>> => {
    const response = await api.get(`/training-progress/customer/${customerId}/stats`, { params });
    return response.data;
  },

  // Trend data
  getCustomerProgressTrend: async (
    customerId: string,
    days?: number
  ): Promise<ApiResponse<TrainingProgressTrend[]>> => {
    const response = await api.get(`/training-progress/customer/${customerId}/trend`, {
      params: { days }
    });
    return response.data;
  },

  // Add photos (direct data)
  addPhotosToProgress: async (
    progressId: string,
    photos: TrainingProgressPhoto[]
  ): Promise<ApiResponse<TrainingProgress>> => {
    const response = await api.post(`/training-progress/${progressId}/photos`, { photos });
    return response.data;
  },

  // Upload photos (files)
  uploadPhotosToProgress: async (progressId: string, files: File[]): Promise<ApiResponse<TrainingProgress>> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('photos', file);
    });

    const response = await api.post(`/training-progress/${progressId}/photos/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // 60 seconds timeout for photo upload
    });

    return response.data;
  },

  // Remove photo by index
  removePhotoFromProgress: async (progressId: string, photoIndex: number): Promise<ApiResponse<TrainingProgress>> => {
    const response = await api.delete(`/training-progress/${progressId}/photos/${photoIndex}`);
    return response.data;
  }
};
