import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Trophy,
  AlertCircle,
  Award,
  FileText,
  MapPin,
  BarChart3
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { KPIMetricCard } from './KPIMetricCard';
import { KPIDetailModal } from './KPIDetailModal';
import type { KPIConfigWithAchievement, KPITargets, KPIActual, KPIReward } from '@/types/api/KPI';

interface MyKPICardProps {
  kpiData: KPIConfigWithAchievement;
}

export const MyKPICard: React.FC<MyKPICardProps> = ({ kpiData }) => {
  const { t } = useTranslation();
  const { config, achievement } = kpiData;
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

  // Calculate achievement status
  const targets: KPITargets = config.targets || { revenue: 0, newMembers: 0, ptSessions: 0, contracts: 0 };
  const actual: KPIActual = achievement?.actual || {
    revenue: { total: 0, newMember: 0, ptSession: 0, vipRevenue: 0 },
    members: { newMembers: 0, vipNewMembers: 0 },
    sessions: { ptSessions: 0, vipPtSessions: 0 },
    contracts: { total: 0 }
  };
  const hasTargets = targets.revenue > 0 || targets.newMembers > 0 || targets.ptSessions > 0 || targets.contracts > 0;

  // Check if targets are met
  const checks = {
    revenue: !targets.revenue || (actual.revenue.total || 0) >= targets.revenue,
    newMembers: !targets.newMembers || (actual.members.newMembers || 0) >= targets.newMembers,
    ptSessions: !targets.ptSessions || (actual.sessions.ptSessions || 0) >= targets.ptSessions,
    contracts: !targets.contracts || (actual.contracts.total || 0) >= targets.contracts
  };

  const allTargetsMet = Object.values(checks).every((check) => check === true);
  const isOnTrack = !hasTargets || allTargetsMet;
  const achievementStatus = achievement?.status || 'IN_PROGRESS';

  // Calculate days remaining
  const endDate = new Date(config.endDate);
  const today = new Date();
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  // Format period
  const period = `${new Date(config.startDate).toLocaleDateString('vi-VN')} - ${new Date(config.endDate).toLocaleDateString('vi-VN')}`;

  // Calculate progress percentages
  const revenueProgress =
    targets.revenue > 0 ? Math.min(100, ((actual.revenue.total || 0) / targets.revenue) * 100) : 0;
  const newMembersProgress =
    targets.newMembers > 0 ? Math.min(100, ((actual.members.newMembers || 0) / targets.newMembers) * 100) : 0;
  const ptSessionsProgress =
    targets.ptSessions > 0 ? Math.min(100, ((actual.sessions.ptSessions || 0) / targets.ptSessions) * 100) : 0;
  const contractsProgress =
    targets.contracts > 0 ? Math.min(100, ((actual.contracts.total || 0) / targets.contracts) * 100) : 0;

  // Get branch name
  const branchName =
    typeof config.branchId === 'object' && config.branchId?.branchName ? config.branchId.branchName : 'N/A';

  // Reward info
  const reward: KPIReward | undefined = config.reward;
  const rewardAmount = achievement?.reward?.amount || 0;
  const hasReward = reward?.type && reward.type !== 'NONE';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{t('kpi.my_kpi.title', 'KPI Của Tôi')}</h2>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {t('kpi.my_kpi.period', 'Kỳ')}: {period}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>
                  {t('kpi.my_kpi.branch', 'Chi nhánh')}: {branchName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    achievementStatus === 'ACHIEVED'
                      ? 'bg-green-100 text-green-800'
                      : achievementStatus === 'FAILED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {achievementStatus === 'ACHIEVED'
                    ? t('kpi.status.achieved', 'Đã đạt')
                    : achievementStatus === 'FAILED'
                      ? t('kpi.status.failed', 'Không đạt')
                      : t('kpi.status.in_progress', 'Đang thực hiện')}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsDetailModalOpen(true)}
            className="ml-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>{t('kpi.actions.view_detail', 'Xem chi tiết')}</span>
          </button>
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
        <div className="text-center p-4 bg-orange-50 rounded-lg mb-4">
          <div className="text-sm text-gray-600 mb-1">{t('kpi.actual', 'Thực tế')}</div>
          <div className="text-3xl font-bold text-orange-600">{formatCurrency(actual.revenue.total || 0)}</div>
          {targets.revenue > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              {t('kpi.target', 'Mục tiêu')}: {formatCurrency(targets.revenue)}
            </div>
          )}
        </div>

        {/* Progress Bar for Revenue */}
        {targets.revenue > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{t('kpi.progress', 'Tiến độ')}</span>
              <span>{revenueProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  revenueProgress >= 100 ? 'bg-green-500' : revenueProgress >= 50 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, revenueProgress)}%` }}
              />
            </div>
          </div>
        )}

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

      {/* Targets and Actuals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIMetricCard
          title={t('kpi.metrics.total_revenue', 'Tổng Doanh Thu')}
          target={targets.revenue || 0}
          actual={actual.revenue.total || 0}
          progress={revenueProgress}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <KPIMetricCard
          title={t('kpi.metrics.new_members', 'Khách Hàng Mới')}
          target={targets.newMembers || 0}
          actual={actual.members.newMembers || 0}
          progress={newMembersProgress}
          icon={<Users className="w-5 h-5" />}
          isCount
        />
        <KPIMetricCard
          title={t('kpi.metrics.pt_sessions', 'Buổi PT')}
          target={targets.ptSessions || 0}
          actual={actual.sessions.ptSessions || 0}
          progress={ptSessionsProgress}
          icon={<Target className="w-5 h-5" />}
          isCount
        />
        <KPIMetricCard
          title={t('kpi.metrics.contracts', 'Hợp Đồng')}
          target={targets.contracts || 0}
          actual={actual.contracts.total || 0}
          progress={contractsProgress}
          icon={<FileText className="w-5 h-5" />}
          isCount
        />
      </div>

      {/* Branch Ranking */}
      {achievement?.rankings?.branch && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">{t('kpi.ranking.branch', 'Xếp Hạng Chi Nhánh')}</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 text-center">#{achievement.rankings.branch}</div>
        </div>
      )}

      {/* Earnings Summary */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          {t('kpi.earnings.title', 'Thu Nhập')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">{t('kpi.earnings.commission', 'Hoa Hồng')}</div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(achievement?.commission?.amount || 0)}
            </div>
            {achievement?.commission?.applicableRate && (
              <div className="text-xs text-gray-500 mt-1">
                {t('kpi.earnings.rate', 'Tỷ lệ')}: {achievement.commission.applicableRate.toFixed(1)}%
              </div>
            )}
          </div>
          {hasReward && achievementStatus === 'ACHIEVED' && (
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1 flex items-center justify-center gap-1">
                <Award className="w-4 h-4 text-green-600" />
                {t('kpi.earnings.reward', 'Thưởng')}
              </div>
              <div className="text-xl font-bold text-green-600">
                {reward?.type === 'FIXED_AMOUNT' && rewardAmount > 0
                  ? formatCurrency(rewardAmount)
                  : reward?.type === 'PERCENTAGE_BONUS' && rewardAmount > 0
                    ? `${rewardAmount}%`
                    : reward?.type === 'VOUCHER'
                      ? t('kpi.reward.voucher', 'Voucher')
                      : formatCurrency(0)}
              </div>
            </div>
          )}
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">{t('kpi.earnings.total', 'Tổng')}</div>
            <div className="text-xl font-bold text-orange-600">
              {formatCurrency(
                (achievement?.commission?.amount || 0) + (achievementStatus === 'ACHIEVED' ? rewardAmount : 0)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Targets Summary */}
      {hasTargets && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('kpi.targets.title', 'Mục Tiêu KPI')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {targets.revenue > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">{t('kpi.targets.revenue', 'Doanh thu')}</div>
                <div className="text-lg font-bold text-blue-600">{formatCurrency(targets.revenue)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {t('kpi.actual', 'Thực tế')}: {formatCurrency(actual.revenue.total || 0)}
                </div>
              </div>
            )}
            {targets.newMembers > 0 && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">{t('kpi.targets.new_members', 'Khách hàng mới')}</div>
                <div className="text-lg font-bold text-green-600">{targets.newMembers}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {t('kpi.actual', 'Thực tế')}: {actual.members.newMembers || 0}
                </div>
              </div>
            )}
            {targets.ptSessions > 0 && (
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">{t('kpi.targets.pt_sessions', 'Buổi PT')}</div>
                <div className="text-lg font-bold text-orange-600">{targets.ptSessions}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {t('kpi.actual', 'Thực tế')}: {actual.sessions.ptSessions || 0}
                </div>
              </div>
            )}
            {targets.contracts > 0 && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">{t('kpi.targets.contracts', 'Hợp đồng')}</div>
                <div className="text-lg font-bold text-purple-600">{targets.contracts}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {t('kpi.actual', 'Thực tế')}: {actual.contracts.total || 0}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reward Info */}
      {hasReward && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            {t('kpi.reward.title', 'Thưởng Khi Đạt KPI')}
          </h3>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">
              {reward?.type === 'FIXED_AMOUNT'
                ? t('kpi.reward.fixed_amount', 'Thưởng cố định')
                : reward?.type === 'PERCENTAGE_BONUS'
                  ? t('kpi.reward.percentage_bonus', 'Thưởng % thêm vào hoa hồng')
                  : reward?.type === 'VOUCHER'
                    ? t('kpi.reward.voucher', 'Voucher/Phiếu quà tặng')
                    : t('kpi.reward.none', 'Không có thưởng')}
            </div>
            {reward?.type === 'FIXED_AMOUNT' && reward.amount > 0 && (
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(reward.amount)}</div>
            )}
            {reward?.type === 'PERCENTAGE_BONUS' && reward.percentage > 0 && (
              <div className="text-2xl font-bold text-yellow-600">{reward.percentage}%</div>
            )}
            {reward?.type === 'VOUCHER' && reward.voucherDetails && (
              <div className="text-sm text-gray-700">{reward.voucherDetails}</div>
            )}
            {achievementStatus === 'ACHIEVED' && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                ✓ {t('kpi.reward.achieved', 'Đã đạt - Nhận thưởng')}
              </div>
            )}
            {achievementStatus !== 'ACHIEVED' && hasTargets && (
              <div className="mt-2 text-xs text-gray-500">
                {t('kpi.reward.pending', 'Hoàn thành mục tiêu để nhận thưởng')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warning if at risk */}
      {!isOnTrack && hasTargets && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <div className="font-semibold text-red-700 mb-1">{t('kpi.warning.title', 'Cần Chú Ý')}</div>
            <div className="text-sm text-red-600">
              {(() => {
                // Calculate the amount needed for revenue target
                if (targets.revenue > 0) {
                  const actualRevenue = actual.revenue.total || 0;
                  const remaining = targets.revenue - actualRevenue;
                  if (remaining > 0) {
                    return t('kpi.warning.message', 'Bạn cần thêm {{amount}} để đạt KPI!', {
                      amount: formatCurrency(remaining)
                    });
                  }
                }
                // For other targets, show generic message
                return t('kpi.warning.message_generic', 'Hãy tiếp tục phấn đấu để đạt mục tiêu!');
              })()}
            </div>
          </div>
        </div>
      )}

      {/* KPI Detail Modal */}
      <KPIDetailModal kpiId={config._id} isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} />
    </div>
  );
};
