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
  createdAt: string;
  updatedAt: string;
}

// Owner Subscription Types
export interface OwnerSubscription {
  _id: string;
  userId: string;
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
  data: {
    subscriptions: OwnerSubscription[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  statusCode: number;
}

// Query Types
export interface GetSubscriptionsQuery {
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  page?: number;
  limit?: number;
  sortBy?: 'startDate' | 'endDate' | 'amount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface GetSubscriptionHistoryQuery {
  includeExpired?: boolean;
  limit?: number;
}
