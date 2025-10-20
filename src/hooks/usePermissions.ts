import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { permissionApi } from '@/services/api/permissionApi';
import type {
  Permission,
  UserPermission,
  AssignPermissionRequest,
  AssignMultiplePermissionsRequest,
  AssignManagerToBranchRequest,
  AssignManagerToBranchesRequest,
  AssignStaffToBranchesRequest,
  RevokePermissionRequest,
  CheckPermissionQuery,
  GetUserPermissionsQuery,
  GetEffectivePermissionsQuery,
  PermissionFilters,
  PermissionPaginationParams,
  GetManagerBranchesResponse,
  GetBranchManagersResponse
} from '@/types/api/Permission';

// Hook for managing permissions list
export const usePermissions = (filters?: PermissionFilters, pagination?: PermissionPaginationParams) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { t } = useTranslation();

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await permissionApi.getPermissions(filters, pagination);

    if (response.success) {
      setPermissions(response.data.permissions);
      setTotal(response.data.total);
      setPage(response.data.page);
      setLimit(response.data.limit);
    } else {
      setError(response.message);
      toast.error(t('permissions.fetch_error'));
    }

    setLoading(false);
  }, [filters, pagination, t]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const refetch = useCallback(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    loading,
    error,
    total,
    page,
    limit,
    refetch
  };
};

// Hook for managing user permissions
export const useUserPermissions = (userId?: string, query?: GetUserPermissionsQuery) => {
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const fetchUserPermissions = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    const response = await permissionApi.getUserPermissions(userId, query);

    if (response.success) {
      setUserPermissions(response.data);
    } else {
      setError(response.message);
      toast.error(t('permissions.fetch_user_permissions_error'));
    }

    setLoading(false);
  }, [userId, query, t]);

  useEffect(() => {
    fetchUserPermissions();
  }, [fetchUserPermissions]);

  const refetch = useCallback(() => {
    fetchUserPermissions();
  }, [fetchUserPermissions]);

  return {
    userPermissions,
    loading,
    error,
    refetch
  };
};

// Hook for permission operations
export const usePermissionOperations = () => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const assignPermission = useCallback(
    async (data: AssignPermissionRequest) => {
      setLoading(true);
      const response = await permissionApi.assignPermission(data);

      if (response.success) {
        toast.success(t('permissions.assign_success'));
        setLoading(false);
        return response.data;
      } else {
        toast.error(response.message);
        setLoading(false);
        throw new Error(response.message);
      }
    },
    [t]
  );

  const assignMultiplePermissions = useCallback(
    async (data: AssignMultiplePermissionsRequest) => {
      setLoading(true);
      const response = await permissionApi.assignMultiplePermissions(data);

      if (response.success) {
        toast.success(t('permissions.assign_multiple_success'));
        setLoading(false);
        return response.data;
      } else {
        toast.error(response.message);
        setLoading(false);
        throw new Error(response.message);
      }
    },
    [t]
  );

  const assignManagerToBranch = useCallback(
    async (data: AssignManagerToBranchRequest) => {
      setLoading(true);
      const response = await permissionApi.assignManagerToBranch(data);

      if (response.success) {
        toast.success(t('permissions.assign_manager_success'));
        setLoading(false);
        return response.data;
      } else {
        toast.error(response.message);
        setLoading(false);
        throw new Error(response.message);
      }
    },
    [t]
  );

  const assignManagerToBranches = useCallback(
    async (data: AssignManagerToBranchesRequest) => {
      setLoading(true);
      const response = await permissionApi.assignManagerToBranches(data);

      if (response.success) {
        toast.success(t('permissions.assign_manager_branches_success'));
        setLoading(false);
        return response.data;
      } else {
        toast.error(response.message);
        setLoading(false);
        throw new Error(response.message);
      }
    },
    [t]
  );

  const revokePermission = useCallback(
    async (data: RevokePermissionRequest) => {
      setLoading(true);
      const response = await permissionApi.revokePermission(data);

      if (response.success) {
        toast.success(t('permissions.revoke_success'));
        setLoading(false);
        return response.data;
      } else {
        toast.error(response.message);
        setLoading(false);
        throw new Error(response.message);
      }
    },
    [t]
  );

  const revokeManagerFromBranch = useCallback(
    async (data: AssignManagerToBranchRequest) => {
      setLoading(true);
      const response = await permissionApi.revokeManagerFromBranch(data);

      if (response.success) {
        toast.success(t('permissions.revoke_manager_success'));
        setLoading(false);
        return response.data;
      } else {
        toast.error(response.message);
        setLoading(false);
        throw new Error(response.message);
      }
    },
    [t]
  );

  const bulkRevokePermissions = useCallback(
    async (data: { userIds: string[]; permissionNames: string[]; resourceId?: string; resourceType?: string }) => {
      setLoading(true);
      const response = await permissionApi.bulkRevokePermissions(data);

      if (response.success) {
        toast.success(t('permissions.revoke_success'));
        setLoading(false);
        return response.data;
      } else {
        toast.error(response.message);
        setLoading(false);
        throw new Error(response.message);
      }
    },
    [t]
  );

  const assignStaffToBranches = useCallback(
    async (data: AssignStaffToBranchesRequest) => {
      setLoading(true);
      const response = await permissionApi.assignStaffToBranches(data);

      if (response.success) {
        toast.success(t('permissions.assign_staff_success'));
        setLoading(false);
        return response.data;
      } else {
        toast.error(response.message);
        setLoading(false);
        throw new Error(response.message);
      }
    },
    [t]
  );

  return {
    loading,
    assignPermission,
    assignMultiplePermissions,
    assignManagerToBranch,
    assignManagerToBranches,
    assignStaffToBranches,
    revokePermission,
    revokeManagerFromBranch,
    bulkRevokePermissions
  };
};

