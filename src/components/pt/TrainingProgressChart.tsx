import React from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDateForChart, formatDateForTooltip, isValidDateString, compareDateStrings } from '@/utils/dateUtils';
import type { TrainingProgressChartProps, TooltipProps } from '@/types/forms/Progress';

export const TrainingProgressChart: React.FC<TrainingProgressChartProps> = ({ data }) => {
  const { t } = useTranslation();

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-[#101D33] mb-1">
            {t('training_chart.tooltip.date')}: {formatDateForTooltip(label || '')}
          </p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name === 'weight' ? t('training_chart.tooltip.weight') : t('training_chart.tooltip.strength')}:{' '}
              {entry.value}
              {entry.name === 'weight' ? 'kg' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Filter and validate data
  const validData = React.useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    const filtered = data
      .filter((item) => {
        // Check if date is valid
        if (!item.date) {
          return false;
        }

        if (!isValidDateString(item.date)) {
          return false;
        }

        // Check if weight and strength are valid numbers
        if (typeof item.weight !== 'number' || isNaN(item.weight)) {
          return false;
        }
        if (typeof item.strength !== 'number' || isNaN(item.strength)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => compareDateStrings(a.date, b.date));

    return filtered;
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">{t('training_chart.no_data_title')}</p>
          <p className="text-sm">{t('training_chart.no_data_description')}</p>
        </div>
      </div>
    );
  }

  if (validData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">{t('training_chart.invalid_data_title')}</p>
          <p className="text-sm">{t('training_chart.invalid_data_description')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={validData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={formatDateForChart}
            stroke="#9CA3AF"
          />
          <YAxis
            yAxisId="weight"
            orientation="left"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            stroke="#101D33"
            label={{
              value: t('training_chart.axis.weight'),
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: '#101D33' }
            }}
          />
          <YAxis
            yAxisId="strength"
            orientation="right"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            stroke="#F05A29"
            label={{
              value: t('training_chart.axis.strength'),
              angle: 90,
              position: 'insideRight',
              style: { textAnchor: 'middle', fill: '#F05A29' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '14px', fontWeight: '500' }} />
          <Line
            yAxisId="weight"
            type="monotone"
            dataKey="weight"
            stroke="#101D33"
            strokeWidth={3}
            dot={{ fill: '#101D33', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, fill: '#101D33', strokeWidth: 2, stroke: '#fff' }}
            name={t('training_chart.legend.weight')}
          />
          <Line
            yAxisId="strength"
            type="monotone"
            dataKey="strength"
            stroke="#F05A29"
            strokeWidth={3}
            dot={{ fill: '#F05A29', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, fill: '#F05A29', strokeWidth: 2, stroke: '#fff' }}
            name={t('training_chart.legend.strength')}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
