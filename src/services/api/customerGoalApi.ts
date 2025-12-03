import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type {
  CustomerGoal,
  CustomerGoalListParams,
  CustomerGoalListResponse,
  CreateCustomerGoalRequest,
  UpdateCustomerGoalRequest
} from '@/types/api/CustomerGoal';

export const customerGoalApi = {
  // List with pagination
  getCustomerGoals: async (params: CustomerGoalListParams = {}): Promise<ApiResponse<CustomerGoalListResponse>> => {
    const response = await api.get('/customer-goals', { params });
    return response.data;
  },

  // Get active goal for customer
  getActiveGoalForCustomer: async (customerId: string): Promise<ApiResponse<CustomerGoal | null>> => {
    const response = await api.get(`/customer-goals/customer/${customerId}/active`);
    return response.data;
  },

  // Create new goal
  createCustomerGoal: async (data: CreateCustomerGoalRequest): Promise<ApiResponse<CustomerGoal>> => {
    const response = await api.post('/customer-goals', data);
    return response.data;
  },

  // Update goal
  updateCustomerGoal: async (goalId: string, data: UpdateCustomerGoalRequest): Promise<ApiResponse<CustomerGoal>> => {
    const response = await api.put(`/customer-goals/${goalId}`, data);
    return response.data;
  },

  // Delete goal (soft delete - set status to CANCELLED)
  deleteCustomerGoal: async (goalId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/customer-goals/${goalId}`);
    return response.data;
  }
};
