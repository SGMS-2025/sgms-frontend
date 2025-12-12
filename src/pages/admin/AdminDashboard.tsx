import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  Crown,
  Banknote,
  Sparkles,
  AlertCircle,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { businessVerificationApi } from '@/services/api/businessVerificationApi';
import { userApi } from '@/services/api/userApi';
import { branchApi } from '@/services/api/branchApi';
import { dashboardApi } from '@/services/api/dashboardApi';
import { subscriptionApi } from '@/services/api/subscriptionApi';
import { formatCurrency } from '@/utils/currency';
import { Area, AreaChart, Bar, BarChart, XAxis } from 'recharts';

interface DashboardStats {
  totalUsers: number;
  totalVerifications: number;
  pendingVerifications: number;
  approvedVerifications: number;
  rejectedVerifications: number;
  recentActivity: Array<{
    id: string;
    type: 'verification_submitted' | 'verification_approved' | 'verification_rejected';
    userName: string;
    businessName: string;
    timestamp: string;
  }>;
}

interface OwnerIntelligence {
  owners: number;
  activeBranches: number;
  totalBranches: number;
  totalRevenue: number;
  currentRevenue: number;
  revenueGrowth: number;
  periodLabel: string;
}

interface RevenuePoint {
  month: string;
  desktop: number;
  mobile: number;
}

interface TrendPoint {
  period: string;
  value: number;
}

interface SubscriptionAnalytics {
  topPackages: Array<{
    packageId: string;
    packageName: string;
    isTrial?: boolean;
    tier?: number;
    totalPurchases: number;
    activeSubscriptions: number;
    totalRevenue: number;
    userCount?: number;
  }>;
  trialUsers: {
    active: number;
    total: number;
    totalSubscriptions: number;
  };
  summary?: {
    totalRevenue: number;
    currentMonthRevenue?: number;
  };
}

