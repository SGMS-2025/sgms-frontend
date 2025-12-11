import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/utils/utils';
import { getScheduleTypeLabel } from '@/utils/scheduleTypeHelpers';
import type { BasicInfoFormProps } from '@/types/forms/StaffScheduleFormTypes';

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({
  form,
  branches,
  staffList,
  selectedTemplate,
  templateStaffInfo,
  isStaffFieldDisabled,
  loadingStaff,
  onStaffChange,
  onBranchChange,
  scheduleDateError,
  onScheduleDateChange
}) => {
  const { t } = useTranslation();
  const {
    register,
    watch,
    formState: { errors }
  } = form;
  const watchedBranchId = watch('branchId');
  const [scheduleDateOpen, setScheduleDateOpen] = React.useState(false);

  const selectedScheduleDate = React.useMemo(() => {
    const value = watch('scheduleDate');
    if (!value) return undefined;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }, [watch]);

  return (
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
            {...register('title', {
              onChange: () => {
                // Clear error when user starts typing
                if (errors.title) {
                  form.clearErrors('title');
                }
              }
            })}
            className={cn('h-8 text-sm', errors.title && 'border-red-500')}
          />
          {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="scheduleDate" className="text-xs font-medium">
              {t('workshift.schedule_date')} *
            </Label>
            <Popover open={scheduleDateOpen} onOpenChange={setScheduleDateOpen} modal={false}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'h-8 text-sm w-full justify-between text-left font-normal',
                    (errors.scheduleDate || scheduleDateError) && 'border-red-500'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {selectedScheduleDate
                      ? format(selectedScheduleDate, 'dd/MM/yyyy', { locale: vi })
                      : t('membership_registration.activation_date_placeholder', { defaultValue: 'Chọn ngày' })}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto rounded-2xl border border-border bg-white p-0 shadow-lg z-[9999]"
                align="start"
                side="bottom"
                sideOffset={8}
                collisionPadding={8}
              >
                <CalendarComponent
                  mode="single"
                  selected={selectedScheduleDate}
                  onSelect={(date) => {
                    const value = date ? format(date, 'yyyy-MM-dd') : '';
                    form.setValue('scheduleDate', value, { shouldValidate: true, shouldDirty: true });
                    onScheduleDateChange?.(value);
                    setScheduleDateOpen(false);
                  }}
                  initialFocus
                  locale={vi}
                  className="bg-white"
                />
              </PopoverContent>
            </Popover>
            {errors.scheduleDate && <p className="text-xs text-red-600">{errors.scheduleDate.message}</p>}
            {scheduleDateError && <p className="text-xs text-red-600">{scheduleDateError}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="type" className="text-xs font-medium">
              {t('workshift.schedule_type')} *
            </Label>
            <select
              id="type"
              {...register('type')}
              className={cn('h-8 text-sm border rounded-md px-3', errors.type && 'border-red-500')}
            >
              <option value="FREE_TIME">{getScheduleTypeLabel('FREE_TIME', t)}</option>
              <option value="PERSONAL_TRAINING">{getScheduleTypeLabel('PERSONAL_TRAINING', t)}</option>
              <option value="CLASS">{getScheduleTypeLabel('CLASS', t)}</option>
              <option value="MAINTENANCE">{getScheduleTypeLabel('MAINTENANCE', t)}</option>
            </select>
            {errors.type && <p className="text-xs text-red-600">{errors.type.message}</p>}
          </div>
        </div>

        {/* Info note about shift-based scheduling */}
        <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded border border-blue-200">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">
              {t(
                'workshift.shift_based_info',
                'Shift times are automatically set based on your selections below (Morning: 08:00-12:00, Afternoon: 13:00-17:00, Evening: 17:00-21:00)'
              )}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="branchId" className="text-xs font-medium">
              {t('workshift.branch')} *
              {selectedTemplate?.branchId && <span className="ml-2 text-xs text-green-600">(from template)</span>}
            </Label>
            {selectedTemplate?.branchId ? (
              <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {(() => {
                      // Handle both string ID and BranchReference object
                      const branchId = selectedTemplate.branchId;
                      if (branchId && typeof branchId === 'object' && 'branchName' in branchId) {
                        // If branchId is an object (BranchReference), use branchName directly
                        return branchId.branchName || t('common.unknown');
                      } else if (typeof branchId === 'string') {
                        // If branchId is a string, find the branch name from branches array
                        const branch = branches.find((b) => b._id === branchId);
                        return branch?.branchName || t('common.unknown');
                      } else {
                        return t('common.unknown');
                      }
                    })()}
                  </span>
                  <span className="text-xs text-green-600">(Pre-selected from template)</span>
                </div>
              </div>
            ) : (
              <Select
                onValueChange={(value) => {
                  onBranchChange(value);
                  // Clear error and trigger validation after selection
                  form.clearErrors('branchId');
                  form.trigger('branchId');
                }}
              >
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
            )}
            {errors.branchId && <p className="text-xs text-red-600">{errors.branchId.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="staffId" className="text-xs font-medium">
              {t('workshift.staff')} *
              {templateStaffInfo && <span className="ml-2 text-xs text-green-600">(from template)</span>}
            </Label>
            {templateStaffInfo ? (
              <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">{templateStaffInfo.name}</span>
                  <span className="text-xs text-green-600">(Pre-selected from template)</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Select
                  onValueChange={(value) => {
                    onStaffChange(value);
                    // Clear error and trigger validation after selection
                    form.clearErrors('staffId');
                    form.trigger('staffId');
                  }}
                  disabled={!watchedBranchId || loadingStaff || isStaffFieldDisabled}
                >
                  <SelectTrigger className={cn('h-8 text-sm', errors.staffId && 'border-red-500')}>
                    <SelectValue placeholder={loadingStaff ? t('common.loading') : t('workshift.select_staff')} />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((staff) => (
                      <SelectItem key={staff._id} value={staff._id}>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          {staff.userId?.fullName || 'Unknown'} ({staff.jobTitle})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && !templateStaffInfo && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>
                        {(() => {
                          switch (selectedTemplate.type) {
                            case 'PERSONAL_TRAINING':
                              return 'Showing Personal Trainers for this template';
                            case 'MAINTENANCE':
                              return 'Showing Technicians for this template';
                            case 'CLASS':
                              return 'Showing Personal Trainers and Managers for this template';
                            default:
                              return 'Showing all available staff for this template';
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            {errors.staffId && <p className="text-xs text-red-600">{errors.staffId.message}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BasicInfoForm;
