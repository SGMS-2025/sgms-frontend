import type { ApiResponse } from '@/types/api/Api';
import type { BackendPaginationResponse } from '@/types/api/TrainingProgress';

export type MealPlanStatus = 'SUGGESTED' | 'EDITED' | 'FINAL' | 'ARCHIVED' | 'DELETED';

export interface MealItem {
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  ingredients?: string[];
}

export interface Meal {
  mealType: string;
  items: MealItem[];
  totalCalories?: number;
  notes?: string;
}

export interface DayPlan {
  day: string;
  meals: Meal[];
  totalCalories?: number;
  // notes intentionally omitted (backend commented out)
}

export interface MealPlan {
  _id: string;
  customerId: string;
  customerGoalId: string;
  name?: string;
  status: MealPlanStatus;
  days: DayPlan[];
  targetCalories?: number;
  goal?: string;
  focus?: string;
  notes?: string;
  coachingNotes?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlanListParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'status';
  sortOrder?: 'asc' | 'desc' | 1 | -1 | 'ascending' | 'descending';
  customerId?: string;
  customerGoalId?: string;
  status?: MealPlanStatus;
}

export interface MealPlanListResponse {
  items: MealPlan[];
  pagination: BackendPaginationResponse;
}

export type CreateMealPlanRequest = Partial<MealPlan> & {
  customerId: string;
  customerGoalId: string;
};

export type UpdateMealPlanRequest = Partial<MealPlan>;

export type MealPlanListApiResponse = ApiResponse<MealPlanListResponse>;
