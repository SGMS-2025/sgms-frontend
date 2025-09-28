import { useCallback, useMemo, useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, RefreshCcw, Layers, CheckCircle2, Settings2, PauseCircle, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

import { MembershipCard } from '@/components/membership/MembershipCard';
import { MembershipSummary } from '@/components/membership/MembershipSummary';
import { MembershipFilters } from '@/components/membership/MembershipFilters';
import { MembershipDetail } from '@/components/membership/MembershipDetail';
import { MembershipForm } from '@/components/membership/MembershipForm';
import { useMembershipPlanActions } from '@/hooks/useMembershipPlanActions';

import { useBranch } from '@/contexts/BranchContext';
import { useMembershipPlans } from '@/hooks/useMembershipPlans';
import { resolvePlanData, calculateOverrideCount, getAssignedBranches } from '@/utils/membershipHelpers';
import { membershipApi } from '@/services/api/membershipApi';
import { parseBenefits } from '@/utils/membership';

import type { MembershipPlan, MembershipPlanBranchInfo, MembershipPlanOverride } from '@/types/api/Membership';
import type { MembershipOverrideFormValues, MembershipTemplateFormValues } from '@/types/forms/membership';

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

export default function MembershipPlansPage() {
  const { t } = useTranslation();
  const { currentBranch, branches } = useBranch();
  const skeletonId = useId();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [previewContext, setPreviewContext] = useState<PreviewContext | null>(null);
  const [mutatingPlanId, setMutatingPlanId] = useState<string | undefined>();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(true);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setEditingPlan(plan);
    setIsCreateMode(false);
    setIsFormOpen(true);
  }, []);

  const handleToggleStatus = useCallback(
    async (plan: MembershipPlan) => {
      setMutatingPlanId(plan._id);
      await togglePlanStatus(plan);
    },
    [togglePlanStatus]
  );

  const handleCreate = useCallback(() => {
    setEditingPlan(null);
    setIsCreateMode(true);
    setIsFormOpen(true);
  }, []);

  const handleFormSubmit = useCallback(
    async (data: MembershipTemplateFormValues | MembershipOverrideFormValues) => {
      if (isCreateMode) {
        const templateData = data as MembershipTemplateFormValues;
        const payload = {
          name: templateData.name.trim(),
          description: templateData.description.trim() || undefined,
          price: Number(templateData.price),
          currency: templateData.currency.trim().toUpperCase(),
          durationInMonths: Number(templateData.durationInMonths),
          benefits: parseBenefits(templateData.benefits),
          branchId: templateData.branchId,
          isActive: templateData.isActive
        };

        try {
          const response = await membershipApi.createMembershipPlan(payload);
          if (response.success) {
            await refetch();
            setIsFormOpen(false);
            return { success: true };
          }
          return { success: false, message: response.message };
        } catch (error) {
          console.error('Error creating membership plan:', error);
          return { success: false, message: 'Failed to create membership plan' };
        }
      } else if (editingPlan) {
        // Handle edit logic here
        // This would need to be implemented based on the specific requirements
        return { success: true };
      }
      return { success: false, message: 'Invalid operation' };
    },
    [isCreateMode, editingPlan, refetch]
  );

  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setEditingPlan(null);
    setIsSubmitting(false);
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
                  <Card key={`${skeletonId}-summary-${i}`} className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </Card>
                ))}
              </div>
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={`${skeletonId}-card-${i}`} className="p-4">
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
      <DashboardHeader />
      <div className="mt-4">
        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('membershipManager.hero.badge')}
                </span>
                <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-gray-900">{t('membershipManager.title')}</h2>
                <p className="mt-1 text-sm text-gray-500">{t('membershipManager.subtitle')}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  variant="outline"
                  className="rounded-full border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-500"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCcw className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">{t('membershipManager.actions.refresh')}</span>
                </Button>
                <Button
                  className="h-11 rounded-full bg-orange-500 px-4 sm:px-6 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
                  onClick={handleCreate}
                >
                  <Plus className="h-4 w-4" />
                  <span className="ml-2">{t('membershipManager.actions.create')}</span>
                </Button>
              </div>
            </div>

            {/* Summary Statistics */}
            <MembershipSummary stats={summaryStats} />
          </div>

          {/* Filters */}
          <div className="mb-8">
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
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredPlans.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                {t('membershipManager.state.empty')}
              </div>
            ) : (
              filteredPlans.map((plan: MembershipPlan) => {
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
              })
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

      {/* Membership Form */}
      <MembershipForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        isCreateMode={isCreateMode}
        plan={editingPlan || undefined}
        branchOptions={
          branches?.map((branch) => ({
            _id: branch._id,
            branchName: branch.branchName,
            location: branch.location,
            ownerId: typeof branch.ownerId === 'string' ? branch.ownerId : branch.ownerId?._id || ''
          })) || []
        }
        branchMap={branchMap}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
