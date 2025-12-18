import type { BaseEntity, PaginationParams, PaginationResponse, SortOrder } from '@/types/common/BaseTypes';

export type TransactionStatus = 'PENDING' | 'SETTLED' | 'FAILED' | 'VOID';
export type TransactionMethod = 'CASH' | 'BANK_TRANSFER' | 'QR_BANK';
export type TransactionSubjectType = 'MEMBERSHIP' | 'SERVICE';
export type TransactionType = 'RECEIPT' | 'ADJUSTMENT' | 'EXPENSE' | 'REFUND';

export interface TransactionCustomerUser {
  _id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
}

export interface TransactionCustomer {
  _id: string;
  userId?: TransactionCustomerUser | string | null;
}

export interface TransactionBranch {
  _id: string;
  branchName?: string;
  address?: string;
}

export interface TransactionMembershipPlan {
  _id: string;
  name?: string;
  price?: number;
}

export interface TransactionServicePackage {
  _id: string;
  name?: string;
  type?: string;
  defaultPriceVND?: number;
}

export interface TransactionRecordedBy {
  _id: string;
  fullName?: string;
  email?: string;
}

export interface Transaction extends BaseEntity {
  subjectType: TransactionSubjectType;
  subjectId: string;
  customerId: TransactionCustomer | string;
  branchId: TransactionBranch | string;
  membershipPlanId?: TransactionMembershipPlan | string | null;
  servicePackageId?: TransactionServicePackage | string | null;
  discountCampaignId?: string | null;
  type: TransactionType;
  method: TransactionMethod;
  status: TransactionStatus;
  amount: number;
  currency: string;
  occurredAt: string;
  referenceCode?: string | null;
  note?: string | null;
  recordedBy?: TransactionRecordedBy | string | null;
  meta?: Record<string, unknown> | null;
  transferReceiptImage?: {
    url?: string | null;
    publicId?: string | null;
  } | null;
}

export interface TransactionListParams extends PaginationParams {
  status?: TransactionStatus | 'ALL';
  method?: TransactionMethod | 'ALL';
  type?: TransactionType | 'ALL';
  branchId?: string | 'ALL';
  search?: string;
  subjectType?: TransactionSubjectType | 'ALL';
  subjectId?: string;
  startDate?: string;
  endDate?: string;
  sortOrder?: SortOrder;
  sortBy?: 'occurredAt' | 'amount' | 'createdAt';
}

export interface TransactionSummary {
  totalAmount: number;
  settledAmount: number;
  pendingAmount: number;
  failedAmount: number;
  totalCount: number;
  settledCount: number;
  pendingCount: number;
  failedCount: number;
}

export interface TransactionListData {
  items: Transaction[];
  pagination: PaginationResponse;
  summary?: TransactionSummary;
}
