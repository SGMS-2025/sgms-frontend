import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/utils/utils';
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
  onStartEndTimeChange
}) => {
  const { t } = useTranslation();
  const {
    register,
    watch,
    formState: { errors }
  } = form;
  const watchedBranchId = watch('branchId');

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
            {...register('title')}
            className={cn('h-8 text-sm', errors.title && 'border-red-500')}
          />
          {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="scheduleDate" className="text-xs font-medium">
              Schedule Date *
            </Label>
            <Input
              id="scheduleDate"
              type="date"
              {...register('scheduleDate')}
              className={cn('h-8 text-sm', errors.scheduleDate && 'border-red-500')}
            />
            {errors.scheduleDate && <p className="text-xs text-red-600">{errors.scheduleDate.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="type" className="text-xs font-medium">
              Schedule Type *
            </Label>
            <select
              id="type"
              {...register('type')}
              className={cn('h-8 text-sm border rounded-md px-3', errors.type && 'border-red-500')}
            >
              <option value="FREE_TIME">Free Time</option>
              <option value="PERSONAL_TRAINING">Personal Training</option>
              <option value="CLASS">Class</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
            {errors.type && <p className="text-xs text-red-600">{errors.type.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="startTime" className="text-xs font-medium">
              Start Time *
            </Label>
            <Input
              id="startTime"
              type="time"
              {...register('timeRange.startTime')}
              onChange={(e) => {
                register('timeRange.startTime').onChange(e);
                onStartEndTimeChange?.('startTime', e.target.value);
              }}
              className={cn('h-8 text-sm', errors.timeRange?.startTime && 'border-red-500')}
            />
            {errors.timeRange?.startTime && (
              <p className="text-xs text-red-600">{errors.timeRange.startTime.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="endTime" className="text-xs font-medium">
              End Time *
            </Label>
            <Input
              id="endTime"
              type="time"
              {...register('timeRange.endTime')}
              onChange={(e) => {
                register('timeRange.endTime').onChange(e);
                onStartEndTimeChange?.('endTime', e.target.value);
              }}
              className={cn('h-8 text-sm', errors.timeRange?.endTime && 'border-red-500')}
            />
            {errors.timeRange?.endTime && <p className="text-xs text-red-600">{errors.timeRange.endTime.message}</p>}
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
              <Select onValueChange={onBranchChange}>
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
                  onValueChange={onStaffChange}
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
