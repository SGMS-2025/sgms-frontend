import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type { LoginRequest, AuthResponse } from '@/types/api/Auth';

export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/users/login', credentials);
    return response.data;
  }
};
