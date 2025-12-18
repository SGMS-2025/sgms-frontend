import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import i18n from 'i18next';
import { Calendar, MapPin, Users, Clock, AlertCircle, User, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Class, DayName } from '@/types/Class';
import type { Schedule, ScheduleServiceContract } from '@/types/api/Schedule';
import type { Staff } from '@/types/api/Staff';

// Extended Schedule type to support both timeRange object and direct startTime/endTime fields
interface ScheduleWithTimeFields extends Schedule {
  startTime?: string;
  endTime?: string;
}
import { trainingProgressApi } from '@/services/api/trainingProgressApi';
import { useUser } from '@/hooks/useAuth';

interface ClassesListTabProps {
  classes: Class[];
  schedules?: Schedule[]; // PT 1-1 schedules
  loading: boolean;
  schedulesLoading?: boolean;
  error?: Error | null;
  schedulesError?: Error | null;
  staffId?: string;
  filterStartTime?: string; // Filter by shift start time (HH:MM)
  filterEndTime?: string; // Filter by shift end time (HH:MM)
  filterDayOfWeek?: string; // Filter by day of week (MONDAY, TUESDAY, etc.)
  filterDate?: Date; // Filter by date to check against class startDate and endDate
  onClassClick?: (classId: string) => void; // Callback when class is clicked
  onScheduleClick?: (scheduleId: string) => void; // Callback when schedule is clicked
}

/**
 * Component to display list of classes assigned to a Personal Trainer
 * Shown as a tab in WorkShift Detail Modal
 *
 * Can optionally filter by shift time to show only classes matching that time slot
 *
 * @param classes - Array of class objects
 * @param loading - Loading state
 * @param error - Error object if fetching failed
 * @param staffId - The trainer's staff ID
 * @param filterStartTime - Optional: filter by shift start time
 * @param filterEndTime - Optional: filter by shift end time
 * @param filterDayOfWeek - Optional: filter by day of week
 */
