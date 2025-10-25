import type { PaginationResponse } from '@/types/common/BaseTypes';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  requestId: string;
  timestamp: string;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  pagination: PaginationResponse;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    stack?: string;
  };
  timestamp: string;
  requestId: string;
}
