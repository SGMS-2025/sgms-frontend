import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type { UpdateProfileData, User } from '@/types/api/User';

export const userApi = {
  /**
   * Get the profile of the currently logged in user
   */
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  /**
   * Update the profile of the currently logged in user
   */
  updateProfile: async (profileData: UpdateProfileData): Promise<ApiResponse<User>> => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  /**
   * Upload avatar for the currently logged in user
   */
  uploadAvatar: async (file: File): Promise<ApiResponse<User>> => {
    const formData = new FormData();
    formData.append('avatar', file);

    // special config for multipart/form-data
    const response = await api.post('/users/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Delete avatar of the currently logged in user
   */
  deleteAvatar: async (): Promise<ApiResponse<User>> => {
    const response = await api.delete('/users/profile/avatar');
    return response.data;
  },

  /**
   * Get user by ID (admin/manager only)
   */
  getUserById: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  /**
   * Get accounts list (admin only) - CUSTOMER and OWNER roles
   */
  getAccountsList: async (params?: {
    role?: 'CUSTOMER' | 'OWNER';
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'fullName' | 'email' | 'status';
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{ accounts: User[]; pagination: PaginationInfo }>> => {
    const response = await api.get('/users/admin/accounts', { params });
    return response.data;
  },

  /**
   * Lock account (admin only)
   */
  lockAccount: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await api.post(`/users/admin/accounts/${userId}/lock`);
    return response.data;
  },

  /**
   * Unlock account (admin only)
   */
  unlockAccount: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await api.post(`/users/admin/accounts/${userId}/unlock`);
    return response.data;
  },

  /**
   * Get owner detail with branches (admin only)
   */
  getOwnerDetail: async (ownerId: string): Promise<ApiResponse<{ owner: User; branches: Branch[] }>> => {
    const response = await api.get(`/users/admin/accounts/${ownerId}/owner-detail`);
    return response.data;
  }
};

interface Branch {
  _id: string;
  branchName: string;
  location?: string;
  description?: string;
  isActive: boolean;
  ownerId: string;
  managerId?: string[];
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
