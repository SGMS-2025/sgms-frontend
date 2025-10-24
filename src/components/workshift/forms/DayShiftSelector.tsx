import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SHIFT_TIMES, SHIFT_LABELS, type ShiftType } from '@/types/api/StaffSchedule';

interface DayShiftSelectorProps {
  dayLabel: string;
  selectedShifts: ShiftType[];
  onShiftToggle: (shift: ShiftType) => void;
  enabled: boolean;
}

const DayShiftSelector: React.FC<DayShiftSelectorProps> = ({ dayLabel, selectedShifts, onShiftToggle, enabled }) => {
  const shifts: ShiftType[] = ['MORNING', 'AFTERNOON', 'EVENING'];

  if (!enabled) {
    return (
      <Card className="w-full opacity-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">{dayLabel}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-gray-400">Unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{dayLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {shifts.map((shift) => {
          const timeRange = SHIFT_TIMES[shift];
          const isChecked = selectedShifts.includes(shift);

          return (
            <div key={shift} className="flex items-center space-x-2">
              <Checkbox id={`${dayLabel}-${shift}`} checked={isChecked} onCheckedChange={() => onShiftToggle(shift)} />
              <Label htmlFor={`${dayLabel}-${shift}`} className="text-sm font-medium cursor-pointer">
                {SHIFT_LABELS[shift]} ({timeRange.start}–{timeRange.end})
              </Label>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default DayShiftSelector;
