import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  Users,
  BookOpen,
  PlayCircle,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCustomerClassSchedule } from '@/hooks/useCustomerClassSchedule';
import { utcToVnTimeString } from '@/utils/datetime';

interface TrainerDetail {
  staffId: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  jobTitle?: string;
}

// Helper function to compare dates by YYYY-MM-DD format (timezone-safe)
// Use UTC methods to avoid timezone conversion issues
const getDateString = (date: Date): string => {
  // Use UTC methods to get consistent date string regardless of timezone
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const CustomerClassCalendar: React.FC = () => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerDetail | null>(null);
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<'phone' | 'email' | null>(null);

  // Calculate date range based on current month being viewed
  // Include previous and next month to ensure smooth navigation
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    // Start from first day of previous month (set to midnight local time)
    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    // End at last day of next month (set to end of day local time)
    const endDate = new Date(year, month + 2, 0);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }, [currentDate]);

  const { data, isLoading, error } = useCustomerClassSchedule({
    startDate: dateRange.startDate.toISOString(),
    endDate: dateRange.endDate.toISOString()
  });

  // Get current month calendar view
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of month - create dates at midnight UTC for consistency
    for (let i = 1; i <= daysInMonth; i++) {
      // Create date at midnight UTC to match backend format
      const date = new Date(Date.UTC(year, month, i, 0, 0, 0, 0));
      days.push(date);
    }
    return days;
  }, [currentDate]);

  // Get schedules for selected date
  const selectedDateSchedules = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    const currentDateStr = getDateString(currentDate);
    return data.filter((schedule: Record<string, unknown>) => {
      const scheduleDate = new Date(schedule.scheduleDate as string);
      return getDateString(scheduleDate) === currentDateStr;
    });
  }, [data, currentDate]);

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
    // dateRange will automatically update via useMemo
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
    // dateRange will automatically update via useMemo
  };

  const handleDateClick = (date: Date) => {
    setCurrentDate(date);
  };

  const handleTrainerClick = (trainer: TrainerDetail) => {
    setSelectedTrainer(trainer);
    setIsTrainerModalOpen(true);
  };

  const handleCopy = async (text: string, field: 'phone' | 'email') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      const fieldName =
        field === 'phone' ? t('customerClassCalendar.trainer.phone') : t('customerClassCalendar.trainer.email');
      toast.success(t('customerClassCalendar.trainer.copySuccess', { field: fieldName }));
      setTimeout(() => setCopiedField(null), 2000);
    } catch (_error) {
      toast.error(t('customerClassCalendar.trainer.copyError'));
    }
  };

  // Days of week header
  const daysOfWeek = [
    t('customerClassCalendar.daysOfWeek.sun'),
    t('customerClassCalendar.daysOfWeek.mon'),
    t('customerClassCalendar.daysOfWeek.tue'),
    t('customerClassCalendar.daysOfWeek.wed'),
    t('customerClassCalendar.daysOfWeek.thu'),
    t('customerClassCalendar.daysOfWeek.fri'),
    t('customerClassCalendar.daysOfWeek.sat')
  ];

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{t('customerClassCalendar.error.loadFailed')}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <BookOpen className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('customerClassCalendar.title')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('customerClassCalendar.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 hover:bg-orange-50">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="min-w-[180px] text-center font-semibold text-gray-700 px-4">
            {currentDate.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' })}
          </span>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 hover:bg-orange-50">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1 shadow-sm border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-800">{t('customerClassCalendar.calendar')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square"></div>;
                }

                const dateStr = getDateString(date);
                const todayStr = getDateString(new Date());
                const currentDateStr = getDateString(currentDate);

                const isToday = dateStr === todayStr;
                const isSelected = dateStr === currentDateStr;

                // Check if this date has schedules
                const hasSchedules =
                  Array.isArray(data) &&
                  data.some((s: Record<string, unknown>) => {
                    if (!s.scheduleDate) return false;
                    const scheduleDate = new Date(s.scheduleDate as string);
                    const scheduleDateStr = getDateString(scheduleDate);
                    return scheduleDateStr === dateStr;
                  });

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateClick(date)}
                    className={`aspect-square p-1 text-sm rounded-lg text-center transition-all relative ${
                      isSelected
                        ? 'bg-orange-500 text-white font-semibold shadow-md scale-105'
                        : hasSchedules
                          ? 'bg-orange-50 text-orange-700 font-semibold hover:bg-orange-100 border border-orange-200'
                          : isToday
                            ? 'bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 border border-blue-200'
                            : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="block">{date.getDate()}</span>
                    {hasSchedules && !isSelected && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentDate.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedDateSchedules.length === 0
                    ? t('customerClassCalendar.schedule.noClasses')
                    : t('customerClassCalendar.schedule.classesCount', { count: selectedDateSchedules.length })}
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="w-full h-72 rounded-xl" />
              ))}
            </div>
          ) : selectedDateSchedules.length > 0 ? (
            <div className="space-y-4">
              {selectedDateSchedules.map((schedule: Record<string, unknown>, index: number) => {
                // Extract and type-safe schedule properties
                const className = String(schedule.className || t('customerClassCalendar.class.unknown'));
                const activeEnrollment = Number(schedule.activeEnrollment) || 0;
                const capacity = Number(schedule.capacity) || 0;
                const startTimeStr = String(schedule.startTime || '');
                const endTimeStr = String(schedule.endTime || '');
                const location = typeof schedule.location === 'string' ? schedule.location : null;
                const description = typeof schedule.description === 'string' ? schedule.description : null;
                const trainers = Array.isArray(schedule.trainers) ? schedule.trainers : [];

                // Calculate class status
                const now = new Date();
                const startTime = new Date(startTimeStr);
                const endTime = new Date(endTimeStr);

                let statusLabel = t('customerClassCalendar.class.status.upcoming');
                let statusColor = 'text-blue-600 bg-blue-50 border-blue-200';
                let statusIcon = <Clock className="w-4 h-4" />;

                if (now >= startTime && now <= endTime) {
                  statusLabel = t('customerClassCalendar.class.status.ongoing');
                  statusColor = 'text-green-600 bg-green-50 border-green-200';
                  statusIcon = <PlayCircle className="w-4 h-4" />;
                } else if (now > endTime) {
                  statusLabel = t('customerClassCalendar.class.status.completed');
                  statusColor = 'text-gray-600 bg-gray-50 border-gray-200';
                  statusIcon = <CheckCircle2 className="w-4 h-4" />;
                }

                return (
                  <Card
                    key={index}
                    className="overflow-hidden border-l-4 border-l-orange-500 border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 bg-white"
                  >
                    {/* Part 1: Class Name + Capacity */}
                    <CardHeader className="pb-3 pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                            {className}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge
                            variant="outline"
                            className={`${statusColor} border font-medium px-3 py-1.5 flex items-center gap-1.5`}
                          >
                            {statusIcon}
                            <span className="text-xs">{statusLabel}</span>
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200 px-3 py-1.5"
                          >
                            <Users className="w-4 h-4 mr-1.5" />
                            <span className="font-semibold">{activeEnrollment}</span>
                            <span className="text-orange-500 mx-1">/</span>
                            <span className="text-orange-600">{capacity}</span>
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Part 2: Time + Location with light background */}
                    <div className="px-6 pb-4 bg-orange-50/50 border-b border-gray-100">
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium">
                            {utcToVnTimeString(startTimeStr)} - {utcToVnTimeString(endTimeStr)}
                          </span>
                        </div>
                        {location && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <MapPin className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-medium">{location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <CardContent className="pt-5 space-y-4">
                      {/* Description */}
                      {description && (
                        <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <p className="font-semibold text-gray-900 mb-2">
                            {t('customerClassCalendar.class.description')}
                          </p>
                          <p className="text-gray-600 leading-relaxed">{description}</p>
                        </div>
                      )}

                      {/* Trainers */}
                      {trainers.length > 0 && (
                        <div className="pt-3 border-t border-gray-200">
                          <p className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4 text-orange-600" />
                            {t('customerClassCalendar.class.trainersCount', { count: trainers.length })}
                          </p>
                          <div className="space-y-2.5">
                            {trainers.map((trainer: Record<string, unknown>, trainerIndex: number) => {
                              const trainerName = String(trainer.name || 'Unknown');
                              const trainerAvatar = typeof trainer.avatar === 'string' ? trainer.avatar : undefined;
                              const trainerJobTitle =
                                typeof trainer.jobTitle === 'string'
                                  ? trainer.jobTitle
                                  : t('customerClassCalendar.trainer.defaultJobTitle');
                              const trainerStaffId = String(trainer.staffId || trainer._id || '');
                              const trainerEmail = typeof trainer.email === 'string' ? trainer.email : undefined;
                              const trainerPhone = typeof trainer.phone === 'string' ? trainer.phone : undefined;

                              return (
                                <div
                                  key={trainerIndex}
                                  onClick={() =>
                                    handleTrainerClick({
                                      staffId: trainerStaffId,
                                      name: trainerName,
                                      email: trainerEmail,
                                      phone: trainerPhone,
                                      avatar: trainerAvatar,
                                      jobTitle: trainerJobTitle
                                    })
                                  }
                                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-orange-300 hover:bg-orange-50/30 hover:shadow-md transition-all duration-200 cursor-pointer"
                                >
                                  <Avatar className="w-11 h-11 border-2 border-orange-200 flex-shrink-0">
                                    <AvatarImage src={trainerAvatar} alt={trainerName} />
                                    <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold text-xs">
                                      {trainerName
                                        .split(' ')
                                        .map((n: string) => n[0])
                                        .join('')
                                        .toUpperCase()
                                        .slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-gray-900 truncate">{trainerName}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{trainerJobTitle}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="text-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">{t('customerClassCalendar.schedule.noClasses')}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Trainer Detail Modal */}
      <Dialog open={isTrainerModalOpen} onOpenChange={setIsTrainerModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {t('customerClassCalendar.trainer.title')}
            </DialogTitle>
          </DialogHeader>

          {selectedTrainer && (
            <div className="space-y-6 py-4">
              {/* Avatar and Name */}
              <div className="flex flex-col items-center gap-4 pb-4 border-b border-gray-200">
                <Avatar className="w-24 h-24 border-4 border-orange-200">
                  <AvatarImage src={selectedTrainer.avatar} alt={selectedTrainer.name} />
                  <AvatarFallback className="bg-orange-100 text-orange-700 font-bold text-2xl">
                    {selectedTrainer.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedTrainer.name}</h3>
                  {selectedTrainer.jobTitle && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      {selectedTrainer.jobTitle}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                {selectedTrainer.phone && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Phone className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-0.5">{t('customerClassCalendar.trainer.phone')}</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedTrainer.phone}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(selectedTrainer.phone!, 'phone')}
                      className="h-9 w-9 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      title={t('customerClassCalendar.trainer.phone')}
                    >
                      {copiedField === 'phone' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}

                {selectedTrainer.email && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Mail className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">{t('customerClassCalendar.trainer.email')}</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{selectedTrainer.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(selectedTrainer.email!, 'email')}
                      className="h-9 w-9 text-orange-600 hover:text-orange-700 hover:bg-orange-50 flex-shrink-0"
                      title={t('customerClassCalendar.trainer.email')}
                    >
                      {copiedField === 'email' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
