import type { ScheduleType } from '@/types/common/BaseTypes';

export const getScheduleTypeLabel = (type: ScheduleType, t: (key: string) => string): string => {
  const typeMap: Record<ScheduleType, string> = {
    CLASS: t('schedule_types.class'),
    PERSONAL_TRAINING: t('schedule_types.personal_training'),
    FREE_TIME: t('schedule_types.free_time'),
    MAINTENANCE: t('schedule_types.maintenance')
  };

  return typeMap[type] || type;
};

export const getScheduleTypeDescription = (type: ScheduleType, t: (key: string) => string): string => {
  const descriptionMap: Record<ScheduleType, string> = {
    CLASS: t('schedule_types.class_description'),
    PERSONAL_TRAINING: t('schedule_types.personal_training_description'),
    FREE_TIME: t('schedule_types.free_time_description'),
    MAINTENANCE: t('schedule_types.maintenance_description')
  };

  return descriptionMap[type] || '';
};

export const getDayOfWeekLabel = (day: string, t: (key: string) => string): string => {
  const dayMap: Record<string, string> = {
    MONDAY: t('workshift.mon'),
    TUESDAY: t('workshift.tue'),
    WEDNESDAY: t('workshift.wed'),
    THURSDAY: t('workshift.thu'),
    FRIDAY: t('workshift.fri'),
    SATURDAY: t('workshift.sat'),
    SUNDAY: t('workshift.sun')
  };

  return dayMap[day] || day;
};

export const formatDaysOfWeek = (days: string[], t: (key: string) => string): string => {
  return days.map((day) => getDayOfWeekLabel(day, t)).join(', ');
};
