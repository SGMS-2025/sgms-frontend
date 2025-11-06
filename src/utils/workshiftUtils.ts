/**
 * Utility functions for workshift calculations and operations
 */

import type { ShiftConfig } from '@/types/api/BranchWorkingConfig';
import type { DayOfWeek } from '@/types/api/WorkShift';

/**
 * Calculate total hours from start and end time
 * @param startTime - ISO date string or Date object
 * @param endTime - ISO date string or Date object
 * @returns Total hours rounded to 2 decimal places
 */
export const calculateWorkShiftHours = (startTime: string | Date, endTime: string | Date): number => {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new TypeError('Invalid date provided to calculateWorkShiftHours');
  }

  const durationMs = end.getTime() - start.getTime();
  const totalHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places

  if (totalHours < 0) {
    throw new Error('End time must be after start time');
  }

  if (totalHours > 24) {
    throw new Error('Shift duration cannot exceed 24 hours');
  }

  return totalHours;
};

/**
 * Check if a workshift is virtual
 * @param workShift - WorkShift object with optional isVirtual flag
 * @returns true if workshift is virtual
 */
export const isVirtualWorkShift = (workShift: { _id: string; isVirtual?: boolean }): boolean => {
  return Boolean(workShift.isVirtual || workShift._id.startsWith('virtual-'));
};

/**
 * Sort shifts by start time (ascending)
 * @param shifts - Array of shift configurations
 * @returns Sorted array of shifts
 */
export const sortShiftsByStartTime = (shifts: ShiftConfig[]): ShiftConfig[] => {
  return [...shifts].sort((a, b) => {
    const [aHour, aMin] = a.startTime.split(':').map(Number);
    const [bHour, bMin] = b.startTime.split(':').map(Number);
    return aHour * 60 + aMin - (bHour * 60 + bMin);
  });
};

/**
 * Generate consecutive shift pairs (2 ca liên tiếp)
 * Example: [Morning, Afternoon, Evening] -> [[Morning, Afternoon], [Afternoon, Evening]]
 * @param shifts - Array of shift configurations (should be sorted by start time)
 * @returns Array of consecutive shift pairs
 */
export const generateConsecutiveShiftPairs = (shifts: ShiftConfig[]): ShiftConfig[][] => {
  if (shifts.length === 0) {
    return [];
  }

  // If only 1 shift available, return it as a single-item array
  if (shifts.length === 1) {
    return [[shifts[0]]];
  }

  const pairs: ShiftConfig[][] = [];

  // Create pairs of consecutive shifts
  for (let i = 0; i < shifts.length - 1; i++) {
    pairs.push([shifts[i], shifts[i + 1]]);
  }

  return pairs;
};

/**
 * Get day of week name from Date object
 * @param date - Date object
 * @returns Day of week name as DayOfWeek type
 */
export const getDayOfWeekName = (date: Date): DayOfWeek => {
  const dayNames: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayIndex = date.getDay();
  return dayNames[dayIndex];
};
