import type { ScheduleTemplate } from '@/types/api/ScheduleTemplate';

/**
 * Interface for multiple shifts data stored in template notes
 */
export interface MultipleShiftsData {
  multipleShifts: boolean;
  shifts: Array<{
    shiftType: string;
    startTime: string;
    endTime: string;
    daysOfWeek: string[];
  }>;
}

/**
 * Parse multiple shifts data from template notes
 */
export const parseMultipleShifts = (template: ScheduleTemplate): MultipleShiftsData | null => {
  if (!template.notes) return null;

  try {
    const notesData = JSON.parse(template.notes);
    if (notesData.multipleShifts && Array.isArray(notesData.shifts)) {
      return notesData as MultipleShiftsData;
    }
  } catch (error) {
    console.error('Error parsing template notes:', error);
  }

  return null;
};

/**
 * Get time display for template with support for multiple shifts
 */
export const getTimeDisplay = (template: ScheduleTemplate): string => {
  const multipleShifts = parseMultipleShifts(template);

  if (multipleShifts && multipleShifts.shifts.length > 1) {
    const shiftCount = multipleShifts.shifts.length;
    return `${template.startTime} - ${template.endTime} (${shiftCount} ca)`;
  }

  return `${template.startTime} - ${template.endTime}`;
};

/**
 * Get detailed time display showing all shifts
 */
export const getDetailedTimeDisplay = (template: ScheduleTemplate): string => {
  const multipleShifts = parseMultipleShifts(template);

  if (multipleShifts && multipleShifts.shifts.length > 1) {
    return multipleShifts.shifts.map((shift) => `${shift.startTime}-${shift.endTime}`).join(', ');
  }

  return `${template.startTime} - ${template.endTime}`;
};

/**
 * Get all shifts from template
 */
export const getAllShifts = (
  template: ScheduleTemplate
): Array<{
  name: string;
  startTime: string;
  endTime: string;
  shiftType?: string;
  daysOfWeek?: string[];
}> => {
  const multipleShifts = parseMultipleShifts(template);

  if (multipleShifts && multipleShifts.shifts.length > 0) {
    return multipleShifts.shifts.map((shift) => ({
      name: shift.shiftType,
      startTime: shift.startTime,
      endTime: shift.endTime,
      shiftType: shift.shiftType,
      daysOfWeek: shift.daysOfWeek
    }));
  }

  // Fallback to single shift
  return [
    {
      name: 'Main Shift',
      startTime: template.startTime,
      endTime: template.endTime
    }
  ];
};

/**
 * Check if template has multiple shifts
 */
export const hasMultipleShifts = (template: ScheduleTemplate): boolean => {
  const multipleShifts = parseMultipleShifts(template);
  return multipleShifts !== null && multipleShifts.shifts.length > 1;
};

/**
 * Get shift count for template
 */
export const getShiftCount = (template: ScheduleTemplate): number => {
  const multipleShifts = parseMultipleShifts(template);
  return multipleShifts ? multipleShifts.shifts.length : 1;
};

/**
 * Format time for display (HH:MM format)
 */
export const formatTime = (time: string): string => {
  if (!time) return '';

  // If already in HH:MM format, return as is
  if (/^\d{2}:\d{2}$/.test(time)) {
    return time;
  }

  // If in HH:MM:SS format, remove seconds
  if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
    return time.substring(0, 5);
  }

  return time;
};

/**
 * Get template type color class
 */
export const getTemplateTypeColor = (type: string): string => {
  const typeColorMap: Record<string, string> = {
    CLASS: 'bg-blue-100 text-blue-800',
    PERSONAL_TRAINING: 'bg-green-100 text-green-800',
    FREE_TIME: 'bg-yellow-100 text-yellow-800',
    MAINTENANCE: 'bg-red-100 text-red-800'
  };

  return typeColorMap[type] || 'bg-gray-100 text-gray-800';
};

/**
 * Get template status color class
 */
export const getTemplateStatusColor = (isActive: boolean): string => {
  if (isActive) {
    return 'bg-green-100 text-green-800';
  }
  return 'bg-gray-100 text-gray-800';
};

/**
 * Get auto-generate status color class
 */
export const getAutoGenerateColor = (enabled: boolean): string => {
  if (enabled) {
    return 'bg-green-100 text-green-800';
  }
  return 'bg-gray-100 text-gray-800';
};
