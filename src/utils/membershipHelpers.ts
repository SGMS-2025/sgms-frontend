import type { MembershipPlan, MembershipPlanBranchInfo, MembershipPlanOverride } from '@/types/api/Membership';

export type ResolvedSource = 'template' | 'override';

export interface PlanResolvedData {
  name: string;
  description?: string;
  price: number;
  currency: string;
  durationInMonths: number;
  benefits: string[];
  isActive: boolean;
  source: ResolvedSource;
  override?: MembershipPlanOverride;
}

export const resolvePlanData = (plan: MembershipPlan, branchId?: string): PlanResolvedData => {
  // If viewing a specific branch and there's an override, use override data
  if (branchId && plan.overrides) {
    const override = plan.overrides.find((o) => o.appliesToBranchId === branchId);
    if (override) {
      return {
        name: override.name || plan.name,
        description: override.description || plan.description,
        price: override.price ?? plan.price,
        currency: override.currency || plan.currency,
        durationInMonths: override.durationInMonths ?? plan.durationInMonths,
        benefits: override.benefits || plan.benefits,
        isActive: override.isActive ?? plan.isActive,
        source: 'override',
        override
      };
    }
  }

  // Otherwise use template data
  return {
    name: plan.name,
    description: plan.description,
    price: plan.price,
    currency: plan.currency,
    durationInMonths: plan.durationInMonths,
    benefits: plan.benefits,
    isActive: plan.isActive,
    source: 'template'
  };
};

export const getBranchName = (
  branch: MembershipPlanBranchInfo,
  branchMap: Record<string, MembershipPlanBranchInfo>
) => {
  const branchInfo = branchMap[branch._id] || branch;
  return {
    name: branchInfo.branchName || 'Unknown Branch',
    location: branchInfo.location
  };
};

export const calculateOverrideCount = (plan: MembershipPlan): number => {
  return plan.overrides?.length || 0;
};

export const getAssignedBranches = (
  plan: MembershipPlan,
  branchMap: Record<string, MembershipPlanBranchInfo>
): MembershipPlanBranchInfo[] => {
  return (
    plan.branchId
      ?.map((branch) => branchMap[branch._id] ?? branch)
      .filter((item): item is MembershipPlanBranchInfo => Boolean(item)) || []
  );
};

export const getCustomBranches = (plan: MembershipPlan): string[] => {
  return plan.overrides?.map((override) => override.appliesToBranchId) || [];
};
