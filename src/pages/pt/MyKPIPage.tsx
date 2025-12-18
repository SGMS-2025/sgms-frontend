import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthState } from '@/hooks/useAuth';
import { useMyKPI } from '@/hooks/useKPI';
import { KPIDetailModal } from '@/components/kpi/KPIDetailModal';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/utils';
import { formatCurrency, formatNumber } from '@/utils/currency';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CircleAlert,
  DollarSign,
  MapPin,
  RefreshCw,
  Search,
  Target
} from 'lucide-react';
import type { KPIConfigWithAchievement, KPIActual, KPITargets } from '@/types/api/KPI';

const getTargetsAndActuals = (kpiData: KPIConfigWithAchievement): { targets: KPITargets; actual: KPIActual } => {
  const targets: KPITargets = kpiData.config.targets || { revenue: 0, newMembers: 0, ptSessions: 0, contracts: 0 };
  const actual: KPIActual = kpiData.achievement?.actual || {
    revenue: { total: 0, newMember: 0, ptSession: 0, vipRevenue: 0 },
    members: { newMembers: 0, vipNewMembers: 0 },
    sessions: { ptSessions: 0, vipPtSessions: 0 },
    contracts: { total: 0 }
  };
  return { targets, actual };
};

const isKPIAtRisk = (kpiData: KPIConfigWithAchievement) => {
  const status = kpiData.achievement?.status || 'IN_PROGRESS';
  if (status !== 'IN_PROGRESS') return false;

  const { targets, actual } = getTargetsAndActuals(kpiData);
  const hasTargets = targets.revenue > 0 || targets.newMembers > 0 || targets.ptSessions > 0 || targets.contracts > 0;
  if (!hasTargets) return false;

  const checks = {
    revenue: !targets.revenue || (actual.revenue.total || 0) >= targets.revenue,
    newMembers: !targets.newMembers || (actual.members.newMembers || 0) >= targets.newMembers,
    ptSessions: !targets.ptSessions || (actual.sessions.ptSessions || 0) >= targets.ptSessions,
    contracts: !targets.contracts || (actual.contracts.total || 0) >= targets.contracts
  };

  return !Object.values(checks).every(Boolean);
};

const getBranchName = (kpiData: KPIConfigWithAchievement) =>
  typeof kpiData.config.branchId === 'object' && kpiData.config.branchId?.branchName
    ? kpiData.config.branchId.branchName
    : 'N/A';

const getPeriodLabel = (kpiData: KPIConfigWithAchievement) => {
  const start = new Date(kpiData.config.startDate).toLocaleDateString('vi-VN');
  const end = new Date(kpiData.config.endDate).toLocaleDateString('vi-VN');
  return `${start} - ${end}`;
};

const getDaysRemaining = (kpiData: KPIConfigWithAchievement) => {
  const endDate = new Date(kpiData.config.endDate);
  const today = new Date();
  const diff = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
};

const getStatusMeta = (kpiData: KPIConfigWithAchievement) => {
  const status = kpiData.achievement?.status || 'IN_PROGRESS';
  if (status === 'ACHIEVED') {
    return {
      key: 'achieved' as const,
      labelKey: 'kpi.status.achieved',
      labelFallback: 'Đã đạt',
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700'
    };
  }
  if (status === 'FAILED') {
    return {
      key: 'failed' as const,
      labelKey: 'kpi.status.failed',
      labelFallback: 'Không đạt',
      badgeClass: 'border-red-200 bg-red-50 text-red-700'
    };
  }
  if (isKPIAtRisk(kpiData)) {
    return {
      key: 'at_risk' as const,
      labelKey: 'kpi.status.at_risk',
      labelFallback: 'Cần chú ý',
      badgeClass: 'border-orange-200 bg-orange-50 text-orange-700'
    };
  }
  return {
    key: 'in_progress' as const,
    labelKey: 'kpi.status.in_progress',
    labelFallback: 'Đang thực hiện',
    badgeClass: 'border-blue-200 bg-blue-50 text-blue-700'
  };
};

