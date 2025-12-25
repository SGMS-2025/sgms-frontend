import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, User, MapPin, CheckCircle, Loader2, Ban, AlertCircle } from 'lucide-react';
import type {
  UpdateWorkShiftRequest,
  WorkShiftStatus,
  WorkShiftDetailModalProps,
  WorkShift,
  VirtualWorkShift
} from '@/types/api/WorkShift';
import { workShiftApi } from '@/services/api/workShiftApi';
import TimeOffRequestTab from '@/components/timeoff/TimeOffRequestTab';
import { useEnsureWorkShift } from '@/hooks/useEnsureWorkShift';
import { useBranchWorkingConfig } from '@/hooks/useBranchWorkingConfig';
import { isVirtualWorkShift, getDateFromWorkShiftStartTime } from '@/utils/workshiftUtils';
import { formatInVietnam } from '@/utils/datetime';
import { useAuthState } from '@/hooks/useAuth';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { useClassesByTrainer } from '@/hooks/useClassesByTrainer';
import { usePTSchedules } from '@/hooks/usePTSchedules';
import { ClassesListTab } from './tabs/ClassesListTab';
import { ClassDetailModal } from './modals/ClassDetailModal';

interface WorkShiftDetailModalWithTimeOffProps extends WorkShiftDetailModalProps {
  selectedDate?: Date;
  onTimeOffChange?: () => void;
  userRole?: string;
}

