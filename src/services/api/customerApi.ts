import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type {
  CustomerDisplay,
  CustomerListParams,
  CustomerListResponse,
  PTCustomerListParams,
  PTCustomerListResponse
} from '@/types/api/Customer';

export const customerApi = {
  getCustomerList: async (params: CustomerListParams = {}): Promise<ApiResponse<CustomerListResponse>> => {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  getCustomerById: async (customerId: string, branchId?: string): Promise<ApiResponse<CustomerDisplay>> => {
    const params = branchId ? { branchId } : {};
    const response = await api.get(`/customers/${customerId}`, { params });
    return response.data;
  },

  updateCustomerStatus: async (customerId: string): Promise<ApiResponse<CustomerDisplay>> => {
    const response = await api.patch(`/customers/${customerId}/disable`);
    return response.data;
  },

  createCustomer: async (
    customerData: Record<string, unknown>,
    avatar?: File
  ): Promise<ApiResponse<CustomerDisplay>> => {
    if (avatar) {
      // Create FormData for multipart/form-data request with avatar
      const formData = new FormData();

      // Add all customer data to form
      Object.entries(customerData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Add avatar file
      formData.append('avatar', avatar);

      const response = await api.post('/customers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } else {
      // Regular JSON request without avatar
      const response = await api.post('/customers', customerData);
      return response.data;
    }
  },

  updateCustomer: async (
    customerId: string,
    updateData: Record<string, unknown>
  ): Promise<ApiResponse<CustomerDisplay>> => {
    const response = await api.put(`/customers/${customerId}`, updateData);
    return response.data;
  },

  importCustomers: async (
    customers: Record<string, unknown>[]
  ): Promise<
    ApiResponse<{
      successCount: number;
      failedCount: number;
      errors: Array<{ row: number; field: string; message: string }>;
    }>
  > => {
    const response = await api.post('/customers/import', { customers });
    return response.data;
  },

  importCustomersFromFile: async (
    file: File,
    branchId?: string
  ): Promise<
    ApiResponse<{
      successCount: number;
      failedCount: number;
      errors: Array<{ row: number; field: string; message: string }>;
    }>
  > => {
    const formData = new FormData();
    formData.append('excelFile', file);
    if (branchId) {
      formData.append('branchId', branchId);
    }

    const response = await api.post('/customers/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  downloadCustomerTemplate: async (): Promise<Blob> => {
    const response = await api.get('/customers/template/download', {
      responseType: 'blob'
    });
    return response.data;
  },

  // PT Customer specific methods
  getCustomersByTrainer: async (
    trainerId: string,
    params: PTCustomerListParams = {}
  ): Promise<ApiResponse<PTCustomerListResponse>> => {
    const response = await api.get(`/customers/trainer/${trainerId}`, { params });
    return response.data;
  }
};