// Hook for checking permissions
export const usePermissionCheck = () => {
  const [loading, setLoading] = useState(false);

  const checkPermission = useCallback(async (params: CheckPermissionQuery): Promise<boolean> => {
    setLoading(true);
    const response = await permissionApi.checkPermission(params);

    if (response.success) {
      setLoading(false);
      return response.data.hasPermission;
    }
    setLoading(false);
    return false;
  }, []);

  return {
    loading,
    checkPermission
  };
};

// Hook for effective permissions
export const useEffectivePermissions = (userId?: string, query?: GetEffectivePermissionsQuery) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const fetchEffectivePermissions = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    // Add resourceId and resourceType for branch-scoped permissions
    // Only include resourceId if it's a valid ObjectId, otherwise omit it
    const queryWithResource = {
      ...query
    };

    // Only add resourceId if it's provided and not 'default-branch'
    if (query?.resourceId && query.resourceId !== 'default-branch') {
      queryWithResource.resourceId = query.resourceId;
      queryWithResource.resourceType = query?.resourceType || 'branch';
    }

    const response = await permissionApi.getEffectivePermissions(userId, queryWithResource);

    if (response.success) {
      setPermissions(response.data.permissions);
    } else {
      setError(response.message);
      toast.error(t('permissions.fetch_effective_permissions_error'));
    }

    setLoading(false);
  }, [userId, query, t]);

  useEffect(() => {
    fetchEffectivePermissions();
  }, [fetchEffectivePermissions]);

  const refetch = useCallback(async () => {
    return await fetchEffectivePermissions();
  }, [fetchEffectivePermissions]);

  const hasPermission = useCallback(
    (permissionName: string): boolean => {
      return permissions.includes(permissionName);
    },
    [permissions]
  );

  return {
    permissions,
    loading,
    error,
    refetch,
    hasPermission
  };
};

// Hook for manager branches
export const useManagerBranches = (userId?: string) => {
  const [branches, setBranches] = useState<GetManagerBranchesResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const fetchManagerBranches = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    const response = await permissionApi.getManagerBranches(userId);

    if (response.success) {
      setBranches(response.data);
    } else {
      setError(response.message);
      toast.error(t('permissions.fetch_manager_branches_error'));
    }

    setLoading(false);
  }, [userId, t]);

  useEffect(() => {
    fetchManagerBranches();
  }, [fetchManagerBranches]);

  const refetch = useCallback(() => {
    fetchManagerBranches();
  }, [fetchManagerBranches]);

  return {
    branches,
    loading,
    error,
    refetch
  };
};

// Hook for branch managers
export const useBranchManagers = (branchId?: string) => {
  const [managers, setManagers] = useState<GetBranchManagersResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const fetchBranchManagers = useCallback(async () => {
    if (!branchId) return;

    setLoading(true);
    setError(null);

    const response = await permissionApi.getBranchManagers(branchId);

    if (response.success) {
      setManagers(response.data);
    } else {
      setError(response.message);
      toast.error(t('permissions.fetch_branch_managers_error'));
    }

    setLoading(false);
  }, [branchId, t]);

  useEffect(() => {
    fetchBranchManagers();
  }, [fetchBranchManagers]);

  const refetch = useCallback(() => {
    fetchBranchManagers();
  }, [fetchBranchManagers]);

  return {
    managers,
    loading,
    error,
    refetch
  };
};
