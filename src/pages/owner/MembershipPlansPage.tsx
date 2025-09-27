import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';
import {
  Loader2,
  Plus,
  RefreshCcw,
  Edit,
  Eye,
  Power,
  Layers,
  CheckCircle2,
  Settings2,
  PauseCircle,
  Undo2,
  Sparkles,
  Search,
  Clock3,
  MoreHorizontal,
  CheckCircle,
  Circle
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { useBranch } from '@/contexts/BranchContext';
import { useMembershipPlans } from '@/hooks/useMembershipPlans';
import { membershipApi } from '@/services/api/membershipApi';
import { buildDefaultFormValues, buildOverrideFormValues, formatCurrency, parseBenefits } from '@/utils/membership';
import type {
  MembershipPlan,
  MembershipPlanBranchInfo,
  MembershipPlanOverride,
  MembershipPlanUpdateScope,
  UpdateMembershipPlanPayload
} from '@/types/api/Membership';
import type { MembershipOverrideFormValues, MembershipTemplateFormValues } from '@/types/forms/membership';

type ViewMode = 'all' | 'base' | 'custom';
type StatusFilter = 'all' | 'active' | 'inactive';
type ResolvedSource = 'template' | 'override';
type SummaryTone = 'primary' | 'success' | 'info' | 'muted';

interface PlanResolvedData {
  name: string;
  description?: string;
  price: number;
  currency: string;
  durationInMonths: number;
  benefits: string[];
  isActive: boolean;
  source: ResolvedSource;
  override?: MembershipPlanOverride;
}

interface SummaryStat {
  key: string;
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  tone: SummaryTone;
}

interface PreviewContext {
  plan: MembershipPlan;
  branchId?: string;
}

const initialTemplateForm: MembershipTemplateFormValues = {
  name: '',
  description: '',
  price: '',
  currency: 'VND',
  durationInMonths: '1',
  benefits: '',
  branchId: [],
  isActive: true
};

const initialOverrideForm: MembershipOverrideFormValues = {
  name: '',
  description: '',
  price: '',
  currency: 'VND',
  durationInMonths: '1',
  benefits: '',
  targetBranchIds: [],
  revertBranchIds: [],
  isActive: true
};

const resolvePlanData = (plan: MembershipPlan, branchId?: string): PlanResolvedData => {
  if (branchId) {
    const override = plan.overrides?.find((item) => item.appliesToBranchId === branchId);
    if (override) {
      return {
        name: override.name,
        description: override.description ?? plan.description,
        price: override.price,
        currency: override.currency,
        durationInMonths: override.durationInMonths,
        benefits: override.benefits.length ? override.benefits : plan.benefits,
        isActive: override.isActive,
        source: 'override',
        override
      };
    }
  }

  return {
    name: plan.name,
    description: plan.description,
    price: plan.price,
    currency: plan.currency,
    durationInMonths: plan.durationInMonths,
    benefits: plan.benefits,
    isActive: plan.isActive,
    source: 'template',
    override: undefined
  };
};

const formatDateTime = (value: string, locale: string) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getBranchName = (
  branch: MembershipPlanBranchInfo,
  branchMap: Map<string, { branchName: string; location: string }>
) => {
  const fallbackName = branch.branchName || branch._id;
  const contextBranch = branchMap.get(branch._id);

  return {
    name: contextBranch?.branchName ?? fallbackName,
    location: contextBranch?.location ?? branch.location ?? ''
  };
};

const matchesStatusFilter = (plan: MembershipPlan, filter: StatusFilter) => {
  if (filter === 'active') {
    return plan.isActive;
  }

  if (filter === 'inactive') {
    return !plan.isActive;
  }

  return true;
};

const matchesViewMode = (plan: MembershipPlan, mode: ViewMode) => {
  if (mode === 'base') {
    return plan.isTemplate;
  }

  if (mode === 'custom') {
    return (plan.overrides?.length ?? 0) > 0;
  }

  return true;
};

const matchesBranchSelection = (plan: MembershipPlan, branchId?: string) => {
  if (!branchId) {
    return true;
  }

  return plan.branchId?.some((branch) => branch._id === branchId) ?? false;
};

const stringContainsKeyword = (value: string | undefined | null, keyword: string) => {
  if (!value) {
    return false;
  }

  return value.toLowerCase().includes(keyword);
};

const benefitsToText = (benefits: string[] | undefined) => (benefits?.length ? benefits.join(' ') : '');

const planMatchesKeyword = (plan: MembershipPlan, keyword: string) => {
  if (!keyword) {
    return true;
  }

  if (
    stringContainsKeyword(plan.name, keyword) ||
    stringContainsKeyword(plan.description, keyword) ||
    stringContainsKeyword(benefitsToText(plan.benefits), keyword)
  ) {
    return true;
  }

  if (plan.branchId?.some((branch) => stringContainsKeyword(branch.branchName, keyword))) {
    return true;
  }

  const overrideMatches =
    plan.overrides?.some((override) => {
      const searchableValues = [override.name, override.description, benefitsToText(override.benefits)];

      return searchableValues.some((value) => stringContainsKeyword(value, keyword));
    }) ?? false;

  return overrideMatches;
};

const MembershipPlansPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { branches, currentBranch } = useBranch();
  const currentBranchId = currentBranch?._id ?? undefined;

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(true);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [previewContext, setPreviewContext] = useState<PreviewContext | null>(null);
  const [editScope, setEditScope] = useState<MembershipPlanUpdateScope>('template');
  const [templateForm, setTemplateForm] = useState<MembershipTemplateFormValues>(initialTemplateForm);
  const [overrideForm, setOverrideForm] = useState<MembershipOverrideFormValues>(initialOverrideForm);
  const [targetBranchIds, setTargetBranchIds] = useState<string[]>([]);
  const [revertBranchIds, setRevertBranchIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutatingPlanId, setMutatingPlanId] = useState<string | null>(null);

  const branchOptions = useMemo(() => branches ?? [], [branches]);

  const accessibleBranchIds = useMemo(() => branchOptions.map((branch) => branch._id), [branchOptions]);

  const resourceBranchIds = useMemo(() => {
    if (!accessibleBranchIds.length) {
      return [] as string[];
    }

    // Always use current branch if available, otherwise use all accessible branches
    if (currentBranchId && accessibleBranchIds.includes(currentBranchId)) {
      return [currentBranchId];
    }

    return accessibleBranchIds;
  }, [accessibleBranchIds, currentBranchId]);

  const { plans, pagination, loading, error, setParams, refetch } = useMembershipPlans({
    initialParams: {
      search: '',
      branchId: currentBranchId,
      page: 1,
      limit: 12,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    },
    enabled: resourceBranchIds.length > 0,
    resourceBranchIds
  });
  const branchMap = useMemo(() => {
    const map = new Map<string, { branchName: string; location: string }>();
    branchOptions.forEach((item) => {
      map.set(item._id, { branchName: item.branchName, location: item.location });
    });
    return map;
  }, [branchOptions]);

  useEffect(() => {
    if (currentBranchId) {
      setParams({ branchId: currentBranchId, page: 1 });
    }
  }, [currentBranchId, setParams]);

  const summaryStats = useMemo<SummaryStat[]>(() => {
    const totalTemplates = plans.length;
    const activeTemplates = plans.filter((plan) => plan.isActive).length;
    const customVersions = plans.reduce((acc, plan) => acc + (plan.overrides?.length ?? 0), 0);
    const pausedCustom = plans.reduce(
      (acc, plan) => acc + (plan.overrides?.filter((override) => !override.isActive).length ?? 0),
      0
    );

    return [
      {
        key: 'totalTemplates',
        label: t('membershipManager.summary.totalPlans'),
        value: totalTemplates,
        description: t('membershipManager.summary.totalPlansHint'),
        icon: Layers,
        tone: 'primary'
      },
      {
        key: 'activeTemplates',
        label: t('membershipManager.summary.activePlans'),
        value: activeTemplates,
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
        key: 'pausedCustom',
        label: t('membershipManager.summary.pausedCustomVersions'),
        value: pausedCustom,
        description: t('membershipManager.summary.pausedCustomVersionsHint'),
        icon: PauseCircle,
        tone: 'muted'
      }
    ];
  }, [plans, t]);

  const normalizedSearchTerm = useMemo(() => searchTerm.trim().toLowerCase(), [searchTerm]);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (!matchesStatusFilter(plan, statusFilter)) {
        return false;
      }

      if (!matchesViewMode(plan, viewMode)) {
        return false;
      }

      if (!matchesBranchSelection(plan, currentBranchId)) {
        return false;
      }

      return planMatchesKeyword(plan, normalizedSearchTerm);
    });
  }, [plans, statusFilter, viewMode, currentBranchId, normalizedSearchTerm]);

  const branchesWithAccess = useMemo(() => new Set(branchOptions.map((branch) => branch._id)), [branchOptions]);

  const currentOverrideBranchIds = useMemo(
    () => editingPlan?.overrides?.map((override) => override.appliesToBranchId).filter(Boolean) ?? [],
    [editingPlan]
  );

  const templateBranches = useMemo(() => editingPlan?.branchId ?? [], [editingPlan]);

  const branchesUsingTemplate = useMemo(
    () => templateBranches.filter((branch) => !currentOverrideBranchIds.includes(branch._id)),
    [templateBranches, currentOverrideBranchIds]
  );

  const branchesUsingOverride = useMemo(
    () => templateBranches.filter((branch) => currentOverrideBranchIds.includes(branch._id)),
    [templateBranches, currentOverrideBranchIds]
  );

  const resetSheetState = useCallback(() => {
    setIsSheetOpen(false);
    setIsCreateMode(true);
    setEditingPlan(null);
    setTemplateForm(initialTemplateForm);
    setOverrideForm(initialOverrideForm);
    setTargetBranchIds([]);
    setRevertBranchIds([]);
    setEditScope('template');
    setIsSubmitting(false);
  }, []);

  const handleOpenCreate = useCallback(() => {
    setIsCreateMode(true);
    setEditingPlan(null);
    setEditScope('template');
    setTemplateForm({
      ...initialTemplateForm,
      branchId: currentBranchId ? [currentBranchId] : [],
      isActive: true
    });
    setOverrideForm(initialOverrideForm);
    setTargetBranchIds([]);
    setRevertBranchIds([]);
    setIsSheetOpen(true);
  }, [currentBranchId]);

  const handleOpenEdit = useCallback(
    (plan: MembershipPlan) => {
      setIsCreateMode(false);
      setEditingPlan(plan);
      setTemplateForm(buildDefaultFormValues(plan));
      setEditScope('template');

      const focusBranch = currentBranchId;
      setOverrideForm(buildOverrideFormValues(plan, focusBranch));

      if (focusBranch) {
        if (plan.overrides?.some((override) => override.appliesToBranchId === focusBranch)) {
          setTargetBranchIds([]);
          setRevertBranchIds([focusBranch]);
        } else if (plan.branchId.some((branch) => branch._id === focusBranch)) {
          setTargetBranchIds([focusBranch]);
          setRevertBranchIds([]);
        } else {
          setTargetBranchIds([]);
          setRevertBranchIds([]);
        }
      } else {
        setTargetBranchIds([]);
        setRevertBranchIds([]);
      }

      setIsSheetOpen(true);
    },
    [currentBranchId]
  );

  const handleToggleStatus = useCallback(
    async (plan: MembershipPlan) => {
      const branchId = plan.branchId?.map((branch) => branch._id) ?? [];

      if (!branchId.length) {
        toast.error(t('membershipManager.toast.toggleError'));
        return;
      }

      try {
        setMutatingPlanId(plan._id);
        const response = await membershipApi.toggleMembershipPlanStatus(plan._id, {
          isActive: !plan.isActive,
          branchId
        });

        if (response.success) {
          toast.success(t('membershipManager.toast.toggleSuccess'));
          await refetch();
        } else {
          toast.error(response.message ?? t('membershipManager.toast.toggleError'));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : t('membershipManager.toast.toggleError');
        toast.error(message);
      } finally {
        setMutatingPlanId(null);
      }
    },
    [refetch, t]
  );

  const updateTemplateForm = useCallback(
    <K extends keyof MembershipTemplateFormValues>(field: K, value: MembershipTemplateFormValues[K]) => {
      setTemplateForm((prev) => ({
        ...prev,
        [field]: value
      }));
    },
    []
  );

  const updateOverrideForm = useCallback(
    <K extends keyof MembershipOverrideFormValues>(field: K, value: MembershipOverrideFormValues[K]) => {
      setOverrideForm((prev) => ({
        ...prev,
        [field]: value
      }));
    },
    []
  );

  const toggleTargetBranch = useCallback((branchId: string) => {
    setTargetBranchIds((prev) => {
      const exists = prev.includes(branchId);
      const next = exists ? prev.filter((id) => id !== branchId) : [...prev, branchId];
      return next;
    });
    setRevertBranchIds((prev) => prev.filter((id) => id !== branchId));
  }, []);

  const toggleRevertBranch = useCallback((branchId: string) => {
    setRevertBranchIds((prev) => {
      const exists = prev.includes(branchId);
      const next = exists ? prev.filter((id) => id !== branchId) : [...prev, branchId];
      return next;
    });
    setTargetBranchIds((prev) => prev.filter((id) => id !== branchId));
  }, []);

  const validateTemplateForm = useCallback(() => {
    if (!templateForm.name.trim()) {
      toast.error(t('membershipManager.validation.nameRequired'));
      return false;
    }

    const price = Number(templateForm.price);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error(t('membershipManager.validation.priceInvalid'));
      return false;
    }

    const duration = Number(templateForm.durationInMonths);
    if (!Number.isFinite(duration) || duration <= 0) {
      toast.error(t('membershipManager.validation.durationInvalid'));
      return false;
    }

    if (!templateForm.branchId.length) {
      toast.error(t('membershipManager.validation.branchMissing'));
      return false;
    }

    return true;
  }, [templateForm, t]);

  const validateOverrideForm = useCallback(() => {
    if (!targetBranchIds.length) {
      return true;
    }

    if (!overrideForm.name.trim()) {
      toast.error(t('membershipManager.validation.nameRequired'));
      return false;
    }

    const price = Number(overrideForm.price);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error(t('membershipManager.validation.priceInvalid'));
      return false;
    }

    const duration = Number(overrideForm.durationInMonths);
    if (!Number.isFinite(duration) || duration <= 0) {
      toast.error(t('membershipManager.validation.durationInvalid'));
      return false;
    }

    if (!overrideForm.benefits.trim()) {
      toast.error(t('membershipManager.validation.overrideDataMissing'));
      return false;
    }

    return true;
  }, [overrideForm, targetBranchIds.length, t]);

  const submitCreatePlan = useCallback(async () => {
    if (!validateTemplateForm()) {
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: templateForm.name.trim(),
      description: templateForm.description.trim() || undefined,
      price: Number(templateForm.price),
      currency: templateForm.currency.trim().toUpperCase(),
      durationInMonths: Number(templateForm.durationInMonths),
      benefits: parseBenefits(templateForm.benefits),
      branchId: templateForm.branchId,
      isActive: templateForm.isActive
    };

    try {
      const response = await membershipApi.createMembershipPlan(payload);
      if (response.success) {
        toast.success(t('membershipManager.toast.createSuccess'));
        await refetch();
        resetSheetState();
      } else {
        toast.error(response.message ?? t('membershipManager.toast.createError'));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('membershipManager.toast.createError');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [refetch, resetSheetState, t, templateForm, validateTemplateForm]);

  const submitTemplateUpdate = useCallback(
    async (plan: MembershipPlan) => {
      if (!validateTemplateForm()) {
        return;
      }

      setIsSubmitting(true);

      const payload: UpdateMembershipPlanPayload = {
        updateScope: 'template',
        data: {
          name: templateForm.name.trim(),
          description: templateForm.description.trim() || undefined,
          price: Number(templateForm.price),
          currency: templateForm.currency.trim().toUpperCase(),
          durationInMonths: Number(templateForm.durationInMonths),
          benefits: parseBenefits(templateForm.benefits),
          isActive: templateForm.isActive
        },
        branchId: templateForm.branchId
      };

      const resourceBranches = templateForm.branchId.length
        ? templateForm.branchId
        : (plan.branchId?.map((branch) => branch._id) ?? []);

      try {
        const response = await membershipApi.updateMembershipPlan(plan._id, payload, resourceBranches);
        if (response.success) {
          toast.success(t('membershipManager.toast.updateSuccess'));
          await refetch();
          resetSheetState();
        } else {
          toast.error(response.message ?? t('membershipManager.toast.updateError'));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : t('membershipManager.toast.updateError');
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [refetch, resetSheetState, t, templateForm, validateTemplateForm]
  );

  const submitBranchUpdate = useCallback(
    async (plan: MembershipPlan) => {
      if (!targetBranchIds.length && !revertBranchIds.length) {
        toast.error(t('membershipManager.validation.branchMissing'));
        return;
      }

      if (!validateOverrideForm()) {
        return;
      }

      setIsSubmitting(true);

      const payload: UpdateMembershipPlanPayload = {
        updateScope: 'branches'
      };

      if (targetBranchIds.length) {
        payload.targetBranchIds = targetBranchIds;
        payload.data = {
          name: overrideForm.name.trim(),
          description: overrideForm.description.trim() || undefined,
          price: Number(overrideForm.price),
          currency: overrideForm.currency.trim().toUpperCase(),
          durationInMonths: Number(overrideForm.durationInMonths),
          benefits: parseBenefits(overrideForm.benefits),
          isActive: overrideForm.isActive
        };
      }

      if (revertBranchIds.length) {
        payload.revertBranchIds = revertBranchIds;
      }

      const resourceBranches = Array.from(new Set([...targetBranchIds, ...revertBranchIds]));
      const fallbackBranches = plan.branchId?.map((branch) => branch._id) ?? [];

      try {
        const response = await membershipApi.updateMembershipPlan(
          plan._id,
          payload,
          resourceBranches.length ? resourceBranches : fallbackBranches
        );

        if (response.success) {
          toast.success(t('membershipManager.toast.updateSuccess'));
          await refetch();
          resetSheetState();
        } else {
          toast.error(response.message ?? t('membershipManager.toast.updateError'));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : t('membershipManager.toast.updateError');
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [overrideForm, refetch, resetSheetState, revertBranchIds, targetBranchIds, t, validateOverrideForm]
  );

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    if (isCreateMode) {
      await submitCreatePlan();
      return;
    }

    if (!editingPlan) {
      return;
    }

    if (editScope === 'template') {
      await submitTemplateUpdate(editingPlan);
      return;
    }

    await submitBranchUpdate(editingPlan);
  }, [editScope, editingPlan, isCreateMode, isSubmitting, submitBranchUpdate, submitCreatePlan, submitTemplateUpdate]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setParams({ search: value, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    const nextValue = (value || 'all') as StatusFilter;
    setStatusFilter(nextValue);
    if (nextValue === 'all') {
      setParams({ isActive: undefined, page: 1 });
    } else {
      setParams({ isActive: nextValue === 'active', page: 1 });
    }
  };

  const handleViewModeChange = (value: string) => {
    const nextValue = (value || 'all') as ViewMode;
    setViewMode(nextValue);
  };

  const currentLocale = i18n.language || 'vi-VN';

  const renderPlanCard = (plan: MembershipPlan) => {
    const resolved = resolvePlanData(plan, currentBranchId);
    const overrideCount = plan.overrides?.length ?? 0;
    const assignedBranches = plan.branchId ?? [];
    const formattedPrice = formatCurrency(resolved.price, resolved.currency);
    const lastUpdated = formatDateTime(plan.updatedAt ?? plan.createdAt ?? '', currentLocale);
    const accentClass = resolved.isActive
      ? 'from-orange-500 via-orange-400 to-orange-500'
      : 'from-slate-400 via-slate-300 to-slate-400';
    const statusTone = resolved.isActive
      ? 'border border-emerald-200 bg-emerald-50 text-emerald-600'
      : 'border border-slate-200 bg-slate-100 text-slate-500';

    return (
      <Card
        key={plan._id}
        className="group flex flex-col overflow-hidden border border-orange-100 shadow-sm transition hover:border-orange-200 hover:shadow-md h-full"
      >
        <div className={`h-0.5 w-full bg-gradient-to-r ${accentClass}`} />
        <CardContent className="flex flex-1 flex-col h-full pt-3 pb-4 px-4 sm:px-5">
          {/* Header with title, price and menu */}
          <div className="relative flex-shrink-0 mb-3">
            <div className="absolute right-0 top-[-25px]">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-orange-200 hover:text-orange-500 flex-shrink-0"
                    title={t('membershipManager.card.moreActions')}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() =>
                      setPreviewContext({
                        plan,
                        branchId: currentBranchId
                      })
                    }
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    {t('membershipManager.card.viewDetails')}
                  </DropdownMenuItem>
                  {branchesWithAccess.size > 0 && (
                    <DropdownMenuItem onClick={() => handleOpenEdit(plan)} className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      {t('membershipManager.card.edit')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => handleToggleStatus(plan)}
                    disabled={mutatingPlanId === plan._id}
                    className="flex items-center gap-2"
                  >
                    {mutatingPlanId === plan._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Power className={`h-4 w-4 ${plan.isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    )}
                    {t('membershipManager.card.toggle')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold text-slate-900 line-clamp-1">{resolved.name}</CardTitle>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xl font-bold text-orange-600">{formattedPrice}</span>
                <span className="text-sm text-slate-500">
                  {t('membershipManager.card.duration', { months: resolved.durationInMonths })}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              <Badge
                variant="secondary"
                className="rounded-full border border-slate-200 bg-white/90 uppercase text-[10px] px-2 py-1"
              >
                {plan.isTemplate ? t('membershipManager.card.templateBadge') : t('membershipManager.card.customBadge')}
              </Badge>
              {resolved.source === 'override' && (
                <Badge className="rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-[10px] px-2 py-1">
                  {t('membershipManager.card.customBadge')}
                </Badge>
              )}
              <Badge className={`rounded-full text-[10px] font-medium px-2 py-1 ${statusTone}`}>
                {resolved.isActive
                  ? t('membershipManager.card.statusActive')
                  : t('membershipManager.card.statusInactive')}
              </Badge>
              {overrideCount > 0 && (
                <Badge className="rounded-full border border-purple-200 bg-purple-50 text-[10px] font-medium text-purple-600 px-2 py-1">
                  {t('membershipManager.card.customCount', { count: overrideCount })}
                </Badge>
              )}
            </div>
          </div>

          {/* Description with more spacing */}
          <p className="line-clamp-2 text-sm text-slate-600 mb-4">
            {resolved.description ?? t('membershipManager.dialog.noDescription')}
          </p>

          {/* Benefits section - takes remaining space */}
          <div className="flex-1 space-y-2 min-h-0">
            <span className="text-sm font-semibold text-slate-700">{t('membershipManager.card.benefitsTitle')}</span>
            {resolved.benefits.length ? (
              <ul className="space-y-1">
                {resolved.benefits.slice(0, 3).map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{benefit}</span>
                  </li>
                ))}
                {resolved.benefits.length > 3 && (
                  <li className="flex items-center gap-2 text-sm text-orange-600 font-medium">
                    <Circle className="h-4 w-4 flex-shrink-0" />
                    <span>{t('membershipManager.card.moreBenefits', { count: resolved.benefits.length - 3 })}</span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">{t('membershipManager.card.noBenefits')}</p>
            )}
          </div>

          {/* Branches section */}
          <div className="space-y-2 flex-shrink-0 mb-1">
            <span className="text-sm font-semibold text-slate-700">{t('membershipManager.card.branchesLabel')}</span>
            {assignedBranches.length ? (
              <ul className="space-y-1">
                {assignedBranches.slice(0, 2).map((branch) => {
                  const { name } = getBranchName(branch, branchMap);
                  return (
                    <li key={branch._id} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="h-2 w-2 rounded-full flex-shrink-0 bg-slate-400" />
                      <span className="line-clamp-1">{name}</span>
                    </li>
                  );
                })}
                {assignedBranches.length > 2 && (
                  <li className="flex items-center gap-2 text-sm text-slate-500">
                    <Circle className="h-4 w-4 flex-shrink-0" />
                    <span>{t('membershipManager.card.moreBranches', { count: assignedBranches.length - 2 })}</span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">{t('membershipManager.card.noBranches')}</p>
            )}
          </div>

          {/* Updated time info - moved to bottom with minimal spacing */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-shrink-0 mt-1 pt-1 border-t border-slate-100">
            <Clock3 className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{t('membershipManager.card.updatedAt', { value: lastUpdated })}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const planForPreview = previewContext?.plan;
  const branchForPreview = previewContext?.branchId;
  const previewResolved = planForPreview ? resolvePlanData(planForPreview, branchForPreview) : null;

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
                  onClick={() => refetch()}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  <span className="hidden sm:inline ml-2">{t('membershipManager.actions.refresh')}</span>
                </Button>
                <Button
                  className="h-11 rounded-full bg-orange-500 px-4 sm:px-6 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
                  onClick={handleOpenCreate}
                >
                  <Plus className="h-4 w-4" />
                  <span className="ml-2">{t('membershipManager.actions.create')}</span>
                </Button>
              </div>
            </div>

            <div className="grid w-full gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-orange-100 bg-[#FFF6EE] p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                  {summaryStats[0]?.label}
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <div className="text-3xl font-bold text-gray-900">{summaryStats[0]?.value}</div>
                  <div className="rounded-full bg-white/70 p-2 text-orange-500">
                    <Layers className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">{summaryStats[0]?.description}</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {summaryStats[1]?.label}
                </div>
                <div className="mt-2 flex items-end justify-between text-gray-900">
                  <span className="text-3xl font-semibold">{summaryStats[1]?.value}</span>
                  <div className="rounded-full bg-white p-2 text-gray-500">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">{summaryStats[1]?.description}</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {summaryStats[2]?.label}
                </div>
                <div className="mt-2 flex items-end justify-between text-gray-900">
                  <span className="text-3xl font-semibold">{summaryStats[2]?.value}</span>
                  <div className="rounded-full bg-white p-2 text-gray-500">
                    <Settings2 className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">{summaryStats[2]?.description}</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {summaryStats[3]?.label}
                </div>
                <div className="mt-2 flex items-end justify-between text-gray-900">
                  <span className="text-3xl font-semibold">{summaryStats[3]?.value}</span>
                  <div className="rounded-full bg-white p-2 text-gray-500">
                    <PauseCircle className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">{summaryStats[3]?.description}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-col gap-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full max-w-md">
                <Input
                  placeholder={t('membershipManager.filters.searchPlaceholder')}
                  className="h-11 rounded-full border border-transparent bg-gray-50 pl-12 text-sm shadow-inner focus:border-orange-200 focus:bg-white focus:ring-orange-200"
                  value={searchTerm}
                  onChange={(event) => handleSearchChange(event.target.value)}
                />
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1 overflow-x-auto">
                  <button
                    className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-medium transition-all whitespace-nowrap ${
                      statusFilter === 'all'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-500 hover:text-orange-500'
                    }`}
                    onClick={() => handleStatusChange('all')}
                  >
                    {t('membershipManager.filters.statusAll')}
                  </button>
                  <button
                    className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-medium transition-all whitespace-nowrap ${
                      statusFilter === 'active'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-500 hover:text-orange-500'
                    }`}
                    onClick={() => handleStatusChange('active')}
                  >
                    {t('membershipManager.filters.statusActive')}
                  </button>
                  <button
                    className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-medium transition-all whitespace-nowrap ${
                      statusFilter === 'inactive'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-500 hover:text-orange-500'
                    }`}
                    onClick={() => handleStatusChange('inactive')}
                  >
                    {t('membershipManager.filters.statusInactive')}
                  </button>
                </div>

                {/* View Mode Filter Buttons */}
                <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1 overflow-x-auto">
                  <button
                    className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-medium transition-all whitespace-nowrap ${
                      viewMode === 'all' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-orange-500'
                    }`}
                    onClick={() => handleViewModeChange('all')}
                  >
                    {t('membershipManager.filters.viewAll')}
                  </button>
                  <button
                    className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-medium transition-all whitespace-nowrap ${
                      viewMode === 'base' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-orange-500'
                    }`}
                    onClick={() => handleViewModeChange('base')}
                  >
                    {t('membershipManager.filters.viewBase')}
                  </button>
                  <button
                    className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-medium transition-all whitespace-nowrap ${
                      viewMode === 'custom'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-500 hover:text-orange-500'
                    }`}
                    onClick={() => handleViewModeChange('custom')}
                  >
                    {t('membershipManager.filters.viewCustom')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <Card
                  key={`membership-skeleton-${index}`}
                  className="overflow-hidden border border-orange-100 shadow-sm"
                >
                  <div className="h-1 w-full bg-gradient-to-r from-orange-200 via-orange-100 to-orange-200" />
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-24 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-md" />
                    </div>
                    <Skeleton className="h-5 w-3/4 rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-5/6 rounded-md" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-9 w-full rounded-xl" />
                  </CardContent>
                </Card>
              ))
            ) : error ? (
              <div className="col-span-full rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
                {error}
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                {t('membershipManager.state.empty')}
              </div>
            ) : (
              filteredPlans.map((plan) => renderPlanCard(plan))
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 order-2 sm:order-1">
                {t('membershipManager.pagination.pageIndicator', {
                  page: pagination.page,
                  total: pagination.totalPages
                })}
              </div>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 hover:border-orange-300 hover:text-orange-500"
                  onClick={() => setParams({ page: Math.max(1, (pagination.page ?? 1) - 1) })}
                  disabled={pagination.page <= 1 || loading}
                >
                  {t('membershipManager.pagination.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 hover:border-orange-300 hover:text-orange-500"
                  onClick={() => setParams({ page: Math.min(pagination.totalPages, (pagination.page ?? 1) + 1) })}
                  disabled={pagination.page >= pagination.totalPages || loading}
                >
                  {t('membershipManager.pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={(open) => (open ? undefined : resetSheetState())}>
        <SheetContent side="right" className="flex h-full w-full flex-col overflow-hidden sm:max-w-2xl">
          <SheetHeader className="px-4 pt-6 pb-4">
            <SheetTitle>
              {isCreateMode ? t('membershipManager.sheet.createTitle') : t('membershipManager.sheet.editTitle')}
            </SheetTitle>
            <SheetDescription>
              {isCreateMode
                ? t('membershipManager.sheet.createDescription')
                : t('membershipManager.sheet.editDescription')}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4 min-h-0">
            <div className="space-y-6 pb-6">
              {!isCreateMode && (
                <Tabs value={editScope} onValueChange={(value) => setEditScope(value as MembershipPlanUpdateScope)}>
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="template">{t('membershipManager.sheet.scopeTemplate')}</TabsTrigger>
                    <TabsTrigger value="branches">{t('membershipManager.sheet.scopeBranches')}</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}

              {(isCreateMode || editScope === 'template') && (
                <div className="space-y-4">
                  {!isCreateMode && (
                    <Alert>
                      <AlertTitle>{t('membershipManager.sheet.templateGuidanceTitle')}</AlertTitle>
                      <AlertDescription>{t('membershipManager.sheet.templateGuidance')}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">{t('membershipManager.sheet.form.name')}</Label>
                      <Input
                        id="template-name"
                        value={templateForm.name}
                        onChange={(event) => updateTemplateForm('name', event.target.value)}
                        placeholder={t('membershipManager.sheet.form.namePlaceholder')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template-description">{t('membershipManager.sheet.form.description')}</Label>
                      <Textarea
                        id="template-description"
                        rows={3}
                        value={templateForm.description}
                        onChange={(event) => updateTemplateForm('description', event.target.value)}
                        placeholder={t('membershipManager.sheet.form.descriptionPlaceholder')}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="template-price">{t('membershipManager.sheet.form.price')}</Label>
                        <Input
                          id="template-price"
                          value={templateForm.price}
                          onChange={(event) => updateTemplateForm('price', event.target.value)}
                          placeholder="500000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="template-currency">{t('membershipManager.sheet.form.currency')}</Label>
                        <Input
                          id="template-currency"
                          value={templateForm.currency}
                          onChange={(event) => updateTemplateForm('currency', event.target.value)}
                          placeholder="VND"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="template-duration">{t('membershipManager.sheet.form.duration')}</Label>
                        <Input
                          id="template-duration"
                          value={templateForm.durationInMonths}
                          onChange={(event) => updateTemplateForm('durationInMonths', event.target.value)}
                          placeholder="1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template-benefits">{t('membershipManager.sheet.form.benefits')}</Label>
                      <Textarea
                        id="template-benefits"
                        rows={4}
                        value={templateForm.benefits}
                        onChange={(event) => updateTemplateForm('benefits', event.target.value)}
                        placeholder={t('membershipManager.sheet.form.benefitsPlaceholder')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t('membershipManager.sheet.form.applyBranches')}</Label>
                      {branchOptions.length ? (
                        <div className="flex flex-col gap-2">
                          {branchOptions.map((branch) => {
                            const checked = templateForm.branchId.includes(branch._id);
                            return (
                              <label
                                key={branch._id}
                                className="flex items-start gap-2 rounded-md border border-slate-200 p-3 text-sm"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(value) => {
                                    const isChecked = value === true;
                                    updateTemplateForm(
                                      'branchId',
                                      isChecked
                                        ? [...templateForm.branchId, branch._id]
                                        : templateForm.branchId.filter((id) => id !== branch._id)
                                    );
                                  }}
                                />
                                <span>
                                  <span className="block font-medium text-slate-900">{branch.branchName}</span>
                                  {branch.location && <span className="text-xs text-slate-500">{branch.location}</span>}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">{t('membershipManager.sheet.form.noBranches')}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {t('membershipManager.sheet.form.statusTitle')}
                        </h4>
                        <p className="text-xs text-slate-500">{t('membershipManager.sheet.form.statusHint')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">
                          {templateForm.isActive
                            ? t('membershipManager.sheet.form.activeStatus')
                            : t('membershipManager.sheet.form.inactiveStatus')}
                        </span>
                        <Switch
                          checked={templateForm.isActive}
                          onCheckedChange={(value) => updateTemplateForm('isActive', value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!isCreateMode && editScope === 'branches' && (
                <div className="space-y-6">
                  <Alert>
                    <AlertTitle>{t('membershipManager.sheet.overrideGuidanceTitle')}</AlertTitle>
                    <AlertDescription>{t('membershipManager.sheet.overrideGuidance')}</AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {t('membershipManager.sheet.overrideTargets')}
                      </h4>
                      <Badge variant="outline" className="bg-slate-50 text-slate-700">
                        {t('membershipManager.sheet.selectedCount', { count: targetBranchIds.length })}
                      </Badge>
                    </div>
                    {branchesUsingTemplate.length ? (
                      <div className="flex flex-col gap-2">
                        {branchesUsingTemplate.map((branch) => {
                          const { name, location } = getBranchName(branch, branchMap);
                          return (
                            <label
                              key={branch._id}
                              className="flex items-start gap-2 rounded-md border border-slate-200 p-3 text-sm"
                            >
                              <Checkbox
                                checked={targetBranchIds.includes(branch._id)}
                                onCheckedChange={() => toggleTargetBranch(branch._id)}
                              />
                              <span>
                                <span className="block font-medium text-slate-900">{name}</span>
                                {location && <span className="text-xs text-slate-500">{location}</span>}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">{t('membershipManager.sheet.noTargetBranches')}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {t('membershipManager.sheet.overrideReverts')}
                      </h4>
                      <Badge variant="outline" className="bg-slate-50 text-slate-700">
                        {t('membershipManager.sheet.selectedCount', { count: revertBranchIds.length })}
                      </Badge>
                    </div>
                    {branchesUsingOverride.length ? (
                      <div className="flex flex-col gap-2">
                        {branchesUsingOverride.map((branch) => {
                          const { name, location } = getBranchName(branch, branchMap);
                          return (
                            <label
                              key={branch._id}
                              className="flex items-start gap-2 rounded-md border border-slate-200 p-3 text-sm"
                            >
                              <Checkbox
                                checked={revertBranchIds.includes(branch._id)}
                                onCheckedChange={() => toggleRevertBranch(branch._id)}
                              />
                              <span>
                                <span className="block font-medium text-slate-900">{name}</span>
                                {location && <span className="text-xs text-slate-500">{location}</span>}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">{t('membershipManager.sheet.noRevertBranches')}</p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {t('membershipManager.sheet.overrideDetailsTitle')}
                    </h4>
                    {targetBranchIds.length === 0 && (
                      <p className="text-xs text-amber-600">{t('membershipManager.sheet.noTargetSelected')}</p>
                    )}

                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="override-name">{t('membershipManager.sheet.form.name')}</Label>
                        <Input
                          id="override-name"
                          value={overrideForm.name}
                          onChange={(event) => updateOverrideForm('name', event.target.value)}
                          placeholder={t('membershipManager.sheet.form.namePlaceholder')}
                          disabled={!targetBranchIds.length}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="override-description">{t('membershipManager.sheet.form.description')}</Label>
                        <Textarea
                          id="override-description"
                          rows={3}
                          value={overrideForm.description}
                          onChange={(event) => updateOverrideForm('description', event.target.value)}
                          placeholder={t('membershipManager.sheet.form.descriptionPlaceholder')}
                          disabled={!targetBranchIds.length}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="override-price">{t('membershipManager.sheet.form.price')}</Label>
                          <Input
                            id="override-price"
                            value={overrideForm.price}
                            onChange={(event) => updateOverrideForm('price', event.target.value)}
                            placeholder="550000"
                            disabled={!targetBranchIds.length}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="override-currency">{t('membershipManager.sheet.form.currency')}</Label>
                          <Input
                            id="override-currency"
                            value={overrideForm.currency}
                            onChange={(event) => updateOverrideForm('currency', event.target.value)}
                            placeholder="VND"
                            disabled={!targetBranchIds.length}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="override-duration">{t('membershipManager.sheet.form.duration')}</Label>
                          <Input
                            id="override-duration"
                            value={overrideForm.durationInMonths}
                            onChange={(event) => updateOverrideForm('durationInMonths', event.target.value)}
                            placeholder="1"
                            disabled={!targetBranchIds.length}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="override-benefits">{t('membershipManager.sheet.form.benefits')}</Label>
                        <Textarea
                          id="override-benefits"
                          rows={4}
                          value={overrideForm.benefits}
                          onChange={(event) => updateOverrideForm('benefits', event.target.value)}
                          placeholder={t('membershipManager.sheet.form.benefitsPlaceholder')}
                          disabled={!targetBranchIds.length}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">
                            {t('membershipManager.sheet.overrideStatusTitle')}
                          </h4>
                          <p className="text-xs text-slate-500">{t('membershipManager.sheet.overrideStatusHint')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">
                            {overrideForm.isActive
                              ? t('membershipManager.sheet.form.activeStatus')
                              : t('membershipManager.sheet.form.inactiveStatus')}
                          </span>
                          <Switch
                            checked={overrideForm.isActive}
                            onCheckedChange={(value) => updateOverrideForm('isActive', value)}
                            disabled={!targetBranchIds.length}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <SheetFooter className="px-4 pb-6">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetSheetState} disabled={isSubmitting}>
                {t('membershipManager.sheet.actions.cancel')}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('membershipManager.sheet.actions.save')}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(previewContext)} onOpenChange={(open) => (!open ? setPreviewContext(null) : undefined)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('membershipManager.dialog.detailsTitle')}</DialogTitle>
            <DialogDescription>
              {previewResolved?.source === 'override'
                ? t('membershipManager.dialog.overrideDescription')
                : t('membershipManager.dialog.templateDescription')}
            </DialogDescription>
          </DialogHeader>

          {planForPreview && previewResolved && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {previewResolved.source === 'override'
                    ? t('membershipManager.card.customBadge')
                    : t('membershipManager.card.templateBadge')}
                </Badge>
                <Badge variant={previewResolved.isActive ? 'default' : 'secondary'}>
                  {previewResolved.isActive
                    ? t('membershipManager.card.statusActive')
                    : t('membershipManager.card.statusInactive')}
                </Badge>
                <Badge variant="outline" className="bg-slate-50 text-slate-600">
                  {t('membershipManager.card.updatedAt', {
                    value: formatDateTime(planForPreview.updatedAt, currentLocale)
                  })}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{previewResolved.name}</h3>
                  {previewResolved.description ? (
                    <p className="mt-2 text-sm text-slate-600">{previewResolved.description}</p>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">{t('membershipManager.dialog.noDescription')}</p>
                  )}
                </div>
                <div className="rounded-md border border-slate-200 p-4">
                  <div className="text-xl font-semibold text-slate-900">
                    {formatCurrency(previewResolved.price, previewResolved.currency)}
                  </div>
                  <div className="text-sm text-slate-500">
                    {t('membershipManager.card.duration', { months: previewResolved.durationInMonths })}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900">{t('membershipManager.dialog.benefitsTitle')}</h4>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
                  {previewResolved.benefits.length ? (
                    previewResolved.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)
                  ) : (
                    <li className="text-slate-500">{t('membershipManager.dialog.noBenefits')}</li>
                  )}
                </ul>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">
                  {t('membershipManager.dialog.assignedBranches')}
                </h4>
                <div className="flex flex-col gap-2">
                  {planForPreview.branchId.map((branch) => {
                    const { name, location } = getBranchName(branch, branchMap);
                    const hasOverride = planForPreview.overrides?.some(
                      (override) => override.appliesToBranchId === branch._id
                    );
                    return (
                      <div
                        key={branch._id}
                        className="flex flex-col rounded-md border border-slate-200 p-3 text-sm text-slate-700"
                      >
                        <span className="font-semibold text-slate-900">{name}</span>
                        {location && <span className="text-xs text-slate-500">{location}</span>}
                        <span className="mt-1 inline-flex items-center gap-1 text-xs">
                          {hasOverride ? (
                            <>
                              <Settings2 className="h-3.5 w-3.5 text-amber-600" />
                              {t('membershipManager.dialog.customVersion')}
                            </>
                          ) : (
                            <>
                              <Undo2 className="h-3.5 w-3.5 text-slate-400" />
                              {t('membershipManager.dialog.usingTemplate')}
                            </>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewContext(null)}>
              {t('membershipManager.sheet.actions.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembershipPlansPage;
