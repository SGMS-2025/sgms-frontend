import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarIcon, Clock, User, AlertCircle, Loader2 } from 'lucide-react';
import { cn, formatDate } from '@/utils/utils';
import { localDateStringYMD, vnTimeToUtcISO } from '@/utils/datetime';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { useTimeOffOperations } from '@/hooks/useTimeOff';
import type {
  CreateTimeOffRequest,
  CreateTimeOffModalProps,
  TimeOffType,
  WorkShiftConflict
} from '@/types/api/TimeOff';

// Create validation schema with translations
const createTimeOffSchema = (t: (key: string) => string) =>
  z
    .object({
      type: z.string().min(1, t('timeoff.validation.type_required')),
      startDate: z.string().min(1, t('timeoff.validation.start_date_required')),
      endDate: z.string().min(1, t('timeoff.validation.end_date_required')),
      reason: z.string().min(10, t('validation.reason_min_length')).max(500, t('validation.reason_max_length'))
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          const startDate = new Date(data.startDate);
          const endDate = new Date(data.endDate);
          return endDate >= startDate;
        }
        return true;
      },
      {
        message: t('timeoff.validation.end_date_after_start'),
        path: ['endDate']
      }
    );

type CreateTimeOffFormData = z.infer<ReturnType<typeof createTimeOffSchema>>;

const getTimeOffTypes = (t: (key: string) => string): { value: TimeOffType; label: string; description: string }[] => [
  { value: 'VACATION', label: t('timeoff.type.vacation'), description: t('timeoff.type.vacation.description') },
  { value: 'SICK_LEAVE', label: t('timeoff.type.sick_leave'), description: t('timeoff.type.sick_leave.description') },
  {
    value: 'PERSONAL_LEAVE',
    label: t('timeoff.type.personal_leave'),
    description: t('timeoff.type.personal_leave.description')
  },
  {
    value: 'UNPAID_LEAVE',
    label: t('timeoff.type.unpaid_leave'),
    description: t('timeoff.type.unpaid_leave.description')
  },
  { value: 'EMERGENCY', label: t('timeoff.type.emergency'), description: t('timeoff.type.emergency.description') },
  { value: 'OTHER', label: t('timeoff.type.other'), description: t('timeoff.type.other.description') }
];

