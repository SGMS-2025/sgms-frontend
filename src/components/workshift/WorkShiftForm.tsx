import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Clock, User, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { cn, formatDate } from '@/utils/utils';
import { localDateTimeToUtcISO } from '@/utils/datetime';
import { useBranch } from '@/contexts/BranchContext';
import { staffApi } from '@/services/api/staffApi';
import type { WorkShiftFormProps, WorkShiftFormData, CreateWorkShiftRequest } from '@/types/api/WorkShift';
import type { Staff } from '@/types/api/Staff';

// Validation schema
const workShiftSchema = z
  .object({
    staffId: z.string().min(1, 'Staff is required'),
    branchId: z.string().min(1, 'Branch is required'),
    date: z.string().min(1, 'Date is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required')
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        const startTime = new Date(`2000-01-01T${data.startTime}`);
        const endTime = new Date(`2000-01-01T${data.endTime}`);
        return endTime > startTime;
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime']
    }
  );

const WorkShiftForm: React.FC<WorkShiftFormProps> = ({ onSubmit, onCancel, initialData, loading = false }) => {
  const { t } = useTranslation();
  const { branches } = useBranch();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<WorkShiftFormData>({
    resolver: zodResolver(workShiftSchema),
    defaultValues: {
      staffId: initialData?.staffId?._id || '',
      branchId: initialData?.branchId?._id || '',
      date: initialData?.startTime ? new Date(initialData.startTime).toISOString().split('T')[0] : '',
      startTime: initialData?.startTimeLocal || '',
      endTime: initialData?.endTimeLocal || ''
    }
  });

  const selectedBranchId = watch('branchId');

  // Fetch staff list when branch changes
  useEffect(() => {
    const fetchStaff = async () => {
      if (!selectedBranchId) {
        setStaffList([]);
        return;
      }

      setLoadingStaff(true);
      const response = await staffApi.getStaffList({ branchId: selectedBranchId });
      if (response.success) {
        setStaffList(response.data.staffList);
      }
      setLoadingStaff(false);
    };

    fetchStaff();
  }, [selectedBranchId]);

  // Update form when date changes
  useEffect(() => {
    if (selectedDate) {
      setValue('date', selectedDate.toISOString().split('T')[0]);
    }
  }, [selectedDate, setValue]);

  const onFormSubmit = async (data: WorkShiftFormData) => {
    // Convert form data to API format using helpers
    const createData: CreateWorkShiftRequest = {
      staffId: data.staffId,
      branchId: data.branchId,
      startTime: localDateTimeToUtcISO(data.date, data.startTime),
      endTime: localDateTimeToUtcISO(data.date, data.endTime)
    };

    onSubmit(createData);
  };

  const handleStaffChange = (staffId: string) => {
    setValue('staffId', staffId);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Staff Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('workshift.staff_selection')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="branchId" className="text-sm font-medium text-gray-700">
                {t('workshift.branch')} *
              </Label>
              <Select onValueChange={(value) => setValue('branchId', value)}>
                <SelectTrigger className={cn(errors.branchId && 'border-red-500')}>
                  <SelectValue placeholder={t('workshift.select_branch')} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch._id} value={branch._id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {branch.branchName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.branchId && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.branchId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="staffId" className="text-sm font-medium text-gray-700">
                {t('workshift.staff')} *
              </Label>
              <Select onValueChange={handleStaffChange} disabled={!selectedBranchId || loadingStaff}>
                <SelectTrigger className={cn(errors.staffId && 'border-red-500')}>
                  <SelectValue placeholder={loadingStaff ? t('common.loading') : t('workshift.select_staff')} />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    if (loadingStaff) {
                      return (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('common.loading')}
                          </div>
                        </SelectItem>
                      );
                    }

                    if (staffList.length > 0) {
                      return staffList.map((staff) => (
                        <SelectItem key={staff._id} value={staff._id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {staff.userId.fullName} ({staff.jobTitle})
                          </div>
                        </SelectItem>
                      ));
                    }

                    return (
                      <SelectItem value="no-staff" disabled>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {t('staff.no_staff_available')}
                        </div>
                      </SelectItem>
                    );
                  })()}
                </SelectContent>
              </Select>
              {errors.staffId && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.staffId.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {t('workshift.date_selection')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">{t('workshift.work_date')} *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground',
                      errors.date && 'border-red-500'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? formatDate(selectedDate) : t('workshift.select_date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.date.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Time Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('workshift.time_selection')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-medium text-gray-700">
                  {t('workshift.startTime')} *
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  {...register('startTime')}
                  className={cn(errors.startTime && 'border-red-500')}
                />
                {errors.startTime && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.startTime.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-sm font-medium text-gray-700">
                  {t('workshift.endTime')} *
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  {...register('endTime')}
                  className={cn(errors.endTime && 'border-red-500')}
                />
                {errors.endTime && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default WorkShiftForm;
