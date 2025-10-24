import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { FixedShift } from '@/types/api/StaffSchedule';

interface DayFixedShiftCardProps {
  dayOfWeek: string;
  dayLabel: string;
  fixedShift: FixedShift;
  onShiftChange: (dayOfWeek: string, shiftType: 'morning' | 'afternoon', checked: boolean) => void;
}

const FIXED_SHIFTS = {
  MORNING: { start: '05:00', end: '10:00' },
  AFTERNOON: { start: '15:00', end: '22:00' }
};

const DayFixedShiftCard: React.FC<DayFixedShiftCardProps> = ({ dayOfWeek, dayLabel, fixedShift, onShiftChange }) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{dayLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Morning Shift */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${dayOfWeek}-morning`}
            checked={fixedShift.morning}
            onCheckedChange={(checked) => onShiftChange(dayOfWeek, 'morning', checked as boolean)}
          />
          <Label htmlFor={`${dayOfWeek}-morning`} className="text-sm font-medium cursor-pointer">
            Morning ({FIXED_SHIFTS.MORNING.start}–{FIXED_SHIFTS.MORNING.end})
          </Label>
        </div>

        {/* Afternoon Shift */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${dayOfWeek}-afternoon`}
            checked={fixedShift.afternoon}
            onCheckedChange={(checked) => onShiftChange(dayOfWeek, 'afternoon', checked as boolean)}
          />
          <Label htmlFor={`${dayOfWeek}-afternoon`} className="text-sm font-medium cursor-pointer">
            Afternoon ({FIXED_SHIFTS.AFTERNOON.start}–{FIXED_SHIFTS.AFTERNOON.end})
          </Label>
        </div>
      </CardContent>
    </Card>
  );
};

export default DayFixedShiftCard;
