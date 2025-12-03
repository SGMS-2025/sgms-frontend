import { useState, useEffect, useCallback } from 'react';
import { customerGoalApi } from '@/services/api/customerGoalApi';
import type {
  CustomerGoal,
  CustomerGoalDisplay,
  CreateCustomerGoalRequest,
  UpdateCustomerGoalRequest,
  BackendPaginationResponse
} from '@/types/api/CustomerGoal';
import type { BackendPaginationResponse as TrainingProgressPagination } from '@/types/api/TrainingProgress';
import type { ApiResponse } from '@/types/api/Api';

// Transform function for goal response
const transformGoalToDisplay = (goal: CustomerGoal): CustomerGoalDisplay => ({
  ...goal,
  id: goal._id || goal.id,
  progressPercentage: 0 // Will be calculated based on current progress
});

export interface UseCustomerGoalReturn {
  // Active goal
  activeGoal: CustomerGoalDisplay | null;
  loading: boolean;
  error: string | null;

  // List operations
  goals: CustomerGoalDisplay[];
  pagination: BackendPaginationResponse | TrainingProgressPagination | null;
  refetch: () => Promise<void>;

  // CRUD operations
  createGoal: (data: CreateCustomerGoalRequest) => Promise<ApiResponse<CustomerGoal>>;
  updateGoal: (goalId: string, data: UpdateCustomerGoalRequest) => Promise<ApiResponse<CustomerGoal>>;
  deleteGoal: (goalId: string) => Promise<ApiResponse<void>>;

  // Loading states
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
}

export const useCustomerGoal = (customerId?: string): UseCustomerGoalReturn => {
  // State for active goal
  const [activeGoal, setActiveGoal] = useState<CustomerGoalDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for list (currently unused but kept for interface compatibility)
  const [goals] = useState<CustomerGoalDisplay[]>([]);
  const [pagination] = useState<BackendPaginationResponse | TrainingProgressPagination | null>(null);

  // Operation loading states
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch active goal for customer
  const fetchActiveGoal = useCallback(async () => {
    if (!customerId) {
      setActiveGoal(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await customerGoalApi.getActiveGoalForCustomer(customerId);
      if (response.success && response.data) {
        setActiveGoal(transformGoalToDisplay(response.data));
      } else {
        setActiveGoal(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active goal');
      setActiveGoal(null);
    }

    setLoading(false);
  }, [customerId]);

  // Refetch active goal
  const refetch = useCallback(async () => {
    await fetchActiveGoal();
  }, [fetchActiveGoal]);

  // Create goal
  const createGoal = useCallback(
    async (data: CreateCustomerGoalRequest) => {
      setCreateLoading(true);
      const response = await customerGoalApi.createCustomerGoal(data);
      if (response.success) {
        await refetch();
      }
      setCreateLoading(false);
      return response;
    },
    [refetch]
  );

  // Update goal
  const updateGoal = useCallback(
    async (goalId: string, data: UpdateCustomerGoalRequest) => {
      setUpdateLoading(true);
      const response = await customerGoalApi.updateCustomerGoal(goalId, data);
      if (response.success) {
        await refetch();
      }
      setUpdateLoading(false);
      return response;
    },
    [refetch]
  );

  // Delete goal
  const deleteGoal = useCallback(
    async (goalId: string) => {
      setDeleteLoading(true);
      const response = await customerGoalApi.deleteCustomerGoal(goalId);
      if (response.success) {
        await refetch();
      }
      setDeleteLoading(false);
      return response;
    },
    [refetch]
  );

  // Load active goal when customerId changes
  useEffect(() => {
    fetchActiveGoal();
  }, [fetchActiveGoal]);

  return {
    activeGoal,
    loading,
    error,
    goals,
    pagination,
    refetch,
    createGoal,
    updateGoal,
    deleteGoal,
    createLoading,
    updateLoading,
    deleteLoading
  };
};
