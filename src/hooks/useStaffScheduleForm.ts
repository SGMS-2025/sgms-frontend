import { useState, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useScheduleTemplate } from '@/hooks/useScheduleTemplate';
import { scheduleApi } from '@/services/api/scheduleApi';
import { handleAsyncOperationWithOptions } from '@/utils/errorHandler';
import { safeJsonParse, safeJsonStringify } from '@/utils/jsonHelpers';
import type { StaffScheduleFormData, ShiftType, CustomShiftTime } from '@/types/api/StaffSchedule';
import { SHIFT_TIMES, getShiftTime } from '@/types/api/StaffSchedule';
import type { ScheduleTemplate, DayOfWeek } from '@/types/api/ScheduleTemplate';
import type { Schedule } from '@/types/api/Schedule';

// Custom type for template notes with multiple shifts
interface TemplateNotesData {
  multipleShifts?: boolean;
  shifts?: ShiftMetadata[];
}

interface ShiftMetadata {
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  daysOfWeek: DayOfWeek[];
}

const createScheduleSchema = (t: (key: string) => string) =>
  z.object({
    title: z.string().min(1, t('validation.schedule_title_required')),
    staffId: z.string().min(1, t('validation.staff_selection_required')),
    branchId: z.string().min(1, t('validation.branch_selection_required')),
    scheduleDate: z.string().min(1, t('validation.schedule_date_required')),
    type: z.enum(['CLASS', 'PERSONAL_TRAINING', 'FREE_TIME', 'MAINTENANCE']),
    timeRange: z
      .object({
        startTime: z.string().min(1, t('validation.start_time_required')),
        endTime: z.string().min(1, t('validation.end_time_required'))
      })
      .optional(), // Make optional as we now use shifts
    notes: z.string().optional(),
    availability: z.object({
      sunday: z.object({
        enabled: z.boolean(),
        shifts: z
          .array(
            z.union([
              z.literal('MORNING'),
              z.literal('AFTERNOON'),
              z.literal('EVENING'),
              z.literal('CUSTOM'),
              z.string().regex(/^CUSTOM_/)
            ])
          )
          .default([]),
        // Keep startTime/endTime for backward compatibility
        startTime: z.string().optional(),
        endTime: z.string().optional()
      }),
      monday: z.object({
        enabled: z.boolean(),
        shifts: z
          .array(
            z.union([
              z.literal('MORNING'),
              z.literal('AFTERNOON'),
              z.literal('EVENING'),
              z.literal('CUSTOM'),
              z.string().regex(/^CUSTOM_/)
            ])
          )
          .default([]),
        startTime: z.string().optional(),
        endTime: z.string().optional()
      }),
      tuesday: z.object({
        enabled: z.boolean(),
        shifts: z
          .array(
            z.union([
              z.literal('MORNING'),
              z.literal('AFTERNOON'),
              z.literal('EVENING'),
              z.literal('CUSTOM'),
              z.string().regex(/^CUSTOM_/)
            ])
          )
          .default([]),
        startTime: z.string().optional(),
        endTime: z.string().optional()
      }),
      wednesday: z.object({
        enabled: z.boolean(),
        shifts: z
          .array(
            z.union([
              z.literal('MORNING'),
              z.literal('AFTERNOON'),
              z.literal('EVENING'),
              z.literal('CUSTOM'),
              z.string().regex(/^CUSTOM_/)
            ])
          )
          .default([]),
        startTime: z.string().optional(),
        endTime: z.string().optional()
      }),
      thursday: z.object({
        enabled: z.boolean(),
        shifts: z
          .array(
            z.union([
              z.literal('MORNING'),
              z.literal('AFTERNOON'),
              z.literal('EVENING'),
              z.literal('CUSTOM'),
              z.string().regex(/^CUSTOM_/)
            ])
          )
          .default([]),
        startTime: z.string().optional(),
        endTime: z.string().optional()
      }),
      friday: z.object({
        enabled: z.boolean(),
        shifts: z
          .array(
            z.union([
              z.literal('MORNING'),
              z.literal('AFTERNOON'),
              z.literal('EVENING'),
              z.literal('CUSTOM'),
              z.string().regex(/^CUSTOM_/)
            ])
          )
          .default([]),
        startTime: z.string().optional(),
        endTime: z.string().optional()
      }),
      saturday: z.object({
        enabled: z.boolean(),
        shifts: z
          .array(
            z.union([
              z.literal('MORNING'),
              z.literal('AFTERNOON'),
              z.literal('EVENING'),
              z.literal('CUSTOM'),
              z.string().regex(/^CUSTOM_/)
            ])
          )
          .default([]),
        startTime: z.string().optional(),
        endTime: z.string().optional()
      })
    }),
    timezone: z.string().optional()
  });

