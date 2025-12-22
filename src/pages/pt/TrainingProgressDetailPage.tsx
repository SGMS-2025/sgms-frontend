import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Plus, Calendar, Weight, Dumbbell, Target, MoreVertical, Loader2 } from 'lucide-react';
import { TrainingProgressChart } from '@/components/pt/TrainingProgressChart';
import { TrainingProgressRadarChart } from '@/components/pt/TrainingProgressRadarChart';
import { TrainingLogTable } from '@/components/pt/TrainingLogTable';
import { GoalCard } from '@/components/pt/GoalCard';
import { GoalForm } from '@/components/pt/GoalForm';
import { useCustomerGoal } from '@/hooks/useCustomerGoal';
import { AddProgressForm } from '@/components/pt/AddProgressForm';
import { EditProgressForm } from '@/components/pt/EditProgressForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTrainingProgress } from '@/hooks/useTrainingProgress';
import { customerApi } from '@/services/api/customerApi';
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal';
import { toast } from 'sonner';
import { useMealPlans } from '@/hooks/useMealPlans';
import { MealPlanForm, type MealPlanFormValues } from '@/components/pt/MealPlanForm';
import { MealPlanDetail } from '@/components/pt/MealPlanDetail';
import { mapAiErrorMessage } from '@/utils/mapAiErrorMessage';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import type { TrainingProgressDisplay } from '@/types/api/TrainingProgress';
import type { ProgressFormData, EditProgressFormData, CustomerStats } from '@/types/forms/Progress';
import type { ServiceContractItem } from '@/types/api/Customer';
import type { MealPlan } from '@/types/api/MealPlan';

