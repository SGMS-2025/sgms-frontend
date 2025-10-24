import type { UseFormReturn } from 'react-hook-form';
import type { Staff } from '@/types/api/Staff';
import type { BranchDisplay } from '@/types/api/Branch';
import type { ScheduleTemplate } from '@/types/api/ScheduleTemplate';
import type { WorkShift } from '@/types/api/WorkShift';
import type { StaffScheduleFormData } from '@/types/api/StaffSchedule';

// Basic Info Form Types
export interface BasicInfoFormProps {
  form: UseFormReturn<StaffScheduleFormData, unknown, StaffScheduleFormData>;
  branches: BranchDisplay[];
  staffList: Staff[];
  selectedTemplate?: ScheduleTemplate | null;
  templateStaffInfo?: { name: string; id: string } | null;
  isStaffFieldDisabled: boolean;
  loadingStaff: boolean;
  onStaffChange: (staffId: string) => void;
  onBranchChange: (branchId: string) => void;
  onStartEndTimeChange?: (field: 'startTime' | 'endTime', value: string) => void; // Kept for backward compatibility
  timeRangeError?: string; // Kept for backward compatibility
  scheduleDateError?: string;
  onScheduleDateChange?: (value: string) => void;
}

// Availability Form Types
export interface AvailabilityFormProps {
  form: UseFormReturn<StaffScheduleFormData, unknown, StaffScheduleFormData>;
  onShiftToggle: (
    dayKey: keyof StaffScheduleFormData['availability'],
    shift: import('@/types/api/StaffSchedule').ShiftType
  ) => void;
  onDayToggle?: (dayKey: keyof StaffScheduleFormData['availability']) => void; // Optional for backward compatibility
  onAvailabilityDayClick?: (dayKey: keyof StaffScheduleFormData['availability']) => void; // Optional for backward compatibility
  onCustomTimeChange?: (
    dayKey: string,
    shiftKey: string,
    customTime: import('@/types/api/StaffSchedule').CustomShiftTime | null
  ) => void;
  customShiftTimes?: Record<string, import('@/types/api/StaffSchedule').FixedShift['customTimes']>;
  staffList?: Staff[];
  selectedStaffId?: string;
}

// Template Creation Form Types
export interface TemplateCreationFormProps {
  saveAsTemplate: boolean;
  setSaveAsTemplate: (value: boolean) => void;
  templateName: string;
  setTemplateName: (value: string) => void;
  templateDescription: string;
  setTemplateDescription: (value: string) => void;
  autoGenerateEnabled: boolean;
  setAutoGenerateEnabled: (value: boolean) => void;
  advanceDays: number;
  setAdvanceDays: (value: number) => void;
  endDate: string;
  endDateError: string;
  handleEndDateChange: (value: string) => void;
  watchedTitle: string;
}

// Staff Schedule View Types
export interface StaffScheduleViewProps {
  staffId?: string;
  templateStaffInfo?: { name: string; id: string } | null;
  workShifts: WorkShift[];
  loadingWorkShifts: boolean;
  workShiftError: string | null;
  onRefetch: () => Promise<void>;
}

// Form Step Types
export type FormStep = 'template' | 'basic' | 'availability' | 'template-creation' | 'schedule-view';

// Staff Schedule Data Hook Types
export interface UseStaffScheduleDataReturn {
  staffList: Staff[];
  loadingStaff: boolean;
  workShifts: WorkShift[];
  loadingWorkShifts: boolean;
  workShiftError: string | null;
  refetchWorkShifts: () => Promise<void>;
}

// Template Selection Types
export interface TemplateSelectionProps {
  templates: ScheduleTemplate[];
  loading: boolean;
  selectedTemplate: ScheduleTemplate | null;
  onTemplateSelect: (template: ScheduleTemplate) => void;
  onTemplateClear: () => void;
  branchId?: string;
}

// Form Validation Types
export interface FormValidationErrors {
  title?: string;
  staffId?: string;
  branchId?: string;
  scheduleDate?: string;
  type?: string;
  startTime?: string;
  endTime?: string;
  availability?: {
    [key in keyof StaffScheduleFormData['availability']]?: {
      enabled?: string;
      startTime?: string;
      endTime?: string;
    };
  };
  timezone?: string;
}

// Auto-generation Settings Types
export interface AutoGenerationSettings {
  enabled: boolean;
  advanceDays: number;
  endDate?: string;
}

// Template Creation Data Types
export interface TemplateCreationData {
  name: string;
  description: string;
  type: StaffScheduleFormData['type'];
  branchId: string;
  ptId: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
  maxCapacity: number;
  priority: number;
  autoGenerate: AutoGenerationSettings;
}
