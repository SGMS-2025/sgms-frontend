import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar, Clock, User, MapPin, CheckCircle, Loader2, Ban } from 'lucide-react';
import type { UpdateWorkShiftRequest, WorkShiftStatus, WorkShiftDetailModalProps } from '@/types/api/WorkShift';
import { workShiftApi } from '@/services/api/workShiftApi';

const WorkShiftDetailModal: React.FC<WorkShiftDetailModalProps> = ({
  isOpen,
  onClose,
  workShift,
  onEdit,
  onUpdate
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [showConfirmDisable, setShowConfirmDisable] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // Initialize form data when workShift changes
  useEffect(() => {
    if (workShift) {
      setFormData({
        startTimeLocal: workShift.startTimeLocal || '',
        endTimeLocal: workShift.endTimeLocal || '',
        status: workShift.status,
        title: `${workShift.staffId?.userId?.fullName || workShift.staffId?.firstName || t('common.unknown')} - ${t('workshift.work_shift')}`
      });
      setError(null);
    }
  }, [workShift, t]);

  const handleSave = async () => {
    if (!workShift) return;

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
        const originalStartDate = new Date(workShift.startTime);
        const originalEndDate = new Date(workShift.endTime);

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

    const response = await workShiftApi.updateWorkShift(workShift._id, updateData);

    if (response.success) {
      onUpdate?.(response.data);
      setIsEditing(false);
      onClose();
    } else {
      setError(response.message || t('workshift.update_error'));
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    // Reset form data to original values
    if (workShift) {
      setFormData({
        startTimeLocal: workShift.startTimeLocal || '',
        endTimeLocal: workShift.endTimeLocal || '',
        status: workShift.status,
        title: `${workShift.staffId?.userId?.fullName || workShift.staffId?.firstName || t('common.unknown')} - ${t('workshift.work_shift')}`
      });
    }
  };

  const handleDisable = async () => {
    if (!workShift) return;

    setIsDisabling(true);
    setError(null);

    const response = await workShiftApi.disableWorkShift(workShift._id);

    if (response.success) {
      onUpdate?.(response.data);
      setShowConfirmDisable(false);
      onClose();
    } else {
      setError(response.message || t('workshift.disable_error'));
    }
  };

  if (!workShift) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return t('common.not_available');
    const [hour, minute] = timeString.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    let displayHour = hour;
    if (hour === 0) {
      displayHour = 12;
    } else if (hour > 12) {
      displayHour = hour - 12;
    }
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const getDayOfWeek = (day: string) => {
    const days = {
      MONDAY: t('common.days.monday'),
      TUESDAY: t('common.days.tuesday'),
      WEDNESDAY: t('common.days.wednesday'),
      THURSDAY: t('common.days.thursday'),
      FRIDAY: t('common.days.friday'),
      SATURDAY: t('common.days.saturday'),
      SUNDAY: t('common.days.sunday')
    };
    return days[day as keyof typeof days] || day;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="overflow-y-auto p-0"
          style={{
            width: '800px',
            height: '550px',
            maxWidth: '100vw',
            maxHeight: '100vh'
          }}
        >
          <DialogTitle className="sr-only">
            {workShift
              ? `${workShift.staffId?.userId?.fullName || workShift.staffId?.firstName || t('common.unknown')} - ${t('workshift.work_shift')}`
              : t('workshift.details')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEditing ? t('workshift.edit_details') : t('workshift.view_details')}
          </DialogDescription>
          {/* Title Input Field */}
          <div className="p-4 border-b">
            <input
              type="text"
              placeholder={t('workshift.add_title')}
              value={
                formData.title ||
                `${workShift.staffId?.userId?.fullName || workShift.staffId?.firstName || t('common.unknown')} - ${t('workshift.work_shift')}`
              }
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              disabled={!isEditing}
              className={`w-full text-lg font-medium border-none outline-none bg-transparent placeholder-gray-500 ${!isEditing ? 'cursor-default' : 'border-b border-gray-300 focus:border-orange-500'}`}
            />
          </div>
          {/* Event Type Tabs */}
          <div className="flex gap-1 p-2 border-b">
            <button className="px-3 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">Event</button>
            <button className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-full text-sm font-medium">Task</button>
            <button className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-full text-sm font-medium">
              Out of office
            </button>
            <button className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-full text-sm font-medium">
              Focus time
            </button>
            <button className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-full text-sm font-medium">
              Working location
            </button>
            <button className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-full text-sm font-medium">
              Appointment schedule
            </button>
          </div>
          {/* Status Section - Top */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{t('workshift.status')}</div>
                {isEditing ? (
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as WorkShiftStatus }))}
                    className="mt-1 text-sm font-semibold bg-white border border-gray-300 rounded px-2 py-1 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                ) : (
                  <div className="text-sm text-green-600 font-semibold">{workShift.status}</div>
                )}
              </div>
            </div>
          </div>
          {/* Main Content - 3 Column Layout */}
          <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Column 1 - Basic Info */}
              <div className="space-y-4">
                {/* Date and Time Field */}
                <div className="flex items-start gap-3 py-2 hover:bg-gray-50 rounded cursor-pointer">
                  <Clock className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-900">
                          {getDayOfWeek(workShift.dayOfTheWeek)},{' '}
                          {workShift.startTimeFmt
                            ? workShift.startTimeFmt.split(' ')[1]
                            : formatDate(workShift.startTime)}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="time"
                            value={formData.startTimeLocal || workShift.startTimeLocal || ''}
                            onChange={(e) => setFormData((prev) => ({ ...prev, startTimeLocal: e.target.value }))}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:border-orange-500 focus:outline-none"
                          />
                          <span className="text-sm text-gray-600 self-center">-</span>
                          <input
                            type="time"
                            value={formData.endTimeLocal || workShift.endTimeLocal || ''}
                            onChange={(e) => setFormData((prev) => ({ ...prev, endTimeLocal: e.target.value }))}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {t('workshift.timezone')}: {workShift.branchTz || 'UTC'} • {t('workshift.no_repeat')}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm font-medium text-gray-900">
                          {getDayOfWeek(workShift.dayOfTheWeek)},{' '}
                          {workShift.startTimeFmt
                            ? workShift.startTimeFmt.split(' ')[1]
                            : formatDate(workShift.startTime)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {workShift.startTimeLocal && workShift.endTimeLocal ? (
                            <>
                              {formatTime(workShift.startTimeLocal)} - {formatTime(workShift.endTimeLocal)}
                            </>
                          ) : (
                            <>
                              {formatTime(workShift.startTime)} - {formatTime(workShift.endTime)}
                            </>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {t('workshift.timezone')}: {workShift.branchTz || 'UTC'} • {t('workshift.no_repeat')}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Staff Field */}
                <button
                  className="flex items-start gap-3 py-2 hover:bg-gray-50 rounded cursor-pointer w-full text-left"
                  onClick={() => onEdit?.(workShift)}
                >
                  <User className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {workShift.staffId?.userId?.fullName ||
                        (workShift.staffId?.firstName && workShift.staffId?.lastName
                          ? `${workShift.staffId.firstName} ${workShift.staffId.lastName}`
                          : t('common.unknown_staff'))}
                    </div>
                    <div className="text-sm text-gray-600">{workShift.staffId?.jobTitle || t('common.staff')}</div>
                  </div>
                </button>
              </div>

              {/* Column 2 - Location, Branch & Additional */}
              <div className="space-y-4">
                {/* Branch Field */}
                <div className="flex items-start gap-3 py-2 hover:bg-gray-50 rounded cursor-pointer">
                  <MapPin className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {typeof workShift.branchId === 'string'
                        ? t('common.branch')
                        : workShift.branchId?.name || t('common.branch')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {typeof workShift.branchId === 'string'
                        ? t('workshift.branch_address')
                        : workShift.branchId?.location || t('workshift.branch_address')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {t('workshift.timezone')}: {workShift.branchTz || 'UTC'}
                    </div>
                  </div>
                </div>

                {/* Calendar Info Field */}
                <div className="flex items-start gap-3 py-2 hover:bg-gray-50 rounded cursor-pointer">
                  <Calendar className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {workShift.staffId?.userId?.fullName ||
                        (workShift.staffId?.firstName && workShift.staffId?.lastName
                          ? `${workShift.staffId.firstName} ${workShift.staffId.lastName}`
                          : t('common.unknown_staff'))}{' '}
                      ({workShift.branchTz || 'UTC'})
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Busy • Default visibility • Notify 10 minutes before
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Footer - Google Calendar Style */}
          <div className="flex justify-between items-center p-4 border-t">
            <div className="flex gap-2">
              <button className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                {t('common.more_options')}
              </button>
              {!isEditing && workShift.status !== 'CANCELLED' && workShift.status !== 'COMPLETED' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                  onClick={() => setShowConfirmDisable(true)}
                  disabled={isDisabling}
                >
                  <Ban className="h-4 w-4 mr-1" />
                  {t('workshift.disable')}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={handleSave}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('common.saving')}
                      </>
                    ) : (
                      t('common.save')
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => setIsEditing(true)}>
                    {t('common.edit')}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 pb-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="text-sm text-red-600">{error}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Disable */}
      {showConfirmDisable && (
        <Dialog open={showConfirmDisable} onOpenChange={setShowConfirmDisable}>
          <DialogContent className="max-w-md">
            <DialogTitle>{t('workshift.disable_work_shift')}</DialogTitle>
            <DialogDescription>{t('workshift.disable_confirmation')}</DialogDescription>

            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm font-medium text-gray-900">
                  {workShift?.staffId?.userId?.fullName || t('common.unknown_staff')}
                </div>
                <div className="text-sm text-gray-600">
                  {workShift?.startTimeLocal && workShift?.endTimeLocal ? (
                    <>
                      {formatTime(workShift.startTimeLocal)} - {formatTime(workShift.endTimeLocal)}
                    </>
                  ) : (
                    <>
                      {formatTime(workShift?.startTime || '')} - {formatTime(workShift?.endTime || '')}
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {workShift?.dayOfTheWeek && getDayOfWeek(workShift.dayOfTheWeek)}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowConfirmDisable(false)} disabled={isDisabling}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDisable} disabled={isDisabling}>
                  {isDisabling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Disabling...
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4 mr-2" />
                      {t('workshift.disable')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default WorkShiftDetailModal;