export const useStaffScheduleForm = (selectedStaffId?: string) => {
  const { t } = useTranslation();
  const {
    templates,
    loading: loadingTemplates,
    createTemplate,
    getTemplatesByBranch,
    incrementTemplateUsage
  } = useScheduleTemplate();

  // Template selection state
  const [selectedTemplate, setSelectedTemplate] = useState<ScheduleTemplate | null>(null);
  const [isStaffFieldDisabled, setIsStaffFieldDisabled] = useState(false);
  const [templateStaffInfo, setTemplateStaffInfo] = useState<{ name: string; id: string } | null>(null);

  // Template creation state
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  // Auto-generation state
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(false);
  const [advanceDays, setAdvanceDays] = useState(7);
  const [endDate, setEndDate] = useState('');
  const [endDateError, setEndDateError] = useState('');
  const [timeRangeError, setTimeRangeError] = useState('');
  const [scheduleDateError, setScheduleDateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom shift times state - stores custom times for each day/shift combination
  // Structure: { [dayKey]: { [shiftKey]: CustomShiftTime } }
  const [customShiftTimes, setCustomShiftTimes] = useState<Record<string, Record<string, CustomShiftTime>>>({});

  const form = useForm<StaffScheduleFormData, unknown, StaffScheduleFormData>({
    resolver: zodResolver(createScheduleSchema(t)) as Resolver<StaffScheduleFormData>,
    defaultValues: {
      title: '',
      staffId: selectedStaffId || '',
      branchId: '',
      scheduleDate: new Date().toISOString().split('T')[0], // Today's date
      type: 'FREE_TIME',
      timeRange: {
        startTime: '09:00',
        endTime: '17:00'
      },
      notes: '',
      availability: {
        sunday: { enabled: false, shifts: [], startTime: '09:00', endTime: '17:00' },
        monday: { enabled: true, shifts: ['MORNING', 'AFTERNOON'], startTime: '09:00', endTime: '17:00' },
        tuesday: { enabled: true, shifts: ['MORNING', 'AFTERNOON'], startTime: '09:00', endTime: '17:00' },
        wednesday: { enabled: true, shifts: ['MORNING', 'AFTERNOON'], startTime: '09:00', endTime: '17:00' },
        thursday: { enabled: true, shifts: ['MORNING', 'AFTERNOON'], startTime: '09:00', endTime: '17:00' },
        friday: { enabled: true, shifts: ['MORNING', 'AFTERNOON'], startTime: '09:00', endTime: '17:00' },
        saturday: { enabled: false, shifts: [], startTime: '09:00', endTime: '17:00' }
      },
      timezone: '(GMT+07:00) Indochina Time - Ho Chi Minh City'
    }
  });

  const { setValue, watch } = form;
  const watchedBranchId = watch('branchId');
  const watchedAvailability = watch('availability');
  const watchedTitle = watch('title');
  const watchedScheduleDate = watch('scheduleDate');

  // Fetch templates when branch is selected
  useEffect(() => {
    if (watchedBranchId && watchedBranchId !== 'all') {
      getTemplatesByBranch(watchedBranchId, true);
    }
  }, [watchedBranchId, getTemplatesByBranch]);

  useEffect(() => {
    if (watchedTitle && !selectedTemplate && saveAsTemplate) {
      // Add timestamp to make template name unique
      const timestamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-');
      setTemplateName(`${watchedTitle} - ${timestamp}`);
    }
  }, [watchedTitle, selectedTemplate, saveAsTemplate]);

  // Set default endDate when auto-generation is enabled
  useEffect(() => {
    if (autoGenerateEnabled && !endDate && watchedScheduleDate) {
      const scheduleDateObj = new Date(watchedScheduleDate);
      const defaultEndDate = new Date(scheduleDateObj);
      defaultEndDate.setMonth(defaultEndDate.getMonth() + 1); // 1 month after schedule date
      setEndDate(defaultEndDate.toISOString().split('T')[0]);
    }
  }, [autoGenerateEnabled, endDate, watchedScheduleDate]);

  // Function to validate endDate
  const validateEndDate = (date: string, scheduleDate?: string): string | null => {
    if (!date) {
      return t('validation.end_date_required_auto_generation');
    }

    const selectedDate = new Date(date);

    if (scheduleDate) {
      const scheduleDateObj = new Date(scheduleDate);

      // End date must be after schedule date
      if (selectedDate <= scheduleDateObj) {
        return t('validation.end_date_after_schedule_date');
      }

      // End date must be at least 1 month after schedule date
      const minEndDate = new Date(scheduleDateObj);
      minEndDate.setMonth(minEndDate.getMonth() + 1);

      if (selectedDate < minEndDate) {
        return t('validation.end_date_at_least_one_month');
      }
    } else {
      // Fallback to old validation if no schedule date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (selectedDate <= tomorrow) {
        return t('validation.end_date_future');
      }
    }

    return null;
  };

  // Function to validate start/end time
  const validateTimeRange = (startTime: string, endTime: string): string | null => {
    if (!startTime || !endTime) {
      return null; // Let other validations handle missing values
    }

    // Parse time strings directly without Date object to avoid timezone issues
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      return t('validation.time_range_invalid');
    }

    return null;
  };

  // Function to validate schedule date
  const validateScheduleDate = (date: string): string | null => {
    if (!date) {
      return t('validation.schedule_date_required');
    }

    // Get today's date string in YYYY-MM-DD format
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Only allow future dates (from tomorrow onwards), block today and past dates
    if (date <= todayString) {
      return t('validation.schedule_date_past');
    }

    return null;
  };

  // Handle template selection
  const handleTemplateSelect = (template: ScheduleTemplate) => {
    setSelectedTemplate(template);

    // ✅ Check if template has multiple shifts metadata
    let hasMultipleShifts = false;
    let shiftsMetadata: ShiftMetadata[] = [];

    const notesData = safeJsonParse<TemplateNotesData>(template.notes || '{}', {});
    if (notesData?.multipleShifts && notesData.shifts && notesData.shifts.length > 0) {
      hasMultipleShifts = true;
      shiftsMetadata = notesData.shifts;
    }

    if (hasMultipleShifts) {
      setValue('title', template.name);
      setValue('type', template.type);
      setValue('scheduleDate', new Date().toISOString().split('T')[0]);

      // Set availability for all shifts
      const availability = {
        sunday: { enabled: false, shifts: [], startTime: '', endTime: '' },
        monday: { enabled: false, shifts: [], startTime: '', endTime: '' },
        tuesday: { enabled: false, shifts: [], startTime: '', endTime: '' },
        wednesday: { enabled: false, shifts: [], startTime: '', endTime: '' },
        thursday: { enabled: false, shifts: [], startTime: '', endTime: '' },
        friday: { enabled: false, shifts: [], startTime: '', endTime: '' },
        saturday: { enabled: false, shifts: [], startTime: '', endTime: '' }
      };

      // Apply all shifts to enabled days
      for (const shift of shiftsMetadata) {
        for (const day of shift.daysOfWeek) {
          const dayKey = day.toLowerCase() as keyof typeof availability;
          if (availability[dayKey]) {
            availability[dayKey].enabled = true;
            (availability[dayKey].shifts as ShiftType[]).push(shift.shiftType);
            // Set custom time for this shift
            if (!availability[dayKey].startTime || !availability[dayKey].endTime) {
              availability[dayKey].startTime = shift.startTime;
              availability[dayKey].endTime = shift.endTime;
            }
          }
        }
      }

      // ✅ Apply availability to form with proper trigger
      for (const [day, dayData] of Object.entries(availability)) {
        const dayKey = day as keyof StaffScheduleFormData['availability'];
        setValue(`availability.${dayKey}.enabled`, dayData.enabled);
        setValue(`availability.${dayKey}.shifts`, dayData.shifts);
        if (dayData.startTime) setValue(`availability.${dayKey}.startTime`, dayData.startTime);
        if (dayData.endTime) setValue(`availability.${dayKey}.endTime`, dayData.endTime);
      }

      // Set custom shift times
      const customTimes: Record<string, Record<string, CustomShiftTime>> = {};
      for (const shift of shiftsMetadata) {
        for (const day of shift.daysOfWeek) {
          const dayKey = day.toLowerCase();
          if (!customTimes[dayKey]) {
            customTimes[dayKey] = {};
          }
          customTimes[dayKey][shift.shiftType.toLowerCase()] = {
            start: shift.startTime,
            end: shift.endTime
          };
        }
      }
      setCustomShiftTimes(customTimes);

      form.trigger();
    } else {
      setValue('title', template.name);
      setValue('type', template.type);
      setValue('scheduleDate', new Date().toISOString().split('T')[0]);
      setValue('timeRange.startTime', template.startTime);
      setValue('timeRange.endTime', template.endTime);

      // Set availability based on template days
      const availability = {
        sunday: { enabled: false, shifts: [], startTime: '', endTime: '' },
        monday: { enabled: false, shifts: [], startTime: '', endTime: '' },
        tuesday: { enabled: false, shifts: [], startTime: '', endTime: '' },
        wednesday: { enabled: false, shifts: [], startTime: '', endTime: '' },
        thursday: { enabled: false, shifts: [], startTime: '', endTime: '' },
        friday: { enabled: false, shifts: [], startTime: '', endTime: '' },
        saturday: { enabled: false, shifts: [], startTime: '', endTime: '' }
      };

      // Enable days and set default shifts
      for (const day of template.daysOfWeek) {
        const dayKey = day.toLowerCase() as keyof typeof availability;
        if (availability[dayKey]) {
          availability[dayKey].enabled = true;
          (availability[dayKey].shifts as ShiftType[]) = ['MORNING', 'AFTERNOON']; // Default shifts
          availability[dayKey].startTime = template.startTime;
          availability[dayKey].endTime = template.endTime;
        }
      }

      for (const [day, dayData] of Object.entries(availability)) {
        const dayKey = day as keyof StaffScheduleFormData['availability'];
        setValue(`availability.${dayKey}.enabled`, dayData.enabled);
        setValue(`availability.${dayKey}.shifts`, dayData.shifts);
        if (dayData.startTime) setValue(`availability.${dayKey}.startTime`, dayData.startTime);
        if (dayData.endTime) setValue(`availability.${dayKey}.endTime`, dayData.endTime);
      }

      form.trigger();
    }

    setTemplateName(template.name);
    setTemplateDescription(template.description || '');

    setAutoGenerateEnabled(template.autoGenerate?.enabled || false);
    setAdvanceDays(template.autoGenerate?.advanceDays || 7);
    setEndDate(
      template.autoGenerate?.endDate ? new Date(template.autoGenerate.endDate).toISOString().split('T')[0] : ''
    );

    setSaveAsTemplate(true);

    if (template.branchId?._id) {
      setValue('branchId', template.branchId._id);
    }

    if (template.ptId) {
      setValue('staffId', template.ptId._id);
      setIsStaffFieldDisabled(true);
      setTemplateStaffInfo({
        name: template.ptId.userId?.fullName || 'Personal Trainer',
        id: template.ptId._id
      });

      setTimeout(() => {
        form.trigger('staffId');
      }, 100);
    } else if (template.classId) {
      setIsStaffFieldDisabled(false);
      setTemplateStaffInfo(null);
    } else {
      setIsStaffFieldDisabled(false);
      setTemplateStaffInfo(null);
    }
  };

  const handleTemplateClear = () => {
    setSelectedTemplate(null);
    setIsStaffFieldDisabled(false);
    setTemplateStaffInfo(null);
    setValue('staffId', '');
    setValue('branchId', '');
    setValue('type', 'FREE_TIME');
    setValue('timeRange.startTime', '09:00');
    setValue('timeRange.endTime', '17:00');
    setTemplateName('');
    setTemplateDescription('');
    setAutoGenerateEnabled(false);
    setAdvanceDays(7);
    setEndDate('');
    setSaveAsTemplate(false);
  };

  // Handle day toggle
  const handleDayToggle = (dayKey: keyof StaffScheduleFormData['availability']) => {
    const currentAvailability = watchedAvailability || {};
    const currentValue = currentAvailability[dayKey]?.enabled;
    setValue(`availability.${dayKey}.enabled`, !currentValue);
  };

  // Handle time change
  const handleTimeChange = (
    dayKey: keyof StaffScheduleFormData['availability'],
    timeType: 'startTime' | 'endTime',
    value: string
  ) => {
    setValue(`availability.${dayKey}.${timeType}`, value);

    const currentAvailability = watchedAvailability || {};
    const dayData = currentAvailability[dayKey];
    if (dayData?.enabled) {
      if (timeType === 'startTime') {
        setValue('timeRange.startTime', value);
      } else if (timeType === 'endTime') {
        setValue('timeRange.endTime', value);
      }
    }
  };

  const handleAvailabilityDayClick = (dayKey: keyof StaffScheduleFormData['availability']) => {
    const currentAvailability = watchedAvailability || {};
    const dayData = currentAvailability[dayKey];

    if (dayData?.enabled && dayData.startTime && dayData.endTime) {
      setValue('timeRange.startTime', dayData.startTime);
      setValue('timeRange.endTime', dayData.endTime);
    }
  };

  // Sync Start/End Time changes back to General Availability
  const handleStartEndTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setValue(`timeRange.${field}`, value);

    if (timeRangeError) {
      setTimeRangeError('');
    }

    // Sync back to all enabled days in General Availability
    const currentAvailability = watchedAvailability || {};
    for (const dayKey of Object.keys(currentAvailability)) {
      const dayData = currentAvailability[dayKey as keyof StaffScheduleFormData['availability']];
      if (dayData?.enabled) {
        setValue(`availability.${dayKey}.${field}` as keyof StaffScheduleFormData, value);
      }
    }

    // Force form to update and validate after a short delay
    setTimeout(() => {
      const currentFormData = form.getValues();

      if (currentFormData.timeRange?.startTime && currentFormData.timeRange?.endTime) {
        const timeRangeValidationError = validateTimeRange(
          currentFormData.timeRange.startTime,
          currentFormData.timeRange.endTime
        );
        if (timeRangeValidationError) {
          setTimeRangeError(timeRangeValidationError);
        } else {
          setTimeRangeError('');
        }
      }
    }, 100);
  };

  // Handle endDate change with validation
  const handleEndDateChange = (value: string) => {
    setEndDate(value);

    if (endDateError) {
      setEndDateError('');
    }

    // Validate real-time if auto-generation is enabled
    if (autoGenerateEnabled && value) {
      const error = validateEndDate(value);
      if (error) {
        setEndDateError(error);
      }
    }
  };

  // Handle schedule date change with validation
  const handleScheduleDateChange = (value: string) => {
    if (scheduleDateError) {
      setScheduleDateError('');
    }

    setValue('scheduleDate', value);
    form.trigger('scheduleDate');

    // Validate real-time
    if (value) {
      const error = validateScheduleDate(value);
      if (error) {
        setScheduleDateError(error);
      }
    }
  };

  const convertShiftsToSchedules = (
    data: StaffScheduleFormData
  ): Array<{
    name: string;
    type: 'CLASS' | 'PERSONAL_TRAINING' | 'FREE_TIME' | 'MAINTENANCE';
    ptId: string;
    scheduleDate: string;
    branchId: string;
    startTime: string;
    endTime: string;
    status: 'SCHEDULED';
    maxCapacity: number;
    currentBookings: number;
    notes?: string;
    isRecurring: boolean;
  }> => {
    const schedulesData: Array<{
      name: string;
      type: 'CLASS' | 'PERSONAL_TRAINING' | 'FREE_TIME' | 'MAINTENANCE';
      ptId: string;
      scheduleDate: string;
      branchId: string;
      startTime: string;
      endTime: string;
      status: 'SCHEDULED';
      maxCapacity: number;
      currentBookings: number;
      notes?: string;
      isRecurring: boolean;
    }> = [];
    const availability = data.availability || {};
    const baseDate = new Date(data.scheduleDate);

    // Iterate through each day
    for (const dayKey of Object.keys(availability)) {
      const dayData = availability[dayKey as keyof typeof availability];

      if (dayData?.enabled && dayData.shifts && dayData.shifts.length > 0) {
        // Calculate the date for this day of the week
        const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(dayKey);
        const targetDate = new Date(baseDate);
        const currentDayOfWeek = baseDate.getDay();
        const daysToAdd = (dayIndex - currentDayOfWeek + 7) % 7;
        targetDate.setDate(baseDate.getDate() + daysToAdd);

        // Skip if target date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (targetDate < today) {
          continue;
        }

        // Create a schedule for each selected shift on this day
        for (const shift of dayData.shifts) {
          // Get custom time or default shift time for this specific day
          const dayCustomTimes = customShiftTimes[dayKey] || {};
          let shiftTime: { start: string; end: string };

          // Handle custom shift specially
          if (shift === 'CUSTOM') {
            // For custom shifts, use the custom time directly
            const customTime = dayCustomTimes.custom;
            if (customTime) {
              shiftTime = customTime;
            } else {
              // Fallback to default if no custom time found
              shiftTime = { start: '00:00', end: '00:00' };
            }
          } else if (shift.startsWith('CUSTOM_')) {
            const timeMatch = shift.match(/CUSTOM_(\d{2}:\d{2})-(\d{2}:\d{2})/);
            if (timeMatch) {
              shiftTime = {
                start: timeMatch[1],
                end: timeMatch[2]
              };
            } else {
              // Fallback if parsing fails
              shiftTime = { start: '08:00', end: '17:00' };
            }
          } else {
            // Check if there's a custom time for this specific shift on this day
            const customTime = dayCustomTimes[shift.toLowerCase()];
            if (customTime) {
              shiftTime = customTime;
            } else {
              // Use standard shift time with fallback
              shiftTime = getShiftTime(shift, dayCustomTimes) || { start: '08:00', end: '17:00' };
            }
          }

          const scheduleData = {
            name: `${data.title} - ${shift}`,
            type: (data.type || 'FREE_TIME') as 'CLASS' | 'PERSONAL_TRAINING' | 'FREE_TIME' | 'MAINTENANCE',
            ptId: data.staffId,
            scheduleDate: targetDate.toISOString().split('T')[0],
            branchId: data.branchId,
            startTime: shiftTime.start, // Use custom time if available, otherwise default
            endTime: shiftTime.end, // Use custom time if available, otherwise default
            status: 'SCHEDULED' as const,
            maxCapacity: 1,
            currentBookings: 0,
            notes: data.notes || undefined,
            isRecurring: false
          };

          schedulesData.push(scheduleData);
        }
      }
    }

    return schedulesData;
  };

  // Handle shift toggle (new handler for shift-based selection)
  const handleShiftToggle = (dayKey: keyof StaffScheduleFormData['availability'], shift: ShiftType) => {
    const currentAvailability = watchedAvailability || {};
    const dayData = currentAvailability[dayKey];
    const currentShifts = dayData?.shifts || [];

    // Toggle shift in the array
    const updatedShifts = currentShifts.includes(shift)
      ? currentShifts.filter((s: ShiftType) => s !== shift)
      : [...currentShifts, shift];

    setValue(`availability.${dayKey}.shifts`, updatedShifts);

    // If no shifts selected, disable the day
    if (updatedShifts.length === 0) {
      setValue(`availability.${dayKey}.enabled`, false);
    } else if (!dayData?.enabled) {
      // If shifts are selected but day is disabled, enable it
      setValue(`availability.${dayKey}.enabled`, true);
    }
  };

  // Handle custom time change for a specific day/shift
  const handleCustomTimeChange = (dayKey: string, shiftKey: string, customTime: CustomShiftTime | null) => {
    setCustomShiftTimes((prev) => {
      const dayCustomTimes = prev[dayKey] || {};

      if (customTime === null) {
        const { [shiftKey]: _, ...rest } = dayCustomTimes;
        return {
          ...prev,
          [dayKey]: Object.keys(rest).length > 0 ? rest : {}
        };
      } else {
        // Set custom time for specific day and shift
        return {
          ...prev,
          [dayKey]: {
            ...dayCustomTimes,
            [shiftKey]: customTime
          }
        };
      }
    });
  };

  // Handler for adding custom shifts
  const handleAddCustomShift = (dayKey: keyof StaffScheduleFormData['availability'], customShift: CustomShiftTime) => {
    // Store custom time mapping for this specific day only
    setCustomShiftTimes((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        custom: customShift // Store as 'custom' key for this day only
      }
    }));

    const currentShifts = form.getValues(`availability.${dayKey}.shifts`) || [];
    const customShiftKey: ShiftType = `CUSTOM_${customShift.start}-${customShift.end}`;

    // Only add if not already present
    if (!currentShifts.includes(customShiftKey)) {
      form.setValue(`availability.${dayKey}.shifts`, [...currentShifts, customShiftKey]);
      form.setValue(`availability.${dayKey}.enabled`, true); // Enable the day
    }
  };

  // Handle form submission
  const handleSubmit = async (data: StaffScheduleFormData) => {
    setIsSubmitting(true);

    const result = await handleAsyncOperationWithOptions(
      async () => {
        // Validate schedule date first
        const scheduleDateValidationError = validateScheduleDate(data.scheduleDate);
        if (scheduleDateValidationError) {
          setScheduleDateError(scheduleDateValidationError);
          return { success: false, error: scheduleDateValidationError };
        }

        // Validate time range (if using old time-based form)
        if (data.timeRange?.startTime && data.timeRange?.endTime) {
          const timeRangeValidationError = validateTimeRange(data.timeRange.startTime, data.timeRange.endTime);
          if (timeRangeValidationError) {
            setTimeRangeError(timeRangeValidationError);
            return { success: false, error: timeRangeValidationError };
          }
        }

        // Validate template name if saving as template
        if (saveAsTemplate && !templateName.trim()) {
          return { success: false, error: 'Template name is required' };
        }

        // Validate auto-generation settings if enabled
        if (saveAsTemplate && autoGenerateEnabled) {
          const endDateValidationError = validateEndDate(endDate, data.scheduleDate);
          if (endDateValidationError) {
            setEndDateError(endDateValidationError);
            return { success: false, error: endDateValidationError };
          }
          if (advanceDays < 1 || advanceDays > 30) {
            return { success: false, error: 'Advance days must be between 1 and 30' };
          }
        }

        const schedulesData = convertShiftsToSchedules(data);

        const enabledDays: string[] = [];
        const availability = data.availability || {};
        for (const dayKey of Object.keys(availability)) {
          const dayData = availability[dayKey as keyof StaffScheduleFormData['availability']];
          if (dayData?.enabled) {
            enabledDays.push(dayKey.toUpperCase());
          }
        }

        // Use batch API to create all schedules at once
        let createdSchedules: Schedule[] = [];
        if (schedulesData.length > 0) {
          const batchResult = await scheduleApi.createBatchSchedules(schedulesData);
          // Check if response has the expected structure
          if (batchResult?.data?.schedules) {
            createdSchedules = batchResult.data.schedules;
          } else {
            createdSchedules = [];
          }
        }

        // Step 2: Create Template if user wants to save as template
        if (saveAsTemplate && templateName.trim()) {
          // Get all unique shift types from enabled days
          const allShifts = new Set<ShiftType>();
          for (const dayKey of Object.keys(availability)) {
            const dayData = availability[dayKey as keyof typeof availability];
            if (dayData?.enabled && dayData.shifts) {
              for (const shift of dayData.shifts) {
                allShifts.add(shift);
              }
            }
          }

          // Create shifts metadata with correct days for each shift
          const shiftsMetadata = Array.from(allShifts).map((shiftType) => {
            // Find days where this shift is enabled
            const daysForThisShift: DayOfWeek[] = [];
            let customTime = null;

            for (const dayKey of Object.keys(availability)) {
              const dayData = availability[dayKey as keyof typeof availability];
              if (dayData?.enabled && dayData.shifts?.includes(shiftType)) {
                // Add this day to the shift's days
                daysForThisShift.push(dayKey.toUpperCase() as DayOfWeek);

                // Find custom time for this shift on this day
                const dayCustomTimes = customShiftTimes[dayKey];
                const shiftCustomTime = dayCustomTimes?.[shiftType.toLowerCase()];
                if (shiftCustomTime) {
                  customTime = shiftCustomTime; // Keep the last custom time found
                }
              }
            }

            return {
              shiftType,
              startTime: customTime?.start || SHIFT_TIMES[shiftType]?.start || '08:00',
              endTime: customTime?.end || SHIFT_TIMES[shiftType]?.end || '17:00',
              daysOfWeek: daysForThisShift // Correct days for this specific shift
            };
          });

          // Use first shift as default for template
          const firstShift = shiftsMetadata[0];

          const templateData = {
            name: templateName,
            description: `${templateDescription} (Multiple shifts: ${Array.from(allShifts).join(', ')})`,
            type: data.type || 'FREE_TIME',
            branchId: data.branchId,
            ptId: data.staffId,
            startTime: firstShift.startTime, // Default to first shift
            endTime: firstShift.endTime, // Default to first shift
            daysOfWeek: enabledDays as DayOfWeek[],
            maxCapacity: 1,
            priority: 1,
            // Store multiple shifts in notes as JSON
            notes: safeJsonStringify({
              multipleShifts: true,
              shifts: shiftsMetadata
            }),
            autoGenerate: {
              enabled: autoGenerateEnabled,
              advanceDays: autoGenerateEnabled ? advanceDays : 7,
              endDate:
                autoGenerateEnabled && endDate
                  ? new Date(endDate).toISOString()
                  : new Date(data.scheduleDate).toISOString()
            }
          };

          const template = await createTemplate(templateData);
          if (template) {
            // Increment usage count since template was created from existing schedule
            if (createdSchedules.length > 0) {
              await incrementTemplateUsage(template._id);
            }
          }
        }

        // Increment template usage if schedule was created from template
        if (createdSchedules.length > 0 && selectedTemplate) {
          await incrementTemplateUsage(selectedTemplate._id);
        }

        // Show success toast only if schedules were actually created
        if (createdSchedules.length > 0) {
          toast.success(t('toast.schedule_created_success'), {
            description: t('toast.schedule_created_success_description', {
              count: createdSchedules.length,
              title: data.title
            }),
            duration: 4000
          });
        } else {
          // Show warning if no schedules were created
          toast.warning(t('toast.schedule_creation_warning'), {
            description: t('toast.schedule_creation_warning_description'),
            duration: 4000
          });
        }

        return { success: true, data: createdSchedules };
      },
      {
        showSuccess: false, // We handle success messages manually
        showError: true,
        successMessage: '', // Not used since showSuccess is false
        errorMessage: t('toast.schedule_creation_failed')
      }
    );

    setIsSubmitting(false);
    return result ? { success: true, createdSchedules: result } : { success: false, error: 'SCHEDULE_CREATION_FAILED' };
  };

  return {
    form,
    templates,
    loadingTemplates,
    selectedTemplate,
    isStaffFieldDisabled,
    templateStaffInfo,
    saveAsTemplate,
    setSaveAsTemplate,
    templateName,
    setTemplateName,
    templateDescription,
    setTemplateDescription,
    autoGenerateEnabled,
    setAutoGenerateEnabled,
    advanceDays,
    setAdvanceDays,
    endDate,
    setEndDate,
    endDateError,
    handleEndDateChange,
    timeRangeError,
    scheduleDateError,
    handleScheduleDateChange,
    handleTemplateSelect,
    handleTemplateClear,
    handleDayToggle,
    handleTimeChange,
    handleAvailabilityDayClick,
    handleStartEndTimeChange,
    handleShiftToggle, // New handler for shift-based selection
    handleCustomTimeChange, // New handler for custom shift times
    handleAddCustomShift, // New handler for adding custom shifts
    customShiftTimes, // Expose custom shift times state
    isSubmitting, // Expose loading state
    handleSubmit
  };
};
