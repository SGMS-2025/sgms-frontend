/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Clock, Users, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast.error(errorMessage);
    }
  });

  // Data for dropdowns
  const [trainers, setTrainers] = React.useState<Staff[]>([]);
  const [packages, setPackages] = React.useState<ServicePackage[]>([]);
  const [loadingData, setLoadingData] = React.useState(true);

  // Fetch dropdown data
  React.useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const trainersResp = await staffApi.getStaffList({ limit: 100 });
        const packagesResp = await packageApi.getPackages({ limit: 100 });

        if (trainersResp?.success && trainersResp.data?.staffList) {
          setTrainers(trainersResp.data.staffList);
        }

        if (packagesResp?.success && packagesResp.data?.packages) {
          const classPackages = packagesResp.data.packages.filter((pkg) => pkg.type === 'CLASS');
          setPackages(classPackages);
        }
      } catch (_error) {
        toast.error(t('class.form.loading_error'));
      } finally {
        setLoadingData(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, t]);

  // Form setup
  const schema = isEditMode ? updateClassSchema : createClassSchema;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
    setValue
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

  // Set default dates on mount
  useEffect(() => {
    if (!isEditMode) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDateStr = tomorrow.toISOString().split('T')[0];

      // End date = start date + 3 months (default)
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
      try {
        const pkgId =
          typeof classData.servicePackageId === 'object' ? classData.servicePackageId._id : classData.servicePackageId;
        const branchIdVal = typeof classData.branchId === 'object' ? classData.branchId._id : classData.branchId;

        const startDateStr = classData.startDate ? new Date(classData.startDate).toISOString().split('T')[0] : '';
        const endDateStr = classData.endDate ? new Date(classData.endDate).toISOString().split('T')[0] : '';

        const dataToReset = {
          name: classData.name,
          servicePackageId: pkgId,
          branchId: branchIdVal,
          trainerIds: classData.trainerIds.map((t: any) => t._id || t),
          schedulePattern: classData.schedulePattern,
          capacity: classData.capacity,
          startDate: startDateStr,
          endDate: endDateStr,
          location: classData.location,
          description: classData.description
        };

        reset(dataToReset);
      } catch (_error) {
        // Error loading class data - continue with empty form
      }
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

      // Set default dates
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
    const selected = trainers.filter((t) => selectedTrainers?.includes(t._id));
    if (selected.length === 0) return 'Select trainers...';
    if (selected.length <= 2) {
      return selected.map((t) => t.userId.fullName).join(', ');
    }
    return `${selected
      .slice(0, 2)
      .map((t) => t.userId.fullName)
      .join(', ')} +${selected.length - 2}`;
  }, [selectedTrainers, trainers]);

  // Form submit
  const onSubmit = async (data: FormData) => {
    if (isEditMode && classId) {
      await updateClass(classId, data);
    } else {
      await createClass(data);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            {/* Validation Errors Summary */}
            {Object.keys(errors).length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs font-semibold text-red-700 mb-2">{t('class.form.error_validation_title')}</p>
                <ul className="text-xs text-red-600 space-y-1">
                  {Object.entries(errors).map(([field, error]: [string, any]) => (
                    <li key={field}>
                      • {field}: {error?.message || t('class.form.error_field_invalid')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

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
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={t('class.form.placeholder_service_package')} />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.map((pkg) => (
                          <SelectItem key={pkg._id} value={pkg._id}>
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
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="date"
                      className="mt-1"
                      min={new Date().toISOString().split('T')[0]}
                      value={
                        typeof field.value === 'string'
                          ? field.value
                          : field.value instanceof Date
                            ? field.value.toISOString().split('T')[0]
                            : ''
                      }
                    />
                  )}
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
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="date"
                      className="mt-1"
                      min={new Date().toISOString().split('T')[0]}
                      value={
                        typeof field.value === 'string'
                          ? field.value
                          : field.value instanceof Date
                            ? field.value.toISOString().split('T')[0]
                            : ''
                      }
                    />
                  )}
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
                      <Button variant="outline" className="w-full justify-start mt-1">
                        {trainerDisplay}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder={t('class.form.search_trainers')} />
                        <CommandEmpty>{t('class.form.no_trainers_found')}</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                          {trainers.map((trainer) => (
                            <CommandItem key={trainer._id} onSelect={() => handleTrainerToggle(trainer._id)}>
                              <Checkbox checked={selectedTrainers?.includes(trainer._id) || false} className="mr-2" />
                              <span className="flex-1">{trainer.userId.fullName}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
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
                      <Input {...field} type="number" min="1" max="100" placeholder="20" className="mt-1" />
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
              <Button variant="outline" onClick={onClose} disabled={isSubmitting || actionLoading}>
                {t('class.form.button_cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || actionLoading || timeError !== null || loadingData}
                className="min-w-[120px] bg-orange-500 hover:bg-orange-600 text-white"
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
