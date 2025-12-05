import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Plus, Calendar, Weight, Dumbbell, Target } from 'lucide-react';
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
import { toast } from 'sonner';
import type { TrainingProgressDisplay } from '@/types/api/TrainingProgress';
import type { ProgressFormData, EditProgressFormData, CustomerStats } from '@/types/forms/Progress';

export default function TrainingProgressDetailPage() {
  const { t } = useTranslation();
  const { id: customerId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useUser();
  const isDesktop = !useIsMobile(1024);

  // Get serviceContractId from navigation state
  const serviceContractId = location.state?.serviceContractId;
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
  // Previous = second most recent record with body measurements
  const radarCurrentData = recordsWithBodyMeasurements[0] || progressList[0] || null;
  const radarPreviousData = recordsWithBodyMeasurements[1] || null;
  const [customerLoading, setCustomerLoading] = useState(true);

  // Load customer data from API
  useEffect(() => {
    const loadCustomerData = async () => {
      if (customerId) {
        // Check if serviceContractId is available
        if (!serviceContractId) {
          toast.error(t('progress_detail.error.no_contract'));
          navigate('/manage/pt/clients');
          return;
        }

        // Check if trainerId is available
        if (!currentUser?._id) {
          toast.error(t('progress_detail.error.no_trainer'));
          navigate('/login');
          return;
        }

        setCustomerLoading(true);
        const response = await customerApi.getCustomerById(customerId);

        if (response.success) {
          // Transform the customer data to match our expected format
          setCustomer({
            id: response.data.id,
            name: response.data.name || 'Unknown',
            phone: response.data.phone,
            email: response.data.email,
            avatar: '/avatars/customer-1.jpg', // Default avatar since CustomerDisplay doesn't have avatar
            package: response.data.membershipType || 'Personal Training - Basic',
            status: response.data.membershipStatus === 'ACTIVE' ? 'Active' : 'Inactive',
            serviceContractId: serviceContractId || '', // Use from navigation state
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
  }, [customerId, serviceContractId, currentUser?._id, navigate]);

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

  const filteredChartData = chartFilter === '4weeks' ? chartData.slice(-4) : chartData;

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
                    <Badge
                      variant={customer.status === 'Active' ? 'default' : 'secondary'}
                      className={customer.status === 'Active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {customer.status === 'Active'
                        ? t('progress_detail.status.active')
                        : t('progress_detail.status.inactive')}
                    </Badge>
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
                <TrainingProgressRadarChart currentData={radarCurrentData} previousData={radarPreviousData} />

                {/* Training Progress Line Chart */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-bold text-[#101D33]">
                      {t('progress_detail.chart.title')}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant={chartFilter === '4weeks' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChartFilter('4weeks')}
                        className={chartFilter === '4weeks' ? 'bg-[#F05A29] hover:bg-[#E04A1F]' : ''}
                      >
                        {t('progress_detail.chart.last_4_weeks')}
                      </Button>
                      <Button
                        variant={chartFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChartFilter('all')}
                        className={chartFilter === 'all' ? 'bg-[#F05A29] hover:bg-[#E04A1F]' : ''}
                      >
                        {t('progress_detail.chart.all_time')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <TrainingProgressChart data={filteredChartData} />
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
                    onSubmit={() => {
                      setIsGoalFormOpen(false);
                      refetchGoal();
                    }}
                    onCancel={() => setIsGoalFormOpen(false)}
                  />
                </div>
              </FormContent>
            </FormComponent>

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
