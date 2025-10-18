import type {
  BaseEntity,
  UserReference,
  BranchReference,
  StaffReference,
  PaginationParams,
  PaginationResponse,
  SortOrder
} from '@/types/common/BaseTypes';

export type TimeOffStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type TimeOffType = 'VACATION' | 'SICK_LEAVE' | 'PERSONAL_LEAVE' | 'UNPAID_LEAVE' | 'EMERGENCY' | 'OTHER';

export interface TimeOff extends BaseEntity {
  staffId: StaffReference & {
    // Legacy fields for backward compatibility
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  branchId: BranchReference;
  type: TimeOffType;
  startDate: string;
  endDate: string;
  reason: string;
  status: TimeOffStatus;
  approvedBy?: {
    _id: string;
    userId: UserReference;
  };
  // Formatted dates for display
  startDateFmt: string;
  endDateFmt: string;
  duration: number; // in days
}

export interface TimeOffStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  cancelledRequests: number;
  requestsByType: Array<{
    type: TimeOffType;
    count: number;
  }>;
  requestsByMonth: Array<{
    month: string;
    count: number;
  }>;
}

export interface TimeOffFilters {
  staffId?: string;
  branchId?: string;
  status?: TimeOffStatus;
  type?: TimeOffType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface TimeOffListParams extends PaginationParams {
  sortBy?: 'createdAt' | 'updatedAt' | 'startDate' | 'endDate';
  sortOrder?: SortOrder;
  staffId?: string;
  branchId?: string;
  status?: TimeOffStatus;
  type?: TimeOffType;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface TimeOffListResponse {
  data: TimeOff[];
  pagination: PaginationResponse;
}

// API Request/Response types
export interface CreateTimeOffRequest {
  staffId: string;
  branchId?: BranchReference; // Optional, will be determined from staffId if not provided
  type: TimeOffType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface WorkShiftConflict {
  _id: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface CreateTimeOffResponse {
  timeOffRequest: TimeOff;
  hasConflicts: boolean;
  conflictCount: number;
  conflictingShifts: WorkShiftConflict[];
}

export interface UpdateTimeOffRequest {
  type?: TimeOffType;
  startDate?: string;
  endDate?: string;
  reason?: string;
}

export interface TimeOffFormData {
  staffId: string;
  type: TimeOffType;
  startDate: string;
  endDate: string;
  reason: string;
}

// Hook return types
export interface UseTimeOffListReturn {
  timeOffs: TimeOff[];
  stats: TimeOffStats | null;
  loading: boolean;
  error: string | null;
  pagination: PaginationResponse | null;
  refetch: () => Promise<void>;
  updateFilters: (filters: Partial<TimeOffListParams>) => void;
  goToPage: (page: number) => void;
}

// Component props types
export interface TimeOffFormProps {
  onSubmit: (data: CreateTimeOffRequest) => void;
  onCancel: () => void;
  initialData?: Partial<TimeOff>;
  loading?: boolean;
}

export interface TimeOffCardProps {
  timeOff: TimeOff;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
  showActions?: boolean;
}

export interface TimeOffListProps {
  timeOffs: TimeOff[];
  loading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export interface TimeOffFiltersProps {
  filters: TimeOffFilters;
  onFiltersChange: (filters: TimeOffFilters) => void;
  staffList?: Array<{ _id: string; firstName: string; lastName: string; email: string }>;
  branchList?: Array<{ _id: string; name: string; address: string }>;
  loading?: boolean;
}

export interface TimeOffDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeOff: TimeOff | null;
  onEdit?: (timeOff: TimeOff) => void;
  onUpdate?: (updatedTimeOff: TimeOff) => void;
  onApprove?: (timeOff: TimeOff) => void;
  onReject?: (timeOff: TimeOff) => void;
  onCancel?: (timeOff: TimeOff) => void;
}

export interface CreateTimeOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  prefillData?: Partial<CreateTimeOffRequest>;
  hideDateSelection?: boolean;
}

export interface TimeOffApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeOff: TimeOff | null;
  onApprove?: (timeOff: TimeOff) => void;
  onReject?: (timeOff: TimeOff) => void;
}

export interface TimeOffStatsProps {
  stats: TimeOffStats | null;
  loading?: boolean;
}

export interface TimeOffCalendarProps {
  timeOffs: TimeOff[];
  onTimeOffClick?: (timeOff: TimeOff) => void;
  onDateClick?: (date: Date) => void;
  loading?: boolean;
}

export interface TimeOffDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  timeOff: TimeOff | null;
  onApprove?: (timeOff: TimeOff) => void;
  onReject?: (timeOff: TimeOff) => void;
  onCancel?: (timeOff: TimeOff) => void;
  onDelete?: (timeOff: TimeOff) => void;
}
