export type StaffStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type StaffJobTitle = 'Manager' | 'Personal Trainer' | 'Technician';
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
  userId: string; // Add userId field
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

// Create Staff Request
export interface CreateStaffRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string;
  address?: string;
  jobTitle: string;
  branchId: string;
  salary?: number;
  role: 'MANAGER' | 'TECHNICIAN' | 'PT' | 'CUSTOMER';
  status?: StaffStatus;
}

export interface FormData {
  userType: string;
  fullName?: string;
  jobTitle?: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  profileImage?: string | null;
  branchId?: string;
  salary?: string;
}

export interface AddStaffFormProps {
  onSubmit?: (data: FormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
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

// Interface for StaffPermissionOverlayModal
export interface StaffForPermissionModal {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
  };
  jobTitle: StaffJobTitle;
  status: StaffStatus;
}
