import { useCallback, useMemo, useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, RefreshCcw, Layers, CheckCircle2, Settings2, PauseCircle, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

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
import { sortArray } from '@/utils/sort';
import type { SortState } from '@/types/utils/sort';

import type { MembershipPlan, MembershipPlanBranchInfo, MembershipPlanOverride } from '@/types/api/Membership';
import type { MembershipOverrideFormValues, MembershipTemplateFormValues } from '@/types/forms/membership';

type ViewMode = 'all' | 'base' | 'custom';
type StatusFilter = 'all' | 'active' | 'inactive';
type SortField = 'name' | 'price' | 'duration' | 'createdAt' | 'updatedAt' | 'status';

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
  const [sortState, setSortState] = useState<SortState<SortField>>({ field: 'updatedAt', order: 'desc' });
  const [previewContext, setPreviewContext] = useState<PreviewContext | null>(null);
  const [mutatingPlanId, setMutatingPlanId] = useState<string | undefined>();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(true);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [editingBranchId, setEditingBranchId] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);

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
    let filtered = plans.filter((plan: MembershipPlan) => {
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

    // Apply sorting
    if (sortState.field && sortState.order) {
      filtered = sortArray(filtered, sortState, (plan, field) => {
        const resolved = resolvePlanData(plan, currentBranch?._id);

        switch (field) {
          case 'name':
            return resolved.name.toLowerCase();
          case 'price':
            return resolved.price;
          case 'duration':
            return resolved.durationInMonths;
          case 'createdAt':
            return new Date(plan.createdAt).getTime();
          case 'updatedAt':
            return new Date(plan.updatedAt).getTime();
          case 'status':
            return resolved.isActive ? 'active' : 'inactive';
          default:
            return '';
        }
      });
    }

    return filtered;
  }, [plans, searchQuery, statusFilter, viewMode, sortState, currentBranch?._id]);

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

  const handleSortFieldChange = useCallback((field: string) => {
    setSortState((prev) => ({ ...prev, field: field as SortField }));
  }, []);

  const handleSortOrderChange = useCallback((order: string) => {
    setSortState((prev) => ({ ...prev, order: order as 'asc' | 'desc' }));
  }, []);

  const handlePreview = useCallback((plan: MembershipPlan, branchId?: string) => {
    setPreviewContext({ plan, branchId });
    setIsDetailOpen(true);
  }, []);

  const handleEdit = useCallback((plan: MembershipPlan, branchId?: string) => {
    setEditingPlan(plan);
    setEditingBranchId(branchId); // Store branchId context for form
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

  // Helper: Update preview context after successful update
  const updatePreviewContextIfNeeded = useCallback(
    (updatedPlan: MembershipPlan) => {
      if (isDetailOpen && previewContext?.plan._id === updatedPlan._id && updatedPlan) {
        setPreviewContext({
          ...previewContext,
          plan: updatedPlan
        });
      }
    },
    [isDetailOpen, previewContext]
  );

  // Helper: Handle create membership plan
  const handleCreatePlan = useCallback(
    async (data: MembershipTemplateFormValues) => {
      const payload = {
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        price: Number(data.price),
        currency: data.currency.trim().toUpperCase(),
        durationInMonths: Number(data.durationInMonths),
        benefits: parseBenefits(data.benefits),
        branchId: data.branchId,
        isActive: data.isActive
      };

      const response = await membershipApi.createMembershipPlan(payload);

      if (response.success) {
        await refetch();
        setIsFormOpen(false);
        toast.success(t('membershipManager.toast.createSuccess'));
        return { success: true };
      }

      toast.error(response.message || t('membershipManager.toast.createError'));
      return { success: false, message: response.message };
    },
    [refetch, t]
  );

  // Helper: Handle template update
  const handleTemplateUpdate = useCallback(
    async (data: MembershipTemplateFormValues, planId: string) => {
      const updatePayload = {
        updateScope: 'template' as const,
        data: {
          name: data.name.trim(),
          description: data.description.trim() || undefined,
          price: Number(data.price),
          currency: data.currency.trim().toUpperCase(),
          durationInMonths: Number(data.durationInMonths),
          benefits: parseBenefits(data.benefits),
          isActive: data.isActive
        },
        branchId: data.branchId
      };

      const response = await membershipApi.updateMembershipPlan(planId, updatePayload, data.branchId);

      if (response.success) {
        await refetch();
        updatePreviewContextIfNeeded(response.data);
        setIsFormOpen(false);
        toast.success(t('membershipManager.toast.updateSuccess'));
        return { success: true };
      }

      toast.error(response.message || t('membershipManager.toast.updateError'));
      return { success: false, message: response.message };
    },
    [refetch, t, updatePreviewContextIfNeeded]
  );

  // Helper: Handle branch override update
  const handleBranchOverrideUpdate = useCallback(
    async (data: MembershipOverrideFormValues, plan: MembershipPlan) => {
      const updatePayload: {
        updateScope: 'branches';
        targetBranchIds?: string[];
        data?: Record<string, unknown>;
        revertBranchIds?: string[];
      } = {
        updateScope: 'branches' as const
      };

      if (data.targetBranchIds.length > 0) {
        updatePayload.targetBranchIds = data.targetBranchIds;
        updatePayload.data = {
          name: data.name.trim(),
          description: data.description.trim() || undefined,
          price: Number(data.price),
          currency: data.currency.trim().toUpperCase(),
          durationInMonths: Number(data.durationInMonths),
          benefits: parseBenefits(data.benefits),
          isActive: data.isActive
        };
      }

      if (data.revertBranchIds.length > 0) {
        updatePayload.revertBranchIds = data.revertBranchIds;
      }

      const resourceBranchIds = plan.branchId.map((b) => b._id);
      const response = await membershipApi.updateMembershipPlan(plan._id, updatePayload, resourceBranchIds);

      if (response.success) {
        await refetch();
        updatePreviewContextIfNeeded(response.data);
        setIsFormOpen(false);
        toast.success(t('membershipManager.toast.overrideSuccess'));
        return { success: true };
      }

      toast.error(response.message || t('membershipManager.toast.overrideError'));
      return { success: false, message: response.message };
    },
    [refetch, t, updatePreviewContextIfNeeded]
  );

  const handleFormSubmit = useCallback(
    async (data: MembershipTemplateFormValues | MembershipOverrideFormValues) => {
      // Prevent double submission and debounce
      const now = Date.now();
      if (isSubmitting || now - lastSubmitTime < 1000) {
        return { success: false, message: 'Please wait, submission in progress...' };
      }

      setIsSubmitting(true);
      setLastSubmitTime(now);

      let result;

      // Create mode
      if (isCreateMode) {
        result = await handleCreatePlan(data as MembershipTemplateFormValues);
      }
      // Edit mode
      else if (editingPlan) {
        const isTemplateUpdate = 'branchId' in data;

        if (isTemplateUpdate) {
          result = await handleTemplateUpdate(data as MembershipTemplateFormValues, editingPlan._id);
        } else {
          result = await handleBranchOverrideUpdate(data as MembershipOverrideFormValues, editingPlan);
        }
      }
      // Invalid operation
      else {
        toast.error('Invalid operation');
        result = { success: false, message: 'Invalid operation' };
      }

      setIsSubmitting(false);
      return result;
    },
    [
      isCreateMode,
      editingPlan,
      isSubmitting,
      lastSubmitTime,
      handleCreatePlan,
      handleTemplateUpdate,
      handleBranchOverrideUpdate
    ]
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
              sortState={sortState}
              onSortFieldChange={handleSortFieldChange}
              onSortOrderChange={handleSortOrderChange}
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
                    currentBranchId={currentBranch?._id}
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
        onEdit={handleEdit}
      />

      {/* Membership Form */}
      <MembershipForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        isCreateMode={isCreateMode}
        plan={editingPlan || undefined}
        editingBranchId={editingBranchId}
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
