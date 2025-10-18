import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useScheduleTemplate } from '@/hooks/useScheduleTemplate';
import { useSchedule } from '@/hooks/useSchedule';
import type { StaffScheduleFormData, DayAvailability } from '@/types/api/StaffSchedule';
import type { ScheduleTemplate, DayOfWeek } from '@/types/api/ScheduleTemplate';

const scheduleSchema = z.object({
  title: z.string().min(1, 'Schedule title is required'),
  staffId: z.string().min(1, 'Staff selection is required'),
  branchId: z.string().min(1, 'Branch selection is required'),
  scheduleDate: z.string().min(1, 'Schedule date is required'),
  type: z.enum(['CLASS', 'PERSONAL_TRAINING', 'FREE_TIME', 'MAINTENANCE']),
  timeRange: z.object({
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required')
  }),
  notes: z.string().optional(),
  availability: z.object({
    sunday: z.object({ enabled: z.boolean(), startTime: z.string(), endTime: z.string() }),
    monday: z.object({ enabled: z.boolean(), startTime: z.string(), endTime: z.string() }),
    tuesday: z.object({ enabled: z.boolean(), startTime: z.string(), endTime: z.string() }),
    wednesday: z.object({ enabled: z.boolean(), startTime: z.string(), endTime: z.string() }),
    thursday: z.object({ enabled: z.boolean(), startTime: z.string(), endTime: z.string() }),
    friday: z.object({ enabled: z.boolean(), startTime: z.string(), endTime: z.string() }),
    saturday: z.object({ enabled: z.boolean(), startTime: z.string(), endTime: z.string() })
  }),
  timezone: z.string().min(1, 'Timezone is required')
});

