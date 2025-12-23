import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Check, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/utils';
import { format, addDays, eachDayOfInterval, isSameDay, subWeeks, startOfWeek } from 'date-fns';
import { ptAvailabilityRequestApi } from '@/services/api/ptAvailabilityRequestApi';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import type { PTAvailabilitySlot, PTAvailabilityRequest } from '@/types/api/PTAvailabilityRequest';
import { useIsMobile } from '@/hooks/use-mobile';
import type { BranchWorkingConfig } from '@/types/api/BranchWorkingConfig';
import type { Class, DayName } from '@/types/Class';
import { classApi } from '@/services/api/classApi';

interface ScheduleGridSelectorProps {
  selectedSlots: PTAvailabilitySlot[];
  onSlotsChange?: (slots: PTAvailabilitySlot[]) => void; // Optional for read-only mode
  startDate?: Date;
  endDate?: Date;
  timeSlots?: string[]; // Array of time strings like ['06:00', '06:30', ...]
  slotDuration?: number; // Duration in minutes, default 30
  className?: string;
  staffId?: string; // Staff ID to fetch existing requests
  readOnly?: boolean; // If true, slots cannot be modified
  workingDays?: number[]; // Array of working days (0=Sunday, 1=Monday, ..., 6=Saturday). If not provided, all days are allowed.
  branchConfig?: BranchWorkingConfig; // Branch working config for default shifts
}

// Generate time slots array
// Include the end time cell if it aligns with slot boundaries
const generateTimeSlots = (minTime: string, maxTime: string, duration: number): string[] => {
  const slots: string[] = [];
  const [minHour, minMinute] = minTime.split(':').map(Number);
  const [maxHour, maxMinute] = maxTime.split(':').map(Number);

  const minTotalMinutes = minHour * 60 + minMinute;
  const maxTotalMinutes = maxHour * 60 + maxMinute;

  // Generate slots from minTime to maxTime
  for (let minutes = minTotalMinutes; minutes < maxTotalMinutes; minutes += duration) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  }

  // Always include the end time cell to show the complete shift range
  // This ensures the last cell (e.g., 10:00 for 07:30-10:00 shift) is displayed
  // so users can see the full time range and selected slots are properly highlighted
  const endHour = Math.floor(maxTotalMinutes / 60);
  const endMinute = maxTotalMinutes % 60;
  const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

  // Only add if not already in slots (avoid duplicates)
  if (!slots.includes(endTimeStr)) {
    slots.push(endTimeStr);
  }

  return slots;
};

