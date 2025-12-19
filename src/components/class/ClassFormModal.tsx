/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import i18n from '@/configs/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Clock, Users, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/utils/utils';
import { createClassSchema, updateClassSchema, DAY_LABELS, DAYS_OF_WEEK, type CreateClassDTO } from '@/types/Class';
import type { Staff } from '@/types/api/Staff';
import type { ServicePackage } from '@/types/api/Package';
import type { ClassFormModalProps } from '@/types/class/ClassFormModal';
import { useClass } from '@/hooks/useClass';
import { useClassDetail } from '@/hooks/useClassDetail';
import { staffApi } from '@/services/api/staffApi';
import { packageApi } from '@/services/api/packageApi';
import { toast } from 'sonner';

type FormData = CreateClassDTO & { _id?: string };

export const ClassFormModal: React.FC<ClassFormModalProps> = ({ isOpen, onClose, classId, branchId, onSuccess }) => {
  const { t } = useTranslation();

  const isEditMode = !!classId;
  const { classData, loading: detailLoading } = useClassDetail(isEditMode ? classId : undefined);
  const {
    createClass,
    updateClass,
    loading: actionLoading
  } = useClass({
    onSuccess: () => {
      toast.success(isEditMode ? t('class.form.success_updated') : t('class.form.success_created'));
      reset();
      onClose();
      onSuccess?.();
    },
    onError: (_error: unknown) => {}
  });

  // Data for dropdowns
  const [trainers, setTrainers] = React.useState<Staff[]>([]);
  const [packages, setPackages] = React.useState<ServicePackage[]>([]);
  const [loadingData, setLoadingData] = React.useState(true);

  // Date picker states
  const [startDateOpen, setStartDateOpen] = React.useState(false);
  const [endDateOpen, setEndDateOpen] = React.useState(false);

  // Form setup
  const schema = isEditMode ? updateClassSchema : createClassSchema;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    getValues,
    setError
  } = useForm({
    resolver: zodResolver(schema as any),
    defaultValues: {
      name: '',
      servicePackageId: '',
      branchId,
      trainerIds: [],
      capacity: 20,
      schedulePattern: {
        daysOfWeek: [],
        startTime: '09:00',
        endTime: '10:00',
        timezone: 'Asia/Ho_Chi_Minh'
      },
      startDate: '',
      endDate: '',
      location: '',
      description: '',
      scheduleGenerationWindow: 7
    }
  });

  // Watch branchId from form to fetch trainers for that branch
  const formBranchId = watch('branchId');

  // Fetch dropdown data
  React.useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      if (formBranchId) {
        try {
          const packagesResp = await packageApi.getActivePackagesByBranch(formBranchId);
          if (packagesResp?.success && packagesResp.data) {
            const classPackages = Array.isArray(packagesResp.data)
              ? packagesResp.data.filter((pkg) => pkg.type === 'CLASS')
              : [];
            setPackages(classPackages);
          } else {
            setPackages([]);
          }
        } catch {
          setPackages([]);
        }
      } else {
        setPackages([]);
      }

      if (formBranchId) {
        try {
          const trainersResp = await staffApi.getStaffListByBranch(formBranchId, { limit: 100 });
          if (trainersResp?.success && trainersResp.data) {
            setTrainers(Array.isArray(trainersResp.data) ? trainersResp.data : []);
          } else {
            setTrainers([]);
          }
        } catch {
          setTrainers([]);
        }
      } else {
        setTrainers([]);
      }

      setLoadingData(false);
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, formBranchId, t]);

  // Set default dates on mount
  useEffect(() => {
    if (!isEditMode) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDateStr = tomorrow.toISOString().split('T')[0];

      const endDate = new Date(tomorrow);
      endDate.setMonth(endDate.getMonth() + 3);
      const endDateStr = endDate.toISOString().split('T')[0];

      setValue('startDate', startDateStr);
      setValue('endDate', endDateStr);
    }
  }, [isOpen, isEditMode, setValue]);

  // Load existing data when in edit mode
  useEffect(() => {
    if (isEditMode && classData) {
      const pkgId =
        typeof classData.servicePackageId === 'object' ? classData.servicePackageId._id : classData.servicePackageId;
      const branchIdVal = typeof classData.branchId === 'object' ? classData.branchId._id : classData.branchId;

      const startDateStr = classData.startDate ? new Date(classData.startDate).toISOString().split('T')[0] : '';
      const endDateStr = classData.endDate ? new Date(classData.endDate).toISOString().split('T')[0] : '';

      const dataToReset = {
        name: classData.name,
        servicePackageId: pkgId,
        branchId: branchIdVal,
        trainerIds: classData.trainerIds.map((t) => {
          if (typeof t === 'string') {
            return t;
          }
          return (t as Staff)._id || (t as any)._id || '';
        }),
        schedulePattern: classData.schedulePattern,
        capacity: classData.capacity,
        startDate: startDateStr,
        endDate: endDateStr,
        location: classData.location,
        description: classData.description
      };

      reset(dataToReset);
    } else if (!isEditMode) {
      reset({
        name: '',
        servicePackageId: '',
        branchId,
        trainerIds: [],
        capacity: 20,
        schedulePattern: {
          daysOfWeek: [],
          startTime: '09:00',
          endTime: '10:00',
          timezone: 'Asia/Ho_Chi_Minh'
        },
        startDate: '',
        endDate: '',
        location: '',
        description: '',
        scheduleGenerationWindow: 7
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDateStr = tomorrow.toISOString().split('T')[0];
      const endDate = new Date(tomorrow);
      endDate.setMonth(endDate.getMonth() + 3);
      const endDateStr = endDate.toISOString().split('T')[0];
      setValue('startDate', startDateStr);
      setValue('endDate', endDateStr);
    }
  }, [classId, classData, isEditMode, reset, setValue, branchId]);

  const selectedDays = watch('schedulePattern.daysOfWeek');
  const selectedTrainers = watch('trainerIds');
  const startTime = watch('schedulePattern.startTime');
  const endTime = watch('schedulePattern.endTime');

  // Handler: Toggle day selection
  const handleDayToggle = (day: string) => {
    const current = selectedDays || [];
    const updated = current.includes(day) ? current.filter((d: string) => d !== day) : [...current, day];
    setValue('schedulePattern.daysOfWeek', updated as any);
  };

  // Handler: Toggle trainer selection
  const handleTrainerToggle = (trainerId: string) => {
    const current = selectedTrainers || [];
    const updated = current.includes(trainerId)
      ? current.filter((id: string) => id !== trainerId)
      : [...current, trainerId];
    setValue('trainerIds', updated);
  };

  // Trainer display (show first 2 + count)
  const trainerDisplay = useMemo(() => {
    const selected = trainers.filter((t) => selectedTrainers?.includes(t._id) && t.userId);
    if (selected.length === 0) return 'Select trainers...';
    if (selected.length <= 2) {
      return selected.map((t) => t.userId?.fullName || 'N/A').join(', ');
    }
    return `${selected
      .slice(0, 2)
      .map((t) => t.userId?.fullName || 'N/A')
      .join(', ')} +${selected.length - 2}`;
  }, [selectedTrainers, trainers]);

  const formatTrainerConflictError = (errorMessage: string): string => {
    const safeTrim = (str: string | undefined, fallback: string = '') => (str || '').trim() || fallback;

    if (!errorMessage.includes(':')) {
      const translated = t(`error.${errorMessage}`, {});
      return translated !== `error.${errorMessage}` ? translated : errorMessage;
    }

    const firstColonIndex = errorMessage.indexOf(':');
    if (firstColonIndex === -1) {
      const translated = t(`error.${errorMessage}`, {});
      return translated !== `error.${errorMessage}` ? translated : errorMessage;
    }

    const errorCode = errorMessage.substring(0, firstColonIndex);
    const cleanDetails = errorMessage.substring(firstColonIndex + 1).trim();

    switch (errorCode) {
      case 'TRAINER_TIME_CONFLICT_CLASS':
        if (cleanDetails.includes('|')) {
          const parts = cleanDetails.split('|');
          if (parts.length < 5) {
            return errorMessage;
          }

          const [trainerName, className, days, startTime, endTime] = parts;

          return t('error.TRAINER_TIME_CONFLICT_CLASS', {
            trainerName: safeTrim(trainerName, 'Unknown'),
            className: safeTrim(className, ''),
            days: safeTrim(days, ''),
            startTime: safeTrim(startTime, ''),
            endTime: safeTrim(endTime, '')
          });
        }
        break;

      case 'TRAINER_TIME_CONFLICT_PT_AVAILABILITY':
        if (cleanDetails.includes('|')) {
          try {
            const parts = cleanDetails.split('|');

            if (parts.length < 5) {
              const timePattern = /\|(\d{2}:\d{2})\|(\d{2}:\d{2})$/;
              const timeMatch = cleanDetails.match(timePattern);
              if (timeMatch && parts.length >= 3) {
                const endTime = timeMatch[2] || '';
                const startTime = timeMatch[1] || '';
                const withoutTimes = cleanDetails.replace(/\|\d{2}:\d{2}\|\d{2}:\d{2}$/, '');
                const remainingParts = withoutTimes.split('|');
                const trainerName = remainingParts[0] || '';
                const date = remainingParts.slice(2).join(', ') || '';

                const trimmedTrainerName = safeTrim(trainerName, 'Unknown');
                const trimmedDate = safeTrim(date, '');
                const trimmedStartTime = safeTrim(startTime, '');
                const trimmedEndTime = safeTrim(endTime, '');

                let result: string;
                try {
                  const translated = t('error.TRAINER_TIME_CONFLICT_PT_AVAILABILITY', {
                    trainerName: trimmedTrainerName,
                    date: trimmedDate,
                    startTime: trimmedStartTime,
                    endTime: trimmedEndTime
                  });
                  result = typeof translated === 'string' ? translated : '';
                } catch {
                  result = '';
                }

                if (!result || result === 'error.TRAINER_TIME_CONFLICT_PT_AVAILABILITY') {
                  const fallbackMessage =
                    i18n.language === 'vi'
                      ? `${trimmedTrainerName} có yêu cầu lịch PT 1vs1 vào ${trimmedDate} từ ${trimmedStartTime} đến ${trimmedEndTime}`
                      : `${trimmedTrainerName} has a PT 1vs1 availability request on ${trimmedDate} from ${trimmedStartTime} to ${trimmedEndTime}`;
                  return fallbackMessage;
                }

                return result;
              }

              return errorMessage;
            }

            const [trainerName, , date, startTime, endTime] = parts;

            const trimmedTrainerName = safeTrim(trainerName, 'Unknown');
            const trimmedDate = safeTrim(date, '');
            const trimmedStartTime = safeTrim(startTime, '');
            const trimmedEndTime = safeTrim(endTime, '');

            let result: string;
            try {
              const translated = t('error.TRAINER_TIME_CONFLICT_PT_AVAILABILITY', {
                trainerName: trimmedTrainerName,
                date: trimmedDate,
                startTime: trimmedStartTime,
                endTime: trimmedEndTime
              });
              result = typeof translated === 'string' ? translated : '';
            } catch {
              result = '';
            }

            if (!result || result === 'error.TRAINER_TIME_CONFLICT_PT_AVAILABILITY') {
              const fallbackMessage =
                i18n.language === 'vi'
                  ? `${trimmedTrainerName} có yêu cầu lịch PT 1vs1 vào ${trimmedDate} từ ${trimmedStartTime} đến ${trimmedEndTime}`
                  : `${trimmedTrainerName} has a PT 1vs1 availability request on ${trimmedDate} from ${trimmedStartTime} to ${trimmedEndTime}`;
              return fallbackMessage;
            }

            return result;
          } catch {
            return errorMessage;
          }
        }
        break;

      case 'TRAINER_TIME_CONFLICT_PT_SCHEDULE':
        if (cleanDetails.includes('|')) {
          const parts = cleanDetails.split('|');
          if (parts.length < 4) {
            return errorMessage;
          }

          const [trainerName, date, startTime, endTime] = parts;

          return t('error.TRAINER_TIME_CONFLICT_PT_SCHEDULE', {
            trainerName: safeTrim(trainerName, 'Unknown'),
            date: safeTrim(date, ''),
            startTime: safeTrim(startTime, ''),
            endTime: safeTrim(endTime, '')
          });
        }
        break;

      default: {
        const translated = t(`error.${errorCode}`, {});
        return translated !== `error.${errorCode}` ? translated : errorMessage;
      }
    }

    return errorMessage;
  };

  const onSubmit = async (_data: FormData) => {
    const currentValues = getValues();

    try {
      if (isEditMode && classId) {
        const updatePayload = {
          ...currentValues,
          capacity: currentValues.capacity ? Number(currentValues.capacity) : undefined,
          schedulePattern: currentValues.schedulePattern
            ? {
                daysOfWeek: [...(currentValues.schedulePattern.daysOfWeek || [])],
                startTime: currentValues.schedulePattern.startTime || '',
                endTime: currentValues.schedulePattern.endTime || '',
                timezone: currentValues.schedulePattern.timezone || 'Asia/Ho_Chi_Minh'
              }
            : undefined
        };

        await updateClass(classId, updatePayload);
      } else {
        const createPayload = {
          ...currentValues,
          capacity: Number(currentValues.capacity) || 20
        };
        await createClass(createPayload);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const axiosError = error as any;
      let finalErrorMessage = errorMessage;

      if (errorMessage && errorMessage !== 'Unknown error' && errorMessage.includes('TRAINER_TIME_CONFLICT')) {
        finalErrorMessage = errorMessage;
      } else if (axiosError?.response?.data?.error?.message) {
        finalErrorMessage = axiosError.response.data.error.message;
      } else if ((error as any)?.response?.data?.error?.message) {
        finalErrorMessage = (error as any).response.data.error.message;
      } else if (axiosError?.response?.data?.message) {
        finalErrorMessage = axiosError.response.data.message;
      } else if (errorMessage && errorMessage !== 'Unknown error') {
        finalErrorMessage = errorMessage;
      }

      const translatedMessage = formatTrainerConflictError(finalErrorMessage);

      const isTrainerConflict =
        finalErrorMessage.includes('TRAINER_TIME_CONFLICT') ||
        translatedMessage.includes('có lịch') ||
        translatedMessage.includes('đã có lớp') ||
        translatedMessage.includes('has a class') ||
        translatedMessage.includes('has a schedule');

      if (isTrainerConflict) {
        setError('trainerIds', {
          type: 'server',
          message: translatedMessage
        });
      } else {
        if (translatedMessage.toLowerCase().includes('service package')) {
          setError('servicePackageId', {
            type: 'server',
            message: translatedMessage
          });
        } else if (translatedMessage.toLowerCase().includes('name')) {
          setError('name', {
            type: 'server',
            message: translatedMessage
          });
        } else if (translatedMessage.toLowerCase().includes('capacity')) {
          setError('capacity', {
            type: 'server',
            message: translatedMessage
          });
        } else if (
          translatedMessage.toLowerCase().includes('date') ||
          translatedMessage.toLowerCase().includes('start') ||
          translatedMessage.toLowerCase().includes('end')
        ) {
          if (translatedMessage.toLowerCase().includes('start date')) {
            setError('startDate', {
              type: 'server',
              message: translatedMessage
            });
          } else if (translatedMessage.toLowerCase().includes('end date')) {
            setError('endDate', {
              type: 'server',
              message: translatedMessage
            });
          } else {
            setError('root', {
              type: 'server',
              message: translatedMessage
            });
          }
        } else {
          setError('root', {
            type: 'server',
            message: translatedMessage
          });
        }
      }
    }
  };

  // Time validation error
  const timeError = useMemo(() => {
    if (!startTime || !endTime) return null;
    const startHour = parseInt(startTime.split(':')[0]);
    const startMin = parseInt(startTime.split(':')[1]);
    const endHour = parseInt(endTime.split(':')[0]);
    const endMin = parseInt(endTime.split(':')[1]);
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    return endTotalMin <= startTotalMin ? 'End time must be after start time' : null;
  }, [startTime, endTime]);

  return (
    <Dialog open={isOpen && !!branchId} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar">
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {isEditMode ? t('class.form.title_edit') : t('class.form.title_create')}
          </DialogTitle>
        </DialogHeader>

        {/* Loading State */}
        {detailLoading && isEditMode && (
          <div className="space-y-2 py-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
          </div>
        )}

        {/* Dropdown Loading State */}
        {loadingData && (
          <div className="space-y-2 py-4">
            <p className="text-sm text-gray-500">{t('class.form.loading_data')}</p>
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        )}

        {/* Form */}
        {!detailLoading && !loadingData && (
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">{t('class.form.section_basic_info')}</h3>

              {/* Class Name */}
              <div>
                <Label className="text-sm">{t('class.form.label_class_name')}</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder={t('class.form.placeholder_class_name')} className="mt-1" />
                  )}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">
                    {(errors.name as any)?.message || t('class.form.error_field_invalid')}
                  </p>
                )}
              </div>

              {/* Service Package */}
              <div>
                <Label className="text-sm">{t('class.form.label_service_package')}</Label>
                <Controller
                  name="servicePackageId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="mt-1 cursor-pointer">
                        <SelectValue placeholder={t('class.form.placeholder_service_package')} />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.map((pkg) => (
                          <SelectItem key={pkg._id} value={pkg._id} className="cursor-pointer">
                            {t('class.form.package_display', { name: pkg.name, sessionCount: pkg.sessionCount })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.servicePackageId && (
                  <p className="text-xs text-red-500 mt-1">
                    {(errors.servicePackageId as any)?.message || t('class.form.error_field_required')}
                  </p>
                )}
              </div>
            </div>

            {/* Schedule */}
            <div className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('class.form.section_schedule')}
              </h3>

              {/* Days of Week */}
              <div>
                <Label className="text-sm mb-2 block">{t('class.form.label_days_of_week')}</Label>
                <div className="grid grid-cols-4 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day}`}
                        checked={selectedDays?.includes(day) || false}
                        onCheckedChange={() => handleDayToggle(day)}
                        className="cursor-pointer"
                      />
                      <label htmlFor={`day-${day}`} className="text-xs font-medium cursor-pointer">
                        {DAY_LABELS[day]}
                      </label>
                    </div>
                  ))}
                </div>
                {(errors as any).schedulePattern?.daysOfWeek && (
                  <p className="text-xs text-red-500 mt-1">
                    {((errors as any).schedulePattern?.daysOfWeek as any)?.message ||
                      t('class.form.error_field_required')}
                  </p>
                )}
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                {/* Start Time */}
                <div>
                  <Label className="text-sm">{t('class.form.label_start_time')}</Label>
                  <Controller
                    name="schedulePattern.startTime"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="09:00"
                        maxLength={5}
                        pattern="\d{2}:\d{2}"
                        className="mt-1 font-mono"
                      />
                    )}
                  />
                  {(errors as any).schedulePattern?.startTime && (
                    <p className="text-xs text-red-500 mt-1">
                      {((errors as any).schedulePattern?.startTime as any)?.message ||
                        t('class.form.error_field_invalid')}
                    </p>
                  )}
                </div>

                {/* End Time */}
                <div>
                  <Label className="text-sm">{t('class.form.label_end_time')}</Label>
                  <Controller
                    name="schedulePattern.endTime"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="10:00"
                        maxLength={5}
                        pattern="\d{2}:\d{2}"
                        className="mt-1 font-mono"
                      />
                    )}
                  />
                  {(errors as any).schedulePattern?.endTime && (
                    <p className="text-xs text-red-500 mt-1">
                      {((errors as any).schedulePattern?.endTime as any)?.message ||
                        t('class.form.error_field_invalid')}
                    </p>
                  )}
                </div>
              </div>

              {/* Time validation error */}
              {timeError && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {timeError}
                </div>
              )}

              {/* Start Date */}
              <div>
                <Label className="text-sm">{t('class.form.label_start_date')}</Label>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => {
                    const selectedDate = field.value
                      ? typeof field.value === 'string'
                        ? new Date(field.value + 'T00:00:00')
                        : field.value
                      : undefined;

                    return (
                      <Popover open={startDateOpen} onOpenChange={setStartDateOpen} modal={false}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              'w-full mt-1 justify-start text-left font-normal',
                              !selectedDate && 'text-muted-foreground',
                              (errors as any).startDate && 'border-red-500'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate
                              ? format(selectedDate, 'dd/MM/yyyy', { locale: vi })
                              : t('class.form.placeholder_start_date', { defaultValue: 'Chọn ngày bắt đầu' })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 z-[9999] bg-white border border-border shadow-lg"
                          align="start"
                          side="bottom"
                          sideOffset={8}
                          collisionPadding={8}
                        >
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              if (date) {
                                const dateStr = format(date, 'yyyy-MM-dd');
                                field.onChange(dateStr);
                                setStartDateOpen(false);
                              }
                            }}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                            locale={vi}
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  }}
                />
                {(errors as any).startDate && (
                  <p className="text-xs text-red-500 mt-1">
                    {((errors as any).startDate as any)?.message || t('class.form.error_field_required')}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div>
                <Label className="text-sm">{t('class.form.label_end_date')}</Label>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => {
                    const selectedDate = field.value
                      ? typeof field.value === 'string'
                        ? new Date(field.value + 'T00:00:00')
                        : field.value
                      : undefined;

                    const startDateValue = watch('startDate');
                    const minDate = startDateValue
                      ? new Date(startDateValue + 'T00:00:00')
                      : new Date(new Date().setHours(0, 0, 0, 0));

                    return (
                      <Popover open={endDateOpen} onOpenChange={setEndDateOpen} modal={false}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              'w-full mt-1 justify-start text-left font-normal',
                              !selectedDate && 'text-muted-foreground',
                              (errors as any).endDate && 'border-red-500'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate
                              ? format(selectedDate, 'dd/MM/yyyy', { locale: vi })
                              : t('class.form.placeholder_end_date', { defaultValue: 'Chọn ngày kết thúc' })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 z-[9999] bg-white border border-border shadow-lg"
                          align="start"
                          side="bottom"
                          sideOffset={8}
                          collisionPadding={8}
                        >
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              if (date) {
                                const dateStr = format(date, 'yyyy-MM-dd');
                                field.onChange(dateStr);
                                setEndDateOpen(false);
                              }
                            }}
                            disabled={(date) => date < minDate}
                            initialFocus
                            locale={vi}
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  }}
                />
                {(errors as any).endDate && (
                  <p className="text-xs text-red-500 mt-1">
                    {((errors as any).endDate as any)?.message || t('class.form.error_field_invalid')}
                  </p>
                )}
              </div>
            </div>

            {/* Trainers & Capacity */}
            <div className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t('class.form.section_trainers_capacity')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trainers */}
                <div>
                  <Label className="text-sm">{t('class.form.label_trainers')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start mt-1 cursor-pointer" type="button">
                        {trainerDisplay}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 z-[102]" align="start" sideOffset={4}>
                      <Command>
                        <CommandInput placeholder={t('class.form.search_trainers')} />
                        <CommandList>
                          <CommandEmpty>{t('class.form.no_trainers_found')}</CommandEmpty>
                          <CommandGroup className="max-h-[200px] overflow-y-auto hide-scrollbar">
                            {trainers
                              .filter((trainer) => trainer.userId)
                              .map((trainer) => (
                                <CommandItem
                                  key={trainer._id}
                                  onSelect={() => handleTrainerToggle(trainer._id)}
                                  className="cursor-pointer"
                                >
                                  <Checkbox
                                    checked={selectedTrainers?.includes(trainer._id) || false}
                                    className="mr-2 cursor-pointer"
                                  />
                                  <span className="flex-1">{trainer.userId?.fullName || 'N/A'}</span>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.trainerIds && (
                    <p className="text-xs text-red-500 mt-1">
                      {(errors.trainerIds as any)?.message || t('class.form.error_field_required')}
                    </p>
                  )}
                </div>

                {/* Capacity */}
                <div>
                  <Label className="text-sm">{t('class.form.label_capacity')}</Label>
                  <Controller
                    name="capacity"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        max="200"
                        placeholder="20"
                        className="mt-1"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? '' : Number(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    )}
                  />
                  {errors.capacity && (
                    <p className="text-xs text-red-500 mt-1">
                      {(errors.capacity as any)?.message || t('class.form.error_field_invalid')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">{t('class.form.section_additional_info')}</h3>

              {/* Location */}
              <div>
                <Label className="text-sm">{t('class.form.label_location')}</Label>
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder={t('class.form.placeholder_location')} className="mt-1" />
                  )}
                />
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm">{t('class.form.label_description')}</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder={t('class.form.placeholder_description')}
                      rows={3}
                      className="mt-1"
                    />
                  )}
                />
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="gap-2 border-t pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting || actionLoading}
                className="cursor-pointer"
              >
                {t('class.form.button_cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || actionLoading || timeError !== null || loadingData}
                className="min-w-[120px] bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
              >
                {actionLoading
                  ? t('class.form.button_saving')
                  : isEditMode
                    ? t('class.form.button_update')
                    : t('class.form.button_create')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
