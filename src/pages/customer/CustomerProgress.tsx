import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Header,
  ProgressSummaryCard,
  TrainingChart,
  FilterBar,
  TrainingLogTable,
  EmptyState
} from '@/components/customer/training/training-components';
import { useTrainingProgressDashboard } from '@/hooks/useCustomerTrainingProgress';

export default function CustomerProgress() {
  const { t } = useTranslation();
  const {
    // State
    currentPage,

    // Setters
    setCurrentPage,
    setDateRange,

    // Data
    progressItems,
    pagination,
    stats,
    trendData,

    // Loading states
    progressLoading,
    statsLoading,
    trendLoading,

    // Errors
    progressError,
    statsError,
    trendError
  } = useTrainingProgressDashboard();

  // Tạo summary từ stats + latest progress item
  const summary = React.useMemo(() => {
    if (!stats && (!progressItems || progressItems.length === 0)) return null;

    // Lấy record mới nhất từ progress list (đã sorted by date desc)
    const latestProgress = progressItems && progressItems.length > 0 ? progressItems[0] : null;

    // Normalize values to avoid `null` (convert null -> undefined) so types match the Summary prop
    const currentWeight: number | undefined =
      latestProgress && latestProgress.weightKg != null ? latestProgress.weightKg : (stats?.avgWeight ?? undefined);

    const currentBMI: number | undefined =
      latestProgress && latestProgress.bmi != null ? latestProgress.bmi : (stats?.avgBMI ?? undefined);

    const currentStrength: number | undefined =
      latestProgress && latestProgress.strengthScore != null ? latestProgress.strengthScore : undefined;

    const lastUpdatedAt: string | undefined = latestProgress?.date ?? undefined;

    return {
      currentWeight,
      currentBMI,
      currentStrength,
      lastUpdatedAt
    };
  }, [stats, progressItems]);

  // Handle filter change
  const handleFilterChange = React.useCallback(
    (filters: { from?: string; to?: string }) => {
      setDateRange(filters);
      setCurrentPage(1); // Reset về trang 1 khi filter thay đổi
    },
    [setDateRange, setCurrentPage]
  );

  // Show error state
  if (progressError || statsError || trendError) {
    return (
      <div className="space-y-6">
        <Header title={t('training_progress.title')} />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-medium">{t('training_progress.error_loading')}</p>
          <p className="mt-1 text-sm">{progressError || statsError || trendError}</p>
        </div>
      </div>
    );
  }

  // Show empty state when no data
  const hasNoData = !progressLoading && (!progressItems || progressItems.length === 0);

  return (
    <div className="space-y-6">
      <Header title={t('training_progress.title')} />

      {/* Summary Cards */}
      <ProgressSummaryCard summary={summary} loading={statsLoading || progressLoading} />

      {/* Chart */}
      <TrainingChart data={trendData} loading={trendLoading} />

      {/* Filters */}
      <FilterBar onChange={handleFilterChange} />

      {/* Training Log Table or Empty State */}
      {hasNoData ? (
        <EmptyState />
      ) : (
        <TrainingLogTable
          data={progressItems || []}
          page={currentPage}
          totalPages={pagination?.totalPages || 1}
          loading={progressLoading}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
