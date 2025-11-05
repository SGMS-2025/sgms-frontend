export type DiscountCampaignStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'EXPIRED' | 'DELETED';

export interface DiscountCampaign {
  _id: string;
  campaignName: string;
  description: string;
  discountPercentage: number;
  discountCode: string;
  usageLimit: number | null;
  usageCount?: number;
  branchId: Array<{
    _id: string;
    branchName: string;
    address: string;
  }>;
  // Populated ServicePackage refs
  packageId: Array<{
    _id: string;
    name?: string;
    type?: string;
    defaultDurationMonths?: number;
  }>;
  startDate: string;
  endDate: string;
  createBy: {
    _id: string;
    fullName: string;
    email: string;
  };
  status: DiscountCampaignStatus;
  createdAt: string;
  updatedAt: string;
  // Virtual fields
  isActive: boolean;
  isExpired: boolean;
  daysRemaining: number;
  campaignDuration: number;
}

export interface DiscountCampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  expiredCampaigns: number;
  pendingCampaigns: number;
}

export interface DiscountCampaignListResponse {
  campaigns: DiscountCampaign[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface DiscountCampaignListParams {
  page?: number;
  limit?: number;
  status?: DiscountCampaignStatus;
  branchId?: string;
  createBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UseDiscountCampaignListReturn {
  campaigns: DiscountCampaign[];
  stats: DiscountCampaignStats | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  } | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  updateFilters: (filters: Partial<DiscountCampaignListParams>) => void;
  goToPage: (page: number) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

// Form data type for discount campaign forms
export interface DiscountCampaignFormData {
  campaignName: string;
  description?: string;
  discountPercentage: number;
  packageId: string[];
  discountCode: string;
  usageLimit?: number | null;
  startDate: Date;
  endDate: Date;
  status?: string;
}

// API request data type for discount campaign operations
export interface DiscountCampaignApiData {
  campaignName: string;
  description?: string;
  discountPercentage: number;
  packageId: string[];
  discountCode: string;
  usageLimit?: number | null;
  startDate: string;
  endDate: string;
  status?: string;
}