const WorkShiftDetailModalWithTimeOff: React.FC<WorkShiftDetailModalWithTimeOffProps> = ({
  isOpen,
  onClose,
  workShift,
  onUpdate,
  selectedDate,
  onTimeOffChange,
  userRole
}) => {
  const { t } = useTranslation();
  const { ensureWorkShiftExists, isCreating: isEnsuringWorkshift } = useEnsureWorkShift();
  const { user } = useAuthState();
  const { currentStaff } = useCurrentUserStaff();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [showConfirmDisable, setShowConfirmDisable] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [currentWorkShift, setCurrentWorkShift] = useState<WorkShift | VirtualWorkShift | null>(workShift);
  const [activeTabValue, setActiveTabValue] = useState('workshift');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showClassDetail, setShowClassDetail] = useState(false);

  // Check if current user is a Personal Trainer
  const isPT = useMemo(() => {
    return user?.role === 'STAFF' && currentStaff?.jobTitle === 'Personal Trainer';
  }, [user?.role, currentStaff?.jobTitle]);

  // Fetch classes for PT
  const classesResult = useClassesByTrainer(
    isPT && activeTabValue === 'classes' && isOpen ? workShift?.staffId?._id : null
  );

  const classes = classesResult?.classes || [];
  const classesLoading = classesResult?.loading || false;
  const classesError = classesResult?.error || null;

  // Fetch PT 1-1 schedules for PT
  const schedulesResult = usePTSchedules(
    isPT && activeTabValue === 'classes' && isOpen ? workShift?.staffId?._id : null,
    {
      type: 'PERSONAL_TRAINING',
      enabled: isPT && activeTabValue === 'classes' && isOpen
    }
  );

  const schedules = schedulesResult?.schedules || [];
  const schedulesLoading = schedulesResult?.loading || false;
  const schedulesError = schedulesResult?.error || null;

  // Get branch working config to auto-adjust endTime
  const branchId = currentWorkShift?.branchId?._id;
  const { config: branchConfig } = useBranchWorkingConfig(branchId);

  // Find slot config that contains the work shift time
  // This is used to display the correct time range (slot time) instead of work shift time
  const slotConfig = useMemo(() => {
    if (!branchConfig?.defaultShifts || !currentWorkShift?.startTimeLocal) {
      return null;
    }

    const shiftStartTime = currentWorkShift.startTimeLocal;
    const [shiftStartHour, shiftStartMin] = shiftStartTime.split(':').map(Number);
    const shiftStartMinutes = shiftStartHour * 60 + shiftStartMin;

    // Find slot that contains this work shift time
    return branchConfig.defaultShifts.find((slot) => {
      if (!slot.startTime || !slot.endTime) return false;

      const [slotStartHour, slotStartMin] = slot.startTime.split(':').map(Number);
      const [slotEndHour, slotEndMin] = slot.endTime.split(':').map(Number);
      const slotStartMinutes = slotStartHour * 60 + slotStartMin;
      const slotEndMinutes = slotEndHour * 60 + slotEndMin;

      // Check if work shift start time is within slot range
      return shiftStartMinutes >= slotStartMinutes && shiftStartMinutes < slotEndMinutes;
    });
  }, [branchConfig?.defaultShifts, currentWorkShift?.startTimeLocal]);
  const [formData, setFormData] = useState<{
    startTimeLocal?: string;
    endTimeLocal?: string;
    status: WorkShiftStatus;
    title?: string;
  }>({
    startTimeLocal: '',
    endTimeLocal: '',
    status: 'SCHEDULED'
  });

  // Update currentWorkShift when workShift prop changes
  useEffect(() => {
    setCurrentWorkShift(workShift);
  }, [workShift]);

  // Initialize form data when currentWorkShift changes
  useEffect(() => {
    if (currentWorkShift) {
      setFormData({
        startTimeLocal: currentWorkShift.startTimeLocal || '',
        endTimeLocal: currentWorkShift.endTimeLocal || '',
        status: currentWorkShift.status,
        title: `${currentWorkShift.staffId?.userId?.fullName || currentWorkShift.staffId?.firstName || t('common.unknown')} - ${t('workshift.work_shift')}`
      });
      setError(null);
      // Reset loading states when workShift changes
      setIsDisabling(false);
      setIsLoading(false);
      setShowConfirmDisable(false);
    }
  }, [currentWorkShift, t]);

  // Only fetch once when modal opens, not continuously
  const hasFetchedRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (isOpen && workShift?._id) {
      // Chỉ fetch cho real shifts (không phải virtual)
      if (!isVirtualWorkShift(workShift)) {
        const workshiftKey = `${workShift._id}-${isOpen}`;
        if (hasFetchedRef.current !== workshiftKey) {
          hasFetchedRef.current = workshiftKey;
          const fetchLatestWorkShift = async () => {
            try {
              const response = await workShiftApi.getWorkShiftById(workShift._id);
              if (response.success && response.data) {
                setCurrentWorkShift(response.data);
                onUpdate?.(response.data);
              }
            } catch (error) {
              console.error('Failed to fetch latest workshift:', error);
              setCurrentWorkShift(workShift);
            }
          };
          fetchLatestWorkShift();
        }
      } else {
        setCurrentWorkShift(workShift);
      }
    } else if (!isOpen) {
      hasFetchedRef.current = null;
    }
  }, [isOpen, workShift?._id]); // Đã loại bỏ onUpdate để tránh infinite loop

  // Reset states when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setIsDisabling(false);
      setIsLoading(false);
      setShowConfirmDisable(false);
      setError(null);
      setIsEditing(false);
    } else {
      // Reset states when modal opens to ensure clean state
      setIsDisabling(false);
      setIsLoading(false);
      setShowConfirmDisable(false);
      setError(null);
      setIsEditing(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!currentWorkShift) return;

    if (isVirtualWorkShift(currentWorkShift)) {
      setError(t('workshift.error_virtual_workshift_cannot_edit'));
      return;
    }

    setIsLoading(true);
    setError(null);

    // Convert local time to UTC format for backend
    const prepareUpdateData = () => {
      const updateData: UpdateWorkShiftRequest = {
        status: formData.status
      };

      // Only include time fields if they were actually changed
      if (formData.startTimeLocal && formData.endTimeLocal) {
        // Create full datetime strings by combining with the original date
        const originalStartDate = new Date(currentWorkShift.startTime);
        const originalEndDate = new Date(currentWorkShift.endTime);

        // Parse the local time and create new datetime
        const [startHour, startMin] = formData.startTimeLocal.split(':').map(Number);
        const [endHour, endMin] = formData.endTimeLocal.split(':').map(Number);

        // Create new datetime with the same date but new time
        const newStartTime = new Date(originalStartDate);
        newStartTime.setHours(startHour, startMin, 0, 0);

        const newEndTime = new Date(originalEndDate);
        newEndTime.setHours(endHour, endMin, 0, 0);

        // Convert to ISO string for backend
        updateData.startTime = newStartTime.toISOString();
        updateData.endTime = newEndTime.toISOString();
      }

      return updateData;
    };

    const updateData = prepareUpdateData();
    const response = await workShiftApi.updateWorkShift(currentWorkShift._id, updateData);

    if (response.success) {
      onUpdate?.(response.data);
      setIsEditing(false);
    } else {
      setError(response.message || t('workshift.error_updating_shift'));
    }
    setIsLoading(false);
  };

  const handleDisable = async () => {
    if (!currentWorkShift) return;

    if (isVirtualWorkShift(currentWorkShift)) {
      setError(t('workshift.error_virtual_workshift_cannot_disable'));
      return;
    }

    setIsDisabling(true);
    setError(null);

    const response = await workShiftApi.disableWorkShift(currentWorkShift._id);

    if (response.success) {
      onUpdate?.(response.data);
      setShowConfirmDisable(false);
    } else {
      setError(response.message || t('workshift.error_disabling_shift'));
    }
    setIsDisabling(false);
  };

  const handleCancel = () => {
    if (currentWorkShift) {
      setFormData({
        startTimeLocal: currentWorkShift.startTimeLocal || '',
        endTimeLocal: currentWorkShift.endTimeLocal || '',
        status: currentWorkShift.status,
        title: `${currentWorkShift.staffId?.userId?.fullName || currentWorkShift.staffId?.firstName || t('common.unknown')} - ${t('workshift.work_shift')}`
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleEnsureWorkshift = async (): Promise<WorkShift | null> => {
    if (!currentWorkShift) return null;

    const realWorkShift = await ensureWorkShiftExists(currentWorkShift);
    if (realWorkShift) {
      setCurrentWorkShift(realWorkShift);
      onUpdate?.(realWorkShift);
      return realWorkShift;
    }
    return null;
  };

  const handleTimeOffCreated = async () => {
    // Refresh the parent component when time off is created
    await onTimeOffChange?.();

    if (currentWorkShift?._id) {
      hasFetchedRef.current = null;
    }
  };

  if (!currentWorkShift) return null;

  // Helper function to get status icon and color
  const getStatusInfo = (status: WorkShiftStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' };
      case 'PENDING_TIME_OFF':
        return { icon: AlertCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
      case 'CANCELLED':
        return { icon: Ban, color: 'text-red-600', bgColor: 'bg-red-50' };
      case 'IN_PROGRESS':
        return { icon: Loader2, color: 'text-blue-600', bgColor: 'bg-blue-50' };
      case 'COMPLETED':
        return { icon: CheckCircle, color: 'text-gray-600', bgColor: 'bg-gray-50' };
      default:
        return { icon: CheckCircle, color: 'text-gray-600', bgColor: 'bg-gray-50' };
    }
  };

  const statusInfo = getStatusInfo(currentWorkShift.status || 'SCHEDULED');
  const StatusIcon = statusInfo.icon;

  const staffName =
    currentWorkShift.staffId?.userId?.fullName ||
    (currentWorkShift.staffId?.firstName && currentWorkShift.staffId?.lastName
      ? `${currentWorkShift.staffId.firstName} ${currentWorkShift.staffId.lastName}`
      : t('common.unknown'));

  const branchName = currentWorkShift.branchId?.branchName || t('common.unknown');
  const isVirtual = isVirtualWorkShift(currentWorkShift);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
        <DialogTitle className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-4 mb-6">
          {staffName} - {t('workshift.work_shift')}
        </DialogTitle>

        <Tabs value={activeTabValue} onValueChange={setActiveTabValue} className="w-full">
          <TabsList className={`grid w-full ${isPT ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="workshift">{t('workshift.work_shift')}</TabsTrigger>
            {isPT && <TabsTrigger value="classes">My Classes</TabsTrigger>}
            <TabsTrigger value="timeoff">{t('timeoff.out_of_office')}</TabsTrigger>
          </TabsList>

          <TabsContent value="workshift" className="space-y-6">
            {/* Status Section */}
            <div className={`flex items-center gap-3 p-4 rounded-lg ${statusInfo.bgColor}`}>
              <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
              <div>
                <p className="font-medium text-gray-900">{t('workshift.status')}</p>
                <p className={`text-lg font-bold ${statusInfo.color}`}>
                  {isEditing ? (
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as WorkShiftStatus }))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm font-bold"
                    >
                      <option value="SCHEDULED">{t('workshift.status.scheduled')}</option>
                      <option value="CANCELLED">{t('workshift.status.cancelled')}</option>
                    </select>
                  ) : currentWorkShift?.status ? (
                    t(`workshift.status.${currentWorkShift.status.toLowerCase()}`)
                  ) : (
                    t('workshift.status.scheduled')
                  )}
                </p>
              </div>
            </div>

            {/* Main Details Section - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Time and Employee */}
              <div className="space-y-4">
                {/* Time and Date */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatInVietnam(currentWorkShift.startTime, {
                          weekday: 'long',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <input
                              type="time"
                              value={formData.startTimeLocal}
                              onChange={(e) => {
                                const newStartTime = e.target.value;
                                // Find matching default shift and auto-adjust endTime
                                let newEndTime = formData.endTimeLocal;
                                if (branchConfig?.defaultShifts && newStartTime) {
                                  const matchingShift = branchConfig.defaultShifts.find(
                                    (shift) => shift.startTime === newStartTime
                                  );
                                  if (matchingShift?.endTime) {
                                    newEndTime = matchingShift.endTime;
                                  }
                                }
                                setFormData((prev) => ({
                                  ...prev,
                                  startTimeLocal: newStartTime,
                                  endTimeLocal: newEndTime
                                }));
                              }}
                              className="border border-gray-300 rounded px-2 py-1 text-sm"
                              disabled={isVirtual}
                            />
                            <span className="text-gray-500">-</span>
                            <input
                              type="time"
                              value={formData.endTimeLocal}
                              onChange={(e) => setFormData((prev) => ({ ...prev, endTimeLocal: e.target.value }))}
                              className="border border-gray-300 rounded px-2 py-1 text-sm"
                              disabled={isVirtual}
                            />
                          </div>
                        ) : (
                          `${currentWorkShift.startTimeLocal || '08:00'} - ${currentWorkShift.endTimeLocal || '11:00'}`
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Employee Information */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{staffName}</p>
                      <p className="text-sm text-gray-500">
                        {currentWorkShift.staffId?.jobTitle || t('common.unknown')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Location and Calendar */}
              <div className="space-y-4">
                {/* Location */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{t('workshift.branch')}</p>
                      <p className="text-lg font-semibold text-gray-900">{branchName}</p>
                      <p className="text-sm text-gray-500">
                        {currentWorkShift.branchId?.location || t('common.unknown')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shift Information - Dynamic */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <p className="font-medium text-gray-900">{t('workshift.shift_information')}</p>

                      {/* Total Hours */}
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="text-gray-600">{t('workshift.total_hours')}:</span>
                        <span className="font-semibold text-gray-900">
                          {(() => {
                            const start = new Date(currentWorkShift.startTime);
                            const end = new Date(currentWorkShift.endTime);
                            const hours = Math.abs(end.getTime() - start.getTime()) / 36e5;
                            return `${hours.toFixed(1)} ${t('workshift.hours')}`;
                          })()}
                        </span>
                      </div>

                      {/* Day of Week */}
                      {currentWorkShift.dayOfTheWeek && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-orange-500" />
                          <span className="text-gray-600">{t('workshift.day_of_week')}:</span>
                          <span className="font-semibold text-gray-900">
                            {t(`workshift.day.${currentWorkShift.dayOfTheWeek.toLowerCase()}`)}
                          </span>
                        </div>
                      )}

                      {/* Shift Type based on time */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">{t('workshift.shift_type')}:</span>
                        <span className="font-semibold text-gray-900">
                          {(() => {
                            const startTime = currentWorkShift.startTimeLocal || '';
                            const [hour] = startTime.split(':').map(Number);
                            if (hour >= 5 && hour < 12) return t('workshift.shift_morning');
                            if (hour >= 12 && hour < 18) return t('workshift.shift_afternoon');
                            if (hour >= 18) return t('workshift.shift_evening');
                            return t('workshift.shift_custom');
                          })()}
                        </span>
                      </div>

                      {/* Created Date - Only for real shifts */}
                      {!isVirtual && currentWorkShift.createdAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">{t('workshift.created_at')}:</span>
                          <span className="text-gray-900">
                            {formatInVietnam(currentWorkShift.createdAt, {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {_error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{_error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-orange-600 hover:text-orange-700 cursor-pointer">{t('common.more_options')}</div>
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {t('common.save')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="border-gray-300 text-gray-700"
                    >
                      {t('common.cancel')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={onClose} className="border-gray-300 text-gray-700">
                      {t('common.close')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Classes Tab - For PT only */}
          {isPT && (
            <TabsContent value="classes" className="space-y-6">
              {ClassesListTab ? (
                <ClassesListTab
                  classes={classes || []}
                  schedules={schedules || []}
                  loading={classesLoading || false}
                  schedulesLoading={schedulesLoading || false}
                  error={classesError || null}
                  schedulesError={schedulesError || null}
                  staffId={workShift?.staffId?._id}
                  filterStartTime={slotConfig?.startTime || currentWorkShift?.startTimeLocal}
                  filterEndTime={slotConfig?.endTime || currentWorkShift?.endTimeLocal}
                  filterDayOfWeek={currentWorkShift?.dayOfTheWeek}
                  filterDate={getDateFromWorkShiftStartTime(currentWorkShift?.startTime, selectedDate)}
                  onClassClick={(classId) => {
                    setSelectedClassId(classId);
                    setShowClassDetail(true);
                  }}
                  onScheduleClick={(scheduleId) => {
                    // TODO: Open schedule detail modal
                    console.log('Schedule clicked:', scheduleId);
                  }}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">Classes component not found</div>
              )}
            </TabsContent>
          )}

          <TabsContent value="timeoff" className="space-y-6">
            {/* Time Off Request Tab */}
            {isEnsuringWorkshift ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                <span className="ml-2 text-gray-600">{t('workshift.creating_workshift')}</span>
              </div>
            ) : (
              <TimeOffRequestTab
                staffId={currentWorkShift.staffId?._id || ''}
                selectedDate={getDateFromWorkShiftStartTime(currentWorkShift?.startTime, selectedDate)}
                onTimeOffCreated={handleTimeOffCreated}
                userRole={userRole}
                workShift={currentWorkShift}
                onEnsureWorkshift={handleEnsureWorkshift}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Disable Confirmation Dialog */}
        {showConfirmDisable && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{t('workshift.confirm_disable')}</h3>
                <button onClick={() => setShowConfirmDisable(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-gray-600 mb-4">{t('workshift.confirm_disable_description')}</p>

              {/* Work Shift Summary Card */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">{staffName}</p>
                  <p className="text-gray-900">
                    {currentWorkShift.startTimeLocal || '08:00'} - {currentWorkShift.endTimeLocal || '11:00'}
                  </p>
                  <p className="text-gray-500">{formatInVietnam(currentWorkShift.startTime, { weekday: 'long' })}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDisable(false)}
                  disabled={isDisabling}
                  className="border-gray-300 text-gray-700"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleDisable}
                  disabled={isDisabling}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDisabling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Ban className="h-4 w-4 mr-2" />}
                  {t('workshift.disable')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Class Detail Modal */}
        <ClassDetailModal
          isOpen={showClassDetail}
          onClose={() => {
            setShowClassDetail(false);
            setSelectedClassId(null);
          }}
          classId={selectedClassId || undefined}
          selectedDate={currentWorkShift?.startTime ? new Date(currentWorkShift.startTime) : selectedDate}
        />
      </DialogContent>
    </Dialog>
  );
};

export default WorkShiftDetailModalWithTimeOff;
