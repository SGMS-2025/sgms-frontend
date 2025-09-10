import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const revenueData = [
  { month: '1', pt: 50, customer: 80 },
  { month: '2', pt: 120, customer: 110 },
  { month: '3', pt: 80, customer: 200 },
  { month: '4', pt: 100, customer: 250 },
  { month: '5', pt: 150, customer: 200 },
  { month: '6', pt: 120, customer: 220 },
  { month: '7', pt: 80, customer: 240 },
  { month: '8', pt: 140, customer: 180 },
  { month: '9', pt: 60, customer: 220 },
  { month: '10', pt: 40, customer: 240 },
  { month: '11', pt: 80, customer: 220 },
  { month: '12', pt: 20, customer: 80 }
];

export const RevenueChart: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <TrendingUp className="w-4 h-4 text-[#f05a29] mr-2" />
          <span className="text-sm text-[#f05a29] font-medium">{t('dashboard.revenue_chart_title')}</span>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 text-sm text-[#9fa5ad] border border-[#d9d9d9] rounded">
            {t('dashboard.by_month')}
          </button>
          <button className="px-4 py-2 text-sm bg-[#f05a29] text-white rounded">{t('dashboard.by_year')}</button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={revenueData}>
          <XAxis dataKey="month" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} />
          <Bar dataKey="pt" fill="#9fa5ad" />
          <Bar dataKey="customer" fill="#f05a29" />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-center space-x-6 mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#9fa5ad] rounded mr-2"></div>
          <span className="text-sm">{t('dashboard.pt_revenue')}</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#f05a29] rounded mr-2"></div>
          <span className="text-sm">{t('dashboard.customer_revenue')}</span>
        </div>
      </div>
    </div>
  );
};
