import type { ApiResponse } from '@/types/api/Api';
import type {
  MembershipPlan,
  MembershipPlanListParams,
  MembershipPlanListResponse,
  CreateMembershipPlanPayload,
  UpdateMembershipPlanPayload,
  ToggleMembershipPlanStatusPayload,
  PublicMembershipPlanParams,
  PublicMembershipPlanResponse
} from '@/types/api/Membership';
import { api } from './api';

const MEMBERSHIP_RESOURCE_TYPE = 'branch';

const withResourceContext = <T extends object>(payload: T, resourceIds: string[] | string) => {
  const ids = Array.isArray(resourceIds) ? resourceIds : [resourceIds];

  return {
    ...payload,
    resourceId: ids,
    resourceType: MEMBERSHIP_RESOURCE_TYPE
  };
};

export const membershipApi = {
  getMembershipPlans: async (
    params: MembershipPlanListParams,
    resourceBranchIds?: string[]
  ): Promise<ApiResponse<MembershipPlanListResponse>> => {
    const sanitizedParams: Record<string, unknown> = {};

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed || trimmed === 'all') {
          return;
        }
        sanitizedParams[key] = trimmed;
        return;
      }

      if (Array.isArray(value) && value.length === 0) {
        return;
      }

      sanitizedParams[key] = value;
    });

    if (!sanitizedParams.branchId && resourceBranchIds && resourceBranchIds.length) {
      sanitizedParams.branchId = resourceBranchIds;
    }

    if (resourceBranchIds && resourceBranchIds.length) {
      sanitizedParams.resourceId = resourceBranchIds;
      sanitizedParams.resourceType = MEMBERSHIP_RESOURCE_TYPE;
    }

    const response = await api.get('/membership-plans', { params: sanitizedParams });
    return response.data;
  },

  getMembershipPlanById: async (id: string): Promise<ApiResponse<MembershipPlan>> => {
    const response = await api.get(`/membership-plans/${id}`);
    return response.data;
  },

  createMembershipPlan: async (payload: CreateMembershipPlanPayload): Promise<ApiResponse<MembershipPlan>> => {
    const response = await api.post('/membership-plans', withResourceContext(payload, payload.branchId));
    return response.data;
  },

  updateMembershipPlan: async (
    id: string,
    payload: UpdateMembershipPlanPayload,
    resourceBranchIds: string[]
  ): Promise<ApiResponse<MembershipPlan>> => {
    const response = await api.patch(`/membership-plans/${id}`, withResourceContext(payload, resourceBranchIds));
    return response.data;
  },

  toggleMembershipPlanStatus: async (
    id: string,
    payload: ToggleMembershipPlanStatusPayload
  ): Promise<ApiResponse<MembershipPlan>> => {
    const response = await api.patch(
      `/membership-plans/${id}/status`,
      withResourceContext({ isActive: payload.isActive }, payload.branchId)
    );
    return response.data;
  },

  getPublicMembershipPlans: async (
    params: PublicMembershipPlanParams
  ): Promise<ApiResponse<PublicMembershipPlanResponse>> => {
    const response = await api.get('/membership-plans/public', { params });
    return response.data;
  }
};