// Helper function to normalize date to 'YYYY-MM-DD' string format consistently
// This avoids timezone issues when comparing dates
const normalizeDateToString = (date: Date | string): string => {
  if (typeof date === 'string') {
    // If it's already in 'YYYY-MM-DD' format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // If it's an ISO string, parse and format with local date components
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  // If it's a Date object, format with local date components (not UTC)
  // This ensures dates from the grid (which are local) match correctly
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Check if a slot is selected
// Each cell in the grid represents a single 30-minute slot
// A cell is selected if it overlaps with any selected slot's time range
const isSlotSelected = (
  date: Date,
  timeSlot: string,
  selectedSlots: PTAvailabilitySlot[],
  slotDuration: number = 30
): boolean => {
  const dateStr = normalizeDateToString(date);

  return selectedSlots.some((slot) => {
    const slotDateStr = normalizeDateToString(slot.date);

    // Date must match
    if (slotDateStr !== dateStr) {
      return false;
    }

    // Check if timeSlot overlaps with slot's time range
    // Convert times to minutes for easier comparison
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const slotStartMinutes = timeToMinutes(slot.startTime);
    const slotEndMinutes = timeToMinutes(slot.endTime);
    const timeSlotMinutes = timeToMinutes(timeSlot);

    // Calculate timeSlot end time for overlap checking
    const timeSlotEndMinutes = timeSlotMinutes + slotDuration;

    // Logic đồng nhất: Cell được highlight nếu cell OVERLAP với slot
    // Cell overlap với slot nếu: cellStart < slotEnd && cellEnd > slotStart
    // Ví dụ: slot 06:00-07:00 (60 phút)
    //   - Cell 06:00 (06:00-06:30): 06:00 < 07:00 && 06:30 > 06:00 → TRUE ✓ (highlight)
    //   - Cell 06:30 (06:30-07:00): 06:30 < 07:00 && 07:00 > 06:00 → TRUE ✓ (highlight)
    //   - Cell 07:00 (07:00-07:30): 07:00 < 07:00 && 07:30 > 06:00 → FALSE ✗ (không highlight)
    return timeSlotMinutes < slotEndMinutes && timeSlotEndMinutes > slotStartMinutes;
  });
};

// Check if a slot already exists (from approved requests)
const isSlotExisting = (
  date: Date,
  timeSlot: string,
  existingSlots: PTAvailabilitySlot[],
  slotDuration: number = 30
): boolean => {
  const dateStr = normalizeDateToString(date);

  return existingSlots.some((slot) => {
    const slotDateStr = normalizeDateToString(slot.date);

    // Date must match
    if (slotDateStr !== dateStr) {
      return false;
    }

    // Check if timeSlot overlaps with slot's time range
    // Convert times to minutes for easier comparison
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const slotStartMinutes = timeToMinutes(slot.startTime);
    const slotEndMinutes = timeToMinutes(slot.endTime);
    const timeSlotMinutes = timeToMinutes(timeSlot);
    const timeSlotEndMinutes = timeSlotMinutes + slotDuration;

    // Logic đồng nhất: Cell được highlight nếu cell OVERLAP với slot
    // Cell overlap với slot nếu: cellStart < slotEnd && cellEnd > slotStart
    return timeSlotMinutes < slotEndMinutes && timeSlotEndMinutes > slotStartMinutes;
  });
};

// Get slot status (selected, waiting, accepted)
// @ts-expect-error - Function kept for future use
const _getSlotStatus = (
  date: Date,
  timeSlot: string,
  selectedSlots: PTAvailabilitySlot[]
): 'selected' | 'waiting' | 'accepted' | null => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const slot = selectedSlots.find((s) => s.date === dateStr && s.startTime === timeSlot);

  if (!slot) return null;
  // For now, we'll use 'selected' - can be extended later
  return 'selected';
};

// Check if a slot is in the past
const isSlotInPast = (date: Date, timeSlot: string): boolean => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const slotDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // If slot date is before today, it's in the past
  if (slotDate < today) {
    return true;
  }

  // If slot date is today, check if time is in the past
  if (slotDate.getTime() === today.getTime()) {
    const [hour, minute] = timeSlot.split(':').map(Number);
    const slotDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
    return slotDateTime < now;
  }

  return false;
};

// Check if a date is a working day
// workingDays: array of day numbers (0=Sunday, 1=Monday, ..., 6=Saturday)
// If workingDays is not provided or empty, all days are considered working days
const isSlotInWorkingDay = (date: Date, workingDays?: number[]): boolean => {
  // If no workingDays provided, allow all days
  if (!workingDays || workingDays.length === 0) {
    return true;
  }

  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  return workingDays.includes(dayOfWeek);
};

// Helper to convert time string to minutes
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Check if a time slot is within any default shift
const isTimeSlotInDefaultShifts = (
  timeSlot: string,
  defaultShifts?: Array<{ startTime: string; endTime: string }>
): boolean => {
  if (!defaultShifts || defaultShifts.length === 0) {
    return true; // If no config, allow all slots
  }

  const slotMinutes = timeToMinutes(timeSlot);

  return defaultShifts.some((shift) => {
    const shiftStart = timeToMinutes(shift.startTime);
    const shiftEnd = timeToMinutes(shift.endTime);
    // Include end time cell to show complete shift range
    // This ensures cells like 10:00 (end of 07:30-10:00), 18:00 (end of 13:00-18:00 and start of 18:00-23:00),
    // and 23:00 (end of 18:00-23:00) are displayed
    return slotMinutes >= shiftStart && slotMinutes <= shiftEnd;
  });
};

