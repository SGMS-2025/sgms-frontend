import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type { User } from '@/types/api/User';

export interface UpdateProfileData {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bio?: string;
}

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

    // Sử dụng cấu hình đặc biệt cho multipart/form-data
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
  }
};
