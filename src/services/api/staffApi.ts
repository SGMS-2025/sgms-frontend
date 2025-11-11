import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type {
  Staff,
  StaffStats,
  StaffListParams,
  StaffListResponse,
  StaffUpdateData,
  CreateStaffRequest
} from '@/types/api/Staff';

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

  getStaffByUserId: async (userId: string): Promise<ApiResponse<Staff>> => {
    const response = await api.get(`/staff/user/${userId}`);
    return response.data;
  },

  // Get current user's staff information
  getCurrentUserStaff: async (): Promise<ApiResponse<Staff>> => {
    const response = await api.get('/staff/me');
    return response.data;
  },
  // Get managers belonging to current owner
  getManagers: async (): Promise<ApiResponse<Staff[]>> => {
    const response = await api.get('/staff/managers');
    return response.data;
  },

  // Get current user's staff information
  getMyStaffInfo: async (): Promise<ApiResponse<Staff>> => {
    const response = await api.get('/staff/my-info');
    return response.data;
  },

  // Get staff list by branch ID
  getStaffListByBranch: async (
    branchId: string,
    options: { limit?: number; search?: string; jobTitle?: string } = {}
  ): Promise<ApiResponse<Staff[]>> => {
    const response = await api.get(`/staff/branch/${branchId}`, { params: options });
    return response.data;
  },

  // Get staff by referral code (public endpoint, no auth required)
  getStaffByReferralCode: async (referralCode: string): Promise<ApiResponse<Staff>> => {
    const response = await api.get(`/staff/referral/${referralCode}`);
    return response.data;
  },

  // Update staff information
  updateStaff: async (staffId: string, updateData: StaffUpdateData): Promise<ApiResponse<Staff>> => {
    const response = await api.put(`/staff/${staffId}`, updateData);
    return response.data;
  },

  // Update staff status (automatically sets to DELETED)
  updateStaffStatus: async (staffId: string): Promise<ApiResponse<Staff>> => {
    const response = await api.patch(`/staff/${staffId}/status`);
    return response.data;
  },

  createStaff: async (staffData: CreateStaffRequest, avatar?: File): Promise<ApiResponse<Staff>> => {
    if (avatar) {
      // Create FormData for multipart/form-data request with avatar
      const formData = new FormData();

      // Add all staff data to form
      Object.entries(staffData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'branchId' && Array.isArray(value)) {
            // Handle branchId array specially - append each branch ID separately
            value.forEach((branchId, index) => {
              formData.append(`${key}[${index}]`, branchId.toString());
            });
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Add avatar file
      formData.append('avatar', avatar);

      const response = await api.post('/staff', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } else {
      // Regular JSON request without avatar
      const response = await api.post('/staff', staffData);
      return response.data;
    }
  },

  downloadStaffTemplate: async (): Promise<Blob> => {
    const response = await api.get('/staff/template/download', {
      responseType: 'blob'
    });
    return response.data;
  },

  importStaffsFromFile: async (
    file: File,
    branchId: string
  ): Promise<
    ApiResponse<{
      successCount: number;
      failedCount: number;
      errors: Array<{ row: number; error: string }>;
      generatedPasswords: Array<{ email: string; username: string; password: string }>;
    }>
  > => {
    const formData = new FormData();
    formData.append('excelFile', file);
    formData.append('branchId', branchId);

    const response = await api.post('/staff/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      // @ts-expect-error - Custom config property
      skipErrorToast: true
    });
    return response.data;
  }
};
