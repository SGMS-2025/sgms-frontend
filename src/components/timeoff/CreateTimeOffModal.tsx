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
import { localDateStringYMD, createUtcISOFromLocal } from '@/utils/datetime';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { useTimeOffOperations } from '@/hooks/useTimeOff';
import type {
  CreateTimeOffRequest,
  CreateTimeOffModalProps,
  TimeOffType,
  WorkShiftConflict
} from '@/types/api/TimeOff';

// Validation schema
const createTimeOffSchema = z
  .object({
    type: z.string().min(1, 'Time off type is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason cannot exceed 500 characters')
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
      message: 'End date must be after or equal to start date',
      path: ['endDate']
    }
  );

type CreateTimeOffFormData = z.infer<typeof createTimeOffSchema>;

const TIME_OFF_TYPES: { value: TimeOffType; label: string; description: string }[] = [
  { value: 'VACATION', label: 'Vacation', description: 'Annual leave or holiday' },
  { value: 'SICK_LEAVE', label: 'Sick Leave', description: 'Medical leave or illness' },
  { value: 'PERSONAL_LEAVE', label: 'Personal Leave', description: 'Personal matters or appointments' },
  { value: 'UNPAID_LEAVE', label: 'Unpaid Leave', description: 'Leave without pay' },
  { value: 'EMERGENCY', label: 'Emergency', description: 'Urgent personal matters' },
  { value: 'OTHER', label: 'Other', description: 'Other reasons' }
];

const CreateTimeOffModal: React.FC<CreateTimeOffModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  prefillData,
  hideDateSelection = false
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
    resolver: zodResolver(createTimeOffSchema),
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
    const createData: CreateTimeOffRequest = {
      staffId: currentStaff._id,
      type: data.type as TimeOffType,
      startDate: createUtcISOFromLocal(data.startDate, '00:00'),
      endDate: createUtcISOFromLocal(data.endDate, '23:59'),
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
    const typeInfo = TIME_OFF_TYPES.find((t) => t.value === type);
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
                        {TIME_OFF_TYPES.map((type) => (
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
                        {TIME_OFF_TYPES.map((type) => (
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

              {/* Date Selection */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {t('timeoff.date_selection')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">{t('timeoff.start_date')} *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal text-xs',
                            !selectedStartDate && 'text-muted-foreground',
                            errors.startDate && 'border-red-500'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {selectedStartDate ? formatDate(selectedStartDate) : t('timeoff.select_start_date')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedStartDate}
                          onSelect={setSelectedStartDate}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.startDate && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.startDate.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-medium">{t('timeoff.end_date')} *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal text-xs',
                            !selectedEndDate && 'text-muted-foreground',
                            errors.endDate && 'border-red-500'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {selectedEndDate ? formatDate(selectedEndDate) : t('timeoff.select_end_date')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedEndDate}
                          onSelect={setSelectedEndDate}
                          disabled={(date) => {
                            const today = new Date(new Date().setHours(0, 0, 0, 0));
                            const minDate = selectedStartDate || today;
                            return date < minDate;
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.endDate && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.endDate.message}
                      </p>
                    )}
                  </div>

                  {/* Duration Display */}
                  {selectedStartDate && selectedEndDate && (
                    <div className="text-xs text-gray-600 bg-blue-50 rounded p-2">
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
