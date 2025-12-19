import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart2,
  Calendar,
  CheckCircle,
  Clock,
  Dumbbell,
  MessageCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthState } from '@/hooks/useAuth';
import { useBranch } from '@/contexts/BranchContext';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { usePTCustomerList, usePTCustomerUtils } from '@/hooks/usePTCustomer';
import { usePTSchedules } from '@/hooks/usePTSchedules';
import { useMyKPI } from '@/hooks/useKPI';
import { trainingProgressApi } from '@/services/api/trainingProgressApi';
import { LoadingSpinner as PageLoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import type { Schedule } from '@/types/api/Schedule';
import type { KPIConfigWithAchievement } from '@/types/api/KPI';
import type { TrainingProgressAggregated } from '@/types/api/TrainingProgress';

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const getScheduleDate = (schedule: Schedule) => {
  const date = new Date(schedule.scheduleDate);
  const start = schedule.timeRange?.startTime;
  if (start) {
    const [hour, minute] = start.split(':');
    date.setHours(Number.parseInt(hour || '0', 10), Number.parseInt(minute || '0', 10), 0, 0);
  }
  return date;
};

const getScheduleDurationMinutes = (schedule: Schedule) => {
  const start = schedule.timeRange?.startTime;
  const end = schedule.timeRange?.endTime;
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':');
  const [eh, em] = end.split(':');
  const startDate = new Date();
  const endDate = new Date();
  startDate.setHours(Number.parseInt(sh || '0', 10), Number.parseInt(sm || '0', 10), 0, 0);
  endDate.setHours(Number.parseInt(eh || '0', 10), Number.parseInt(em || '0', 10), 0, 0);
  return Math.max(0, (endDate.getTime() - startDate.getTime()) / (1000 * 60));
};

const PTDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuthState();
  const { currentBranch } = useBranch();
  const { currentStaff, loading: staffLoading } = useCurrentUserStaff();
  const trainerId = currentStaff?._id || user?._id || '';
  const branchId = currentBranch?._id;
  const { getRemainingDays, calculateProgress, getUrgencyLevel } = usePTCustomerUtils();

  const todayStart = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const weekEnd = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    date.setHours(23, 59, 59, 999);
    return date;
  }, []);

  const {
    customerList,
    loading: customersLoading,
    stats: customerStats,
    pagination,
    error: customersError,
    refetch: refetchCustomers
  } = usePTCustomerList({
    trainerId,
    branchId,
    limit: 50,
    packageType: 'PT'
  });

  const {
    schedules,
    loading: schedulesLoading,
    error: schedulesError,
    refetch: refetchSchedules
  } = usePTSchedules(trainerId, {
    type: 'PERSONAL_TRAINING',
    enabled: Boolean(trainerId),
    dateFrom: todayStart.toISOString(),
    dateTo: weekEnd.toISOString()
  });

  const { myKPIs, loading: kpiLoading } = useMyKPI();
  const [recentProgress, setRecentProgress] = useState<TrainingProgressAggregated[]>([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingFilter, setUpcomingFilter] = useState<'today' | 'week'>('week');
  const isMountedRef = useRef(true);

  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    []
  );

  const loadProgress = useCallback(async () => {
    if (!trainerId) {
      if (!isMountedRef.current) return;
      setRecentProgress([]);
      setProgressError(null);
      setProgressLoading(false);
      return;
    }

    setProgressLoading(true);
    setProgressError(null);

    try {
      const response = await trainingProgressApi.getTrainingProgressList({
        trainerId,
        branchId,
        page: 1,
        limit: 4,
        sortBy: 'trackingDate',
        sortOrder: 'desc'
      });

      if (!isMountedRef.current) return;

      if (response.success && response.data?.progressRecords) {
        setRecentProgress(response.data.progressRecords);
      } else {
        setRecentProgress([]);
        setProgressError(response.message || t('pt.dashboard.progress.error', 'Unable to load progress right now.'));
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      setRecentProgress([]);
      setProgressError(
        error instanceof Error ? error.message : t('pt.dashboard.progress.error', 'Unable to load progress right now.')
      );
    } finally {
      if (isMountedRef.current) {
        setProgressLoading(false);
      }
    }
  }, [trainerId, branchId, t]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  type ScheduleWithDate = { schedule: Schedule; date: Date };

  const schedulesWithDate = useMemo<ScheduleWithDate[]>(
    () =>
      schedules.map((schedule) => ({
        schedule,
        date: getScheduleDate(schedule)
      })),
    [schedules]
  );

  const sortedSchedules = useMemo<ScheduleWithDate[]>(() => {
    const sorter = (a: ScheduleWithDate, b: ScheduleWithDate) => a.date.getTime() - b.date.getTime();
    const copy = [...schedulesWithDate];
    return copy.sort(sorter);
  }, [schedulesWithDate]);

  const todaysSchedules = useMemo<Schedule[]>(
    () => sortedSchedules.filter((item) => isSameDay(item.date, todayStart)).map((item) => item.schedule),
    [sortedSchedules, todayStart]
  );

  const upcomingWeekSchedules = useMemo<ScheduleWithDate[]>(
    () => sortedSchedules.filter((item) => item.date > todayStart && !isSameDay(item.date, todayStart)).slice(0, 6),
    [sortedSchedules, todayStart]
  );

  const nextSchedule = useMemo<Schedule | undefined>(
    () => sortedSchedules.find((item) => item.date.getTime() >= Date.now())?.schedule,
    [sortedSchedules]
  );

  const filteredUpcoming = useMemo<Schedule[]>(
    () => (upcomingFilter === 'today' ? todaysSchedules : upcomingWeekSchedules.map((item) => item.schedule)),
    [upcomingFilter, todaysSchedules, upcomingWeekSchedules]
  );

  const weeklyMinutes = useMemo(
    () => schedules.reduce((total, schedule) => total + getScheduleDurationMinutes(schedule), 0),
    [schedules]
  );

  const totalCustomers = pagination?.total || customerStats.total;
  const atRiskCustomers = useMemo(() => {
    const mapped = customerList.map((customer) => ({
      customer,
      urgency: getUrgencyLevel(customer),
      remainingDays: getRemainingDays(customer.package.endDate),
      progress: Math.round(calculateProgress(customer))
    }));

    const urgentList = mapped
      .filter((item) => item.urgency !== 'active')
      .sort(
        (a, b) =>
          a.remainingDays - b.remainingDays ||
          a.customer.package.sessionsRemaining - b.customer.package.sessionsRemaining
      );

    const fallbackList = mapped.sort(
      (a, b) =>
        a.customer.package.sessionsRemaining - b.customer.package.sessionsRemaining || a.remainingDays - b.remainingDays
    );

    return (urgentList.length > 0 ? urgentList : fallbackList).slice(0, 4);
  }, [customerList, calculateProgress, getRemainingDays, getUrgencyLevel]);

  const sessionsRemaining = useMemo(
    () => customerList.reduce((total, customer) => total + (customer.package.sessionsRemaining || 0), 0),
    [customerList]
  );

  const activeKPI: KPIConfigWithAchievement | undefined = useMemo(() => {
    if (!myKPIs || myKPIs.length === 0) return undefined;
    const today = new Date();
    return (
      myKPIs.find((item) => {
        const start = new Date(item.config.startDate);
        const end = new Date(item.config.endDate);
        return start <= today && today <= end;
      }) || myKPIs[0]
    );
  }, [myKPIs]);

  const kpiSessionTarget = activeKPI?.config.targets?.ptSessions || 0;
  const kpiSessionActual = activeKPI?.achievement?.actual?.sessions?.ptSessions || 0;
  const kpiRevenueTarget = activeKPI?.config.targets?.revenue || 0;
  const kpiRevenueActual = activeKPI?.achievement?.actual?.revenue?.total || 0;
  const kpiSessionProgress = kpiSessionTarget ? Math.min(100, (kpiSessionActual / kpiSessionTarget) * 100) : 0;
  const kpiRevenueProgress = kpiRevenueTarget ? Math.min(100, (kpiRevenueActual / kpiRevenueTarget) * 100) : 0;

  const fullName = user?.fullName || user?.username || 'PT';
  const branchName = currentBranch?.branchName || t('pt.dashboard.all_branches', 'All branches');
  const loading = authLoading || staffLoading;
  const isInitialLoading =
    (authLoading || staffLoading || schedulesLoading || customersLoading || progressLoading) &&
    schedules.length === 0 &&
    customerList.length === 0 &&
    recentProgress.length === 0;

  useEffect(() => {
    if (!customersLoading && !schedulesLoading && !progressLoading && !loading) {
      setLastUpdated(new Date());
    }
  }, [customersLoading, schedulesLoading, progressLoading, loading]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const results = await Promise.allSettled([refetchSchedules(), refetchCustomers(), loadProgress()]);
    const hasFailure = results.some((result) => result.status === 'rejected');
    setLastUpdated(new Date());
    setRefreshing(false);

    if (hasFailure) {
      toast.error(t('pt.dashboard.refresh.partial', 'Some data could not refresh, please try again.'));
    } else {
      toast.success(t('pt.dashboard.refresh.success', 'Dashboard data refreshed'));
    }
  }, [loadProgress, refetchCustomers, refetchSchedules, t]);

  const formatScheduleLabel = useCallback(
    (schedule: Schedule) => {
      const date = getScheduleDate(schedule);
      if (isSameDay(date, todayStart)) return t('pt.dashboard.next_session.today', 'Today');
      return date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' });
    },
    [todayStart, t]
  );

  const getStatusStyles = (status?: Schedule['status']) => {
    switch (status) {
      case 'IN_PROGRESS':
        return {
          label: t('workshift.status.in_progress', 'In Progress'),
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'COMPLETED':
        return {
          label: t('workshift.status.completed', 'Completed'),
          className: 'bg-gray-100 text-gray-700 border-gray-200'
        };
      case 'CANCELLED':
        return {
          label: t('workshift.status.cancelled', 'Cancelled'),
          className: 'bg-red-50 text-red-700 border-red-200'
        };
      default:
        return {
          label: t('workshift.status.scheduled', 'Scheduled'),
          className: 'bg-blue-50 text-blue-700 border-blue-200'
        };
    }
  };

  const actionItems = useMemo(() => {
    const items: Array<{
      title: string;
      description: string;
      cta: string;
      onClick: () => void;
      icon: React.ReactNode;
    }> = [];

    if (nextSchedule) {
      const timeLabel = `${nextSchedule.timeRange?.startTime?.slice(0, 5)} - ${nextSchedule.timeRange?.endTime?.slice(0, 5)}`;
      items.push({
        title: t('pt.dashboard.action_center.next_session', 'Check in the next session'),
        description: `${formatScheduleLabel(nextSchedule)} • ${timeLabel} • ${nextSchedule.branchId?.branchName || branchName}`,
        cta: t('pt.dashboard.quick_access.calendar', 'Open calendar'),
        onClick: () => {
          void navigate('/manage/pt/calendar');
        },
        icon: <Clock className="w-4 h-4 text-[#F05A29]" />
      });
    }

    if (customerStats.expiringSoon > 0) {
      items.push({
        title: t('pt.dashboard.action_center.expiring_clients', 'Follow up expiring clients'),
        description: t('pt.dashboard.clients.days_left', '{{count}} days left', { count: 7 }),
        cta: t('pt.dashboard.clients.view_all', 'View clients'),
        onClick: () => {
          void navigate('/manage/pt/clients');
        },
        icon: <AlertTriangle className="w-4 h-4 text-amber-600" />
      });
    }

    if (!progressLoading) {
      items.push({
        title: t('pt.dashboard.action_center.log_progress', 'Log a quick progress update'),
        description:
          recentProgress.length > 0
            ? t('pt.dashboard.progress.title', 'Latest progress updates')
            : t('pt.dashboard.progress.empty', 'No progress entries yet'),
        cta: t('pt.dashboard.progress.view_all', 'Log new progress'),
        onClick: () => {
          void navigate('/manage/pt/clients');
        },
        icon: <Activity className="w-4 h-4 text-emerald-600" />
      });
    }

    return items.slice(0, 3);
  }, [
    branchName,
    customerStats.expiringSoon,
    formatScheduleLabel,
    navigate,
    nextSchedule,
    progressLoading,
    recentProgress.length,
    t
  ]);

  if (isInitialLoading) {
    return <PageLoadingSpinner message={t('common.loading', 'Loading...')} className="py-24" />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-[#f05a29] via-[#ff7a45] to-[#ffa76a] text-white p-6 shadow-xl border border-white/10 overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,#ffffff,transparent_35%)]" />
        <div className="flex flex-col lg:flex-row justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <Badge variant="outline" className="bg-white/15 text-white border-white/30">
              <Sparkles className="w-4 h-4 mr-2" />
              {t('pt.dashboard.heading', 'Personal Trainer Dashboard')}
            </Badge>
            <h1 className="text-3xl font-semibold leading-tight">
              {t('pt.dashboard.greeting', { name: fullName, defaultValue: 'Welcome back, {{name}}' })}
            </h1>
            <p className="text-white/70 max-w-2xl">
              {t('pt.dashboard.subtitle', 'Monitor sessions, clients, and KPIs in one focused view.')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-white text-[#f05a29] px-3 py-1 rounded-full font-medium border-0">
                {t('pt.dashboard.branch_label', 'Branch')}: {branchName}
              </Badge>
              <Badge variant="outline" className="border-white/40 text-white px-3 py-1 rounded-full">
                <Calendar className="w-4 h-4 mr-1" />
                {todaysSchedules.length} {t('pt.dashboard.stats.sessions_today', "Today's sessions")}
              </Badge>
              <Badge variant="outline" className="border-white/40 text-white px-3 py-1 rounded-full">
                <Clock className="w-4 h-4 mr-1" />
                {(weeklyMinutes / 60).toFixed(1)}h {t('pt.dashboard.stats.weekly_hours', 'scheduled this week')}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                className="bg-white text-[#f05a29] hover:bg-white/90"
                onClick={() => navigate('/manage/pt/calendar')}
              >
                {t('pt.dashboard.quick_access.calendar', 'Open calendar')}
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="bg-transparent border-white/50 text-white hover:bg-white/10"
                onClick={() => navigate('/manage/pt/clients')}
              >
                {t('pt.dashboard.quick_access.clients', 'Manage clients')}
              </Button>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={() => navigate('/manage/pt/clients')}
              >
                {t('pt.dashboard.quick_access.log_progress', 'Log progress')}
              </Button>
            </div>
          </div>
          <Card className="bg-white/15 backdrop-blur border-white/25 text-white w-full lg:w-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {t('pt.dashboard.next_session.title', 'Next session')}
              </CardTitle>
              <CardDescription className="text-white/70">
                {t('pt.dashboard.next_session.subtitle', 'Keep the day tight and predictable')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nextSchedule ? (
                <div className="p-4 rounded-2xl bg-white/10 border border-white/25">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/70">{formatScheduleLabel(nextSchedule)}</p>
                      <p className="text-lg font-semibold">
                        {nextSchedule.name || t('pt.dashboard.session_default', '1-1 Session')}
                      </p>
                      <p className="text-sm text-white/70">{nextSchedule.branchId?.branchName || branchName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {nextSchedule.timeRange?.startTime?.slice(0, 5)} -{' '}
                        {nextSchedule.timeRange?.endTime?.slice(0, 5)}
                      </p>
                      <p className="text-xs text-white/70">
                        {t('pt.dashboard.next_session.duration', '{{minutes}} minutes', {
                          minutes: getScheduleDurationMinutes(nextSchedule)
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white/70">
                  {t('pt.dashboard.next_session.none', 'No sessions booked for the next days')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#F05A29]" />
              {t('pt.dashboard.action_center.title', 'Action center')}
            </CardTitle>
            <CardDescription>
              {t('pt.dashboard.action_center.subtitle', 'Quick actions to stay ahead today')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>
              {t('pt.dashboard.last_updated', 'Last updated')}:{' '}
              {lastUpdated ? lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--'}
            </span>
            <Button size="sm" variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? t('pt.dashboard.refreshing', 'Refreshing...') : t('pt.dashboard.refresh', 'Refresh')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {actionItems.length === 0 ? (
            <p className="text-sm text-gray-600">{t('pt.dashboard.action_center.empty', 'All caught up for now!')}</p>
          ) : (
            actionItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-gray-200 hover:border-[#F05A29] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-[#F05A29] bg-opacity-10">{item.icon}</div>
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={item.onClick}>
                  {item.cta}
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ))
          )}
          {(customersError || schedulesError || progressError) && (
            <div className="flex flex-wrap gap-2">
              {schedulesError && (
                <div className="flex items-center gap-2 rounded-full bg-amber-50 text-amber-800 px-3 py-1 text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  {t('pt.dashboard.error.schedules', 'Unable to load schedules')}
                </div>
              )}
              {customersError && (
                <div className="flex items-center gap-2 rounded-full bg-amber-50 text-amber-800 px-3 py-1 text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  {t('pt.dashboard.error.customers', 'Unable to load customers')}
                </div>
              )}
              {progressError && (
                <div className="flex items-center gap-2 rounded-full bg-amber-50 text-amber-800 px-3 py-1 text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  {t('pt.dashboard.progress.error', 'Unable to load progress right now.')}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#F05A29]" />
              {t('pt.dashboard.stats.sessions_today', "Today's sessions")}
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              {t('pt.dashboard.stats.sessions_today_helper', 'Booked in your calendar')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{todaysSchedules.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#F05A29]" />
              {t('pt.dashboard.stats.active_clients', 'Active clients')}
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              {t('pt.dashboard.stats.active_clients_helper', 'Assigned to you')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{loading ? '—' : totalCustomers}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              {t('pt.dashboard.stats.at_risk', 'At risk / expiring')}
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              {t('pt.dashboard.stats.at_risk_helper', 'Low sessions or soon expiring')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{customerStats.expiringSoon}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#F05A29]" />
              {t('pt.dashboard.stats.sessions_remaining', 'Sessions remaining')}
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              {t('pt.dashboard.stats.sessions_remaining_helper', 'Across active packages')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{sessionsRemaining}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 shadow-sm">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#F05A29]" />
                {t('pt.dashboard.upcoming.title', 'Upcoming sessions')}
              </CardTitle>
              <CardDescription>{t('pt.dashboard.upcoming.subtitle', 'Next 7 days')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-full border border-gray-200 overflow-hidden">
                <Button
                  variant={upcomingFilter === 'today' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setUpcomingFilter('today')}
                >
                  {t('pt.dashboard.upcoming.filter_today', 'Today')}
                </Button>
                <Button
                  variant={upcomingFilter === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setUpcomingFilter('week')}
                >
                  {t('pt.dashboard.upcoming.filter_week', 'Next 7 days')}
                </Button>
              </div>
              <Button variant="outline" onClick={() => navigate('/manage/pt/calendar')}>
                {t('pt.dashboard.upcoming.view_all', 'View calendar')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {schedulesError ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{t('pt.dashboard.error.schedules', 'Unable to load schedules')}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={handleRefresh}>
                  {t('pt.dashboard.refresh', 'Refresh')}
                </Button>
              </div>
            ) : filteredUpcoming.length === 0 ? (
              <p className="text-sm text-gray-500">{t('pt.dashboard.upcoming.empty', 'No sessions scheduled yet.')}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredUpcoming.map((schedule) => {
                  const status = getStatusStyles(schedule.status);
                  return (
                    <div
                      key={schedule._id}
                      className="p-4 rounded-2xl border border-gray-200 hover:border-[#F05A29] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">{formatScheduleLabel(schedule)}</p>
                          <p className="font-semibold text-gray-900">
                            {schedule.name || t('pt.dashboard.session_default', '1-1 Session')}
                          </p>
                          <p className="text-xs text-gray-500">{schedule.branchId?.branchName || branchName}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={status.className} variant="outline">
                            {status.label}
                          </Badge>
                          <Badge className="bg-[#F05A29] bg-opacity-10 text-[#F05A29] border-0">
                            {schedule.timeRange?.startTime?.slice(0, 5)} - {schedule.timeRange?.endTime?.slice(0, 5)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm h-full xl:max-w-lg xl:ml-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#F05A29]" />
                {t('pt.dashboard.kpi.title', 'My KPI')}
              </CardTitle>
              {activeKPI && (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  {t('pt.dashboard.kpi.status.on_track', 'On track')}
                </Badge>
              )}
            </div>
            <CardDescription className="flex flex-wrap items-center gap-2">
              <span>
                {activeKPI
                  ? `${new Date(activeKPI.config.startDate).toLocaleDateString('vi-VN')} - ${new Date(
                      activeKPI.config.endDate
                    ).toLocaleDateString('vi-VN')}`
                  : t('pt.dashboard.kpi.empty', 'No KPI assigned yet')}
              </span>
              {activeKPI && (
                <Badge variant="outline" className="text-xs">
                  {t('pt.dashboard.kpi.period_badge', 'Current period')}
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 pb-4">
            {kpiLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : activeKPI ? (
              <>
                <div className="flex items-center justify-between text-sm font-medium text-gray-800">
                  <span>{t('pt.dashboard.kpi.sessions', 'PT sessions')}</span>
                  <span>
                    {kpiSessionActual}/{kpiSessionTarget}
                  </span>
                </div>
                <Progress value={kpiSessionProgress} className="h-2" />
                <div className="flex items-center justify-between text-sm font-medium text-gray-800">
                  <span>{t('pt.dashboard.kpi.revenue', 'Revenue')}</span>
                  <span>
                    {kpiRevenueActual.toLocaleString('vi-VN')} / {kpiRevenueTarget.toLocaleString('vi-VN')}
                  </span>
                </div>
                <Progress value={kpiRevenueProgress} className="h-2" />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
                    <p className="text-gray-500">{t('pt.dashboard.kpi.sessions_label', 'Sessions progress')}</p>
                    <p className="text-sm font-semibold text-gray-900">{Math.round(kpiSessionProgress)}%</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
                    <p className="text-gray-500">{t('pt.dashboard.kpi.revenue_label', 'Revenue progress')}</p>
                    <p className="text-sm font-semibold text-gray-900">{Math.round(kpiRevenueProgress)}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {t('pt.dashboard.kpi.reward', 'Rewards auto-calculate from KPI achievements')}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">{t('pt.dashboard.kpi.empty', 'No KPI assigned yet')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#F05A29]" />
                {t('pt.dashboard.clients.title', 'Clients needing attention')}
              </CardTitle>
              <CardDescription>
                {t('pt.dashboard.clients.subtitle', 'Expiring packages or low sessions')}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/manage/pt/clients')}>
              {t('pt.dashboard.clients.view_all', 'View clients')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {customersError ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{t('pt.dashboard.error.customers', 'Unable to load customers')}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={handleRefresh}>
                  {t('pt.dashboard.refresh', 'Refresh')}
                </Button>
              </div>
            ) : atRiskCustomers.length === 0 ? (
              <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-gray-800">
                      {t('pt.dashboard.clients.empty', 'All clients look healthy!')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('pt.dashboard.clients.subtitle', 'Expiring packages or low sessions')}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate('/manage/pt/clients')}>
                  {t('pt.dashboard.clients.view_all', 'View clients')}
                </Button>
              </div>
            ) : (
              atRiskCustomers.map((item) => {
                const { customer, urgency, remainingDays, progress } = item;
                return (
                  <div
                    key={customer._id}
                    className="p-4 rounded-2xl border border-gray-200 hover:border-[#F05A29] transition-colors flex items-center gap-3"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={customer.avatar} alt={customer.fullName} />
                      <AvatarFallback>{customer.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 truncate">{customer.fullName}</p>
                        <Badge
                          className={`${
                            urgency === 'urgent'
                              ? 'bg-[#F05A29] bg-opacity-10 text-[#F05A29]'
                              : urgency === 'expired'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                          } border-0`}
                        >
                          {urgency === 'urgent'
                            ? t('pt.dashboard.clients.badge_urgent', 'Expiring')
                            : urgency === 'expired'
                              ? t('pt.dashboard.clients.badge_expired', 'Expired')
                              : t('pt.dashboard.clients.badge_pending', 'Pending')}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {customer.package.sessionsRemaining} {t('pt.dashboard.clients.sessions_left', 'sessions')} •{' '}
                        {t('pt.dashboard.clients.days_left', '{{count}} days left', { count: remainingDays })}
                      </p>
                      <Progress value={progress} className="h-2 mt-2" />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#F05A29]" />
                {t('pt.dashboard.progress.title', 'Latest progress updates')}
              </CardTitle>
              <CardDescription>
                {t('pt.dashboard.progress.subtitle', 'Recent measurements from your clients')}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/manage/pt/clients')}>
              {t('pt.dashboard.progress.view_all', 'Log new progress')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {progressError ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{t('pt.dashboard.progress.error', 'Unable to load progress right now.')}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={handleRefresh}>
                  {t('pt.dashboard.refresh', 'Refresh')}
                </Button>
              </div>
            ) : recentProgress.length === 0 ? (
              <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-[#F05A29]" />
                  <div>
                    <p className="font-semibold text-gray-800">
                      {t('pt.dashboard.progress.empty', 'No progress entries yet')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('pt.dashboard.progress.subtitle', 'Recent measurements from your clients')}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate('/manage/pt/clients')}>
                  {t('pt.dashboard.progress.view_all', 'Log new progress')}
                </Button>
              </div>
            ) : (
              recentProgress.map((record) => (
                <div
                  key={record._id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-gray-200 hover:border-[#F05A29] transition-colors"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{record.customerName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(record.trackingDate).toLocaleDateString('vi-VN')} • BMI {record.bmi?.toFixed(1) || '--'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1 text-gray-700">
                      <Dumbbell className="w-4 h-4 text-[#F05A29]" />
                      {record.strength || '--'}
                    </div>
                    <div className="flex items-center gap-1 text-gray-700">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      {record.weight ? `${record.weight} kg` : '--'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PTDashboard;
