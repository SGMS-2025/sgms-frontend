// Branch API Types
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
  managerId?: string;
  ownerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BranchListResponse {
  success: boolean;
  message: string;
  data: {
    branches: Branch[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
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