const CreateTimeOffModal: React.FC<CreateTimeOffModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  prefillData,
  hideDateSelection = false,
  workShift,
  onEnsureWorkshift: _onEnsureWorkshift
}) => {
  const { t } = useTranslation();
  const { currentStaff } = useCurrentUserStaff();
  const { createTimeOff, loading } = useTimeOffOperations();

  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>();
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>();
  const [conflictInfo, setConflictInfo] = useState<{
    hasConflicts: boolean;
    conflictCount: number;
    conflictingShifts: WorkShiftConflict[];
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<CreateTimeOffFormData>({
    resolver: zodResolver(createTimeOffSchema(t)),
    defaultValues: {
      type: prefillData?.type || '',
      startDate: prefillData?.startDate || '',
      endDate: prefillData?.endDate || '',
      reason: ''
    }
  });

  const selectedType = watch('type');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset();
      setSelectedStartDate(undefined);
      setSelectedEndDate(undefined);

      // Apply prefill data if available
      if (prefillData) {
        if (prefillData.startDate) {
          const startDate = new Date(prefillData.startDate);
          setSelectedStartDate(startDate);
          setValue('startDate', localDateStringYMD(startDate));
        }
        if (prefillData.endDate) {
          const endDate = new Date(prefillData.endDate);
          setSelectedEndDate(endDate);
          setValue('endDate', localDateStringYMD(endDate));
        }
        if (prefillData.type) {
          setValue('type', prefillData.type);
        }
      }

      // If hideDateSelection is true, use the same date for both start and end
      if (hideDateSelection && prefillData?.startDate) {
        const date = new Date(prefillData.startDate);
        setSelectedStartDate(date);
        setSelectedEndDate(date);
        setValue('startDate', localDateStringYMD(date));
        setValue('endDate', localDateStringYMD(date));
      }
    }
  }, [isOpen, reset, prefillData, setValue, hideDateSelection]);

  // Update form when dates change
  useEffect(() => {
    if (selectedStartDate) {
      setValue('startDate', localDateStringYMD(selectedStartDate));
    }
  }, [selectedStartDate, setValue]);

  useEffect(() => {
    if (selectedEndDate) {
      setValue('endDate', localDateStringYMD(selectedEndDate));
    }
  }, [selectedEndDate, setValue]);

  const onSubmit = async (data: CreateTimeOffFormData) => {
    // Prevent double submission
    if (loading) {
      return;
    }

    if (!currentStaff) {
      return;
    }

    // Convert form data to API format
    // Use workShift times if available, otherwise default to 00:00-23:59
    // ✅ IMPORTANT: Ensure both dates use proper VN time to UTC conversion
    const startTime = workShift?.startTimeLocal || '00:00';
    const endTime = workShift?.endTimeLocal || '23:59';

    // ✅ CRITICAL: If startDate and endDate are the same (single day time-off),
    // use the SAME date string for both conversions
    // This ensures proper UTC conversion without date drift
    const actualEndDate = data.startDate === data.endDate ? data.startDate : data.endDate;

    // ✅ CRITICAL: Convert VN time to UTC for both startDate and endDate
    // Both dates are in YYYY-MM-DD format (VN timezone dates)
    const startDateUTC = vnTimeToUtcISO(data.startDate, startTime);
    let endDateUTC = vnTimeToUtcISO(actualEndDate, endTime);

    // ✅ IMPORTANT: Ensure endDateUTC is always after startDateUTC
    const startDateObj = new Date(startDateUTC);
    const endDateObj = new Date(endDateUTC);

    // If endDateUTC <= startDateUTC, something is wrong - adjust it
    if (endDateObj <= startDateObj) {
      // If same date, ensure endTime is after startTime
      if (data.startDate === data.endDate) {
        // Same date: use endTime from workShift (should be > startTime)
        // If no workShift endTime, use 23:59 for end of day
        const adjustedEndTime = workShift?.endTimeLocal || '23:59';
        endDateUTC = vnTimeToUtcISO(data.startDate, adjustedEndTime);

        // Double check after adjustment
        const adjustedEndDateObj = new Date(endDateUTC);
        if (adjustedEndDateObj <= startDateObj) {
          console.error('⚠️ End date still <= start date after adjustment!', {
            startDate: data.startDate,
            startTime,
            endTime: adjustedEndTime,
            startDateUTC,
            endDateUTC,
            adjustedEndDateUTC: endDateUTC
          });
        }
      } else {
        // Different dates: ensure endDate is properly converted
        const finalEndDateObj = new Date(endDateUTC);
        if (finalEndDateObj <= startDateObj) {
          // This shouldn't happen, but add 1 day if needed
          const adjustedEndDate = new Date(finalEndDateObj);
          adjustedEndDate.setUTCDate(adjustedEndDate.getUTCDate() + 1);
          endDateUTC = adjustedEndDate.toISOString();
        }
      }
    }

    const createData: CreateTimeOffRequest = {
      staffId: currentStaff._id,
      type: data.type as TimeOffType,
      startDate: startDateUTC,
      endDate: endDateUTC,
      reason: data.reason
    };

    const result = await createTimeOff(createData);
    if (result) {
      // Check if result has conflict info (from new API response)
      if (result.hasConflicts !== undefined) {
        setConflictInfo({
          hasConflicts: result.hasConflicts,
          conflictCount: result.conflictCount || 0,
          conflictingShifts: result.conflictingShifts || []
        });
      }

      onSuccess?.();
      onClose();
    }
  };

  const getTypeDescription = (type: string) => {
    const typeInfo = getTimeOffTypes(t).find((t) => t.value === type);
    return typeInfo?.description || '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">{t('timeoff.create_request')}</DialogTitle>
          </div>
          <p className="text-sm text-gray-600">{t('timeoff.create_description')}</p>
        </DialogHeader>

        {/* Conflict Warning */}
        {conflictInfo?.hasConflicts && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-amber-800">
                  {t('warning.TIME_OFF_CONFLICTS_WITH_WORKSHIFTS')}
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  {t('timeoff.conflict_details', { count: conflictInfo.conflictCount })}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {hideDateSelection ? (
            // Layout without Date Selection: 2 columns
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Staff Information */}
              {currentStaff && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t('timeoff.staff_information')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-medium">
                        {(currentStaff.userId?.fullName || 'U').charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{currentStaff.userId?.fullName || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">{currentStaff.jobTitle}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Time Off Type */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {t('timeoff.type_selection')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium">
                      {t('timeoff.type')} *
                    </Label>
                    <Select onValueChange={(value) => setValue('type', value)}>
                      <SelectTrigger className={cn(errors.type && 'border-red-500')}>
                        <SelectValue placeholder={t('timeoff.select_type')} />
                      </SelectTrigger>
                      <SelectContent>
                        {getTimeOffTypes(t).map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{type.label}</span>
                              <span className="text-xs text-gray-500">{type.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.type.message}
                      </p>
                    )}
                    {selectedType && <p className="text-xs text-gray-600">{getTypeDescription(selectedType)}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Reason - Full width */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {t('timeoff.reason')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-sm font-medium">
                      {t('timeoff.reason')} *
                    </Label>
                    <Textarea
                      id="reason"
                      placeholder={t('timeoff.reason_placeholder')}
                      {...register('reason')}
                      className={cn(errors.reason && 'border-red-500')}
                      rows={3}
                    />
                    {errors.reason && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.reason.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">{t('timeoff.reason_help')}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Layout with Date Selection: 3 columns
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Staff Information */}
              {currentStaff && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t('timeoff.staff_information')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-medium">
                        {(currentStaff.userId?.fullName || 'U').charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{currentStaff.userId?.fullName || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">{currentStaff.jobTitle}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Time Off Type */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {t('timeoff.type_selection')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium">
                      {t('timeoff.type')} *
                    </Label>
                    <Select onValueChange={(value) => setValue('type', value)}>
                      <SelectTrigger className={cn(errors.type && 'border-red-500')}>
                        <SelectValue placeholder={t('timeoff.select_type')} />
                      </SelectTrigger>
                      <SelectContent>
                        {getTimeOffTypes(t).map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{type.label}</span>
                              <span className="text-xs text-gray-500">{type.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.type.message}
                      </p>
                    )}
                    {selectedType && <p className="text-xs text-gray-600">{getTypeDescription(selectedType)}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Date Range Selection (Start & End in one control) */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {t('timeoff.date_selection')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">
                      {t('timeoff.start_date')} - {t('timeoff.end_date')} *
                    </Label>
                    {/* One Popover + Calendar range for both start & end (uncontrolled like DiscountCampaignForm) */}
                    <Popover modal={false}>
                      <PopoverTrigger asChild>
                        {(() => {
                          let dateLabel: string;
                          if (selectedStartDate && selectedEndDate) {
                            dateLabel = `${formatDate(selectedStartDate)} → ${formatDate(selectedEndDate)}`;
                          } else if (selectedStartDate) {
                            dateLabel = `${formatDate(selectedStartDate)}`;
                          } else {
                            dateLabel = t('timeoff.select_date_range');
                          }
                          return (
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal text-xs',
                                !selectedStartDate && 'text-muted-foreground',
                                (errors.startDate || errors.endDate) && 'border-red-500'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-3 w-3" />
                              {dateLabel}
                            </Button>
                          );
                        })()}
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 z-[9999]"
                        align="start"
                        side="bottom"
                        sideOffset={8}
                        collisionPadding={8}
                      >
                        <Calendar
                          mode="range"
                          selected={
                            selectedStartDate || selectedEndDate
                              ? { from: selectedStartDate, to: selectedEndDate || selectedStartDate }
                              : undefined
                          }
                          onSelect={(range) => {
                            if (!range) {
                              setSelectedStartDate(undefined);
                              setSelectedEndDate(undefined);
                              return;
                            }
                            setSelectedStartDate(range.from || undefined);
                            setSelectedEndDate(range.to || range.from || undefined);
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </PopoverContent>
                    </Popover>
                    {(errors.startDate || errors.endDate) && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.startDate?.message || errors.endDate?.message}
                      </p>
                    )}
                  </div>

                  {/* Duration Display */}
                  {selectedStartDate && selectedEndDate && (
                    <div className="text-xs text-gray-600 bg-green-50 rounded p-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">
                          {Math.ceil(
                            (selectedEndDate.getTime() - selectedStartDate.getTime()) / (1000 * 60 * 60 * 24)
                          ) + 1}{' '}
                          {t('timeoff.days')}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reason - Full width */}
              <Card className="lg:col-span-3">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {t('timeoff.reason')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-sm font-medium">
                      {t('timeoff.reason')} *
                    </Label>
                    <Textarea
                      id="reason"
                      placeholder={t('timeoff.reason_placeholder')}
                      {...register('reason')}
                      className={cn(errors.reason && 'border-red-500')}
                      rows={3}
                    />
                    {errors.reason && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.reason.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">{t('timeoff.reason_help')}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-black text-white hover:bg-gray-800 focus:bg-gray-800"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('timeoff.creating')}
                </>
              ) : (
                t('timeoff.create_request')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTimeOffModal;
