import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type { LoginRequest, LoginResponse, RefreshTokenResponse } from '@/types/api/Auth';

export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await api.post('/users/login', credentials);
    return response.data;
  },

  // Refresh token
  refreshToken: async (): Promise<ApiResponse<RefreshTokenResponse>> => {
    const response = await api.post('/users/refresh');
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await api.post('/users/logout');
  }
};
