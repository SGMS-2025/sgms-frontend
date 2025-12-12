import React from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle } from 'lucide-react';
import { useAuthState } from '@/hooks/useAuth';
import { useOverviewTour } from '@/hooks/useOverviewTour';
import { Button } from '@/components/ui/button';
import { SectionCards } from '@/components/dashboard/SectionCards';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { StatsSidebar } from '@/components/dashboard/StatsSidebar';
import { BranchList } from '@/components/dashboard/BranchList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenseStats } from '@/hooks/useExpenses';
import { useBranch } from '@/contexts/BranchContext';
import { Wallet2, ListChecks, PieChart } from 'lucide-react';
import { KPILeaderboard } from '@/components/dashboard/KPILeaderboard';

const OwnerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isLoading } = useAuthState();
  const { startOverviewTour } = useOverviewTour();
  const { currentBranch } = useBranch();
  const { stats, loading: statsLoading, refetch: refetchExpenseStats } = useExpenseStats();

  React.useEffect(() => {
    refetchExpenseStats({
      branchId: currentBranch?._id,
      status: 'ACTIVE'
    });
  }, [currentBranch?._id, refetchExpenseStats]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount || 0);

  const formatPercent = (value: number) =>
    `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value)}%`;

  const latestMonth = stats?.monthlyTrend?.[stats.monthlyTrend.length - 1];
  const prevMonth = stats?.monthlyTrend?.[stats.monthlyTrend.length - 2];
  const momChangeAmount = latestMonth && prevMonth ? latestMonth.totalAmount - prevMonth.totalAmount : undefined;
  const momChangePercent =
    latestMonth && prevMonth && prevMonth.totalAmount > 0
      ? ((latestMonth.totalAmount - prevMonth.totalAmount) / prevMonth.totalAmount) * 100
      : undefined;
  const monthlyAverage =
    stats?.monthlyTrend && stats.monthlyTrend.length > 0
      ? stats.monthlyTrend.reduce((sum, item) => sum + item.totalAmount, 0) / stats.monthlyTrend.length
      : 0;

  const topCategories = stats?.categoryBreakdown ? stats.categoryBreakdown.slice(0, 3) : [];

  // Display loading while fetching
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('staff.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Tour Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-full border-gray-300 hover:bg-gray-50"
          onClick={startOverviewTour}
          title={t('overview.tour.button', 'Hướng dẫn')}
        >
          <HelpCircle className="w-4 h-4 text-gray-500 hover:text-orange-500" />
        </Button>
      </div>

      {/* Top Section */}
      <div className="mb-6">
        <SectionCards />
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-12 gap-6 mb-6 items-stretch">
        <div className="col-span-12 xl:col-span-8">
          <RevenueChart />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <StatsSidebar />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <BranchList />
        <KPILeaderboard />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t('expenses.stats.title', 'Thống kê chi phí')}</CardTitle>
          <p className="text-sm text-gray-500">
            {currentBranch?.branchName
              ? t('expenses.branch_filter', 'FILTERING BY BRANCH') + ': ' + currentBranch.branchName
              : t('expenses.stats.subtitle', 'Tổng quan dựa trên bộ lọc hiện tại')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg border border-orange-100 bg-orange-50/60 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-orange-700">
                <Wallet2 className="w-4 h-4" />
                {t('expenses.stats.total_amount', 'Tổng chi')}
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : formatCurrency(stats?.totalAmount || 0)}
              </div>
              <div className="text-sm text-gray-600">
                {t('expenses.stats.expense_count', 'Số khoản chi')}: {stats?.totalExpenses ?? 0}
              </div>
            </div>

            <div className="p-4 rounded-lg border border-blue-100 bg-blue-50/60 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-700">
                <ListChecks className="w-4 h-4" />
                {t('expenses.stats.average_amount', 'Trung bình/khoản')}
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : formatCurrency(stats?.averageAmount || 0)}
              </div>
              <div className="text-sm text-gray-600">
                {t('expenses.stats.expense_count_short', 'Khoản chi')}: {stats?.totalExpenses ?? 0}
              </div>
            </div>

            <div className="p-4 rounded-lg border border-emerald-100 bg-emerald-50/60 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-emerald-700">
                <PieChart className="w-4 h-4" />
                {t('expenses.stats.top_category', 'Danh mục chi nhiều nhất')}
              </div>
              <div className="mt-2 text-xl font-semibold text-gray-900">
                {statsLoading
                  ? '...'
                  : stats?.categoryBreakdown?.[0]
                    ? t(
                        `expenses.categories.${stats.categoryBreakdown[0].category.toLowerCase()}`,
                        stats.categoryBreakdown[0].category
                      )
                    : t('expenses.stats.no_data', 'Chưa có dữ liệu')}
              </div>
              <div className="text-sm text-gray-600">
                {stats?.categoryBreakdown?.[0] ? formatCurrency(stats.categoryBreakdown[0].totalAmount) : ''}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="text-xs uppercase text-gray-500">
                {t('expenses.stats.mom_change', 'So với tháng trước')}
              </div>
              <div
                className={`mt-2 text-xl font-semibold ${
                  momChangePercent !== undefined && momChangePercent < 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {statsLoading || momChangePercent === undefined
                  ? '...'
                  : `${momChangeAmount && momChangeAmount > 0 ? '+' : ''}${formatCurrency(
                      momChangeAmount || 0
                    )} (${formatPercent(momChangePercent)})`}
              </div>
              {latestMonth && (
                <div className="text-xs text-gray-500">
                  {t('expenses.stats.latest_month', 'Tháng gần nhất')}: {latestMonth?.month || ''}
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="text-xs uppercase text-gray-500">
                {t('expenses.stats.monthly_avg', 'Chi TB theo tháng')}
              </div>
              <div className="mt-2 text-xl font-semibold text-gray-900">
                {statsLoading ? '...' : formatCurrency(monthlyAverage || 0)}
              </div>
              <div className="text-xs text-gray-500">
                {t('expenses.stats.expense_count_short', 'Khoản chi')}: {stats?.totalExpenses ?? 0}
              </div>
            </div>

            <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="text-xs uppercase text-gray-500">
                {t('expenses.stats.top_categories', 'Top danh mục')}
              </div>
              {statsLoading ? (
                <div className="text-sm text-gray-500 mt-2">...</div>
              ) : topCategories.length === 0 ? (
                <div className="text-sm text-gray-500 mt-2">
                  {t('expenses.stats.no_data_short', 'Không có dữ liệu')}
                </div>
              ) : (
                <div className="mt-2 space-y-1">
                  {topCategories.map((item) => (
                    <div key={item.category} className="flex items-center justify-between text-sm text-gray-800">
                      <span className="font-semibold">
                        {t(`expenses.categories.${item.category.toLowerCase()}`, item.category)}
                      </span>
                      <span className="text-gray-600">
                        {formatPercent((item.totalAmount / (stats?.totalAmount || 1)) * 100)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerDashboard;
