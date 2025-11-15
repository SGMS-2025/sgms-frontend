import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { useBranch } from '@/contexts/BranchContext';
import { formatCurrency, formatNumber } from '@/utils/currency';

const TotalRevenueCard: React.FC<{ revenue: number; growth: number; loading: boolean }> = ({
  revenue,
  growth,
  loading
}) => {
  const { t } = useTranslation();
  const isPositive = growth >= 0;
  const GrowthIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="bg-white rounded-xl p-6 h-full shadow-lg border border-gray-200">
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
                <span>
                  {isPositive ? t('dashboard.cards.trending_up') : t('dashboard.cards.trending_down')}{' '}
                  {t('dashboard.cards.this_month')}
                </span>
              </div>
              <div className="text-xs text-gray-500">{t('dashboard.cards.revenue_current_period')}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const NewCustomersCard: React.FC<{ count: number; growth: number; loading: boolean }> = ({
  count,
  growth,
  loading
}) => {
  const { t } = useTranslation();
  const isPositive = growth >= 0;
  const GrowthIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="bg-white rounded-xl p-6 h-full shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
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
      <div className="mb-6">
        <div className="text-4xl font-bold text-gray-900 mb-2">{loading ? '...' : formatNumber(count)}</div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          {!loading && (
            <>
              <div className={`flex items-center text-sm mb-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                <GrowthIcon className="w-4 h-4 mr-1" />
                <span>
                  {isPositive ? t('dashboard.cards.up') : t('dashboard.cards.down')} {Math.abs(growth).toFixed(1)}%{' '}
                  {t('dashboard.cards.this_period')}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {isPositive
                  ? t('dashboard.cards.strong_acquisition')
                  : t('dashboard.cards.acquisition_needs_attention')}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ActiveAccountsCard: React.FC<{ count: number; growth: number; loading: boolean }> = ({
  count,
  growth,
  loading
}) => {
  const { t } = useTranslation();
  const isPositive = growth >= 0;
  const GrowthIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="bg-white rounded-xl p-6 h-full shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-600">{t('dashboard.cards.active_accounts')}</span>
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
      <div className="mb-6">
        <div className="text-4xl font-bold text-gray-900 mb-2">{loading ? '...' : formatNumber(count)}</div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          {!loading && (
            <>
              <div className={`flex items-center text-sm mb-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                <GrowthIcon className="w-4 h-4 mr-1" />
                <span>
                  {isPositive
                    ? t('dashboard.cards.strong_user_retention')
                    : t('dashboard.cards.retention_needs_attention')}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {isPositive
                  ? t('dashboard.cards.engagement_exceed_targets')
                  : t('dashboard.cards.engagement_below_targets')}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const SectionCards: React.FC = () => {
  const { currentBranch } = useBranch();

  // Memoize params to prevent creating new object on every render
  const dashboardParams = useMemo(
    () => ({
      branchId: currentBranch?._id,
      period: 'month' as const
    }),
    [currentBranch?._id]
  );

  const { summary, loading } = useDashboardSummary(dashboardParams);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <TotalRevenueCard revenue={summary?.totalRevenue || 0} growth={summary?.revenueGrowth || 0} loading={loading} />
      <NewCustomersCard
        count={summary?.newCustomers || 0}
        growth={summary?.newCustomersGrowth || 0}
        loading={loading}
      />
      <ActiveAccountsCard
        count={summary?.activeAccounts || 0}
        growth={summary?.activeAccountsGrowth || 0}
        loading={loading}
      />
    </div>
  );
};
