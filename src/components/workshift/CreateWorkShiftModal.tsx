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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarIcon, Clock, User, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { cn, formatDate } from '@/utils/utils';
import { localDateStringYMD, localDateTimeToUtcISO } from '@/utils/datetime';
import { useBranch } from '@/contexts/BranchContext';
import { staffApi } from '@/services/api/staffApi';
import { useWorkShiftOperations } from '@/hooks/useWorkShift';
import type { Staff } from '@/types/api/Staff';
import type { CreateWorkShiftRequest, CreateWorkShiftModalProps } from '@/types/api/WorkShift';

// Validation schema
const createWorkShiftSchema = z
  .object({
    staff_id: z.string().min(1, 'Staff is required'),
    branch_id: z.string().min(1, 'Branch is required'),
    date: z.string().min(1, 'Date is required'),
    start_time: z.string().min(1, 'Start time is required'),
    end_time: z.string().min(1, 'End time is required')
  })
  .refine(
    (data) => {
      if (data.start_time && data.end_time) {
        const startTime = new Date(`2000-01-01T${data.start_time}`);
        const endTime = new Date(`2000-01-01T${data.end_time}`);
        return endTime > startTime;
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['end_time']
    }
  );

type CreateWorkShiftFormData = z.infer<typeof createWorkShiftSchema>;

const CreateWorkShiftModal: React.FC<CreateWorkShiftModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { branches } = useBranch();
  const { createWorkShift, loading } = useWorkShiftOperations();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<CreateWorkShiftFormData>({
    resolver: zodResolver(createWorkShiftSchema),
    defaultValues: {
      staff_id: '',
      branch_id: '',
      date: '',
      start_time: '',
      end_time: ''
    }
  });

  const selectedBranchId = watch('branch_id');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset();
      setSelectedDate(undefined);
    }
  }, [isOpen, reset]);

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
      } else {
        console.error('Failed to fetch staff:', response.message);
        setStaffList([]);
      }
      setLoadingStaff(false);
    };

    fetchStaff();
  }, [selectedBranchId]);

  // Update form when date changes
  useEffect(() => {
    if (selectedDate) {
      // Use common helper to avoid UTC shifting issues
      setValue('date', localDateStringYMD(selectedDate));
    }
  }, [selectedDate, setValue]);

  const onSubmit = async (data: CreateWorkShiftFormData) => {
    // Convert form data to API format using helpers
    const createData: CreateWorkShiftRequest = {
      staff_id: data.staff_id,
      branch_id: data.branch_id,
      start_time: localDateTimeToUtcISO(data.date, data.start_time),
      end_time: localDateTimeToUtcISO(data.date, data.end_time)
    };

    const result = await createWorkShift(createData);
    if (result) {
      onSuccess?.();
      onClose();
    }
  };

  const handleStaffChange = (staffId: string) => {
    setValue('staff_id', staffId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">{t('workshift.create_workshift')}</DialogTitle>
          </div>
          <p className="text-sm text-gray-600">{t('workshift.create_description')}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="branch_id" className="text-sm font-medium">
                  Branch *
                </Label>
                <Select onValueChange={(value) => setValue('branch_id', value)}>
                  <SelectTrigger className={cn(errors.branch_id && 'border-red-500')}>
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
                {errors.branch_id && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.branch_id.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff_id" className="text-sm font-medium">
                  Staff *
                </Label>
                <Select onValueChange={handleStaffChange} disabled={!selectedBranchId || loadingStaff}>
                  <SelectTrigger className={cn(errors.staff_id && 'border-red-500')}>
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
                            No staff available
                          </div>
                        </SelectItem>
                      );
                    })()}
                  </SelectContent>
                </Select>
                {errors.staff_id && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.staff_id.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Date Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {t('workshift.date_selection')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('workshift.work_date')} *</Label>
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
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('workshift.time_selection')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time" className="text-sm font-medium">
                    {t('workshift.start_time')} *
                  </Label>
                  <Input
                    id="start_time"
                    type="time"
                    {...register('start_time')}
                    className={cn(errors.start_time && 'border-red-500')}
                  />
                  {errors.start_time && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.start_time.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time" className="text-sm font-medium">
                    {t('workshift.end_time')} *
                  </Label>
                  <Input
                    id="end_time"
                    type="time"
                    {...register('end_time')}
                    className={cn(errors.end_time && 'border-red-500')}
                  />
                  {errors.end_time && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.end_time.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('workshift.creating')}
                </>
              ) : (
                t('workshift.create_workshift')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkShiftModal;
