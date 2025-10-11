import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Plus, Settings, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AvailabilityFormProps } from '@/types/forms/StaffScheduleFormTypes';
import type { StaffScheduleFormData } from '@/types/api/StaffSchedule';

const AvailabilityForm: React.FC<AvailabilityFormProps> = ({
  form,
  onTimeChange,
  onDayToggle,
  onAvailabilityDayClick
}) => {
  const { t } = useTranslation();
  const { setValue, watch } = form;
  const watchedAvailability = watch('availability');

  const weekDays = [
    { key: 'sunday', label: 'Sun', fullName: t('common.days.sunday') },
    { key: 'monday', label: 'Mon', fullName: t('common.days.monday') },
    { key: 'tuesday', label: 'Tue', fullName: t('common.days.tuesday') },
    { key: 'wednesday', label: 'Wed', fullName: t('common.days.wednesday') },
    { key: 'thursday', label: 'Thu', fullName: t('common.days.thursday') },
    { key: 'friday', label: 'Fri', fullName: t('common.days.friday') },
    { key: 'saturday', label: 'Sat', fullName: t('common.days.saturday') }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          {t('workshift.general_availability')}
        </CardTitle>
        <p className="text-xs text-gray-500">{t('workshift.availability_description')}</p>
        <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
          💡 <strong>Tip:</strong> Click on any day name to auto-fill Start/End Time fields above
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Label className="text-xs font-medium">{t('workshift.repeat_weekly')}</Label>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </div>

        <div className="space-y-1">
          {weekDays.map((day) => {
            const dayData = watchedAvailability?.[day.key as keyof StaffScheduleFormData['availability']];
            const isEnabled = dayData?.enabled || false;

            return (
              <div key={day.key} className="flex items-center gap-3 p-2 border rounded text-sm">
                <div
                  className="w-10 text-center cursor-pointer hover:bg-gray-50 rounded px-1 py-1"
                  onClick={() => onAvailabilityDayClick(day.key as keyof StaffScheduleFormData['availability'])}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onAvailabilityDayClick(day.key as keyof StaffScheduleFormData['availability']);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  title="Click to auto-fill Start/End Time"
                >
                  <span className="text-xs font-medium">{day.label}</span>
                </div>

                {isEnabled ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={dayData?.startTime || '09:00'}
                      onChange={(e) =>
                        onTimeChange(
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
                        onTimeChange(day.key as keyof StaffScheduleFormData['availability'], 'endTime', e.target.value)
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
                  onClick={() => onDayToggle(day.key as keyof StaffScheduleFormData['availability'])}
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
  );
};

export default AvailabilityForm;
