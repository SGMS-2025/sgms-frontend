import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Check, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/utils';
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay, subWeeks, addWeeks } from 'date-fns';
import { ptAvailabilityRequestApi } from '@/services/api/ptAvailabilityRequestApi';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import type { PTAvailabilitySlot, PTAvailabilityRequest } from '@/types/api/PTAvailabilityRequest';

interface ScheduleGridSelectorProps {
  selectedSlots: PTAvailabilitySlot[];
  onSlotsChange?: (slots: PTAvailabilitySlot[]) => void; // Optional for read-only mode
  startDate?: Date;
  endDate?: Date;
  timeSlots?: string[]; // Array of time strings like ['06:00', '06:30', ...]
  slotDuration?: number; // Duration in minutes, default 30
  minTime?: string; // Default '06:00'
  maxTime?: string; // Default '22:00'
  className?: string;
  staffId?: string; // Staff ID to fetch existing requests
  readOnly?: boolean; // If true, slots cannot be modified
}

// Generate time slots array
const generateTimeSlots = (minTime: string, maxTime: string, duration: number): string[] => {
  const slots: string[] = [];
  const [minHour, minMinute] = minTime.split(':').map(Number);
  const [maxHour, maxMinute] = maxTime.split(':').map(Number);

  const minTotalMinutes = minHour * 60 + minMinute;
  const maxTotalMinutes = maxHour * 60 + maxMinute;

  for (let minutes = minTotalMinutes; minutes < maxTotalMinutes; minutes += duration) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
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
const isSlotSelected = (date: Date, timeSlot: string, selectedSlots: PTAvailabilitySlot[]): boolean => {
  const dateStr = normalizeDateToString(date);

  return selectedSlots.some((slot) => {
    const slotDateStr = normalizeDateToString(slot.date);

    // Date must match
    if (slotDateStr !== dateStr) {
      return false;
    }

    // Check if timeSlot is within the slot's time range
    // Convert times to minutes for easier comparison
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const slotStartMinutes = timeToMinutes(slot.startTime);
    const slotEndMinutes = timeToMinutes(slot.endTime);
    const timeSlotMinutes = timeToMinutes(timeSlot);

    // Check if timeSlot is within slot's time range
    // timeSlot is selected if it starts within [slot.startTime, slot.endTime)
    // For inclusive end time: if slot ends exactly at timeSlot start, include it
    // This handles the case where user selects 18:00-20:00 and expects 20:00 cell to be selected
    // The 20:00 cell represents slot 20:00-20:30, but if the merged slot ends at 20:00,
    // we should still show it as selected for visual consistency
    if (timeSlotMinutes >= slotStartMinutes && timeSlotMinutes < slotEndMinutes) {
      // Standard case: timeSlot starts within the slot range
      return true;
    }

    // Edge case: if slot ends exactly at timeSlot start, include it
    // This means if slot is 18:00-20:00, the 20:00 cell (20:00-20:30) should be shown as selected
    if (timeSlotMinutes === slotEndMinutes) {
      return true;
    }

    return false;
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

    // Check if timeSlot overlaps with slot's time range
    // timeSlot overlaps if:
    // - timeSlot starts before slot ends AND timeSlot ends after slot starts
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

export const ScheduleGridSelector: React.FC<ScheduleGridSelectorProps> = ({
  selectedSlots,
  onSlotsChange,
  startDate,
  timeSlots,
  slotDuration = 30,
  minTime = '06:00',
  maxTime = '22:00',
  className,
  staffId,
  readOnly = false
}) => {
  const { t } = useTranslation();
  const { currentStaff } = useCurrentUserStaff();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startDate || startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [existingRequests, setExistingRequests] = useState<PTAvailabilityRequest[]>([]);
  const [_loadingExisting, setLoadingExisting] = useState(false);

  // Generate dates for current week (7 days)
  const dates = useMemo(() => {
    const start = currentWeekStart;
    const end = addDays(start, 6); // 7 days total (Monday to Sunday)
    return eachDayOfInterval({ start, end });
  }, [currentWeekStart]);

  // Fetch existing requests
  useEffect(() => {
    const fetchExistingRequests = async () => {
      const targetStaffId = staffId || currentStaff?._id;
      if (!targetStaffId) return;

      setLoadingExisting(true);
      try {
        const weekStart = currentWeekStart;
        const weekEnd = addDays(weekStart, 6);

        // Use getRequests with staffId filter instead of getRequestsByStaff
        const response = await ptAvailabilityRequestApi.getRequests({
          staffId: targetStaffId,
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd'),
          status: 'APPROVED', // Only show approved requests
          limit: 100
        });

        if (response.success) {
          setExistingRequests(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch existing requests:', error);
      } finally {
        setLoadingExisting(false);
      }
    };

    fetchExistingRequests();
  }, [currentWeekStart, staffId, currentStaff?._id]);

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

    console.log('[ScheduleGridSelector] Existing slots for week:', {
      weekStart: normalizeDateToString(currentWeekStart),
      weekEnd: normalizeDateToString(addDays(currentWeekStart, 6)),
      existingRequestsCount: existingRequests.length,
      existingSlotsCount: slots.length,
      existingSlots: slots.map((s) => ({
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime
      }))
    });

    return slots;
  }, [existingRequests, currentWeekStart]);

  // Generate time slots if not provided
  const generatedTimeSlots = useMemo(() => {
    if (timeSlots) return timeSlots;
    return generateTimeSlots(minTime, maxTime, slotDuration);
  }, [timeSlots, minTime, maxTime, slotDuration]);

  // Handle slot click - toggle selection
  const handleSlotClick = (date: Date, timeSlot: string) => {
    // Don't allow changes in read-only mode
    if (readOnly || !onSlotsChange) {
      return;
    }

    // Don't allow selecting existing slots
    if (isSlotExisting(date, timeSlot, existingSlots, slotDuration)) {
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

  // Handle range selection (click and drag)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ date: Date; timeSlot: string } | null>(null);
  const [clickStartTime, setClickStartTime] = useState<number | null>(null);

  const handleMouseDown = (date: Date, timeSlot: string) => {
    setClickStartTime(Date.now());
    setIsDragging(true);
    setDragStart({ date, timeSlot });
    // Don't toggle on mousedown - wait for click to determine if it's a click or drag
  };

  const handleMouseEnter = (date: Date, timeSlot: string) => {
    if (readOnly || !onSlotsChange) return;
    if (isDragging && dragStart) {
      // Select range from dragStart to current
      const startDateStr = normalizeDateToString(dragStart.date);
      const currentDateStr = normalizeDateToString(date);

      // Only handle same date for now
      if (startDateStr === currentDateStr) {
        const startIndex = generatedTimeSlots.indexOf(dragStart.timeSlot);
        const endIndex = generatedTimeSlots.indexOf(timeSlot);

        if (startIndex !== -1 && endIndex !== -1) {
          const minIndex = Math.min(startIndex, endIndex);
          const maxIndex = Math.max(startIndex, endIndex);

          const newSlots: PTAvailabilitySlot[] = [];
          for (let i = minIndex; i <= maxIndex; i++) {
            const slotTime = generatedTimeSlots[i];
            const [hour, minute] = slotTime.split(':').map(Number);
            const startMinutes = hour * 60 + minute;
            const endMinutes = startMinutes + slotDuration;
            const endHour = Math.floor(endMinutes / 60);
            const endMinute = endMinutes % 60;
            const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

            newSlots.push({
              date: currentDateStr,
              startTime: slotTime,
              endTime,
              maxCapacity: 1
            });
          }

          // Remove existing slots for this date in the range
          const filteredSlots = selectedSlots.filter(
            (slot) =>
              !(
                slot.date === currentDateStr &&
                generatedTimeSlots.indexOf(slot.startTime) >= minIndex &&
                generatedTimeSlots.indexOf(slot.startTime) <= maxIndex
              )
          );

          onSlotsChange([...filteredSlots, ...newSlots]);
        }
      }
    }
  };

  const handleMouseUp = (date: Date, timeSlot: string) => {
    const clickDuration = clickStartTime ? Date.now() - clickStartTime : 0;

    // If it was a quick click (less than 200ms), treat it as a toggle click
    if (
      clickDuration < 200 &&
      dragStart &&
      normalizeDateToString(dragStart.date) === normalizeDateToString(date) &&
      dragStart.timeSlot === timeSlot
    ) {
      handleSlotClick(date, timeSlot);
    }

    setIsDragging(false);
    setDragStart(null);
    setClickStartTime(null);
  };

  // Navigation handlers
  const handlePreviousWeek = () => {
    setCurrentWeekStart((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  };

  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const weekRange = `${format(dates[0], 'MMM d')} - ${format(dates[6], 'MMM d, yyyy')}`;

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Header with Week Navigation */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">
            {readOnly
              ? t('pt_availability.view_schedule', 'Xem lịch đăng ký')
              : t('pt_availability.setup_schedule', 'Set up schedule')}
          </h3>
          <div className="text-sm opacity-90">
            {selectedSlots.length} {t('pt_availability.slots_selected', 'slots selected')}
          </div>
        </div>

        {/* Week Navigation */}
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
            {dates.map((date, dateIndex) => (
              <div key={dateIndex} className="bg-gray-50 border-r border-b border-gray-200 p-2 text-center">
                <div className="text-xs font-semibold text-gray-700">{format(date, 'EEE')}</div>
                <div className="text-sm font-bold text-gray-900">{format(date, 'd')}</div>
              </div>
            ))}

            {/* Time Slots and Grid Cells */}
            {generatedTimeSlots.map((timeSlot, timeIndex) => (
              <React.Fragment key={timeIndex}>
                {/* Time Label */}
                <div className="bg-gray-50 border-r border-b border-gray-200 p-2 text-xs font-medium text-gray-600 flex items-center justify-center">
                  {timeSlot}
                </div>

                {/* Date Cells */}
                {dates.map((date, dateIndex) => {
                  const isSelected = isSlotSelected(date, timeSlot, selectedSlots);
                  const isExisting = isSlotExisting(date, timeSlot, existingSlots, slotDuration);
                  const isToday = isSameDay(date, new Date());

                  return (
                    <button
                      key={`${dateIndex}-${timeIndex}`}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!isExisting && !readOnly) {
                          handleSlotClick(date, timeSlot);
                        }
                      }}
                      onMouseDown={() => !isExisting && !readOnly && handleMouseDown(date, timeSlot)}
                      onMouseEnter={() => !isExisting && !readOnly && handleMouseEnter(date, timeSlot)}
                      onMouseUp={() => !isExisting && !readOnly && handleMouseUp(date, timeSlot)}
                      disabled={isExisting || readOnly}
                      className={cn(
                        'border-r border-b border-gray-200 transition-all duration-150',
                        !readOnly &&
                          'hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
                        readOnly && 'cursor-default',
                        isSelected && 'bg-green-100 border-green-300',
                        isExisting && 'bg-purple-100 border-purple-300 cursor-not-allowed opacity-75',
                        isToday && !isSelected && !isExisting && 'bg-blue-50/30',
                        isDragging && dragStart?.date === date && !isExisting && !readOnly && 'bg-blue-100'
                      )}
                      style={{ minHeight: '40px' }}
                      title={
                        isExisting
                          ? t('pt_availability.slot_already_registered', 'Đã đăng ký trước đó')
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
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
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
      </div>
    </div>
  );
};
