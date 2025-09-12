import type { PopulatedUser } from './User';
export type BranchStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface Branch {
  _id: string;
  branchName: string;
  location: string;
  description?: string;
  hotline: string;
  images: string[];
  coverImage?: string;
  rating: number;
  totalReviews: number;
  facilities: string[];
  openingHours: string;
  managerId?: PopulatedUser;
  ownerId?: PopulatedUser;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// For frontend display compatibility
export interface BranchDisplay {
  _id: string;
  branchName: string;
  location: string;
  description?: string;
  hotline: string;
  images: string[];
  coverImage?: string;
  rating: number;
  totalReviews: number;
  facilities: string[];
  openingHours: {
    open: string;
    close: string;
  };
  managerId?: PopulatedUser;
  ownerId?: PopulatedUser;
  isActive: boolean;
  status: BranchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BackendPaginationResponse {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface BranchListResponse {
  success: boolean;
  message: string;
  data: {
    branches: Branch[];
    pagination: BackendPaginationResponse;
  };
}

export interface BranchListParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'branchName' | 'location' | 'isActive' | 'rating';
  sortOrder?: 'asc' | 'desc';
  branchName?: string;
  location?: string;
  isActive?: boolean;
  rating?: number;
  minRating?: number;
  maxRating?: number;
  search?: string;
}

// API Request/Response Types

export interface CreateAndUpdateBranchRequest {
  branchName?: string;
  location?: string;
  description?: string;
  hotline?: string;
  images?: string[];
  coverImage?: string;
  facilities?: string[];
  openingHours?: string;
  managerId?: string | null;
}

export interface BranchFormData {
  branchName: string;
  address: string;
  city: string;
  hotline?: string;
  email?: string;
  managerId?: string;
  description?: string;
  facilities?: string[];
  openingHours: {
    open: string;
    close: string;
  };
}

// Edit form types
export interface BranchEditValues {
  branchName: string;
  description: string;
  hotline: string;
  location: string;
  facilities: string[];
  managerId: string;
  openingHours: {
    open: string;
    close: string;
  };
}

// Frontend Display Types
export interface GymCardData {
  id: string;
  name: string;
  description: string;
  image: string;
  logo: string;
  features: string[];
  address: string;
  hours: string;
  rating: number;
  totalReviews: number;
  color: 'orange' | 'green' | 'purple';
  tag: string;
}

// Hook Result Types
export interface UseMyBranchesResult {
  branches: BranchDisplay[];
  loading: boolean;
  error: string | null;
  pagination: BackendPaginationResponse | null;
  refetch: () => Promise<void>;
}

// Context Types
export interface BranchContextType {
  currentBranch: BranchDisplay | null;
  branches: BranchDisplay[];
  loading: boolean;
  error: string | null;
  setCurrentBranch: (branch: BranchDisplay | null) => void;
  setBranches: (branches: BranchDisplay[]) => void;
  fetchBranches: () => Promise<void>;
  fetchBranchDetail: (branchId: string) => Promise<BranchDisplay | null>;
  createBranch: (data: CreateAndUpdateBranchRequest) => Promise<BranchDisplay | null>;
  updateBranchApi: (branchId: string, data: CreateAndUpdateBranchRequest) => Promise<BranchDisplay | null>;
  toggleBranchStatus: (branchId: string) => Promise<void>;
  switchBranch: (branchId: string) => Promise<void>;
}
