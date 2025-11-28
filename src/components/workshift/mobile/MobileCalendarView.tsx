import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import type { TFunction } from 'i18next';
import { ChevronLeft, ChevronRight, Plus, Settings, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/utils';
import type { WorkShift, VirtualWorkShift } from '@/types/api/WorkShift';
import type { BranchWorkingConfig } from '@/types/api/BranchWorkingConfig';
import { utcToVnTimeString, utcToVnDateString } from '@/utils/datetime';
import { useClassesByTrainer } from '@/hooks/useClassesByTrainer';
import { ClassDetailModal } from '../modals/ClassDetailModal';

interface MobileCalendarViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  shifts: (WorkShift | VirtualWorkShift)[];
  branchConfig: BranchWorkingConfig | null;
  onShiftTap: (shift: WorkShift | VirtualWorkShift) => void;
  onCreateShift?: () => void;
  onBranchConfig?: () => void;
  canEdit: boolean;
}

// Type for staff data from WorkShift/VirtualWorkShift
type StaffData =
  | {
      _id?: string;
      userId?: {
        _id?: string;
        fullName?: string;
        email?: string;
        phoneNumber?: string;
      };
      firstName?: string;
      lastName?: string;
      jobTitle?: string;
      email?: string;
    }
  | undefined;

// Helper to get status colors
const getShiftStatusColor = (status?: string) => {
  switch (status) {
    case 'SCHEDULED':
      return 'bg-green-500';
    case 'PENDING_TIME_OFF':
      return 'bg-yellow-500';
    case 'CANCELLED':
      return 'bg-red-500';
    case 'COMPLETED':
      return 'bg-gray-400';
    default:
      return 'bg-blue-500';
  }
};

// Helper to get staff name
const getStaffName = (staffId: StaffData): string => {
  if (!staffId) return 'Unknown';
  if (staffId.userId?.fullName) return staffId.userId.fullName;
  if (staffId.firstName && staffId.lastName) {
    return `${staffId.firstName} ${staffId.lastName}`;
  }
  return 'Unknown';
};

// Helper to get staff avatar
const getStaffAvatar = (staffId: StaffData): string | undefined => {
  const name = getStaffName(staffId);
  if (name === 'Unknown') {
    return undefined;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=orange&color=fff`;
};

// Helper to get staff initials
const getStaffInitials = (staffId: StaffData): string => {
  if (!staffId) return 'UK';
  if (staffId.userId?.fullName) {
    const parts = staffId.userId.fullName.split(' ');
    return parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0] || ''}`.toUpperCase() : parts[0][0].toUpperCase();
  }
  if (staffId.firstName && staffId.lastName) {
    return `${staffId.firstName[0]}${staffId.lastName[0]}`.toUpperCase();
  }
  return 'UK';
};

// Helper to get translated status text
const getStatusText = (status: string | undefined, t: TFunction): string => {
  if (!status) return t('workshift.status.unknown');

  const statusKey = status.toLowerCase();
  return t(`workshift.status.${statusKey}`, status);
};

