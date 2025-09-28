import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  X,
  Clock,
  User,
  MapPin,
  Calendar as CalendarIcon,
  Plus,
  Info,
  Settings,
  ChevronDown,
  GripVertical
} from 'lucide-react';
import { cn } from '@/utils/utils';
import { useBranch } from '@/contexts/BranchContext';
import { staffApi } from '@/services/api/staffApi';
import type { Staff } from '@/types/api/Staff';
import { useAuthState } from '@/hooks/useAuth';
import WorkShiftList from './WorkShiftList';
import { workShiftApi } from '@/services/api/workShiftApi';
import type { WorkShift } from '@/types/api/WorkShift';
import type { StaffScheduleModalProps, StaffScheduleFormData } from '@/types/api/StaffSchedule';

const scheduleSchema = z.object({
  title: z.string().min(1, 'Schedule title is required'),
  staffId: z.string().min(1, 'Staff selection is required'),
  branchId: z.string().min(1, 'Branch selection is required'),
  duration: z.number().min(15, 'Minimum duration is 15 minutes').max(480, 'Maximum duration is 8 hours'),
  availability: z.object({
    sunday: z.object({ enabled: z.boolean(), startTime: z.string(), endTime: z.string() }),
    monday: z.object({ enabled: z.boolean(), startTime: z.string(), endTime: z.string() }),
    tuesday: z.object({ enabled: z.boolean(), startTime: z.string(), endTime: z.string() }),
    wednesday: z.object({ enabled: z.boolean(), startTime: z.string(), endTime: z.string() }),
    thursday: z.object({ enabled: z.boolean(), startTime: z.string(), endTime: z.string() }),
    friday: z.object({ enabled: z.boolean(), startTime: z.string(), endTime: z.string() }),
    saturday: z.object({ enabled: z.boolean(), startTime: z.string(), endTime: z.string() })
  }),
  schedulingWindow: z.object({
    advanceDays: z.number(),
    maxHours: z.number()
  }),
  timezone: z.string().min(1, 'Timezone is required')
});

