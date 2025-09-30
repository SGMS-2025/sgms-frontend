import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Calendar as CalendarIcon,
  Search,
  Settings,
  HelpCircle,
  CheckCircle,
  MoreHorizontal,
  Grid3X3,
  Building2,
  Ban
} from 'lucide-react';
import { cn } from '@/utils/utils';
import { useBranch } from '@/contexts/BranchContext';
import { staffApi } from '@/services/api/staffApi';
import { workShiftApi } from '@/services/api/workShiftApi';
import type { Staff } from '@/types/api/Staff';
import type { WorkShift } from '@/types/api/WorkShift';
import type { StaffScheduleCalendarProps } from '@/types/api/StaffSchedule';
import StaffScheduleModal from './StaffScheduleModal';
import WorkShiftDetailModal from './WorkShiftDetailModal';
import CreateDropdown from './CreateDropdown';
import CreateWorkShiftModal from './CreateWorkShiftModal';

const StaffScheduleCalendar: React.FC<StaffScheduleCalendarProps> = ({ selectedStaffId, onStaffSelect }) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'day'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCreateWorkShiftModal, setShowCreateWorkShiftModal] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [loadingWorkShifts, setLoadingWorkShifts] = useState(false);
  const [staffListExpanded, setStaffListExpanded] = useState(false);
  const [visibleStaffCount, setVisibleStaffCount] = useState(5);
  const [selectedWorkShift, setSelectedWorkShift] = useState<WorkShift | null>(null);
  const [showWorkShiftDetail, setShowWorkShiftDetail] = useState(false);
  const [showDisabledShifts, setShowDisabledShifts] = useState(true);
  const { currentBranch } = useBranch();

  // Get current week dates
  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    start.setDate(diff);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const weekDates = getWeekDates(currentDate);
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Get all workshifts that are active during a specific time slot (including ongoing shifts)
  const getActiveShiftsForSlot = (date: Date, hour: number) => {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    const activeShifts = filteredWorkShifts.filter((shift) => {
      // Use local time fields from backend instead of UTC
      const startTimeStr = shift.startTimeLocal || '07:00';
      const endTimeStr = shift.endTimeLocal || '08:00';

      const [startHour, startMin] = startTimeStr.split(':').map(Number);
      const [endHour, endMin] = endTimeStr.split(':').map(Number);

      // Create local time objects for comparison
      const shiftStart = new Date(date);
      shiftStart.setHours(startHour, startMin, 0, 0);

      const shiftEnd = new Date(date);
      shiftEnd.setHours(endHour, endMin, 0, 0);

      // Check if shift overlaps with this time slot
      return shiftStart < slotEnd && shiftEnd > slotStart;
    });

    // Sort by start time to ensure consistent layering
    activeShifts.sort((a, b) => {
      const aStartTime = a.startTimeLocal || '07:00';
      const bStartTime = b.startTimeLocal || '07:00';
      return aStartTime.localeCompare(bStartTime);
    });
    return activeShifts;
  };

  // Get workshifts that START in a specific hour (for rendering)
  const getWorkShiftsForSlot = (date: Date, hour: number) => {
    const filteredShifts = filteredWorkShifts.filter((shift) => {
      // Use backend-provided local time instead of converting UTC
      const startTimeLocalStr = shift.startTimeLocal || '07:00';
      const [shiftStartHour] = startTimeLocalStr.split(':').map(Number);

      // Get the date from startTime (UTC) and convert to local timezone
      const startTimeUTC = new Date(shift.startTime);
      const shiftDate = new Date(startTimeUTC.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));

      // Check if shift starts on the same date and hour
      const isSameDate = shiftDate.toDateString() === date.toDateString();
      const isSameHour = shiftStartHour === hour;

      return isSameDate && isSameHour;
    });

    return filteredShifts;
  };

  // Calculate position and width for overlapping shifts based on active shifts in the time slot
  const calculateShiftPosition = (shift: WorkShift, date: Date, currentHour: number) => {
    // Get all active shifts in this time slot
    const activeShifts = getActiveShiftsForSlot(date, currentHour);

    // Find the index of current shift in active shifts
    const shiftIndex = activeShifts.findIndex((s) => s._id === shift._id);
    const totalActiveShifts = activeShifts.length;

    // Calculate width and position
    const width = totalActiveShifts > 1 ? `${100 / totalActiveShifts}%` : '100%';
    const left = totalActiveShifts > 1 ? `${(shiftIndex * 100) / totalActiveShifts}%` : '0%';

    // Z-index based on start time (earlier shifts have lower z-index, so later shifts appear on top)
    const zIndex = 10 + shiftIndex;

    return {
      width,
      left,
      zIndex
    };
  };

  // Format time for display
  const formatTime = (hour: number, min: number) => {
    const period = hour >= 12 ? 'pm' : 'am';
    let displayHour = hour;
    if (hour === 0) {
      displayHour = 12;
    } else if (hour > 12) {
      displayHour = hour - 12;
    }
    return min === 0 ? `${displayHour}${period}` : `${displayHour}:${min.toString().padStart(2, '0')}${period}`;
  };

  // Render shift card with correct positioning and height
  const renderShiftCard = (shift: WorkShift, _index: number, _shiftsForSlot: WorkShift[], currentHour: number) => {
    const baseStaffColor = getStaffColor(
      typeof shift.staffId === 'string' ? shift.staffId : shift.staffId?._id || 'unknown'
    );

    // Apply different styling for cancelled/disabled shifts
    const staffColor =
      shift.status === 'CANCELLED'
        ? 'bg-gray-400 text-gray-100' // Muted gray for cancelled shifts
        : baseStaffColor;

    const staffName =
      shift.staffId?.userId?.fullName ||
      (shift.staffId?.firstName && shift.staffId?.lastName
        ? `${shift.staffId.firstName} ${shift.staffId.lastName}`
        : 'Unknown Staff');

    // Use backend-provided local time fields instead of converting UTC
    // Backend already provides startTime_local and endTime_local in correct timezone

    // Parse the local time from backend (format: "07:00")
    const startTimeStr = shift.startTimeLocal || '07:00';
    const endTimeStr = shift.endTimeLocal || '08:00';

    const [startHour, startMin] = startTimeStr.split(':').map(Number);
    const [endHour, endMin] = endTimeStr.split(':').map(Number);

    const timeRange = `${formatTime(startHour, startMin)} - ${formatTime(endHour, endMin)}`;

    // Calculate actual height and position based on shift duration using local time
    const startTimeInMinutes = startHour * 60 + startMin;
    const endTimeInMinutes = endHour * 60 + endMin;
    const durationInMinutes = endTimeInMinutes - startTimeInMinutes;
    const durationInHours = durationInMinutes / 60;
    const heightInPixels = durationInHours * 60; // 60px per hour

    // Calculate top offset within the current hour slot
    const topOffsetInPixels = (startMin / 60) * 60;

    // Get current date for this shift to calculate position (use local date)
    // Get the date from startTime (UTC) and convert to local timezone
    const startTimeUTC = new Date(shift.startTime);
    const shiftDate = new Date(startTimeUTC.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const shiftDateOnly = new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate());

    // Calculate position for overlapping shifts
    const position = calculateShiftPosition(shift, shiftDateOnly, currentHour);

    return (
      <button
        key={shift._id}
        className={`absolute ${staffColor} rounded-md shadow-sm hover:shadow-md transition-all cursor-pointer border border-white/20 ${
          shift.status === 'CANCELLED' ? 'opacity-60' : ''
        }`}
        style={{
          top: `${topOffsetInPixels + 2}px`,
          left: position.left,
          width: position.width,
          height: `${heightInPixels - 4}px`,
          zIndex: position.zIndex
        }}
        title={`${staffName} - ${timeRange} - ${shift.status}${shift.status === 'CANCELLED' ? ' (Disabled)' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedWorkShift(shift);
          setShowWorkShiftDetail(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            setSelectedWorkShift(shift);
            setShowWorkShiftDetail(true);
          }
        }}
      >
        <div className="p-1 text-white text-xs h-full flex flex-col justify-center">
          <div
            className={`font-medium text-center truncate leading-tight ${
              shift.status === 'CANCELLED' ? 'line-through' : ''
            }`}
          >
            {staffName}
          </div>
          <div
            className={`text-xs text-center opacity-90 leading-tight ${
              shift.status === 'CANCELLED' ? 'line-through' : ''
            }`}
          >
            {timeRange}
          </div>
          {shift.status === 'CANCELLED' && (
            <div className="text-xs text-center opacity-75 leading-tight">(Disabled)</div>
          )}
        </div>
      </button>
    );
  };

  // Render shifts for a time slot
  const renderShiftsForSlot = (date: Date, slot: { hour: number }) => {
    if (loadingWorkShifts) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
        </div>
      );
    }

    // Only render shifts that START in this time slot
    const shiftsForSlot = getWorkShiftsForSlot(date, slot.hour);
    return shiftsForSlot.map((shift, index) => renderShiftCard(shift, index, shiftsForSlot, slot.hour));
  };

  // Generate color for staff based on their ID - diverse colors like in the image
  const getStaffColor = (staffId: string) => {
    // Handle undefined or null staffId
    if (!staffId || typeof staffId !== 'string') {
      return 'bg-gray-500'; // Default color for invalid staffId
    }

    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-lime-500',
      'bg-amber-500'
    ];
    const hash = staffId.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Fetch staff list
  useEffect(() => {
    const fetchStaff = async () => {
      if (!currentBranch?._id) {
        setStaffList([]);
        setLoadingStaff(false);
        return;
      }

      setLoadingStaff(true);
      const response = await staffApi.getStaffList({
        limit: 100,
        branchId: currentBranch._id
      });

      if (response.success) {
        setStaffList(response.data.staffList);
      } else {
        setStaffList([]);
      }
      setLoadingStaff(false);
    };
    fetchStaff();
  }, [currentBranch?._id]);

  // Common function to fetch workshifts
  const fetchWorkShifts = useCallback(async () => {
    if (!currentBranch?._id) {
      setWorkShifts([]);
      setLoadingWorkShifts(false);
      return;
    }

    setLoadingWorkShifts(true);
    const response = await workShiftApi.getWorkShifts({
      limit: 100,
      branchId: currentBranch._id
    });
    if (response.success) {
      setWorkShifts(response.data.data);
    } else {
      setWorkShifts([]);
    }
    setLoadingWorkShifts(false);
  }, [currentBranch?._id]);

  // Fetch all workshifts on component mount
  useEffect(() => {
    fetchWorkShifts();
  }, [currentBranch?._id, fetchWorkShifts]);

  // Filter workshifts by selected staff (if any) and disabled status
  const filteredWorkShifts = workShifts.filter((shift) => {
    // Filter by selected staff
    if (selectedStaffId && shift.staffId._id !== selectedStaffId) {
      return false;
    }
    // Filter by disabled status
    if (!showDisabledShifts && shift.status === 'CANCELLED') {
      return false;
    }
    return true;
  });

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Refresh workshifts after creating new one
  const refreshWorkShifts = async () => {
    await fetchWorkShifts();
  };

  // Handlers for dropdown actions
  const handleCreateWorkShift = () => {
    setShowCreateWorkShiftModal(true);
  };

  const handleCreateSchedule = () => {
    setShowScheduleModal(true);
  };

  // Generate time slots - only full hours from 6 AM to 9 PM (16 hours)
  const timeSlots = Array.from({ length: 16 }, (_, i) => {
    const hour = 6 + i; // Start from 6 AM to 9 PM

    // Format display hour
    let displayHour;
    if (hour === 0) {
      displayHour = 12;
    } else if (hour > 12) {
      displayHour = hour - 12;
    } else {
      displayHour = hour;
    }

    const period = hour >= 12 ? 'PM' : 'AM';

    return {
      hour,
      minute: 0,
      time: `${hour.toString().padStart(2, '0')}:00`,
      display: `${displayHour} ${period}`,
      isHourMark: true
    };
  });

  // Get current time for indicator
  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();

    // Only show time indicator if current time is within our range (6 AM - 9 PM)
    if (currentHour < 6 || currentHour > 21) {
      return { position: 0, currentDay, isToday: false };
    }

    // Calculate position based on current time (60px per hour slot)
    const hourFromStart = currentHour - 6; // Hours since 6 AM
    const position = hourFromStart * 60 + (currentMinute / 60) * 60; // 60px per hour

    return {
      position,
      currentDay,
      isToday: currentDay === currentDate.getDay()
    };
  };

  const currentTimeInfo = getCurrentTimePosition();

  return (
    <div className="calendar-main-container flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header - Fixed */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-6 w-6 text-orange-600" />
            <h1 className="text-xl font-semibold text-gray-900">{t('workshift.calendar')}</h1>
          </div>

          <CreateDropdown
            onCreateWorkShift={handleCreateWorkShift}
            onCreateSchedule={handleCreateSchedule}
            className="w-full"
          />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Mini Calendar */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">{t('workshift.mini_calendar')}</h3>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setCurrentDate(newDate);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setCurrentDate(newDate);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mini-calendar-wrapper w-full">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setCurrentDate(date);
                  }
                }}
                className="rounded-md border w-full"
              />
            </div>
          </div>

          {/* Staff Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('workshift.search_staff')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">{t('workshift.staff_schedules')}</h3>
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-500">
                  {selectedStaffId ? `${filteredWorkShifts.length} shifts` : `${workShifts.length} total shifts`}
                </div>
                {selectedStaffId && (
                  <button
                    onClick={() => {
                      onStaffSelect?.(undefined);
                    }}
                    className="text-xs text-orange-600 hover:text-orange-800 underline"
                  >
                    {t('common.show_all')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Staff List with Expand/Collapse */}
          <div>
            {loadingStaff ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">{t('common.loading')}</p>
                </div>
              </div>
            ) : (
              <>
                {/* Staff List Header with Expand/Collapse */}
                <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
                  <button
                    onClick={() => setStaffListExpanded(!staffListExpanded)}
                    className="flex items-center justify-between w-full text-left hover:bg-gray-100 rounded px-2 py-1 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700">Staff ({staffList.length})</span>
                    {staffListExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>

                {/* Staff List Content - No individual scroll */}
                {staffListExpanded && (
                  <div className="p-4 space-y-2 bg-white">
                    {(() => {
                      if (!currentBranch) {
                        return (
                          <div className="text-center py-4">
                            <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Select a branch to view staff</p>
                          </div>
                        );
                      }

                      if (staffList.length === 0) {
                        return (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500">{t('workshift.no_staff_found')}</p>
                          </div>
                        );
                      }

                      return (
                        <>
                          {staffList.slice(0, visibleStaffCount).map((staff) => {
                            return (
                              <button
                                key={staff._id}
                                className={cn(
                                  'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors w-full text-left',
                                  selectedStaffId === staff._id
                                    ? 'bg-orange-50 border border-orange-200'
                                    : 'hover:bg-gray-50'
                                )}
                                onClick={() => {
                                  onStaffSelect?.(staff._id);
                                }}
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={`https://ui-avatars.com/api/?name=${staff.userId.fullName}&background=orange&color=fff`}
                                    alt={staff.userId.fullName}
                                  />
                                  <AvatarFallback className="bg-orange-500 text-white text-xs">
                                    {staff.userId.fullName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{staff.userId.fullName}</p>
                                  <p className="text-xs text-gray-500 truncate">{staff.jobTitle}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {(Array.isArray(staff.branchId) && staff.branchId[0]?.branchName) ||
                                    t('common.not_available')}
                                </Badge>
                              </button>
                            );
                          })}

                          {/* Show More/Less Button */}
                          {staffList.length > visibleStaffCount && (
                            <button
                              onClick={() => {
                                const newCount = visibleStaffCount === 5 ? staffList.length : 5;
                                setVisibleStaffCount(newCount);
                              }}
                              className="w-full text-center py-2 text-sm text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                            >
                              {visibleStaffCount === 5
                                ? t('workshift.show_all_staff', { count: staffList.length })
                                : t('common.show_less')}
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-orange-600" />
                <span className="text-lg font-semibold text-gray-900">{t('workshift.calendar')}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleToday}>
                {t('workshift.today')}
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handlePrevWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <HelpCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Select value={viewMode} onValueChange={(value: 'week' | 'month' | 'day') => setViewMode(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">{t('workshift.week')}</SelectItem>
                  <SelectItem value="month">{t('workshift.month')}</SelectItem>
                  <SelectItem value="day">{t('workshift.day')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Toggle for showing disabled shifts */}
              <Button
                variant={showDisabledShifts ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDisabledShifts(!showDisabledShifts)}
                className={showDisabledShifts ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}
                title={showDisabledShifts ? t('workshift.hide_disabled_shifts') : t('workshift.show_disabled_shifts')}
              >
                <Ban className="h-4 w-4 mr-1" />
                {showDisabledShifts ? t('workshift.disabled') : t('workshift.hidden')}
              </Button>
              <Button variant="ghost" size="sm">
                <CalendarIcon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-hidden bg-white">
          {viewMode === 'week' && (
            <div className="h-full flex flex-col">
              {/* Week Header - Fixed */}
              <div className="flex-shrink-0 bg-white border-b-2 border-gray-300 z-10">
                <div className="flex">
                  {/* Time column header */}
                  <div className="w-20 p-4 border-r border-gray-200 bg-gray-50 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-700">GMT+07</span>
                  </div>

                  {/* Days header */}
                  <div className="flex-1">
                    <div className="grid grid-cols-7">
                      {weekDates.map((date) => (
                        <div
                          key={`weekday-${date.getTime()}`}
                          className="p-4 border-r border-gray-200 text-center bg-gray-50"
                        >
                          <div
                            className={cn(
                              'text-sm font-semibold mb-1',
                              isToday(date) ? 'text-orange-600' : 'text-gray-900'
                            )}
                          >
                            {date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                          </div>
                          <div
                            className={cn(
                              'text-lg font-bold',
                              isToday(date)
                                ? 'bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto'
                                : 'text-gray-900'
                            )}
                          >
                            {date.getDate()}
                          </div>
                          <div className="mt-2 flex items-center justify-center">
                            <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                              <span className="text-xs">1</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Slots - Scrollable */}
              <div className="calendar-scrollable-area no-padding flex-1 overflow-y-auto relative">
                <div className="calendar-grid-wrapper">
                  {/* Time sidebar with fixed labels on lines */}
                  <div className="calendar-time-sidebar">
                    {/* Add 6AM label at the very top (0px) */}
                    <div key="time-marker-6" className="time-marker" style={{ top: '0px' }}>
                      6 AM
                    </div>

                    {timeSlots.slice(1).map((slot, index) => {
                      // Position labels exactly on the horizontal border lines
                      // Start from 60px for 7AM, then 120px for 8AM, etc.
                      const topPosition = (index + 1) * 60; // +1 because we skip the first slot (6AM)
                      return (
                        <div
                          key={`time-marker-${slot.hour}`}
                          className="time-marker"
                          style={{ top: `${topPosition}px` }}
                        >
                          {slot.display}
                        </div>
                      );
                    })}
                  </div>

                  {/* Calendar content area */}
                  <div className="calendar-content-area">
                    {!currentBranch ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {t('workshift.no_branch_selected')}
                          </h3>
                          <p className="text-sm text-gray-500">{t('workshift.select_branch_to_view_calendar')}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="calendar-day-grid">
                        {weekDates.map((date) => (
                          <div key={`day-${date.getTime()}`} className="calendar-day-column-new">
                            {/* Current time indicator */}
                            {isToday(date) && (
                              <div className="current-time-line" style={{ top: `${currentTimeInfo.position}px` }} />
                            )}

                            {/* Time cells for this day */}
                            {timeSlots.map((slot) => (
                              <button
                                key={`cell-${date.getTime()}-${slot.hour}`}
                                className="calendar-time-cell"
                                onClick={() => {
                                  const clickedDateTime = new Date(date);
                                  clickedDateTime.setHours(slot.hour, 0, 0, 0);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    const clickedDateTime = new Date(date);
                                    clickedDateTime.setHours(slot.hour, 0, 0, 0);
                                  }
                                }}
                              >
                                {renderShiftsForSlot(date, { hour: slot.hour })}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <StaffScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          selectedStaffId={selectedStaffId}
        />
      )}

      {/* Work Shift Detail Modal */}
      <WorkShiftDetailModal
        isOpen={showWorkShiftDetail}
        onClose={() => {
          setShowWorkShiftDetail(false);
          setSelectedWorkShift(null);
        }}
        workShift={selectedWorkShift}
        onEdit={() => {
          // Edit functionality will be implemented later
        }}
        onUpdate={(updatedWorkShift) => {
          // Update the workshift in the list
          setWorkShifts((prev) => prev.map((shift) => (shift._id === updatedWorkShift._id ? updatedWorkShift : shift)));
          setSelectedWorkShift(updatedWorkShift);
        }}
      />

      {/* Create Work Shift Modal */}
      <CreateWorkShiftModal
        isOpen={showCreateWorkShiftModal}
        onClose={() => setShowCreateWorkShiftModal(false)}
        onSuccess={refreshWorkShifts}
      />
    </div>
  );
};

export default StaffScheduleCalendar;
