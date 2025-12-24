import type { Branch } from './Branch';
import type { ServicePackage } from './Package';
import type { MembershipPlan } from './Membership';

// Commission Policy Scope
export type CommissionPolicyScope = 'GLOBAL' | 'BRANCH' | 'ROLE' | 'PACKAGE';

// Commission Policy Status
export type CommissionPolicyStatus = 'ACTIVE' | 'INACTIVE';

// Commission Policy
export interface CommissionPolicy {
  _id: string;
  ownerId: string;
  scope: CommissionPolicyScope;
  branchId?: string | Branch;
  roleType?: string;
  servicePackageId?: string | ServicePackage;
  membershipPlanId?: string | MembershipPlan;
  commissionRate: number;
  priority: number;
  status: CommissionPolicyStatus;
  createdBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Create Commission Policy Request
export interface CreateCommissionPolicyRequest {
  scope: CommissionPolicyScope;
  branchId?: string;
  roleType?: string;
  servicePackageId?: string;
  membershipPlanId?: string;
  commissionRate: number;
  priority?: number;
  notes?: string;
}

// Update Commission Policy Request
export interface UpdateCommissionPolicyRequest {
  commissionRate?: number;
  priority?: number;
  status?: CommissionPolicyStatus;
  notes?: string;
}

// Commission Policy List Params
export interface CommissionPolicyListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  scope?: CommissionPolicyScope;
  branchId?: string;
  roleType?: string;
  servicePackageId?: string;
  membershipPlanId?: string;
  status?: CommissionPolicyStatus | 'all' | 'ALL';
  search?: string;
}

// Commission Policy List Response
export interface CommissionPolicyListResponse {
  policies: CommissionPolicy[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
