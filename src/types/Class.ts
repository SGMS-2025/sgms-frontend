import type { Branch } from './api/Branch';
import type { Staff } from './api/Staff';
import type { ServicePackage } from './api/Package';
import type { SortOrder } from './common/BaseTypes';

/**
 * ============================================
 * MAIN INTERFACES
 * ============================================
 */

export interface Class {
  _id: string;
  name: string;
  servicePackageId: ServicePackage | string;
  branchId: Branch | string;
  capacity: number;
  activeEnrollment: number;
  inactiveEnrollment: number;
  trainerIds: (Staff | string)[];
  enrolledStudents: EnrolledStudent[];
  schedulePattern: SchedulePattern;
  startDate: Date | string;
  endDate: Date | string;
  scheduleGenerationWindow: number;
  lastScheduleGeneratedDate?: Date | string;
  location?: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Virtual/Computed fields
  availableSlots?: number;
  occupancyPercentage?: number;
  isFull?: boolean;
  primaryTrainer?: Staff | string;
}

export interface EnrolledStudent {
  _id?: string;
  enrollmentId?: string; // Alias for _id (added by backend)
  customerId: unknown; // Can be populated with Customer details (userId: { fullName, email, phoneNumber })
  contractId: unknown; // Can be populated with ServiceContract details
  enrolledDate: Date | string;
  status: 'ACTIVE' | 'INACTIVE';
  droppedDate?: Date | string;
  dropReason?: string;
}

export interface SchedulePattern {
  daysOfWeek: DayName[];
  startTime: string; // "HH:MM" format
  endTime: string; // "HH:MM" format
  timezone: string; // e.g., "Asia/Ho_Chi_Minh"
}

export type DayName = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

/**
 * ============================================
 * REQUEST/RESPONSE DTOs
 * ============================================
 */

export interface CreateClassDTO {
  name: string;
  servicePackageId: string;
  branchId: string;
  capacity: number;
  trainerIds: string[];
  schedulePattern: SchedulePattern;
  startDate: Date | string;
  endDate: Date | string;
  scheduleGenerationWindow?: number;
  location?: string;
  description?: string;
}

