import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DayShiftSelector from './DayShiftSelector';
import WeeklyFixedShiftSelector from './WeeklyFixedShiftSelector';
import type { AvailabilityFormProps } from '@/types/forms/StaffScheduleFormTypes';
import type { StaffScheduleFormData, FixedShift, ShiftType } from '@/types/api/StaffSchedule';
import { SHIFT_TIMES } from '@/types/api/StaffSchedule';

const AvailabilityForm: React.FC<AvailabilityFormProps> = ({
  form,
  onShiftToggle,
  onCustomTimeChange,
  customShiftTimes,
  staffList = [],
  selectedStaffId
}) => {
  const { t } = useTranslation();
  const { setValue, watch } = form;
  const watchedAvailability = watch('availability');

  // Check if selected staff needs fixed shifts
  const selectedStaff = staffList.find((staff) => staff._id === selectedStaffId);
  const needsFixedShifts =
    selectedStaff?.jobTitle === 'Personal Trainer' ||
    selectedStaff?.jobTitle === 'Technician' ||
    selectedStaff?.jobTitle === 'Manager';

  // Fixed shifts state
  const [fixedShifts] = useState<FixedShift[]>([
    { dayOfWeek: 'MONDAY', morning: false, afternoon: false, evening: false },
    { dayOfWeek: 'TUESDAY', morning: false, afternoon: false, evening: false },
    { dayOfWeek: 'WEDNESDAY', morning: false, afternoon: false, evening: false },
    { dayOfWeek: 'THURSDAY', morning: false, afternoon: false, evening: false },
    { dayOfWeek: 'FRIDAY', morning: false, afternoon: false, evening: false },
    { dayOfWeek: 'SATURDAY', morning: false, afternoon: false, evening: false },
    { dayOfWeek: 'SUNDAY', morning: false, afternoon: false, evening: false }
  ]);

  // Convert fixed shifts to availability format when staff needs fixed shifts
  useEffect(() => {
    if (needsFixedShifts) {
      const newAvailability = {
        sunday: { enabled: false, startTime: '09:00', endTime: '17:00', shifts: [] as ShiftType[] },
        monday: { enabled: false, startTime: '09:00', endTime: '17:00', shifts: [] as ShiftType[] },
        tuesday: { enabled: false, startTime: '09:00', endTime: '17:00', shifts: [] as ShiftType[] },
        wednesday: { enabled: false, startTime: '09:00', endTime: '17:00', shifts: [] as ShiftType[] },
        thursday: { enabled: false, startTime: '09:00', endTime: '17:00', shifts: [] as ShiftType[] },
        friday: { enabled: false, startTime: '09:00', endTime: '17:00', shifts: [] as ShiftType[] },
        saturday: { enabled: false, startTime: '09:00', endTime: '17:00', shifts: [] as ShiftType[] }
      };

      // Map fixed shifts to availability
      for (const shift of fixedShifts) {
        const dayMap: { [key: string]: keyof typeof newAvailability } = {
          MONDAY: 'monday',
          TUESDAY: 'tuesday',
          WEDNESDAY: 'wednesday',
          THURSDAY: 'thursday',
          FRIDAY: 'friday',
          SATURDAY: 'saturday',
          SUNDAY: 'sunday'
        };

        const dayKey = dayMap[shift.dayOfWeek];
        const selectedShifts: ShiftType[] = [];

        // Map boolean shifts to ShiftType array
        if (shift.morning) selectedShifts.push('MORNING');
        if (shift.afternoon) selectedShifts.push('AFTERNOON');
        if (shift.evening) selectedShifts.push('EVENING');

        if (dayKey && selectedShifts.length > 0) {
          const timeRange = getTimeRangeFromShifts(shift);
          newAvailability[dayKey] = {
            enabled: true,
            startTime: timeRange.startTime,
            endTime: timeRange.endTime,
            shifts: selectedShifts
          };
        }
      }

      setValue('availability', newAvailability);
    }
  }, [fixedShifts, needsFixedShifts, setValue]);

  // Helper function to determine time range from selected shifts
  const getTimeRangeFromShifts = (shift: FixedShift) => {
    const selectedShifts: ShiftType[] = [];
    if (shift.morning) selectedShifts.push('MORNING');
    if (shift.afternoon) selectedShifts.push('AFTERNOON');
    if (shift.evening) selectedShifts.push('EVENING');

    if (selectedShifts.length === 0) {
      return { startTime: '09:00', endTime: '17:00' };
    }

    // Get earliest start time and latest end time from selected shifts
    let earliestStart = '23:59';
    let latestEnd = '00:00';

    for (const shiftType of selectedShifts) {
      const { start, end } = SHIFT_TIMES[shiftType];
      if (start < earliestStart) earliestStart = start;
      if (end > latestEnd) latestEnd = end;
    }

    return { startTime: earliestStart, endTime: latestEnd };
  };

  const weekDays = [
    { key: 'sunday', label: t('workshift.days.sun'), fullName: t('common.days.sunday') },
    { key: 'monday', label: t('workshift.days.mon'), fullName: t('common.days.monday') },
    { key: 'tuesday', label: t('workshift.days.tue'), fullName: t('common.days.tuesday') },
    { key: 'wednesday', label: t('workshift.days.wed'), fullName: t('common.days.wednesday') },
    { key: 'thursday', label: t('workshift.days.thu'), fullName: t('common.days.thursday') },
    { key: 'friday', label: t('workshift.days.fri'), fullName: t('common.days.friday') },
    { key: 'saturday', label: t('workshift.days.sat'), fullName: t('common.days.saturday') }
  ];

  // Show fixed shift selector for all staff types
  if (needsFixedShifts) {
    return (
      <div className="space-y-4">
        <WeeklyFixedShiftSelector
          form={form}
          onShiftToggle={onShiftToggle}
          onCustomTimeChange={onCustomTimeChange}
          customShiftTimes={customShiftTimes}
          jobTitle={selectedStaff?.jobTitle || 'Personal Trainer'}
        />

        <Card className="w-full">
          <CardContent className="p-2">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-3 w-3 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">{t('workshift.timezone')}</span>
            </div>
            <Select onValueChange={(value) => setValue('timezone', value)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder={t('workshift.timezone_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="(GMT+07:00) Indochina Time - Ho Chi Minh City">
                  (GMT+07:00) Indochina Time - Ho Chi Minh City
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show shift-based availability form for all staff
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          {t('workshift.shift_schedule')}
        </CardTitle>
        <p className="text-xs text-gray-500">{t('workshift.shift_schedule_description')}</p>
        <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
          💡 <strong>{t('workshift.tip')}</strong> {t('workshift.shift_schedule_description')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Day Cards with Shift Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {weekDays.map((day) => {
            const dayData = watchedAvailability?.[day.key as keyof StaffScheduleFormData['availability']];
            const selectedShifts = dayData?.shifts || [];
            const isEnabled = dayData?.enabled || false;

            return (
              <DayShiftSelector
                key={day.key}
                dayLabel={day.fullName}
                selectedShifts={selectedShifts}
                onShiftToggle={(shift: ShiftType) =>
                  onShiftToggle(day.key as keyof StaffScheduleFormData['availability'], shift)
                }
                enabled={isEnabled}
              />
            );
          })}
        </div>

        {/* Timezone Selection */}
        <div className="mt-4 p-2 bg-gray-50 rounded border">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-3 w-3 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">{t('workshift.timezone')}</span>
          </div>
          <Select onValueChange={(value) => setValue('timezone', value)}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder={t('workshift.timezone_placeholder')} />
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
