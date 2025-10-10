import type {
  ScheduleType,
  ScheduleStatus,
  RecurringPattern,
  BaseEntity,
  UserReference,
  BranchReference,
  ClassReference,
  TimeRange,
  PaginationResponse,
  SortOrder
} from '../common/BaseTypes';

// ===== SCHEDULE TYPES =====

export type SortField = 'createdAt' | 'scheduleDate' | 'name' | 'type' | 'status';

export interface Schedule extends BaseEntity {
  name: string;
  type: ScheduleType;
  ptId?: {
    _id: string;
    jobTitle: string;
    status: string;
    userId: UserReference;
  };
  scheduleDate: string;
  branchId: BranchReference;
  timeRange: TimeRange;
  status: ScheduleStatus;
  workShiftsId?: {
    _id: string;
    dayOfTheWeek: string;
    startTime: string;
    endTime: string;
    status: string;
  };
  classId?: ClassReference;
  maxCapacity: number;
  currentBookings: number;
  notes?: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  recurringEndDate?: string;
}

// ===== REQUEST/RESPONSE TYPES =====

export interface CreateScheduleRequest {
  name: string;
  type: ScheduleType;
  ptId?: string;
  scheduleDate: string;
  branchId: string;
  startTime: string;
  endTime: string;
  status?: ScheduleStatus;
  classId?: string;
  maxCapacity?: number;
  currentBookings?: number;
  notes?: string;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  recurringEndDate?: string;
}

export interface UpdateScheduleRequest {
  name?: string;
  type?: ScheduleType;
  ptId?: string;
  scheduleDate?: string;
  branchId?: string;
  startTime?: string;
  endTime?: string;
  status?: ScheduleStatus;
  classId?: string;
  maxCapacity?: number;
  currentBookings?: number;
  notes?: string;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  recurringEndDate?: string;
}

export interface GetSchedulesParams {
  page?: number;
  limit?: number;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  branchId?: string;
  ptId?: string;
  type?: ScheduleType;
  status?: ScheduleStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface GetSchedulesResponse {
  success: boolean;
  data: {
    schedules: Schedule[];
    pagination: PaginationResponse;
  };
  message: string;
}

export interface ScheduleResponse {
  success: boolean;
  data: Schedule;
  message: string;
}

// ===== SCHEDULE STATS TYPES =====

export interface ScheduleStats {
  total: number;
  byType: Array<{
    type: ScheduleType;
    count: number;
  }>;
  byStatus: Array<{
    status: ScheduleStatus;
    count: number;
  }>;
  upcoming: number;
  completed: number;
  cancelled: number;
}

export interface ScheduleFilters {
  branchId?: string;
  ptId?: string;
  type?: ScheduleType;
  status?: ScheduleStatus;
  dateRange?: {
    start: string;
    end: string;
  };
}

// ===== SCHEDULE UTILITY TYPES =====

export interface ScheduleConflict {
  scheduleId: string;
  conflictType: 'time_overlap' | 'capacity_exceeded' | 'staff_unavailable';
  message: string;
  conflictingSchedule?: Schedule;
}

export interface ScheduleValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  conflicts: ScheduleConflict[];
}

export interface ScheduleRecurrence {
  pattern: RecurringPattern;
  interval: number;
  endDate?: string;
  daysOfWeek?: string[];
  dayOfMonth?: number;
}

// ===== SCHEDULE COMPONENT TYPES =====

export interface ScheduleCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: ScheduleType;
  status: ScheduleStatus;
  color?: string;
  staff?: string;
  branch?: string;
  capacity?: {
    current: number;
    max: number;
  };
}

export interface ScheduleFormData {
  name: string;
  type: ScheduleType;
  ptId?: string;
  scheduleDate: string;
  branchId: string;
  timeRange: TimeRange;
  status: ScheduleStatus;
  classId?: string;
  maxCapacity: number;
  notes?: string;
  isRecurring: boolean;
  recurrence?: ScheduleRecurrence;
}

export { isScheduleType, isScheduleStatus } from '../common/BaseTypes';

// ===== SCHEDULE-SPECIFIC UTILITY FUNCTIONS =====

export const calculateDuration = (startTime: string, endTime: string): number => {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  return (end.getTime() - start.getTime()) / (1000 * 60); // minutes
};

export const isTimeConflict = (
  schedule1: { startTime: string; endTime: string },
  schedule2: { startTime: string; endTime: string }
): boolean => {
  const start1 = new Date(`2000-01-01T${schedule1.startTime}`);
  const end1 = new Date(`2000-01-01T${schedule1.endTime}`);
  const start2 = new Date(`2000-01-01T${schedule2.startTime}`);
  const end2 = new Date(`2000-01-01T${schedule2.endTime}`);

  return start1 < end2 && start2 < end1;
};

export const isRecurringPattern = (value: string): value is RecurringPattern => {
  return ['DAILY', 'WEEKLY', 'MONTHLY'].includes(value);
};

// ===== SCHEDULE-SPECIFIC CONSTANTS =====

export const RECURRING_PATTERN_LABELS: Record<RecurringPattern, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly'
};

export const DEFAULT_SCHEDULE_SETTINGS = {
  maxCapacity: 1,
  isRecurring: false,
  status: 'SCHEDULED' as ScheduleStatus
};
