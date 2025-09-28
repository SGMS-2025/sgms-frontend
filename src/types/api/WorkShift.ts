export type WorkShiftStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface WorkShift {
  _id: string;
  staff_id: {
    _id: string;
    jobTitle: string;
    salary: number;
    status: string;
    userId: {
      _id: string;
      fullName: string;
      email: string;
      phoneNumber?: string;
    };
    // Legacy fields for backward compatibility
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  branch_id: {
    _id: string;
    name: string;
    location: string;
    timezone: string;
  };
  day_of_the_week: DayOfWeek;
  start_time: string;
  end_time: string;
  status: WorkShiftStatus;
  start_time_local: string;
  end_time_local: string;
  start_time_fmt: string;
  end_time_fmt: string;
  branch_tz: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkShiftStats {
  totalShifts: number;
  scheduledShifts: number;
  inProgressShifts: number;
  completedShifts: number;
  cancelledShifts: number;
  shiftsByDay: Array<{
    day: DayOfWeek;
    count: number;
  }>;
}

export interface WorkShiftFilters {
  staff_id?: string;
  branch_id?: string;
  status?: WorkShiftStatus;
  start_date?: string;
  end_date?: string;
  day_of_the_week?: DayOfWeek;
  page?: number;
  limit?: number;
}

export interface WorkShiftListParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'start_time' | 'end_time';
  sortOrder?: 'asc' | 'desc';
  staff_id?: string;
  branch_id?: string;
  status?: WorkShiftStatus;
  start_date?: string;
  end_date?: string;
  day_of_the_week?: DayOfWeek;
}

export interface WorkShiftListResponse {
  data: WorkShift[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// API Request/Response types
export interface CreateWorkShiftRequest {
  staff_id: string;
  branch_id: string;
  start_time: string;
  end_time: string;
}

export interface UpdateWorkShiftRequest {
  start_time?: string;
  end_time?: string;
  status?: WorkShiftStatus;
}

export interface WorkShiftFormData {
  staff_id: string;
  branch_id: string;
  date: string;
  start_time: string;
  end_time: string;
}

// Hook return types
export interface UseWorkShiftListReturn {
  workShifts: WorkShift[];
  stats: WorkShiftStats | null;
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
  updateFilters: (filters: Partial<WorkShiftListParams>) => void;
  goToPage: (page: number) => void;
}

// Component props types
export interface WorkShiftFormProps {
  onSubmit: (data: CreateWorkShiftRequest) => void;
  onCancel: () => void;
  initialData?: Partial<WorkShift>;
  loading?: boolean;
}

export interface WorkShiftCardProps {
  workShift: WorkShift;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}

export interface WorkShiftListProps {
  workShifts: WorkShift[];
  loading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}

export interface WorkShiftFiltersProps {
  filters: WorkShiftFilters;
  onFiltersChange: (filters: WorkShiftFilters) => void;
  staffList?: Array<{ _id: string; firstName: string; lastName: string; email: string }>;
  branchList?: Array<{ _id: string; name: string; address: string }>;
  loading?: boolean;
}

export interface WorkShiftDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  workShift: WorkShift | null;
  onEdit?: (workShift: WorkShift) => void;
  onUpdate?: (updatedWorkShift: WorkShift) => void;
}

export interface WorkShiftFiltersComponentProps {
  filters: WorkShiftFilters;
  onFiltersChange: (filters: WorkShiftFilters) => void;
  branchList?: Array<{ _id: string; name: string; address: string }>;
}

export interface CreateWorkShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface CreateDropdownProps {
  onCreateWorkShift: () => void;
  onCreateSchedule: () => void;
  className?: string;
}
