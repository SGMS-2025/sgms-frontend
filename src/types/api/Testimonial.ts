export interface TestimonialImage {
  publicId: string;
  url: string;
}

export type TestimonialStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

export interface Testimonial {
  _id: string;
  title: string;
  content: string;
  images: TestimonialImage[];
  branch_id: (string | { _id: string; branchName?: string; location?: string })[];
  status: TestimonialStatus;
  create_by: string | { _id: string; fullName?: string; email?: string };
  createdAt: string;
  updatedAt: string;
  // Virtual fields
  imagesCount?: number;
  isActive?: boolean;
  isInactive?: boolean;
  isDeleted?: boolean;
}

export interface TestimonialDisplay {
  id: string;
  title: string;
  content: string;
  status: TestimonialStatus;
  createdAt: string;
  images: TestimonialImage[];
  imagesCount: number;
  createdBy: string;
  branches: string[];
}

export interface TestimonialFormData {
  title: string;
  content: string;
  images: TestimonialImage[];
  status: TestimonialStatus;
}

export interface CreateTestimonialRequest {
  title: string;
  content: string;
  images?: TestimonialImage[];
  status?: TestimonialStatus;
}

export interface UpdateTestimonialRequest {
  title?: string;
  content?: string;
  images?: TestimonialImage[];
  status?: TestimonialStatus;
}

export interface UpdateTestimonialStatusRequest {
  status: 'ACTIVE' | 'INACTIVE';
}

export interface TestimonialQueryParams {
  page?: number;
  limit?: number;
  status?: TestimonialStatus;
  search?: string;
  sortBy?: 'title' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export type TestimonialStats = {
  _id: string;
  count: number;
}[];

export interface TestimonialListResponse {
  success: boolean;
  message: string;
  data: Testimonial[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
  requestId?: string;
}

// Status display mappings (colors and icons only, labels will be translated)
export const TESTIMONIAL_STATUS_DISPLAY = {
  ACTIVE: { color: 'green', icon: '✓' },
  INACTIVE: { color: 'gray', icon: '○' },
  DELETED: { color: 'red', icon: '❌' }
};

// Function to get status display with translated labels
export const getTestimonialStatusDisplay = (status: string, t: (key: string) => string) => {
  const statusInfo = TESTIMONIAL_STATUS_DISPLAY[status as keyof typeof TESTIMONIAL_STATUS_DISPLAY];
  if (!statusInfo) return { label: status, color: 'gray', icon: '○' };

  const labelKey = `testimonial.status.${status.toLowerCase()}`;
  return {
    ...statusInfo,
    label: t(labelKey)
  };
};

// API Error types for better error handling
export interface TestimonialApiError {
  response?: {
    data?: {
      message?: string;
      error?: {
        message?: string;
        code?: string;
      };
    };
  };
  message?: string;
}

// Hook return types
export interface UseTestimonialListReturn {
  testimonialList: TestimonialDisplay[];
  stats: TestimonialStats;
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;
  refetch: () => Promise<void>;
  refetchStats: () => Promise<void>;
  goToPage: (page: number) => void;
}

// Component prop types
export interface TestimonialManagementProps {
  onAddTestimonial?: () => void;
}

// Sort field types
export type SortField = 'title' | 'createdAt' | 'status';
