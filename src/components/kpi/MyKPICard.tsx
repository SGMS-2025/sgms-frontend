import React from 'react';
import { useTranslation } from 'react-i18next';
import { Target, TrendingUp, TrendingDown, DollarSign, Users, Calendar, Trophy, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { KPIMetricCard } from './KPIMetricCard';
import type { KPIConfigWithAchievement } from '@/types/api/KPI';

interface MyKPICardProps {
  kpiData: KPIConfigWithAchievement;
}

export const MyKPICard: React.FC<MyKPICardProps> = ({ kpiData }) => {
  const { t } = useTranslation();
  const { config, achievement } = kpiData;

  // No achievement rate calculation (no targets)
  const isOnTrack = true; // Always show as on track since no targets

  // Calculate days remaining
  const endDate = new Date(config.endDate);
  const today = new Date();
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  // Format period
  const period = `${new Date(config.startDate).toLocaleDateString('vi-VN')} - ${new Date(config.endDate).toLocaleDateString('vi-VN')}`;

  // No progress calculation (no targets)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('kpi.my_kpi.title', 'KPI Của Tôi')}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {t('kpi.my_kpi.period', 'Kỳ')}: {period}
            </p>
          </div>
        </div>
      </div>

      {/* Overall Achievement Card */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('kpi.overall_achievement', 'Tổng Quan Hoàn Thành')}
          </h3>
          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              isOnTrack ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}
          >
            {isOnTrack ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {isOnTrack ? t('kpi.status.on_track', 'Đang đúng hướng') : t('kpi.status.at_risk', 'Cần chú ý')}
            </span>
          </div>
        </div>

        {/* Actual Revenue */}
        <div className="text-center p-4 bg-orange-50 rounded-lg mb-6">
          <div className="text-sm text-gray-600 mb-1">{t('kpi.actual', 'Thực tế')}</div>
          <div className="text-3xl font-bold text-orange-600">
            {formatCurrency(achievement?.actual?.revenue?.total || 0)}
          </div>
        </div>

        {/* Days Remaining */}
        {daysRemaining > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-700">
              {t('kpi.days_remaining', 'Còn {days} ngày', { days: daysRemaining })}
            </span>
          </div>
        )}
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPIMetricCard
          title={t('kpi.metrics.total_revenue', 'Tổng Doanh Thu')}
          target={0}
          actual={achievement?.actual?.revenue?.total || 0}
          progress={0}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <KPIMetricCard
          title={t('kpi.metrics.new_members', 'Khách Hàng Mới')}
          target={0}
          actual={achievement?.actual?.members?.newMembers || 0}
          progress={0}
          icon={<Users className="w-5 h-5" />}
          isCount
        />
      </div>

      {/* Branch Ranking and PT Sessions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievement?.rankings?.branch && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">{t('kpi.ranking.branch', 'Xếp Hạng Chi Nhánh')}</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 text-center">#{achievement.rankings.branch}</div>
          </div>
        )}
        <KPIMetricCard
          title={t('kpi.metrics.pt_sessions', 'Buổi PT')}
          target={0}
          actual={achievement?.actual?.sessions?.ptSessions || 0}
          progress={0}
          icon={<Target className="w-5 h-5" />}
          isCount
        />
      </div>

      {/* Earnings Summary */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('kpi.earnings.title', 'Thu Nhập Dự Kiến')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">{t('kpi.earnings.commission', 'Hoa Hồng')}</div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(achievement?.commission?.amount || 0)}
            </div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">{t('kpi.earnings.total', 'Tổng')}</div>
            <div className="text-xl font-bold text-orange-600">
              {formatCurrency(achievement?.commission?.amount || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Warning if at risk */}
      {!isOnTrack && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <div className="font-semibold text-red-700 mb-1">{t('kpi.warning.title', 'Cần Chú Ý')}</div>
            <div className="text-sm text-red-600">{t('kpi.warning.message', 'Hãy tiếp tục phấn đấu!')}</div>
          </div>
        </div>
      )}
    </div>
  );
};
