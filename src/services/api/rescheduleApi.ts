import { api } from './api';
import type {
  RescheduleRequest,
  RescheduleListResponse,
  RescheduleStats,
  RescheduleListParams,
  CreateRescheduleRequestDto,
  ApproveRescheduleRequestDto,
  RejectRescheduleRequestDto
} from '@/types/api/Reschedule';
import type { ApiResponse } from '@/types/common/BaseTypes';

export const rescheduleApi = {
  // Get my reschedule requests
  getMyRescheduleRequests: async (params: RescheduleListParams = {}): Promise<ApiResponse<RescheduleListResponse>> => {
    const response = await api.get('/reschedule/my-requests', { params });
    return response.data;
  },

  // Get branch reschedule requests (for Manager/Owner)
  getBranchRescheduleRequests: async (
    branchId: string,
    params: RescheduleListParams = {}
  ): Promise<ApiResponse<RescheduleListResponse>> => {
    const response = await api.get(`/reschedule/branch/${branchId}`, { params });
    return response.data;
  },

  // Get staff reschedule requests
  getStaffRescheduleRequests: async (
    staffId: string,
    params: RescheduleListParams = {}
  ): Promise<ApiResponse<RescheduleListResponse>> => {
    const response = await api.get(`/reschedule/staff/${staffId}`, { params });
    return response.data;
  },

  // Get all reschedule requests for approval (Owner/Manager)
  getAllRescheduleRequestsForApproval: async (
    params: RescheduleListParams = {}
  ): Promise<ApiResponse<RescheduleListResponse>> => {
    const response = await api.get('/reschedule/approval-requests', { params });
    return response.data;
  },

  // Get reschedule request by ID
  getRescheduleRequestById: async (requestId: string): Promise<ApiResponse<RescheduleRequest>> => {
    const response = await api.get(`/reschedule/${requestId}`);
    return response.data;
  },

  // Create new reschedule request
  createRescheduleRequest: async (data: CreateRescheduleRequestDto): Promise<ApiResponse<RescheduleRequest>> => {
    const response = await api.post('/reschedule', data);
    return response.data;
  },

  // Accept reschedule request
  acceptRescheduleRequest: async (requestId: string): Promise<ApiResponse<RescheduleRequest>> => {
    const response = await api.post(`/reschedule/${requestId}/accept`);
    return response.data;
  },

  // Approve reschedule request
  approveRescheduleRequest: async (
    requestId: string,
    data: ApproveRescheduleRequestDto
  ): Promise<ApiResponse<RescheduleRequest>> => {
    const response = await api.post(`/reschedule/${requestId}/approve`, data);
    return response.data;
  },

  // Reject reschedule request
  rejectRescheduleRequest: async (
    requestId: string,
    data: RejectRescheduleRequestDto
  ): Promise<ApiResponse<RescheduleRequest>> => {
    const response = await api.post(`/reschedule/${requestId}/reject`, data);
    return response.data;
  },

  // Cancel reschedule request
  cancelRescheduleRequest: async (requestId: string): Promise<ApiResponse<RescheduleRequest>> => {
    const response = await api.post(`/reschedule/${requestId}/cancel`);
    return response.data;
  },

  // Get reschedule stats
  getRescheduleStats: async (): Promise<ApiResponse<RescheduleStats>> => {
    const response = await api.get('/reschedule/stats');
    return response.data;
  },

  // Cleanup expired requests (Admin only)
  cleanupExpiredRequests: async (): Promise<ApiResponse<{ message: string; cleanedCount: number }>> => {
    const response = await api.post('/reschedule/admin/cleanup');
    return response.data;
  }
};
