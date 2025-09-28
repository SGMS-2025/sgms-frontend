import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type {
  WorkShift,
  WorkShiftStats,
  WorkShiftListParams,
  WorkShiftListResponse,
  CreateWorkShiftRequest,
  UpdateWorkShiftRequest
} from '@/types/api/WorkShift';

export const workShiftApi = {
  // Get all work shifts with filters
  getWorkShifts: async (params: WorkShiftListParams = {}): Promise<ApiResponse<WorkShiftListResponse>> => {
    const response = await api.get('/work-shifts', { params });
    return response.data;
  },

  // Get work shift by ID
  getWorkShiftById: async (id: string): Promise<ApiResponse<WorkShift>> => {
    const response = await api.get(`/work-shifts/${id}`);
    return response.data;
  },

  // Create new work shift
  createWorkShift: async (data: CreateWorkShiftRequest): Promise<ApiResponse<WorkShift>> => {
    const response = await api.post('/work-shifts', data);
    return response.data;
  },

  // Update work shift
  updateWorkShift: async (id: string, data: UpdateWorkShiftRequest): Promise<ApiResponse<WorkShift>> => {
    const response = await api.put(`/work-shifts/${id}`, data);
    return response.data;
  },

  // Soft delete (disable) work shift
  disableWorkShift: async (id: string): Promise<ApiResponse<WorkShift>> => {
    const response = await api.patch(`/work-shifts/${id}/disable`);
    return response.data;
  },

  // Hard delete work shift
  deleteWorkShift: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/work-shifts/${id}`);
    return response.data;
  },

  // Get work shifts by staff ID
  getWorkShiftsByStaff: async (
    staffId: string,
    params: WorkShiftListParams = {}
  ): Promise<ApiResponse<WorkShiftListResponse>> => {
    const response = await api.get(`/work-shifts/staff/${staffId}`, { params });
    return response.data;
  },

  // Get work shift stats
  getWorkShiftStats: async (): Promise<ApiResponse<WorkShiftStats>> => {
    const response = await api.get('/work-shifts/stats');
    return response.data;
  }
};