// Check if a time slot is a valid start time (can create a slot from this time)
// End-only cells (like 10:00 at end of 04:00-10:00, 23:00 at end of 18:00-23:00) should not be clickable
const isValidStartTime = (
  timeSlot: string,
  slotDuration: number,
  defaultShifts?: Array<{ startTime: string; endTime: string }>
): boolean => {
  if (!defaultShifts || defaultShifts.length === 0) {
    return true; // If no config, all slots are valid
  }

  const slotMinutes = timeToMinutes(timeSlot);
  const slotEndMinutes = slotMinutes + slotDuration;

  // Check if this time slot can be the start of a complete slot
  // It's valid if slot + duration is within OR at the end of any shift
  return defaultShifts.some((shift) => {
    const shiftStart = timeToMinutes(shift.startTime);
    const shiftEnd = timeToMinutes(shift.endTime);

    // Valid if: slot starts within shift AND slot+duration doesn't exceed shift end
    return slotMinutes >= shiftStart && slotEndMinutes <= shiftEnd;
  });
};

// Check if a slot overlaps with a class schedule
interface ClassOverlapResult {
  isOverlapping: boolean;
  classInfo?: Class;
}

const isSlotOverlappingWithClass = (
  date: Date,
  timeSlot: string,
  classes: Class[],
  slotDuration: number = 30
): ClassOverlapResult => {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Map dayOfWeek to DayName format (MONDAY, TUESDAY, etc.)
  const dayNameMap: Record<number, DayName> = {
    0: 'SUNDAY',
    1: 'MONDAY',
    2: 'TUESDAY',
    3: 'WEDNESDAY',
    4: 'THURSDAY',
    5: 'FRIDAY',
    6: 'SATURDAY'
  };
  const dayName = dayNameMap[dayOfWeek];

  const slotStart = timeToMinutes(timeSlot);
  const slotEnd = slotStart + slotDuration;

  for (const cls of classes) {
    if (!cls.schedulePattern || cls.status !== 'ACTIVE') continue;

    // Check if class runs on this day
    const classDays = cls.schedulePattern.daysOfWeek || [];
    if (!classDays.includes(dayName)) continue;

    if (cls.startDate && cls.endDate) {
      const currentDate = new Date(date);
      currentDate.setHours(0, 0, 0, 0);

      const classStartDate = new Date(cls.startDate);
      classStartDate.setHours(0, 0, 0, 0);

      const classEndDate = new Date(cls.endDate);
      classEndDate.setHours(23, 59, 59, 999); // Set to end of day to include the end date

      if (currentDate < classStartDate || currentDate > classEndDate) {
        continue; // Skip this class if date is outside its date range
      }
    }

    const classStart = timeToMinutes(cls.schedulePattern.startTime);
    const classEnd = timeToMinutes(cls.schedulePattern.endTime);

    // Check if slot overlaps with class time
    // Logic đồng nhất: Cell conflict với class nếu cell OVERLAP với class
    // Cell overlap với class nếu: cellStart < classEnd && cellEnd > classStart
    const overlaps = slotStart < classEnd && slotEnd > classStart;
    if (overlaps) {
      return { isOverlapping: true, classInfo: cls };
    }
  }

  return { isOverlapping: false };
};

// Check if a slot is in a pending request
const isSlotInPendingRequest = (
  date: Date,
  timeSlot: string,
  pendingRequests: PTAvailabilityRequest[],
  slotDuration: number = 30
): boolean => {
  const dateStr = normalizeDateToString(date);

  const slotStart = timeToMinutes(timeSlot);
  const slotEnd = slotStart + slotDuration;

  return pendingRequests.some((request) => {
    if (request.status !== 'PENDING_APPROVAL' || !request.slots) return false;

    return request.slots.some((slot) => {
      const slotDateStr = normalizeDateToString(slot.date);
      if (slotDateStr !== dateStr) return false;

      const requestStart = timeToMinutes(slot.startTime);
      const requestEnd = timeToMinutes(slot.endTime);

      // Check if slot overlaps with pending request slot
      // Logic đồng nhất: Cell được highlight nếu cell OVERLAP với pending request slot
      // Cell overlap với request nếu: cellStart < requestEnd && cellEnd > requestStart
      return slotStart < requestEnd && slotEnd > requestStart;
    });
  });
};

// Normalize to start of week (Monday) to match View registration schedule
const getWeekStart = (date: Date): Date => {
  return startOfWeek(date, { weekStartsOn: 1 });
};

