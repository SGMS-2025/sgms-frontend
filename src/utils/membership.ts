import type { MembershipPlan } from '@/types/api/Membership';
import type { MembershipOverrideFormValues, MembershipTemplateFormValues } from '@/types/forms/membership';

export const formatCurrency = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
};

export const parseBenefits = (benefits: string) =>
  benefits
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export const buildDefaultFormValues = (plan?: MembershipPlan): MembershipTemplateFormValues => ({
  name: plan?.name ?? '',
  description: plan?.description ?? '',
  price: plan ? String(plan.price) : '',
  currency: plan?.currency ?? 'VND',
  durationInMonths: plan ? String(plan.durationInMonths) : '1',
  benefits: plan?.benefits?.join('\n') ?? '',
  branchId: plan?.branchId?.map((branch) => branch._id) ?? [],
  isActive: plan?.isActive ?? true
});

export const buildOverrideFormValues = (plan: MembershipPlan, branchId?: string): MembershipOverrideFormValues => {
  const override = branchId ? plan.overrides?.find((item) => item.appliesToBranchId === branchId) : undefined;

  return {
    name: override?.name ?? plan.name ?? '',
    description: override?.description ?? plan.description ?? '',
    price: String(override?.price ?? plan.price ?? ''),
    currency: (override?.currency ?? plan.currency ?? 'VND').toUpperCase(),
    durationInMonths: String(override?.durationInMonths ?? plan.durationInMonths ?? '1'),
    benefits: (override?.benefits ?? plan.benefits ?? []).join('\n'),
    targetBranchIds: [],
    revertBranchIds: [],
    isActive: override?.isActive ?? plan.isActive ?? true
  };
};
