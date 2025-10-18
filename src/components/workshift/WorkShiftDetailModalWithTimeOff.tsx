import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, User, MapPin, CheckCircle, Loader2, Ban } from 'lucide-react';
import type { UpdateWorkShiftRequest, WorkShiftStatus, WorkShiftDetailModalProps } from '@/types/api/WorkShift';
import { workShiftApi } from '@/services/api/workShiftApi';
import TimeOffRequestTab from '@/components/timeoff/TimeOffRequestTab';
import RescheduleTab from '@/components/reschedule/RescheduleTab';

interface WorkShiftDetailModalWithTimeOffProps extends WorkShiftDetailModalProps {
  selectedDate?: Date;
  onTimeOffChange?: () => void;
}

const WorkShiftDetailModalWithTimeOff: React.FC<WorkShiftDetailModalWithTimeOffProps> = ({
  isOpen,
  onClose,
  workShift,
  onUpdate,
  selectedDate,
  onTimeOffChange
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [showConfirmDisable, setShowConfirmDisable] = useState(false);
  const [_error, setError] = useState<string | null>(null);
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
      // Reset loading states when workShift changes
      setIsDisabling(false);
      setIsLoading(false);
      setShowConfirmDisable(false);
    }
  }, [workShift, t]);

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
    } else {
      setError(response.message || t('workshift.error_updating_shift'));
    }
    setIsLoading(false);
  };

  const handleDisable = async () => {
    if (!workShift) return;

    setIsDisabling(true);
    setError(null);

    const response = await workShiftApi.disableWorkShift(workShift._id);

    if (response.success) {
      onUpdate?.(response.data);
      setShowConfirmDisable(false);
    } else {
      setError(response.message || t('workshift.error_disabling_shift'));
    }
    setIsDisabling(false);
  };

  const handleCancel = () => {
    if (workShift) {
      setFormData({
        startTimeLocal: workShift.startTimeLocal || '',
        endTimeLocal: workShift.endTimeLocal || '',
        status: workShift.status,
        title: `${workShift.staffId?.userId?.fullName || workShift.staffId?.firstName || t('common.unknown')} - ${t('workshift.work_shift')}`
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleTimeOffCreated = () => {
    // Refresh the parent component when time off is created
    onTimeOffChange?.();
  };

  if (!workShift) return null;

  const staffName =
    workShift.staffId?.userId?.fullName ||
    (workShift.staffId?.firstName && workShift.staffId?.lastName
      ? `${workShift.staffId.firstName} ${workShift.staffId.lastName}`
      : t('common.unknown'));

  const branchName = workShift.branchId?.branchName || t('common.unknown');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
        <DialogTitle className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-4 mb-6">
          {staffName} - {t('workshift.work_shift')}
        </DialogTitle>

        <Tabs defaultValue="workshift" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="workshift">{t('workshift.work_shift')}</TabsTrigger>
            <TabsTrigger value="reschedule">Reschedule</TabsTrigger>
            <TabsTrigger value="timeoff">{t('timeoff.out_of_office')}</TabsTrigger>
          </TabsList>

          <TabsContent value="workshift" className="space-y-6">
            {/* Status Section */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">{t('workshift.status')}</p>
                <p className="text-lg font-bold text-green-600">
                  {isEditing ? (
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as WorkShiftStatus }))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm font-bold"
                    >
                      <option value="SCHEDULED">{t('workshift.status.scheduled')}</option>
                      <option value="CANCELLED">{t('workshift.status.cancelled')}</option>
                    </select>
                  ) : (
                    t(`workshift.status.${workShift.status.toLowerCase()}`)
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
                        {new Date(workShift.startTime).toLocaleDateString('en-US', {
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
                              onChange={(e) => setFormData((prev) => ({ ...prev, startTimeLocal: e.target.value }))}
                              className="border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                              type="time"
                              value={formData.endTimeLocal}
                              onChange={(e) => setFormData((prev) => ({ ...prev, endTimeLocal: e.target.value }))}
                              className="border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                          </div>
                        ) : (
                          `${workShift.startTimeLocal || '08:00'} - ${workShift.endTimeLocal || '11:00'}`
                        )}
                      </p>
                      <p className="text-sm text-gray-500">Timezone: UTC • No Repeat</p>
                    </div>
                  </div>
                </div>

                {/* Employee Information */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{staffName}</p>
                      <p className="text-sm text-gray-500">{workShift.staffId?.jobTitle || t('common.unknown')}</p>
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
                      <p className="text-sm text-gray-500">{workShift.branchId?.location || t('common.unknown')}</p>
                      <p className="text-sm text-gray-500">Timezone: UTC</p>
                    </div>
                  </div>
                </div>

                {/* Calendar Details */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{staffName} (UTC)</p>
                      <p className="text-sm text-gray-500">Busy • Default visibility • Notify 10 minutes before</p>
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
                    {workShift.status === 'SCHEDULED' && (
                      <Button
                        onClick={() => setShowConfirmDisable(true)}
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        {t('workshift.disable')}
                      </Button>
                    )}
                    <Button variant="outline" onClick={onClose} className="border-gray-300 text-gray-700">
                      {t('common.close')}
                    </Button>
                    <Button onClick={() => setIsEditing(true)} className="bg-orange-600 hover:bg-orange-700 text-white">
                      {t('common.edit')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reschedule" className="space-y-6">
            {/* Reschedule Tab */}
            <RescheduleTab workShift={workShift} onClose={onClose} />
          </TabsContent>

          <TabsContent value="timeoff" className="space-y-6">
            {/* Time Off Request Tab */}
            {(() => {
              // Prioritize workshift date over selectedDate
              const effectiveSelectedDate = workShift ? new Date(workShift.startTime) : selectedDate || new Date();
              return (
                <TimeOffRequestTab
                  staffId={workShift.staffId?._id || ''}
                  selectedDate={effectiveSelectedDate}
                  onTimeOffCreated={handleTimeOffCreated}
                />
              );
            })()}
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
                    {workShift.startTimeLocal || '08:00'} - {workShift.endTimeLocal || '11:00'}
                  </p>
                  <p className="text-gray-500">
                    {new Date(workShift.startTime).toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
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
      </DialogContent>
    </Dialog>
  );
};

export default WorkShiftDetailModalWithTimeOff;