const StaffScheduleModal: React.FC<StaffScheduleModalProps> = ({ isOpen, onClose, selectedStaffId, initialData }) => {
  const { t } = useTranslation();
  const { branches } = useBranch();
  const { isAuthenticated, user } = useAuthState();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [modalWidth, setModalWidth] = useState(1200);
  const [isResizing, setIsResizing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // WorkShift data
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [loadingWorkShifts, setLoadingWorkShifts] = useState(false);
  const [workShiftError, setWorkShiftError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<StaffScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      title: '',
      staffId: selectedStaffId || '',
      branchId: '',
      duration: 60,
      availability: {
        sunday: { enabled: false, startTime: '09:00', endTime: '17:00' },
        monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        saturday: { enabled: false, startTime: '09:00', endTime: '17:00' }
      },
      schedulingWindow: {
        advanceDays: 60,
        maxHours: 4
      },
      timezone: '(GMT+07:00) Indochina Time - Ho Chi Minh City'
    }
  });

  const watchedBranchId = watch('branchId');
  const watchedAvailability = watch('availability');

  // Fetch staff list
  useEffect(() => {
    const fetchStaff = async () => {
      if (watchedBranchId && isAuthenticated) {
        setLoadingStaff(true);
        const response = await staffApi.getStaffList({ branchId: watchedBranchId });
        if (response.success) {
          setStaffList(response.data.staffList);
        } else {
          console.error('Failed to fetch staff:', response.message);
          setStaffList([]);
        }
        setLoadingStaff(false);
      } else {
        setStaffList([]);
      }
    };
    fetchStaff();
  }, [watchedBranchId, isAuthenticated]);

  // Fetch workshifts when selectedStaffId changes
  useEffect(() => {
    const fetchWorkShifts = async () => {
      if (selectedStaffId && isAuthenticated) {
        setLoadingWorkShifts(true);
        setWorkShiftError(null);
        const response = await workShiftApi.getWorkShiftsByStaff(selectedStaffId, { limit: 20 });
        if (response.success) {
          setWorkShifts(response.data.data);
        } else {
          setWorkShiftError(response.message || 'Failed to fetch workshifts');
          setWorkShifts([]);
        }
        setLoadingWorkShifts(false);
      } else {
        setWorkShifts([]);
      }
    };
    fetchWorkShifts();
  }, [selectedStaffId, isAuthenticated]);

  const onSubmit = async () => {
    onClose();
  };

  const refetchWorkShifts = async (): Promise<void> => {
    if (selectedStaffId && isAuthenticated) {
      setLoadingWorkShifts(true);
      setWorkShiftError(null);
      const response = await workShiftApi.getWorkShiftsByStaff(selectedStaffId, { limit: 20 });
      if (response.success) {
        setWorkShifts(response.data.data);
      } else {
        setWorkShiftError(response.message || 'Failed to fetch workshifts');
        setWorkShifts([]);
      }
      setLoadingWorkShifts(false);
    }
  };

  const weekDays = [
    { key: 'sunday', label: 'Sun', fullName: t('common.days.sunday') },
    { key: 'monday', label: 'Mon', fullName: t('common.days.monday') },
    { key: 'tuesday', label: 'Tue', fullName: t('common.days.tuesday') },
    { key: 'wednesday', label: 'Wed', fullName: t('common.days.wednesday') },
    { key: 'thursday', label: 'Thu', fullName: t('common.days.thursday') },
    { key: 'friday', label: 'Fri', fullName: t('common.days.friday') },
    { key: 'saturday', label: 'Sat', fullName: t('common.days.saturday') }
  ];

  const durations = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1 hour 30 minutes' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' },
    { value: 240, label: '4 hours' }
  ];

  const handleDayToggle = (dayKey: keyof StaffScheduleFormData['availability']) => {
    const currentAvailability = watchedAvailability || {};
    const currentValue = currentAvailability[dayKey]?.enabled;
    setValue(`availability.${dayKey}.enabled`, !currentValue);
  };

  const handleTimeChange = (
    dayKey: keyof StaffScheduleFormData['availability'],
    timeType: 'startTime' | 'endTime',
    value: string
  ) => {
    setValue(`availability.${dayKey}.${timeType}`, value);
  };

  // Handle resize functionality
  useEffect(() => {
    const handleResize = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 500;
      const maxWidth = window.innerWidth * 0.9;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setModalWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const handleMouseDown = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      mouseEvent.preventDefault();
      setIsResizing(true);
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };

    if (isOpen) {
      const resizeHandle = document.querySelector('[data-resize-handle]');
      if (resizeHandle) {
        resizeHandle.addEventListener('mousedown', handleMouseDown);
      }
    }

    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isOpen, isResizing]);

  if (!isOpen) return null;

  // Check authentication
  if (!isAuthenticated || !user) {
    console.warn('User not authenticated or user data missing');
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <button
        className="fixed inset-0 bg-black/50 border-none cursor-default"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
        aria-label="Close modal"
      />

      {/* Resizable Modal */}
      <div
        ref={modalRef}
        className="fixed right-0 top-0 h-full bg-background border-l shadow-lg flex flex-col transition-all duration-200"
        style={{
          width: `${modalWidth}px`,
          minWidth: '500px',
          maxWidth: '90vw'
        }}
      >
        {/* Resize Handle */}
        <div
          className={cn(
            'absolute left-0 top-0 w-2 h-full cursor-col-resize z-10 transition-all duration-200 group',
            isResizing ? 'bg-orange-400' : 'bg-gray-200 hover:bg-gray-300'
          )}
          data-resize-handle
        >
          <div
            className={cn(
              'absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200',
              isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
          >
            <GripVertical className="h-4 w-4 text-gray-600" />
          </div>
        </div>
        {/* Header */}
        <div className="border-b px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {initialData ? t('workshift.edit_schedule') : t('workshift.create_schedule')}
              </h2>
              <p className="text-sm text-gray-500">{t('workshift.schedule_description')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Info className="h-4 w-4 mr-1" />
                {t('common.help')}
              </Button>
              <Button variant="outline" size="sm">
                {t('common.feedback')}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Basic Information */}
              <Card className="w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('workshift.basic_info')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="title" className="text-xs font-medium">
                      {t('workshift.schedule_title')} *
                    </Label>
                    <Input
                      id="title"
                      placeholder={t('workshift.schedule_title_placeholder')}
                      {...register('title')}
                      className={cn('h-8 text-sm', errors.title && 'border-red-500')}
                    />
                    {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="branchId" className="text-xs font-medium">
                        {t('workshift.branch')} *
                      </Label>
                      <Select onValueChange={(value) => setValue('branchId', value)}>
                        <SelectTrigger className={cn('h-8 text-sm', errors.branchId && 'border-red-500')}>
                          <SelectValue placeholder={t('workshift.select_branch')} />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch._id} value={branch._id}>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                {branch.branchName}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.branchId && <p className="text-xs text-red-600">{errors.branchId.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="staffId" className="text-xs font-medium">
                        {t('workshift.staff')} *
                      </Label>
                      <Select
                        onValueChange={(value) => setValue('staffId', value)}
                        disabled={!watchedBranchId || loadingStaff}
                      >
                        <SelectTrigger className={cn('h-8 text-sm', errors.staffId && 'border-red-500')}>
                          <SelectValue placeholder={loadingStaff ? t('common.loading') : t('workshift.select_staff')} />
                        </SelectTrigger>
                        <SelectContent>
                          {staffList.map((staff) => (
                            <SelectItem key={staff._id} value={staff._id}>
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3" />
                                {staff.userId.fullName} ({staff.jobTitle})
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.staffId && <p className="text-xs text-red-600">{errors.staffId.message}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shift Duration */}
              <Card className="w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t('workshift.shift_duration')}
                  </CardTitle>
                  <p className="text-xs text-gray-500">{t('workshift.duration_description')}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">{t('workshift.duration')}</Label>
                    <Select onValueChange={(value) => setValue('duration', parseInt(value))}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="1 hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {durations.map((duration) => (
                          <SelectItem key={duration.value} value={duration.value.toString()}>
                            {duration.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Scheduling Window */}
              <Card className="w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {t('workshift.scheduling_window')}
                  </CardTitle>
                  <p className="text-xs text-gray-500">{t('workshift.scheduling_window_description')}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">{t('workshift.advance_days')}</Label>
                      <Input
                        type="number"
                        defaultValue={60}
                        onChange={(e) => setValue('schedulingWindow.advanceDays', parseInt(e.target.value))}
                        className="h-8 text-sm"
                      />
                      <p className="text-xs text-gray-500">{t('workshift.advance_days_description')}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">{t('workshift.max_hours_before')}</Label>
                      <Input
                        type="number"
                        defaultValue={4}
                        onChange={(e) => setValue('schedulingWindow.maxHours', parseInt(e.target.value))}
                        className="h-8 text-sm"
                      />
                      <p className="text-xs text-gray-500">{t('workshift.max_hours_description')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* General Availability */}
              <Card className="w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {t('workshift.general_availability')}
                  </CardTitle>
                  <p className="text-xs text-gray-500">{t('workshift.availability_description')}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Label className="text-xs font-medium">{t('workshift.repeat_weekly')}</Label>
                    <ChevronDown className="h-3 w-3 text-gray-400" />
                  </div>

                  <div className="space-y-1">
                    {weekDays.map((day) => {
                      const dayData = (watchedAvailability as StaffScheduleFormData['availability'])?.[
                        day.key as keyof StaffScheduleFormData['availability']
                      ];
                      const isEnabled = dayData?.enabled || false;

                      return (
                        <div key={day.key} className="flex items-center gap-3 p-2 border rounded text-sm">
                          <div className="w-10 text-center">
                            <span className="text-xs font-medium">{day.label}</span>
                          </div>

                          {isEnabled ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                type="time"
                                value={dayData?.startTime || '09:00'}
                                onChange={(e) =>
                                  handleTimeChange(
                                    day.key as keyof StaffScheduleFormData['availability'],
                                    'startTime',
                                    e.target.value
                                  )
                                }
                                className="w-20 h-7 text-xs"
                              />
                              <span className="text-gray-500 text-xs">–</span>
                              <Input
                                type="time"
                                value={dayData?.endTime || '17:00'}
                                onChange={(e) =>
                                  handleTimeChange(
                                    day.key as keyof StaffScheduleFormData['availability'],
                                    'endTime',
                                    e.target.value
                                  )
                                }
                                className="w-20 h-7 text-xs"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center flex-1">
                              <span className="text-gray-500 text-xs">{t('workshift.unavailable')}</span>
                            </div>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDayToggle(day.key as keyof StaffScheduleFormData['availability'])}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 p-2 bg-gray-50 rounded border">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="h-3 w-3 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">{t('workshift.timezone')}</span>
                    </div>
                    <Select onValueChange={(value) => setValue('timezone', value)}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="(GMT+07:00) Indochina Time - Ho Chi Minh City" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="(GMT+07:00) Indochina Time - Ho Chi Minh City">
                          (GMT+07:00) Indochina Time - Ho Chi Minh City
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* WorkShift List */}
              <Card className="w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {t('workshift.existing_shifts')}
                  </CardTitle>
                  <p className="text-xs text-gray-500">{t('workshift.existing_shifts_description')}</p>
                </CardHeader>
                <CardContent>
                  {(() => {
                    if (loadingWorkShifts) {
                      return (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                          <span className="ml-2 text-sm text-gray-500">{t('common.loading')}</span>
                        </div>
                      );
                    }

                    if (workShiftError) {
                      return (
                        <div className="text-center py-8">
                          <p className="text-sm text-red-600 mb-2">{t('workshift.fetch_error')}</p>
                          <Button variant="outline" size="sm" onClick={() => refetchWorkShifts()}>
                            {t('common.retry')}
                          </Button>
                        </div>
                      );
                    }

                    return <WorkShiftList workShifts={workShifts} loading={loadingWorkShifts} />;
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t flex-shrink-0">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                {t('common.next')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffScheduleModal;
