import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type { LoginRequest, LoginResponse } from '@/types/api/Auth';

export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await api.post('/users/login', credentials);
    return response.data;
  }
};
