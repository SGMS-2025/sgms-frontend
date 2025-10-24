import type { ScheduleType, TimeRange, PaginationResponse, SortOrder } from '../common/BaseTypes';

// ===== SHIFT TYPES =====

export type ShiftType = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'CUSTOM' | `CUSTOM_${string}`;

export interface ShiftTimeRange {
  start: string; // HH:MM
  end: string; // HH:MM
}

// Map shift → time
export const SHIFT_TIMES: Record<ShiftType, ShiftTimeRange> = {
  MORNING: { start: '08:00', end: '12:00' },
  AFTERNOON: { start: '13:00', end: '17:00' },
  EVENING: { start: '17:00', end: '21:00' },
  CUSTOM: { start: '00:00', end: '00:00' } // Default for custom shifts
};

// Shift labels for UI
export const SHIFT_LABELS: Record<ShiftType, string> = {
  MORNING: 'Morning',
  AFTERNOON: 'Afternoon',
  EVENING: 'Evening',
  CUSTOM: 'Custom'
};

// Helper to get shift display text
export const getShiftDisplay = (shift: ShiftType): string => {
  const time = SHIFT_TIMES[shift];
  return `${SHIFT_LABELS[shift]} (${time.start}-${time.end})`;
};

// ===== MODAL & FORM PROPS =====

export interface StaffScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStaffId?: string;
  initialData?: StaffScheduleFormData;
}

export interface DayAvailability {
  enabled: boolean;
  shifts?: ShiftType[]; // Array of selected shifts for this day (optional for backward compatibility)
  // Keep startTime/endTime for backward compatibility with old forms
  startTime?: string;
  endTime?: string;
}

export interface CustomShiftTime {
  start: string; // HH:MM
  end: string; // HH:MM
}

export interface FixedShift {
  dayOfWeek: string; // e.g., "MONDAY"
  morning: boolean;
  afternoon: boolean;
  evening?: boolean; // For Technician and Manager
  // Custom times - override default SHIFT_TIMES when provided
  customTimes?: {
    morning?: CustomShiftTime;
    afternoon?: CustomShiftTime;
    evening?: CustomShiftTime;
    custom?: CustomShiftTime; // For simplified custom shift handling
  };
}

export interface WeeklyFixedShifts {
  staffId: string;
  branchId: string;
  workType: string;
  weeklyShifts: Array<{
    dayOfWeek: string;
    shifts: Array<{
      label: string;
      start: string;
      end: string;
    }>;
  }>;
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

// Default week availability with shifts
export const DEFAULT_WEEK_AVAILABILITY: WeekAvailability = {
  sunday: { enabled: false, shifts: [] },
  monday: { enabled: true, shifts: ['MORNING', 'AFTERNOON'] },
  tuesday: { enabled: true, shifts: ['MORNING', 'AFTERNOON'] },
  wednesday: { enabled: true, shifts: ['MORNING', 'AFTERNOON'] },
  thursday: { enabled: true, shifts: ['MORNING', 'AFTERNOON'] },
  friday: { enabled: true, shifts: ['MORNING', 'AFTERNOON'] },
  saturday: { enabled: false, shifts: [] }
};

// Helper interface for converting shifts to schedules
export interface ShiftSelection {
  dayOfWeek: string;
  shift: ShiftType;
  startTime: string; // Auto-calculated from SHIFT_TIMES or customTimes
  endTime: string; // Auto-calculated from SHIFT_TIMES or customTimes
}

// Helper function to get shift time (custom or default)
export const getShiftTime = (shift: ShiftType, customTimes?: Record<string, CustomShiftTime>): ShiftTimeRange => {
  // Handle standard shifts - check for specific shift custom time first
  const shiftKey = shift.toLowerCase() as 'morning' | 'afternoon' | 'evening';

  // Check if there's a custom time for this specific shift
  if (customTimes?.[shiftKey]) {
    return customTimes[shiftKey];
  }

  // Check if there's a general custom time (only for custom shifts)
  if (shift === 'CUSTOM' && customTimes?.custom) {
    return customTimes.custom;
  }

  // Return default shift time
  return SHIFT_TIMES[shift];
};

export interface StaffScheduleFormData {
  title: string;
  staffId: string;
  branchId: string;
  scheduleDate: string;
  type: ScheduleType;
  timeRange?: TimeRange; // Made optional as we now use shifts
  notes?: string;
  availability: WeekAvailability;
  timezone: string;
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
  sortOrder?: SortOrder;
  staffId?: string;
  branchId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface StaffScheduleListResponse {
  data: StaffScheduleFormData[];
  pagination: PaginationResponse;
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
  userRole?: string;
}
