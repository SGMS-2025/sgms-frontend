/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ChevronLeft, ChevronRight, Building2, User, X, Check, ChevronsUpDown, HelpCircle } from 'lucide-react';
import { cn } from '@/utils/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useBranch } from '@/contexts/BranchContext';
import { useAuthState } from '@/hooks/useAuth';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { useBranchWorkingConfig } from '@/hooks/useBranchWorkingConfig';
import { useBreakpoint } from '@/hooks/useWindowSize';
import { useDebouncedCallback } from '@/hooks/common/useDebouncedCallback';
import { staffApi } from '@/services/api/staffApi';
import { workShiftApi } from '@/services/api/workShiftApi';
import { useTimeOffList } from '@/hooks/useTimeOff';
import type { Staff } from '@/types/api/Staff';
import type { WorkShift, VirtualWorkShift } from '@/types/api/WorkShift';
import type { StaffScheduleCalendarProps } from '@/types/api/StaffSchedule';
import { sortShiftsByStartTime, getDayOfWeekName, isVirtualWorkShift } from '@/utils/workshiftUtils';
import { createUtcISOFromLocal, utcToVnTimeString, vnTimeToUtcISO } from '@/utils/datetime';
import StaffScheduleModal from './StaffScheduleModal';
import WorkShiftDetailModalWithTimeOff from './WorkShiftDetailModalWithTimeOff';
import CreateDropdown from './CreateDropdown';
import CreateWorkShiftModal from './CreateWorkShiftModal';
import BranchWorkingConfigModal from './BranchWorkingConfigModal';
import MobileCalendarView from './mobile/MobileCalendarView';
import { ClassesListTab } from './tabs/ClassesListTab';
import { useClassList } from '@/hooks/useClassList';
import { scheduleApi } from '@/services/api/scheduleApi';
import type { Schedule } from '@/types/api/Schedule';
import { useCalendarTour } from '@/hooks/useCalendarTour';
import { ClassDetailModal } from './modals/ClassDetailModal';

// Custom type for realtime notification event
interface RealtimeNotificationEvent extends Event {
  detail: {
    type?: string;
    category?: string;
    [key: string]: unknown;
  };
}

// Helper functions to reduce code duplication
const getStaffId = (staffId: string | { _id: string } | undefined): string | undefined => {
  if (!staffId) return undefined;
  return typeof staffId === 'object' ? staffId._id : staffId;
};

const formatDateString = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const utcToVnDateString = (utcDate: Date | string): string => {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const vnDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  return formatDateString(vnDate);
};