export interface UpdateClassDTO {
  name?: string;
  capacity?: number;
  trainerIds?: string[];
  schedulePattern?: {
    daysOfWeek?: string[];
    startTime?: string;
    endTime?: string;
    timezone?: string;
  };
  endDate?: Date | string;
  location?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface EnrollStudentsDTO {
  customerIds: string[];
}

export interface RemoveStudentDTO {
  reason?: string;
}

/**
 * ============================================
 * API RESPONSE TYPES
 * ============================================
 */

export interface ClassListResponse {
  classes: Class[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ClassDetailResponse {
  data: Class;
  message: string;
}

export interface PendingCustomer {
  contractId: string;
  customer: {
    _id: string;
    userId: {
      _id: string;
      fullName: string;
      email: string;
      phoneNumber?: string;
    };
  };
  package: ServicePackage;
  purchaseDate: Date | string;
  sessionsTotal: number;
  sessionsUsed: number;
  sessionsRemaining: number;
  expiryDate?: Date | string;
}

export interface PendingCustomersResponse {
  customers: PendingCustomer[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  classInfo: {
    availableSlots: number;
    isFull: boolean;
    currentEnrollment: number;
    capacity: number;
  };
}

export interface EnrollmentResult {
  enrolled: {
    customerId: string;
    contractId: string;
    enrolledDate: Date | string;
  }[];
  failed: {
    customerId: string;
    reason: string;
  }[];
  summary: {
    successCount: number;
    failedCount: number;
    totalRequested: number;
  };
}

export interface ScheduleGenerationResult {
  generatedSchedules: number;
  dateRange: {
    startDate: Date | string;
    endDate: Date | string;
  };
  message: string;
}

/**
 * ============================================
 * FILTER & QUERY PARAMS
 * ============================================
 */

export interface GetClassesParams {
  page?: number;
  limit?: number;
  branchId?: string;
  servicePackageId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
  search?: string;
  startTime?: string; // Filter by start time (HH:MM format)
  endTime?: string; // Filter by end time (HH:MM format)
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'capacity';
  sortOrder?: SortOrder;
}

export interface GetPendingCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'purchaseDate' | 'sessionsRemaining';
  sortOrder?: SortOrder;
}

/**
 * ============================================
 * VALIDATION SCHEMAS (Zod)
 * ============================================
 */

import { z } from 'zod';

// Schedule Pattern Schema
export const schedulePatternSchema = z
  .object({
    daysOfWeek: z
      .array(z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']))
      .min(1, 'At least one day must be selected')
      .max(7),
    startTime: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:MM)'),
    endTime: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:MM)'),
    timezone: z.string().min(1, 'Timezone is required')
  })
  .refine(
    (data) => {
      const [startHour, startMin] = data.startTime.split(':').map(Number);
      const [endHour, endMin] = data.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      return startMinutes < endMinutes;
    },
    {
      message: 'Start time must be before end time',
      path: ['endTime']
    }
  );

// Create Class Schema
export const createClassSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Class name must be at least 2 characters')
      .max(100, 'Class name must be less than 100 characters'),
    servicePackageId: z.string().min(1, 'Service package is required'),
    branchId: z.string().min(1, 'Branch is required'),
    capacity: z
      .number()
      .int('Capacity must be an integer')
      .min(1, 'Capacity must be at least 1')
      .max(200, 'Capacity cannot exceed 200'),
    trainerIds: z.array(z.string().min(1)).min(1, 'At least one trainer is required'),
    schedulePattern: schedulePatternSchema,
    startDate: z
      .string()
      .or(z.date())
      .refine((date) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d >= new Date();
      }, 'Start date must be in the future'),
    endDate: z.string().or(z.date()),
    scheduleGenerationWindow: z
      .number()
      .int('Window must be an integer')
      .min(1, 'Window must be at least 1 day')
      .max(365, 'Window cannot exceed 365 days')
      .optional()
      .default(7),
    location: z.string().max(200, 'Location must be less than 200 characters').optional(),
    description: z.string().max(500, 'Description must be less than 500 characters').optional()
  })
  .refine(
    (data) => {
      if (!data.endDate) return true;
      const start = typeof data.startDate === 'string' ? new Date(data.startDate) : data.startDate;
      const end = typeof data.endDate === 'string' ? new Date(data.endDate) : data.endDate;
      return start < end;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate']
    }
  );

// Update Class Schema
export const updateClassSchema = z.object({
  name: z
    .string()
    .min(2, 'Class name must be at least 2 characters')
    .max(100, 'Class name must be less than 100 characters')
    .optional(),
  capacity: z
    .number()
    .int('Capacity must be an integer')
    .min(1, 'Capacity must be at least 1')
    .max(200, 'Capacity cannot exceed 200')
    .optional(),
  trainerIds: z.array(z.string().min(1)).min(1, 'At least one trainer is required').optional(),
  schedulePattern: schedulePatternSchema.optional(),
  endDate: z.string().or(z.date()).optional(),
  location: z.string().max(200, 'Location must be less than 200 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});

// Enroll Students Schema
export const enrollStudentsSchema = z.object({
  customerIds: z
    .array(z.string().min(1))
    .min(1, 'At least one customer must be selected')
    .max(100, 'Cannot enroll more than 100 students at once')
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type EnrollStudentsInput = z.infer<typeof enrollStudentsSchema>;

/**
 * ============================================
 * HELPER TYPES
 * ============================================
 */

export interface ClassFormState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export interface EnrollmentFormState {
  isLoading: boolean;
  error: string | null;
  selectedCustomers: string[];
}

export interface ClassContextType {
  selectedClass: Class | null;
  setSelectedClass: (classData: Class | null) => void;
  refreshList: () => Promise<void>;
}

/**
 * ============================================
 * CONSTANTS
 * ============================================
 */

export const CLASS_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
} as const;

export const STUDENT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
} as const;

export const DAYS_OF_WEEK: DayName[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export const DAY_LABELS: Record<DayName, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday'
};

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_BULK_ENROLL = 100;
export const DEFAULT_SCHEDULE_WINDOW = 7; // days
