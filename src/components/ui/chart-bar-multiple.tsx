'use client';

import { useMemo } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useRevenueChart } from '@/hooks/useDashboard';
import { useBranch } from '@/contexts/BranchContext';
import { formatCurrency } from '@/utils/currency';

export const description = 'Branch revenue by month';

const formatRange = (data: Array<{ month: string }>, t: TFunction) => {
  if (!data?.length) return '';

  const formatMonth = (monthStr: string) => {
    // Try to parse as date string (YYYY-MM format)
    const parts = monthStr.split('-');
    if (parts.length === 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      if (!Number.isNaN(year) && !Number.isNaN(month) && month >= 1 && month <= 12) {
        // Use translation for month name
        const monthKey = `common.month.${month}`;
        const translatedMonth = t(monthKey);
        return translatedMonth;
      }
    }

    // Map English month names to translation keys
    const monthMap: Record<string, string> = {
      January: 'common.month.1',
      February: 'common.month.2',
      March: 'common.month.3',
      April: 'common.month.4',
      May: 'common.month.5',
      June: 'common.month.6',
      July: 'common.month.7',
      August: 'common.month.8',
      September: 'common.month.9',
      October: 'common.month.10',
      November: 'common.month.11',
      December: 'common.month.12',
      Jan: 'common.month.1',
      Feb: 'common.month.2',
      Mar: 'common.month.3',
      Apr: 'common.month.4',
      Jun: 'common.month.6',
      Jul: 'common.month.7',
      Aug: 'common.month.8',
      Sep: 'common.month.9',
      Oct: 'common.month.10',
      Nov: 'common.month.11',
      Dec: 'common.month.12'
    };

    // Check if it's an English month name
    if (monthMap[monthStr]) {
      return t(monthMap[monthStr]);
    }

    // If already formatted, try to parse as date
    const parsed = new Date(monthStr);
    if (!Number.isNaN(parsed.getTime())) {
      const month = parsed.getMonth() + 1;
      const monthKey = `common.month.${month}`;
      return t(monthKey);
    }

    // Fallback to original string
    return monthStr;
  };

  const first = formatMonth(data[0].month);
  const last = formatMonth(data[data.length - 1].month);
  return first === last ? first : `${first} - ${last}`;
};

const calcTrend = (data: Array<{ month: string; revenue: number }>) => {
  if (!data || data.length < 2) return null;
  const prev = data[data.length - 2].revenue;
  const curr = data[data.length - 1].revenue;
  if (prev === 0) return null;
  return ((curr - prev) / prev) * 100;
};

export function ChartBarMultiple() {
  const { currentBranch } = useBranch();
  const { data, loading, error } = useRevenueChart({ branchId: currentBranch?._id });
  const { t } = useTranslation();

  const chartData = data || [];

  const aggregatedData = chartData.map((item) => {
    const total = Object.entries(item).reduce((acc, [key, value]) => {
      if (key === 'month' || typeof value !== 'number') return acc;
      return acc + value;
    }, 0);
    return { month: item.month, revenue: total };
  });

  const chartConfig: ChartConfig = useMemo(
    () => ({
      revenue: {
        label: t('dashboard.revenue_label', { defaultValue: 'Revenue' }),
        color: 'var(--chart-1)'
      }
    }),
    [t]
  );

  const periodLabel = formatRange(aggregatedData as Array<{ month: string }>, t);
  const trend = calcTrend(aggregatedData);
  const latestEntry = aggregatedData.at(-1);
  const previousEntry = aggregatedData.length > 1 ? aggregatedData[aggregatedData.length - 2] : null;

  return (
    <Card className="bg-white border-gray-200 shadow-md flex flex-col" data-tour="overview-revenue-chart">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base text-gray-900">
              {t('dashboard.revenue_overview_title', { defaultValue: 'Revenue overview' })}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {periodLabel || t('dashboard.no_data', { defaultValue: 'No data' })}{' '}
              {currentBranch?.branchName ? `• ${currentBranch.branchName}` : ''}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: 'var(--color-revenue)' }} />
            {t('dashboard.revenue_label', { defaultValue: 'Revenue' })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : loading ? (
          <div className="h-[280px] flex items-center justify-center text-sm text-gray-500">
            {t('common.loading', { defaultValue: 'Loading...' })}
          </div>
        ) : aggregatedData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-sm text-gray-500">
            {t('dashboard.no_data', { defaultValue: 'No data' })}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart
              accessibilityLayer
              data={aggregatedData}
              margin={{
                top: 20
              }}
              barCategoryGap="40%"
              barGap={8}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => (typeof value === 'string' ? value.slice(0, 3) : value)}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={8} maxBarSize={48}>
                <LabelList
                  position="top"
                  offset={8}
                  className="fill-foreground"
                  fontSize={11}
                  formatter={(value: number) =>
                    typeof value === 'number' ? value.toLocaleString('vi-VN') : String(value)
                  }
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="pt-3 text-sm flex-shrink-0">
        {trend !== null && latestEntry ? (
          <div className="flex w-full flex-wrap items-center gap-3 text-sm leading-snug">
            <div className="flex items-center gap-2 text-gray-700">
              <span>{t('dashboard.revenue_latest_label', { defaultValue: 'Latest period' })}:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(latestEntry.revenue || 0)}</span>
              {latestEntry.month ? <span className="text-gray-500">({latestEntry.month})</span> : null}
            </div>
            <div className={`flex items-center gap-2 font-semibold ${trend >= 0 ? 'text-orange-500' : 'text-red-500'}`}>
              <span>
                {trend >= 0
                  ? t('dashboard.revenue_growth', { defaultValue: 'Growth' })
                  : t('dashboard.revenue_decline', { defaultValue: 'Decline' })}
              </span>
              <span>{Math.abs(trend).toFixed(1)}%</span>
              {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
            {previousEntry ? (
              <div className="flex items-center gap-2 text-gray-600">
                <span>{t('dashboard.revenue_previous_label', { defaultValue: 'Previous period' })}:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(previousEntry.revenue || 0)}</span>
                {previousEntry.month ? <span className="text-gray-500">({previousEntry.month})</span> : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-gray-500">
            {t('dashboard.revenue_insufficient_data', {
              defaultValue: 'Not enough data to compare trend'
            })}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
