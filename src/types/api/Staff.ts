export type StaffStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type StaffJobTitle = 'Manager' | 'Admin' | 'Owner' | 'Personal Trainer' | 'Technician';
export type SortField = 'name' | 'jobTitle' | 'email' | 'phone' | 'salary' | 'status';

export interface Staff {
  _id: string;
  jobTitle: StaffJobTitle;
  userId: {
    _id: string;
    username: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    address?: string;
    gender?: string;
    avatar?: {
      publicId?: string;
      url?: string;
    };
    status: StaffStatus;
  };
  branchId: {
    _id: string;
    branchName: string;
    location: string;
    hotline?: string;
    managerId?: {
      _id: string;
      fullName: string;
      email: string;
      phoneNumber?: string;
    };
  };
  status?: StaffStatus;
  salary: number;
  createdAt: string;
  updatedAt: string;
  // Frontend only fields
  selected?: boolean;
}

export interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  staffByJobTitle: Array<{
    _id: string;
    count: number;
  }>;
}

export interface StaffFilters {
  searchTerm: string;
  selectedJobTitle?: string;
  selectedIds: string[];
  branchId?: string;
  status?: StaffStatus;
}

export interface StaffDisplay {
  id: string;
  name: string;
  jobTitle: string;
  email: string;
  phone: string;
  salary: string;
  branch: string;
  status?: StaffStatus;
  selected?: boolean;
}

// API Request/Response types
export interface StaffListParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'jobTitle' | 'salary';
  sortOrder?: 'asc' | 'desc';
  branchId?: string;
  status?: StaffStatus;
  jobTitle?: string;
  search?: string;
}

export interface BackendPaginationResponse {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface StaffListResponse {
  staffList: Staff[];
  pagination: BackendPaginationResponse;
}

// Hook return types
export interface UseStaffListReturn {
  staffList: StaffDisplay[];
  stats: StaffStats | null;
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;
  refetch: () => Promise<void>;
  updateFilters: (filters: Partial<StaffListParams>) => void;
  goToPage: (page: number) => void;
}

// Component props types
export interface StaffManagementProps {
  onAddStaff?: () => void;
  onDeleteStaff?: (staffId: string) => void;
}

export interface StaffFormData {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  address: string;
  email: string;
  jobTitle: StaffJobTitle;
  salary: string;
  branchId: string;
  status: StaffStatus;
}

export interface StaffUpdateData {
  // User fields
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;

  // Staff fields
  jobTitle?: StaffJobTitle;
  branchId?: string;
  salary?: number;
  status?: StaffStatus;
}
