import type {
  BaseEntity,
  UserReference,
  BranchReference,
  StaffReference,
  PaginationParams,
  PaginationResponse,
  SortOrder
} from '@/types/common/BaseTypes';

export type PTAvailabilityRequestStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface PTAvailabilitySlot {
  date: string; // ISO date string
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  maxCapacity: number;
}

export interface PTAvailabilityServiceContract {
  _id: string;
  customerId?:
    | string // Unpopulated ObjectId
    | {
        _id: string;
        userId?:
          | string // Unpopulated ObjectId
          | {
              _id: string;
              fullName: string;
              phone?: string;
              phoneNumber?: string;
              email?: string;
            };
      };
  customer?: {
    fullName: string;
    phone?: string;
  };
  [key: string]: unknown;
}

export interface PTAvailabilityRequest extends BaseEntity {
  staffId: StaffReference & {
    // Legacy fields for backward compatibility
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  branchId: BranchReference;
  slots: PTAvailabilitySlot[];
  serviceContractIds?: Array<PTAvailabilityServiceContract | string>;
  notes?: string;
  status: PTAvailabilityRequestStatus;
  approvedBy?: UserReference;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface PTAvailabilityRequestStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  requestsByMonth: Array<{
    month: string;
    count: number;
  }>;
}

export interface PTAvailabilityRequestFilters {
  staffId?: string;
  branchId?: string;
  status?: PTAvailabilityRequestStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PTAvailabilityRequestListParams extends PaginationParams {
  sortBy?: 'createdAt' | 'updatedAt' | 'approvedAt';
  sortOrder?: SortOrder;
  staffId?: string;
  branchId?: string;
  status?: PTAvailabilityRequestStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface PTAvailabilityRequestListResponse {
  data: PTAvailabilityRequest[];
  pagination: PaginationResponse;
}

// API Request/Response types
export interface CreatePTAvailabilityRequestRequest {
  staffId: string;
  branchId: string;
  slots: PTAvailabilitySlot[];
  serviceContractIds?: string[];
  notes?: string;
}

export interface CreatePTAvailabilityRequestResponse {
  request: PTAvailabilityRequest;
  hasConflicts?: boolean;
  conflictCount?: number;
  conflictingShifts?: Array<{
    _id: string;
    startTime: string;
    endTime: string;
    status: string;
  }>;
}

export interface ApprovePTAvailabilityRequestRequest {
  notes?: string;
}

export interface RejectPTAvailabilityRequestRequest {
  rejectionReason: string;
}

// Hook return types
export interface UsePTAvailabilityRequestListReturn {
  requests: PTAvailabilityRequest[];
  stats: PTAvailabilityRequestStats | null;
  loading: boolean;
  error: string | null;
  pagination: PaginationResponse | null;
  refetch: () => Promise<void>;
  updateFilters: (filters: Partial<PTAvailabilityRequestListParams>) => void;
  goToPage: (page: number) => void;
}

// Component props types
export interface PTAvailabilityRequestFormProps {
  onSubmit: (data: CreatePTAvailabilityRequestRequest) => void;
  onCancel: () => void;
  initialData?: Partial<PTAvailabilityRequest>;
  loading?: boolean;
}

export interface PTAvailabilityRequestCardProps {
  request: PTAvailabilityRequest;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  onApprove?: (id: string, notes?: string) => void;
  onReject?: (id: string, reason: string) => void;
  showActions?: boolean;
  userRole?: string;
  currentUserId?: string;
}

export interface PTAvailabilityRequestListProps {
  requests: PTAvailabilityRequest[];
  loading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  onApprove?: (id: string, notes?: string) => void;
  onReject?: (id: string, reason: string) => void;
  userRole?: string;
  currentUserId?: string;
}

export interface PTAvailabilityRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: PTAvailabilityRequest | null;
  onApprove?: (request: PTAvailabilityRequest, notes?: string) => void;
  onReject?: (request: PTAvailabilityRequest, reason: string) => void;
}

export interface CreatePTAvailabilityRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  prefillData?: Partial<CreatePTAvailabilityRequestRequest>;
}

export interface PTAvailabilityRequestApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: PTAvailabilityRequest | null;
  onApprove?: (request: PTAvailabilityRequest, notes?: string) => void;
  onReject?: (request: PTAvailabilityRequest, reason: string) => void;
}
