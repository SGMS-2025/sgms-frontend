import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrainingProgressChart } from '@/components/pt/TrainingProgressChart';
import { TrainingProgressRadarChart } from '@/components/pt/TrainingProgressRadarChart';
import { TrainingLogTable } from '@/components/pt/TrainingLogTable';
import { GoalCard } from '@/components/pt/GoalCard';
import { useUser } from '@/hooks/useAuth';
import { useTrainingProgress } from '@/hooks/useTrainingProgress';
import { useCustomerGoal } from '@/hooks/useCustomerGoal';
import { useMealPlans } from '@/hooks/useMealPlans';
import type { CustomerStats } from '@/types/forms/Progress';

export default function CustomerProgress() {
  const { t } = useTranslation();
  const user = useUser();

  // Only use customerId from user object, don't fallback to _id
  // Backend will handle userId -> customerId mapping if needed
  const customerId = (user as { customerId?: string })?.customerId || '';
  const customerName =
    (user as { fullName?: string; name?: string })?.fullName || (user as { name?: string })?.name || t('common.me');

  const {
    progressList,
    loading: progressLoading,
    error: progressError,
    getCustomerStats
  } = useTrainingProgress({
    customerId,
    limit: 50,
    sortBy: 'trackingDate',
    sortOrder: 'desc'
  });

  const { activeGoal, loading: goalLoading, error: goalError } = useCustomerGoal(customerId || undefined);

  const mealPlanParams = useMemo(
    () => ({
      customerId: customerId || '',
      customerGoalId: activeGoal?.id,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
      limit: 12
    }),
    [customerId, activeGoal?.id]
  );
  const { items: mealPlans, loading: mealPlanLoading, error: mealPlanError } = useMealPlans(mealPlanParams);

  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      if (!customerId) {
        setCustomerStats(null);
        setStatsError(null);
        return;
      }

      setStatsLoading(true);
      setStatsError(null);

      try {
        const res = await getCustomerStats(customerId, { days: 30 });
        if (!cancelled) {
          if (res.success) {
            setCustomerStats(res.data);
            setStatsError(null);
          } else {
            setCustomerStats(null);
            setStatsError(res.message || 'Failed to load stats');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setCustomerStats(null);
          setStatsError(err instanceof Error ? err.message : 'Failed to load stats');
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [customerId, getCustomerStats]);

  const recordsWithMeasurements = useMemo(
    () =>
      progressList.filter(
        (r) =>
          r.chest ||
          r.waist ||
          r.hips ||
          r.arms ||
          r.thighs ||
          r.bodyFatPercentage ||
          r.muscleMassPercentage ||
          r.bodyWaterPercentage ||
          r.metabolicAge
      ),
    [progressList]
  );

  const radarCurrentData = recordsWithMeasurements[0] || progressList[0] || null;
  const radarFirstData = useMemo(() => {
    if (!progressList.length) return null;
    const baseline =
      recordsWithMeasurements.length > 1
        ? recordsWithMeasurements[recordsWithMeasurements.length - 1]
        : progressList[progressList.length - 1];
    if (!baseline) return null;
    if (radarCurrentData && baseline.id && radarCurrentData.id && baseline.id === radarCurrentData.id) {
      return null;
    }
    return baseline;
  }, [progressList, recordsWithMeasurements, radarCurrentData]);

  const chartData = progressList.map((progress) => ({
    date: progress.date,
    weight: progress.weight,
    strength: progress.strength
  }));

  // Show loading state
  const isLoading = progressLoading || goalLoading || statsLoading;

  // Combine all errors
  const hasError = progressError || goalError || mealPlanError || statsError;
  const errorMessage = progressError || goalError || mealPlanError || statsError || '';

  if (!customerId) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-800">
            <p className="text-sm font-medium">{t('progress_detail.error.no_customer', 'Không tìm thấy khách hàng')}</p>
            <p className="text-xs mt-1">
              {t('progress_detail.error.no_customer_hint', 'Vui lòng đăng nhập lại hoặc liên hệ hỗ trợ')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasError && !isLoading) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-800">
            <p className="font-medium">{t('training_progress.error_loading', 'Lỗi khi tải dữ liệu')}</p>
            <p className="text-sm mt-1">{errorMessage}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading && progressList.length === 0) {
    return (
      <div className="min-h-screen bg-[#f1f3f4] p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F05A29] mx-auto mb-4"></div>
              <p className="text-gray-600">{t('common.loading', 'Đang tải...')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#101D33]">{t('progress_detail.breadcrumb.progress')}</h1>
          <p className="text-sm text-gray-600">{customerName}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600">{t('progress_detail.stats.weight_now')}</p>
              {statsLoading || progressLoading ? (
                <div className="animate-pulse h-8 bg-gray-200 rounded mt-2"></div>
              ) : (
                <p className="text-2xl font-bold text-[#101D33]">
                  {customerStats?.currentWeight || progressList[0]?.weight || t('progress_detail.stats.not_available')}{' '}
                  {customerStats?.currentWeight || progressList[0]?.weight ? t('progress_detail.stats.kg') : ''}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600">{t('progress_detail.stats.strength_score')}</p>
              {statsLoading || progressLoading ? (
                <div className="animate-pulse h-8 bg-gray-200 rounded mt-2"></div>
              ) : (
                <p className="text-2xl font-bold text-[#101D33]">
                  {customerStats?.currentStrengthScore ||
                    progressList[0]?.strength ||
                    t('progress_detail.stats.not_available')}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600">{t('progress_detail.stats.bmi')}</p>
              {statsLoading || progressLoading ? (
                <div className="animate-pulse h-8 bg-gray-200 rounded mt-2"></div>
              ) : (
                <p className="text-2xl font-bold text-[#101D33]">
                  {customerStats?.currentBMI || progressList[0]?.bmi || t('progress_detail.stats.not_available')}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600">{t('progress_detail.stats.last_updated')}</p>
              {progressLoading ? (
                <div className="animate-pulse h-6 bg-gray-200 rounded mt-2"></div>
              ) : (
                <p className="text-sm font-medium text-[#101D33]">
                  {progressList[0]?.date || t('progress_detail.stats.not_available')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Goal (read-only) */}
        <GoalCard goal={activeGoal} currentProgress={radarCurrentData} />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrainingProgressRadarChart currentData={radarCurrentData} previousData={radarFirstData} />
          <Card>
            <CardHeader className="pb-4">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold text-[#101D33]">{t('progress_detail.chart.title')}</CardTitle>
                <CardDescription className="text-gray-600">
                  {t('progress_detail.chart.description', 'Track weight and strength over time')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pb-10">
              <TrainingProgressChart data={chartData} />
            </CardContent>
          </Card>
        </div>

        {/* Training logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#101D33]">{t('progress_detail.table.title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <TrainingLogTable logs={progressList} readOnly />
          </CardContent>
        </Card>

        {/* Meal plans read-only list */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold text-[#101D33]">{t('progress_detail.meal_plan.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mealPlanLoading ? (
              <p className="text-gray-600">{t('progress_detail.meal_plan.loading')}</p>
            ) : mealPlans.length === 0 ? (
              <p className="text-gray-600">{t('progress_detail.meal_plan.empty')}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {mealPlans.map((plan) => (
                  <div key={plan._id} className="border rounded-lg p-3 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-[#101D33] line-clamp-1">{plan.name || 'Meal Plan'}</div>
                      <Badge variant="secondary" className="capitalize">
                        {(plan.status ?? 'unknown').toLowerCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        {t('progress_detail.meal_plan.card.created_at', {
                          value: new Date(plan.createdAt).toLocaleDateString('vi-VN')
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
