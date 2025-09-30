import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
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
  CheckPermissionResponse,
  GetUserPermissionsQuery,
  GetEffectivePermissionsQuery,
  GetEffectivePermissionsResponse,
  GetManagerBranchesResponse,
  GetBranchManagersResponse,
  PermissionAssignmentResult,
  MultiplePermissionAssignmentResult,
  PermissionPaginationParams,
  PermissionFilters
} from '@/types/api/Permission';

export const permissionApi = {
  getPermissions: async (
    filters?: PermissionFilters,
    pagination?: PermissionPaginationParams
  ): Promise<ApiResponse<{ permissions: Permission[]; total: number; page: number; limit: number }>> => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    if (pagination) {
      Object.entries(pagination).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await api.get(`/permissions?${params.toString()}`);
    return response.data;
  },

  getPermissionById: async (permissionId: string): Promise<ApiResponse<Permission>> => {
    const response = await api.get(`/permissions/${permissionId}`);
    return response.data;
  },

  getPermissionsByResource: async (resource: string): Promise<ApiResponse<Permission[]>> => {
    const response = await api.get(`/permissions/resource/${resource}`);
    return response.data;
  },

  getPermissionsByRole: async (role: string): Promise<ApiResponse<Permission[]>> => {
    const response = await api.get(`/permissions/role/${role}`);
    return response.data;
  },

  assignPermission: async (data: AssignPermissionRequest): Promise<ApiResponse<UserPermission>> => {
    const response = await api.post('/permissions/assign', data);
    return response.data;
  },

  assignMultiplePermissions: async (
    data: AssignMultiplePermissionsRequest
  ): Promise<ApiResponse<PermissionAssignmentResult[]>> => {
    const response = await api.post('/permissions/assign-multiple', data);
    return response.data;
  },

  assignManagerToBranch: async (
    data: AssignManagerToBranchRequest
  ): Promise<ApiResponse<MultiplePermissionAssignmentResult>> => {
    const response = await api.post('/permissions/assign-manager-branch', data);
    return response.data;
  },

  assignManagerToBranches: async (
    data: AssignManagerToBranchesRequest
  ): Promise<ApiResponse<MultiplePermissionAssignmentResult[]>> => {
    const response = await api.post('/permissions/assign-manager-branches', data);
    return response.data;
  },

  assignStaffToBranches: async (
    data: AssignStaffToBranchesRequest
  ): Promise<ApiResponse<MultiplePermissionAssignmentResult[]>> => {
    const response = await api.post('/permissions/assign-staff-branches', data);
    return response.data;
  },

  revokePermission: async (data: RevokePermissionRequest): Promise<ApiResponse<UserPermission>> => {
    const response = await api.delete('/permissions/revoke', { data });
    return response.data;
  },

  revokeManagerFromBranch: async (
    data: AssignManagerToBranchRequest
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const response = await api.delete('/permissions/revoke-manager-branch', { data });
    return response.data;
  },

  checkPermission: async (params: CheckPermissionQuery): Promise<ApiResponse<CheckPermissionResponse>> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const response = await api.get(`/permissions/check?${queryParams.toString()}`);
    return response.data;
  },

  getUserPermissions: async (
    userId: string,
    query?: GetUserPermissionsQuery
  ): Promise<ApiResponse<UserPermission[]>> => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await api.get(`/permissions/user/${userId}?${params.toString()}`);
    return response.data;
  },

  getEffectivePermissions: async (
    userId: string,
    query?: GetEffectivePermissionsQuery
  ): Promise<ApiResponse<GetEffectivePermissionsResponse>> => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await api.get(`/permissions/user/${userId}/effective?${params.toString()}`);
    return response.data;
  },

  getMyPermissions: async (
    query?: GetEffectivePermissionsQuery
  ): Promise<ApiResponse<GetEffectivePermissionsResponse>> => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await api.get(`/permissions/my-permissions?${params.toString()}`);
    return response.data;
  },

  getManagerBranches: async (userId: string): Promise<ApiResponse<GetManagerBranchesResponse[]>> => {
    const response = await api.get(`/permissions/manager/${userId}/branches`);
    return response.data;
  },

  getBranchManagers: async (branchId: string): Promise<ApiResponse<GetBranchManagersResponse[]>> => {
    const response = await api.get(`/permissions/branch/${branchId}/managers`);
    return response.data;
  },

  getAllUserPermissions: async (): Promise<
    ApiResponse<{ userPermissions: UserPermission[]; total: number; page: number; limit: number }>
  > => {
    // This endpoint doesn't exist in backend, return empty result
    return {
      success: true,
      data: {
        userPermissions: [],
        total: 0,
        page: 1,
        limit: 10
      },
      message: 'Endpoint not implemented',
      requestId: '',
      timestamp: new Date().toISOString()
    };
  },

  getAvailableResources: async (): Promise<ApiResponse<string[]>> => {
    return {
      success: true,
      data: [],
      message: 'Endpoint not implemented',
      requestId: '',
      timestamp: new Date().toISOString()
    };
  },

  getAvailableActions: async (): Promise<ApiResponse<string[]>> => {
    return {
      success: true,
      data: [],
      message: 'Endpoint not implemented',
      requestId: '',
      timestamp: new Date().toISOString()
    };
  },

  bulkAssignPermissions: async (data: {
    userIds: string[];
    permissions: {
      permissionName: string;
      scope: string;
      resourceId?: string;
      resourceType?: string;
    }[];
  }): Promise<
    ApiResponse<{
      successful: PermissionAssignmentResult[];
      failed: { userId: string; error: string }[];
    }>
  > => {
    const response = await api.post('/permissions/bulk-assign', data);
    return response.data;
  },

  bulkRevokePermissions: async (data: {
    userIds: string[];
    permissionNames: string[];
    resourceId?: string;
    resourceType?: string;
  }): Promise<
    ApiResponse<{
      successful: { userId: string; permissionName: string }[];
      failed: { userId: string; permissionName: string; error: string }[];
    }>
  > => {
    const response = await api.delete('/permissions/bulk-revoke', { data });
    return response.data;
  }
};