export const ClassesListTab: React.FC<ClassesListTabProps> = ({
  classes,
  schedules = [],
  loading,
  schedulesLoading = false,
  error,
  schedulesError,
  staffId: _staffId,
  filterStartTime,
  filterEndTime,
  filterDayOfWeek,
  filterDate,
  onClassClick,
  onScheduleClick
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useUser();
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CLASS' | 'PT_1_1'>('ALL');
  const [progressCheckMap, setProgressCheckMap] = useState<Record<string, boolean>>({});
  const [checkingProgress, setCheckingProgress] = useState<Record<string, boolean>>({});

  // Filter classes by shift time if provided
  const filteredClasses = React.useMemo(() => {
    if (!filterStartTime || !filterEndTime || !filterDayOfWeek) {
      return classes;
    }

    return classes.filter((cls) => {
      // Kiểm tra xem lớp học có schedule pattern không
      if (!cls.schedulePattern) return false;

      // Kiểm tra xem day có khớp không
      if (!cls.schedulePattern.daysOfWeek?.includes(filterDayOfWeek as DayName)) {
        return false;
      }

      // Kiểm tra date có nằm trong khoảng startDate và endDate của lớp học
      if (filterDate && cls.startDate && cls.endDate) {
        // Chuyển đổi filterDate về dạng Date object và chỉ lấy phần ngày (bỏ giờ)
        const currentDate = new Date(filterDate);
        currentDate.setHours(0, 0, 0, 0);

        // Chuyển đổi startDate và endDate về dạng Date object
        const classStartDate = new Date(cls.startDate);
        classStartDate.setHours(0, 0, 0, 0);

        const classEndDate = new Date(cls.endDate);
        classEndDate.setHours(23, 59, 59, 999); // Đặt về cuối ngày để bao gồm cả ngày kết thúc

        // Kiểm tra xem ngày hiện tại có nằm trong khoảng startDate và endDate không
        if (currentDate < classStartDate || currentDate > classEndDate) {
          return false;
        }
      }

      // Kiểm tra time overlap
      const classStart = cls.schedulePattern.startTime;
      const classEnd = cls.schedulePattern.endTime;

      // Kiểm tra chồng chéo đơn giản: lớp học bắt đầu trước khi shift kết thúc VÀ lớp học kết thúc sau khi shift bắt đầu
      const startMatch = classStart <= filterEndTime && classEnd >= filterStartTime;

      return startMatch;
    });
  }, [classes, filterStartTime, filterEndTime, filterDayOfWeek, filterDate]);

  // Filter schedules by time if provided
  const filteredSchedules = React.useMemo(() => {
    let result = schedules;

    // Filter by time slot if provided
    if (filterStartTime && filterEndTime && filterDayOfWeek) {
      result = result.filter((schedule) => {
        // Check if schedule date matches the day of week
        // Prefer workShiftsId.dayOfTheWeek if available (more accurate)
        let scheduleDayName: string | undefined;

        if (schedule.workShiftsId && typeof schedule.workShiftsId === 'object' && schedule.workShiftsId.dayOfTheWeek) {
          scheduleDayName = schedule.workShiftsId.dayOfTheWeek;
        } else {
          // Calculate from scheduleDate using UTC to match backend logic
          const scheduleDate = new Date(schedule.scheduleDate);
          // Use UTC methods to get day of week (matches backend dowNameUTC function)
          const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
          const utcDay = scheduleDate.getUTCDay(); // 0=Sunday, 1=Monday, etc.
          scheduleDayName = dayNames[utcDay];
        }

        if (scheduleDayName !== filterDayOfWeek) {
          return false;
        }

        // Check if time overlaps
        // Support both timeRange object and direct startTime/endTime fields
        const scheduleWithTime = schedule as ScheduleWithTimeFields;
        const scheduleStart = scheduleWithTime.timeRange?.startTime || scheduleWithTime.startTime || '00:00';
        const scheduleEnd = scheduleWithTime.timeRange?.endTime || scheduleWithTime.endTime || '00:00';

        // Simple overlap check: schedule starts before shift ends AND schedule ends after shift starts
        const startMatch = scheduleStart <= filterEndTime && scheduleEnd >= filterStartTime;

        return startMatch;
      });
    }

    return result;
  }, [schedules, filterStartTime, filterEndTime, filterDayOfWeek]);

  // Combined data for table: Classes and Schedules
  type TableRow = {
    id: string;
    type: 'CLASS' | 'PT_1_1';
    name: string;
    trainers: string;
    time: string; // Format: "HH:MM - HH:MM"
    customers: string; // Customer names, comma-separated
    capacity: string; // Format: "current/total"
    status: string;
    data: Class | Schedule;
    customerId?: string;
    serviceContractId?: string;
    scheduleDate?: string; // Ngày của schedule (cho PT 1-1)
  };

  const tableRows = useMemo<TableRow[]>(() => {
    const rows: TableRow[] = [];

    // Debug logs
    console.log('[ClassesListTab] Building table rows:', {
      classesCount: classes.length,
      schedulesCount: schedules.length,
      filteredClassesCount: filteredClasses.length,
      filteredSchedulesCount: filteredSchedules.length,
      typeFilter,
      schedules: schedules.map((s) => ({
        id: s._id,
        name: s.name,
        type: s.type,
        status: s.status,
        scheduleDate: s.scheduleDate,
        ptId: s.ptId?._id
      }))
    });

    // Add Classes
    filteredClasses.forEach((cls) => {
      const trainers = cls.trainerIds
        .map((trainer: Staff | string) =>
          typeof trainer === 'object' && trainer.userId ? trainer.userId.fullName : 'Unknown'
        )
        .slice(0, 2)
        .join(', ');
      const moreTrainers = cls.trainerIds.length > 2 ? ` +${cls.trainerIds.length - 2}` : '';
      const totalEnrollment = (cls.activeEnrollment || 0) + (cls.inactiveEnrollment || 0);

      // Format time range for classes
      const timeRange = cls.schedulePattern
        ? `${cls.schedulePattern.startTime} - ${cls.schedulePattern.endTime}`
        : 'N/A';

      rows.push({
        id: cls._id,
        type: 'CLASS',
        name: cls.name,
        trainers: trainers + moreTrainers,
        time: timeRange,
        customers: String(totalEnrollment),
        capacity: `${totalEnrollment}/${cls.capacity}`,
        status: cls.status,
        data: cls
      });
    });

    // Add PT 1-1 Schedules
    filteredSchedules.forEach((schedule) => {
      const ptName = schedule.ptId?.userId?.fullName || 'PT';

      // Format time range for schedules
      // Support both timeRange object and direct startTime/endTime fields
      const formatTime = (timeString?: string) => {
        if (!timeString) return '00:00';
        // Remove seconds if present (HH:MM:SS -> HH:MM)
        return timeString.substring(0, 5);
      };
      const scheduleWithTime = schedule as ScheduleWithTimeFields;
      const startTime = formatTime(scheduleWithTime.timeRange?.startTime || scheduleWithTime.startTime);
      const endTime = formatTime(scheduleWithTime.timeRange?.endTime || scheduleWithTime.endTime);
      const timeRange = `${startTime} - ${endTime}`;

      // Extract customer names from serviceContractIds
      let customerNames = 'N/A';
      if (schedule.serviceContractIds && schedule.serviceContractIds.length > 0) {
        const names = schedule.serviceContractIds
          .map((contract: ScheduleServiceContract | string) => {
            // Handle different contract structures
            if (!contract) return null;

            // Case 1: Contract is populated object with customerId
            if (typeof contract === 'object' && contract.customerId) {
              // Check if customerId is populated (object) or just ObjectId (string)
              if (typeof contract.customerId === 'object' && contract.customerId !== null) {
                // Customer model has userId (ref to User), not fullName directly
                if (contract.customerId.userId) {
                  if (typeof contract.customerId.userId === 'object' && contract.customerId.userId !== null) {
                    // userId is populated with User object
                    if (contract.customerId.userId.fullName) {
                      return contract.customerId.userId.fullName;
                    }
                    // Try alternative fields
                    if (contract.customerId.userId.firstName && contract.customerId.userId.lastName) {
                      return `${contract.customerId.userId.firstName} ${contract.customerId.userId.lastName}`;
                    }
                    if (contract.customerId.userId.username) {
                      return contract.customerId.userId.username;
                    }
                  }
                }
              }
            }

            // Case 2: Alternative structure with customer field
            if (typeof contract === 'object' && contract.customer) {
              if (typeof contract.customer === 'object' && contract.customer.fullName) {
                return contract.customer.fullName;
              }
            }

            // Case 3: Contract is just ObjectId string (not populated) - skip
            if (typeof contract === 'string') {
              return null;
            }

            return null;
          })
          .filter((name: string | null) => name !== null && name.trim() !== '');

        if (names.length > 0) {
          customerNames = names.join(', ');
          if (schedule.serviceContractIds.length > names.length) {
            customerNames += ` (+${schedule.serviceContractIds.length - names.length})`;
          }
        } else {
          // If we have contracts but no names, it means they're not populated
          // This is expected for schedules created without serviceContractIds
          customerNames = 'N/A';
        }
      }

      // Extract customerId and serviceContractId for PT 1-1 schedules
      let customerId: string | undefined;
      let serviceContractId: string | undefined;

      if (schedule.serviceContractIds && schedule.serviceContractIds.length > 0) {
        const firstContract = schedule.serviceContractIds[0];
        if (firstContract && typeof firstContract === 'object') {
          if (firstContract.customerId) {
            customerId =
              typeof firstContract.customerId === 'object' ? firstContract.customerId._id : firstContract.customerId;
          }
          serviceContractId = firstContract._id;
        }
      }

      rows.push({
        id: schedule._id,
        type: 'PT_1_1',
        name: schedule.name || `PT 1vs1 - ${ptName}`,
        trainers: ptName,
        time: timeRange,
        customers: customerNames,
        capacity: `${schedule.currentBookings || 0}/${schedule.maxCapacity || 1}`,
        status: schedule.status,
        data: schedule,
        customerId,
        serviceContractId,
        scheduleDate: schedule.scheduleDate // Lưu ngày của schedule để check progress theo ngày
      });
    });

    // Filter by type
    if (typeFilter !== 'ALL') {
      return rows.filter((row) => row.type === typeFilter);
    }

    return rows;
  }, [filteredClasses, filteredSchedules, typeFilter]);

  // Check if progress exists for PT 1-1 schedules
  useEffect(() => {
    const checkProgressForSchedules = async () => {
      const pt1_1Rows = tableRows.filter((row) => row.type === 'PT_1_1' && row.customerId && row.serviceContractId);

      if (pt1_1Rows.length === 0) return;

      const checkPromises = pt1_1Rows.map(async (row) => {
        if (!row.customerId || !row.serviceContractId || !currentUser?._id || !row.scheduleDate) return;

        // Key bao gồm cả ngày để check progress theo ngày cụ thể
        const scheduleDate = new Date(row.scheduleDate);
        const dateStr = scheduleDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const key = `${row.customerId}-${row.serviceContractId}-${dateStr}`;

        if (progressCheckMap[key] !== undefined) return; // Already checked

        setCheckingProgress((prev) => ({ ...prev, [key]: true }));

        // Check if progress exists for this customer, contract và ngày cụ thể
        // Sử dụng startDate và endDate để filter theo ngày của schedule
        const scheduleDateObj = new Date(row.scheduleDate);
        scheduleDateObj.setUTCHours(0, 0, 0, 0);
        const startDate = scheduleDateObj.toISOString();

        const endDateObj = new Date(scheduleDateObj);
        endDateObj.setUTCHours(23, 59, 59, 999);
        const endDate = endDateObj.toISOString();

        const response = await trainingProgressApi.getTrainingProgressList({
          customerId: row.customerId,
          serviceContractId: row.serviceContractId,
          trainerId: currentUser._id,
          startDate,
          endDate,
          limit: 1
        });

        // Check xem có progress nào trong ngày này không
        const hasProgress = response.success && response.data && response.data.progressRecords.length > 0;
        setProgressCheckMap((prev) => ({ ...prev, [key]: hasProgress }));

        setCheckingProgress((prev) => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
      });

      await Promise.all(checkPromises);
    };

    if (tableRows.length > 0 && currentUser?._id) {
      checkProgressForSchedules();
    }
  }, [tableRows, currentUser?._id]);

  // Handle add progress click
  const handleAddProgress = (e: React.MouseEvent, row: TableRow) => {
    e.stopPropagation(); // Prevent row click

    if (!row.customerId) return;

    if (row.serviceContractId) {
      navigate(`/manage/pt/clients/${row.customerId}/progress?add=true&contractId=${row.serviceContractId}`);
    } else {
      navigate(`/manage/pt/clients/${row.customerId}/progress?add=true`);
    }
  };

  // Total capacity stats
  const totalStats = useMemo(() => {
    const classCapacity = filteredClasses.reduce((sum, cls) => sum + (cls.capacity || 0), 0);
    const classEnrolled = filteredClasses.reduce(
      (sum, cls) => sum + (cls.activeEnrollment || 0) + (cls.inactiveEnrollment || 0),
      0
    );
    const scheduleCapacity = filteredSchedules.reduce((sum, s) => sum + (s.maxCapacity || 1), 0);
    const scheduleBooked = filteredSchedules.reduce((sum, s) => sum + (s.currentBookings || 0), 0);

    return {
      totalCapacity: classCapacity + scheduleCapacity,
      totalEnrolled: classEnrolled + scheduleBooked
    };
  }, [filteredClasses, filteredSchedules]);

  // Loading state
  if (loading || schedulesLoading) {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">{t('classesListTab.loading')}</span>
      </div>
    );
  }

  // Error state
  if (error || schedulesError) {
    const errorMessage = error?.message || schedulesError?.message || 'Unknown error';
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
        <div className="text-red-600">
          <p className="font-medium">{t('classesListTab.error')}</p>
          <p className="text-sm">{errorMessage}</p>
        </div>
      </div>
    );
  }

  // Empty state - no classes and no schedules at all
  if (classes.length === 0 && schedules.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <div className="text-center text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">{t('classesListTab.noClassesAssigned')}</p>
          <p className="text-sm mt-1">{t('classesListTab.noClassesDescription')}</p>
        </div>
      </div>
    );
  }

  // Empty state - no classes and no schedules in this time slot
  if (filteredClasses.length === 0 && filteredSchedules.length === 0 && filterStartTime) {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <div className="text-center text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">{t('classesListTab.noClassesInTimeSlot')}</p>
          <p className="text-sm mt-1">
            {t('classesListTab.timeSlot', {
              startTime: filterStartTime,
              endTime: filterEndTime,
              dayOfWeek: filterDayOfWeek
            })}
          </p>
        </div>
      </div>
    );
  }

  // Table view: Combined Classes and PT 1-1 Schedules
  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header with Filter */}
      <div className="space-y-3 px-4 pt-4">
        <div>
          <h3 className="text-lg font-semibold">{t('classesListTab.header', 'Classes Schedule')}</h3>
          {filterStartTime && filterEndTime && (
            <p className="text-sm text-gray-500">
              {filterStartTime} - {filterEndTime}
              {tableRows.length > 0 && ` • ${tableRows.length} ${tableRows.length === 1 ? 'item' : 'items'}`}
            </p>
          )}
        </div>

        {/* Type Filter */}
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val as 'ALL' | 'CLASS' | 'PT_1_1')}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('classesListTab.filter_all', 'All')}</SelectItem>
              <SelectItem value="CLASS">{t('classesListTab.filter_classes', 'Classes')}</SelectItem>
              <SelectItem value="PT_1_1">{t('classesListTab.filter_pt_1_1', 'PT 1-1')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto px-4">
        {/* Loading State */}
        {(loading || schedulesLoading) && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">{t('classesListTab.loading')}</span>
          </div>
        )}

        {/* Error State */}
        {(error || schedulesError) && (
          <div className="flex items-center justify-center py-12 px-4">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            <div className="text-red-600">
              <p className="font-medium">{t('classesListTab.error')}</p>
              <p className="text-sm">
                {(() => {
                  if (error && typeof error === 'object' && 'message' in error) {
                    return String((error as { message: unknown }).message);
                  }
                  if (schedulesError && typeof schedulesError === 'object' && 'message' in schedulesError) {
                    return String((schedulesError as { message: unknown }).message);
                  }
                  return 'Unknown error';
                })()}
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !schedulesLoading && !error && !schedulesError && tableRows.length === 0 && (
          <div className="flex items-center justify-center py-12 px-4">
            <div className="text-center text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">{t('classesListTab.noClassesAssigned')}</p>
              <p className="text-sm mt-1">{t('classesListTab.noClassesDescription')}</p>
            </div>
          </div>
        )}

        {/* Table View */}
        {!loading && !schedulesLoading && !error && !schedulesError && tableRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-gray-600">
                  <th className="text-left py-2 px-3">{t('classesListTab.table_header_name', 'Name')}</th>
                  <th className="text-left py-2 px-3">{t('classesListTab.table_header_trainers', 'Trainers')}</th>
                  <th className="text-left py-2 px-3">{t('classesListTab.table_header_time', 'Time')}</th>
                  <th className="text-center py-2 px-3">{t('classesListTab.table_header_customers', 'Customers')}</th>
                  <th className="text-center py-2 px-3">{t('classesListTab.table_header_capacity', 'Capacity')}</th>
                  <th className="text-center py-2 px-3">{t('classesListTab.table_header_type', 'Type')}</th>
                  <th className="text-center py-2 px-3">{t('classesListTab.table_header_status', 'Status')}</th>
                  <th className="text-center py-2 px-3">{t('classesListTab.table_header_actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      if (row.type === 'CLASS') {
                        onClassClick?.(row.id);
                      } else {
                        onScheduleClick?.(row.id);
                      }
                    }}
                  >
                    <td className="py-3 px-3 font-medium">
                      <div className="flex items-center gap-2">
                        {row.type === 'PT_1_1' && <User className="h-4 w-4 text-orange-500 flex-shrink-0" />}
                        {row.type === 'CLASS' && <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                        <span>{row.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-600">{row.trainers}</td>
                    <td className="py-3 px-3 text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium">{row.time}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-gray-600">
                      <span className="text-sm">{row.customers}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-sm font-medium">{row.capacity}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge
                        variant="outline"
                        className={
                          row.type === 'PT_1_1'
                            ? 'bg-orange-100 text-orange-800 border-orange-200'
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        }
                      >
                        {row.type === 'PT_1_1'
                          ? t('classesListTab.type_pt_1_1', 'PT 1-1')
                          : t('classesListTab.type_class', 'Class')}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.status === 'ACTIVE' || row.status === 'SCHEDULED'
                            ? 'bg-green-100 text-green-800'
                            : row.status === 'CANCELLED' || row.status === 'INACTIVE'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.type === 'PT_1_1' &&
                        row.customerId &&
                        row.serviceContractId &&
                        row.scheduleDate &&
                        (() => {
                          // Key bao gồm cả ngày để check progress theo ngày cụ thể
                          const scheduleDate = new Date(row.scheduleDate);
                          const dateStr = scheduleDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
                          const key = `${row.customerId}-${row.serviceContractId}-${dateStr}`;
                          const hasProgress = progressCheckMap[key];
                          const isChecking = checkingProgress[key];

                          // Show button if no progress exists for this specific date
                          // (or if still checking and no progress found yet)
                          if (hasProgress === false || (isChecking && hasProgress === undefined)) {
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={(e) => handleAddProgress(e, row)}
                                disabled={isChecking}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {t('classesListTab.add_progress', 'Add Progress')}
                              </Button>
                            );
                          }
                          return null;
                        })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {!loading && !schedulesLoading && tableRows.length > 0 && (
        <div className="border-t pt-3 px-4 pb-4 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>{t('classesListTab.total_enrolled', 'Total Enrolled')}</span>
            <span className="font-medium">
              {totalStats.totalEnrolled}/{totalStats.totalCapacity}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Individual class card component
 * @deprecated Currently unused, kept for future reference
 */
interface ClassCardProps {
  classItem: Class;
  t: (key: string) => string;
}

// @ts-expect-error - Component kept for future reference
const _ClassCard: React.FC<ClassCardProps> = ({ classItem, t }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getCapacityStatus = () => {
    const total = classItem.activeEnrollment + (classItem.inactiveEnrollment || 0);
    const isFull = total >= classItem.capacity;
    return {
      isFull,
      text: `${total}/${classItem.capacity}`
    };
  };

  const capacityStatus = getCapacityStatus();

  // Format time range
  const timeRange = classItem.schedulePattern
    ? `${classItem.schedulePattern.startTime} - ${classItem.schedulePattern.endTime}`
    : 'N/A';

  // Format days of week
  const daysOfWeek = classItem.schedulePattern?.daysOfWeek?.join(', ') || 'N/A';

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white hover:bg-gray-50">
      {/* Header: Name and Status */}
      <div className="flex justify-between items-start mb-3 gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-gray-900 truncate">{classItem.name}</h3>
          {classItem.description && <p className="text-xs text-gray-600 line-clamp-2 mt-1">{classItem.description}</p>}
        </div>
        <Badge variant="outline" className={`flex-shrink-0 ${getStatusColor(classItem.status)}`}>
          {t(`classesListTab.classCard.status.${classItem.status}`) || classItem.status}
        </Badge>
      </div>

      {/* Service Package and Branch */}
      <div className="space-y-2 mb-3 text-sm">
        {classItem.servicePackageId && typeof classItem.servicePackageId === 'object' && (
          <div>
            <span className="text-gray-600 font-medium">{t('classesListTab.classCard.package')}: </span>
            <span className="text-gray-900">{classItem.servicePackageId.name}</span>
          </div>
        )}
        {classItem.branchId && typeof classItem.branchId === 'object' && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-900">{classItem.branchId.branchName}</span>
          </div>
        )}
      </div>

      {/* Schedule Information */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Time */}
        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-600 font-medium">{t('classesListTab.classCard.time')}</p>
            <p className="text-sm font-semibold text-gray-900">{timeRange}</p>
          </div>
        </div>

        {/* Days */}
        <div>
          <p className="text-xs text-gray-600 font-medium">{t('classesListTab.classCard.days')}</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{daysOfWeek}</p>
        </div>

        {/* Members */}
        <div className="flex items-start gap-2">
          <Users className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-600 font-medium">{t('classesListTab.classCard.members')}</p>
            <p className={`text-sm font-semibold ${capacityStatus.isFull ? 'text-red-600' : 'text-gray-900'}`}>
              {capacityStatus.text}
            </p>
          </div>
        </div>

        {/* Type */}
        <div>
          <p className="text-xs text-gray-600 font-medium">{t('classesListTab.classCard.type')}</p>
          <p className="text-sm font-semibold text-gray-900 capitalize">
            {typeof classItem.servicePackageId === 'object'
              ? classItem.servicePackageId.type?.toLowerCase() || 'N/A'
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Class Period */}
      {(classItem.startDate || classItem.endDate) && (
        <div className="text-xs text-gray-600 space-y-1">
          {classItem.startDate && (
            <p>
              <span className="font-medium">{t('classesListTab.classCard.start')}: </span>
              {new Date(classItem.startDate).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
            </p>
          )}
          {classItem.endDate && (
            <p>
              <span className="font-medium">{t('classesListTab.classCard.end')}: </span>
              {new Date(classItem.endDate).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
            </p>
          )}
        </div>
      )}

      {/* Capacity Warning */}
      {capacityStatus.isFull && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          ⚠️ {t('classesListTab.classCard.fullCapacity')}
        </div>
      )}
    </div>
  );
};

/**
 * Individual schedule card component for PT 1-1 schedules
 * @deprecated Currently unused, kept for future reference
 */
interface ScheduleCardProps {
  schedule: Schedule;
  t: (key: string) => string;
}

// @ts-expect-error - Component kept for future reference
const _ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule, t }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    // Remove seconds if present (HH:MM:SS -> HH:MM)
    return timeString.substring(0, 5);
  };

  // Schedule API returns timeRange with startTime and endTime, but we need to check both
  const startTime = schedule.timeRange?.startTime || '';
  const endTime = schedule.timeRange?.endTime || '';
  const ptName = schedule.ptId?.userId?.fullName || 'PT';
  const branchName = typeof schedule.branchId === 'object' ? schedule.branchId.branchName : 'N/A';

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border-orange-200">
      {/* Header: Name and Status */}
      <div className="flex justify-between items-start mb-3 gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-gray-900 truncate flex items-center gap-2">
            <User className="h-4 w-4 text-orange-600 flex-shrink-0" />
            {schedule.name || `PT 1-1 - ${ptName}`}
          </h3>
          {schedule.notes && <p className="text-xs text-gray-600 line-clamp-2 mt-1">{schedule.notes}</p>}
        </div>
        <Badge variant="outline" className={`flex-shrink-0 ${getStatusColor(schedule.status)}`}>
          {t(`schedule.status.${schedule.status.toLowerCase()}`) || schedule.status}
        </Badge>
      </div>

      {/* Date and Time */}
      <div className="space-y-2 mb-3 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-orange-500 flex-shrink-0" />
          <span className="text-gray-900 font-medium">{formatDate(schedule.scheduleDate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
          <span className="text-gray-900 font-semibold">
            {formatTime(startTime)} - {formatTime(endTime)}
          </span>
        </div>
        {branchName && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-900">{branchName}</span>
          </div>
        )}
      </div>

      {/* Capacity */}
      <div className="flex items-center gap-2 text-sm">
        <Users className="h-4 w-4 text-gray-500" />
        <span className="text-gray-600 font-medium">{t('schedule.capacity')}: </span>
        <span
          className={`font-semibold ${schedule.currentBookings >= schedule.maxCapacity ? 'text-red-600' : 'text-gray-900'}`}
        >
          {schedule.currentBookings}/{schedule.maxCapacity}
        </span>
      </div>

      {/* Capacity Warning */}
      {schedule.currentBookings >= schedule.maxCapacity && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          ⚠️ {t('schedule.fullCapacity')}
        </div>
      )}
    </div>
  );
};

export default ClassesListTab;
