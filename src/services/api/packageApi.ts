import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type {
  PackageListResponse,
  PackageListParams,
  ServicePackage,
  CreatePackageRequest,
  UpdatePackageRequest
} from '@/types/api/Package';

export const packageApi = {
  /**
   * Get list of service packages
   */
  getPackages: async (params?: PackageListParams): Promise<PackageListResponse> => {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const url = queryString ? `/packages?${queryString}` : '/packages';

    const response = await api.get<PackageListResponse>(url);
    return response.data;
  },

  /**
   * Get all active packages (for dropdowns, etc.)
   */
  getActivePackages: async (): Promise<ApiResponse<ServicePackage[]>> => {
    const response = await api.get<ApiResponse<ServicePackage[]>>('/packages/active');
    return response.data;
  },

  /**
   * Get package by ID
   */
  getPackageById: async (packageId: string): Promise<ApiResponse<ServicePackage>> => {
    const response = await api.get<ApiResponse<ServicePackage>>(`/packages/${packageId}`);
    return response.data;
  },

  /**
   * Create new package
   */
  createPackage: async (data: CreatePackageRequest, branchId?: string): Promise<ApiResponse<ServicePackage>> => {
    const searchParams = new URLSearchParams();
    if (branchId) {
      searchParams.append('branchId', branchId);
    }

    const queryString = searchParams.toString();
    const url = queryString ? `/packages?${queryString}` : '/packages';

    const response = await api.post<ApiResponse<ServicePackage>>(url, data);
    return response.data;
  },

  /**
   * Update package
   */
  updatePackage: async (packageId: string, data: UpdatePackageRequest): Promise<ApiResponse<ServicePackage>> => {
    const response = await api.patch<ApiResponse<ServicePackage>>(`/packages/${packageId}`, data);
    return response.data;
  },

  /**
   * Activate package
   */
  activatePackage: async (packageId: string): Promise<ApiResponse<ServicePackage>> => {
    const response = await api.patch<ApiResponse<ServicePackage>>(`/packages/${packageId}/activate`);
    return response.data;
  },

  /**
   * Deactivate package (soft delete)
   */
  deactivatePackage: async (packageId: string): Promise<ApiResponse<ServicePackage>> => {
    const response = await api.patch<ApiResponse<ServicePackage>>(`/packages/${packageId}/deactivate`);
    return response.data;
  }
};