const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalVerifications: 0,
    pendingVerifications: 0,
    approvedVerifications: 0,
    rejectedVerifications: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [ownerIntel, setOwnerIntel] = useState<OwnerIntelligence>({
    owners: 0,
    activeBranches: 0,
    totalBranches: 0,
    totalRevenue: 0,
    currentRevenue: 0,
    revenueGrowth: 0,
    periodLabel: ''
  });
  const [ownerIntelLoading, setOwnerIntelLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [chartsUpdatedAt, setChartsUpdatedAt] = useState<string | null>(null);
  const [subscriptionAnalytics, setSubscriptionAnalytics] = useState<SubscriptionAnalytics | null>(null);
  const [subscriptionAnalyticsLoading, setSubscriptionAnalyticsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    fetchOwnerIntel();
    fetchCharts();
    fetchSubscriptionAnalytics();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);

    // Fetch verification statistics
    const statsResult = await businessVerificationApi.getStatistics();

    if (statsResult.success && statsResult.data) {
      setStats({
        totalUsers: 0, // TODO: Fetch from users API
        totalVerifications: statsResult.data.total || 0,
        pendingVerifications: statsResult.data.pending || 0,
        approvedVerifications: statsResult.data.approved || 0,
        rejectedVerifications: statsResult.data.rejected || 0,
        recentActivity: [] // TODO: Fetch recent activity
      });
    }

    setLoading(false);
  };

  const fetchOwnerIntel = async () => {
    setOwnerIntelLoading(true);
    const periodLabel = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(new Date());

    try {
      const [ownersRes, activeBranchesRes, allBranchesRes, revenueRes] = await Promise.all([
        userApi.getAccountsList({ role: 'OWNER', page: 1, limit: 1 }).catch(() => null),
        branchApi.getBranches({ isActive: true, page: 1, limit: 1 }).catch(() => null),
        branchApi.getBranches({ page: 1, limit: 1 }).catch(() => null),
        dashboardApi.getDashboardSummary({ period: 'month' }).catch(() => null)
      ]);

      const owners = ownersRes && ownersRes.success && ownersRes.data?.pagination ? ownersRes.data.pagination.total : 0;
      const activeBranches =
        activeBranchesRes && activeBranchesRes.success && activeBranchesRes.data?.pagination
          ? activeBranchesRes.data.pagination.total
          : 0;
      const totalBranches =
        allBranchesRes && allBranchesRes.success && allBranchesRes.data?.pagination
          ? allBranchesRes.data.pagination.total
          : activeBranches;
      const revenueData = revenueRes && revenueRes.success ? revenueRes.data : null;

      setOwnerIntel({
        owners,
        activeBranches,
        totalBranches,
        totalRevenue: revenueData?.totalRevenue ?? revenueData?.periodRevenue ?? 0,
        currentRevenue: revenueData?.periodRevenue ?? 0,
        revenueGrowth: revenueData?.revenueGrowth ?? 0,
        periodLabel
      });
    } catch (error) {
      console.error('Failed to fetch owner intelligence metrics', error);
      toast.error(
        t('admin.dashboard.error.owner_intel', 'Không lấy được dữ liệu chủ phòng gym/chi nhánh. Thử lại sau.')
      );
      setOwnerIntel((prev) => ({
        ...prev,
        owners: 0,
        activeBranches: 0,
        totalBranches: 0,
        totalRevenue: 0,
        currentRevenue: 0,
        revenueGrowth: 0,
        periodLabel
      }));
    } finally {
      setOwnerIntelLoading(false);
      setLastUpdated(
        new Intl.DateTimeFormat('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit'
        }).format(new Date())
      );
    }
  };

  const handleRefresh = () => {
    fetchDashboardStats();
    fetchOwnerIntel();
    fetchCharts();
    fetchSubscriptionAnalytics();
  };

  const activationRate =
    ownerIntel.totalBranches > 0 ? Math.round((ownerIntel.activeBranches / ownerIntel.totalBranches) * 100) : 0;
  const totalVerificationRequests =
    stats.totalVerifications || stats.pendingVerifications + stats.approvedVerifications + stats.rejectedVerifications;

  const getShare = (value: number) => {
    if (!totalVerificationRequests) return '0%';
    return `${Math.round((value / totalVerificationRequests) * 100)}%`;
  };

  const fetchCharts = async () => {
    setChartLoading(true);
    try {
      const [revenueRes, trendRes] = await Promise.all([
        dashboardApi.getRevenueChart({ groupBy: 'month', source: 'subscription' }).catch(() => null),
        dashboardApi
          .getTrends({
            type: 'owners',
            interval: 'month',
            year: new Date().getFullYear()
          })
          .catch(() => null)
      ]);

      if (revenueRes?.success && revenueRes.data?.data) {
        const normalized = revenueRes.data.data.map((item) => ({
          month: item.month,
          desktop: Number(item.desktop) || 0,
          mobile: 0
        }));
        setRevenueData(normalized);
      } else {
        setRevenueData([]);
      }

      if (trendRes?.success && trendRes.data?.data) {
        const normalizedTrend = trendRes.data.data.map((item) => ({
          period: item.period,
          value: Number(item.value) || 0
        }));
        setTrendData(normalizedTrend);
      } else {
        setTrendData([]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard charts', error);
      toast.error(t('admin.dashboard.error.charts', 'Không lấy được dữ liệu biểu đồ. Vui lòng thử lại.'));
      setRevenueData([]);
      setTrendData([]);
    } finally {
      setChartLoading(false);
      setChartsUpdatedAt(
        new Intl.DateTimeFormat('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit'
        }).format(new Date())
      );
    }
  };

  const fetchSubscriptionAnalytics = async () => {
    setSubscriptionAnalyticsLoading(true);
    try {
      const res = await subscriptionApi.getSubscriptionAnalytics();
      if (res.success && res.data) {
        setSubscriptionAnalytics(res.data);
      } else {
        setSubscriptionAnalytics(null);
        toast.error(res.message || t('admin.dashboard.error.subscription_analytics', 'Không lấy được dữ liệu gói'));
      }
    } catch (error) {
      console.error('Failed to fetch subscription analytics', error);
      setSubscriptionAnalytics(null);
      toast.error(t('admin.dashboard.error.subscription_analytics', 'Không lấy được dữ liệu gói'));
    } finally {
      setSubscriptionAnalyticsLoading(false);
    }
  };

  const revenueChartConfig = {
    desktop: {
      label: t('admin.dashboard.subscriptions.revenue', 'Doanh thu subscription'),
      color: 'var(--chart-1)'
    }
  };

  const trendChartConfig = {
    owners: {
      label: t('admin.dashboard.trends.owners', 'Chủ phòng gym mới'),
      color: 'var(--chart-3)'
    }
  };

  const trendChartData = trendData.map((item) => ({
    label: item.period,
    owners: item.value
  }));

  const hasRevenueData = revenueData.length > 0;
  const hasTrendData = trendChartData.length > 0;
  const topPackages = subscriptionAnalytics?.topPackages || [];
  const topPackage = topPackages[0];
  const topPackagesDisplay = topPackages.slice(0, 3);
  const trialUsers = subscriptionAnalytics?.trialUsers;
  const trialActiveCount = trialUsers?.active ?? 0;
  const trialTotalUsers = trialUsers?.total ?? 0;
  const trialTotalSubscriptions = trialUsers?.totalSubscriptions ?? 0;
  const trialActiveRate = trialTotalUsers > 0 ? Math.round((trialActiveCount / trialTotalUsers) * 100) : 0;
  const subscriptionSummary = subscriptionAnalytics?.summary;

  const insights: Array<{ title: string; tone: 'warn' | 'ok' | 'info'; detail: string }> = [];
  if (stats.pendingVerifications > 0) {
    insights.push({
      title: t('admin.dashboard.insights.pending', 'Hồ sơ đang chờ duyệt'),
      tone: 'warn',
      detail: t('admin.dashboard.insights.pending_detail', 'Ưu tiên xử lý để tránh nghẽn onboarding')
    });
  }
  if (ownerIntel.revenueGrowth < 0) {
    insights.push({
      title: t('admin.dashboard.insights.revenue_down', 'Doanh thu kỳ này giảm'),
      tone: 'warn',
      detail: t('admin.dashboard.insights.revenue_down_detail', 'Kiểm tra các chi nhánh doanh thu thấp')
    });
  }
  if (activationRate < 60 && ownerIntel.totalBranches > 0) {
    insights.push({
      title: t('admin.dashboard.insights.branch_activation', 'Tỉ lệ chi nhánh hoạt động thấp'),
      tone: 'info',
      detail: t('admin.dashboard.insights.branch_activation_detail', 'Xem lại chi nhánh chưa active/suspended')
    });
  }
  if (!insights.length) {
    insights.push({
      title: t('admin.dashboard.insights.healthy', 'Hệ thống ổn định'),
      tone: 'ok',
      detail: t('admin.dashboard.insights.healthy_detail', 'Không có cảnh báo nổi bật')
    });
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.dashboard.title')}</h1>
            <p className="text-gray-500 mt-1">{t('admin.dashboard.subtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.dashboard.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.dashboard.description')}</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-500 hidden sm:inline">
              {t('common.updated_at', 'Cập nhật lúc')} {lastUpdated}
            </span>
          )}
          <Button onClick={handleRefresh} variant="outline">
            {t('admin.dashboard.refresh')}
          </Button>
        </div>
      </div>

      <Card className="border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-amber-50 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-600" />
                {t('admin.dashboard.owner_intel.title', 'Owner & Branch intelligence')}
              </CardTitle>
              <CardDescription>
                {t(
                  'admin.dashboard.owner_intel.subtitle',
                  'Theo dõi khách hàng là chủ phòng gym và sức khỏe mạng lưới chi nhánh'
                )}
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-white text-orange-700 border-orange-200">
              {ownerIntelLoading
                ? t('common.loading', 'Đang tải...')
                : ownerIntel.periodLabel || t('common.current_period', 'Kỳ hiện tại')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white shadow-sm border border-orange-100">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase text-gray-500">
                {t('admin.dashboard.owner_intel.owners', 'Chủ phòng gym')}
              </p>
              <Crown className="w-4 h-4 text-orange-500" />
            </div>
            <div className="mt-3 text-3xl font-bold text-gray-900">
              {ownerIntelLoading ? '...' : ownerIntel.owners.toLocaleString('vi-VN')}
            </div>
            <p className="text-sm text-gray-500">
              {t('admin.dashboard.owner_intel.owner_hint', 'Khách hàng doanh nghiệp đang dùng Gym Smart')}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-white shadow-sm border border-orange-100">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase text-gray-500">
                {t('admin.dashboard.owner_intel.branches', 'Chi nhánh hoạt động')}
              </p>
              <Building2 className="w-4 h-4 text-green-600" />
            </div>
            <div className="mt-3 text-3xl font-bold text-gray-900">
              {ownerIntelLoading
                ? '...'
                : `${ownerIntel.activeBranches.toLocaleString('vi-VN')}/${(
                    ownerIntel.totalBranches || ownerIntel.activeBranches
                  ).toLocaleString('vi-VN')}`}
            </div>
            <Progress value={ownerIntelLoading ? 0 : activationRate} className="mt-3 h-2 bg-orange-100" />
            <p className="text-sm text-gray-500 mt-2">
              {ownerIntelLoading
                ? t('common.loading', 'Đang tải...')
                : t('admin.dashboard.owner_intel.activation_rate', 'Tỉ lệ hoạt động') + ` ${activationRate}%`}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-white shadow-sm border border-orange-100">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase text-gray-500">
                {t('admin.dashboard.owner_intel.revenue', 'Doanh thu gói đăng ký')}
              </p>
              <Banknote className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3 text-3xl font-bold text-gray-900">
              {subscriptionAnalyticsLoading
                ? '...'
                : formatCurrency(subscriptionSummary?.totalRevenue ?? ownerIntel.totalRevenue)}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {subscriptionAnalyticsLoading
                ? t('common.loading', 'Đang tải...')
                : `${t('admin.dashboard.owner_intel.revenue_caption', 'Doanh thu tháng này')}: ${formatCurrency(
                    subscriptionSummary?.currentMonthRevenue ?? ownerIntel.currentRevenue
                  )}`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {t('admin.dashboard.charts.title', 'Hiệu suất kinh doanh')}
            </CardTitle>
            <CardDescription>
              {t('admin.dashboard.charts.subtitle', 'Theo dõi dòng tiền và tệp khách hàng toàn hệ thống')}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-white text-gray-700 border-gray-200">
            {chartLoading
              ? t('common.loading', 'Đang tải...')
              : chartsUpdatedAt
                ? `${t('common.updated_at', 'Cập nhật lúc')} ${chartsUpdatedAt}`
                : t('admin.dashboard.charts.live', 'Cập nhật theo kỳ')}
          </Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl border border-gray-100 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase text-gray-500">{t('admin.dashboard.charts.revenue', 'Doanh thu')}</p>
                <p className="text-sm text-gray-700">
                  {t('admin.dashboard.charts.revenue_hint', 'So sánh tiền mặt và chuyển khoản')}
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-orange-600" />
            </div>
            {chartLoading ? (
              <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">
                {t('common.loading', 'Đang tải...')}
              </div>
            ) : hasRevenueData ? (
              <ChartContainer config={revenueChartConfig} className="w-full" style={{ height: 260 }}>
                <BarChart data={revenueData} margin={{ left: -10, right: 10 }}>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        formatter={(value) => (typeof value === 'number' ? formatCurrency(value) : value)}
                        labelFormatter={(label) => label || t('common.na', 'N/A')}
                      />
                    }
                  />
                  <Bar dataKey="desktop" fill="var(--color-desktop)" radius={[6, 6, 0, 0]} />
                  <ChartLegend verticalAlign="bottom" content={<ChartLegendContent />} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[260px] flex flex-col items-center justify-center text-gray-500 text-sm border border-dashed border-gray-200 rounded-lg">
                <AlertCircle className="w-5 h-5 mb-2" />
                {t('admin.dashboard.charts.empty', 'Chưa có dữ liệu doanh thu')}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-gray-100 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase text-gray-500">
                  {t('admin.dashboard.charts.customers', 'Chủ phòng gym mới')}
                </p>
                <p className="text-sm text-gray-700">
                  {t('admin.dashboard.charts.customers_hint', 'Xu hướng đăng ký mới')}
                </p>
              </div>
            </div>
            {chartLoading ? (
              <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">
                {t('common.loading', 'Đang tải...')}
              </div>
            ) : hasTrendData ? (
              <ChartContainer config={trendChartConfig} className="w-full" style={{ height: 260 }}>
                <AreaChart data={trendChartData} margin={{ left: -10, right: 10 }}>
                  <defs>
                    <linearGradient id="customersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-customers)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-customers)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        formatter={(value) => (typeof value === 'number' ? value.toLocaleString('vi-VN') : value)}
                        labelFormatter={(label) => label || t('common.na', 'N/A')}
                      />
                    }
                  />
                  <Area
                    dataKey="owners"
                    type="monotone"
                    stroke="var(--color-customers)"
                    fill="url(#customersGradient)"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 1.5 }}
                    activeDot={{ r: 5 }}
                  />
                  <ChartLegend verticalAlign="bottom" content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[260px] flex flex-col items-center justify-center text-gray-500 text-sm border border-dashed border-gray-200 rounded-lg">
                <AlertCircle className="w-5 h-5 mb-2" />
                {t('admin.dashboard.charts.customers_empty', 'Chưa có dữ liệu khách hàng mới')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {t('admin.dashboard.subscriptions.title', 'Gói đăng ký & Trial')}
            </CardTitle>
            <CardDescription>
              {t('admin.dashboard.subscriptions.subtitle', 'Gói được mua nhiều và người dùng gói thử')}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-white text-gray-700 border-gray-200">
            {subscriptionAnalyticsLoading
              ? t('common.loading', 'Đang tải...')
              : `${t('admin.dashboard.subscriptions.top', 'Top')} ${topPackages.length || 0}`}
          </Badge>
        </CardHeader>
        <CardContent>
          {subscriptionAnalyticsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="p-5 rounded-2xl border border-gray-100 bg-white animate-pulse space-y-3 shadow-sm"
                >
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-600" />
                    <div className="text-sm text-gray-600">
                      {t('admin.dashboard.subscriptions.trial_users', 'Người dùng trial')}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-white text-gray-800 border-amber-200">
                    {trialActiveRate}% {t('admin.dashboard.subscriptions.active_rate', 'hoạt động')}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-gray-900">{trialActiveCount}</div>
                  <div className="text-sm text-gray-600">
                    {t('admin.dashboard.subscriptions.trial_active', 'Đang hoạt động')}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{t('admin.dashboard.subscriptions.trial_total', 'Tổng user từng dùng trial')}</span>
                    <span className="font-semibold text-gray-900">{trialTotalUsers}</span>
                  </div>
                  <Progress value={Math.min(trialActiveRate, 100)} className="h-2 bg-orange-100" />
                  <div className="flex flex-wrap gap-2 pt-1 text-sm">
                    <Badge variant="outline" className="bg-white border-amber-200 text-amber-800">
                      {t('admin.dashboard.subscriptions.trial_total', 'Tổng user từng dùng trial')}: {trialTotalUsers}
                    </Badge>
                    <Badge variant="outline" className="bg-white border-blue-200 text-blue-800">
                      {t('admin.dashboard.subscriptions.trial_subscriptions', 'Tổng lượt đăng ký trial')}:{' '}
                      {trialTotalSubscriptions}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-green-50 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-emerald-600" />
                    <div className="text-sm text-gray-600">
                      {t('admin.dashboard.subscriptions.top_packages', 'Top gói được mua nhiều')}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-white text-gray-800 border-emerald-200">
                    {topPackages.length || 0} {t('admin.dashboard.subscriptions.packages', 'gói')}
                  </Badge>
                </div>

                {topPackage ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="text-xl font-semibold text-gray-900">{topPackage.packageName}</div>
                      {topPackage.isTrial && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                          {t('admin.dashboard.subscriptions.trial_badge', 'Trial')}
                        </Badge>
                      )}
                      {typeof topPackage.tier === 'number' && (
                        <Badge variant="outline" className="text-xs">
                          {t('admin.dashboard.subscriptions.tier', 'Tier')} {topPackage.tier}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        {t('admin.dashboard.subscriptions.purchases', 'Lượt mua')}: {topPackage.totalPurchases}
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        {t('admin.dashboard.subscriptions.active', 'Đang hoạt động')}: {topPackage.activeSubscriptions}
                      </div>
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-orange-500" />
                        {t('admin.dashboard.subscriptions.revenue', 'Doanh thu')}:{' '}
                        {formatCurrency(topPackage.totalRevenue || 0)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-emerald-600" />
                        {t('admin.dashboard.subscriptions.top', 'Top')} #1
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-600">
                    {t('admin.dashboard.subscriptions.no_data', 'Chưa có dữ liệu gói nào')}
                  </div>
                )}
              </div>

              <div className="p-5 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-indigo-50 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">{t('admin.dashboard.subscriptions.top', 'Top')} 3</div>
                  <Badge variant="secondary" className="bg-white text-gray-800 border-purple-200">
                    {topPackages.length || 0} {t('admin.dashboard.subscriptions.packages', 'gói')}
                  </Badge>
                </div>
                {topPackagesDisplay.length ? (
                  <div className="space-y-2">
                    {topPackagesDisplay.map((pkg, idx) => (
                      <div
                        key={pkg.packageId}
                        className="flex items-center justify-between rounded-xl border border-white/60 bg-white/80 px-3 py-2 shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                            #{idx + 1}
                          </Badge>
                          <div className="font-semibold text-gray-900">{pkg.packageName}</div>
                        </div>
                        <div className="text-sm text-gray-700 flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-500" />
                          {pkg.totalPurchases}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    {t('admin.dashboard.subscriptions.no_data', 'Chưa có dữ liệu gói nào')}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {t('admin.dashboard.verification_pipeline.title', 'Luồng duyệt doanh nghiệp')}
            </CardTitle>
            <CardDescription>
              {t('admin.dashboard.verification_pipeline.subtitle', 'Trạng thái các yêu cầu xác thực doanh nghiệp')}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/business-verifications')}>
            {t('admin.dashboard.verification_pipeline.view_all', 'Xem tất cả')}
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg border border-amber-100 bg-amber-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-700">
                  <Clock className="w-4 h-4" />
                  <p className="font-semibold">
                    {t('admin.dashboard.verification_pipeline.pending', 'Pending Requests')}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-white text-amber-700 border-amber-200">
                  {ownerIntelLoading ? '…' : `${getShare(stats.pendingVerifications)}`}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {ownerIntelLoading ? '…' : stats.pendingVerifications}
              </div>
              <p className="text-sm text-amber-700">
                {t('admin.dashboard.verification_pipeline.pending_hint', 'Cần xử lý sớm')}
              </p>
            </div>

            <div className="p-4 rounded-lg border border-emerald-100 bg-emerald-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <p className="font-semibold">{t('admin.dashboard.verification_pipeline.approved', 'Approved')}</p>
                </div>
                <Badge variant="secondary" className="bg-white text-emerald-700 border-emerald-200">
                  {ownerIntelLoading ? '…' : `${getShare(stats.approvedVerifications)}`}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {ownerIntelLoading ? '…' : stats.approvedVerifications}
              </div>
              <p className="text-sm text-emerald-700">
                {t('admin.dashboard.verification_pipeline.approved_hint', 'Đã kích hoạt')}
              </p>
            </div>

            <div className="p-4 rounded-lg border border-red-100 bg-red-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="w-4 h-4" />
                  <p className="font-semibold">{t('admin.dashboard.verification_pipeline.rejected', 'Rejected')}</p>
                </div>
                <Badge variant="secondary" className="bg-white text-red-700 border-red-200">
                  {ownerIntelLoading ? '…' : `${getShare(stats.rejectedVerifications)}`}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {ownerIntelLoading ? '…' : stats.rejectedVerifications}
              </div>
              <p className="text-sm text-red-700">
                {t('admin.dashboard.verification_pipeline.rejected_hint', 'Cần xem lại tiêu chí')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