const MobileCalendarView: React.FC<MobileCalendarViewProps> = ({
  selectedDate,
  onDateChange,
  shifts,
  branchConfig,
  onShiftTap,
  onCreateShift,
  onBranchConfig,
  canEdit
}) => {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showClassDetail, setShowClassDetail] = useState(false);

  // Fetch classes for current staff
  const staffId = shifts?.[0]?.staffId?._id;
  const { classes } = useClassesByTrainer(staffId);

  // Get current locale based on i18n language
  const currentLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  // Generate translated weekday abbreviations
  const weekDays = useMemo(() => {
    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    return dayKeys.map((dayKey) => t(`workshift.${dayKey}`));
  }, [t]);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days: (Date | null)[] = [];

    // Add empty slots for days before month starts
    // Adjust for Monday start (shift Sunday to end)
    const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    for (let i = 0; i < adjustedStartDay; i++) {
      days.push(null);
    }

    // Add all days in month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentMonth]);

  // Find classes that match shift time
  const getClassesForShift = (shift: WorkShift | VirtualWorkShift) => {
    if (!classes) return [];

    const shiftStart = shift.startTimeLocal;
    const shiftEnd = shift.endTimeLocal;
    const dayOfWeek = shift.dayOfTheWeek;

    return classes.filter((cls) => {
      if (!cls.schedulePattern) return false;
      if (!cls.schedulePattern.daysOfWeek?.includes(dayOfWeek)) return false;

      const classStart = cls.schedulePattern.startTime;
      const classEnd = cls.schedulePattern.endTime;

      // Check if times overlap
      return classStart <= shiftEnd && classEnd >= shiftStart;
    });
  };

  // Get shifts count for a day
  const getShiftsForDay = (date: Date | null) => {
    if (!date) return [];

    const dateStr = utcToVnDateString(date);
    return shifts.filter((shift) => {
      const shiftDateStr = utcToVnDateString(shift.startTime);
      return shiftDateStr === dateStr;
    });
  };

  // Get shifts for selected date grouped by shift config
  const shiftsForSelectedDay = useMemo(() => {
    if (!branchConfig?.defaultShifts) return [];

    const dateStr = utcToVnDateString(selectedDate);
    const dayShifts = shifts.filter((shift) => {
      const shiftDateStr = utcToVnDateString(shift.startTime);
      return shiftDateStr === dateStr;
    });

    return branchConfig.defaultShifts.map((shiftConfig) => {
      const shiftTime = shiftConfig.startTime;
      const assignedStaff = dayShifts.filter((ws) => {
        const wsTime = utcToVnTimeString(ws.startTime);
        return wsTime === shiftTime;
      });

      return {
        config: shiftConfig,
        assigned: assignedStaff
      };
    });
  }, [selectedDate, shifts, branchConfig]);

  // Check if date is today
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is selected
  const isSelected = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  // Navigate month
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Get shift color
  const getShiftColor = (type: string) => {
    const colors: Record<string, string> = {
      MORNING: 'border-l-amber-500 bg-gradient-to-r from-amber-50 to-orange-50',
      AFTERNOON: 'border-l-orange-500 bg-gradient-to-r from-orange-50 to-amber-50',
      EVENING: 'border-l-orange-400 bg-gradient-to-r from-orange-100 to-amber-100',
      CUSTOM: 'border-l-orange-500 bg-gradient-to-r from-orange-50 to-amber-50'
    };
    return colors[type] || 'border-l-gray-500 bg-gray-50';
  };

  return (
    <div className="mobile-calendar-view h-full flex flex-col bg-white">
      {/* Header */}
      <div className="mobile-calendar-header bg-white border-b px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-gray-900">{t('workshift.calendar')}</h1>
          <div className="flex items-center gap-2">
            {canEdit && onBranchConfig && (
              <Button variant="ghost" size="sm" onClick={onBranchConfig} className="text-orange-600">
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handlePrevMonth} className="p-2">
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <h2 className="text-lg font-semibold text-orange-600">
            {currentMonth.toLocaleDateString(currentLocale, {
              month: 'long',
              year: 'numeric'
            })}
          </h2>

          <Button variant="ghost" size="sm" onClick={handleNextMonth} className="p-2">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="mobile-calendar-grid bg-white px-3 py-2">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const dayShifts = getShiftsForDay(date);
            const hasShifts = dayShifts.length > 0;
            const shiftColors = dayShifts.map((shift) => getShiftStatusColor(shift.status));
            const uniqueColors = Array.from(new Set(shiftColors)).slice(0, 3);

            return (
              <div
                key={`day-${index}`}
                role="button"
                tabIndex={date ? 0 : -1}
                onClick={() => date && onDateChange(date)}
                onKeyDown={(e) => {
                  if (date && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onDateChange(date);
                  }
                }}
                className={cn(
                  'aspect-square p-1 rounded-lg cursor-pointer transition-all',
                  'flex flex-col items-center justify-center relative',
                  date && isToday(date) && 'border-2 border-orange-500',
                  date && isSelected(date) && 'bg-orange-500 text-white shadow-lg',
                  date && !isSelected(date) && 'hover:bg-gray-100',
                  !date && 'cursor-default'
                )}
                aria-label={
                  date ? date.toLocaleDateString(currentLocale, { day: 'numeric', month: 'long' }) : undefined
                }
              >
                {date && (
                  <>
                    <span className={cn('text-sm font-medium', isSelected(date) ? 'text-white' : 'text-gray-900')}>
                      {date.getDate()}
                    </span>

                    {/* Shift indicator dots */}
                    {hasShifts && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {uniqueColors.map((color, i) => (
                          <div
                            key={`dot-${color}-${i}`}
                            className={cn('w-1.5 h-1.5 rounded-full', isSelected(date) ? 'bg-white' : color)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-3">
        <h3 className="font-semibold text-base">
          {selectedDate.toLocaleDateString(currentLocale, {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })}
        </h3>
      </div>

      {/* Shifts List */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        {shiftsForSelectedDay.length > 0 ? (
          <div className="space-y-3">
            {shiftsForSelectedDay.map((shiftGroup, index) => (
              <div
                key={`shift-${shiftGroup.config.type}-${index}`}
                className={cn(
                  'mobile-shift-card rounded-xl border-l-4 shadow-sm',
                  'transition-transform active:scale-98',
                  getShiftColor(shiftGroup.config.type)
                )}
              >
                {/* Shift Header */}
                <div className="p-4 pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {shiftGroup.config.customName ||
                          t(`workshift.shift_${shiftGroup.config.type.toLowerCase()}`) ||
                          shiftGroup.config.type}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {shiftGroup.config.startTime} - {shiftGroup.config.endTime}
                      </p>
                    </div>
                  </div>

                  {/* Show Classes if available, otherwise show Staff */}
                  {shiftGroup.assigned.length > 0 ? (
                    <div className="space-y-2 mt-3">
                      {shiftGroup.assigned.map((shift, shiftIndex) => {
                        const matchingClasses = getClassesForShift(shift);

                        return (
                          <div key={shift._id || `virtual-${shiftIndex}`} className="space-y-2">
                            {/* Show Classes */}
                            {matchingClasses.length > 0 ? (
                              matchingClasses.map((cls) => (
                                <div
                                  key={`${cls._id}-${shiftIndex}`}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    setSelectedClassId(cls._id);
                                    setShowClassDetail(true);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      setSelectedClassId(cls._id);
                                      setShowClassDetail(true);
                                    }
                                  }}
                                  className="bg-blue-50 rounded-lg p-3 flex items-start gap-3 cursor-pointer hover:shadow-md transition-shadow border border-blue-100"
                                  aria-label={`${cls.name}`}
                                >
                                  <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                                    <BookOpen className="w-5 h-5" />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{cls.name}</p>
                                    <p className="text-xs text-gray-600">
                                      {cls.schedulePattern?.startTime} - {cls.schedulePattern?.endTime}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      👥 {cls.activeEnrollment}/{cls.capacity} members
                                    </p>
                                  </div>

                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-blue-100 text-blue-800 border-blue-200 flex-shrink-0"
                                  >
                                    Class
                                  </Badge>
                                </div>
                              ))
                            ) : (
                              // Show Staff if no classes
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => onShiftTap(shift)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onShiftTap(shift);
                                  }
                                }}
                                className="bg-white rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
                                aria-label={`${getStaffName(shift.staffId)} - ${shift.status}`}
                              >
                                <Avatar className="w-10 h-10 flex-shrink-0">
                                  <AvatarImage src={getStaffAvatar(shift.staffId)} />
                                  <AvatarFallback className="bg-orange-500 text-white text-xs">
                                    {getStaffInitials(shift.staffId)}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {getStaffName(shift.staffId)}
                                  </p>
                                  <p className="text-xs text-gray-500">{shift.staffId?.jobTitle || 'Staff'}</p>
                                </div>

                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-xs',
                                    shift.status === 'SCHEDULED' && 'bg-green-100 text-green-800 border-green-200',
                                    shift.status === 'PENDING_TIME_OFF' &&
                                      'bg-yellow-100 text-yellow-800 border-yellow-200',
                                    shift.status === 'CANCELLED' && 'bg-red-100 text-red-800 border-red-200',
                                    shift.status === 'COMPLETED' && 'bg-gray-100 text-gray-800 border-gray-200'
                                  )}
                                >
                                  {getStatusText(shift.status, t)}
                                </Badge>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-3 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
                      <p className="text-xs text-gray-500 font-medium">{t('workshift.day_off')}</p>
                      {canEdit && onCreateShift && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onCreateShift}
                          className="mt-2 text-orange-600 hover:text-orange-700"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          {t('workshift.assign_staff')}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">{t('workshift.no_shifts_today')}</p>
          </div>
        )}
      </div>

      {/* Class Detail Modal */}
      <ClassDetailModal
        isOpen={showClassDetail}
        onClose={() => {
          setShowClassDetail(false);
          setSelectedClassId(null);
        }}
        classId={selectedClassId || undefined}
        selectedDate={selectedDate} // Pass selected date from calendar
      />
    </div>
  );
};

export default MobileCalendarView;
