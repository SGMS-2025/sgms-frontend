import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity } from 'lucide-react';

interface CheckInChartsProps {
  title: string;
  data: Array<{ time: string; value: number }>;
}

export const CheckInCharts: React.FC<CheckInChartsProps> = ({ title, data }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg p-4 h-full border-2 border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Activity className="w-4 h-4 text-[#f05a29] mr-2" />
          <span className="text-sm text-[#f05a29] font-medium">{title}</span>
        </div>
        <div className="flex space-x-2">
          <select className="text-sm border border-gray-200 rounded px-2 py-1 bg-white">
            <option>{t('dashboard.branch_1')}</option>
          </select>
          <select className="text-sm border border-gray-200 rounded px-2 py-1 bg-white">
            <option>{t('dashboard.this_month')}</option>
          </select>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" horizontal={true} vertical={false} />
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#0d1523', fontWeight: 'bold' }}
            interval={0}
            padding={{ left: 20, right: 20 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9fa5ad' }}
            domain={[0, 2]}
            ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0]}
          />
          <Bar dataKey="value" fill="#f05a29" radius={[2, 2, 0, 0]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
