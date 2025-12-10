'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { LineChart as LineChartIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatDateForChart, formatDateForTooltip, isValidDateString, compareDateStrings } from '@/utils/dateUtils';
import type { TrainingProgressChartProps } from '@/types/forms/Progress';

export const TrainingProgressChart: React.FC<TrainingProgressChartProps> = ({ data, onAddProgress }) => {
  const { t } = useTranslation();

  // Filter and validate data
  const validData = React.useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    const filtered = data
      .filter((item) => {
        if (!item.date || !isValidDateString(item.date)) return false;
        if (typeof item.weight !== 'number' || Number.isNaN(item.weight)) return false;
        if (typeof item.strength !== 'number' || Number.isNaN(item.strength)) return false;
        return true;
      })
      .sort((a, b) => compareDateStrings(a.date, b.date));

    return filtered;
  }, [data]);

  const hasData = Boolean(data?.length);
  const hasValidData = validData.length > 0;

  const { weightDomain, strengthDomain } = React.useMemo(() => {
    const padDomain = (values: number[], pad = 5) => {
      if (!values.length) return undefined;
      const min = Math.min(...values);
      const max = Math.max(...values);
      return [Math.max(0, min - pad), max + pad];
    };
    return {
      weightDomain: padDomain(validData.map((item) => item.weight)),
      strengthDomain: padDomain(validData.map((item) => item.strength))
    };
  }, [validData]);

  const chartConfig: ChartConfig = React.useMemo(
    () => ({
      weight: {
        label: t('training_chart.legend.weight'),
        color: '#f97316' // orange
      },
      strength: {
        label: t('training_chart.legend.strength'),
        color: '#ef4444' // red
      }
    }),
    [t]
  );

  const sharedTicks = React.useMemo(() => {
    const allValues = [...validData.map((d) => d.weight), ...validData.map((d) => d.strength)];
    if (!allValues.length) return undefined;
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const paddedMin = Math.floor((min - 2) / 5) * 5;
    const paddedMax = Math.ceil((max + 2) / 5) * 5;
    const range = Math.max(5, paddedMax - paddedMin);
    const step = Math.max(5, Math.round(range / 4 / 5) * 5);
    const ticks: number[] = [];
    for (let v = paddedMin; v <= paddedMax; v += step) {
      ticks.push(v);
    }
    return ticks;
  }, [validData]);

  const summaryStats = React.useMemo(() => {
    if (!validData.length) return null;

    const first = validData[0];
    const last = validData[validData.length - 1];
    const weightChange = last.weight - first.weight;
    const strengthChange = last.strength - first.strength;

    const formatChange = (value: number, suffix = '') => {
      if (!Number.isFinite(value) || value === 0) return t('training_chart.stats.no_change', 'No change');
      const sign = value > 0 ? '+' : '-';
      return `${sign}${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 1 })}${suffix}`;
    };

    const weightUnit = t('progress_detail.stats.kg', 'kg');

    return [
      {
        key: 'currentWeight',
        label: t('training_chart.stats.current_weight', 'Current weight'),
        value: `${last.weight.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${weightUnit}`,
        trend: 0
      },
      {
        key: 'weightChange',
        label: t('training_chart.stats.weight_change', 'Weight change'),
        value: formatChange(weightChange, ` ${weightUnit}`),
        trend: weightChange
      },
      {
        key: 'currentStrength',
        label: t('training_chart.stats.current_strength', 'Strength score'),
        value: last.strength.toLocaleString(undefined, { maximumFractionDigits: 1 }),
        trend: 0
      },
      {
        key: 'strengthChange',
        label: t('training_chart.stats.strength_change', 'Strength change'),
        value: formatChange(strengthChange),
        trend: strengthChange
      }
    ];
  }, [t, validData]);

  const emptyHighlights = React.useMemo(
    () => [
      t('training_chart.empty_highlights.weight', 'Theo dõi cân nặng theo thời gian'),
      t('training_chart.empty_highlights.strength', 'Ghi lại điểm sức mạnh sau mỗi buổi'),
      t('training_chart.empty_highlights.notes', 'Thêm ghi chú hoặc hình ảnh để so sánh')
    ],
    [t]
  );

  const renderEmptyState = (title: string, description: string) => (
    <div className="h-[340px] flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-muted/40 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
        <LineChartIcon className="h-6 w-6 text-[#F05A29]" />
      </div>
      <p className="mt-4 text-lg font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{description}</p>

      <div className="mt-4 flex max-w-xl flex-wrap justify-center gap-2">
        {emptyHighlights.map((item, index) => (
          <span
            key={`${index}-${item}`}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#F05A29]" />
            <span>{item}</span>
          </span>
        ))}
      </div>

      {onAddProgress && (
        <Button size="sm" className="mt-5 bg-[#F05A29] text-white hover:bg-[#E04A1F]" onClick={onAddProgress}>
          {t('training_chart.add_progress_cta', 'Thêm tiến trình ngay')}
        </Button>
      )}
    </div>
  );

  if (!hasData) {
    return renderEmptyState(t('training_chart.no_data_title'), t('training_chart.no_data_description'));
  }

  if (!hasValidData) {
    return renderEmptyState(t('training_chart.invalid_data_title'), t('training_chart.invalid_data_description'));
  }

  return (
    <div className="space-y-4">
      <ChartContainer config={chartConfig} className="h-[340px] w-full">
        <LineChart
          accessibilityLayer
          data={validData}
          margin={{
            left: 36,
            right: 36,
            top: 16,
            bottom: 18
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 12" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            minTickGap={28}
            interval="preserveStartEnd"
            tickFormatter={formatDateForChart}
            tick={{ fontSize: 12, fill: '#475569' }}
          />
          <YAxis
            yAxisId="weight"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            width={64}
            tick={{ fontSize: 11, fill: '#475569' }}
            domain={weightDomain}
            ticks={sharedTicks}
            tickFormatter={(value: number) => (Number.isFinite(value) ? value.toString() : '')}
            label={{
              value: t('training_chart.axis.weight'),
              angle: -90,
              position: 'left',
              offset: 0,
              style: {
                fill: 'var(--color-weight)',
                fontWeight: 600,
                fontSize: 12,
                letterSpacing: 0.2,
                textAnchor: 'middle'
              }
            }}
          />
          <YAxis
            yAxisId="strength"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            width={64}
            tick={{ fontSize: 11, fill: '#475569' }}
            domain={strengthDomain}
            ticks={sharedTicks}
            tickFormatter={(value: number) => (Number.isFinite(value) ? value.toString() : '')}
            label={{
              value: t('training_chart.axis.strength'),
              angle: 90,
              position: 'right',
              offset: 0,
              style: {
                fill: 'var(--color-strength)',
                fontWeight: 600,
                fontSize: 12,
                letterSpacing: 0.2,
                textAnchor: 'middle'
              }
            }}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                className="border-slate-200 bg-white text-slate-900"
                labelFormatter={(value) => formatDateForTooltip(String(value ?? ''))}
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      {name === 'weight' ? t('training_chart.tooltip.weight') : t('training_chart.tooltip.strength')}
                    </span>
                    <span className="font-semibold text-foreground">
                      {typeof value === 'number' ? value.toLocaleString() : value}
                      {name === 'weight' ? ' kg' : ''}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Line
            yAxisId="weight"
            dataKey="weight"
            type="natural"
            stroke="var(--color-weight)"
            strokeWidth={2}
            strokeLinecap="round"
            dot={{ r: 4, strokeWidth: 1.5, stroke: '#fff', fill: 'var(--color-weight)' }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: 'var(--color-weight)' }}
          />
          <Line
            yAxisId="strength"
            dataKey="strength"
            type="natural"
            stroke="var(--color-strength)"
            strokeWidth={2}
            strokeLinecap="round"
            dot={{ r: 4, strokeWidth: 1.5, stroke: '#fff', fill: 'var(--color-strength)' }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: 'var(--color-strength)' }}
          />
        </LineChart>
      </ChartContainer>
      <div className="flex items-center justify-center gap-6 text-sm font-semibold text-slate-600">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#f97316' }} />
          <span>{t('training_chart.legend.weight')}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
          <span>{t('training_chart.legend.strength')}</span>
        </span>
      </div>

      {summaryStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {summaryStats.map((stat) => (
            <div key={stat.key} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <p
                className={`text-sm font-semibold ${
                  stat.trend > 0 ? 'text-emerald-600' : stat.trend < 0 ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