const MyKPIPage: React.FC = () => {
  const { t } = useTranslation();
  const { isLoading } = useAuthState();
  const { myKPIs, loading, error, refetch } = useMyKPI();
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'achieved' | 'failed' | 'at_risk'>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'end_desc' | 'end_asc' | 'start_desc'>('end_desc');
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const summary = useMemo(() => {
    const total = myKPIs.length;
    const achieved = myKPIs.filter((k) => (k.achievement?.status || 'IN_PROGRESS') === 'ACHIEVED').length;
    const failed = myKPIs.filter((k) => (k.achievement?.status || 'IN_PROGRESS') === 'FAILED').length;
    const inProgress = myKPIs.filter((k) => (k.achievement?.status || 'IN_PROGRESS') === 'IN_PROGRESS').length;
    const atRisk = myKPIs.filter((k) => isKPIAtRisk(k)).length;
    const totalEarnings = myKPIs.reduce(
      (acc, k) => acc + (k.achievement?.commission?.amount || 0) + (k.achievement?.reward?.amount || 0),
      0
    );
    return { total, achieved, failed, inProgress, atRisk, totalEarnings };
  }, [myKPIs]);

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();

    const byStatus = myKPIs.filter((kpiData) => {
      const status = kpiData.achievement?.status || 'IN_PROGRESS';
      if (statusFilter === 'achieved') return status === 'ACHIEVED';
      if (statusFilter === 'failed') return status === 'FAILED';
      if (statusFilter === 'in_progress') return status === 'IN_PROGRESS';
      if (statusFilter === 'at_risk') return isKPIAtRisk(kpiData);
      return true;
    });

    const bySearch = q
      ? byStatus.filter((kpiData) => {
          const branchName = getBranchName(kpiData);
          const period = getPeriodLabel(kpiData);
          return `${branchName} ${period}`.toLowerCase().includes(q);
        })
      : byStatus;

    const sorter = (a: KPIConfigWithAchievement, b: KPIConfigWithAchievement) => {
      const endA = new Date(a.config.endDate).getTime();
      const endB = new Date(b.config.endDate).getTime();
      const startA = new Date(a.config.startDate).getTime();
      const startB = new Date(b.config.startDate).getTime();

      if (sort === 'end_asc') return endA - endB;
      if (sort === 'start_desc') return startB - startA;
      return endB - endA;
    };

    return [...bySearch].sort(sorter);
  }, [myKPIs, search, sort, statusFilter]);

  const selectedKPI = useMemo(
    () => (selectedKpiId ? filteredAndSorted.find((k) => k.config._id === selectedKpiId) : filteredAndSorted[0]),
    [filteredAndSorted, selectedKpiId]
  );

  useEffect(() => {
    if (!selectedKpiId && filteredAndSorted.length > 0) {
      setSelectedKpiId(filteredAndSorted[0].config._id);
      return;
    }

    if (selectedKpiId && filteredAndSorted.length > 0) {
      const stillExists = filteredAndSorted.some((k) => k.config._id === selectedKpiId);
      if (!stillExists) setSelectedKpiId(filteredAndSorted[0].config._id);
    }
  }, [filteredAndSorted, selectedKpiId]);

  if (isLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
          <p className="mt-4 text-muted-foreground">{t('common.loading', 'Đang tải...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {t('common.error', 'Có lỗi xảy ra')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex items-center gap-2">
              <Button onClick={refetch}>
                <RefreshCw className="h-4 w-4" />
                {t('common.retry', 'Thử lại')}
              </Button>
              <Button variant="outline" onClick={() => window.history.back()}>
                {t('common.back', 'Quay lại')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (myKPIs.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              {t('kpi.my_kpi.page_title', 'KPI cá nhân')}
            </CardTitle>
            <CardDescription>{t('kpi.no_kpi_assigned', 'Bạn chưa có KPI nào được gán')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
              {t('common.refresh', 'Làm mới')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 via-background to-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{t('kpi.my_kpi.page_title', 'KPI cá nhân')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('kpi.my_kpi.page_subtitle', 'Theo dõi mục tiêu và hiệu suất theo từng kỳ KPI.')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
              {t('common.refresh', 'Làm mới')}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">{t('common.total', 'Tổng')}</div>
                  <div className="text-2xl font-semibold">{summary.total}</div>
                </div>
                <div className="rounded-lg border bg-background p-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">{t('kpi.status.achieved', 'Đã đạt')}</div>
                  <div className="text-2xl font-semibold">{summary.achieved}</div>
                </div>
                <div className="rounded-lg border bg-background p-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">{t('kpi.status.at_risk', 'Cần chú ý')}</div>
                  <div className="text-2xl font-semibold">{summary.atRisk}</div>
                </div>
                <div className="rounded-lg border bg-background p-2">
                  <CircleAlert className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">{t('kpi.earnings.total', 'Tổng thu nhập')}</div>
                  <div className="text-2xl font-semibold">{formatCurrency(summary.totalEarnings)}</div>
                </div>
                <div className="rounded-lg border bg-background p-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          {/* Left: KPI list */}
          <Card className="lg:col-span-4 h-full">
            <CardHeader>
              <CardTitle>{t('kpi.periods', 'Kỳ KPI')}</CardTitle>
              <CardDescription>{t('kpi.periods_hint', 'Chọn một kỳ để xem chi tiết')}</CardDescription>
              <CardAction>
                <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder={t('common.sort', 'Sắp xếp')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="end_desc">{t('kpi.sort.end_desc', 'Kết thúc: mới nhất')}</SelectItem>
                    <SelectItem value="end_asc">{t('kpi.sort.end_asc', 'Kết thúc: sớm nhất')}</SelectItem>
                    <SelectItem value="start_desc">{t('kpi.sort.start_desc', 'Bắt đầu: mới nhất')}</SelectItem>
                  </SelectContent>
                </Select>
              </CardAction>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('kpi.search_placeholder', 'Tìm theo chi nhánh hoặc kỳ...')}
                  className="pl-9"
                />
              </div>

              <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <TabsList className="w-full">
                  <TabsTrigger value="all" className="flex-1">
                    {t('common.all', 'Tất cả')}
                  </TabsTrigger>
                  <TabsTrigger value="in_progress" className="flex-1">
                    {t('kpi.status.in_progress', 'Đang')}
                  </TabsTrigger>
                  <TabsTrigger value="achieved" className="flex-1">
                    {t('kpi.status.achieved', 'Đạt')}
                  </TabsTrigger>
                  <TabsTrigger value="at_risk" className="flex-1">
                    {t('kpi.status.at_risk', 'Rủi ro')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Separator />

              <ScrollArea className="min-h-0 flex-1 pr-2">
                <div className="space-y-2">
                  {filteredAndSorted.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className="font-medium">{t('common.no_results', 'Không có kết quả')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('common.try_different_filters', 'Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.')}
                      </p>
                    </div>
                  ) : (
                    filteredAndSorted.map((kpiData) => {
                      const isActive = kpiData.config._id === selectedKpiId;
                      const statusMeta = getStatusMeta(kpiData);
                      const branchName = getBranchName(kpiData);
                      const period = getPeriodLabel(kpiData);
                      const daysRemaining = getDaysRemaining(kpiData);
                      const { targets, actual } = getTargetsAndActuals(kpiData);
                      const revenueProgress =
                        targets.revenue > 0 ? Math.min(100, ((actual.revenue.total || 0) / targets.revenue) * 100) : 0;

                      const earned =
                        (kpiData.achievement?.commission?.amount || 0) + (kpiData.achievement?.reward?.amount || 0);

                      return (
                        <button
                          key={kpiData.config._id}
                          type="button"
                          onClick={() => setSelectedKpiId(kpiData.config._id)}
                          className={cn(
                            'w-full rounded-lg border p-3 text-left transition-colors',
                            isActive ? 'border-orange-200 bg-orange-500/5' : 'hover:bg-muted/40'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate font-medium">{branchName}</div>
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                <span className="truncate">{period}</span>
                              </div>
                            </div>
                            <Badge variant="outline" className={cn('shrink-0', statusMeta.badgeClass)}>
                              {t(statusMeta.labelKey, statusMeta.labelFallback)}
                            </Badge>
                          </div>

                          <div className="mt-3 space-y-2">
                            {targets.revenue > 0 && (
                              <div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{t('kpi.metrics.total_revenue', 'Doanh thu')}</span>
                                  <span>{revenueProgress.toFixed(0)}%</span>
                                </div>
                                <Progress value={revenueProgress} className="mt-1 h-1.5" />
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                {daysRemaining > 0
                                  ? t('kpi.days_remaining', 'Còn {days} ngày', { days: daysRemaining })
                                  : t('kpi.period_ended', 'Đã kết thúc')}
                              </span>
                              <span className="font-medium text-foreground">{formatCurrency(earned)}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right: details */}
          <Card className="lg:col-span-8 h-full">
            {selectedKPI ? (
              <>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {getBranchName(selectedKPI)}
                    </span>
                    <span className="text-muted-foreground/60">•</span>
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {getPeriodLabel(selectedKPI)}
                    </span>
                  </CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={cn(getStatusMeta(selectedKPI).badgeClass)}>
                      {t(getStatusMeta(selectedKPI).labelKey, getStatusMeta(selectedKPI).labelFallback)}
                    </Badge>
                    {getDaysRemaining(selectedKPI) > 0 ? (
                      <span>{t('kpi.days_remaining', 'Còn {days} ngày', { days: getDaysRemaining(selectedKPI) })}</span>
                    ) : (
                      <span>{t('kpi.period_ended', 'Đã kết thúc')}</span>
                    )}
                  </CardDescription>
                  <CardAction className="flex items-center gap-2">
                    <Button onClick={() => setDetailOpen(true)}>{t('kpi.actions.view_detail', 'Xem chi tiết')}</Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(() => {
                    const { targets, actual } = getTargetsAndActuals(selectedKPI);
                    const revenueProgress =
                      targets.revenue > 0 ? Math.min(100, ((actual.revenue.total || 0) / targets.revenue) * 100) : 0;
                    const ptSessionsProgress =
                      targets.ptSessions > 0
                        ? Math.min(100, ((actual.sessions.ptSessions || 0) / targets.ptSessions) * 100)
                        : 0;

                    const commission = selectedKPI.achievement?.commission?.amount || 0;
                    const reward = selectedKPI.achievement?.reward?.amount || 0;
                    const totalEarnings = commission + reward;

                    const revenueGap =
                      targets.revenue > 0 ? Math.max(0, targets.revenue - (actual.revenue.total || 0)) : 0;

                    return (
                      <>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Card className="shadow-none">
                            <CardContent className="pt-6 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-orange-600" />
                                  <div className="font-medium">{t('kpi.metrics.total_revenue', 'Doanh thu')}</div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {targets.revenue > 0
                                    ? t('kpi.target', 'Mục tiêu') + ': ' + formatCurrency(targets.revenue)
                                    : t('kpi.no_target', 'Không có mục tiêu')}
                                </div>
                              </div>
                              <div className="text-2xl font-semibold">{formatCurrency(actual.revenue.total || 0)}</div>
                              {targets.revenue > 0 && (
                                <>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{t('kpi.progress', 'Tiến độ')}</span>
                                    <span>{revenueProgress.toFixed(1)}%</span>
                                  </div>
                                  <Progress value={revenueProgress} className="h-2" />
                                  {revenueGap > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      {t('kpi.remaining_to_target', 'Còn lại')}: {formatCurrency(revenueGap)}
                                    </div>
                                  )}
                                </>
                              )}
                            </CardContent>
                          </Card>

                          <Card className="shadow-none">
                            <CardContent className="pt-6 space-y-2">
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-blue-600" />
                                <div className="font-medium">{t('kpi.metrics.pt_sessions', 'Buổi PT')}</div>
                              </div>
                              <div className="text-2xl font-semibold">
                                {formatNumber(actual.sessions.ptSessions || 0)}
                              </div>
                              {targets.ptSessions > 0 && (
                                <>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{t('kpi.progress', 'Tiến độ')}</span>
                                    <span>{ptSessionsProgress.toFixed(1)}%</span>
                                  </div>
                                  <Progress value={ptSessionsProgress} className="h-2" />
                                  <div className="text-xs text-muted-foreground">
                                    {t('kpi.target', 'Mục tiêu')}: {formatNumber(targets.ptSessions)}
                                  </div>
                                </>
                              )}
                            </CardContent>
                          </Card>
                        </div>

                        <Separator />

                        <div className="grid gap-4 sm:grid-cols-3">
                          <Card className="shadow-none">
                            <CardContent className="pt-6">
                              <div className="text-sm text-muted-foreground">
                                {t('kpi.earnings.commission', 'Hoa hồng')}
                              </div>
                              <div className="mt-1 text-xl font-semibold">{formatCurrency(commission)}</div>
                            </CardContent>
                          </Card>
                          <Card className="shadow-none">
                            <CardContent className="pt-6">
                              <div className="text-sm text-muted-foreground">{t('kpi.earnings.reward', 'Thưởng')}</div>
                              <div className="mt-1 text-xl font-semibold">{formatCurrency(reward)}</div>
                            </CardContent>
                          </Card>
                          <Card className="shadow-none border-orange-200/60 bg-orange-500/5">
                            <CardContent className="pt-6">
                              <div className="text-sm text-muted-foreground">{t('kpi.earnings.total', 'Tổng')}</div>
                              <div className="mt-1 text-xl font-semibold text-orange-700 dark:text-orange-300">
                                {formatCurrency(totalEarnings)}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </>
            ) : (
              <CardContent className="py-12 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border bg-background">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="font-medium">{t('kpi.select_period', 'Chọn một kỳ KPI để xem chi tiết')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('kpi.select_period_hint', 'Danh sách kỳ KPI nằm bên trái.')}
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      <KPIDetailModal
        kpiId={selectedKPI?.config._id || null}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
};

export default MyKPIPage;
