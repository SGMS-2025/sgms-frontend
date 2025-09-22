export type DiscountCampaignStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'EXPIRED' | 'DELETED';

export interface DiscountCampaign {
  _id: string;
  campaignName: string;
  description: string;
  discountPercentage: number;
  branchId: Array<{
    _id: string;
    branchName: string;
    address: string;
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
