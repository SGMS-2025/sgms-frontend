import { useCallback, useEffect, useState } from 'react';
import { mealPlanApi } from '@/services/api/mealPlanApi';
import type {
  MealPlan,
  MealPlanListParams,
  MealPlanListResponse,
  CreateMealPlanRequest,
  UpdateMealPlanRequest
} from '@/types/api/MealPlan';
import type { BackendPaginationResponse } from '@/types/api/TrainingProgress';
import type { ApiResponse } from '@/types/api/Api';

export interface UseMealPlansReturn {
  items: MealPlan[];
  pagination: BackendPaginationResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (data: CreateMealPlanRequest) => Promise<ApiResponse<MealPlan>>;
  update: (id: string, data: UpdateMealPlanRequest) => Promise<ApiResponse<MealPlan>>;
  remove: (id: string) => Promise<ApiResponse<void>>;
  getById: (id: string) => Promise<ApiResponse<MealPlan>>;
  creating: boolean;
  updating: boolean;
  removing: boolean;
}

export const useMealPlans = (initialParams: MealPlanListParams): UseMealPlansReturn => {
  const [items, setItems] = useState<MealPlan[]>([]);
  const [pagination, setPagination] = useState<BackendPaginationResponse | null>(null);
  const [params, setParams] = useState<MealPlanListParams>(initialParams);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await mealPlanApi.getMealPlans(params);
    if (response.success) {
      const data = response.data as MealPlanListResponse;
      setItems(data.items || []);
      setPagination(data.pagination || null);
    } else {
      setError(response.message || 'Failed to fetch meal plans');
    }
    setLoading(false);
  }, [params]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Update params when caller changes initial params (e.g., when active goal loads)
  useEffect(() => {
    setParams(initialParams);
  }, [initialParams]);

  const refetch = useCallback(async () => {
    await fetchList();
  }, [fetchList]);

  const create = useCallback(
    async (data: CreateMealPlanRequest) => {
      setCreating(true);
      const response = await mealPlanApi.createMealPlan(data);
      if (response.success) {
        await refetch();
      }
      setCreating(false);
      return response;
    },
    [refetch]
  );

  const update = useCallback(
    async (id: string, data: UpdateMealPlanRequest) => {
      setUpdating(true);
      const response = await mealPlanApi.updateMealPlan(id, data);
      if (response.success) {
        await refetch();
      }
      setUpdating(false);
      return response;
    },
    [refetch]
  );

  const remove = useCallback(
    async (id: string) => {
      setRemoving(true);
      const response = await mealPlanApi.deleteMealPlan(id);
      if (response.success) {
        await refetch();
      }
      setRemoving(false);
      return response;
    },
    [refetch]
  );

  const getById = useCallback(async (id: string) => {
    const response = await mealPlanApi.getMealPlanById(id);
    return response;
  }, []);

  return {
    items,
    pagination,
    loading,
    error,
    refetch,
    create,
    update,
    remove,
    getById,
    creating,
    updating,
    removing
  };
};
