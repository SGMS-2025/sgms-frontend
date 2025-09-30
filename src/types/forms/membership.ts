export interface MembershipTemplateFormValues {
  name: string;
  description: string;
  price: string;
  currency: string;
  durationInMonths: string;
  benefits: string;
  branchId: string[];
  isActive: boolean;
}

export interface MembershipOverrideFormValues {
  name: string;
  description: string;
  price: string;
  currency: string;
  durationInMonths: string;
  benefits: string;
  targetBranchIds: string[];
  revertBranchIds: string[];
  isActive: boolean;
}
