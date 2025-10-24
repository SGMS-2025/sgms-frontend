import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { FixedShift, CustomShiftTime } from '@/types/api/StaffSchedule';
import { SHIFT_TIMES, getShiftTime } from '@/types/api/StaffSchedule';

interface StaffShiftSelectorProps {
  dayOfWeek: string;
  dayLabel: string;
  fixedShift: FixedShift;
  jobTitle: string;
  onShiftChange: (dayOfWeek: string, shiftType: string, checked: boolean) => void;
  onCustomTimeChange?: (dayOfWeek: string, shiftType: string, customTime: CustomShiftTime | null) => void;
}

// Define different shift options for different job titles using SHIFT_TIMES
const SHIFT_OPTIONS = {
  'Personal Trainer': [
    { key: 'morning', label: 'Morning', start: SHIFT_TIMES.MORNING.start, end: SHIFT_TIMES.MORNING.end },
    { key: 'afternoon', label: 'Afternoon', start: SHIFT_TIMES.AFTERNOON.start, end: SHIFT_TIMES.AFTERNOON.end }
  ],
  Technician: [
    { key: 'morning', label: 'Morning', start: SHIFT_TIMES.MORNING.start, end: SHIFT_TIMES.MORNING.end },
    { key: 'afternoon', label: 'Afternoon', start: SHIFT_TIMES.AFTERNOON.start, end: SHIFT_TIMES.AFTERNOON.end },
    { key: 'evening', label: 'Evening', start: SHIFT_TIMES.EVENING.start, end: SHIFT_TIMES.EVENING.end }
  ],
  Manager: [
    { key: 'morning', label: 'Morning', start: SHIFT_TIMES.MORNING.start, end: SHIFT_TIMES.MORNING.end },
    { key: 'afternoon', label: 'Afternoon', start: SHIFT_TIMES.AFTERNOON.start, end: SHIFT_TIMES.AFTERNOON.end },
    { key: 'evening', label: 'Evening', start: SHIFT_TIMES.EVENING.start, end: SHIFT_TIMES.EVENING.end }
  ]
};

const StaffShiftSelector: React.FC<StaffShiftSelectorProps> = ({
  dayOfWeek,
  dayLabel,
  fixedShift,
  jobTitle,
  onShiftChange
}) => {
  const shiftOptions = SHIFT_OPTIONS[jobTitle as keyof typeof SHIFT_OPTIONS] || SHIFT_OPTIONS['Personal Trainer'];

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{dayLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {shiftOptions.map((shift) => {
          // Get shift time (custom or default)
          const shiftType = shift.key.toUpperCase() as keyof typeof SHIFT_TIMES;
          const shiftTime = getShiftTime(shiftType, fixedShift.customTimes);
          const isCustom = !!fixedShift.customTimes?.[shift.key as 'morning' | 'afternoon' | 'evening'];

          return (
            <div key={shift.key} className="flex items-center space-x-2">
              <Checkbox
                id={`${dayOfWeek}-${shift.key}`}
                checked={Boolean(fixedShift[shift.key as keyof FixedShift])}
                onCheckedChange={(checked) => onShiftChange(dayOfWeek, shift.key, checked as boolean)}
              />
              <Label htmlFor={`${dayOfWeek}-${shift.key}`} className="text-sm font-medium cursor-pointer">
                {shift.label} ({shiftTime.start}–{shiftTime.end})
                {isCustom && <span className="ml-2 text-xs text-orange-600 font-semibold">Custom</span>}
              </Label>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default StaffShiftSelector;
