// Schedule-related types
export interface TimeRange {
  startTime: string;
  endTime: string;
}

export interface CustomTime {
  start: string;
  end: string;
}

export interface CustomTimes {
  [key: string]: CustomTime;
}

export interface DayAvailability {
  enabled: boolean;
  shifts: string[];
  startTime: string;
  endTime: string;
}

export interface Availability {
  sunday: DayAvailability;
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
}

export interface StaffScheduleFormData {
  staffId: string;
  branchId: string;
  scheduleDate: string;
  type: string;
  timeRange: TimeRange;
  notes: string;
  availability: Availability;
}

export interface FormProps {
  form: unknown; // Will be replaced with proper form type
  branches: Branch[];
  staffList: StaffMember[];
  selectedTemplate?: ScheduleTemplate;
  templateStaffInfo?: StaffMember;
  isStaffFieldDisabled: boolean;
  loadingStaff: boolean;
  onStaffChange: (staffId: string) => void;
  onBranchChange: (branchId: string) => void;
  onStartEndTimeChange: (field: string, value: string) => void;
  timeRangeError?: string;
  scheduleDateError?: string;
  onScheduleDateChange: (date: string) => void;
}

export interface WeeklyFixedShiftSelectorProps {
  form: unknown; // Will be replaced with proper form type
  onShiftToggle: (dayKey: string, shiftKey: string, enabled: boolean) => void;
  onCustomTimeChange: (dayKey: string, shiftKey: string, customTime: CustomTime) => void;
  customShiftTimes: CustomTimes;
  jobTitle: string;
  onAddCustomShift: (dayKey: string, customShift: CustomTime) => void;
}

export interface DayFlexibleShiftCardProps {
  dayKey: string;
  dayName: string;
  fixedShift: {
    enabled: boolean;
    shifts: string[];
    startTime: string;
    endTime: string;
    customTimes?: CustomTimes;
  };
  onShiftToggle: (shiftKey: string, enabled: boolean) => void;
  onTimeChange: (field: 'startTime' | 'endTime', value: string) => void;
  onCustomTimeChange: (shiftKey: string, customTime: CustomTime) => void;
  onAddCustomShift: (customShift: CustomTime) => void;
  onRemoveCustomShift: (shiftKey: string) => void;
  customShiftTimes: CustomTimes;
  jobTitle: string;
}

export interface StaffMember {
  _id: string;
  fullName: string;
  email: string;
  jobTitle: string;
  branchId: string;
}

export interface Branch {
  _id: string;
  branchName: string;
  address: string;
}

export interface ScheduleTemplate {
  _id: string;
  name: string;
  type: string;
  branchId: string;
  ptId: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
  maxCapacity: number;
}

export interface FormSubmitHandler {
  (data: StaffScheduleFormData): void | Promise<void>;
}

export interface FormError {
  message: string;
  type: string;
}

export interface FormState {
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  errors: Record<string, FormError>;
}
