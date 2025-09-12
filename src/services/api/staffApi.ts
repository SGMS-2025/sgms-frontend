import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type { Staff, StaffStats, StaffListParams, StaffListResponse } from '@/types/api/Staff';

export const staffApi = {
  getStaffList: async (params: StaffListParams = {}): Promise<ApiResponse<StaffListResponse>> => {
    const response = await api.get('/staff', { params });
    return response.data;
  },

  getStaffStats: async (): Promise<ApiResponse<StaffStats>> => {
    const response = await api.get('/staff/stats');
    return response.data;
  },

  getStaffById: async (staffId: string): Promise<ApiResponse<Staff>> => {
    const response = await api.get(`/staff/${staffId}`);
    return response.data;
  },
  // Get managers belonging to current owner
  getManagers: async (): Promise<ApiResponse<Staff[]>> => {
    const response = await api.get('/staff/managers');
    return response.data;
  }
};
