import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  ResendOTPRequest,
  ResendOTPResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse
} from '@/types/api/Auth';

export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await api.post('/users/login', credentials);
    return response.data;
  },

  // Register
  register: async (userData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> => {
    const response = await api.post('/users/register', userData);
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (otpData: VerifyOTPRequest): Promise<ApiResponse<VerifyOTPResponse>> => {
    const response = await api.post('/users/verify-otp', otpData);
    return response.data;
  },

  // Resend OTP
  resendOTP: async (resendData: ResendOTPRequest): Promise<ApiResponse<ResendOTPResponse>> => {
    const response = await api.post('/users/resend-otp', resendData);
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
  },

  // Forgot Password
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ApiResponse<ForgotPasswordResponse>> => {
    const response = await api.post('/users/forgot-password', data);
    return response.data;
  },

  // Reset Password
  resetPassword: async (data: ResetPasswordRequest): Promise<ApiResponse<ResetPasswordResponse>> => {
    const response = await api.post('/users/reset-password', data);
    return response.data;
  },

  // Resend Forgot Password OTP
  resendForgotPasswordOTP: async (data: ForgotPasswordRequest): Promise<ApiResponse<ForgotPasswordResponse>> => {
    const response = await api.post('/users/resend-reset-otp', data);
    return response.data;
  },

  // Verify Forgot Password OTP
  verifyForgotPasswordOTP: async (data: VerifyOTPRequest): Promise<ApiResponse<VerifyOTPResponse>> => {
    const response = await api.post('/users/verify-forgot-password-otp', data);
    return response.data;
  }
};
