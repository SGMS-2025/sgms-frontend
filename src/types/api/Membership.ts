export type MembershipPlanUpdateScope = 'template' | 'branches';

export interface MembershipPlanBranchInfo {
  _id: string;
  branchName: string;
  location?: string;
  ownerId?: string;
  isActive?: boolean;
}

export interface MembershipPlanOverride {
  _id: string;
  parentPlanId: string;
  appliesToBranchId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  durationInMonths: number;
  benefits: string[];
  isActive: boolean;
  branchId: MembershipPlanBranchInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPlan {
  _id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  durationInMonths: number;
  benefits: string[];
  isActive: boolean;
  isTemplate: boolean;
  branchId: MembershipPlanBranchInfo[];
  parentPlanId?: string | null;
  appliesToBranchId?: string | null;
  overrides?: MembershipPlanOverride[];
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPlanListParams {
  branchId?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MembershipPlanListResponse {
  plans: MembershipPlan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateMembershipPlanPayload {
  name: string;
  description?: string;
  price: number;
  currency: string;
  durationInMonths: number;
  benefits: string[];
  branchId: string[];
  isActive?: boolean;
}

export interface MembershipPlanUpdateData {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  durationInMonths?: number;
  benefits?: string[];
  isActive?: boolean;
}

export interface ToggleMembershipPlanStatusPayload {
  isActive: boolean;
  branchId: string[];
}

export interface UpdateMembershipPlanPayload {
  updateScope: MembershipPlanUpdateScope;
  data?: MembershipPlanUpdateData;
  branchId?: string[];
  targetBranchIds?: string[];
  revertBranchIds?: string[];
}

export interface PublicMembershipPlanParams {
  branchId: string;
}

import type { BackendPaginationResponse } from './Branch';

export interface PublicMembershipPlanResponse {
  plans: MembershipPlan[];
  pagination?: BackendPaginationResponse;
}
