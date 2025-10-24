import type { ScheduleTemplate } from './ScheduleTemplate';

/**
 * Props for ScheduleTemplateDetailModal component
 */
export interface ScheduleTemplateDetailModalProps {
  template: ScheduleTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (template: ScheduleTemplate) => void;
}

/**
 * Props for ScheduleTemplateDetailView component
 */
export interface ScheduleTemplateDetailViewProps {
  template: ScheduleTemplate;
  onEdit: (template: ScheduleTemplate) => void;
}

/**
 * Shift information for display
 */
export interface ShiftInfo {
  name: string;
  startTime: string;
  endTime: string;
  duration: string;
}

/**
 * Template detail information
 */
export interface TemplateDetailInfo {
  basicInfo: {
    name: string;
    description?: string;
    type: string;
    branch: string;
    status: string;
  };
  scheduleInfo: {
    days: string[];
    shifts: ShiftInfo[];
    capacity: number;
    priority: number;
  };
  autoGenerateInfo: {
    enabled: boolean;
    advanceDays?: number;
    endDate?: string;
  };
  usageInfo: {
    usageCount: number;
    lastUsed?: string;
    createdBy: string;
    createdAt: string;
  };
}
