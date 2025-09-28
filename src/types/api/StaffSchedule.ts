export interface StaffScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStaffId?: string;
  initialData?: StaffScheduleFormData;
}

export interface StaffScheduleFormData {
  title: string;
  staffId: string;
  branchId: string;
  duration: number;
  availability: {
    sunday: { enabled: boolean; startTime: string; endTime: string };
    monday: { enabled: boolean; startTime: string; endTime: string };
    tuesday: { enabled: boolean; startTime: string; endTime: string };
    wednesday: { enabled: boolean; startTime: string; endTime: string };
    thursday: { enabled: boolean; startTime: string; endTime: string };
    friday: { enabled: boolean; startTime: string; endTime: string };
    saturday: { enabled: boolean; startTime: string; endTime: string };
  };
  schedulingWindow: {
    advanceDays: number;
    maxHours: number;
  };
  timezone: string;
}

export interface DayAvailability {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export interface WeekAvailability {
  sunday: DayAvailability;
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
}

export interface SchedulingWindow {
  advanceDays: number;
  maxHours: number;
}

export interface StaffScheduleConfig {
  availability: WeekAvailability;
  schedulingWindow: SchedulingWindow;
  timezone: string;
}

export interface StaffScheduleStats {
  totalShifts: number;
  availableDays: number;
  averageHoursPerDay: number;
  upcomingShifts: number;
}

export interface StaffScheduleFilters {
  staffId?: string;
  branchId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  status?: 'available' | 'busy' | 'unavailable';
}

export interface StaffScheduleListParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'startTime' | 'endTime';
  sortOrder?: 'asc' | 'desc';
  staffId?: string;
  branchId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface StaffScheduleListResponse {
  data: StaffScheduleFormData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Hook return types
export interface UseStaffScheduleReturn {
  schedules: StaffScheduleFormData[];
  stats: StaffScheduleStats | null;
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
  updateFilters: (filters: Partial<StaffScheduleListParams>) => void;
  goToPage: (page: number) => void;
}

// Component props types
export interface StaffScheduleFormProps {
  onSubmit: (data: StaffScheduleFormData) => void;
  onCancel: () => void;
  initialData?: Partial<StaffScheduleFormData>;
  loading?: boolean;
}

export interface StaffScheduleCardProps {
  schedule: StaffScheduleFormData;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}

export interface StaffScheduleListProps {
  schedules: StaffScheduleFormData[];
  loading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}

export interface StaffScheduleFiltersProps {
  filters: StaffScheduleFilters;
  onFiltersChange: (filters: StaffScheduleFilters) => void;
  staffList?: Array<{ _id: string; firstName: string; lastName: string; email: string }>;
  branchList?: Array<{ _id: string; name: string; location: string }>;
  loading?: boolean;
}

export interface StaffScheduleCalendarProps {
  selectedStaffId?: string;
  onStaffSelect?: (staffId: string | undefined) => void;
}
