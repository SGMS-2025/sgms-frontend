import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, Banknote, LayoutDashboard, Users } from 'lucide-react';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { useStaffStats } from '@/hooks/useStaff';
import { customerApi } from '@/services/api/customerApi';
import { formatCurrency, formatNumber } from '@/utils/currency';

export const StatsSidebar: React.FC = () => {
  const { t } = useTranslation();
  const { summary, loading: summaryLoading } = useDashboardSummary({ period: 'month' });
  // Pass memoized empty params so hook fetches global stats immediately (branch-agnostic) without re-fetch loops
  const staffStatsParams = React.useMemo(() => ({}), []);
  const { stats: staffStats, loading: staffLoading } = useStaffStats(staffStatsParams);
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [customerLoading, setCustomerLoading] = useState(true);

  const totalStaff = staffStats?.totalStaff ?? 0;

  useEffect(() => {
    const fetchCustomerCount = async () => {
      try {
        setCustomerLoading(true);
        const response = await customerApi.getCustomerList({ limit: 1, page: 1 });
        if (response.success && response.data?.pagination) {
          setCustomerCount(response.data.pagination.totalItems || 0);
        }
      } catch (error) {
        // Error is not critical, just log it
        console.warn('Failed to fetch customer count:', error);
      } finally {
        setCustomerLoading(false);
      }
    };

    fetchCustomerCount();
  }, []);

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white shadow-md">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 text-orange-500">
        <LayoutDashboard className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-[0.12em]">{t('dashboard.customer_staff_stats')}</span>
      </div>

      <div className="flex flex-col gap-4 px-5 py-5">
        <div>
          <p className="text-sm font-semibold text-gray-900">{t('dashboard.all_branch_title')}</p>
          <p className="text-xs text-gray-500">{t('dashboard.all_branch_subtitle')}</p>
        </div>

        <div className="grid gap-3">
          <div className="rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm">
                  <Banknote className="h-5 w-5" />
                </div>
                <div className="min-w-0 leading-snug">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                    {t('dashboard.all_branches_revenue')}
                  </p>
                  <p className="text-xs text-gray-500 whitespace-normal break-words">
                    {t('dashboard.all_branches_revenue_desc')}
                  </p>
                </div>
              </div>
              <div className="w-full text-center text-2xl font-bold text-gray-900 tabular-nums">
                {summaryLoading ? '...' : formatCurrency(summary?.totalRevenue ?? 0)}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500 text-white shadow-sm">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                    {t('dashboard.all_branches_customers')}
                  </p>
                  <p className="text-xs text-gray-500">{t('dashboard.all_branches_customers_desc')}</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 tabular-nums">
                {customerLoading ? '...' : formatNumber(customerCount)}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {t('dashboard.all_branches_staff')}
                  </p>
                  <p className="text-xs text-gray-500">{t('dashboard.all_branches_staff_desc')}</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 tabular-nums">
                {staffLoading ? '...' : formatNumber(totalStaff)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
