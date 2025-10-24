import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Copy, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { UseFormReturn } from 'react-hook-form';
import DayFlexibleShiftCard from './DayFlexibleShiftCard';
import type { FixedShift, CustomShiftTime, StaffScheduleFormData } from '@/types/api/StaffSchedule';

interface WeeklyFixedShiftSelectorProps {
  form: UseFormReturn<StaffScheduleFormData, unknown, StaffScheduleFormData>;
  onShiftToggle: (dayKey: keyof StaffScheduleFormData['availability'], shift: ShiftType) => void;
  onCustomTimeChange?: (dayKey: string, shiftKey: string, customTime: CustomShiftTime | null) => void;
  onAddCustomShift?: (dayKey: keyof StaffScheduleFormData['availability'], customShift: CustomShiftTime) => void;
  customShiftTimes?: Record<string, FixedShift['customTimes']>;
  jobTitle: string;
}

type ShiftType = 'MORNING' | 'AFTERNOON' | 'EVENING';

const WeeklyFixedShiftSelector: React.FC<WeeklyFixedShiftSelectorProps> = ({
  form,
  onShiftToggle,
  onCustomTimeChange,
  onAddCustomShift,
  customShiftTimes = {},
  jobTitle
}) => {
  const { t } = useTranslation();
  const { watch } = form;
  const watchedAvailability = watch('availability') || {};

  // Convert availability to fixedShifts format for compatibility
  const fixedShifts: FixedShift[] = [
    { dayOfWeek: 'MONDAY', morning: false, afternoon: false, evening: false },
    { dayOfWeek: 'TUESDAY', morning: false, afternoon: false, evening: false },
    { dayOfWeek: 'WEDNESDAY', morning: false, afternoon: false, evening: false },
    { dayOfWeek: 'THURSDAY', morning: false, afternoon: false, evening: false },
    { dayOfWeek: 'FRIDAY', morning: false, afternoon: false, evening: false },
    { dayOfWeek: 'SATURDAY', morning: false, afternoon: false, evening: false },
    { dayOfWeek: 'SUNDAY', morning: false, afternoon: false, evening: false }
  ].map((day) => {
    const dayKey = day.dayOfWeek.toLowerCase() as keyof StaffScheduleFormData['availability'];
    const dayData = watchedAvailability[dayKey];

    // Always show shifts, regardless of enabled state
    const result = {
      ...day,
      morning: dayData?.shifts?.includes('MORNING') || false,
      afternoon: dayData?.shifts?.includes('AFTERNOON') || false,
      evening: dayData?.shifts?.includes('EVENING') || false,
      customTimes: customShiftTimes?.[dayKey]
    };

    return result;
  });

  const weekDays = [
    { key: 'MONDAY', label: t('workshift.days.mon'), fullName: t('common.days.monday') },
    { key: 'TUESDAY', label: t('workshift.days.tue'), fullName: t('common.days.tuesday') },
    { key: 'WEDNESDAY', label: t('workshift.days.wed'), fullName: t('common.days.wednesday') },
    { key: 'THURSDAY', label: t('workshift.days.thu'), fullName: t('common.days.thursday') },
    { key: 'FRIDAY', label: t('workshift.days.fri'), fullName: t('common.days.friday') },
    { key: 'SATURDAY', label: t('workshift.days.sat'), fullName: t('common.days.saturday') },
    { key: 'SUNDAY', label: t('workshift.days.sun'), fullName: t('common.days.sunday') }
  ];

  const handleCopyToAllDays = () => {
    // Find the first day with any shifts selected
    const firstDayWithShifts = fixedShifts.find((shift) => shift.morning || shift.afternoon || shift.evening);

    if (firstDayWithShifts) {
      // Copy shifts to all days
      for (const day of weekDays) {
        const dayKey = day.key.toLowerCase() as keyof StaffScheduleFormData['availability'];
        const shifts: ShiftType[] = [];

        if (firstDayWithShifts.morning) shifts.push('MORNING');
        if (firstDayWithShifts.afternoon) shifts.push('AFTERNOON');
        if (firstDayWithShifts.evening) shifts.push('EVENING');

        // Enable the day and set shifts
        form.setValue(`availability.${dayKey}.enabled`, true);
        form.setValue(`availability.${dayKey}.shifts`, shifts);
      }
    }
  };

  const handleClearAll = () => {
    // Clear all days
    for (const day of weekDays) {
      const dayKey = day.key.toLowerCase() as keyof StaffScheduleFormData['availability'];
      form.setValue(`availability.${dayKey}.enabled`, false);
      form.setValue(`availability.${dayKey}.shifts`, []);
    }
  };

  const getSelectedShiftsCount = () => {
    return fixedShifts.reduce((count, shift) => {
      return count + (shift.morning ? 1 : 0) + (shift.afternoon ? 1 : 0) + (shift.evening ? 1 : 0);
    }, 0);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          {t('workshift.fixed_shifts')}
        </CardTitle>
        <p className="text-xs text-gray-500">{t('workshift.fixed_shifts_description')}</p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {getSelectedShiftsCount()} {t('workshift.shifts_selected')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleCopyToAllDays} className="text-xs">
            <Copy className="h-3 w-3 mr-1" />
            {t('workshift.copy_to_all_days')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleClearAll} className="text-xs">
            <Trash2 className="h-3 w-3 mr-1" />
            {t('workshift.clear_all')}
          </Button>
        </div>

        {/* Day Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {weekDays.map((day) => {
            const dayShift = fixedShifts.find((shift) => shift.dayOfWeek === day.key);
            if (!dayShift) return null;

            // Get custom times for this specific day only
            const dayKey = day.key.toLowerCase(); // Convert MONDAY -> monday
            const dayCustomTimes = customShiftTimes[dayKey] || {};

            // Merge custom times into dayShift - only for this day
            const enrichedDayShift: FixedShift = {
              ...dayShift,
              customTimes: dayCustomTimes
            };

            return (
              <DayFlexibleShiftCard
                key={day.key}
                dayOfWeek={day.key}
                dayLabel={day.fullName}
                fixedShift={enrichedDayShift}
                jobTitle={jobTitle}
                onShiftChange={(dayOfWeek, shiftKey) => {
                  const dayKey = dayOfWeek.toLowerCase() as keyof StaffScheduleFormData['availability'];
                  const shiftType = shiftKey.toUpperCase() as ShiftType;
                  onShiftToggle(dayKey, shiftType);
                }}
                onCustomTimeChange={onCustomTimeChange}
                onAddCustomShift={
                  onAddCustomShift
                    ? (dayOfWeek, customShift) => {
                        const dayKey = dayOfWeek.toLowerCase() as keyof StaffScheduleFormData['availability'];
                        onAddCustomShift(dayKey, customShift);
                      }
                    : undefined
                }
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyFixedShiftSelector;
