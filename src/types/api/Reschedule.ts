import type { WorkShift } from './WorkShift';
import type { Staff } from './Staff';
import type { Branch } from './Branch';
import type { BaseEntity, PaginationParams } from '../common/BaseTypes';

// Enums
export type RescheduleState =
  | 'PENDING_BROADCAST'
  | 'PENDING_ACCEPTANCE'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'COMPLETED';

export type RescheduleType = 'FIND_REPLACEMENT' | 'DIRECT_SWAP' | 'MANAGER_ASSIGN';

export type ReschedulePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// State History Interface
export interface RescheduleStateHistory {
  state: RescheduleState;
  changedBy?: string; // User ID
  changedAt: string; // ISO Date string
  reason?: string;
}

// Main Reschedule Request Interface
export interface RescheduleRequest extends BaseEntity {
  requesterStaffId: string | Staff;
  originalShiftId: string | WorkShift;
  targetStaffId?: string | Staff;
  targetShiftId?: string | WorkShift;
  swapType: RescheduleType;
  reason: string;
  status: RescheduleState;
  priority: ReschedulePriority;
  approvedBy?: string; // User ID
  approvedAt?: string; // ISO Date string
  rejectionReason?: string;
  expiresAt: string; // ISO Date string
  acceptedAt?: string; // ISO Date string
  completedAt?: string; // ISO Date string
  branchId: string | Branch;
  metadata?: Record<string, unknown>;
  stateHistory: RescheduleStateHistory[];
  // Virtual fields
  timeRemaining?: number; // milliseconds
  isExpired?: boolean;
}

// API Request DTOs
export interface CreateRescheduleRequestDto {
  originalShiftId: string;
  targetStaffId?: string;
  targetShiftId?: string;
  swapType: RescheduleType;
  reason: string;
  priority: ReschedulePriority;
}

export interface ApproveRescheduleRequestDto {
  approvedBy: string;
}

export interface RejectRescheduleRequestDto {
  rejectionReason: string;
}

// Filters
export interface RescheduleRequestFilters extends PaginationParams {
  status?: RescheduleState;
  swapType?: RescheduleType;
  priority?: ReschedulePriority;
  requesterStaffId?: string;
  targetStaffId?: string;
  branchId?: string;
  isExpired?: boolean;
  startDate?: string; // ISO Date string
  endDate?: string; // ISO Date string
}

export interface RescheduleListParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'expiresAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
  status?: RescheduleState;
  swapType?: RescheduleType;
  priority?: ReschedulePriority;
  requesterStaffId?: string;
  targetStaffId?: string;
  branchId?: string;
  isExpired?: boolean;
  startDate?: string;
  endDate?: string;
}

// API Response Types
export interface RescheduleListResponse {
  data: RescheduleRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface RescheduleStats {
  totalRequests: number;
  pendingBroadcast: number;
  pendingAcceptance: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  cancelled: number;
  expired: number;
  completed: number;
  requestsByType: Array<{
    type: RescheduleType;
    count: number;
  }>;
  requestsByPriority: Array<{
    priority: ReschedulePriority;
    count: number;
  }>;
}

// Hook Return Types
export interface UseRescheduleListReturn {
  requests: RescheduleRequest[];
  stats: RescheduleStats | null;
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
  updateFilters: (filters: Partial<RescheduleListParams>) => void;
  goToPage: (page: number) => void;
}

// Component Props Types
export interface RescheduleRequestFormProps {
  onSubmit: (data: CreateRescheduleRequestDto) => void;
  onCancel: () => void;
  initialData?: Partial<RescheduleRequest>;
  loading?: boolean;
  workShiftId?: string; // Pre-select a work shift
}

export interface RescheduleRequestCardProps {
  request: RescheduleRequest;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  onAccept?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  onCancel?: (id: string) => void;
  showActions?: boolean;
  userRole?: string;
  currentUserId?: string;
}

export interface RescheduleRequestListProps {
  requests: RescheduleRequest[];
  loading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  onAccept?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  onCancel?: (id: string) => void;
  onCreateNew?: () => void;
  onRefresh?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  typeFilter?: string;
  onTypeFilterChange?: (value: string) => void;
  priorityFilter?: string;
  onPriorityFilterChange?: (value: string) => void;
  showFilters?: boolean;
  currentUserShifts?: WorkShift[];
  showStats?: boolean;
  showHeader?: boolean;
  stats?: RescheduleStats;
  userRole?: string;
  currentUserId?: string;
  isOwnerOrManager?: boolean;
}

export interface RescheduleRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RescheduleRequest | null;
  onAccept?: (request: RescheduleRequest) => void;
  onApprove?: (request: RescheduleRequest) => void;
  onReject?: (request: RescheduleRequest, reason: string) => void;
  onCancel?: (request: RescheduleRequest) => void;
  userRole?: string;
  currentUserId?: string;
}

export interface RescheduleApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RescheduleRequest | null;
  onApprove: () => void;
  onReject: () => void;
  loading?: boolean;
}

export interface CreateRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  workShiftId?: string; // Pre-select a work shift
  workShift?: import('./WorkShift').WorkShift | import('./WorkShift').VirtualWorkShift;
  onEnsureWorkshift?: () => Promise<import('./WorkShift').WorkShift | null>;
}

export interface RescheduleManagementLayoutProps {
  staffId?: string;
  branchId?: string;
  showStats?: boolean;
  userRole?: string;
}

// Socket Event Types
export interface RescheduleNotificationData {
  type: string;
  title: string;
  message: string;
  data: {
    requestId: string;
    requesterName: string;
    originalShiftTime: string;
    swapType: RescheduleType;
    priority: ReschedulePriority;
    branchId: string;
    branchName: string;
  };
  priority: 'low' | 'medium' | 'high';
  category: string;
  actions: string[];
  timestamp: string;
}
