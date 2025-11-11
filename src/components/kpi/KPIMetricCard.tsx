import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatNumber } from '@/utils/currency';

interface KPIMetricCardProps {
  title: string;
  target: number;
  actual: number;
  progress: number;
  icon: React.ReactNode;
  isCount?: boolean;
  description?: string;
}

export const KPIMetricCard: React.FC<KPIMetricCardProps> = ({ title, actual, icon, isCount = false, description }) => {
  const { t } = useTranslation();
  const displayValue = isCount ? formatNumber(actual) : formatCurrency(actual);

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-orange-50 rounded-lg">
            <div className="text-orange-500">{icon}</div>
          </div>
          <div>
            <span className="font-medium text-gray-900">{title}</span>
            {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
          </div>
        </div>
      </div>

      <div className="text-center">
        <div className="text-3xl font-bold text-gray-900">{displayValue}</div>
        <div className="text-sm text-gray-500 mt-1">{t('kpi.actual', 'Thực tế')}</div>
      </div>
    </div>
  );
};