const getAvatarUrl = (name: string | undefined): string | undefined => {
  return name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=orange&color=fff` : undefined;
};

const getStaffName = (
  staff: { userId?: { fullName?: string }; firstName?: string; lastName?: string } | undefined
): string => {
  if (!staff) return 'Unknown';
  if (staff.userId?.fullName) return staff.userId.fullName;
  if (staff.firstName && staff.lastName) return `${staff.firstName} ${staff.lastName}`;
  return 'Unknown';
};

const getBranchIds = (branchId: unknown): string[] => {
  if (!branchId) return [];
  if (Array.isArray(branchId)) {
    return branchId
      .map((b) => {
        if (typeof b === 'string') return b;
        if (typeof b === 'object' && b !== null && '_id' in b) {
          return b._id || '';
        }
        return '';
      })
      .filter((id) => id !== '');
  }
  return [];
};

const StaffScheduleCalendar: React.FC<StaffScheduleCalendarProps> = ({ selectedStaffId, onStaffSelect, userRole }) => {
  const { t } = useTranslation();
  const { isMobile, width } = useBreakpoint(); // Detect mobile device
  const { startCalendarTour } = useCalendarTour();

  // Debug: Log breakpoint detection
  console.log('[StaffScheduleCalendar] isMobile:', isMobile, 'width:', width);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCreateWorkShiftModal, setShowCreateWorkShiftModal] = useState(false);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [loadingWorkShifts, setLoadingWorkShifts] = useState(false);
  const [selectedWorkShift, setSelectedWorkShift] = useState<WorkShift | null>(null);
  const [showWorkShiftDetail, setShowWorkShiftDetail] = useState(false);
  const [showDisabledShifts] = useState(true);
  const showTimeOffs = true; // Always show time offs
  const [showBranchConfig, setShowBranchConfig] = useState(false);
  // State for showing all staff in a shift (for Owner/Manager)
  const [showStaffListModal, setShowStaffListModal] = useState(false);
  const [staffListModalTab, setStaffListModalTab] = useState<'staff' | 'classes'>('staff');
  // State for staff search popover
  const [staffSearchOpen, setStaffSearchOpen] = useState(false);
  const [staffSearchValue, setStaffSearchValue] = useState('');
  // State for slot click loading - track which cell is loading
  const [loadingCellKey, setLoadingCellKey] = useState<string | null>(null);
  const [selectedShiftData, setSelectedShiftData] = useState<{
    shifts: (WorkShift | VirtualWorkShift)[];
    date: Date;
    slot: { type?: string; startTime?: string; endTime?: string; hour?: number; display?: string };
    timeRange: string;
  } | null>(null);
  // State for class detail modal
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showClassDetail, setShowClassDetail] = useState(false);
  const { currentBranch } = useBranch();
  const { currentStaff } = useCurrentUserStaff();
  const { user } = useAuthState();

  // State for classes and schedules in the Classes tab
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState<Error | null>(null);

  // Fetch branch working config
  const { config: branchConfig, refetch: refetchBranchConfig } = useBranchWorkingConfig(currentBranch?._id);

  // Fetch classes for the branch
  const classesResult = useClassList({
    branchId: currentBranch?._id,
    status: 'ACTIVE'
  });

  const classes = classesResult?.classes || [];
  const classesLoading = classesResult?.loading || false;
  const classesError = classesResult?.error ? new Error(classesResult.error) : null;

  // Fetch PT 1-1 schedules when modal is open and we have selected shift data
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!showStaffListModal || !selectedShiftData || !currentBranch) {
        setSchedules([]);
        setSchedulesError(null);
        return;
      }

      setSchedulesLoading(true);
      setSchedulesError(null);

      try {
        // Format date for API (YYYY-MM-DD)
        const dateStr = formatDateString(selectedShiftData.date);
        const dateFrom = `${dateStr}T00:00:00.000Z`;
        const dateTo = `${dateStr}T23:59:59.999Z`;

        const response = await scheduleApi.getSchedulesByBranch(currentBranch._id, {
          type: 'PERSONAL_TRAINING',
          dateFrom,
          dateTo,
          limit: 100,
          page: 1
        });

        if (response.success) {
          const schedulesData = response.data?.data || response.data?.schedules || [];
          setSchedules(schedulesData);
        } else {
          setSchedulesError(new Error(response.message || 'Failed to fetch schedules'));
          setSchedules([]);
        }
      } catch (err) {
        setSchedulesError(err instanceof Error ? err : new Error('Failed to fetch schedules'));
        setSchedules([]);
      } finally {
        setSchedulesLoading(false);
      }
    };

    fetchSchedules();
  }, [showStaffListModal, selectedShiftData, currentBranch]);

  // Check if current user can view all staff schedules in the branch
  const canViewAllStaffSchedules = useMemo(() => {
    // Owner can always view all staff schedules
    if (user?.role === 'OWNER' || user?.role === 'ADMIN') {
      return true;
    }

    // If user is not a staff member, they cannot view schedules
    if (!currentStaff || !user) {
      return false;
    }

    // Check if staff is Manager and assigned to manage the current branch
    if (currentStaff.jobTitle === 'Manager' && currentBranch) {
      // Check if current user is in the managerId array of the branch
      const branchManagerIds = Array.isArray(currentBranch.managerId)
        ? currentBranch.managerId.map((m) => m._id || m)
        : currentBranch.managerId
          ? [currentBranch.managerId._id || currentBranch.managerId]
          : [];

      // Check if current user ID is in the manager list
      const isManagerOfBranch = branchManagerIds.some((managerId) => {
        const managerIdStr = typeof managerId === 'string' ? managerId : managerId._id || '';
        return managerIdStr === user._id;
      });

      return isManagerOfBranch;
    }

    // Regular staff (PT, Technician) can only view their own schedule
    return false;
  }, [user, currentStaff, currentBranch]);

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

  // Memoize visibleStaffList separately to avoid recalculation
  const visibleStaffList = useMemo(() => {
    if (!canViewAllStaffSchedules) {
      return currentStaff ? [currentStaff] : [];
    }
    if (!currentBranch || !staffList.length) {
      return [];
    }
    return staffList.filter((staff) => {
      const staffBranchIds = getBranchIds(staff.branchId);
      return staffBranchIds.includes(currentBranch._id);
    });
  }, [staffList, currentBranch, canViewAllStaffSchedules, currentStaff]);

  // Generate virtual workshifts from branchWorkingConfig
  // Logic: Tạo virtual shift cho TẤT CẢ shifts trong branch config cho mỗi staff
  // OPTIMIZED: Use Map for O(1) lookup instead of O(n) find()
  const generateVirtualWorkShifts = useMemo(() => {
    // Early return if loading or missing dependencies
    if (loadingWorkShifts || !branchConfig || !currentBranch || !visibleStaffList.length) {
      return [];
    }

    const virtualWorkShifts: VirtualWorkShift[] = [];
    const weekDates = getWeekDates(currentDate);

    // Map StaffJobTitle to role config role values
    const jobTitleToRole: Record<string, 'PT' | 'TECHNICIAN' | 'MANAGER'> = {
      Manager: 'MANAGER',
      'Personal Trainer': 'PT',
      Technician: 'TECHNICIAN'
    };

    // OPTIMIZATION: Create a Map for O(1) lookup of existing shifts
    // Key format: `${staffId}-${dateStr}-${startTime}`
    // This reduces complexity from O(n²) to O(n)
    const existingShiftsMap = new Map<string, boolean>();
    workShifts.forEach((ws) => {
      const wsStaffId = getStaffId(ws.staffId);
      if (!wsStaffId) return;

      const realDateStr = utcToVnDateString(ws.startTime);
      const realVnTime = utcToVnTimeString(ws.startTime);

      if (realVnTime) {
        const key = `${wsStaffId}-${realDateStr}-${realVnTime}`;
        existingShiftsMap.set(key, true);
      }
    });

    // Group visible staff by role for processing
    const staffByRole = new Map<string, Staff[]>();
    visibleStaffList.forEach((staff) => {
      const staffRole = jobTitleToRole[staff.jobTitle] || 'OTHER';
      if (!staffByRole.has(staffRole)) {
        staffByRole.set(staffRole, []);
      }
      staffByRole.get(staffRole)!.push(staff);
    });

    // Process each role group
    staffByRole.forEach((roleStaffList, role) => {
      // Get role config
      const roleConfig = role !== 'OTHER' ? branchConfig.roleConfigs?.find((rc) => rc.role === role) : null;

      if (role !== 'OTHER' && !roleConfig) {
        return;
      }

      const workingDays =
        roleConfig?.workingDays || (role === 'OTHER' ? branchConfig.defaultWorkingDays || [1, 2, 3, 4, 5, 6] : []);
      const allowedShiftTypes =
        roleConfig?.shifts || (role === 'OTHER' ? branchConfig.defaultShifts?.map((s) => s.type) || [] : []);

      if (!workingDays.length || !allowedShiftTypes.length) {
        return;
      }

      // Get available shifts for this role (sorted by startTime)
      const availableShifts = sortShiftsByStartTime(
        (branchConfig.defaultShifts || []).filter((shift) => allowedShiftTypes.includes(shift.type))
      );

      if (availableShifts.length === 0) return;

      weekDates.forEach((date) => {
        const dayOfWeek = date.getDay();
        if (!workingDays.includes(dayOfWeek)) return;

        roleStaffList.forEach((staff) => {
          // Tạo virtual shift cho MỖI shift trong availableShifts
          availableShifts.forEach((shiftConfig) => {
            const virtualDateStr = formatDateString(date);

            // OPTIMIZATION: Use Map lookup (O(1)) instead of find() (O(n))
            const lookupKey = `${staff._id}-${virtualDateStr}-${shiftConfig.startTime}`;
            if (existingShiftsMap.has(lookupKey)) {
              // Real shift exists for this staff/date/time - don't create virtual shift
              return;
            }
            const shiftStartUTC = vnTimeToUtcISO(virtualDateStr, shiftConfig.startTime);
            const shiftEndUTC = vnTimeToUtcISO(virtualDateStr, shiftConfig.endTime);

            // Create Date objects from UTC strings for formatting
            const shiftStart = new Date(shiftStartUTC);
            const shiftEnd = new Date(shiftEndUTC);

            const dayOfTheWeek = getDayOfWeekName(date);

            const virtualShift: VirtualWorkShift = {
              _id: `virtual-${staff._id}-${date.getTime()}-${shiftConfig.type}`,
              staffId: {
                _id: staff._id,
                jobTitle: staff.jobTitle,
                salary: staff.salary || 0,
                status: staff.status || 'ACTIVE',
                userId: {
                  _id: staff.userId?._id || '',
                  fullName: getStaffName(staff),
                  email: staff.userId?.email || '',
                  phoneNumber: staff.userId?.phoneNumber
                }
              },
              branchId: {
                _id: currentBranch._id,
                branchName: currentBranch.branchName || '',
                location: currentBranch.location || '',
                timezone: 'Asia/Ho_Chi_Minh'
              },
              dayOfTheWeek,
              startTime: shiftStartUTC, // UTC ISO string (properly converted from VN time)
              endTime: shiftEndUTC, // UTC ISO string (properly converted from VN time)
              status: 'SCHEDULED' as const,
              startTimeLocal: shiftConfig.startTime, // VN time from config (e.g., "05:00")
              endTimeLocal: shiftConfig.endTime, // VN time from config (e.g., "10:00")
              startTimeFmt: shiftStart.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
              endTimeFmt: shiftEnd.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
              branchTz: 'Asia/Ho_Chi_Minh',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isVirtual: true
            };

            virtualWorkShifts.push(virtualShift);
          });
        });
      });
    });

    return virtualWorkShifts;
  }, [branchConfig, currentBranch, visibleStaffList, workShifts, currentDate, loadingWorkShifts]);

  // Time Off functionality
  const { timeOffs, refetch: refetchTimeOffs } = useTimeOffList({
    staffId: selectedStaffId || currentStaff?._id
  });

  const weekDates = getWeekDates(currentDate);

  // Filter weekDates based on branch config defaultWorkingDays
  const filteredWeekDates = useMemo(() => {
    if (!branchConfig?.defaultWorkingDays || branchConfig.defaultWorkingDays.length === 0) {
      return weekDates; // Show all days if no config
    }
    return weekDates.filter((date) => {
      const dayOfWeek = date.getDay();
      return branchConfig.defaultWorkingDays?.includes(dayOfWeek);
    });
  }, [weekDates, branchConfig?.defaultWorkingDays]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Get time off requests for a specific date
  const getTimeOffForDate = (date: Date) => {
    if (!showTimeOffs) return [];

    return timeOffs.filter((timeOff) => {
      const startDate = new Date(timeOff.startDate);
      const endDate = new Date(timeOff.endDate);
      return date >= startDate && date <= endDate;
    });
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

  // Render time off indicator for a date
  const renderTimeOffIndicator = (date: Date) => {
    const timeOffsForDate = getTimeOffForDate(date);
    if (timeOffsForDate.length === 0) return null;

    const timeOff = timeOffsForDate[0]; // Show first time off for the date
    const status = timeOff.status;

    // Different colors for different statuses
    const statusColors = {
      PENDING: 'bg-yellow-500',
      APPROVED: 'bg-green-500',
      REJECTED: 'bg-red-500',
      CANCELLED: 'bg-gray-500'
    };

    const statusColor = statusColors[status] || 'bg-purple-500';

    return (
      <div
        className={`absolute top-1 right-1 w-3 h-3 rounded-full ${statusColor} border border-white shadow-sm`}
        title={`Time Off: ${timeOff.type} (${status})`}
      />
    );
  };

  // Render shifts for a time slot - Group all shifts together and show staff avatars
  const renderShiftsForSlot = (
    date: Date,
    slot: { type?: string; startTime?: string; endTime?: string; hour?: number; display?: string }
  ) => {
    // Generate unique key for this cell
    const cellKey = `${date.getTime()}-${slot.type || slot.startTime}`;
    const isLoadingThisCell = loadingCellKey === cellKey;

    if (loadingWorkShifts) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
        </div>
      );
    }

    // Get all shifts that START in this time slot
    const shiftsForSlot = getWorkShiftsForShift(date, slot);

    const dateStr = formatDateString(date);
    const shiftsOnSameDate = filteredWorkShifts.filter((workShift) => {
      // OPTIMIZATION: Use pre-computed date string if available
      const shiftDateStr = (workShift as any)._vnDateStr || utcToVnDateString(workShift.startTime);
      return shiftDateStr === dateStr;
    });

    let hasPendingTimeOffOnDate = false;
    const pendingTimeOffShiftsOnDate = shiftsOnSameDate.filter((s) => {
      const status = String(s.status || '').toUpperCase();
      return status === 'PENDING_TIME_OFF';
    });

    if (pendingTimeOffShiftsOnDate.length > 0 && shiftsForSlot.length > 0) {
      // Check if any staff in this slot has a PENDING_TIME_OFF shift on the same date
      const staffIdsInSlot = new Set(shiftsForSlot.map((s) => getStaffId(s.staffId)).filter(Boolean));

      hasPendingTimeOffOnDate = pendingTimeOffShiftsOnDate.some((pendingShift) => {
        const pendingStaffId = getStaffId(pendingShift.staffId);

        if (!staffIdsInSlot.has(pendingStaffId)) {
          return false; // Different staff, skip
        }

        if (slot.startTime && slot.endTime && pendingShift.startTimeLocal && pendingShift.endTimeLocal) {
          const [slotStartHour, slotStartMin] = slot.startTime.split(':').map(Number);
          const [slotEndHour, slotEndMin] = slot.endTime.split(':').map(Number);
          const slotStartMinutes = slotStartHour * 60 + slotStartMin;
          const slotEndMinutes = slotEndHour * 60 + slotEndMin;

          const [shiftStartHour, shiftStartMin] = pendingShift.startTimeLocal.split(':').map(Number);
          const [shiftEndHour, shiftEndMin] = pendingShift.endTimeLocal.split(':').map(Number);
          const shiftStartMinutes = shiftStartHour * 60 + shiftStartMin;
          const shiftEndMinutes = shiftEndHour * 60 + shiftEndMin;

          return shiftStartMinutes < slotEndMinutes && shiftEndMinutes > slotStartMinutes;
        }

        return false;
      });
    }

    // Filter out cancelled shifts for avatar display
    const activeShifts = shiftsForSlot.filter((s) => s.status !== 'CANCELLED');
    const hasCancelled = shiftsForSlot.some((s) => s.status === 'CANCELLED');
    const allCancelled = shiftsForSlot.length > 0 && shiftsForSlot.every((s) => s.status === 'CANCELLED');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const shiftDate = new Date(date);
    shiftDate.setHours(0, 0, 0, 0);
    const isPastDate = shiftDate < today;

    // Collect unique staff from active shifts
    const uniqueStaff = new Map<
      string,
      {
        id: string;
        name: string;
        avatarUrl?: string;
        email?: string;
      }
    >();

    activeShifts.forEach((shift) => {
      const staffId = getStaffId(shift.staffId);
      if (staffId && !uniqueStaff.has(staffId)) {
        const staffName = getStaffName(shift.staffId);
        const email = shift.staffId?.userId?.email || shift.staffId?.email;
        const avatarUrl = getAvatarUrl(staffName);

        uniqueStaff.set(staffId, {
          id: staffId,
          name: staffName,
          avatarUrl,
          email
        });
      }
    });

    const staffList = Array.from(uniqueStaff.values());
    const staffCount = staffList.length;
    const maxVisibleAvatars = 1; // Show max 2 avatars, collapse if 3 or more
    const visibleStaff = staffList.slice(0, maxVisibleAvatars);
    const remainingCount = Math.max(0, staffCount - maxVisibleAvatars);

    const firstShift = shiftsForSlot[0];
    const startTimeStr = firstShift?.startTimeLocal || slot.startTime || '07:00';
    const endTimeStr = firstShift?.endTimeLocal || slot.endTime || '08:00';
    const [startHour, startMin] = startTimeStr.split(':').map(Number);
    const [endHour, endMin] = endTimeStr.split(':').map(Number);
    const timeRange = `${formatTime(startHour, startMin)} - ${formatTime(endHour, endMin)}`;

    const hasPendingTimeOff =
      shiftsForSlot.some((s) => {
        const status = String(s.status || '').toUpperCase();
        const isPending = status === 'PENDING_TIME_OFF';
        return isPending;
      }) || hasPendingTimeOffOnDate;

    // Show loading spinner in this cell if it's being processed
    if (isLoadingThisCell) {
      return (
        <div
          className="absolute top-0 left-0 w-full h-full rounded-lg bg-white/95 backdrop-blur-sm flex items-center justify-center z-10 shadow-lg border-2 border-orange-300"
          style={{
            animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div
                className="rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600"
                style={{
                  animation: 'spin 0.8s linear infinite'
                }}
              ></div>
              <div
                className="absolute inset-0 h-16 w-16 rounded-full bg-orange-200"
                style={{
                  animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                  opacity: 0.3
                }}
              ></div>
            </div>
            <p className="text-sm font-bold text-gray-800">Đang tải...</p>
          </div>
          <style>{`
            @keyframes fadeInScale {
              from {
                opacity: 0;
                transform: scale(0.9);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes ping {
              75%, 100% {
                transform: scale(2);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      );
    }

    if (shiftsForSlot.length === 0) {
      return (
        <button
          type="button"
          className="absolute top-0 left-0 w-full h-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 opacity-75 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="p-3 h-full flex flex-col items-center justify-center">
            <div className="text-xs text-gray-500 font-medium mb-1">{timeRange}</div>
            <div className="text-xs text-gray-400">{t('workshift.day_off')}</div>
          </div>
        </button>
      );
    }

    const shouldHideCancelledForAllStaff = canViewAllStaffSchedules && selectedStaffId === undefined;
    if (allCancelled && !shouldHideCancelledForAllStaff) {
      return (
        <div className="absolute top-0 left-0 w-full h-full rounded-lg bg-red-100 border-l-4 border-red-500 opacity-90">
          <div className="p-3 h-full flex flex-col items-center justify-center">
            <div className="text-xs text-gray-500 font-medium line-through mb-1">{timeRange}</div>
            <div className="text-xs text-gray-400">{t('timeoff.status.cancelled') || 'Cancelled'}</div>
          </div>
        </div>
      );
    }

    // Render aggregated shift card with avatars
    const shouldHideCancelledColor = canViewAllStaffSchedules && selectedStaffId === undefined;
    let cardClassName =
      'absolute top-0 left-0 w-full h-full rounded-lg shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer text-left ';
    if (hasCancelled && !shouldHideCancelledColor) {
      // Show red for cancelled shifts (Staff always, Owner/Manager only when viewing single staff)
      cardClassName += 'bg-red-50 border-l-4 border-red-900';
    } else if (isPastDate) {
      cardClassName += 'bg-gradient-to-br from-gray-50 to-gray-300 border-l-4 border-gray-300';
    } else if (hasPendingTimeOff) {
      cardClassName += 'bg-yellow-50 border-l-4 border-yellow-500';
    } else {
      cardClassName += 'bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500';
    }

    const shiftButton = (
      <button
        type="button"
        className={cardClassName}
        style={{
          willChange: loadingCellKey ? 'auto' : 'transform',
          transition: 'transform 0.1s ease-out',
          cursor: loadingCellKey ? 'wait' : 'pointer'
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();

          // Prevent multiple clicks
          if (loadingCellKey) return;

          // Use async handler to prevent UI freeze
          handleSlotClick(shiftsForSlot, date, slot, timeRange, activeShifts, staffCount, cellKey);
        }}
        disabled={!!loadingCellKey}
        title={`${staffCount} staff${staffCount !== 1 ? 's' : ''} - ${timeRange}${hasCancelled ? ' (Some shifts cancelled)' : isPastDate ? ' (Past)' : hasPendingTimeOff ? ' (Pending Time Off)' : ''}`}
      >
        <div className="p-3 h-full flex flex-col relative">
          {/* Time Range - Top */}
          <div className={`text-xs font-medium text-left mb-2 ${isPastDate ? 'text-gray-600' : 'text-gray-900'}`}>
            {timeRange}
          </div>

          {/* Staff Count - Bottom Left with padding to avoid overlap */}
          {staffCount > 0 && (
            <div
              className={`absolute bottom-3 left-3 text-xs font-semibold ${isPastDate ? 'text-gray-700' : 'text-black'}`}
              style={{ zIndex: 10 }}
            >
              {staffCount} staff{staffCount !== 1 ? 's' : ''}
            </div>
          )}

          {/* Staff Avatars - Bottom Right */}
          {staffCount > 0 && (
            <div
              className="absolute bottom-3 right-3 flex items-center justify-end flex-wrap-reverse gap-1.5"
              style={{ maxWidth: 'calc(100% - 80px)' }}
            >
              {visibleStaff.map((staff, index) => (
                <div
                  key={staff.id}
                  className="relative flex-shrink-0"
                  style={{
                    marginRight: index > 0 ? '-6px' : '0',
                    zIndex: visibleStaff.length - index
                  }}
                >
                  <Avatar className="h-8 w-8 border-2 border-white shadow-sm ring-1 ring-gray-200">
                    <AvatarImage src={staff.avatarUrl} alt={staff.name} className="object-cover" />
                    <AvatarFallback className="bg-orange-500 text-white text-xs font-semibold">
                      {staff.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              ))}
              {remainingCount > 0 && (
                <div
                  className="h-8 w-8 rounded-full bg-gray-400 border-2 border-white shadow-sm ring-1 ring-gray-200 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                  style={{ marginRight: '-6px', zIndex: 1 }}
                >
                  +{remainingCount}
                </div>
              )}
            </div>
          )}
        </div>
      </button>
    );

    // Wrap with HoverCard to show staff list on hover (only if there are staff)
    if (staffCount > 0) {
      return (
        <HoverCard openDelay={300} closeDelay={100}>
          <HoverCardTrigger asChild>{shiftButton}</HoverCardTrigger>
          <HoverCardContent className="w-80" align="start" side="right">
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-2">
                <User className="h-4 w-4 text-orange-600" />
                <h4 className="font-semibold text-sm">
                  {t('workshift.staff_in_shift') || 'Danh sách nhân viên có trong ca'}
                </h4>
              </div>
              <div
                className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#9ca3af #f3f4f6'
                }}
              >
                {staffList.map((staff) => {
                  // Get job title from shift
                  const shiftForStaff = shiftsForSlot.find((s) => {
                    const staffId = getStaffId(s.staffId);
                    return staffId === staff.id;
                  });
                  const jobTitle = shiftForStaff?.staffId?.jobTitle || 'Unknown';

                  return (
                    <div
                      key={staff.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Avatar className="h-10 w-10 border-2 border-orange-200">
                        <AvatarImage src={staff.avatarUrl} alt={staff.name} />
                        <AvatarFallback className="bg-orange-500 text-white font-semibold">
                          {staff.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{staff.name}</div>
                        <div className="text-xs text-gray-500 truncate">{jobTitle}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-gray-500 text-center pt-2 border-t">
                {t('workshift.total') || 'Tổng'}: {staffCount} {t('workshift.staff') || 'nhân viên'}
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    }

    return shiftButton;
  };

  // Fetch staff list for generating virtual workshifts
  useEffect(() => {
    const fetchStaff = async () => {
      if (!currentBranch?._id) {
        setStaffList([]);
        return;
      }

      const response = await staffApi.getStaffList({
        limit: 100,
        branchId: currentBranch._id
      });

      if (response.success) {
        setStaffList(response.data.staffList);
        return;
      }

      if (!canViewAllStaffSchedules && currentStaff) {
        setStaffList([currentStaff]);
      } else {
        setStaffList([]);
      }
    };
    fetchStaff();
  }, [currentBranch?._id, canViewAllStaffSchedules, currentStaff]);

  // Common function to fetch workshifts - OPTIMIZED: Only fetch current week
  const fetchWorkShifts = useCallback(async () => {
    if (!currentBranch?._id) {
      setWorkShifts([]);
      setLoadingWorkShifts(false);
      return;
    }

    setLoadingWorkShifts(true);

    // Calculate week date range - only fetch current week
    const weekDates = getWeekDates(currentDate);
    const startDate = new Date(weekDates[0]);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(weekDates[6]);
    endDate.setHours(23, 59, 59, 999);

    // Format dates for API (ISO string)
    const startDateISO = startDate.toISOString();
    const endDateISO = endDate.toISOString();

    const response = await workShiftApi.getWorkShifts({
      branchId: currentBranch._id,
      startDate: startDateISO,
      endDate: endDateISO
    });

    if (response.success) {
      setWorkShifts(response.data.data);
    } else {
      setWorkShifts([]);
    }
    setLoadingWorkShifts(false);
  }, [currentBranch?._id, currentDate]);

  // Fetch workshifts when branch or week changes
  useEffect(() => {
    fetchWorkShifts();
  }, [currentBranch?._id, currentDate, fetchWorkShifts]);

  // Debounced fetch functions to prevent API spam from multiple notifications
  const debouncedFetchWorkShifts = useDebouncedCallback(fetchWorkShifts, 500);
  const debouncedRefetchTimeOffs = useDebouncedCallback(refetchTimeOffs, 500);

  // Memoize the notification handler to prevent stale closures
  const handleRealtimeNotification = useCallback(
    (event: Event) => {
      const customEvent = event as RealtimeNotificationEvent;
      const notification = customEvent.detail;

      const isWorkShiftNotification =
        notification.type?.includes('WORKSHIFT') ||
        notification.type?.includes('notification:workshift') ||
        notification.category === 'workshift' ||
        notification.category === 'schedule'; // Backend uses "schedule" for workshift notifications

      const isTimeOffNotification =
        notification.type?.includes('TIMEOFF') ||
        notification.type?.includes('notification:timeoff') ||
        notification.category === 'timeoff';

      const isRescheduleNotification =
        notification.type?.includes('RESCHEDULE') ||
        notification.type?.includes('notification:reschedule') ||
        notification.category === 'reschedule';

      if (isWorkShiftNotification) {
        // Use debounced version to prevent spam
        debouncedFetchWorkShifts();
      }

      if (isTimeOffNotification) {
        // When time off is approved/rejected/cancelled, workshifts may be affected
        debouncedFetchWorkShifts();
        debouncedRefetchTimeOffs();
      }

      if (isRescheduleNotification) {
        // When reschedule is approved/rejected/cancelled, workshifts may be affected
        debouncedFetchWorkShifts();
      }
    },
    [debouncedFetchWorkShifts, debouncedRefetchTimeOffs]
  );

  // Listen for real-time notifications and refresh data
  useEffect(() => {
    // Listen for real-time notifications from SocketContext
    globalThis.addEventListener('realtime-notification', handleRealtimeNotification);

    return () => {
      globalThis.removeEventListener('realtime-notification', handleRealtimeNotification);
    };
  }, [handleRealtimeNotification]);

  // Update selectedWorkShift when workShifts changes (e.g., after refetch)
  useEffect(() => {
    const currentSelected = selectedWorkShift;
    if (currentSelected) {
      // If current selected is not virtual, just update by ID
      if (!isVirtualWorkShift(currentSelected)) {
        const updatedShift = workShifts.find((shift) => shift._id === currentSelected._id);
        if (updatedShift && JSON.stringify(updatedShift) !== JSON.stringify(currentSelected)) {
          setSelectedWorkShift(updatedShift);
        }
      } else {
        const currentStaffId = getStaffId(currentSelected.staffId);

        const virtualStartDate = new Date(currentSelected.startTime);
        virtualStartDate.setHours(0, 0, 0, 0); // Normalize to midnight
        const virtualDateStr = formatDateString(virtualStartDate);

        const virtualStartTimeUTC = createUtcISOFromLocal(virtualDateStr, currentSelected.startTimeLocal);
        const virtualEndTimeUTC = createUtcISOFromLocal(virtualDateStr, currentSelected.endTimeLocal);
        const virtualStartTimeMs = new Date(virtualStartTimeUTC).getTime();
        const virtualEndTimeMs = new Date(virtualEndTimeUTC).getTime();

        const matchingShift = workShifts.find((shift) => {
          const shiftStaffId = getStaffId(shift.staffId);
          const shiftStartTime = new Date(shift.startTime).getTime();
          const shiftEndTime = new Date(shift.endTime).getTime();

          return (
            shiftStaffId === currentStaffId &&
            Math.abs(shiftStartTime - virtualStartTimeMs) < 60000 && // Within 1 minute
            Math.abs(shiftEndTime - virtualEndTimeMs) < 60000 // Within 1 minute
          );
        });

        if (matchingShift) {
          setSelectedWorkShift(matchingShift);
        }
      }
    }
  }, [workShifts]);

  // OPTIMIZATION 1: Pre-compute enhanced shifts with converted dates/times
  // This avoids repeated date conversions in every filter operation
  const enhancedWorkShifts = useMemo(() => {
    return workShifts.map((shift) => {
      const vnDateStr = utcToVnDateString(shift.startTime);
      const vnTimeStr = utcToVnTimeString(shift.startTime);

      return {
        ...shift,
        _vnDateStr: vnDateStr,
        _vnTimeStr: vnTimeStr,
        _dateTimestamp: new Date(vnDateStr).getTime()
      };
    });
  }, [workShifts]);

  // Create workShifts lookup map for O(1) access in click handlers
  const workShiftsMap = useMemo(() => {
    const map = new Map<string, WorkShift>();
    workShifts.forEach((shift) => {
      map.set(shift._id, shift);
    });
    return map;
  }, [workShifts]);

  // Create workShifts by staff-date-time lookup for fast matching
  const workShiftsByKeyMap = useMemo(() => {
    const map = new Map<string, WorkShift>();
    workShifts.forEach((ws) => {
      const wsStaffId = getStaffId(ws.staffId);
      if (!wsStaffId) return;

      const wsDate = new Date(ws.startTime);
      const wsDateInLocal = new Date(wsDate.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
      const wsDateStr = `${wsDateInLocal.getFullYear()}-${String(wsDateInLocal.getMonth() + 1).padStart(2, '0')}-${String(wsDateInLocal.getDate()).padStart(2, '0')}`;
      const key = `${wsStaffId}-${wsDateStr}-${ws.startTimeLocal}`;
      map.set(key, ws);
    });
    return map;
  }, [workShifts]);

  // Note: Removed shiftsByDateTimeMap optimization as it was breaking data flow
  // Keeping simpler approach for now to ensure correctness

  const allWorkShifts = useMemo(() => {
    // Early return if loading - return existing workShifts to avoid blocking UI
    if (loadingWorkShifts) {
      return workShifts;
    }

    // OPTIMIZATION: Create Map for O(1) lookup instead of O(n) some()
    // This reduces complexity from O(n²) to O(n)
    const realShiftsMap = new Map<string, WorkShift>();
    workShifts.forEach((realShift) => {
      const realStaffId = getStaffId(realShift.staffId);
      if (!realStaffId) return;

      const realDateStr = utcToVnDateString(realShift.startTime);
      const realVnTime = utcToVnTimeString(realShift.startTime);

      if (realVnTime) {
        const key = `${realStaffId}-${realDateStr}-${realVnTime}`;
        realShiftsMap.set(key, realShift);
      }
    });

    const virtualShifts = generateVirtualWorkShifts.filter((shift) => {
      // Filter by selected staff if needed
      if (selectedStaffId && shift.staffId?._id !== selectedStaffId) {
        return false;
      }

      const virtualStaffId = shift.staffId?._id;
      if (!virtualStaffId || !shift.startTimeLocal) {
        return false;
      }

      const virtualDateStr = utcToVnDateString(shift.startTime);

      // OPTIMIZATION: Use Map lookup (O(1)) instead of some() (O(n))
      const lookupKey = `${virtualStaffId}-${virtualDateStr}-${shift.startTimeLocal}`;
      if (realShiftsMap.has(lookupKey)) {
        return false; // Has real shift, don't show virtual
      }

      return true;
    });

    // Combine and enhance all shifts with pre-computed fields
    const combined = [...enhancedWorkShifts, ...virtualShifts];

    // Enhance virtual shifts that don't have pre-computed fields
    return combined.map((shift) => {
      if (!(shift as any)._vnDateStr) {
        return {
          ...shift,
          _vnDateStr: utcToVnDateString(shift.startTime),
          _vnTimeStr: utcToVnTimeString(shift.startTime)
        };
      }
      return shift;
    });
  }, [enhancedWorkShifts, workShifts, generateVirtualWorkShifts, selectedStaffId, loadingWorkShifts]);

  const filteredWorkShifts = allWorkShifts.filter((shift) => {
    if (!canViewAllStaffSchedules && currentStaff) {
      if (!shift.staffId || shift.staffId._id !== currentStaff._id) {
        return false;
      }
    }

    if (canViewAllStaffSchedules && selectedStaffId) {
      if (!shift.staffId || shift.staffId._id !== selectedStaffId) {
        return false;
      }
    }

    if (!showDisabledShifts && shift.status === 'CANCELLED') {
      return false;
    }
    return true;
  });

  // Get workshifts that match a specific shift config (for rendering)
  // PARTIALLY OPTIMIZED: Use pre-computed date strings when available
  const getWorkShiftsForShift = (
    date: Date,
    shiftConfig: { type?: string; startTime?: string; endTime?: string; hour?: number; display?: string }
  ) => {
    // Handle old format with hour property
    if (shiftConfig.hour !== undefined) {
      // Legacy support - convert hour to time range
      const startTime = `${shiftConfig.hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(shiftConfig.hour + 1).toString().padStart(2, '0')}:00`;
      shiftConfig = { ...shiftConfig, startTime, endTime };
    }

    if (!shiftConfig.startTime || !shiftConfig.endTime) {
      return [];
    }

    const filteredShifts = filteredWorkShifts.filter((workShift) => {
      // OPTIMIZATION: Use pre-computed date string if available
      const shiftDateStr = (workShift as any)._vnDateStr || utcToVnDateString(workShift.startTime);
      const shiftDate = new Date(shiftDateStr);
      const shiftDateOnly = new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate());

      // Check if shift is on the same date
      const isSameDate = shiftDateOnly.toDateString() === date.toDateString();

      if (!shiftConfig.startTime || !shiftConfig.endTime) {
        return false;
      }

      // OPTIMIZATION: Use pre-computed time string if available
      const vnTimeFromUtc = (workShift as any)._vnTimeStr || utcToVnTimeString(workShift.startTime);

      const startTimeLocalStr = vnTimeFromUtc;

      if (!startTimeLocalStr) {
        return false;
      }

      const [shiftStartHour, shiftStartMin] = startTimeLocalStr.split(':').map(Number);
      const [configStartHour, configStartMin] = shiftConfig.startTime.split(':').map(Number);

      // Check if workshift startTime matches shift config startTime exactly
      const workShiftStartMinutes = shiftStartHour * 60 + shiftStartMin;
      const configStartMinutes = configStartHour * 60 + configStartMin;

      const exactStartTimeMatch = workShiftStartMinutes === configStartMinutes;

      return isSameDate && exactStartTimeMatch;
    });

    const sortedShifts = [...filteredShifts].sort((a, b) => {
      const aIsVirtual = isVirtualWorkShift(a);
      const bIsVirtual = isVirtualWorkShift(b);

      // Real shifts (non-virtual) first
      if (!aIsVirtual && bIsVirtual) return -1;
      if (aIsVirtual && !bIsVirtual) return 1;

      // Among real shifts, prioritize CANCELLED (they represent timeoff)
      if (!aIsVirtual && !bIsVirtual) {
        const aIsCancelled = a.status === 'CANCELLED';
        const bIsCancelled = b.status === 'CANCELLED';
        if (aIsCancelled && !bIsCancelled) return -1;
        if (!aIsCancelled && bIsCancelled) return 1;
      }

      return 0;
    });

    return sortedShifts;
  };

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
  };

  // Refresh workshifts after creating new one
  const refreshWorkShifts = async () => {
    await fetchWorkShifts();
  };

  // Refresh branch config and workshifts after updating branch working config
  const refreshBranchConfigAndShifts = async () => {
    await Promise.all([refetchBranchConfig(), fetchWorkShifts()]);
  };

  // Refresh time offs and workshifts
  const refreshTimeOffs = async () => {
    await Promise.all([refetchTimeOffs(), fetchWorkShifts()]);
  };

  // Handlers for dropdown actions
  const handleCreateWorkShift = () => {
    setShowCreateWorkShiftModal(true);
  };

  // Async handler for slot click to prevent UI freeze
  const handleSlotClick = useCallback(
    async (
      shiftsForSlot: (WorkShift | VirtualWorkShift)[],
      date: Date,
      slot: { type?: string; startTime?: string; endTime?: string; hour?: number; display?: string },
      timeRange: string,
      activeShifts: (WorkShift | VirtualWorkShift)[],
      staffCount: number,
      cellKey: string
    ) => {
      // Show loading in specific cell immediately
      setLoadingCellKey(cellKey);

      // Use double requestAnimationFrame to ensure loading UI renders before heavy processing
      // This gives the browser 2 frames to paint the loading spinner
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      try {
        if (canViewAllStaffSchedules && staffCount > 0) {
          // Show staff list modal for Owner/Manager
          setSelectedShiftData({
            shifts: shiftsForSlot,
            date,
            slot,
            timeRange
          });
          setStaffListModalTab('staff'); // Reset to Staff tab
          setShowStaffListModal(true);
          setShowCreateWorkShiftModal(false);
        } else {
          // Regular staff behavior: show detail of their own shift
          // OPTIMIZED: Use Map lookup instead of workShifts.some()
          let firstActiveShift = activeShifts.find((s) => {
            if (!isVirtualWorkShift(s)) {
              return workShiftsMap.has(s._id);
            }
            return false;
          });

          // Nếu không tìm thấy real shift, tìm virtual shift tương ứng với real shift trong DB
          if (!firstActiveShift && activeShifts.length > 0) {
            const virtualShift = activeShifts[0];
            if (isVirtualWorkShift(virtualShift)) {
              // OPTIMIZED: Use Map lookup instead of workShifts.find()
              const virtualStaffId = getStaffId(virtualShift.staffId);
              if (virtualStaffId && virtualShift.startTimeLocal) {
                const virtualDate = new Date(virtualShift.startTime);
                const virtualDateInLocal = new Date(
                  virtualDate.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })
                );
                const virtualDateStr = `${virtualDateInLocal.getFullYear()}-${String(virtualDateInLocal.getMonth() + 1).padStart(2, '0')}-${String(virtualDateInLocal.getDate()).padStart(2, '0')}`;
                const lookupKey = `${virtualStaffId}-${virtualDateStr}-${virtualShift.startTimeLocal}`;

                const matchingRealShift = workShiftsByKeyMap.get(lookupKey);

                if (matchingRealShift) {
                  firstActiveShift = matchingRealShift;
                } else {
                  firstActiveShift = virtualShift;
                }
              } else {
                firstActiveShift = virtualShift;
              }
            } else {
              firstActiveShift = virtualShift;
            }
          }

          // Fallback to first shift if still not found
          if (!firstActiveShift) {
            firstActiveShift = activeShifts[0];
            if (!firstActiveShift) {
              const cancelledShift = shiftsForSlot.find((s) => s.status === 'CANCELLED');
              if (cancelledShift) {
                firstActiveShift = cancelledShift;
              } else {
                firstActiveShift = shiftsForSlot[0];
              }
            }
          }

          if (firstActiveShift) {
            setSelectedWorkShift(firstActiveShift);
            setShowWorkShiftDetail(true);
            setShowCreateWorkShiftModal(false);
          }
        }
      } finally {
        // Hide loading after processing
        setLoadingCellKey(null);
      }
    },
    [canViewAllStaffSchedules, workShiftsMap, workShiftsByKeyMap]
  );

  // Generate time slots - now returns shifts instead of hours
  const generateTimeSlots = () => {
    if (!branchConfig || !branchConfig.defaultShifts || branchConfig.defaultShifts.length === 0) {
      return [
        {
          type: 'MORNING',
          startTime: '06:00',
          endTime: '12:00',
          display: t('branch_working_config.shift_type.morning_simple'),
          customName: undefined
        },
        {
          type: 'AFTERNOON',
          startTime: '12:00',
          endTime: '18:00',
          display: t('branch_working_config.shift_type.afternoon_simple'),
          customName: undefined
        },
        {
          type: 'EVENING',
          startTime: '18:00',
          endTime: '22:00',
          display: t('branch_working_config.shift_type.evening_simple'),
          customName: undefined
        }
      ];
    }

    return branchConfig.defaultShifts.map((shift) => {
      let display = shift.customName || shift.type;

      if (!shift.customName) {
        const shiftNames: Record<string, string> = {
          MORNING: t('branch_working_config.shift_type.morning_simple'),
          AFTERNOON: t('branch_working_config.shift_type.afternoon_simple'),
          EVENING: t('branch_working_config.shift_type.evening_simple'),
          CUSTOM: shift.customName || t('branch_working_config.custom')
        };
        display = shiftNames[shift.type] || shift.type;
      }

      return {
        ...shift,
        display
      };
    });
  };

  const timeSlots = useMemo(() => generateTimeSlots(), [branchConfig, t]);

  const filteredStaffList = useMemo(() => {
    if (!currentBranch) return [];

    return staffList.filter((staff) => {
      const staffBranchIds = getBranchIds(staff.branchId);

      if (!staffBranchIds.includes(currentBranch._id)) {
        return false;
      }

      // Filter by search value
      if (staffSearchValue.trim()) {
        const searchTerm = staffSearchValue.toLowerCase().trim();
        const staffName = (staff.userId?.fullName || 'Unknown').toLowerCase();
        const jobTitle = (staff.jobTitle || '').toLowerCase();
        return staffName.includes(searchTerm) || jobTitle.includes(searchTerm);
      }

      return true;
    });
  }, [staffList, currentBranch, staffSearchValue]);

  const getSelectedStaffDisplay = () => {
    if (!selectedStaffId) {
      return t('workshift.all_staff') || 'All Staff';
    }
    const selectedStaff = staffList.find((s) => s._id === selectedStaffId);
    if (selectedStaff) {
      return `${selectedStaff.userId?.fullName || 'Unknown'} (${selectedStaff.jobTitle})`;
    }
    return t('workshift.select_staff') || 'Select Staff';
  };

  // Handle shift tap in mobile view
  const handleShiftTap = (shift: WorkShift | VirtualWorkShift) => {
    setSelectedWorkShift(shift);
    setShowWorkShiftDetail(true);
  };

  // Handle create shift in mobile view
  const handleCreateShift = () => {
    setShowCreateWorkShiftModal(true);
  };

  // Render mobile view if on mobile device
  if (isMobile) {
    return (
      <>
        <MobileCalendarView
          selectedDate={currentDate}
          onDateChange={setCurrentDate}
          shifts={allWorkShifts}
          branchConfig={branchConfig}
          onShiftTap={handleShiftTap}
          onCreateShift={handleCreateShift}
          onBranchConfig={() => setShowBranchConfig(true)}
          canEdit={canViewAllStaffSchedules}
        />

        {/* Modals - Shared between mobile and desktop */}
        <WorkShiftDetailModalWithTimeOff
          isOpen={showWorkShiftDetail}
          onClose={() => setShowWorkShiftDetail(false)}
          workShift={selectedWorkShift}
          onUpdate={refreshWorkShifts}
          selectedDate={currentDate}
        />

        <CreateWorkShiftModal
          isOpen={showCreateWorkShiftModal}
          onClose={() => setShowCreateWorkShiftModal(false)}
          onSuccess={refreshWorkShifts}
        />

        {showBranchConfig && (
          <BranchWorkingConfigModal
            isOpen={showBranchConfig}
            onClose={() => setShowBranchConfig(false)}
            onSuccess={refreshBranchConfigAndShifts}
          />
        )}
      </>
    );
  }

  // Desktop view (existing code)
  return (
    <>
      {/* Global Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #9ca3af;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>

      <div className="calendar-main-container flex h-full bg-gray-50 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handlePrevWeek}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleToday}>
                    {t('workshift.today')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleNextWeek}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentDate.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </h2>
              </div>

              {/* Color Legend */}
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500 shadow-sm"></div>
                  <span className="text-gray-700">{t('workshift.legend.scheduled') || 'Scheduled'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-yellow-50 border-l-4 border-yellow-500 shadow-sm"></div>
                  <span className="text-gray-700">{t('workshift.legend.pending') || 'Pending'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-red-50 border-l-4 border-red-900 shadow-sm"></div>
                  <span className="text-gray-700">{t('workshift.legend.cancelled') || 'Cancelled'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-gray-50 to-gray-300 border-l-4 border-gray-300 shadow-sm"></div>
                  <span className="text-gray-700">{t('workshift.legend.past') || 'Past'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Staff List Selector with Search - Only show if user can view all staff schedules */}
                {canViewAllStaffSchedules && (
                  <Popover
                    open={staffSearchOpen}
                    onOpenChange={(open) => {
                      setStaffSearchOpen(open);
                      if (!open) {
                        setStaffSearchValue('');
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button variant="outline" aria-expanded={staffSearchOpen} className="w-[200px] justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <User className="h-4 w-4 shrink-0" />
                          <span className="truncate">{getSelectedStaffDisplay()}</span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder={t('workshift.search_staff') || 'Search staff...'}
                          value={staffSearchValue}
                          onValueChange={setStaffSearchValue}
                        />
                        <CommandList>
                          <CommandEmpty>{t('workshift.no_staff_found') || 'No staff found.'}</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="all"
                              onSelect={() => {
                                onStaffSelect?.(undefined);
                                setStaffSearchOpen(false);
                                setStaffSearchValue('');
                              }}
                            >
                              <Check className={cn('mr-2 h-4 w-4', !selectedStaffId ? 'opacity-100' : 'opacity-0')} />
                              <User className="h-4 w-4 mr-2" />
                              <span>{t('workshift.all_staff') || 'All Staff'}</span>
                            </CommandItem>
                            {filteredStaffList.map((staff) => (
                              <CommandItem
                                key={staff._id}
                                value={staff._id}
                                onSelect={() => {
                                  onStaffSelect?.(staff._id);
                                  setStaffSearchOpen(false);
                                  setStaffSearchValue('');
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    selectedStaffId === staff._id ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                <User className="h-4 w-4 mr-2" />
                                <span>
                                  {staff.userId?.fullName || 'Unknown'} ({staff.jobTitle})
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}

                {/* Create Dropdown - Replacing Time Off button */}
                <CreateDropdown
                  onCreateWorkShift={handleCreateWorkShift}
                  onBranchConfig={() => setShowBranchConfig(true)}
                  className="w-auto"
                  data-tour="create-workshift-button"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="border-gray-300 hover:bg-gray-50"
                  onClick={startCalendarTour}
                  title={t('calendar.tour.button', 'Hướng dẫn')}
                >
                  <HelpCircle className="w-4 h-4 text-gray-500 hover:text-orange-500" />
                </Button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 overflow-hidden bg-white">
            <div className="h-full flex flex-col">
              {/* Week Header - Fixed */}
              <div className="flex-shrink-0 bg-white border-b-2 border-gray-300 z-10">
                <div className="flex">
                  {/* Time column header - Match sidebar width */}
                  <div className="w-[90px] p-4 border-r border-gray-200 bg-gray-50 flex-shrink-0">
                    {/* Empty header for time column */}
                  </div>

                  {/* Days header */}
                  <div className="flex-1">
                    <div
                      className="grid"
                      style={{ gridTemplateColumns: `repeat(${filteredWeekDates.length}, minmax(0, 1fr))` }}
                    >
                      {filteredWeekDates.map((date) => {
                        const dayOfWeek = date.getDay();
                        const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                        const dayKey = dayKeys[dayOfWeek];

                        return (
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
                              {t(`workshift.${dayKey}`)}
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
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Slots - Scrollable */}
              <div className="calendar-scrollable-area no-padding flex-1 overflow-y-auto relative">
                <div className="calendar-grid-wrapper">
                  {/* Time sidebar with fixed labels on lines */}
                  <div className="calendar-time-sidebar">
                    {/* Show shift times for each shift column - auto distributed with flex */}
                    {timeSlots.map((slot, index) => {
                      const shiftTime = `${slot.startTime} - ${slot.endTime}`;
                      return (
                        <div key={`time-marker-${slot.type}-${index}`} className="time-marker">
                          <div className="text-xl font-bold text-gray-900">{slot.display}</div>
                          <div className="text-gray-600 text-sm font-semibold mt-2">{shiftTime}</div>
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
                      <div
                        className="calendar-day-grid"
                        style={{ gridTemplateColumns: `repeat(${filteredWeekDates.length}, 1fr)` }}
                      >
                        {filteredWeekDates.map((date) => (
                          <div key={`day-${date.getTime()}`} className="calendar-day-column-new">
                            {/* Time cells for this day */}
                            {timeSlots.map((slot, slotIndex) => (
                              <div
                                key={`cell-${date.getTime()}-${slot.type}-${slotIndex}`}
                                className="calendar-time-cell relative"
                                onClick={() => {
                                  // Click handler for shift cell
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                              >
                                {renderShiftsForSlot(date, slot)}
                                {/* Time Off indicator for the first shift of each day */}
                                {slotIndex === 0 && renderTimeOffIndicator(date)}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
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

        {/* Staff List Modal - For Owner/Manager to view all staff and classes in a shift */}
        <Dialog open={showStaffListModal} onOpenChange={setShowStaffListModal}>
          <DialogContent className="max-w-3xl h-[80vh] overflow-hidden flex flex-col">
            {selectedShiftData && (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Tabs for Staff and Classes */}
                <Tabs
                  value={staffListModalTab}
                  onValueChange={(val) => setStaffListModalTab(val as 'staff' | 'classes')}
                  className="flex-1 flex flex-col overflow-hidden min-h-0"
                >
                  <TabsList className="grid w-full grid-cols-2 flex-shrink-0 mt-8">
                    <TabsTrigger value="staff" className="cursor-pointer">
                      Staff
                    </TabsTrigger>
                    <TabsTrigger value="classes" className="cursor-pointer">
                      Classes
                    </TabsTrigger>
                  </TabsList>

                  {/* Staff Tab */}
                  <TabsContent
                    value="staff"
                    className="flex-1 overflow-y-auto m-0 min-h-0 custom-scrollbar"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#9ca3af #f3f4f6'
                    }}
                  >
                    <div className="space-y-2 pr-2 pb-4">
                      <div className="text-sm font-semibold text-gray-700 mb-3 sticky top-0 bg-white z-10 py-2 -mt-2">
                        {(() => {
                          // Count unique staff
                          const uniqueStaffIds = new Set(
                            selectedShiftData.shifts.map((s) => getStaffId(s.staffId)).filter(Boolean)
                          );
                          return `${t('workshift.total_staff') || 'Total Staff'}: ${uniqueStaffIds.size}`;
                        })()}
                      </div>
                      <div className="space-y-2 pr-2 pb-4">
                        {(() => {
                          // Collect unique staff with their shifts
                          const staffShiftMap = new Map<
                            string,
                            {
                              staffId: string;
                              staffName: string;
                              jobTitle: string;
                              avatarUrl: string;
                              shifts: (WorkShift | VirtualWorkShift)[];
                            }
                          >();

                          selectedShiftData.shifts.forEach((shift) => {
                            const staffId = getStaffId(shift.staffId);
                            if (!staffId) return;

                            const staffName = getStaffName(shift.staffId);
                            const jobTitle = shift.staffId?.jobTitle || 'Unknown';
                            const avatarUrl = getAvatarUrl(staffName) || '';

                            if (!staffShiftMap.has(staffId)) {
                              staffShiftMap.set(staffId, {
                                staffId,
                                staffName,
                                jobTitle,
                                avatarUrl,
                                shifts: []
                              });
                            }
                            staffShiftMap.get(staffId)!.shifts.push(shift);
                          });

                          return Array.from(staffShiftMap.values()).map((staffInfo) => (
                            <div
                              key={staffInfo.staffId}
                              role="button"
                              tabIndex={0}
                              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer"
                              onClick={() => {
                                // When clicking on a staff member, show their shift detail
                                const firstShift = staffInfo.shifts[0];
                                if (firstShift) {
                                  setSelectedWorkShift(firstShift);
                                  setShowWorkShiftDetail(true);
                                  setShowStaffListModal(false);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  const firstShift = staffInfo.shifts[0];
                                  if (firstShift) {
                                    setSelectedWorkShift(firstShift);
                                    setShowWorkShiftDetail(true);
                                    setShowStaffListModal(false);
                                  }
                                }
                              }}
                            >
                              <Avatar className="h-10 w-10 border-2 border-orange-200">
                                <AvatarImage src={staffInfo.avatarUrl} alt={staffInfo.staffName} />
                                <AvatarFallback className="bg-orange-500 text-white font-semibold">
                                  {staffInfo.staffName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900">{staffInfo.staffName}</div>
                                <div className="text-sm text-gray-600">{staffInfo.jobTitle}</div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {staffInfo.shifts.length} shift{staffInfo.shifts.length !== 1 ? 's' : ''}
                              </div>
                              <X className="h-4 w-4 text-gray-400" />
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Classes Tab */}
                  <TabsContent
                    value="classes"
                    className="flex-1 overflow-y-auto m-0 min-h-0 custom-scrollbar"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#9ca3af #f3f4f6'
                    }}
                  >
                    <div className="pr-2">
                      {selectedShiftData && (
                        <ClassesListTab
                          classes={classes}
                          schedules={schedules}
                          loading={classesLoading}
                          schedulesLoading={schedulesLoading}
                          error={classesError}
                          schedulesError={schedulesError}
                          filterStartTime={selectedShiftData.slot.startTime}
                          filterEndTime={selectedShiftData.slot.endTime}
                          filterDayOfWeek={getDayOfWeekName(selectedShiftData.date)}
                          onClassClick={(classId) => {
                            setSelectedClassId(classId);
                            setShowClassDetail(true);
                          }}
                          onScheduleClick={(scheduleId) => {
                            // Schedule detail modal can be added later if needed
                            console.log('Schedule clicked:', scheduleId);
                          }}
                        />
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Work Shift Detail Modal with Time Off */}
        <WorkShiftDetailModalWithTimeOff
          isOpen={showWorkShiftDetail}
          onClose={() => {
            setShowWorkShiftDetail(false);
            setSelectedWorkShift(null);
          }}
          workShift={selectedWorkShift}
          selectedDate={currentDate}
          onEdit={() => {
            // Edit functionality will be implemented later
          }}
          onUpdate={(updatedWorkShift) => {
            // Update the workshift in the list
            setWorkShifts((prev) =>
              prev.map((shift) => (shift._id === updatedWorkShift._id ? updatedWorkShift : shift))
            );
            setSelectedWorkShift(updatedWorkShift);
          }}
          onTimeOffChange={refreshTimeOffs}
          userRole={userRole}
        />

        {/* Create Work Shift Modal */}
        <CreateWorkShiftModal
          isOpen={showCreateWorkShiftModal}
          onClose={() => setShowCreateWorkShiftModal(false)}
          onSuccess={refreshWorkShifts}
        />

        {showBranchConfig && (
          <BranchWorkingConfigModal
            isOpen={showBranchConfig}
            onClose={() => setShowBranchConfig(false)}
            onSuccess={refreshBranchConfigAndShifts}
          />
        )}

        {/* Class Detail Modal */}
        <ClassDetailModal
          isOpen={showClassDetail}
          onClose={() => {
            setShowClassDetail(false);
            setSelectedClassId(null);
          }}
          classId={selectedClassId || undefined}
          selectedDate={selectedShiftData?.date}
        />
      </div>
    </>
  );
};

export default StaffScheduleCalendar;
