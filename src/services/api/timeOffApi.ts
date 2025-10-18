import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type {
  TimeOff,
  TimeOffStats,
  TimeOffListParams,
  TimeOffListResponse,
  CreateTimeOffRequest,
  CreateTimeOffResponse,
  UpdateTimeOffRequest
} from '@/types/api/TimeOff';

export const timeOffApi = {
  // Get all time off requests with filters
  getTimeOffs: async (params: TimeOffListParams = {}): Promise<ApiResponse<TimeOffListResponse>> => {
    const response = await api.get('/time-off', { params });
    return response.data;
  },

  // Get time off request by ID
  getTimeOffById: async (id: string): Promise<ApiResponse<TimeOff>> => {
    const response = await api.get(`/time-off/${id}`);
    return response.data;
  },

  // Create new time off request
  createTimeOff: async (data: CreateTimeOffRequest): Promise<ApiResponse<CreateTimeOffResponse>> => {
    const response = await api.post('/time-off', data);
    return response.data;
  },

  // Update time off request
  updateTimeOff: async (id: string, data: UpdateTimeOffRequest): Promise<ApiResponse<TimeOff>> => {
    const response = await api.put(`/time-off/${id}`, data);
    return response.data;
  },

  // Approve time off request
  approveTimeOff: async (id: string): Promise<ApiResponse<TimeOff>> => {
    const response = await api.patch(`/time-off/${id}/approve`);
    return response.data;
  },

  // Reject time off request
  rejectTimeOff: async (id: string): Promise<ApiResponse<TimeOff>> => {
    const response = await api.patch(`/time-off/${id}/reject`);
    return response.data;
  },

  // Cancel time off request
  cancelTimeOff: async (id: string): Promise<ApiResponse<TimeOff>> => {
    const response = await api.patch(`/time-off/${id}/cancel`);
    return response.data;
  },

  // Delete time off request
  deleteTimeOff: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/time-off/${id}`);
    return response.data;
  },

  // Get time off requests by staff ID
  getTimeOffsByStaff: async (
    staffId: string,
    params: TimeOffListParams = {}
  ): Promise<ApiResponse<TimeOffListResponse>> => {
    const response = await api.get(`/time-off/staff/${staffId}`, { params });
    return response.data;
  },

  // Get time off request stats
  getTimeOffStats: async (): Promise<ApiResponse<TimeOffStats>> => {
    const response = await api.get('/time-off/stats');
    return response.data;
  }
};
