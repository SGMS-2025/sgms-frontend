import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, RotateCcw, ChevronUp, Plus, X } from 'lucide-react';
import type { FixedShift, CustomShiftTime } from '@/types/api/StaffSchedule';
import { SHIFT_TIMES, getShiftTime } from '@/types/api/StaffSchedule';

interface DayFlexibleShiftCardProps {
  dayOfWeek: string;
  dayLabel: string;
  fixedShift: FixedShift;
  jobTitle: string;
  onShiftChange: (dayOfWeek: string, shiftType: string, checked: boolean) => void;
  onCustomTimeChange?: (dayOfWeek: string, shiftType: string, customTime: CustomShiftTime | null) => void;
  onAddCustomShift?: (dayOfWeek: string, customShift: CustomShiftTime) => void;
}

type ShiftKey = 'morning' | 'afternoon' | 'evening' | `custom_${string}`;

interface ShiftConfig {
  key: ShiftKey;
  label: string;
  enabled: boolean;
}

interface CustomShiftConfig {
  id: string;
  label: string;
  start: string;
  end: string;
  enabled: boolean;
}

const DayFlexibleShiftCard: React.FC<DayFlexibleShiftCardProps> = ({
  dayOfWeek,
  dayLabel,
  fixedShift,
  jobTitle,
  onShiftChange,
  onCustomTimeChange,
  onAddCustomShift
}) => {
  const { t } = useTranslation();

  // Track which shifts have custom time inputs expanded
  const [expandedShifts, setExpandedShifts] = useState<Record<ShiftKey, boolean>>({
    morning: false,
    afternoon: false,
    evening: false
  });

  // Track custom shifts for this day
  const [customShifts, setCustomShifts] = useState<CustomShiftConfig[]>([]);

  // Track if "Add Shift" form is expanded
  const [showAddShiftForm, setShowAddShiftForm] = useState(false);

  // Track new shift form data
  const [newShiftForm, setNewShiftForm] = useState({
    start: '',
    end: '',
    label: ''
  });

  // Local state for custom times being edited
  const [editingTimes, setEditingTimes] = useState<Record<ShiftKey, CustomShiftTime>>({
    morning: fixedShift.customTimes?.morning || { start: '', end: '' },
    afternoon: fixedShift.customTimes?.afternoon || { start: '', end: '' },
    evening: fixedShift.customTimes?.evening || { start: '', end: '' }
  });

  // Get available shifts based on job title
  const getAvailableShifts = (): ShiftConfig[] => {
    const shifts: ShiftConfig[] = [
      { key: 'morning', label: t('workshift.morning'), enabled: fixedShift.morning },
      { key: 'afternoon', label: t('workshift.afternoon'), enabled: fixedShift.afternoon }
    ];

    // Only Technician and Manager have evening shifts
    if (jobTitle === 'Technician' || jobTitle === 'Manager') {
      shifts.push({
        key: 'evening',
        label: t('workshift.evening'),
        enabled: fixedShift.evening || false
      });
    }

    // Add custom shifts from form state
    if (fixedShift.customTimes) {
      for (const customShiftKey of Object.keys(fixedShift.customTimes)) {
        if (customShiftKey.startsWith('custom_')) {
          const customTime = (fixedShift.customTimes as Record<string, CustomShiftTime>)[customShiftKey];
          const shiftLabel = `${customTime.start}-${customTime.end}`;
          shifts.push({
            key: customShiftKey as ShiftKey,
            label: shiftLabel,
            enabled: true // Custom shifts are always enabled when added
          });
        }
      }
    }

    return shifts;
  };

  const toggleExpand = (shiftKey: ShiftKey) => {
    const isExpanding = !expandedShifts[shiftKey];

    // When expanding, initialize with custom times if they exist
    if (isExpanding) {
      const customTime = (fixedShift.customTimes as Record<string, CustomShiftTime>)?.[shiftKey];
      if (customTime) {
        setEditingTimes((prev) => ({
          ...prev,
          [shiftKey]: customTime
        }));
      } else {
        // Initialize with default times for better UX
        const shiftType = shiftKey.toUpperCase() as keyof typeof SHIFT_TIMES;
        setEditingTimes((prev) => ({
          ...prev,
          [shiftKey]: {
            start: SHIFT_TIMES[shiftType].start,
            end: SHIFT_TIMES[shiftType].end
          }
        }));
      }
    }

    setExpandedShifts((prev) => ({
      ...prev,
      [shiftKey]: isExpanding
    }));
  };

  const handleCustomTimeChange = (shiftKey: ShiftKey, field: 'start' | 'end', value: string) => {
    setEditingTimes((prev) => ({
      ...prev,
      [shiftKey]: {
        ...prev[shiftKey],
        [field]: value
      }
    }));
  };

  const applyCustomTime = (shiftKey: ShiftKey) => {
    const customTime = editingTimes[shiftKey];
    if (customTime.start && customTime.end && onCustomTimeChange) {
      // Convert MONDAY -> monday for consistency with form state
      const dayKey = dayOfWeek.toLowerCase();
      onCustomTimeChange(dayKey, shiftKey, customTime);

      // Collapse the input after applying
      setExpandedShifts((prev) => ({
        ...prev,
        [shiftKey]: false
      }));
    }
  };

  const resetToDefault = (shiftKey: ShiftKey) => {
    if (onCustomTimeChange) {
      // Convert MONDAY -> monday for consistency with form state
      const dayKey = dayOfWeek.toLowerCase();
      onCustomTimeChange(dayKey, shiftKey, null);
    }
    setEditingTimes((prev) => ({
      ...prev,
      [shiftKey]: { start: '', end: '' }
    }));
    setExpandedShifts((prev) => ({
      ...prev,
      [shiftKey]: false
    }));
  };

  // Handle adding new custom shift
  const handleAddCustomShift = () => {
    if (newShiftForm.start && newShiftForm.end && onAddCustomShift) {
      const customShift: CustomShiftTime = {
        start: newShiftForm.start,
        end: newShiftForm.end
      };

      onAddCustomShift(dayOfWeek.toLowerCase(), customShift);

      // Add to local state
      const newCustomShift: CustomShiftConfig = {
        id: `custom-${Date.now()}`,
        label: newShiftForm.label || `${newShiftForm.start}-${newShiftForm.end}`,
        start: newShiftForm.start,
        end: newShiftForm.end,
        enabled: true
      };

      setCustomShifts((prev) => [...prev, newCustomShift]);

      // Reset form
      setNewShiftForm({ start: '', end: '', label: '' });
      setShowAddShiftForm(false);
    }
  };

  // Handle removing custom shift
  const handleRemoveCustomShift = (shiftId: string) => {
    setCustomShifts((prev) => prev.filter((shift) => shift.id !== shiftId));
  };

  const availableShifts = getAvailableShifts();

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{dayLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {availableShifts.map((shift) => {
          const shiftType = shift.key.toUpperCase() as keyof typeof SHIFT_TIMES;
          const currentTime = getShiftTime(shiftType, fixedShift.customTimes as Record<string, CustomShiftTime>);
          const isCustom = !!(fixedShift.customTimes as Record<string, CustomShiftTime>)?.[shift.key];
          const isExpanded = expandedShifts[shift.key];

          return (
            <div key={shift.key} className="space-y-2">
              {/* Main Checkbox Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1">
                  <Checkbox
                    id={`${dayOfWeek}-${shift.key}`}
                    checked={shift.enabled}
                    className="pointer-events-auto"
                    onCheckedChange={(checked) => {
                      onShiftChange(dayOfWeek, shift.key, checked as boolean);
                    }}
                  />
                  <Label htmlFor={`${dayOfWeek}-${shift.key}`} className="text-sm font-medium cursor-pointer flex-1">
                    {shift.label} ({currentTime.start}–{currentTime.end})
                    {isCustom && (
                      <span className="ml-2 text-xs text-orange-600 font-semibold">{t('workshift.custom')}</span>
                    )}
                  </Label>
                </div>

                {/* Custom Time Toggle Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => toggleExpand(shift.key)}
                  disabled={!shift.enabled}
                  title={t('workshift.customize_time')}
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                </Button>
              </div>

              {/* Custom Time Input (Collapsible) */}
              {isExpanded && shift.enabled && (
                <div className="ml-6 p-3 bg-gray-50 rounded-md space-y-2 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-600 mb-1 block">{t('workshift.start_time')}</Label>
                      <Input
                        type="time"
                        value={editingTimes[shift.key]?.start || ''}
                        onChange={(e) => handleCustomTimeChange(shift.key, 'start', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <span className="text-gray-400 mt-5">–</span>
                    <div className="flex-1">
                      <Label className="text-xs text-gray-600 mb-1 block">{t('workshift.end_time')}</Label>
                      <Input
                        type="time"
                        value={editingTimes[shift.key]?.end || ''}
                        onChange={(e) => handleCustomTimeChange(shift.key, 'end', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    {isCustom && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => resetToDefault(shift.key)}
                        className="h-7 text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        {t('workshift.reset_default')}
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => applyCustomTime(shift.key)}
                      className="h-7 text-xs bg-orange-600 hover:bg-orange-700"
                      disabled={!editingTimes[shift.key].start || !editingTimes[shift.key].end}
                    >
                      {t('common.apply')}
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 italic">
                    {t('workshift.default_time')}: {SHIFT_TIMES[shiftType].start}–{SHIFT_TIMES[shiftType].end}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Custom Shifts */}
        {customShifts.map((customShift) => (
          <div key={customShift.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1">
                <Checkbox
                  id={`${dayOfWeek}-${customShift.id}`}
                  checked={customShift.enabled}
                  onCheckedChange={(checked) => {
                    setCustomShifts((prev) =>
                      prev.map((shift) =>
                        shift.id === customShift.id ? { ...shift, enabled: checked as boolean } : shift
                      )
                    );
                  }}
                />
                <Label htmlFor={`${dayOfWeek}-${customShift.id}`} className="text-sm font-medium cursor-pointer flex-1">
                  {customShift.label} ({customShift.start}–{customShift.end})
                  <span className="ml-2 text-xs text-blue-600 font-semibold">{t('workshift.custom')}</span>
                </Label>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCustomShift(customShift.id)}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}

        {/* Add Shift Button */}
        <div className="pt-2 border-t border-gray-100">
          {!showAddShiftForm ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddShiftForm(true)}
              className="w-full text-xs text-gray-600 hover:text-gray-800"
            >
              <Plus className="h-3 w-3 mr-1" />
              {t('workshift.add_shift')}
            </Button>
          ) : (
            <div className="space-y-2 p-3 bg-gray-50 rounded-md border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">{t('workshift.add_custom_shift')}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddShiftForm(false);
                    setNewShiftForm({ start: '', end: '', label: '' });
                  }}
                  className="h-5 w-5 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-gray-600">{t('workshift.shift_label')}</Label>
                  <Input
                    type="text"
                    placeholder={t('workshift.shift_label_placeholder')}
                    value={newShiftForm.label}
                    onChange={(e) => setNewShiftForm((prev) => ({ ...prev, label: e.target.value }))}
                    className="h-7 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-600">{t('workshift.start_time')}</Label>
                    <Input
                      type="time"
                      value={newShiftForm.start}
                      onChange={(e) => setNewShiftForm((prev) => ({ ...prev, start: e.target.value }))}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">{t('workshift.end_time')}</Label>
                    <Input
                      type="time"
                      value={newShiftForm.end}
                      onChange={(e) => setNewShiftForm((prev) => ({ ...prev, end: e.target.value }))}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddShiftForm(false);
                      setNewShiftForm({ start: '', end: '', label: '' });
                    }}
                    className="flex-1 h-7 text-xs"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddCustomShift}
                    disabled={!newShiftForm.start || !newShiftForm.end}
                    className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    {t('workshift.add')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DayFlexibleShiftCard;