export const ScheduleGridSelector: React.FC<ScheduleGridSelectorProps> = ({
  selectedSlots,
  onSlotsChange,
  startDate,
  timeSlots,
  slotDuration = 30,
  className,
  staffId,
  readOnly = false,
  workingDays,
  branchConfig
}) => {
  const { t } = useTranslation();
  const { currentStaff } = useCurrentUserStaff();
  const isMobile = useIsMobile();

  // Start from today instead of startOfWeek
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startDate ? getWeekStart(startDate) : getWeekStart(today)
  );
  const [existingRequests, setExistingRequests] = useState<PTAvailabilityRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PTAvailabilityRequest[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [_loadingExisting, setLoadingExisting] = useState(false);
  const [_loadingClasses, setLoadingClasses] = useState(false);

  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Mobile: Track current day index for showing 3 days at a time
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  // Sync currentWeekStart with startDate prop when it changes
  useEffect(() => {
    if (startDate) {
      setCurrentWeekStart(getWeekStart(startDate));
    }
  }, [startDate]);

  // Generate all available dates (7 days from currentWeekStart)
  // currentWeekStart is already normalized to Monday, so we get Mon-Sun
  const allAvailableDates = useMemo(() => {
    const start = currentWeekStart; // Already normalized to Monday
    const end = addDays(start, 6); // 7 days total (Mon-Sun)
    const allDates = eachDayOfInterval({ start, end });

    return allDates;
  }, [currentWeekStart]);

  // On mobile: show only 3 days at a time, on desktop: show all days
  const dates = useMemo(() => {
    if (isMobile) {
      // On mobile, show 3 days starting from currentDayIndex
      return allAvailableDates.slice(currentDayIndex, currentDayIndex + 3);
    }
    // On desktop, show all available dates
    return allAvailableDates;
  }, [allAvailableDates, currentDayIndex, isMobile]);

  // Reset currentDayIndex when week changes, and ensure it doesn't exceed available dates
  useEffect(() => {
    if (isMobile) {
      setCurrentDayIndex(0);
    }
  }, [currentWeekStart, isMobile]);

  // Ensure currentDayIndex doesn't exceed available dates
  useEffect(() => {
    if (isMobile && allAvailableDates.length > 0) {
      setCurrentDayIndex((prev) => {
        // If current index is beyond available dates, reset to 0
        if (prev >= allAvailableDates.length) {
          return 0;
        }
        // Ensure we don't go beyond available dates
        return Math.min(prev, Math.max(0, allAvailableDates.length - 3));
      });
    }
  }, [allAvailableDates.length, isMobile]);

  // Fetch existing requests (APPROVED and PENDING_APPROVAL)
  useEffect(() => {
    const fetchExistingRequests = async () => {
      const targetStaffId = staffId || currentStaff?._id;
      if (!targetStaffId) return;

      setLoadingExisting(true);
      try {
        const weekStart = currentWeekStart;
        const weekEnd = addDays(weekStart, 6);

        // Fetch APPROVED requests
        const approvedResponse = await ptAvailabilityRequestApi.getRequests({
          staffId: targetStaffId,
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd'),
          status: 'APPROVED',
          limit: 100
        });

        // Fetch PENDING_APPROVAL requests
        const pendingResponse = await ptAvailabilityRequestApi.getRequests({
          staffId: targetStaffId,
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd'),
          status: 'PENDING_APPROVAL',
          limit: 100
        });

        if (approvedResponse.success) {
          setExistingRequests(approvedResponse.data.data);
        }
        if (pendingResponse.success) {
          setPendingRequests(pendingResponse.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch existing requests:', error);
      } finally {
        setLoadingExisting(false);
      }
    };

    fetchExistingRequests();
  }, [currentWeekStart, staffId, currentStaff?._id]);

  // Fetch classes for PT
  useEffect(() => {
    const fetchClasses = async () => {
      const targetStaffId = staffId || currentStaff?._id;
      if (!targetStaffId) {
        setClasses([]);
        return;
      }

      setLoadingClasses(true);
      try {
        const classesData = await classApi.getClassesByTrainer(targetStaffId);
        // Filter only ACTIVE classes
        const activeClasses = (classesData || []).filter((cls) => cls.status === 'ACTIVE');
        setClasses(activeClasses);
      } catch (error) {
        console.error('Failed to fetch classes:', error);
        setClasses([]);
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, [staffId, currentStaff?._id]);

  // Extract existing slots from approved requests
  const existingSlots = useMemo(() => {
    const slots: PTAvailabilitySlot[] = [];
    existingRequests.forEach((request) => {
      if (request.status === 'APPROVED' && request.slots) {
        request.slots.forEach((slot) => {
          try {
            // Parse slot.date - could be Date object or string
            let slotDate: Date;
            if (slot.date && typeof slot.date === 'object' && 'getTime' in slot.date) {
              // It's a Date object
              slotDate = slot.date as Date;
            } else if (typeof slot.date === 'string') {
              // If it's a string 'YYYY-MM-DD', parse as local date to avoid timezone shift
              if (/^\d{4}-\d{2}-\d{2}$/.test(slot.date)) {
                // Parse as local date (not UTC) to avoid timezone issues
                const [year, month, day] = slot.date.split('-').map(Number);
                slotDate = new Date(year, month - 1, day);
              } else {
                // If it's an ISO string, parse normally
                slotDate = new Date(slot.date);
              }
            } else {
              slotDate = new Date(slot.date as string | number | Date);
            }

            const weekStart = currentWeekStart;
            const weekEnd = addDays(weekStart, 6);

            // Compare dates using normalized strings to avoid timezone issues
            const slotDateStr = normalizeDateToString(slotDate);
            const weekStartStr = normalizeDateToString(weekStart);
            const weekEndStr = normalizeDateToString(weekEnd);

            // Check if slot is in current week
            if (slotDateStr >= weekStartStr && slotDateStr <= weekEndStr) {
              slots.push({
                ...slot,
                date: slotDateStr,
                startTime: slot.startTime || '',
                endTime: slot.endTime || '',
                maxCapacity: slot.maxCapacity || 1
              });
            }
          } catch (error) {
            console.warn('Error processing existing slot:', error, slot);
          }
        });
      }
    });

    return slots;
  }, [existingRequests, currentWeekStart]);

  // Generate time slots based on branchConfig.defaultShifts only
  const generatedTimeSlots = useMemo(() => {
    if (timeSlots) return timeSlots;

    // If branchConfig has defaultShifts, generate slots only within those shifts
    if (branchConfig?.defaultShifts && branchConfig.defaultShifts.length > 0) {
      const allSlots: string[] = [];
      const slotSet = new Set<string>();

      // Generate slots for each default shift
      branchConfig.defaultShifts.forEach((shift) => {
        const shiftSlots = generateTimeSlots(shift.startTime, shift.endTime, slotDuration);
        shiftSlots.forEach((slot) => {
          if (!slotSet.has(slot)) {
            slotSet.add(slot);
            allSlots.push(slot);
          }
        });
      });

      // Sort slots by time
      return allSlots.sort((a, b) => {
        return timeToMinutes(a) - timeToMinutes(b);
      });
    }

    // If no branchConfig, return empty array (no time slots to display)
    return [];
  }, [timeSlots, slotDuration, branchConfig?.defaultShifts]);

  // Handle slot click - toggle selection
  const handleSlotClick = (date: Date, timeSlot: string) => {
    // Don't allow changes in read-only mode
    if (readOnly || !onSlotsChange) {
      return;
    }

    // Don't allow clicking on end-only cells (e.g., 10:00 at end of 04:00-10:00 shift)
    if (!isValidStartTime(timeSlot, slotDuration, branchConfig?.defaultShifts)) {
      return;
    }

    // Don't allow selecting existing slots, classes, or pending requests
    if (isSlotExisting(date, timeSlot, existingSlots, slotDuration)) {
      return;
    }

    // Check for class overlap
    const classOverlap = isSlotOverlappingWithClass(date, timeSlot, classes, slotDuration);
    if (classOverlap.isOverlapping) {
      return;
    }

    // Check for pending request
    if (isSlotInPendingRequest(date, timeSlot, pendingRequests, slotDuration)) {
      return;
    }

    const dateStr = normalizeDateToString(date);

    // Check if slot is already selected using normalized date comparison
    const isSelected = selectedSlots.some((slot) => {
      const slotDateStr = normalizeDateToString(slot.date);
      return slotDateStr === dateStr && slot.startTime === timeSlot;
    });

    if (isSelected) {
      // Remove slot - filter out the matching slot
      const newSlots = selectedSlots.filter((slot) => {
        const slotDateStr = normalizeDateToString(slot.date);
        return !(slotDateStr === dateStr && slot.startTime === timeSlot);
      });
      onSlotsChange(newSlots);
    } else {
      // Add slot - calculate end time
      const [hour, minute] = timeSlot.split(':').map(Number);
      const startMinutes = hour * 60 + minute;
      const endMinutes = startMinutes + slotDuration;
      const endHour = Math.floor(endMinutes / 60);
      const endMinute = endMinutes % 60;
      const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

      const newSlot: PTAvailabilitySlot = {
        date: dateStr,
        startTime: timeSlot,
        endTime,
        maxCapacity: 1
      };

      onSlotsChange([...selectedSlots, newSlot]);
    }
  };

  // Swipe handlers for mobile
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!isMobile || !touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left = next 3 days
      setCurrentDayIndex((prev) => {
        const nextIndex = prev + 3;
        // If we've reached the end, move to next week and reset index
        if (nextIndex >= allAvailableDates.length) {
          setCurrentWeekStart((current) => {
            const nextWeek = addDays(current, 7);
            return getWeekStart(nextWeek);
          });
          return 0; // Reset to start of new week
        }
        return nextIndex;
      });
    }

    if (isRightSwipe) {
      // Swipe right = previous 3 days
      setCurrentDayIndex((prev) => {
        const prevIndex = prev - 3;
        // If we're at the beginning, try to go to previous week
        if (prevIndex < 0) {
          setCurrentWeekStart((current) => {
            const prevStart = subWeeks(current, 1);
            const normalizedPrevStart = getWeekStart(prevStart);
            // Don't allow going before today
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const todayWeekStart = getWeekStart(todayOnly);
            if (normalizedPrevStart < todayWeekStart) {
              return todayWeekStart;
            }
            return normalizedPrevStart;
          });
          // Calculate how many days we can show from previous week
          // We'll reset to show the last 3 days of previous week, but this will be recalculated
          // when allAvailableDates updates, so we return 0 for now
          return 0;
        }
        return prevIndex;
      });
    }
  };

  // Navigation handlers
  const handlePreviousWeek = () => {
    setCurrentWeekStart((prev) => {
      const prevStart = subWeeks(prev, 1);
      // Normalize to Monday
      const normalizedPrevStart = getWeekStart(prevStart);

      // In read-only mode, allow navigation to past weeks (to view old requests)
      if (readOnly) {
        return normalizedPrevStart;
      }

      // In editable mode, don't allow going before today
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayWeekStart = getWeekStart(todayOnly);
      if (normalizedPrevStart < todayWeekStart) {
        return todayWeekStart;
      }
      return normalizedPrevStart;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const nextWeek = addDays(prev, 7);
      // Normalize to Monday to ensure consistency
      return getWeekStart(nextWeek);
    });
  };

  const handleToday = () => {
    setCurrentWeekStart(getWeekStart(today));
  };

  // Calculate week range for display
  const weekRange =
    dates.length > 0
      ? `${format(dates[0], 'MMM d')} - ${format(dates[dates.length - 1], 'MMM d, yyyy')}`
      : format(today, 'MMM d, yyyy');

  return (
    <div
      className={cn('w-full space-y-4', className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header with Week Navigation */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">
            {readOnly
              ? t('pt_availability.view_schedule', 'Xem lịch đăng ký')
              : t('pt_availability.setup_schedule', 'Set up schedule')}
          </h3>
          <div className="text-sm opacity-90">
            {selectedSlots.length} {t('pt_availability.slots_selected', 'slots selected')}
          </div>
        </div>
        <p className="text-xs text-blue-100 opacity-80 mb-3">
          {t('pt_availability.cell_duration_note', 'Lưu ý: Mỗi ô đại diện cho 30 phút')}
        </p>

        {/* Week Navigation - Hide on mobile, show on desktop */}
        {!isMobile && (
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePreviousWeek}
              className="text-white hover:bg-blue-700"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t('common.previous_week', 'Tuần trước')}
            </Button>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{weekRange}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleToday}
                className="text-white hover:bg-blue-700 text-xs"
              >
                {t('common.today', 'Hôm nay')}
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleNextWeek}
              className="text-white hover:bg-blue-700"
            >
              {t('common.next_week', 'Tuần sau')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Mobile: Show week range and swipe hint */}
        {isMobile && (
          <div className="flex items-center justify-center gap-3 flex-col">
            <span className="text-sm font-medium">
              {dates.length > 0
                ? `${format(dates[0], 'MMM d')} - ${format(dates[dates.length - 1], 'MMM d, yyyy')}`
                : format(today, 'MMM d, yyyy')}
            </span>
            <span className="text-xs opacity-75">
              {t('pt_availability.swipe_to_navigate', 'Vuốt trái/phải để chuyển 3 ngày')}
            </span>
          </div>
        )}
      </div>

      {/* Grid Container */}
      <div className="border border-gray-200 rounded-b-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <div
            className="inline-block min-w-full"
            style={{
              display: 'grid',
              gridTemplateColumns: `120px repeat(${dates.length}, minmax(80px, 1fr))`,
              gridTemplateRows: `auto repeat(${generatedTimeSlots.length}, 40px)`
            }}
          >
            {/* Empty corner */}
            <div className="bg-gray-50 border-r border-b border-gray-200 p-2" />

            {/* Date Headers */}
            {dates.map((date, dateIndex) => {
              const isWorkingDay = isSlotInWorkingDay(date, workingDays);
              return (
                <div
                  key={dateIndex}
                  className={cn(
                    'bg-gray-50 border-r border-b border-gray-200 p-2 text-center',
                    !isWorkingDay && 'opacity-40'
                  )}
                >
                  <div className={cn('text-xs font-semibold', isWorkingDay ? 'text-gray-700' : 'text-gray-400')}>
                    {format(date, 'EEE')}
                  </div>
                  <div className={cn('text-sm font-bold', isWorkingDay ? 'text-gray-900' : 'text-gray-400')}>
                    {format(date, 'd')}
                  </div>
                </div>
              );
            })}

            {/* Time Slots and Grid Cells */}
            {generatedTimeSlots.map((timeSlot, timeIndex) => {
              // Check if this time slot should be visible based on defaultShifts
              const isInDefaultShift = isTimeSlotInDefaultShifts(timeSlot, branchConfig?.defaultShifts);
              // Check if this is a valid start time (not an end-only cell)
              const isValidStart = isValidStartTime(timeSlot, slotDuration, branchConfig?.defaultShifts);

              return (
                <React.Fragment key={timeIndex}>
                  {/* Time Label - Hide if not in default shift */}
                  {isInDefaultShift ? (
                    <div className="bg-gray-50 border-r border-b border-gray-200 p-2 text-xs font-medium text-gray-600 flex items-center justify-center">
                      {timeSlot}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border-r border-b border-gray-200 p-2" />
                  )}

                  {/* Date Cells */}
                  {dates.map((date, dateIndex) => {
                    if (!isInDefaultShift) {
                      // Hide cells that are not in default shifts
                      return (
                        <div
                          key={`${dateIndex}-${timeIndex}`}
                          className="border-r border-b border-gray-200 bg-gray-50 opacity-30"
                          style={{ minHeight: '40px' }}
                        />
                      );
                    }

                    const isSelected = isSlotSelected(date, timeSlot, selectedSlots, slotDuration);
                    const isExisting = isSlotExisting(date, timeSlot, existingSlots, slotDuration);
                    const isToday = isSameDay(date, new Date());
                    const isPast = isSlotInPast(date, timeSlot);
                    const isWorkingDay = isSlotInWorkingDay(date, workingDays);

                    // Check for class overlap
                    const classOverlap = isSlotOverlappingWithClass(date, timeSlot, classes, slotDuration);
                    const hasClass = classOverlap.isOverlapping;

                    // Check for pending request
                    const hasPendingRequest = isSlotInPendingRequest(date, timeSlot, pendingRequests, slotDuration);

                    // Check if this is an end-only cell that cannot be clicked
                    const isEndOnlyCell = !isValidStart;

                    // Get day name for tooltip
                    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                    const dayName = dayNames[date.getDay()];

                    return (
                      <button
                        key={`${dateIndex}-${timeIndex}`}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (
                            !isExisting &&
                            !readOnly &&
                            !isPast &&
                            isWorkingDay &&
                            !hasClass &&
                            !hasPendingRequest &&
                            !isEndOnlyCell
                          ) {
                            handleSlotClick(date, timeSlot);
                          }
                        }}
                        disabled={
                          isExisting ||
                          readOnly ||
                          isPast ||
                          !isWorkingDay ||
                          hasClass ||
                          hasPendingRequest ||
                          isEndOnlyCell
                        }
                        className={cn(
                          'border-r border-b border-gray-200 transition-all duration-150',
                          !readOnly &&
                            !isPast &&
                            isWorkingDay &&
                            !hasClass &&
                            !hasPendingRequest &&
                            !isEndOnlyCell &&
                            'hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset cursor-pointer',
                          readOnly && 'cursor-default',
                          // End-only cells (like 10:00, 23:00) - shown for display but not clickable
                          isEndOnlyCell && 'bg-gray-50 border-gray-300 cursor-not-allowed opacity-60',
                          // Priority: hasPendingRequest should override isSelected
                          hasPendingRequest && 'bg-amber-100 border-amber-300 cursor-not-allowed opacity-75',
                          isSelected && !hasPendingRequest && 'bg-green-100 border-green-300',
                          isExisting &&
                            !hasPendingRequest &&
                            !isSelected &&
                            'bg-purple-100 border-purple-300 cursor-not-allowed opacity-75',
                          hasClass &&
                            !hasPendingRequest &&
                            !isSelected &&
                            !isExisting &&
                            'bg-blue-100 border-blue-300 cursor-not-allowed opacity-75',
                          isPast && 'bg-gray-100 cursor-not-allowed opacity-50',
                          !isWorkingDay && 'bg-gray-100 cursor-not-allowed opacity-40',
                          isToday &&
                            !isSelected &&
                            !isExisting &&
                            !hasClass &&
                            !hasPendingRequest &&
                            !isPast &&
                            isWorkingDay &&
                            !isEndOnlyCell &&
                            'bg-blue-50/30'
                        )}
                        style={{ minHeight: '40px' }}
                        title={
                          !isWorkingDay
                            ? t(
                                'pt_availability.slot_outside_working_days',
                                `Không thể tạo lịch vào ${dayName}. Chi nhánh đóng cửa vào ngày này.`
                              ).replace('{dayName}', dayName)
                            : isPast
                              ? t('pt_availability.slot_in_past', 'Khung giờ trong quá khứ')
                              : isExisting
                                ? t('pt_availability.slot_already_registered', 'Đã đăng ký trước đó')
                                : hasClass
                                  ? t('pt_availability.slot_has_class', 'PT đã có lớp học trong khung giờ này')
                                  : hasPendingRequest
                                    ? t('pt_availability.slot_pending_request', 'Đã có yêu cầu đang chờ duyệt')
                                    : readOnly
                                      ? ''
                                      : ''
                        }
                      >
                        {isSelected && (
                          <div className="flex items-center justify-center h-full">
                            <Check className="w-5 h-5 text-green-600" />
                          </div>
                        )}
                        {isExisting && !isSelected && (
                          <div className="flex items-center justify-center h-full">
                            <Circle className="w-4 h-4 text-purple-600 fill-purple-600" />
                          </div>
                        )}
                        {hasClass && !isSelected && !isExisting && (
                          <div className="flex items-center justify-center h-full">
                            <Circle className="w-4 h-4 text-blue-600 fill-blue-600" />
                          </div>
                        )}
                        {hasPendingRequest && !isSelected && !isExisting && !hasClass && (
                          <div className="flex items-center justify-center h-full">
                            <Circle className="w-4 h-4 text-amber-600 fill-amber-600" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-gray-600">{t('pt_availability.status.selected', 'Selected')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4 text-purple-600 fill-purple-600" />
          <span className="text-gray-600">{t('pt_availability.existing_slot', 'Đã đăng ký trước đó')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4 text-blue-600 fill-blue-600" />
          <span className="text-gray-600">{t('pt_availability.class_slot', 'Lớp học')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4 text-amber-600 fill-amber-600" />
          <span className="text-gray-600">{t('pt_availability.pending_request', 'Yêu cầu chờ duyệt')}</span>
        </div>
      </div>
    </div>
  );
};
