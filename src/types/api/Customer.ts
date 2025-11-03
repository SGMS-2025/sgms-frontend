import type { ServicePackage } from '@/types/api/Package';
import type { DiscountCampaign } from '@/types/api/Discount';
import type { Staff } from '@/types/api/Staff';

export interface CustomerDisplay {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipType: string;
  membershipStatus: string;
  joinDate: string;
  expiryDate: string;
  totalSpent: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  branches: Array<{
    _id: string;
    branchName: string;
  }>;
  // New fields for contracts and transactions
  serviceName?: string; // Tên dịch vụ
  contractStartDate?: string; // Ngày bắt đầu hợp đồng
  contractEndDate?: string; // Ngày hết hạn hợp đồng
  referrerStaffName?: string; // Tên nhân viên giới thiệu
  createdByStaffName?: string; // Tên nhân viên tạo hợp đồng
  lastPaymentDate?: string; // Ngày thanh toán gần nhất
  createdAt?: string; // Ngày tạo
  updatedAt?: string; // Ngày cập nhật

  // Additional fields for detailed customer information
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  isLoyal?: boolean;
  cardCode?: string;
  notes?: string;

  // Contract information for edit mode
  latestServiceContract?: {
    _id: string;
    servicePackageId: {
      _id: string;
      name: string;
      description?: string;
      type?: string;
      defaultDurationMonths?: number;
      defaultPriceVND?: number;
    };
    startDate: string;
    endDate?: string;
    customMonths?: number;
    duration?: string;
    initialPaidAmount?: number;
    totalAmount?: number;
    remainingDebt?: number;
    status?: 'ACTIVE' | 'EXPIRED' | 'CANCELED' | 'SUSPENDED';
    discountCampaignId?: {
      _id: string;
      name: string;
      discountPercentage: number;
    };
    referrerStaffId?: {
      _id: string;
      fullName: string;
      email: string;
    };
    notes?: string;
  };

  latestMembershipContract?: {
    _id: string;
    membershipPlanId: {
      _id: string;
      name: string;
      description?: string;
      price: number;
      durationInMonths: number;
      benefits?: string[];
    };
    startDate: string;
    endDate?: string;
    activationDate?: string;
    status?: string;
    initialPaidAmount?: number;
    totalAmount?: number;
    remainingDebt?: number;
    discountCampaignId?: {
      _id: string;
      name: string;
      discountPercentage: number;
    };
    referrerStaffId?: {
      _id: string;
      fullName: string;
      email: string;
    };
    notes?: string;
  };
}

export interface CustomerFilters {
  searchTerm: string;
  selectedIds: string[];
  visibleColumns: {
    name: boolean;
    phone: boolean;
    membershipType: boolean;
    serviceName: boolean;
    contractStartDate: boolean;
    contractEndDate: boolean;
    referrerStaffName: boolean;
    status: boolean;
    lastPaymentDate: boolean;
    createdAt: boolean;
  };
}

export interface CustomerManagementProps {
  onAddCustomer?: () => void;
}

export type CustomerSortField =
  | 'name'
  | 'email'
  | 'phone'
  | 'membershipType'
  | 'membershipStatus'
  | 'joinDate'
  | 'expiryDate'
  | 'totalSpent'
  | 'status'
  | 'serviceName'
  | 'contractStartDate'
  | 'contractEndDate'
  | 'referrerStaffName'
  | 'lastPaymentDate'
  | 'createdAt';

export interface CustomerForModal {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
  };
  membershipType: string;
  membershipStatus: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  branchId: string[];
}

export interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerDisplay | null;
}

export interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: CustomerDisplay | null;
  isEditMode?: boolean;
  onCustomerUpdate?: () => void;
}

export interface CustomerFormData {
  // Basic Information
  name: string;
  phone: string;
  email: string;
  password: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  notes: string;
  dateOfBirth: string;
  branchId: string;
  avatar?: File | null;
}

// Additional types for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
  code?: string;
  error?: {
    meta?: {
      field?: string;
      details?: Array<{ field: string; message: string }>;
    };
  };
}

export interface ServiceContract {
  _id: string;
  servicePackageId: {
    _id: string;
  };
  referrerStaffId?: {
    _id: string;
  };
  discountCampaignId?: {
    _id: string;
  };
  customMonths?: number;
  duration?: string;
  startDate: string;
  initialPaidAmount?: number;
  notes?: string;
}

export interface MembershipContract {
  _id: string;
  membershipPlanId: {
    _id: string;
  };
  referrerStaffId?: {
    _id: string;
  };
  discountCampaignId?: {
    _id: string;
  };
  startDate: string;
  initialPaidAmount?: number;
  notes?: string;
}

