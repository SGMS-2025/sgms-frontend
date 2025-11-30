import { useState, useEffect, useCallback } from 'react';
import { commissionPolicyApi } from '@/services/api/commissionPolicyApi';
import type {
  CommissionPolicy,
  CreateCommissionPolicyRequest,
  UpdateCommissionPolicyRequest,
  CommissionPolicyListParams
} from '@/types/api/CommissionPolicy';
// Hook for commission policy list
export const useCommissionPolicyList = (initialParams: CommissionPolicyListParams = {}) => {
  const [policies, setPolicies] = useState<CommissionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);
  const [params, setParams] = useState<CommissionPolicyListParams>(initialParams);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);

    const requestParams = {
      limit: 10,
      ...params
    };

    const response = await commissionPolicyApi.getPolicyList(requestParams).catch(() => ({
      success: false,
      message: 'Network error - Failed to fetch commission policies',
      data: [],
      pagination: {
        page: 1,
        totalPages: 0,
        total: 0,
        limit: 10,
        hasNext: false,
        hasPrev: false
      }
    }));

    if (response.success && response.data) {
      setPolicies(response.data);
      const paginationData = response.pagination;
      setPagination({
        currentPage: paginationData.page,
        totalPages: paginationData.totalPages,
        totalItems: paginationData.total,
        itemsPerPage: paginationData.limit,
        hasNextPage: paginationData.hasNext,
        hasPrevPage: paginationData.hasPrev
      });
    } else {
      setError(response.message || 'Failed to fetch commission policies');
    }

    setLoading(false);
  }, [params]);

  const refetch = useCallback(async () => {
    await fetchPolicies();
  }, [fetchPolicies]);

  const updateFilters = useCallback((newFilters: Partial<CommissionPolicyListParams>) => {
    setParams((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  return {
    policies,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    goToPage
  };
};

// Hook for creating commission policy
export const useCreateCommissionPolicy = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPolicy = useCallback(async (policyData: CreateCommissionPolicyRequest) => {
    setLoading(true);
    setError(null);

    const response = await commissionPolicyApi.createPolicy(policyData).catch(() => ({
      success: false,
      message: 'Network error - Failed to create commission policy',
      data: null
    }));

    if (response.success) {
      setLoading(false);
      return response.data;
    } else {
      const errorMsg = response.message || 'Failed to create commission policy';
      setError(errorMsg);
      setLoading(false);
      throw new Error(errorMsg);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createPolicy,
    loading,
    error,
    resetError
  };
};

// Hook for updating commission policy
export const useUpdateCommissionPolicy = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePolicy = useCallback(async (id: string, updateData: UpdateCommissionPolicyRequest) => {
    setLoading(true);
    setError(null);

    const response = await commissionPolicyApi.updatePolicy(id, updateData).catch(() => ({
      success: false,
      message: 'Network error - Failed to update commission policy',
      data: null
    }));

    if (response.success) {
      setLoading(false);
      return response.data;
    } else {
      const errorMsg = response.message || 'Failed to update commission policy';
      setError(errorMsg);
      setLoading(false);
      throw new Error(errorMsg);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    updatePolicy,
    loading,
    error,
    resetError
  };
};

// Hook for deleting commission policy
export const useDeleteCommissionPolicy = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deletePolicy = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const response = await commissionPolicyApi.deletePolicy(id).catch(() => ({
      success: false,
      message: 'Network error - Failed to delete commission policy',
      data: null
    }));

    if (response.success) {
      setLoading(false);
      return response.data;
    } else {
      const errorMsg = response.message || 'Failed to delete commission policy';
      setError(errorMsg);
      setLoading(false);
      throw new Error(errorMsg);
    }
  }, []);

  return {
    deletePolicy,
    loading,
    error
  };
};

// Hook for getting commission policy by ID
export const useCommissionPolicyDetails = (id: string | null) => {
  const [policy, setPolicy] = useState<CommissionPolicy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicy = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    const response = await commissionPolicyApi.getPolicyById(id).catch(() => ({
      success: false,
      message: 'Network error - Failed to fetch commission policy',
      data: null
    }));

    if (response.success && response.data) {
      setPolicy(response.data);
    } else {
      setError(response.message || 'Failed to fetch commission policy');
    }

    setLoading(false);
  }, [id]);

  const refetch = useCallback(async () => {
    await fetchPolicy();
  }, [fetchPolicy]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  return {
    policy,
    loading,
    error,
    refetch
  };
};
