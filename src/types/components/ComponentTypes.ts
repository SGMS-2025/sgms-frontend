import type { ReactNode, ComponentType } from 'react';
import type { PaginationResponse, FormState, TimeRange, DayOfWeek, ScheduleType } from '../common/BaseTypes';

// ===== COMMON COMPONENT PROPS =====

export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  id?: string;
  'data-testid'?: string;
}

export interface LoadingComponentProps extends BaseComponentProps {
  loading: boolean;
  error?: string | null;
  children: ReactNode;
}

export interface ErrorComponentProps extends BaseComponentProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

// ===== FORM COMPONENT TYPES =====

export interface FormComponentProps<T> extends BaseComponentProps {
  form: FormState<T>;
  onSubmit: (data: T) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export interface FormFieldProps<T> extends BaseComponentProps {
  name: keyof T;
  label: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  onChange: (value: T[keyof T]) => void;
  value: T[keyof T];
}

export interface SelectFieldProps<T> extends FormFieldProps<T> {
  options: Array<{
    value: T[keyof T];
    label: string;
    disabled?: boolean;
  }>;
  multiple?: boolean;
  searchable?: boolean;
}

// ===== LIST COMPONENT TYPES =====

export interface ListComponentProps<T> extends BaseComponentProps {
  items: T[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onItemClick?: (item: T) => void;
  onItemEdit?: (item: T) => void;
  onItemDelete?: (item: T) => void;
}

export interface PaginatedListProps<T> extends ListComponentProps<T> {
  pagination: PaginationResponse;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export interface SearchableListProps<T> extends ListComponentProps<T> {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  onClearSearch?: () => void;
}

// ===== MODAL COMPONENT TYPES =====

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  maskClosable?: boolean;
}

export interface ConfirmModalProps extends ModalProps {
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  type?: 'warning' | 'error' | 'info' | 'success';
}

// ===== TABLE COMPONENT TYPES =====

export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: unknown, record: T, index: number) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> extends BaseComponentProps {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: PaginationResponse;
  onPageChange?: (page: number) => void;
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
  onFilter?: (column: keyof T, value: unknown) => void;
  rowKey?: keyof T | ((record: T) => string);
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
}

// ===== CARD COMPONENT TYPES =====

export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  header?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export interface StatCardProps extends CardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: ReactNode;
  color?: string;
}

// ===== SCHEDULE COMPONENT TYPES =====

export interface ScheduleCalendarProps extends BaseComponentProps {
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
  events?: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    type: ScheduleType;
    color?: string;
  }>;
  view?: 'day' | 'week' | 'month';
  onViewChange?: (view: 'day' | 'week' | 'month') => void;
}

export interface TimeSlotProps extends BaseComponentProps {
  time: TimeRange;
  available: boolean;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export interface DaySelectorProps extends BaseComponentProps {
  selectedDays: DayOfWeek[];
  onDayToggle: (day: DayOfWeek) => void;
  disabled?: boolean;
}

// ===== FILTER COMPONENT TYPES =====

export interface FilterProps extends BaseComponentProps {
  filters: Record<string, unknown>;
  onFiltersChange: (filters: Record<string, unknown>) => void;
  onClearFilters?: () => void;
  availableFilters?: Array<{
    key: string;
    label: string;
    type: 'select' | 'date' | 'text' | 'number';
    options?: Array<{ value: unknown; label: string }>;
  }>;
}

// ===== NOTIFICATION COMPONENT TYPES =====

export interface NotificationProps extends BaseComponentProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  closable?: boolean;
  onClose?: () => void;
}

export interface NotificationListProps extends BaseComponentProps {
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    timestamp: string;
    read: boolean;
  }>;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onClearAll?: () => void;
}

// ===== LOADING COMPONENT TYPES =====

export interface SpinnerProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  text?: string;
}

export interface SkeletonProps extends BaseComponentProps {
  lines?: number;
  width?: string | number;
  height?: string | number;
  animated?: boolean;
}

// ===== UTILITY COMPONENT TYPES =====

export interface TooltipProps extends BaseComponentProps {
  content: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
}

export interface BadgeProps extends BaseComponentProps {
  count?: number;
  maxCount?: number;
  showZero?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

// ===== COMPONENT COMPOSITION TYPES =====

export interface ComponentWithLoading<T> {
  component: ComponentType<T>;
  loading: boolean;
  error?: string | null;
  fallback?: ReactNode;
}

export interface ComponentWithError<T> {
  component: ComponentType<T>;
  error: string | null;
  onRetry?: () => void;
  fallback?: ReactNode;
}

// ===== TYPE GUARDS FOR COMPONENTS =====

export const isFormComponent = (component: unknown): component is FormComponentProps<unknown> => {
  return typeof component === 'object' && component !== null && 'form' in component && 'onSubmit' in component;
};

export const isListComponent = (component: unknown): component is ListComponentProps<unknown> => {
  return (
    typeof component === 'object' &&
    component !== null &&
    'items' in component &&
    Array.isArray((component as ListComponentProps<unknown>).items)
  );
};

export const isModalComponent = (component: unknown): component is ModalProps => {
  return typeof component === 'object' && component !== null && 'isOpen' in component && 'onClose' in component;
};