export interface CustomerDetail {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  gender?: string;
  isLoyal?: boolean;
  cardCode?: string;
  address?: string;
  notes?: string;
  dateOfBirth?: string;
  branches?: Array<{
    _id: string;
  }>;
  referrerStaffId?: string;
  latestServiceContract?: ServiceContract;
  latestMembershipContract?: MembershipContract;
}

export interface StaffWithDetails extends Omit<Staff, 'jobTitle'> {
  name: string;
  jobTitle: string;
}

export interface PackageWithPricing extends ServicePackage {
  finalPrice?: number;
  defaultPriceVND?: number;
}

export interface PromotionWithDiscount extends DiscountCampaign {
  name: string;
  discountPercentage: number;
}

export interface BranchWithAddress {
  _id: string;
  branchName: string;
  address?: string;
}

// Gender type for form validation
export type GenderType = 'male' | 'female' | 'other';

// ===== MEMBERSHIP CONTRACT REGISTRATION TYPES =====

/**
 * Membership Registration Form Data
 */
export interface MembershipRegistrationFormData {
  membershipPlanId: string;
  branchId: string;
  cardCode?: string;
  startDate: string;
  discountCampaignId?: string;
  initialPaidAmount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  referrerStaffId?: string;
  notes?: string;
}

/**
 * Membership Contract Response
 */
export interface MembershipContractResponse {
  success: boolean;
  data?: {
    contract: {
      _id: string;
      customerId: string;
      membershipPlanId: string;
      branchId: string;
      startDate: string;
      endDate: string;
      price: number;
      discountAmount: number;
      total: number;
      paidAmount: number;
      debtAmount: number;
      status: string;
      activationDate?: string;
      createdAt: string;
    };
  };
  message?: string;
}

// Hook interfaces
export interface UseCustomerListOptions {
  limit?: number;
  page?: number;
  branchId?: string;
}

// Pagination interface for Customer Management (uses new format)
export interface CustomerPagination {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Pagination interface for PT Customer List (uses old format from PaginationHelper)
export interface PTCustomerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UseCustomerListReturn {
  customerList: CustomerDisplay[];
  loading: boolean;
  error: string | null;
  pagination: CustomerPagination | null;
  refetch: () => Promise<void>;
  goToPage: (page: number) => void;
}

export interface UseUpdateCustomerStatusReturn {
  updateCustomerStatus: (customerId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export interface UseCustomerImportReturn {
  importCustomers: (
    file: File,
    branchId: string
  ) => Promise<{
    successCount: number;
    failedCount: number;
    errors: Array<{
      row: number;
      field: string;
      message: string;
    }>;
  }>;
  downloadTemplate: () => Promise<void>;
  loading: boolean;
  error: string | null;
  resetError: () => void;
}

// Raw customer data from API (before transformation)
export interface RawCustomerData {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  membershipType: string;
  membershipStatus: string;
  joinDate: string;
  expiryDate: string;
  totalSpent: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  branches?: Array<{ _id: string; branchName: string }>;
  serviceName?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  referrerStaffName?: string;
  lastPaymentDate?: string;
  createdAt?: string;
}

// Customer Excel Import Modal interfaces
export interface CustomerExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export interface ImportResult {
  successCount: number;
  failedCount: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    errorKey?: string;
    errorData?: Record<string, unknown>;
  }>;
}

// Customer API interfaces
export interface CustomerListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  branchId?: string;
  search?: string;
  status?: string;
}

export interface CustomerListResponse {
  customers: CustomerDisplay[];
  pagination: CustomerPagination;
}

// PT Customer specific types
export interface PTCustomer {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  avatar?: string;
  package: {
    contractId: string;
    name: string;
    status: 'ACTIVE' | 'PENDING_ACTIVATION' | 'EXPIRED';
    totalSessions: number;
    sessionsUsed: number;
    sessionsRemaining: number;
    progressPercent: number;
    startDate: string;
    endDate: string;
    paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL';
  };
}

export interface PTCustomerListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  branchId?: string;
  status?: string;
  packageType?: string;
}

export interface PTCustomerListResponse {
  customers: PTCustomer[];
  pagination: PTCustomerPagination;
}

export interface PTCustomerFilters {
  searchTerm: string;
  statusFilter: string;
  expirationFilter: string;
  sessionsFilter: string;
  sortBy: string;
}

export interface PTCustomerStats {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
}

export interface UsePTCustomerListOptions {
  trainerId: string;
  limit?: number;
  page?: number;
  branchId?: string;
  status?: string;
  packageType?: string;
}

export interface UsePTCustomerListReturn {
  customerList: PTCustomer[];
  loading: boolean;
  error: string | null;
  pagination: PTCustomerPagination | null;
  stats: PTCustomerStats;
  refetch: () => Promise<void>;
  goToPage: (page: number) => void;
}
