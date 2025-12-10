import { api } from './api';
import type {
  MealPlan,
  MealPlanListParams,
  MealPlanListResponse,
  CreateMealPlanRequest,
  UpdateMealPlanRequest,
  GenerateMealPlanRequest,
  GenerateMealPlanResponse
} from '@/types/api/MealPlan';
import type { ApiResponse } from '@/types/api/Api';

export const mealPlanApi = {
  getMealPlans: async (params: MealPlanListParams): Promise<ApiResponse<MealPlanListResponse>> => {
    const response = await api.get('/meal-plans', { params });
    return response.data;
  },

  getMealPlanById: async (mealPlanId: string): Promise<ApiResponse<MealPlan>> => {
    const response = await api.get(`/meal-plans/${mealPlanId}`);
    return response.data;
  },

  createMealPlan: async (data: CreateMealPlanRequest): Promise<ApiResponse<MealPlan>> => {
    const response = await api.post('/meal-plans', data);
    return response.data;
  },

  updateMealPlan: async (mealPlanId: string, data: UpdateMealPlanRequest): Promise<ApiResponse<MealPlan>> => {
    const response = await api.put(`/meal-plans/${mealPlanId}`, data);
    return response.data;
  },

  deleteMealPlan: async (mealPlanId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/meal-plans/${mealPlanId}`);
    return response.data;
  },

  generateMealPlan: async (params: GenerateMealPlanRequest): Promise<ApiResponse<GenerateMealPlanResponse>> => {
    const response = await api.post('/meal-plans/generate', params, {
      // @ts-expect-error Custom flag consumed by interceptor to suppress default toast
      skipErrorToast: true
    });
    return response.data;
  }
};
