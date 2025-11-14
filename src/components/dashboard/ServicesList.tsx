import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';
import { usePackageStatistics } from '@/hooks/useDashboard';
import { useBranch } from '@/contexts/BranchContext';
import { formatNumber } from '@/utils/currency';

export const ServicesList: React.FC = () => {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();
  const uid = React.useId().replace(/:/g, '');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Fetch package statistics
  const { packages, loading, error } = usePackageStatistics({
    branchId: currentBranch?._id,
    year: selectedYear
  });

  // Get the first package with sales or first package
  const selectedPackage = useMemo(() => {
    if (!packages || packages.length === 0) return null;
    // Prefer package with quantitySold > 0
    const packageWithSales = packages.find((pkg) => pkg.quantitySold > 0);
    return packageWithSales || packages[0];
  }, [packages]);

  // Format duration from "X months" to date range
  const formatDuration = (duration: string): string => {
    if (!duration || duration === 'N/A') return '—';
    // Parse "X months" format
    const match = duration.match(/(\d+)\s*months?/i);
    if (!match) return duration;

    const months = parseInt(match[1], 10);
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months - 1);
    endDate.setDate(new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate());

    const formatDate = (date: Date) => {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      return `${day}/${month}`;
    };

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  // Get status display text
  const getStatusText = (status: string): string => {
    if (status === 'ACTIVE') return t('dashboard.ongoing', 'Đang diễn ra');
    if (status === 'INACTIVE') return t('dashboard.inactive', 'Không hoạt động');
    return status;
  };

  // Prepare chart data from weeklyTrend
  const chartData = useMemo(() => {
    if (!selectedPackage?.weeklyTrend || selectedPackage.weeklyTrend.length === 0) {
      return [
        { m: 'W1', v: 0 },
        { m: 'W2', v: 0 },
        { m: 'W3', v: 0 },
        { m: 'W4', v: 0 }
      ];
    }
    return selectedPackage.weeklyTrend.map((trend) => ({
      m: trend.week,
      v: trend.value
    }));
  }, [selectedPackage]);

  // Generate year options (current year and previous 2 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 3 }, (_, i) => currentYear - i);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
        <div className="text-center py-10 text-sm text-gray-500">{t('common.loading', 'Đang tải...')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
        <div className="text-center py-10">
          <div className="text-sm text-red-500 font-medium mb-2">{t('common.error', 'Có lỗi xảy ra')}</div>
          <div className="text-xs text-gray-500">{error}</div>
        </div>
      </div>
    );
  }

  if (!selectedPackage) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
        <div className="text-center py-10 text-sm text-gray-500">
          {t('dashboard.no_packages', 'Không có gói dịch vụ')}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Package className="w-4 h-4 text-orange-500 mr-2" />
          <span className="text-sm text-orange-500 font-semibold">{t('dashboard.services_packages')}</span>
        </div>
        <div className="flex space-x-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {t('dashboard.year', 'Năm')} {year}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Name + status pill + sparkline */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{selectedPackage.packageName}</h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 ring-1 ring-orange-200">
            {getStatusText(selectedPackage.status)}
          </span>
        </div>
        <div className="h-12 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`svcGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f05a29" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#f05a29" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#f05a29" strokeWidth={2} fill={`url(#svcGrad-${uid})`} />
              <XAxis hide dataKey="m" />
              <YAxis hide />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <div className="text-xs text-orange-500 font-medium mb-1">{t('dashboard.status')}</div>
            <div className="text-sm font-semibold text-gray-800">{getStatusText(selectedPackage.status)}</div>
          </div>
          <div>
            <div className="text-xs text-orange-500 font-medium mb-1">{t('dashboard.duration')}</div>
            <div className="text-sm font-semibold text-gray-800">{formatDuration(selectedPackage.duration)}</div>
          </div>
          <div>
            <div className="text-xs text-orange-500 font-medium mb-1">{t('dashboard.quantity_sold')}</div>
            <div className="text-sm font-semibold text-gray-800">
              {formatNumber(selectedPackage.quantitySold)} {t('dashboard.times')}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs text-orange-500 font-medium mb-1">{t('dashboard.unit_price')}</div>
            <div className="text-sm font-semibold text-gray-800">{formatNumber(selectedPackage.unitPrice)}</div>
          </div>
          <div>
            <div className="text-xs text-orange-500 font-medium mb-1">{t('dashboard.total_revenue')}</div>
            <div className="text-sm font-semibold text-gray-800">{formatNumber(selectedPackage.totalRevenue)}</div>
          </div>
          <div>
            <div className="text-xs text-orange-500 font-medium mb-1">{t('dashboard.total_profit')}</div>
            <div className="text-sm font-semibold text-gray-800">{formatNumber(selectedPackage.totalProfit)}</div>
          </div>
        </div>
      </section>
    </div>
  );
};
