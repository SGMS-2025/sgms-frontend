import type {
  ScheduleType,
  DayOfWeek,
  BaseEntity,
  UserReference,
  BranchReference,
  StaffReference,
  ClassReference,
  PaginationResponse,
  SortOrder
} from '../common/BaseTypes';

// Base interfaces for better type safety
export interface ScheduleTemplateBase extends BaseEntity {
  name: string;
  description?: string;
  type: ScheduleType;
  daysOfWeek: DayOfWeek[];
  maxCapacity: number;
  priority: number;
  isActive: boolean;
  notes?: string;
}

export interface ScheduleTemplate extends ScheduleTemplateBase {
  branchId: BranchReference;
  ptId?: StaffReference;
  classId?: ClassReference;
  autoGenerate: {
    enabled: boolean;
    advanceDays: number;
    endDate?: string;
  };
  createdBy: UserReference;
  lastUsed?: string;
  usageCount: number;
  // Virtual fields
  durationMinutes: number;
  isAutoGenerateActive: boolean;
  // Direct time fields from API
  startTime: string;
  endTime: string;
}

export interface CreateScheduleTemplateRequest {
  name: string;
  description?: string;
  type: ScheduleType;
  branchId: string;
  ptId?: string;
  classId?: string;
  startTime: string;
  endTime: string;
  daysOfWeek: DayOfWeek[];
  maxCapacity?: number;
  priority?: number;
  autoGenerate?: {
    enabled: boolean;
    advanceDays: number;
    endDate: string;
  };
  notes?: string;
}

export interface UpdateScheduleTemplateRequest {
  name?: string;
  description?: string;
  type?: ScheduleType;
  branchId?: string;
  ptId?: string;
  classId?: string;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: DayOfWeek[];
  maxCapacity?: number;
  priority?: number;
  isActive?: boolean;
  autoGenerate?: {
    enabled: boolean;
    advanceDays: number;
    endDate: string;
  };
  notes?: string;
}

export interface AutoGenerateSettings {
  enabled: boolean;
  advanceDays: number;
  endDate: string;
}

export interface ScheduleTemplateListParams {
  page?: number;
  limit?: number;
  branchId?: string;
  type?: ScheduleType;
  isActive?: boolean;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'priority' | 'usageCount' | 'lastUsed';
  sortOrder?: SortOrder;
}

export interface ScheduleTemplateListResponse {
  data: ScheduleTemplate[];
  pagination: PaginationResponse;
}

export interface ScheduleTemplateApiResponse {
  success: boolean;
  message: string;
  data: ScheduleTemplate[];
  pagination: PaginationResponse;
  timestamp: string;
  requestId?: string;
}

export interface ScheduleTemplateStats {
  total: number;
  active: number;
  inactive: number;
  autoGenerate: number;
  byType: Array<{
    _id: ScheduleType;
    count: number;
  }>;
}

// Re-export constants and types from BaseTypes for convenience
export { SCHEDULE_TYPES, DAYS_OF_WEEK } from '../common/BaseTypes';
export type { ScheduleType, DayOfWeek } from '../common/BaseTypes';

// Utility types for form handling
export interface ScheduleTemplateFormData extends Omit<CreateScheduleTemplateRequest, 'autoGenerate'> {
  startTime: string;
  endTime: string;
  autoGenerate: {
    enabled: boolean;
    advanceDays: number;
    endDate: string;
  };
}

// Re-export type guards from BaseTypes for convenience
export { isScheduleType, isDayOfWeek } from '../common/BaseTypes';

// Socket events for real-time updates
export interface ScheduleTemplateSocketEvents {
  'schedule_template:created': (template: ScheduleTemplate) => void;
  'schedule_template:updated': (template: ScheduleTemplate) => void;
  'schedule_template:deleted': (templateId: string) => void;
  'schedule_template:activated': (template: ScheduleTemplate) => void;
  'schedule_template:deactivated': (template: ScheduleTemplate) => void;
  'schedule_template:auto_generate_updated': (template: ScheduleTemplate) => void;
}