export const useStaffScheduleForm = (selectedStaffId?: string) => {
  const { t } = useTranslation();
  const { templates, loading: loadingTemplates, createTemplate, getTemplatesByBranch } = useScheduleTemplate();
  const { create: createSchedule } = useSchedule();

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

  const form = useForm<StaffScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
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
        sunday: { enabled: false, startTime: '09:00', endTime: '17:00' },
        monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        saturday: { enabled: false, startTime: '09:00', endTime: '17:00' }
      },
      timezone: '(GMT+07:00) Indochina Time - Ho Chi Minh City'
    }
  });

  const { setValue, watch } = form;
  const watchedBranchId = watch('branchId');
  const watchedAvailability = watch('availability');
  const watchedTitle = watch('title');

  // Fetch templates when branch is selected
  useEffect(() => {
    if (watchedBranchId) {
      getTemplatesByBranch(watchedBranchId, true);
    }
  }, [watchedBranchId, getTemplatesByBranch]);

  // Auto-fill template name when title changes (if not from template)
  useEffect(() => {
    if (watchedTitle && !selectedTemplate && saveAsTemplate) {
      // Add timestamp to make template name unique
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      setTemplateName(`${watchedTitle} - ${timestamp}`);
    }
  }, [watchedTitle, selectedTemplate, saveAsTemplate]);

  // Set default endDate when auto-generation is enabled
  useEffect(() => {
    if (autoGenerateEnabled && !endDate) {
      const defaultEndDate = new Date();
      defaultEndDate.setDate(defaultEndDate.getDate() + 30); // 30 days from now
      setEndDate(defaultEndDate.toISOString().split('T')[0]);
    }
  }, [autoGenerateEnabled, endDate]);

  // Handle template selection
  const handleTemplateSelect = (template: ScheduleTemplate) => {
    setSelectedTemplate(template);

    // Auto-fill form with template data
    setValue('title', template.name);
    setValue('type', template.type);
    setValue('scheduleDate', new Date().toISOString().split('T')[0]);
    setValue('timeRange.startTime', template.startTime);
    setValue('timeRange.endTime', template.endTime);

    // Auto-fill template name for saving
    setTemplateName(template.name);
    setTemplateDescription(template.description || '');

    // Auto-fill auto-generation settings
    setAutoGenerateEnabled(template.autoGenerate?.enabled || false);
    setAdvanceDays(template.autoGenerate?.advanceDays || 7);
    setEndDate(
      template.autoGenerate?.endDate ? new Date(template.autoGenerate.endDate).toISOString().split('T')[0] : ''
    );

    // Auto-enable save as template when template is selected
    setSaveAsTemplate(true);

    // Auto-fill branch if template has specific branch
    if (template.branchId?._id) {
      setValue('branchId', template.branchId._id);
    }

    // Handle staff auto-fill based on template type
    if (template.ptId) {
      // Template has specific PT assigned
      setValue('staffId', template.ptId._id);
      setIsStaffFieldDisabled(true);
      setTemplateStaffInfo({
        name: template.ptId.userId?.fullName || 'Personal Trainer',
        id: template.ptId._id
      });
    } else if (template.classId) {
      // Template has specific class assigned
      // ClassReference doesn't include instructor info, allow staff selection
      setIsStaffFieldDisabled(false);
      setTemplateStaffInfo(null);
    } else {
      // Template doesn't specify staff, but we can suggest based on template type
      setIsStaffFieldDisabled(false);
      setTemplateStaffInfo(null);
    }

    // Set availability based on template days
    const availability = {
      sunday: {
        enabled: template.daysOfWeek.includes('SUNDAY'),
        startTime: template.startTime,
        endTime: template.endTime
      },
      monday: {
        enabled: template.daysOfWeek.includes('MONDAY'),
        startTime: template.startTime,
        endTime: template.endTime
      },
      tuesday: {
        enabled: template.daysOfWeek.includes('TUESDAY'),
        startTime: template.startTime,
        endTime: template.endTime
      },
      wednesday: {
        enabled: template.daysOfWeek.includes('WEDNESDAY'),
        startTime: template.startTime,
        endTime: template.endTime
      },
      thursday: {
        enabled: template.daysOfWeek.includes('THURSDAY'),
        startTime: template.startTime,
        endTime: template.endTime
      },
      friday: {
        enabled: template.daysOfWeek.includes('FRIDAY'),
        startTime: template.startTime,
        endTime: template.endTime
      },
      saturday: {
        enabled: template.daysOfWeek.includes('SATURDAY'),
        startTime: template.startTime,
        endTime: template.endTime
      }
    };

    Object.keys(availability).forEach((day) => {
      const dayKey = day as keyof typeof availability;
      const dayData: DayAvailability = availability[dayKey];

      if (dayData) {
        setValue(`availability.${dayKey}.enabled` as keyof StaffScheduleFormData, dayData.enabled as never);
        setValue(`availability.${dayKey}.startTime` as keyof StaffScheduleFormData, dayData.startTime as never);
        setValue(`availability.${dayKey}.endTime` as keyof StaffScheduleFormData, dayData.endTime as never);
      }
    });
  };

  const handleTemplateClear = () => {
    setSelectedTemplate(null);
    setIsStaffFieldDisabled(false);
    setTemplateStaffInfo(null);
    // Clear staff and branch selection when template is cleared
    setValue('staffId', '');
    setValue('branchId', '');
    // Clear type and reset to default
    setValue('type', 'FREE_TIME');
    // Reset startTime and endTime to default values
    setValue('timeRange.startTime', '09:00');
    setValue('timeRange.endTime', '17:00');
    // Keep scheduleDate as today (don't clear it)
    // Clear template name and description
    setTemplateName('');
    setTemplateDescription('');

    // Clear auto-generation settings
    setAutoGenerateEnabled(false);
    setAdvanceDays(7);
    setEndDate('');

    // Disable save as template when template is cleared
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

    // Auto-fill Start/End Time if this day is currently selected and enabled
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

  // Auto-fill Start/End Time from General Availability when day is selected
  const handleAvailabilityDayClick = (dayKey: keyof StaffScheduleFormData['availability']) => {
    const currentAvailability = watchedAvailability || {};
    const dayData = currentAvailability[dayKey];

    if (dayData?.enabled) {
      // Auto-fill Start/End Time from the selected day's availability
      setValue('timeRange.startTime', dayData.startTime);
      setValue('timeRange.endTime', dayData.endTime);
      console.log(`🔄 Auto-filled Start/End Time from ${dayKey}:`, {
        startTime: dayData.startTime,
        endTime: dayData.endTime
      });
    }
  };

  // Sync Start/End Time changes back to General Availability
  const handleStartEndTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setValue(`timeRange.${field}`, value);

    // Sync back to all enabled days in General Availability
    const currentAvailability = watchedAvailability || {};
    Object.keys(currentAvailability).forEach((dayKey) => {
      const dayData = currentAvailability[dayKey as keyof StaffScheduleFormData['availability']];
      if (dayData?.enabled) {
        setValue(`availability.${dayKey}.${field}` as keyof StaffScheduleFormData, value);
      }
    });

    console.log(`🔄 Synced ${field} to all enabled days:`, value);
  };

  // Handle form submission
  const handleSubmit = async (data: StaffScheduleFormData) => {
    try {
      // Validate template name if saving as template
      if (saveAsTemplate && !templateName.trim()) {
        alert('Please enter a template name');
        return;
      }

      // Validate auto-generation settings if enabled
      if (saveAsTemplate && autoGenerateEnabled) {
        if (!endDate) {
          alert('Please select an end date for auto-generation');
          return;
        }
        if (advanceDays < 1 || advanceDays > 30) {
          alert('Advance days must be between 1 and 30');
          return;
        }
      }

      // Step 1: Create Schedules for all enabled days
      const enabledDays: string[] = [];
      const availability = data.availability || {};

      // Get enabled days from General Availability
      Object.keys(availability).forEach((dayKey) => {
        const dayData = availability[dayKey as keyof StaffScheduleFormData['availability']];
        if (dayData?.enabled) {
          enabledDays.push(dayKey.toUpperCase());
        }
      });

      // Create schedules for each enabled day
      const createdSchedules = [];
      const baseDate = new Date(data.scheduleDate);

      // Find the start of the week (Monday) for the base date
      const startOfWeek = new Date(baseDate);
      const dayOfWeek = startOfWeek.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
      startOfWeek.setDate(startOfWeek.getDate() - daysToMonday);

      for (const dayName of enabledDays) {
        // Calculate the date for this day of the week
        const dayIndex = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].indexOf(
          dayName
        );
        const targetDate = new Date(startOfWeek);
        targetDate.setDate(startOfWeek.getDate() + dayIndex);

        // Get time for this specific day
        const dayKey = dayName.toLowerCase() as keyof StaffScheduleFormData['availability'];
        const dayData = availability[dayKey];

        const scheduleData = {
          name: data.title,
          type: data.type || 'FREE_TIME',
          ptId: data.staffId,
          scheduleDate: targetDate.toISOString().split('T')[0],
          branchId: data.branchId,
          startTime: dayData?.startTime || data.timeRange.startTime,
          endTime: dayData?.endTime || data.timeRange.endTime,
          status: 'SCHEDULED' as const,
          maxCapacity: 1,
          currentBookings: 0,
          notes: data.notes || undefined,
          isRecurring: false
        };

        const createdSchedule = await createSchedule(scheduleData);
        createdSchedules.push(createdSchedule);
      }

      // Step 2: Create Template if user wants to save as template
      if (saveAsTemplate && templateName.trim()) {
        const templateData = {
          name: templateName,
          description: templateDescription,
          type: data.type || 'FREE_TIME',
          branchId: data.branchId,
          ptId: data.staffId,
          startTime: data.timeRange.startTime || '09:00',
          endTime: data.timeRange.endTime || '17:00',
          daysOfWeek: enabledDays as DayOfWeek[],
          maxCapacity: 1,
          priority: 1,
          autoGenerate: {
            enabled: autoGenerateEnabled,
            advanceDays: autoGenerateEnabled ? advanceDays : 7,
            endDate: autoGenerateEnabled && endDate ? new Date(endDate).toISOString() : new Date().toISOString()
          }
        };

        const templateResult = await createTemplate(templateData);
        console.log('Template created successfully:', templateResult);

        // Show template creation success toast
        toast.success(t('toast.template_saved_success'), {
          description: t('toast.template_saved_success_description', { name: templateName }),
          duration: 4000
        });
      }

      // Show success toast
      toast.success(t('toast.schedule_created_success'), {
        description: t('toast.schedule_created_success_description', {
          count: createdSchedules.length,
          title: data.title
        }),
        duration: 4000
      });

      return { success: true, createdSchedules };
    } catch (error) {
      console.error('Error creating schedule:', error);

      // Show error toast
      toast.error(t('toast.schedule_creation_failed'), {
        description: t('toast.schedule_creation_failed_description'),
        duration: 5000
      });

      return { success: false, error };
    }
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
    handleTemplateSelect,
    handleTemplateClear,
    handleDayToggle,
    handleTimeChange,
    handleAvailabilityDayClick,
    handleStartEndTimeChange,
    handleSubmit
  };
};
