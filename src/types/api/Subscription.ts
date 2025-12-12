// Payment Transaction Info for Bank Transfer
export interface PaymentTransactionInfo {
  _id: string;
  paymentCode: string;
  amount: number;
  bankAccountNumber: string;
  bankCode: string;
  bankAccountName: string;
  description: string;
  expiresAt: string;
  qrCodeUrl: string;
  status?: SubscriptionPaymentStatus | 'PENDING_PAYMENT';
  paidAt?: string;
  metadata?: {
    packageName?: string;
    packageId?: string;
    packageTier?: number;
    months?: number;
    pricePerMonth?: number;
    notes?: string;
    requestedAt?: string;
    transferContent?: string;
    paymentCodePrefix?: string;
    paymentCodeDigits?: number;
  };
}

export type SubscriptionPaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

// Subscription Package Types
export interface SubscriptionPackage {
  _id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  durationUnit: 'DAY' | 'MONTH' | 'YEAR';
  maxBranches: number;
  maxCustomers: number;
  tier: number;
  isActive: boolean;
  features?: string[];
  isTrial?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Owner Subscription Types
export interface OwnerSubscription {
  _id: string;
  userId:
    | string
    | {
        _id: string;
        username?: string;
        email?: string;
        fullName?: string;
        phoneNumber?: string;
      };
  packageId: string | SubscriptionPackage;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'PAYOS';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentDate?: string;
  amount: number;
  transactionId?: string;
  notes?: string;
  autoRenew: boolean;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  // Virtual fields
  isActive?: boolean;
  isExpired?: boolean;
  isCancelled?: boolean;
  daysRemaining?: number;
  packageInfo?: SubscriptionPackage;
}

// Request Types
export interface PurchaseSubscriptionRequest {
  packageId: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'PAYOS';
  transactionId?: string;
  notes?: string;
  months?: number; // 1, 3, 6, 9, or 12
  templateDocumentId?: string; // Optional template document ID for subscription contract
}

export interface CreateSubscriptionPackageRequest {
  name: string;
  description?: string;
  price: number;
  duration: number;
  durationUnit: 'DAY' | 'MONTH' | 'YEAR';
  maxBranches: number;
  maxCustomers: number;
  tier: number;
  isActive?: boolean;
  features?: string[];
}

export interface UpdateSubscriptionPackageRequest {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  durationUnit?: 'DAY' | 'MONTH' | 'YEAR';
  maxBranches?: number;
  maxCustomers?: number;
  tier?: number;
  isActive?: boolean;
  features?: string[];
}

// Admin request shapes to match backend validation for package create/update
export interface AdminCreateSubscriptionPackageRequest {
  name: string;
  tier: number;
  price: number;
  duration: { value: number; unit: 'DAY' | 'MONTH' | 'YEAR' };
  features: {
    maxBranches: { min: number; max: number };
    maxCustomers: { min: number; max: number };
    additionalFeatures?: string[];
  };
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface AdminUpdateSubscriptionPackageRequest {
  name?: string;
  price?: number;
  duration?: { value?: number; unit?: 'DAY' | 'MONTH' | 'YEAR' };
  features?: {
    maxBranches?: { min?: number; max?: number };
    maxCustomers?: { min?: number; max?: number };
    additionalFeatures?: string[];
  };
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface CancelSubscriptionRequest {
  reason?: string;
}

// Response Types
export interface SubscriptionPackageResponse {
  success: boolean;
  message: string;
  data: SubscriptionPackage;
  statusCode: number;
}

export interface SubscriptionPackagesResponse {
  success: boolean;
  message: string;
  data: SubscriptionPackage[];
  statusCode: number;
}

export interface OwnerSubscriptionResponse {
  success: boolean;
  message: string;
  data: OwnerSubscription;
  statusCode: number;
}

export interface OwnerSubscriptionsResponse {
  success: boolean;
  message: string;
  data: OwnerSubscription[];
  statusCode: number;
}

export interface SubscriptionPackageAnalytics {
  packageId: string;
  packageName: string;
  isTrial?: boolean;
  tier?: number;
  totalPurchases: number;
  activeSubscriptions: number;
  totalRevenue: number;
  userCount?: number;
}

export interface SubscriptionAnalyticsResponse {
  success: boolean;
  message: string;
  data: {
    topPackages: SubscriptionPackageAnalytics[];
    trialUsers: {
      active: number;
      total: number;
      totalSubscriptions: number;
    };
    summary?: {
      totalSubscriptions: number;
      totalRevenue: number;
      currentMonthRevenue?: number;
      status: {
        active: number;
        cancelled: number;
        expired: number;
        unknown: number;
      };
    };
  };
  statusCode?: number;
}

export interface SubscriptionStatsResponse {
  success: boolean;
  message: string;
  data: {
    hasActiveSubscription: boolean;
    packageName: string | null;
    tier: number | null;
    daysRemaining: number;
    endDate: string | null;
    startDate?: string | null;
    branchUsage: {
      current: number;
      max: number;
      percentage: number;
    };
    customerUsage: {
      current: number;
      max: number;
      percentage: number;
    };
  };
  statusCode: number;
}

export interface ValidationResponse {
  success: boolean;
  message: string;
  data: {
    canCreate?: boolean;
    canAdd?: boolean;
    reason: string;
    currentCount: number;
    maxAllowed: number;
    remainingSlots?: number;
  };
  statusCode: number;
}

export interface AllSubscriptionsResponse {
  success: boolean;
  message: string;
  data: OwnerSubscription[]; // sendPaginated returns array directly
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
  statusCode?: number;
  timestamp?: string;
  requestId?: string;
}

// Query Types
export interface GetSubscriptionsQuery {
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  search?: string;
  ownerId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'startDate' | 'endDate' | 'amount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface GetSubscriptionHistoryQuery {
  includeExpired?: boolean;
  limit?: number;
}

// Purchase Subscription Response (can be success or pending payment)
export interface PurchaseSubscriptionResponse {
  success: boolean;
  message: string;
  data:
    | OwnerSubscription
    | {
        status: 'PENDING_PAYMENT';
        paymentTransaction: PaymentTransactionInfo;
      };
  statusCode: number;
}

// Payment Status Check Response
export interface PaymentStatusResponse {
  success: boolean;
  message: string;
  data: {
    paymentStatus?: SubscriptionPaymentStatus;
    status?: SubscriptionPaymentStatus;
    paymentCode?: string;
    amount?: number;
    paidAt?: string;
    expiresAt?: string;
    subscription?: OwnerSubscription;
    paymentTransaction?: PaymentTransactionInfo;
  };
  statusCode: number;
}
