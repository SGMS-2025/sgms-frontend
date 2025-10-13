// ===== BASE TYPES =====

// Common ID type
export type ID = string;

// Common timestamp fields
export interface TimestampFields {
  createdAt: string;
  updatedAt: string;
}

// Common status types
export type Status = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'CANCELLED';
export type ScheduleStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

// Common schedule types
export type ScheduleType = 'CLASS' | 'PERSONAL_TRAINING' | 'FREE_TIME' | 'MAINTENANCE';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type RecurringPattern = 'DAILY' | 'WEEKLY' | 'MONTHLY';

// Common sort types
export type SortOrder = 'asc' | 'desc';

// ===== BASE INTERFACES =====

// Base entity with common fields
export interface BaseEntity extends TimestampFields {
  _id: ID;
}

// Base user reference
export interface UserReference {
  _id: ID;
  fullName: string;
  email: string;
}

// Base branch reference
export interface BranchReference {
  _id: ID;
  branchName: string;
  location: string;
  timezone?: string;
}

// Base staff reference
export interface StaffReference {
  _id: ID;
  jobTitle: string;
  status: string;
  userId: UserReference;
}

// Base class reference
export interface ClassReference {
  _id: ID;
  className: string;
  status: string;
}

// ===== UTILITY TYPES =====

// Make all properties optional
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Make all properties required
export type Required<T> = {
  [P in keyof T]-?: T[P];
};

// Pick specific properties
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Omit specific properties
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// ===== PAGINATION TYPES =====

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ===== API RESPONSE TYPES =====

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: PaginationResponse;
  };
  message: string;
}

// ===== FORM TYPES =====

export interface FormFieldError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

// ===== TIME TYPES =====

export interface TimeRange {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}

export interface DateRange {
  start: string; // ISO date string
  end: string; // ISO date string
}

// ===== CONSTANTS =====

export const SCHEDULE_TYPES: Record<ScheduleType, { label: string; description: string }> = {
  CLASS: { label: 'Class', description: 'Group fitness classes' },
  PERSONAL_TRAINING: { label: 'Personal Training', description: 'One-on-one training sessions' },
  FREE_TIME: { label: 'Free Time', description: 'Available time slots' },
  MAINTENANCE: { label: 'Maintenance', description: 'Equipment maintenance time' }
};

export const DAYS_OF_WEEK: Record<DayOfWeek, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday'
};

export const STATUS_LABELS: Record<Status, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending',
  CANCELLED: 'Cancelled'
};

// ===== TYPE GUARDS =====

export const isScheduleType = (value: string): value is ScheduleType => {
  return ['CLASS', 'PERSONAL_TRAINING', 'FREE_TIME', 'MAINTENANCE'].includes(value);
};

export const isDayOfWeek = (value: string): value is DayOfWeek => {
  return ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].includes(value);
};

export const isStatus = (value: string): value is Status => {
  return ['ACTIVE', 'INACTIVE', 'PENDING', 'CANCELLED'].includes(value);
};

export const isScheduleStatus = (value: string): value is ScheduleStatus => {
  return ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(value);
};

// ===== UTILITY FUNCTIONS =====

export const createId = (): ID => {
  return Math.random().toString(36).substr(2, 9);
};

export const isValidId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export const formatTime = (time: string): string => {
  return time.includes(':') ? time : `${time.slice(0, 2)}:${time.slice(2)}`;
};

export const parseTime = (time: string): string => {
  return time.replace(':', '');
};
