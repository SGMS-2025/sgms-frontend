export interface CancelMembershipPayload {
  cancelReason: string;
  notes?: string;
}

export interface MembershipContract {
  _id: string;
  customerId: string;
  branchId: string;
  membershipPlanId: string;
  discountCampaignId?: string;
  discountCampaignSnapshot?: {
    _id: string;
    campaignName: string;
    discountPercentage: number;
    startDate: string;
    endDate: string;
    status: string;
  };
  activationDate?: string;
  startDate: string;
  endDate: string;
  price: number;
  discountAmount: number;
  total: number;
  paidAmount: number;
  referrerStaffId?: string;
  createdBy?: string;
  status: 'PENDING_ACTIVATION' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELED' | 'PAST_DUE';
  notes?: string;
  canceledAt?: string;
  canceledBy?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  durationInMonths: number;
  benefits: string[];
  status: 'ACTIVE' | 'INACTIVE';
  currency: string;
  isActive: boolean;
  isTemplate: boolean;
  branchId?: MembershipPlanBranchInfo[];
  overrides?: MembershipPlanOverride[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMembershipPlanRequest {
  name: string;
  description?: string;
  price: number;
  currency: string;
  durationInMonths: number;
  benefits: string[];
  branchId: string[];
  isActive: boolean;
}

export interface UpdateMembershipPlanRequest {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  durationInMonths?: number;
  benefits?: string[];
  branchId?: string[];
  isActive?: boolean;
}

export interface MembershipPlanBranchInfo {
  _id: string;
  branchId: string;
  branchName: string;
  location: string;
  price: number;
  isActive: boolean;
}

export interface MembershipPlanOverride {
  appliesToBranchId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationInMonths: number;
  benefits: string[];
  isActive: boolean;
}

export interface MembershipPlanListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  branchId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MembershipPlanListResponse {
  plans: MembershipPlan[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface PublicMembershipPlanParams {
  branchId?: string;
  status?: string;
}

export interface Branch {
  _id: string;
  branchName: string;
  address: string;
  phoneNumber?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export type MembershipPaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'QR_BANK';

export interface PublicMembershipCustomerSummary {
  _id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
}

export interface CreatePublicMembershipContractPayload {
  branchId: string;
  membershipPlanId: string;
  paymentMethod: MembershipPaymentMethod;
  startDate?: string;
  note?: string;
  transactionCode?: string;
  referralCode?: string; // CASE 1: Referral code from PT
  proofImageUrls?: string[];
}

export interface CreatePublicMembershipContractResponse {
  contract: MembershipContract;
  customer: PublicMembershipCustomerSummary;
}

export interface PayOSPaymentInfo {
  orderCode: number;
  amount: number;
  description: string;
  accountName?: string;
  accountNumber?: string;
  bin?: string;
  transferContent?: string;
  bankName?: string;
  bankShortName?: string;
  checkoutUrl: string;
  qrCode: string | null;
  qrString?: string | null;
  paymentLinkId?: string;
  payment?: Record<string, unknown> | null;
}

export interface CreatePublicMembershipContractPayOSPayload {
  branchId: string;
  membershipPlanId: string;
  startDate?: string;
  note?: string;
  referralCode?: string; // CASE 1: Referral code from PT
  returnUrl?: string;
  cancelUrl?: string;
}

export interface CreatePublicMembershipContractPayOSResponse {
  contract: MembershipContract;
  customer: PublicMembershipCustomerSummary;
  payment: PayOSPaymentInfo;
}
