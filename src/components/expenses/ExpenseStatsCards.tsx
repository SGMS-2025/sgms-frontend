import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wallet2,
  BarChart3,
  PieChart,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CalendarRange,
  DollarSign,
  MapPin,
  Plus,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { ExpenseStats, ExpenseCategory } from '@/types/api/Expenses';
import { EXPENSE_CATEGORY_DISPLAY } from '@/types/api/Expenses';

interface ExpenseStatsCardsProps {
  stats: ExpenseStats | null;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  dateRangeLabel?: string;
  branchName?: string;
  onCreateExpense?: () => void;
  onStartTour?: () => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount || 0);

const formatMonthLabel = (month: string, locale: string) => {
  const [year, monthStr] = month.split('-');
  const date = new Date(Number(year), Number(monthStr) - 1, 1);
  return date.toLocaleString(locale, { month: 'short', year: 'numeric' });
};

export function ExpenseStatsCards({
  stats,
  loading,
  error,
  onRetry,
  dateRangeLabel,
  branchName,
  onCreateExpense,
  onStartTour
}: ExpenseStatsCardsProps) {
  const { t, i18n } = useTranslation();

  const {
    totalAmount,
    totalExpenses,
    topCategory,
    topCategoryShare,
    monthlyTrend,
    trendChange,
    latestMonthTotal,
    latestMonthLabel
  } = useMemo(() => {
    if (!stats) {
      return {
        totalAmount: 0,
        totalExpenses: 0,
        topCategory: null as ExpenseStats['categoryBreakdown'][number] | null,
        topCategoryShare: 0,
        monthlyTrend: [],
        trendChange: null as number | null,
        latestMonthTotal: 0,
        latestMonthLabel: ''
      };
    }

    const highestCategory = stats.categoryBreakdown?.[0] || null;
    const share =
      highestCategory && stats.totalAmount > 0
        ? Math.round((highestCategory.totalAmount / stats.totalAmount) * 100)
        : 0;

    const trend = stats.monthlyTrend || [];
    const latest = trend[trend.length - 1];
    const previous = trend[trend.length - 2];
    const change =
      latest && previous && previous.totalAmount > 0
        ? ((latest.totalAmount - previous.totalAmount) / previous.totalAmount) * 100
        : null;

    return {
      totalAmount: stats.totalAmount || 0,
      totalExpenses: stats.totalExpenses || 0,
      topCategory: highestCategory,
      topCategoryShare: share,
      monthlyTrend: trend,
      trendChange: change,
      latestMonthTotal: latest?.totalAmount || 0,
      latestMonthLabel: latest ? formatMonthLabel(latest.month, i18n.language) : ''
    };
  }, [stats, i18n.language]);

  return (
    <Card className="border border-orange-100 shadow-sm">
      <CardHeader className="pb-4 border-b border-gray-100">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-600">
                  <DollarSign className="h-3.5 w-3.5" />
                  {t('expenses.badge', 'EXPENSE MANAGEMENT')}
                </span>
                {branchName && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-600">
                    <MapPin className="h-3.5 w-3.5" />
                    {t('expenses.branch_filter', 'FILTERING BY BRANCH')}: {branchName}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {t('expenses.title', 'Quản lý chi phí')}
                </CardTitle>
                <p className="text-sm sm:text-base text-gray-600">
                  {t('expenses.subtitle', 'Theo dõi và quản lý các chi phí của phòng gym')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-gray-600 border-dashed">
                  <CalendarRange className="w-3.5 h-3.5 mr-1" />
                  {dateRangeLabel || t('expenses.stats.all_time', 'Tất cả thời gian')}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {t('expenses.stats.refresh', 'Làm mới')}
                </Button>
              )}
              {onStartTour && (
                <Button
                  variant="outline"
                  size="icon"
                  className="border-gray-300 hover:bg-gray-50"
                  onClick={onStartTour}
                  title={t('expenses.tour.button', 'Hướng dẫn')}
                >
                  <HelpCircle className="w-4 h-4 text-gray-600" />
                </Button>
              )}
              {onCreateExpense && (
                <Button
                  onClick={onCreateExpense}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  data-tour="create-expense-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('expenses.create_new', 'Tạo chi phí mới')}
                </Button>
              )}
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span>{t('expenses.stats_error', 'Không thể tải thống kê chi phí')}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {[1, 2, 3, 4].map((item) => (
              <Card key={item} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
                <Skeleton className="h-7 w-24 mb-2" />
                <Skeleton className="h-4 w-28" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-1.5 p-3">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {t('expenses.stats.total_amount', 'Tổng chi')}
                </CardTitle>
                <div className="rounded-xl bg-orange-100 p-2 text-orange-700">
                  <Wallet2 className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 flex flex-col gap-1">
                <div className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</div>
                <p className="text-sm text-gray-600">
                  {t('expenses.stats.expense_count', 'Số khoản chi')}: {totalExpenses}
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-1.5 p-3">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {t('expenses.stats.top_category', 'Danh mục chi nhiều nhất')}
                </CardTitle>
                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                  <PieChart className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 flex flex-col gap-2">
                {topCategory ? (
                  <>
                    <div className="text-base font-semibold text-gray-900">
                      {t(
                        `expenses.categories.${(topCategory.category as ExpenseCategory).toLowerCase()}`,
                        EXPENSE_CATEGORY_DISPLAY[topCategory.category as ExpenseCategory]
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{formatCurrency(topCategory.totalAmount)}</p>
                    <div className="mt-1 flex items-center gap-2 w-full max-w-[240px]">
                      <div className="h-2 flex-1 rounded-full bg-emerald-100">
                        <div
                          className="h-2 rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(topCategoryShare, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-emerald-700">{topCategoryShare}%</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">{t('expenses.stats.no_data', 'Chưa có dữ liệu')}</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-1.5 p-3">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {t('expenses.stats.trend', 'Xu hướng 6 tháng')}
                </CardTitle>
                <div className="rounded-xl bg-purple-100 p-2 text-purple-700">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 flex flex-col gap-2">
                {monthlyTrend && monthlyTrend.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 text-xs mb-2">
                      {trendChange !== null && (
                        <span
                          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                            trendChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {trendChange >= 0 ? (
                            <ArrowUpRight className="w-4 h-4 mr-1" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 mr-1" />
                          )}
                          {Math.abs(trendChange).toFixed(1)}%
                        </span>
                      )}
                      <span className="text-gray-600">
                        {t('expenses.stats.last_month_change', 'So với tháng trước')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs uppercase text-gray-600">
                        {t('expenses.stats.latest_month', 'Tháng gần nhất')}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-lg font-semibold text-gray-900">{formatCurrency(latestMonthTotal)}</div>
                        {latestMonthLabel && <div className="text-xs text-gray-600">{latestMonthLabel}</div>}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">{t('expenses.stats.no_data', 'Chưa có dữ liệu')}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
