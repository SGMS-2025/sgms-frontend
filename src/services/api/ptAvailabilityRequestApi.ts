import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type {
  PTAvailabilityRequest,
  PTAvailabilityRequestStats,
  PTAvailabilityRequestListParams,
  PTAvailabilityRequestListResponse,
  CreatePTAvailabilityRequestRequest,
  CreatePTAvailabilityRequestResponse,
  ApprovePTAvailabilityRequestRequest,
  RejectPTAvailabilityRequestRequest
} from '@/types/api/PTAvailabilityRequest';

export const ptAvailabilityRequestApi = {
  // Get all PT availability requests with filters
  getRequests: async (
    params: PTAvailabilityRequestListParams = {}
  ): Promise<ApiResponse<PTAvailabilityRequestListResponse>> => {
    const response = await api.get('/pt-availability-requests', { params });
    return response.data;
  },

  // Get PT availability request by ID
  getRequestById: async (id: string): Promise<ApiResponse<PTAvailabilityRequest>> => {
    const response = await api.get(`/pt-availability-requests/${id}`);
    return response.data;
  },

  // Create new PT availability request
  createRequest: async (
    data: CreatePTAvailabilityRequestRequest
  ): Promise<ApiResponse<CreatePTAvailabilityRequestResponse>> => {
    const response = await api.post('/pt-availability-requests', data);
    return response.data;
  },

  // Approve PT availability request
  approveRequest: async (
    id: string,
    data?: ApprovePTAvailabilityRequestRequest
  ): Promise<ApiResponse<PTAvailabilityRequest>> => {
    const response = await api.put(`/pt-availability-requests/${id}/approve`, data || {});
    return response.data;
  },

  // Reject PT availability request
  rejectRequest: async (
    id: string,
    data: RejectPTAvailabilityRequestRequest
  ): Promise<ApiResponse<PTAvailabilityRequest>> => {
    const response = await api.put(`/pt-availability-requests/${id}/reject`, data);
    return response.data;
  },

  // Get PT availability requests by staff ID
  getRequestsByStaff: async (
    staffId: string,
    params: PTAvailabilityRequestListParams = {}
  ): Promise<ApiResponse<PTAvailabilityRequestListResponse>> => {
    const response = await api.get(`/pt-availability-requests/staff/${staffId}`, { params });
    return response.data;
  },

  // Get PT availability request stats
  getStats: async (): Promise<ApiResponse<PTAvailabilityRequestStats>> => {
    const response = await api.get('/pt-availability-requests/stats');
    return response.data;
  }
};
