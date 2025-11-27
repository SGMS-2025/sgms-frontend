import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Loader2 } from 'lucide-react';
import { useBranch } from '@/contexts/BranchContext';
import { formatNumber } from '@/utils/currency';
import { kpiApi } from '@/services/api/kpiApi';
import type { KPILeaderboardItem } from '@/types/api/KPI';

export const KPILeaderboard: React.FC = () => {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();
  const [leaderboardData, setLeaderboardData] = useState<KPILeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await kpiApi.getLeaderboard({
          branchId: currentBranch?._id,
          limit: 5
        });

        if (response.success && response.data) {
          setLeaderboardData(response.data);
        } else {
          setError(response.message || 'Failed to fetch leaderboard');
          setLeaderboardData([]);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to fetch leaderboard');
        setLeaderboardData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentBranch?._id]);

  const getRankBadgeStyle = (rank: number): string => {
    if (rank === 1) return 'bg-orange-500 text-white';
    if (rank === 2) return 'bg-gray-200 text-gray-800';
    if (rank === 3) return 'bg-amber-200 text-amber-900';
    return 'bg-gray-100 text-gray-700';
  };

  const formatRevenue = (value: number) => `${formatNumber(value)} đ`;

  return (
    <div
      className="bg-white rounded-2xl p-5 shadow-md border border-gray-200 h-full flex flex-col"
      data-tour="overview-kpi-leaderboard"
    >
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center">
          <Trophy className="w-4 h-4 text-orange-500 mr-2" />
          <span className="text-sm text-orange-500 font-semibold">
            {t('dashboard.kpi_leaderboard', 'BẢNG XẾP HẠNG KPI')}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-8 inline-flex items-center px-3 text-xs font-semibold rounded-full border border-orange-200 bg-orange-50 text-orange-600 leading-none">
            {t('dashboard.kpi_top_badge', 'Top 5 theo KPI')}
          </div>
          <div className="h-8 inline-flex items-center px-3 text-xs rounded-lg border border-gray-200 text-gray-700 bg-gray-50 leading-none">
            {currentBranch?.branchName || t('dashboard.all_branches_label', 'Tất cả chi nhánh')}
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-gray-100 flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-sm text-gray-500">{error}</div>
        ) : leaderboardData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-sm text-gray-500">
            {t('dashboard.no_leaderboard_data', 'Chưa có dữ liệu xếp hạng')}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[56px_repeat(4,minmax(0,1fr))] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50">
              <div className="text-center">#</div>
              <div className="text-left">{t('dashboard.staff', 'Nhân viên')}</div>
              <div className="text-center">{t('dashboard.kpi_score', 'Điểm')}</div>
              <div className="text-center">{t('dashboard.kpi_completion', 'KPI')}</div>
              <div className="text-right">{t('dashboard.kpi_revenue', 'Doanh thu')}</div>
            </div>
            <div className="divide-y divide-gray-100">
              {leaderboardData.map((staff, index) => (
                <div
                  key={staff.id}
                  className="grid grid-cols-[56px_repeat(4,minmax(0,1fr))] px-5 py-3 items-center text-sm"
                >
                  <div className="flex justify-center">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getRankBadgeStyle(index + 1)}`}
                    >
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="font-semibold text-gray-900">{staff.name}</div>
                    <div className="text-xs text-gray-500">{staff.role}</div>
                  </div>
                  <div className="text-center font-semibold text-gray-900">{staff.score}</div>
                  <div className="flex justify-center">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-100">
                      {staff.completion}%
                    </span>
                  </div>
                  <div className="text-right font-semibold text-gray-900">{formatRevenue(staff.revenue)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
