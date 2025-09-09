import type { User } from './User';

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: null;
  requestId: string;
  timestamp: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber: string;
  role: 'customer' | 'owner';
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  expiresAt: string;
}

export interface VerifyOTPRequest {
  email: string;
  otpCode: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ResendOTPRequest {
  email: string;
}

export interface ResendOTPResponse {
  success: boolean;
  message: string;
  expiresAt: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  data: {
    expiresAt: string;
  };
}

export interface ResetPasswordRequest {
  email: string;
  otpCode: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  data: null;
}
