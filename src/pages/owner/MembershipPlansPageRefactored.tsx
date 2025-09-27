import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, RefreshCcw, Layers, CheckCircle2, Settings2, PauseCircle, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { MembershipCard } from '@/components/membership/MembershipCard';
import { MembershipSummary } from '@/components/membership/MembershipSummary';
import { MembershipFilters } from '@/components/membership/MembershipFilters';
import { MembershipDetail } from '@/components/membership/MembershipDetail';
import { useMembershipPlanActions } from '@/hooks/useMembershipPlanActions';

import { useBranch } from '@/contexts/BranchContext';
import { useMembershipPlans } from '@/hooks/useMembershipPlans';
import { resolvePlanData, calculateOverrideCount, getAssignedBranches } from '@/utils/membershipHelpers';

import type { MembershipPlan, MembershipPlanBranchInfo, MembershipPlanOverride } from '@/types/api/Membership';

type ViewMode = 'all' | 'base' | 'custom';
type StatusFilter = 'all' | 'active' | 'inactive';

interface SummaryStat {
  key: string;
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  tone: 'primary' | 'success' | 'info' | 'muted';
}

interface PreviewContext {
  plan: MembershipPlan;
  branchId?: string;
}

export default function MembershipPlansPageRefactored() {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [previewContext, setPreviewContext] = useState<PreviewContext | null>(null);
  const [mutatingPlanId, setMutatingPlanId] = useState<string | undefined>();
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // API hooks
  const {
    plans: plansData,
    loading: isLoading,
    error,
    refetch
  } = useMembershipPlans({
    resourceBranchIds: currentBranch?._id ? [currentBranch._id] : undefined
  });

  const { togglePlanStatus } = useMembershipPlanActions({
    onSuccess: () => {
      setMutatingPlanId(undefined);
      refetch();
    },
    onError: () => {
      setMutatingPlanId(undefined);
    }
  });

  // Computed values
  const plans = plansData || [];
  const branchMap = useMemo(() => {
    const map: Record<string, MembershipPlanBranchInfo> = {};
    plans.forEach((plan: MembershipPlan) => {
      plan.branchId.forEach((branch: MembershipPlanBranchInfo) => {
        map[branch._id] = branch;
      });
    });
    return map;
  }, [plans]);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan: MembershipPlan) => {
      const resolved = resolvePlanData(plan, currentBranch?._id);

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesName = resolved.name.toLowerCase().includes(searchLower);
        const matchesDescription = resolved.description?.toLowerCase().includes(searchLower) || false;
        const matchesBenefits = resolved.benefits.some((benefit) => benefit.toLowerCase().includes(searchLower));

        if (!matchesName && !matchesDescription && !matchesBenefits) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && resolved.isActive !== (statusFilter === 'active')) {
        return false;
      }

      // View mode filter
      if (viewMode === 'base' && !plan.isTemplate) {
        return false;
      }
      if (viewMode === 'custom' && plan.isTemplate) {
        return false;
      }

      return true;
    });
  }, [plans, searchQuery, statusFilter, viewMode, currentBranch?._id]);

  // Summary statistics
  const summaryStats: SummaryStat[] = useMemo(() => {
    const totalPlans = plans.length;
    const activePlans = plans.filter((plan: MembershipPlan) => plan.isActive).length;
    const customVersions = plans.reduce((sum: number, plan: MembershipPlan) => sum + calculateOverrideCount(plan), 0);
    const pausedCustomVersions = plans.reduce((sum: number, plan: MembershipPlan) => {
      const pausedOverrides =
        plan.overrides?.filter((override: MembershipPlanOverride) => !override.isActive).length || 0;
      return sum + pausedOverrides;
    }, 0);

    return [
      {
        key: 'totalPlans',
        label: t('membershipManager.summary.totalPlans'),
        value: totalPlans,
        description: t('membershipManager.summary.totalPlansHint'),
        icon: Layers,
        tone: 'primary'
      },
      {
        key: 'activePlans',
        label: t('membershipManager.summary.activePlans'),
        value: activePlans,
        description: t('membershipManager.summary.activePlansHint'),
        icon: CheckCircle2,
        tone: 'success'
      },
      {
        key: 'customVersions',
        label: t('membershipManager.summary.customVersions'),
        value: customVersions,
        description: t('membershipManager.summary.customVersionsHint'),
        icon: Settings2,
        tone: 'info'
      },
      {
        key: 'pausedCustomVersions',
        label: t('membershipManager.summary.pausedCustomVersions'),
        value: pausedCustomVersions,
        description: t('membershipManager.summary.pausedCustomVersionsHint'),
        icon: PauseCircle,
        tone: 'muted'
      }
    ];
  }, [plans, t]);

  // Event handlers
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handlePreview = useCallback((plan: MembershipPlan, branchId?: string) => {
    setPreviewContext({ plan, branchId });
    setIsDetailOpen(true);
  }, []);

  const handleEdit = useCallback((plan: MembershipPlan) => {
    // TODO: Implement edit functionality
    console.log('Edit plan:', plan);
  }, []);

  const handleToggleStatus = useCallback(
    async (plan: MembershipPlan) => {
      setMutatingPlanId(plan._id);
      await togglePlanStatus(plan);
    },
    [togglePlanStatus]
  );

  const handleCreate = useCallback(() => {
    // TODO: Implement create functionality
    console.log('Create new plan');
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="mt-4">
          <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6 lg:p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="grid w-full gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={`skeleton-summary-${i}`} className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </Card>
                ))}
              </div>
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={`skeleton-card-${i}`} className="p-4">
                    <Skeleton className="h-64 w-full" />
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="mt-4">
          <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6 lg:p-8">
            <div className="text-center py-12">
              <p className="text-red-500">{t('membershipManager.state.error')}</p>
              <Button onClick={handleRefresh} className="mt-4">
                {t('membershipManager.actions.retry')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 lg:px-6">
      <div className="mt-4">
        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t('membershipManager.title')}</h1>
              <p className="text-sm text-slate-600 mt-1">{t('membershipManager.subtitle')}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="rounded-full">
                <RefreshCcw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('membershipManager.actions.refresh')}</span>
              </Button>
              <Button size="sm" onClick={handleCreate} className="rounded-full bg-orange-500 hover:bg-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('membershipManager.actions.create')}</span>
              </Button>
            </div>
          </div>

          {/* Summary Statistics */}
          <MembershipSummary stats={summaryStats} />

          {/* Filters */}
          <div className="mt-8">
            <MembershipFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onRefresh={handleRefresh}
              isLoading={isLoading}
            />
          </div>

          {/* Plans Grid */}
          <div className="mt-8">
            {filteredPlans.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">{t('membershipManager.state.empty')}</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredPlans.map((plan: MembershipPlan) => {
                  const resolved = resolvePlanData(plan, currentBranch?._id);
                  const overrideCount = calculateOverrideCount(plan);
                  const assignedBranches = getAssignedBranches(plan, branchMap);
                  const branchesWithAccess = new Set(assignedBranches.map((branch) => branch._id));

                  return (
                    <MembershipCard
                      key={`plan-${plan._id}`}
                      plan={plan}
                      resolved={resolved}
                      overrideCount={overrideCount}
                      assignedBranches={assignedBranches}
                      branchMap={branchMap}
                      branchesWithAccess={branchesWithAccess}
                      mutatingPlanId={mutatingPlanId}
                      onPreview={handlePreview}
                      onEdit={handleEdit}
                      onToggleStatus={handleToggleStatus}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Membership Detail Dialog */}
      <MembershipDetail
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        plan={previewContext?.plan || null}
        branchId={previewContext?.branchId}
      />
    </div>
  );
}
