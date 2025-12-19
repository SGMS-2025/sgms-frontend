import { api } from './api';
import type {
  SubmitBusinessVerificationRequest,
  UpdateBusinessVerificationRequest,
  ApproveBusinessVerificationRequest,
  RejectBusinessVerificationRequest,
  BusinessVerificationListQuery,
  BusinessVerificationResponse,
  BusinessVerificationStatusResponse,
  BusinessVerificationListResponse,
  BusinessVerificationStatisticsResponse
} from '@/types/api/BusinessVerification';

const BASE_URL = '/business-verification';

export const businessVerificationApi = {
  /**
   * Submit business verification request
   */
  submitVerification: async (
    data: Omit<SubmitBusinessVerificationRequest, 'logo'>,
    logoFile: File,
    documentFiles?: File[]
  ): Promise<BusinessVerificationResponse> => {
    const formData = new FormData();

    // Append all text fields
    if (data.taxCode) formData.append('taxCode', data.taxCode);
    if (data.businessCode) formData.append('businessCode', data.businessCode);
    formData.append('businessName', data.businessName);
    formData.append('businessAddress', data.businessAddress);
    formData.append('businessPhone', data.businessPhone);
    formData.append('businessEmail', data.businessEmail);
    if (data.description) formData.append('description', data.description);

    // Append logo file
    formData.append('logo', logoFile);

    // Append document files (if provided)
    if (documentFiles && documentFiles.length > 0) {
      documentFiles.forEach((file) => {
        formData.append('documents', file);
      });
    }

    const response = await api.post(`${BASE_URL}`, formData);

    return response.data;
  },

  /**
   * Update business verification request
   */
  updateVerification: async (
    data: Omit<UpdateBusinessVerificationRequest, 'logo'>,
    logoFile?: File,
    documentFiles?: File[]
  ): Promise<BusinessVerificationResponse> => {
    const formData = new FormData();

    // Append updated fields only
    if (data.taxCode) formData.append('taxCode', data.taxCode);
    if (data.businessCode) formData.append('businessCode', data.businessCode);
    if (data.businessName) formData.append('businessName', data.businessName);
    if (data.businessAddress) formData.append('businessAddress', data.businessAddress);
    if (data.businessPhone) formData.append('businessPhone', data.businessPhone);
    if (data.businessEmail) formData.append('businessEmail', data.businessEmail);
    if (data.description !== undefined) formData.append('description', data.description);

    // Append new logo file if provided
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    // Append new document files (if provided)
    if (documentFiles && documentFiles.length > 0) {
      documentFiles.forEach((file) => {
        formData.append('documents', file);
      });
    }

    const response = await api.put(`${BASE_URL}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  },

  /**
   * Get current user's verification
   */
  getMyVerification: async (): Promise<BusinessVerificationResponse> => {
    const response = await api.get(`${BASE_URL}/my-verification`, {
      // @ts-expect-error - Skip error toast for 404 as it's expected when no verification exists
      skipErrorToast: true
    });
    return response.data;
  },

  /**
   * Get verification status for current user
   */
  getVerificationStatus: async (): Promise<BusinessVerificationStatusResponse> => {
    const response = await api.get(`${BASE_URL}/status`);
    return response.data;
  },

  /**
   * Delete verification
   */
  deleteVerification: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`${BASE_URL}`);
    return response.data;
  },

  // Admin endpoints

  /**
   * Get verification by ID (Admin only)
   */
  getVerificationById: async (id: string): Promise<BusinessVerificationResponse> => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Get list of verifications (Admin only)
   */
  getVerificationList: async (query?: BusinessVerificationListQuery): Promise<BusinessVerificationListResponse> => {
    const response = await api.get(`${BASE_URL}/admin/list`, {
      params: query
    });
    return response.data;
  },

  /**
   * Approve verification (Admin only)
   */
  approveVerification: async (
    id: string,
    data: ApproveBusinessVerificationRequest
  ): Promise<BusinessVerificationResponse> => {
    const response = await api.put(`${BASE_URL}/${id}/approve`, data);
    return response.data;
  },

  /**
   * Reject verification (Admin only)
   */
  rejectVerification: async (
    id: string,
    data: RejectBusinessVerificationRequest
  ): Promise<BusinessVerificationResponse> => {
    const response = await api.put(`${BASE_URL}/${id}/reject`, data);
    return response.data;
  },

  /**
   * Get verification statistics (Admin only)
   */
  getStatistics: async (): Promise<BusinessVerificationStatisticsResponse> => {
    const response = await api.get(`${BASE_URL}/admin/statistics`);
    return response.data;
  }
};
