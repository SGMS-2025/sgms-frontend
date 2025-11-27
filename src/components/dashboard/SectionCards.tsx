import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Area, AreaChart, Label, Pie, PieChart, Tooltip, XAxis } from 'recharts';

import { useDashboardSummary, useTrends } from '@/hooks/useDashboard';
import { useBranch } from '@/contexts/BranchContext';
import type { TrendDataPoint } from '@/services/api/dashboardApi';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency, formatNumber } from '@/utils/currency';

const TotalRevenueCard: React.FC<{ revenue: number; periodRevenue: number; growth: number; loading: boolean }> = ({
  revenue,
  periodRevenue,
  growth,
  loading
}) => {
  const { t } = useTranslation();
  const isPositive = growth >= 0;
  const GrowthIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="bg-white rounded-xl p-6 h-full shadow-lg border border-gray-200" data-tour="overview-revenue-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-600">{t('dashboard.cards.total_revenue')}</span>
        </div>
        {!loading && (
          <div
            className={`flex items-center rounded-full px-2 py-1 ${
              isPositive ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'
            }`}
          >
            <GrowthIcon className="w-3 h-3 mr-1" />
            <span className="text-xs font-medium">
              {isPositive ? '+' : ''}
              {growth.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      <div className="mb-6">
        <div className="text-4xl font-bold text-gray-900 mb-2">{loading ? '...' : formatCurrency(revenue)}</div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          {!loading && (
            <>
              <div className={`flex items-center text-sm mb-1 ${isPositive ? 'text-orange-500' : 'text-red-500'}`}>
                <GrowthIcon className="w-4 h-4 mr-1" />
                <span>{formatCurrency(periodRevenue)}</span>
              </div>
              <div className="text-xs text-gray-500">{t('dashboard.cards.revenue_current_period')}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const NewCustomersCard: React.FC<{
  total: number;
  periodCount: number;
  growth: number;
  loading: boolean;
  trendData?: TrendDataPoint[];
  trendLoading?: boolean;
}> = ({ total, periodCount, growth, loading, trendData, trendLoading }) => {
  const { t } = useTranslation();
  const isPositive = growth >= 0;
  const GrowthIcon = isPositive ? TrendingUp : TrendingDown;

  const formatPeriodLabel = useCallback((period: string) => {
    // Try to render as month label; fallback to raw string.
    const parsed = new Date(period);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString('vi-VN', { month: 'short' });
    }

    const [year, month] = period.split('-');
    if (year && month) {
      const monthIndex = Number(month) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        return new Date(Number(year), monthIndex, 1).toLocaleString('vi-VN', { month: 'short' });
      }
    }

    return period;
  }, []);

  const chartConfig: ChartConfig = useMemo(
    () => ({
      customers: {
        label: t('dashboard.cards.new_customers'),
        color: 'var(--chart-1)'
      }
    }),
    [t]
  );

  const chartData = useMemo(
    () =>
      trendData && trendData.length
        ? trendData.slice(-8).map((item) => ({
            period: item.period,
            label: formatPeriodLabel(item.period),
            customers: item.value
          }))
        : [],
    [trendData, formatPeriodLabel]
  );

  return (
    <div
      className="bg-white rounded-xl p-4 h-full shadow-lg border border-gray-200 flex flex-col gap-3"
      data-tour="overview-customers-card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-600">{t('dashboard.cards.new_customers')}</span>
        </div>
        {!loading && (
          <div
            className={`flex items-center rounded-full px-2 py-1 ${
              isPositive ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'
            }`}
          >
            <GrowthIcon className="w-3 h-3 mr-1" />
            <span className="text-xs font-medium">
              {isPositive ? '+' : ''}
              {growth.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[1fr,1.1fr]">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">{t('dashboard.total_customers')}</p>
              <div className="text-3xl font-bold text-gray-900">{loading ? '...' : formatNumber(total)}</div>
            </div>
            {!loading && (
              <div className="text-right">
                <div
                  className={`flex items-center justify-end text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}
                >
                  <GrowthIcon className="w-4 h-4 mr-1" />
                  <span>{formatNumber(periodCount)}</span>
                </div>
                <div className="text-[11px] text-gray-500 leading-tight">
                  {t('dashboard.new_customers_this_period', { defaultValue: 'New customers this period' })}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="w-full">
          {trendLoading ? (
            <div className="h-[90px] flex items-center justify-center text-xs text-gray-500">
              {t('common.loading', { defaultValue: 'Loading...' })}
            </div>
          ) : chartData.length ? (
            <ChartContainer config={chartConfig} className="h-[90px] w-full">
              <AreaChart data={chartData} margin={{ top: 4, left: -8, right: 0 }}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  interval="preserveStartEnd"
                  minTickGap={10}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) =>
                        typeof label === 'string' && label.length ? label : t('common.na', { defaultValue: 'N/A' })
                      }
                      formatter={(value) =>
                        typeof value === 'number'
                          ? formatNumber(value)
                          : value || t('common.na', { defaultValue: 'N/A' })
                      }
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="customers"
                  stroke="var(--color-customers)"
                  fill="var(--color-customers)"
                  fillOpacity={0.18}
                  strokeWidth={2}
                  dot={{ r: 1.5 }}
                  activeDot={{ r: 3 }}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="h-[90px] flex items-center justify-center text-xs text-gray-500">
              {t('dashboard.no_customer_trend', { defaultValue: 'No customer trend data' })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ActiveAccountsChart: React.FC<{
  breakdown?: { manager: number; pt: number; technician: number; total: number };
}> = ({ breakdown }) => {
  const { t } = useTranslation();

  const chartData = useMemo(
    () => [
      {
        role: 'manager',
        label: t('staff.manager'),
        value: breakdown?.manager || 0,
        fill: 'url(#managerGradient)',
        legendColor: '#f97316'
      },
      {
        role: 'pt',
        label: t('staff.pt'),
        value: breakdown?.pt || 0,
        fill: 'url(#ptGradient)',
        legendColor: '#0ea5e9'
      },
      {
        role: 'technician',
        label: t('staff.technician'),
        value: breakdown?.technician || 0,
        fill: 'url(#technicianGradient)',
        legendColor: '#1f2937'
      }
    ],
    [breakdown?.manager, breakdown?.pt, breakdown?.technician, t]
  );

  const total = breakdown?.total ?? chartData.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className="bg-white rounded-xl p-4 h-full shadow-lg border border-gray-200" data-tour="overview-roles-card">
      <div className="flex items-center gap-4 justify-center">
        <PieChart width={200} height={200}>
          <defs>
            <linearGradient id="managerGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>
            <linearGradient id="ptGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="technicianGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1f2937" />
              <stop offset="100%" stopColor="#111827" />
            </linearGradient>
          </defs>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="role"
            innerRadius={52}
            outerRadius={86}
            paddingAngle={2}
            cornerRadius={6}
            cx="50%"
            cy="50%"
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-xl font-bold">
                        {total}
                      </tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 18} className="fill-muted-foreground text-xs">
                        {t('staff.title', { defaultValue: 'Nhân viên' })}
                      </tspan>
                    </text>
                  );
                }
                return null;
              }}
            />
          </Pie>
          <Tooltip />
        </PieChart>
        <div className="flex flex-col gap-3 text-sm min-w-[160px] rounded-lg border border-gray-100 bg-gray-50/60 p-3">
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">{t('dashboard.roles')}</div>
          {chartData.map((item) => {
            return (
              <div key={item.role} className="flex items-center gap-2">
                <span
                  className="h-3.5 w-3.5 rounded-full shadow-sm ring-1 ring-white"
                  style={{ backgroundColor: item.legendColor || item.fill }}
                  aria-hidden
                />
                <span className="text-gray-700 font-medium">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const SectionCards: React.FC = () => {
  const { currentBranch } = useBranch();
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Memoize params to prevent creating new object on every render
  const dashboardParams = useMemo(
    () => ({
      branchId: currentBranch?._id,
      period: 'month' as const
    }),
    [currentBranch?._id]
  );

  const { summary, loading } = useDashboardSummary(dashboardParams);
  const { data: customerTrends, loading: customerTrendLoading } = useTrends({
    type: 'customers',
    interval: 'month',
    branchId: currentBranch?._id,
    year: currentYear
  });

  const totalRevenue = summary?.totalRevenue ?? 0;
  const periodRevenue = summary?.periodRevenue ?? totalRevenue;
  const revenueSharePercent = totalRevenue > 0 ? (periodRevenue / totalRevenue) * 100 : 0;

  const totalCustomers = summary?.newCustomers ?? 0;
  const periodNewCustomers = summary?.periodNewCustomers ?? summary?.newCustomers ?? 0;
  const customerSharePercent = totalCustomers > 0 ? (periodNewCustomers / totalCustomers) * 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <TotalRevenueCard
        revenue={totalRevenue}
        periodRevenue={periodRevenue}
        growth={revenueSharePercent}
        loading={loading}
      />
      <NewCustomersCard
        total={totalCustomers}
        periodCount={periodNewCustomers}
        growth={customerSharePercent}
        loading={loading}
        trendData={customerTrends}
        trendLoading={customerTrendLoading}
      />
      <ActiveAccountsChart
        breakdown={
          summary?.staffBreakdown
            ? {
                manager: summary.staffBreakdown.manager,
                pt: summary.staffBreakdown.pt,
                technician: summary.staffBreakdown.technician,
                total: summary.staffBreakdown.total
              }
            : undefined
        }
      />
    </div>
  );
};
