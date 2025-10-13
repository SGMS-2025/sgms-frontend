import type { PaginationResponse, FormState } from '../common/BaseTypes';

// ===== COMMON HOOK RETURN TYPES =====

export interface UseDataReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseDataWithPaginationReturn<T> extends UseDataReturn<T> {
  pagination: PaginationResponse | null;
  goToPage: (page: number) => void;
  updateFilters: (filters: Record<string, unknown>) => void;
}

export interface UseFormReturn<T> {
  form: FormState<T>;
  handleSubmit: (data: T) => Promise<{ success: boolean; error?: string }>;
  reset: () => void;
  validate: () => boolean;
}

// ===== CRUD HOOK TYPES =====

export interface UseCreateReturn<T, CreateData> {
  create: (data: CreateData) => Promise<T>;
  loading: boolean;
  error: string | null;
}

export interface UseUpdateReturn<T, UpdateData> {
  update: (id: string, data: UpdateData) => Promise<T>;
  loading: boolean;
  error: string | null;
}

export interface UseDeleteReturn {
  delete: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export interface UseGetByIdReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ===== SEARCH AND FILTER TYPES =====

export interface UseSearchReturn<T> {
  results: T[];
  loading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  clearResults: () => void;
}

export interface UseFilterReturn<T> {
  filteredData: T[];
  filters: Record<string, unknown>;
  loading: boolean;
  error: string | null;
  updateFilters: (filters: Record<string, unknown>) => void;
  clearFilters: () => void;
}

// ===== STATS AND ANALYTICS TYPES =====

export interface UseStatsReturn {
  stats: Record<string, number> | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ===== TEMPLATE HOOK TYPES =====

export interface UseTemplateReturn<T> {
  templates: T[];
  loading: boolean;
  error: string | null;
  createTemplate: (data: unknown) => Promise<T>;
  updateTemplate: (id: string, data: unknown) => Promise<T>;
  deleteTemplate: (id: string) => Promise<void>;
  getTemplatesByBranch: (branchId: string) => Promise<void>;
  getTemplatesByType: (type: string) => Promise<void>;
}

// ===== SCHEDULE HOOK TYPES =====

export interface UseScheduleReturn {
  schedules: unknown[];
  loading: boolean;
  error: string | null;
  createSchedule: (data: unknown) => Promise<unknown>;
  updateSchedule: (id: string, data: unknown) => Promise<unknown>;
  deleteSchedule: (id: string) => Promise<void>;
  getSchedules: (params?: Record<string, unknown>) => Promise<void>;
  refreshSchedules: () => Promise<void>;
}

// ===== FORM HOOK TYPES =====

export interface UseFormFieldReturn<T> {
  value: T;
  onChange: (value: T) => void;
  error: string | null;
  isValid: boolean;
  reset: () => void;
}

export interface UseFormValidationReturn {
  errors: Record<string, string>;
  isValid: boolean;
  validate: () => boolean;
  clearErrors: () => void;
  setError: (field: string, message: string) => void;
}

// ===== UTILITY HOOK TYPES =====

export interface UseToggleReturn {
  isOn: boolean;
  toggle: () => void;
  turnOn: () => void;
  turnOff: () => void;
}

export interface UseAsyncReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<T>;
  reset: () => void;
}

export interface UseDebounceReturn<T> {
  value: T;
  debouncedValue: T;
  isDebouncing: boolean;
}

// ===== SOCKET HOOK TYPES =====

export interface UseSocketReturn {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';
  connect: () => Promise<boolean>;
  disconnect: () => void;
  emit: (event: string, data?: unknown) => void;
  on: (event: string, callback: (data: unknown) => void) => void;
  off: (event: string, callback?: (data: unknown) => void) => void;
}

// ===== NOTIFICATION HOOK TYPES =====

export interface UseNotificationReturn {
  notifications: unknown[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  addNotification: (notification: unknown) => void;
}

// ===== TYPE GUARDS FOR HOOKS =====

export const isUseDataReturn = <T>(value: unknown): value is UseDataReturn<T> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'loading' in value &&
    'error' in value &&
    'refetch' in value
  );
};

export const isUseFormReturn = <T>(value: unknown): value is UseFormReturn<T> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'form' in value &&
    'handleSubmit' in value &&
    'reset' in value &&
    'validate' in value
  );
};

// ===== HOOK COMPOSITION TYPES =====

export interface UseComposedReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: PaginationResponse | null;
  filters: Record<string, unknown>;
  search: (query: string) => Promise<void>;
  updateFilters: (filters: Record<string, unknown>) => void;
  goToPage: (page: number) => void;
  refetch: () => Promise<void>;
}

// ===== ERROR HANDLING TYPES =====

export interface HookError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
}

export interface UseErrorHandlingReturn {
  error: HookError | null;
  clearError: () => void;
  handleError: (error: unknown) => void;
  isError: (error: unknown) => error is HookError;
}
