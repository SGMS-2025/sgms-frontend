import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type {
  Expense,
  ExpenseListParams,
  ExpenseListResponse,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseStats
} from '@/types/api/Expenses';

export const expensesApi = {
  // Get all expenses with filters
  getExpenses: async (params: ExpenseListParams = {}): Promise<ApiResponse<ExpenseListResponse>> => {
    const response = await api.get('/expenses', { params });
    return response.data;
  },

  // Get expense by ID
  getExpenseById: async (id: string): Promise<ApiResponse<Expense>> => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  // Create new expense
  createExpense: async (data: CreateExpenseRequest): Promise<ApiResponse<Expense>> => {
    const response = await api.post('/expenses', data);
    return response.data;
  },

  // Update expense
  updateExpense: async (id: string, data: UpdateExpenseRequest): Promise<ApiResponse<Expense>> => {
    const response = await api.patch(`/expenses/${id}`, data);
    return response.data;
  },

  // Get expense statistics
  getExpenseStats: async (params: ExpenseListParams = {}): Promise<ApiResponse<ExpenseStats>> => {
    const response = await api.get('/expenses/stats', { params });
    return response.data;
  },

  // Disable expense (soft delete)
  disableExpense: async (id: string): Promise<ApiResponse<Expense>> => {
    const response = await api.patch(`/expenses/${id}/disable`);
    return response.data;
  }
};