export default function TrainingProgressDetailPage() {
  const { t } = useTranslation();
  const { id: customerId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useUser();
  const isDesktop = !useIsMobile(1024);

  // Get serviceContractId from navigation state or query params
  const searchParams = new URLSearchParams(location.search);
  const serviceContractIdFromQuery = searchParams.get('contractId');
  const serviceContractId = location.state?.serviceContractId || serviceContractIdFromQuery || null;
  const customerName = location.state?.customerName;

  // Use training progress hook
  const { progressList, refetch, getCustomerStats } = useTrainingProgress({
    customerId: customerId || '',
    limit: 50,
    sortBy: 'trackingDate',
    sortOrder: 'desc'
  });

  // Use customer goal hook
  const { activeGoal, refetch: refetchGoal } = useCustomerGoal(customerId || undefined);

  // Meal plans for this customer
  const mealPlanParams = useMemo(
    () => ({
      customerId: customerId || '',
      customerGoalId: activeGoal?.id,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
      limit: 20
    }),
    [customerId, activeGoal?.id]
  );

  const {
    items: mealPlans,
    loading: mealPlanLoading,
    create: createMealPlan,
    update: updateMealPlan,
    remove: deleteMealPlan,
    getById: getMealPlanById,
    refetch: refetchMealPlans,
    generate: generateMealPlan,
    cancelGenerate: cancelGenerateMealPlan,
    creating: creatingMealPlan,
    updating: updatingMealPlan,
    generating: generatingMealPlan
  } = useMealPlans(mealPlanParams);

  // Customer data - will be loaded from API
  const [customer, setCustomer] = useState({
    id: customerId || '1',
    name: customerName || 'Loading...',
    phone: '',
    email: '',
    avatar: '/avatars/customer-1.jpg',
    package: 'Personal Training - Basic',
    status: 'Active' as 'Active' | 'Inactive',
    serviceContractId: serviceContractId || '', // Use from navigation state
    trainerId: currentUser?._id || '' // Use current user as trainer
  });

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<TrainingProgressDisplay | null>(null);
  const [chartFilter, setChartFilter] = useState<'4weeks' | 'all'>('4weeks');
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [isMealPlanModalOpen, setIsMealPlanModalOpen] = useState(false);
  const [selectedMealPlanId, setSelectedMealPlanId] = useState<string | null>(null);
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  const [mealPlanMode, setMealPlanMode] = useState<'create' | 'edit' | 'view'>('create');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [mealPlanPage, setMealPlanPage] = useState(1);
  const mealPlanPageSize = 6;
  const generateCancelledRef = useRef(false);
  const [isAiGeneratedMealPlan, setIsAiGeneratedMealPlan] = useState(false);
  const mealPlanModalTitle = useMemo(() => {
    if (mealPlanMode === 'create') return t('progress_detail.meal_plan.create_title');
    if (mealPlanMode === 'edit') return t('progress_detail.meal_plan.edit_title');
    return t('progress_detail.meal_plan.view_title');
  }, [mealPlanMode, t]);

  // Memoize records with body measurements for radar chart
  // progressList is sorted by trackingDate DESC, createdAt DESC from API
  const recordsWithBodyMeasurements = useMemo(() => {
    return progressList.filter(
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
    );
  }, [progressList]);

  // Current = most recent record with body measurements
  const radarCurrentData = recordsWithBodyMeasurements[0] || progressList[0] || null;

  // First = earliest record (prefer ones with measurements)
  const radarFirstData = useMemo(() => {
    if (!progressList.length) return null;

    const baseline =
      recordsWithBodyMeasurements.length > 1
        ? recordsWithBodyMeasurements[recordsWithBodyMeasurements.length - 1]
        : progressList[progressList.length - 1];

    if (!baseline) return null;

    // Avoid duplicating the same record as current
    if (radarCurrentData && baseline.id && radarCurrentData.id && baseline.id === radarCurrentData.id) {
      return null;
    }

    return baseline;
  }, [progressList, recordsWithBodyMeasurements, radarCurrentData]);
  const [customerLoading, setCustomerLoading] = useState(true);

  // Reset meal plan page if list changes
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(mealPlans.length / mealPlanPageSize));
    if (mealPlanPage > totalPages) {
      setMealPlanPage(totalPages);
    }
  }, [mealPlans, mealPlanPage, mealPlanPageSize]);

  // Load customer data from API
  useEffect(() => {
    const loadCustomerData = async () => {
      if (customerId) {
        // Check if trainerId is available
        if (!currentUser?._id) {
          toast.error(t('progress_detail.error.no_trainer'));
          navigate('/login');
          return;
        }

        setCustomerLoading(true);
        const response = await customerApi.getCustomerById(customerId);

        if (response.success) {
          // If serviceContractId is not provided, try to get it from customer's contracts
          let finalServiceContractId = serviceContractId;

          if (!finalServiceContractId) {
            // Try to get from allServiceContracts (returned from backend)
            const allServiceContracts: ServiceContractItem[] =
              (response.data as { allServiceContracts?: ServiceContractItem[] }).allServiceContracts || [];
            if (allServiceContracts.length > 0) {
              // Find the first active PT contract
              const ptContract = allServiceContracts.find(
                (contract: ServiceContractItem) => contract.packageType === 'PT' && contract.status === 'ACTIVE'
              );
              if (ptContract) {
                finalServiceContractId = ptContract._id?.toString() || ptContract._id || ptContract.id;
              } else if (allServiceContracts.length > 0) {
                // Fallback: use the first contract if no active PT contract found
                const firstContract = allServiceContracts[0];
                finalServiceContractId = firstContract._id?.toString() || firstContract._id || firstContract.id;
              }
            }
          }

          // Check if serviceContractId is available after trying to get from contracts
          if (!finalServiceContractId) {
            toast.error(t('progress_detail.error.no_contract'));
            navigate('/manage/pt/clients');
            setCustomerLoading(false);
            return;
          }

          // Transform the customer data to match our expected format
          setCustomer({
            id: response.data.id,
            name: response.data.name || 'Unknown',
            phone: response.data.phone,
            email: response.data.email,
            avatar: '/avatars/customer-1.jpg', // Default avatar since CustomerDisplay doesn't have avatar
            package: response.data.membershipType || 'Personal Training - Basic',
            status: response.data.membershipStatus === 'ACTIVE' ? 'Active' : 'Inactive',
            serviceContractId: finalServiceContractId,
            trainerId: currentUser?._id || '' // Keep current user as trainer
          });
        } else {
          console.error('Failed to load customer data:', response.message);
          toast.error(t('progress_detail.error.load_failed'));
        }

        setCustomerLoading(false);
      }
    };

    loadCustomerData();
  }, [customerId, serviceContractId, currentUser?._id, navigate, t]);

  // Load customer stats and trend data
  useEffect(() => {
    const loadCustomerStats = async () => {
      if (customerId) {
        const statsResponse = await getCustomerStats(customerId, { days: 30 });
        if (statsResponse.success) {
          setCustomerStats(statsResponse.data);
        } else {
          console.warn('Failed to load customer stats:', statsResponse.message);
          // Stats are not critical, continue without them
          setCustomerStats(null);
        }
      }
    };

    loadCustomerStats();
  }, [customerId, getCustomerStats]);

  // Check URL params to auto-open add progress form - Run ONCE on mount only
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldAdd = params.get('add') === 'true';
    if (!shouldAdd) return undefined;

    // Use sessionStorage to persist across StrictMode remounts
    const storageKey = `addProgress_${customerId}_${Date.now()}`;
    const existingKey = sessionStorage.getItem(`addProgress_${customerId}`);
    if (existingKey) return undefined;

    sessionStorage.setItem(`addProgress_${customerId}`, storageKey);

    const contractIdFromUrl = params.get('contractId');

    // Wait for customer data to load before opening modal
    const openModal = () => {
      if (contractIdFromUrl) {
        setCustomer((prev) =>
          prev.serviceContractId !== contractIdFromUrl ? { ...prev, serviceContractId: contractIdFromUrl } : prev
        );
      }

      setIsAddFormOpen(true);

      // Clean up URL params
      params.delete('add');
      params.delete('contractId');
      const newSearch = params.toString();
      navigate({ pathname: location.pathname, search: newSearch ? `?${newSearch}` : '' }, { replace: true });
    };

    // If customer is still loading, wait a bit
    let timer: NodeJS.Timeout | undefined;

    if (customerLoading) {
      timer = setTimeout(openModal, 300);
    } else {
      openModal();
    }

    // Always return cleanup function
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run ONCE on mount only

  // Cleanup sessionStorage when component unmounts
  useEffect(() => {
    return () => {
      if (customerId) {
        sessionStorage.removeItem(`addProgress_${customerId}`);
      }
    };
  }, [customerId]);

  const handleCreateMealPlan = async (payload: MealPlanFormValues) => {
    if (!customerId || !activeGoal?.id) {
      toast.error(t('progress_detail.meal_plan.toast.need_goal'));
      return;
    }

    const res = await createMealPlan({
      ...payload,
      customerId,
      customerGoalId: activeGoal.id
    });
    if (res.success) {
      toast.success(t('progress_detail.meal_plan.toast.create_success'));
      setIsMealPlanModalOpen(false);
      setIsAiGeneratedMealPlan(false); // Clear AI flag after save
      await refetchMealPlans();
      setMealPlanPage(1);
    } else {
      toast.error(res.message || t('progress_detail.meal_plan.toast.create_fail'));
    }
  };

  const handleUpsertMealPlan = async (payload: MealPlanFormValues) => {
    if (!customerId || !activeGoal?.id) {
      toast.error(t('progress_detail.meal_plan.toast.need_goal'));
      return;
    }

    if (mealPlanMode === 'edit' && selectedMealPlanId) {
      const res = await updateMealPlan(selectedMealPlanId, {
        ...payload,
        customerId,
        customerGoalId: activeGoal.id
      });
      if (res.success) {
        toast.success(t('progress_detail.meal_plan.toast.update_success'));
        setIsMealPlanModalOpen(false);
        setSelectedMealPlanId(null);
        setSelectedMealPlan(null);
        setMealPlanMode('create');
        setIsAiGeneratedMealPlan(false); // Clear AI flag after save
        await refetchMealPlans();
        setMealPlanPage(1);
      } else {
        toast.error(res.message || t('progress_detail.meal_plan.toast.update_fail'));
      }
    } else {
      await handleCreateMealPlan(payload);
    }
  };

  const openCreate = () => {
    setMealPlanMode('create');
    setSelectedMealPlan(null);
    setSelectedMealPlanId(null);
    setIsAiGeneratedMealPlan(false); // Clear AI flag when creating manually
    setIsMealPlanModalOpen(true);
  };

  const handleGenerateMealPlan = async () => {
    if (!customerId || !customer.serviceContractId) {
      toast.error(t('progress_detail.meal_plan.toast.need_contract'));
      return;
    }

    if (!activeGoal?.id) {
      toast.error(t('progress_detail.meal_plan.toast.need_goal'));
      return;
    }

    generateCancelledRef.current = false;
    try {
      const response = await generateMealPlan({
        customerId,
        serviceContractId: customer.serviceContractId,
        days: 7
      });

      if (generateCancelledRef.current) return;

      if (response.success && response.data) {
        // Backend returns { backend_plan: {...} } directly
        const backendPlan = response.data.backend_plan || response.data;

        // Add unique AI ID and item ID to each item for tracking
        const daysWithAiIds = (backendPlan.days || []).map((day, dayIdx) => ({
          ...day,
          meals: (day.meals || []).map((meal, mealIdx) => ({
            ...meal,
            items: (meal.items || []).map((item, itemIdx) => ({
              ...item,
              _aiId: `ai-${dayIdx}-${mealIdx}-${itemIdx}-${Date.now()}-${Math.random()}`, // Unique ID for AI-generated items
              _itemId: `item-${dayIdx}-${mealIdx}-${itemIdx}-${Date.now()}-${Math.random()}` // Unique ID for React key
            }))
          }))
        }));

        // Map backend_plan to MealPlanFormValues format. Note: backend_plan uses camelCase (customerId) but form expects same structure
        const formData: Partial<MealPlan> = {
          customerId,
          customerGoalId: activeGoal.id,
          name: backendPlan.name || `Meal plan tuần 1 - ${backendPlan.focus || 'cutting'}`,
          goal: backendPlan.goal,
          focus: backendPlan.focus,
          targetCalories: backendPlan.targetCalories,
          notes: backendPlan.notes,
          status: (backendPlan.status as MealPlan['status']) || 'SUGGESTED',
          days: daysWithAiIds
        };

        // Set as selected meal plan to populate form (cast to MealPlan for type compatibility)
        if (generateCancelledRef.current) return;

        setSelectedMealPlan({
          ...formData,
          _id: '', // Will be created when saved
          createdBy: currentUser?._id || '',
          updatedBy: currentUser?._id || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as MealPlan);
        setMealPlanMode('create');
        setSelectedMealPlanId(null);
        setIsAiGeneratedMealPlan(true); // Mark as AI generated
        setIsMealPlanModalOpen(true);
        toast.success(t('progress_detail.meal_plan.toast.generate_success'));
      } else {
        const message = mapAiErrorMessage(response.message || (response as unknown as { error?: string }).error, t);
        toast.error(message || t('progress_detail.meal_plan.toast.generate_fail'));
      }
    } catch (error: unknown) {
      console.error('Generate meal plan error:', error);
      const errorPayload =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: unknown } })?.response?.data
          : undefined;
      const message =
        mapAiErrorMessage(errorPayload, t) ||
        mapAiErrorMessage(
          errorPayload &&
            typeof errorPayload === 'object' &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((errorPayload as any).message || (errorPayload as any).detail || (errorPayload as any).error),
          t
        ) ||
        mapAiErrorMessage(
          error && typeof error === 'object' && 'message' in error
            ? (error as { message?: string }).message
            : undefined,
          t
        );
      toast.error(message || t('progress_detail.meal_plan.toast.generate_fail'));
    }
  };

  const handleCancelGenerate = () => {
    generateCancelledRef.current = true;
    cancelGenerateMealPlan();
    toast.info(t('progress_detail.meal_plan.toast.generate_cancelled'));
  };

  const openView = async (id: string) => {
    const res = await getMealPlanById(id);
    if (res.success) {
      setSelectedMealPlan(res.data);
      setSelectedMealPlanId(id);
      setMealPlanMode('view');
      setIsAiGeneratedMealPlan(false); // Clear AI flag when viewing (will be set again if editing)
      setIsMealPlanModalOpen(true);
    } else {
      toast.error(res.message || t('progress_detail.meal_plan.toast.fetch_fail'));
    }
  };

  const openEdit = async (id: string) => {
    const res = await getMealPlanById(id);
    if (res.success) {
      setSelectedMealPlan(res.data);
      setSelectedMealPlanId(id);
      setMealPlanMode('edit');
      setIsAiGeneratedMealPlan(false); // Clear AI flag when editing manually
      setIsMealPlanModalOpen(true);
    } else {
      toast.error(res.message || t('progress_detail.meal_plan.toast.fetch_fail'));
    }
  };

  const openDeleteMealPlan = (id: string) => {
    setPendingDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteMealPlan = async () => {
    if (!pendingDeleteId) {
      setIsDeleteModalOpen(false);
      return;
    }
    const res = await deleteMealPlan(pendingDeleteId);
    if (res.success) {
      toast.success(t('progress_detail.meal_plan.toast.delete_success'));
      await refetchMealPlans();
      if (selectedMealPlanId === pendingDeleteId) {
        setSelectedMealPlanId(null);
        setSelectedMealPlan(null);
        setIsMealPlanModalOpen(false);
      }
      setMealPlanPage(1);
    } else {
      toast.error(res.message || t('progress_detail.meal_plan.toast.delete_fail'));
    }
    setIsDeleteModalOpen(false);
    setPendingDeleteId(null);
  };

  const handleBack = () => {
    navigate('/manage/pt/clients');
  };

  const handleAddProgress = (_data: ProgressFormData) => {
    // The API call is handled in AddProgressForm, this is just for UI updates
    setIsAddFormOpen(false);
    // Refetch data to get updated list
    refetch();
  };

  const handleEditProgress = (_data: EditProgressFormData) => {
    // The API call is handled in EditProgressForm, this is just for UI updates
    setEditingLog(null);
    // Refetch data to get updated list
    refetch();
  };

  const handleDeleteProgress = () => {
    // The API call is handled in TrainingLogTable, this is just for UI updates
    // Refetch data to get updated list
    refetch();
  };

  // Convert progressList to chart data format
  const chartData = progressList.map((progress) => ({
    date: progress.date,
    weight: progress.weight,
    strength: progress.strength
  }));

  // progressList is returned in DESC order (newest first) from the API.
  // For "last 4 weeks" we want the most recent records, not the oldest ones.
  const filteredChartData = chartFilter === '4weeks' ? chartData.slice(0, 4) : chartData;
  const chartToggleClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      active ? 'bg-white text-[#101D33] shadow-sm' : 'text-slate-600 hover:text-slate-900'
    }`;

  const FormComponent = isDesktop ? Dialog : Drawer;
  const FormContent = isDesktop ? DialogContent : DrawerContent;
  const FormHeader = isDesktop ? DialogHeader : DrawerHeader;
  const FormTitle = isDesktop ? DialogTitle : DrawerTitle;

  return (
    <div className="min-h-screen bg-[#f1f3f4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Loading State */}
        {customerLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F05A29] mx-auto mb-4"></div>
              <p className="text-gray-600">{t('progress_detail.loading')}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header Section */}
            <div className="space-y-4">
              {/* Breadcrumb */}
              <div className="flex items-center text-sm text-gray-600">
                <button onClick={handleBack} className="hover:text-[#F05A29] transition-colors">
                  {t('progress_detail.breadcrumb.customers')}
                </button>
                <span className="mx-2">/</span>
                <span className="text-gray-400">{customer.name}</span>
                <span className="mx-2">/</span>
                <span className="text-[#F05A29] font-medium">{t('progress_detail.breadcrumb.progress')}</span>
              </div>

              {/* Customer Info & Actions */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Customer Info */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={customer.avatar} alt={customer.name} />
                    <AvatarFallback className="bg-[#F05A29] text-white text-lg">
                      {customer.name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-[#101D33]">{customer.name}</h1>
                    <p className="text-gray-600">{customer.package}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    {t('progress_detail.back_to_detail')}
                  </Button>

                  <Button
                    onClick={() => setIsAddFormOpen(true)}
                    className="bg-[#F05A29] hover:bg-[#E04A1F] text-white flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {t('progress_detail.add_progress')}
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Weight className="h-8 w-8 text-[#F05A29]" />
                    </div>
                    <p className="text-sm text-gray-600">{t('progress_detail.stats.weight_now')}</p>
                    <p className="text-2xl font-bold text-[#101D33]">
                      {customerStats?.currentWeight ||
                        progressList[0]?.weight ||
                        t('progress_detail.stats.not_available')}{' '}
                      {customerStats?.currentWeight || progressList[0]?.weight ? t('progress_detail.stats.kg') : ''}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Dumbbell className="h-8 w-8 text-[#F05A29]" />
                    </div>
                    <p className="text-sm text-gray-600">{t('progress_detail.stats.strength_score')}</p>
                    <p className="text-2xl font-bold text-[#101D33]">
                      {customerStats?.currentStrengthScore ||
                        progressList[0]?.strength ||
                        t('progress_detail.stats.not_available')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="h-8 w-8 text-[#F05A29]" />
                    </div>
                    <p className="text-sm text-gray-600">{t('progress_detail.stats.bmi')}</p>
                    <p className="text-2xl font-bold text-[#101D33]">
                      {customerStats?.currentBMI || progressList[0]?.bmi || t('progress_detail.stats.not_available')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className="h-8 w-8 text-[#F05A29]" />
                    </div>
                    <p className="text-sm text-gray-600">{t('progress_detail.stats.last_updated')}</p>
                    <p className="text-sm font-medium text-[#101D33]">
                      {progressList[0]?.date || t('progress_detail.stats.not_available')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Goal Card - Between Stats and Charts */}
            <GoalCard goal={activeGoal} currentProgress={radarCurrentData} onEdit={() => setIsGoalFormOpen(true)} />

            {/* Main Content */}
            <div className="space-y-6">
              {/* Charts Grid - Radar and Line Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar Chart - Body Metrics Overview */}
                {/* currentData = most recent record with body measurements */}
                {/* previousData = second most recent record with body measurements */}
                <TrainingProgressRadarChart currentData={radarCurrentData} previousData={radarFirstData} />

                {/* Training Progress Line Chart */}
                <Card>
                  <CardHeader className="pb-4 gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold text-[#101D33]">
                        {t('progress_detail.chart.title')}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {t('progress_detail.chart.description', 'Track weight and strength over time')}
                      </CardDescription>
                    </div>
                    <div className="col-span-full">
                      <div className="grid h-11 w-full grid-cols-2 rounded-full bg-slate-100 p-1 shadow-inner">
                        <button
                          type="button"
                          onClick={() => setChartFilter('4weeks')}
                          className={chartToggleClass(chartFilter === '4weeks')}
                        >
                          {t('progress_detail.chart.last_4_weeks')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartFilter('all')}
                          className={chartToggleClass(chartFilter === 'all')}
                        >
                          {t('progress_detail.chart.all_time')}
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-10">
                    <TrainingProgressChart data={filteredChartData} onAddProgress={() => setIsAddFormOpen(true)} />
                  </CardContent>
                </Card>
              </div>

              {/* Training Log */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-[#101D33]">{t('progress_detail.table.title')}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <TrainingLogTable logs={progressList} onEdit={setEditingLog} onDelete={handleDeleteProgress} />
                </CardContent>
              </Card>
            </div>

            {/* Add Progress Form */}
            <FormComponent open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
              <FormContent className={isDesktop ? 'max-w-3xl max-h-[85vh] overflow-y-auto hide-scrollbar' : ''}>
                <FormHeader>
                  <FormTitle>{t('progress_detail.form.add_title')}</FormTitle>
                </FormHeader>
                {/* Mobile: wrap in scrollable div with data-vaul-no-drag to prevent drawer close on scroll */}
                <div
                  className={isDesktop ? '' : 'max-h-[75vh] overflow-y-auto'}
                  data-vaul-no-drag={!isDesktop ? '' : undefined}
                >
                  <AddProgressForm
                    customerId={customer.id}
                    serviceContractId={customer.serviceContractId}
                    trainerId={customer.trainerId}
                    onSubmit={handleAddProgress}
                    onCancel={() => setIsAddFormOpen(false)}
                  />
                </div>
              </FormContent>
            </FormComponent>

            {/* Edit Progress Form */}
            <FormComponent open={!!editingLog} onOpenChange={() => setEditingLog(null)}>
              <FormContent className={isDesktop ? 'max-w-3xl max-h-[85vh] overflow-y-auto hide-scrollbar' : ''}>
                <FormHeader>
                  <FormTitle>{t('progress_detail.form.edit_title')}</FormTitle>
                </FormHeader>
                {editingLog && (
                  <div
                    className={isDesktop ? '' : 'max-h-[75vh] overflow-y-auto'}
                    data-vaul-no-drag={!isDesktop ? '' : undefined}
                  >
                    <EditProgressForm
                      progressId={editingLog.id}
                      initialData={editingLog}
                      onSubmit={handleEditProgress}
                      onCancel={() => setEditingLog(null)}
                    />
                  </div>
                )}
              </FormContent>
            </FormComponent>

            {/* Goal Form */}
            <FormComponent open={isGoalFormOpen} onOpenChange={setIsGoalFormOpen}>
              <FormContent className={isDesktop ? 'max-w-3xl max-h-[85vh] overflow-y-auto hide-scrollbar' : ''}>
                <FormHeader>
                  <FormTitle>
                    {activeGoal ? t('goal_form.edit_title', 'Edit Goal') : t('goal_form.create_title', 'Create Goal')}
                  </FormTitle>
                </FormHeader>
                <div
                  className={isDesktop ? '' : 'max-h-[75vh] overflow-y-auto'}
                  data-vaul-no-drag={!isDesktop ? '' : undefined}
                >
                  <GoalForm
                    customerId={customer.id}
                    serviceContractId={customer.serviceContractId}
                    trainerId={customer.trainerId}
                    branchId={''} // Backend will extract from serviceContract if available
                    initialGoal={activeGoal}
                    onSubmit={async () => {
                      await Promise.all([refetchGoal(), refetch()]);
                      setIsGoalFormOpen(false);
                    }}
                    onCancel={() => setIsGoalFormOpen(false)}
                  />
                </div>
              </FormContent>
            </FormComponent>

            {/* Meal Plans Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold text-[#101D33]">
                  {t('progress_detail.meal_plan.title')}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerateMealPlan}
                    className="bg-[#4CAF50] hover:bg-[#45a049] text-white"
                    disabled={generatingMealPlan || creatingMealPlan}
                  >
                    {generatingMealPlan
                      ? t('progress_detail.meal_plan.generating')
                      : t('progress_detail.meal_plan.generate')}
                  </Button>
                  <Button
                    onClick={openCreate}
                    className="bg-[#F05A29] hover:bg-[#E04A1F] text-white"
                    disabled={creatingMealPlan || generatingMealPlan}
                  >
                    {t('progress_detail.meal_plan.create')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  if (mealPlanLoading) {
                    return <p className="text-gray-600">{t('progress_detail.meal_plan.loading')}</p>;
                  }
                  if (mealPlans.length === 0) {
                    return <p className="text-gray-600">{t('progress_detail.meal_plan.empty')}</p>;
                  }
                  const totalPages = Math.max(1, Math.ceil(mealPlans.length / mealPlanPageSize));
                  const start = (mealPlanPage - 1) * mealPlanPageSize;
                  const pagedPlans = mealPlans.slice(start, start + mealPlanPageSize);

                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {pagedPlans.map((plan) => (
                          <div key={plan._id} className="border rounded-lg p-3 bg-white shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold text-[#101D33] line-clamp-1">
                                {plan.name || 'Meal Plan'}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="capitalize">
                                  {(plan.status ?? 'unknown').toLowerCase()}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openView(plan._id)}>
                                      {t('progress_detail.meal_plan.view')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openEdit(plan._id)}>
                                      {t('progress_detail.meal_plan.edit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openDeleteMealPlan(plan._id)}>
                                      {t('progress_detail.meal_plan.delete')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
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
                      {totalPages > 1 && (
                        <div className="flex justify-center pt-2">
                          <Pagination>
                            <PaginationContent>
                              <PaginationPrevious
                                onClick={() => mealPlanPage > 1 && setMealPlanPage(mealPlanPage - 1)}
                                className={mealPlanPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                              />
                              {Array.from({ length: totalPages }).map((_, idx) => {
                                const page = idx + 1;
                                return (
                                  <PaginationItem key={page}>
                                    <PaginationLink
                                      isActive={page === mealPlanPage}
                                      onClick={() => setMealPlanPage(page)}
                                    >
                                      {page}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              })}
                              <PaginationNext
                                onClick={() => mealPlanPage < totalPages && setMealPlanPage(mealPlanPage + 1)}
                                className={mealPlanPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                              />
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Meal Plan Modal */}
            <Dialog
              open={isMealPlanModalOpen}
              onOpenChange={(open) => {
                setIsMealPlanModalOpen(open);
                if (!open) {
                  // Clear AI flag when modal closes
                  setIsAiGeneratedMealPlan(false);
                }
              }}
            >
              <DialogContent className="max-w-4xl max-h-[85vh]">
                <DialogHeader>
                  <DialogTitle>{mealPlanModalTitle}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-4">
                  {mealPlanMode === 'view' && selectedMealPlan ? (
                    <MealPlanDetail
                      mealPlan={selectedMealPlan}
                      onEdit={() => openEdit(selectedMealPlan._id)}
                      onDelete={() => openDeleteMealPlan(selectedMealPlan._id)}
                    />
                  ) : (
                    <MealPlanForm
                      loading={creatingMealPlan || updatingMealPlan}
                      initialValues={{
                        ...(selectedMealPlan || {}),
                        name: selectedMealPlan?.name ?? '',
                        customerId: customerId || '',
                        customerGoalId: activeGoal?.id || '',
                        status: selectedMealPlan?.status || 'SUGGESTED',
                        days: selectedMealPlan?.days || []
                      }}
                      onSubmit={handleUpsertMealPlan}
                      isAiGenerated={isAiGeneratedMealPlan}
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <DeleteConfirmationModal
              isOpen={isDeleteModalOpen}
              onClose={() => {
                setIsDeleteModalOpen(false);
                setPendingDeleteId(null);
              }}
              onConfirm={confirmDeleteMealPlan}
              isLoading={creatingMealPlan || updatingMealPlan}
            />

            {/* Generate Meal Plan Loading Modal */}
            <Dialog open={generatingMealPlan} onOpenChange={(open) => !open && handleCancelGenerate()}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('progress_detail.meal_plan.generating')}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center py-2 space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-[#F05A29]" />
                  <p className="text-sm text-muted-foreground text-center">
                    {t('progress_detail.meal_plan.generating')}
                  </p>
                  <Button variant="outline" onClick={handleCancelGenerate} disabled={!generatingMealPlan}>
                    {t('dashboard.cancel')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Floating Add Button for Mobile */}
            {!isDesktop && (
              <Button
                onClick={() => setIsAddFormOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#F05A29] hover:bg-[#E04A1F] shadow-lg z-50"
                size="icon"
              >
                <Plus className="h-6 w-6" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
