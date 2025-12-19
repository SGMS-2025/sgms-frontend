import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  Dumbbell,
  FileText,
  IdCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
  XCircle
} from 'lucide-react';
import { PTRegistrationDialog } from '@/components/customer/registration/PTRegistrationDialog';
import { ClassRegistrationDialog } from '@/components/customer/registration/ClassRegistrationDialog';
import { MembershipRegistrationDialog } from '@/components/customer/registration/MembershipRegistrationDialog';
import { PaymentHistoryTab } from '@/components/customer/PaymentHistoryTab';
import { ExtendMembershipDialog } from '@/components/customer/ExtendMembershipDialog';
import { CancelServiceContractDialog } from '@/components/customer/CancelServiceContractDialog';
import { ExtendServiceContractDialog } from '@/components/customer/ExtendServiceContractDialog';
import { CancelMembershipDialog } from '@/components/modals/CancelMembershipDialog';
import { ContractDocumentsTab } from '@/components/customer/ContractDocumentsTab';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { customerApi } from '@/services/api/customerApi';
import { useBranch } from '@/contexts/BranchContext';
import { socketService } from '@/services/socket/socketService';
import { cn, debounce } from '@/utils/utils';
import { canCancelMembership } from '@/utils/membership';
import type { CustomerDisplay } from '@/types/api/Customer';
import type { MembershipContract } from '@/types/api/Membership';
import type { MembershipContractUpdateEvent } from '@/types/api/Socket';
import type { LucideIcon } from 'lucide-react';

const formatDate = (value?: string, locale: string = 'vi-VN') => {
  if (!value) return '—';
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return parsed.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatCurrency = (value?: string | number, locale: string = 'vi-VN') => {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  const amount = typeof value === 'number' ? value : Number(value);

  if (Number.isNaN(amount)) {
    return typeof value === 'string' ? value : '—';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
};

const getStatusBadgeStyles = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'border-emerald-400/60 bg-emerald-500/90 text-white';
    case 'INACTIVE':
      return 'border-slate-400/60 bg-slate-500/90 text-white';
    case 'SUSPENDED':
      return 'border-amber-400/70 bg-amber-500/90 text-white';
    default:
      return 'border-white/40 bg-white/20 text-white';
  }
};

const InfoField = ({ label, value }: { label: string; value?: ReactNode }) => (
  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
    <div className="text-sm font-semibold text-foreground">
      {value ?? <span className="text-muted-foreground">—</span>}
    </div>
  </div>
);

type PlaceholderCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const PlaceholderCard = ({ icon: Icon, title, description }: PlaceholderCardProps) => (
  <Card className="rounded-3xl border border-dashed border-border/60 bg-muted/30 shadow-none">
    <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
);

const CustomerDetailPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const { currentBranch } = useBranch();

  const [customer, setCustomer] = useState<CustomerDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  // Registration modals state
  const [showPTModal, setShowPTModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [isMembershipQRPaymentActive, setIsMembershipQRPaymentActive] = useState(false);
  const [membershipWizardStep, setMembershipWizardStep] = useState<'form' | 'payment' | 'success'>('form');

  // Cancel modals state
  const [showCancelMembership, setShowCancelMembership] = useState(false);
  const [showCancelPT, setShowCancelPT] = useState(false);
  const [showCancelClass, setShowCancelClass] = useState(false);

  // Extend modals state
  const [showExtendMembership, setShowExtendMembership] = useState(false);
  const [showExtendPT, setShowExtendPT] = useState(false);
  const [showExtendClass, setShowExtendClass] = useState(false);

  // Ref to abort previous requests (prevent race conditions)
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasCustomerDataRef = useRef(false);

  const fetchCustomerDetail = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!id) return;

      // Abort previous request if still in flight
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      const silent = options?.silent ?? false;
      const shouldShowLoading = !hasCustomerDataRef.current || !silent;

      if (shouldShowLoading) {
        setLoading(true);
      }
      if (!silent) {
        setError(null);
      }

      try {
        // Pass branchId if available (for PT/Staff role to check branch access)
        // If branchId is not available, backend will extract it from customer record
        const branchId = currentBranch?._id;
        const response = await customerApi.getCustomerById(id, branchId);

        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        if (response.success && response.data) {
          setCustomer(response.data);
          hasCustomerDataRef.current = true;
          // Clear any previous error when refresh succeeds
          setError(null);
        } else if (!silent) {
          setError(response.message || t('customer_detail.error.fetch_failed'));
        } else {
          console.error(
            '[CustomerDetailPage] Silent refresh failed:',
            response.message || t('customer_detail.error.fetch_failed')
          );
        }
      } catch (fetchError: unknown) {
        // Don't show error if request was aborted
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return;
        }

        console.error('Error fetching customer detail:', fetchError);
        // Check if it's an axios error with response
        if (!silent) {
          if (fetchError && typeof fetchError === 'object' && 'response' in fetchError) {
            const axiosError = fetchError as { response?: { data?: { message?: string } } };
            const errorMessage = axiosError.response?.data?.message || t('customer_detail.error.fetch_error');
            setError(errorMessage);
          } else {
            setError(t('customer_detail.error.fetch_error'));
          }
        }
      } finally {
        // Clear loading only when we actually showed it (background refresh keeps UI visible)
        if (shouldShowLoading) {
          setLoading(false);
        }
      }
    },
    [id, currentBranch?._id, t]
  );

  // Debounced version of fetchCustomerDetail (1 second delay)
  // This prevents multiple rapid API calls when socket events fire in quick succession
  // Use useRef to maintain stable debounced function across renders
  const fetchCustomerDetailRef = useRef(fetchCustomerDetail);

  // Keep ref updated with latest function
  useEffect(() => {
    fetchCustomerDetailRef.current = fetchCustomerDetail;
  }, [fetchCustomerDetail]);

  // Create stable debounced function that always calls the latest fetchCustomerDetail
  const debouncedFetchCustomerDetail = useMemo(
    () => debounce(() => fetchCustomerDetailRef.current({ silent: true }), 1000),
    [] // Empty deps - function is stable and always calls latest ref value
  );

  useEffect(() => {
    if (id) {
      void fetchCustomerDetail();
    }

    // Cleanup: abort any pending requests when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id, fetchCustomerDetail]);

  // Redirect to customers list when branch changes while on detail page
  const previousBranchIdRef = useRef<string | undefined>(undefined);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    // Skip on initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousBranchIdRef.current = currentBranch?._id;
      return;
    }

    const previousBranchId = previousBranchIdRef.current;
    const currentBranchId = currentBranch?._id;

    // If branch changed (and we had a previous branch), redirect to customers list
    if (previousBranchId && currentBranchId && previousBranchId !== currentBranchId) {
      navigate('/manage/customers');
      return;
    }

    // Update ref for next comparison
    previousBranchIdRef.current = currentBranchId;
  }, [currentBranch?._id, navigate]);

  // Listen for membership contract updates (realtime)
  // useCallback ensures stable reference to prevent memory leaks
  const handleMembershipContractUpdate = useCallback(
    (data: MembershipContractUpdateEvent) => {
      // Convert customerId to string for comparison
      const updateCustomerId = data.customerId?.toString();
      const currentCustomerId = customer?.id?.toString();

      // Skip refresh while membership wizard is open and not yet success
      if (showMembershipModal && membershipWizardStep !== 'success') {
        return;
      }

      if (isMembershipQRPaymentActive) {
        // Skip refresh while membership QR payment step is active to avoid wizard reset
        return;
      }

      if (updateCustomerId === currentCustomerId || (!customer && id)) {
        // Use debounced version to prevent rapid successive calls
        debouncedFetchCustomerDetail();
      }
    },
    [id, debouncedFetchCustomerDetail, customer, isMembershipQRPaymentActive, showMembershipModal, membershipWizardStep]
  );

  useEffect(() => {
    if (!id) return;

    // Listen for membership contract update events from socket
    socketService.on('membership:contract:updated', handleMembershipContractUpdate);

    // Listen for payment update events to refresh customer detail when payment status changes
    const handlePaymentUpdate = (data: { customerId?: string | number; status?: string }) => {
      const updateCustomerId = data.customerId?.toString();
      const currentCustomerId = customer?.id?.toString();

      // Only refresh if payment was cancelled and it's for this customer
      if (data.status === 'CANCELLED' && updateCustomerId === currentCustomerId) {
        // Use debounced version to prevent rapid successive calls
        debouncedFetchCustomerDetail();
      }
    };

    socketService.on('payment:updated', handlePaymentUpdate);

    return () => {
      socketService.off('membership:contract:updated', handleMembershipContractUpdate);
      socketService.off('payment:updated', handlePaymentUpdate);
    };
  }, [id, handleMembershipContractUpdate, debouncedFetchCustomerDetail, customer?.id]); // Stable dependencies

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return t('customer_modal.status_active');
      case 'INACTIVE':
        return t('customer_modal.status_inactive');
      case 'SUSPENDED':
        return t('customer_modal.status_suspended');
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('customer_detail.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="rounded-2xl border border-destructive/40 bg-destructive/10">
          <AlertTitle>{t('customer_detail.error.title')}</AlertTitle>
          <AlertDescription>{error || t('customer_detail.error.not_found')}</AlertDescription>
        </Alert>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="rounded-full" onClick={() => fetchCustomerDetail()}>
            {t('customer_detail.error.retry')}
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate('/manage/customers')}>
            <ArrowLeft className="h-4 w-4" />
            {t('customer_detail.error.back_to_list')}
          </Button>
        </div>
      </div>
    );
  }

  const branchNames =
    customer.branches
      ?.map((branch) => branch.branchName)
      .filter(Boolean)
      .join(', ') || undefined;
  const membershipContract = customer.latestMembershipContract;
  const statusLabel = getStatusText(customer.status);

  // Separate PT and Class contracts from allServiceContracts based on packageType
  interface ServiceContractItem {
    _id?: string;
    packageType?: string;
    status?: string;
    paymentStatus?: string;
    servicePackageId?: { name?: string };
    paidAmount?: number;
    total?: number;
    startDate?: string;
    endDate?: string;
    sessionCount?: number;
    sessionsRemaining?: number;
    sessionsUsed?: number;
  }

  const allServiceContracts: ServiceContractItem[] =
    (customer as CustomerDisplay & { allServiceContracts?: ServiceContractItem[] }).allServiceContracts || [];
  const ptContract = allServiceContracts.find(
    (contract) =>
      contract.packageType === 'PT' &&
      contract.status &&
      !['CANCELED', 'EXPIRED', 'SUSPENDED', 'DELETED'].includes(contract.status)
  );
  const classContract = allServiceContracts.find(
    (contract) =>
      contract.packageType === 'CLASS' &&
      contract.status &&
      !['CANCELED', 'EXPIRED', 'SUSPENDED', 'DELETED'].includes(contract.status)
  );

  // Only show membership/service info if contract is active
  const isActiveMembership =
    membershipContract?.status && !['CANCELED', 'EXPIRED', 'SUSPENDED'].includes(membershipContract.status);
  const isActivePT = ptContract?.status && !['CANCELED', 'EXPIRED', 'SUSPENDED'].includes(ptContract.status);
  const isActiveClass = classContract?.status && !['CANCELED', 'EXPIRED', 'SUSPENDED'].includes(classContract.status);

  const notUpdatedText = t('customer_detail.not_updated');
  const membershipPlanName = isActiveMembership
    ? customer.latestMembershipContract?.membershipPlanId?.name || customer.membershipType || notUpdatedText
    : notUpdatedText;
  const ptPackageName = isActivePT ? ptContract.servicePackageId?.name || '—' : '—';
  const classPackageName = isActiveClass ? classContract.servicePackageId?.name || '—' : '—';

  // Determine if customer has active PT or CLASS package (not canceled, expired, or suspended)
  // Also show PENDING_ACTIVATION if fully paid (paidAmount >= total)
  const isPTFullyPaid =
    ptContract &&
    ptContract.paidAmount !== undefined &&
    ptContract.total !== undefined &&
    ptContract.paidAmount >= ptContract.total;
  const isClassFullyPaid =
    classContract &&
    classContract.paidAmount !== undefined &&
    classContract.total !== undefined &&
    classContract.paidAmount >= classContract.total;

  const hasPTPackage =
    ptContract &&
    ptContract.status &&
    (['ACTIVE', 'PAST_DUE'].includes(ptContract.status) ||
      (ptContract.status === 'PENDING_ACTIVATION' && isPTFullyPaid));
  const hasClassPackage =
    classContract &&
    classContract.status &&
    (['ACTIVE', 'PAST_DUE'].includes(classContract.status) ||
      (classContract.status === 'PENDING_ACTIVATION' && isClassFullyPaid));

  // Check if customer has active membership (not canceled, expired, or suspended)
  const hasMembership =
    membershipPlanName &&
    membershipPlanName !== notUpdatedText &&
    membershipContract?.status &&
    !['CANCELED', 'EXPIRED', 'SUSPENDED'].includes(membershipContract.status);

  const totalSpentDisplay = formatCurrency(customer.totalSpent, locale);
  const totalSpentLabel = totalSpentDisplay === '—' ? notUpdatedText : totalSpentDisplay;
  const lastPaymentDisplay = formatDate(customer.lastPaymentDate, locale);
  const lastPaymentLabel = lastPaymentDisplay === '—' ? t('customer_detail.no_transaction') : lastPaymentDisplay;

  // Get membership dates from contract if available and active, otherwise from customer
  const membershipJoinDate =
    isActiveMembership && membershipContract?.startDate ? membershipContract.startDate : customer.joinDate;
  const membershipExpiryDate =
    isActiveMembership && membershipContract?.endDate ? membershipContract.endDate : customer.expiryDate;

  // Get membership status from contract if available
  const getMembershipStatusLabel = (status?: string) => {
    if (!status) return notUpdatedText;
    return t(`membership.status.${status.toLowerCase()}`, { defaultValue: status });
  };

  const membershipStatusDisplay =
    isActiveMembership && membershipContract?.status
      ? getMembershipStatusLabel(membershipContract.status)
      : t('customer_detail.no_package');
  const membershipPaymentStatusDisplay =
    membershipContract?.paymentStatus ||
    (membershipContract?.paidAmount && membershipContract?.totalAmount
      ? membershipContract.paidAmount >= (membershipContract.totalAmount || 0)
        ? 'PAID'
        : 'PENDING'
      : undefined);

  const getPaymentStatusDisplay = (paymentStatus?: string, paidAmount?: number, total?: number) => {
    if (paymentStatus) return paymentStatus;
    if (paidAmount !== undefined && total !== undefined) {
      return paidAmount >= total ? 'PAID' : 'PENDING';
    }
    return t('customer_detail.no_package');
  };

  // Don't show membership if payment status is PENDING (waiting for payment)
  // Only show membership if it's active, paid, or activated
  const shouldShowMembership =
    hasMembership && membershipContract?.status !== 'PENDING_PAYMENT' && membershipPaymentStatusDisplay !== 'PENDING';

  const branchDisplay = branchNames ?? t('customer_detail.no_branch');

  const getGenderLabel = (gender?: string) => {
    if (!gender) return '—';
    const normalized = gender.toLowerCase();
    if (normalized === 'male') return t('customer_detail.gender.male');
    if (normalized === 'female') return t('customer_detail.gender.female');
    return gender;
  };

  const contactChips: Array<{ icon: LucideIcon; label: string }> = [];

  if (customer.phone) {
    contactChips.push({ icon: Phone, label: customer.phone });
  }

  if (customer.email) {
    contactChips.push({ icon: Mail, label: customer.email });
  }

  const locationLabel = customer.address || branchNames;

  if (locationLabel) {
    contactChips.push({ icon: MapPin, label: locationLabel });
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-orange-200/40 bg-gradient-to-br from-primary via-orange-500 to-orange-400 p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_55%)] opacity-90" />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
                <User className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold tracking-tight">{customer.name}</h2>
                  <Badge
                    variant="outline"
                    className={cn(
                      'px-3 py-1 text-xs font-semibold uppercase tracking-wide shadow-sm backdrop-blur-sm',
                      getStatusBadgeStyles(customer.status)
                    )}
                  >
                    {statusLabel}
                  </Badge>
                </div>
                {!!contactChips.length && (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-white/90">
                    {contactChips.map(({ icon: Icon, label }) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {shouldShowMembership ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <span className="text-xs uppercase tracking-wide text-white/70">
                    {t('customer_detail.header.membership')}
                  </span>
                  <p className="mt-1 text-sm font-semibold">{membershipPlanName}</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <span className="text-xs uppercase tracking-wide text-white/70">
                    {t('customer_detail.header.join_date')}
                  </span>
                  <p className="mt-1 text-sm font-semibold">{formatDate(membershipJoinDate, locale)}</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <span className="text-xs uppercase tracking-wide text-white/70">
                    {t('customer_detail.header.expiry_date')}
                  </span>
                  <p className="mt-1 text-sm font-semibold">{formatDate(membershipExpiryDate, locale)}</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <span className="text-xs uppercase tracking-wide text-white/70">
                    {t('customer_detail.membership_card.status')}
                  </span>
                  <p className="mt-1 text-sm font-semibold">{membershipStatusDisplay}</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <span className="text-xs uppercase tracking-wide text-white/70">
                    {t('customer_detail.membership_card.payment_status', { defaultValue: 'Payment Status' })}
                  </span>
                  <p className="mt-1 text-sm font-semibold">
                    {membershipPaymentStatusDisplay || t('customer_detail.unknown_status')}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setShowCancelMembership(true)}
                  size="sm"
                  variant="destructive"
                  className="rounded-full px-4"
                  disabled={!membershipContract?.status || !canCancelMembership(membershipContract.status)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {t('customer_detail.cancel_package')}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowMembershipModal(true)}
                className="rounded-full border-white/40 bg-white/10 text-xs font-medium text-white hover:bg-white/20"
              >
                <CreditCard className="mr-2 h-3.5 w-3.5" />
                {t('customer_detail.register_membership')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-1">
            <TabsList className="flex w-full min-w-max justify-start gap-2 rounded-full border border-border bg-card/70 p-1 backdrop-blur">
              <TabsTrigger
                value="general"
                className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                {t('customer_detail.tabs.general')}
              </TabsTrigger>
              <TabsTrigger
                value="workouts"
                className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                {t('customer_detail.tabs.workouts')}
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                {t('customer_detail.tabs.attendance')}
              </TabsTrigger>
              <TabsTrigger
                value="class-booking"
                className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                {t('customer_detail.tabs.class_booking')}
              </TabsTrigger>
              <TabsTrigger
                value="payment"
                className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                {t('customer_detail.tabs.payment')}
              </TabsTrigger>
              <TabsTrigger
                value="contracts"
                className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                {t('customer_detail.tabs.contracts')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general" className="space-y-6 pt-4">
            {/* Personal Info Card - Full Width */}
            <Card className="rounded-3xl border border-border bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <IdCard className="h-5 w-5 text-primary" />
                  {t('customer_detail.personal_info.title')}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{t('customer_detail.personal_info.description')}</p>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoField
                  label={t('customer_detail.personal_info.member_id')}
                  value={customer.id ? customer.id.slice(-8).toUpperCase() : '—'}
                />
                <InfoField label={t('customer_detail.personal_info.gender')} value={getGenderLabel(customer.gender)} />
                <InfoField
                  label={t('customer_detail.personal_info.date_of_birth')}
                  value={formatDate(customer.dateOfBirth, locale)}
                />
                <InfoField
                  label={t('customer_detail.personal_info.account_status')}
                  value={
                    <Badge
                      variant="outline"
                      className={cn(
                        'px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                        getStatusBadgeStyles(customer.status)
                      )}
                    >
                      {statusLabel}
                    </Badge>
                  }
                />
                <InfoField
                  label={t('customer_detail.personal_info.created_at')}
                  value={formatDate(customer.createdAt, locale)}
                />
                <InfoField
                  label={t('customer_detail.contact_card.address')}
                  value={customer.address || notUpdatedText}
                />
                <InfoField label={t('customer_detail.contact_card.branch')} value={branchDisplay} />
                <InfoField
                  label={t('customer_detail.contact_card.referrer')}
                  value={customer.referrerStaffName || notUpdatedText}
                />
                <InfoField
                  label={t('customer_detail.contact_card.card_code')}
                  value={customer.cardCode || notUpdatedText}
                />
              </CardContent>
            </Card>

            {/* Service Cards - PT & Class */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* PT Service Card */}
              <Card className="flex h-full flex-col rounded-3xl border border-border bg-card shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    {t('customer_detail.pt_card.title')}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{t('customer_detail.pt_card.description')}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-4">
                  <div className="grid flex-1 gap-4 sm:grid-cols-2">
                    <InfoField
                      label={t('customer_detail.pt_card.package_name')}
                      value={hasPTPackage ? ptPackageName : t('customer_detail.not_registered')}
                    />
                    <InfoField
                      label={t('customer_detail.pt_card.status')}
                      value={
                        hasPTPackage ? getMembershipStatusLabel(ptContract?.status) : t('customer_detail.no_package')
                      }
                    />
                    <InfoField
                      label={t('customer_detail.membership_card.payment_status', {
                        defaultValue: 'Payment Status'
                      })}
                      value={
                        hasPTPackage
                          ? getPaymentStatusDisplay(
                              ptContract?.paymentStatus,
                              ptContract?.paidAmount,
                              ptContract?.total
                            )
                          : t('customer_detail.no_package')
                      }
                    />
                    <InfoField
                      label={t('customer_detail.pt_card.start_date')}
                      value={hasPTPackage && ptContract?.startDate ? formatDate(ptContract.startDate, locale) : '—'}
                    />
                    {hasPTPackage ? (
                      <InfoField
                        label={t('customer_detail.pt_card.sessions_remaining', 'Buổi còn lại')}
                        value={
                          ptContract?.sessionsRemaining !== undefined && ptContract?.sessionCount !== undefined
                            ? `${ptContract.sessionsRemaining} / ${ptContract.sessionCount}`
                            : '—'
                        }
                      />
                    ) : null}
                  </div>

                  {hasPTPackage ? (
                    <div className="mt-auto flex gap-2">
                      <Button
                        type="button"
                        onClick={() => setShowCancelPT(true)}
                        className="w-full rounded-full"
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {t('customer_detail.cancel_package')}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => setShowPTModal(true)}
                      className="mt-auto w-full rounded-full"
                      variant="outline"
                    >
                      <Dumbbell className="h-4 w-4 mr-2" />
                      {t('customer_detail.register_pt')}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Class Service Card */}
              <Card className="flex h-full flex-col rounded-3xl border border-border bg-card shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5 text-primary" />
                    {t('customer_detail.class_card.title')}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{t('customer_detail.class_card.description')}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-4">
                  <div className="grid flex-1 gap-4 sm:grid-cols-2">
                    <InfoField
                      label={t('customer_detail.class_card.package_name')}
                      value={hasClassPackage ? classPackageName : t('customer_detail.not_registered')}
                    />
                    <InfoField
                      label={t('customer_detail.class_card.status')}
                      value={
                        hasClassPackage
                          ? getMembershipStatusLabel(classContract?.status)
                          : t('customer_detail.no_package')
                      }
                    />
                    <InfoField
                      label={t('customer_detail.membership_card.payment_status', {
                        defaultValue: 'Payment Status'
                      })}
                      value={
                        hasClassPackage
                          ? getPaymentStatusDisplay(
                              classContract?.paymentStatus,
                              classContract?.paidAmount,
                              classContract?.total
                            )
                          : t('customer_detail.no_package')
                      }
                    />
                    <InfoField
                      label={t('customer_detail.class_card.start_date')}
                      value={
                        hasClassPackage && classContract?.startDate ? formatDate(classContract.startDate, locale) : '—'
                      }
                    />
                    {hasClassPackage ? (
                      <InfoField
                        label={t('customer_detail.class_card.sessions_remaining', 'Buổi còn lại')}
                        value={
                          classContract?.sessionsRemaining !== undefined && classContract?.sessionCount !== undefined
                            ? `${classContract.sessionsRemaining} / ${classContract.sessionCount}`
                            : '—'
                        }
                      />
                    ) : null}
                  </div>

                  {hasClassPackage ? (
                    <div className="mt-auto flex gap-2">
                      <Button
                        type="button"
                        onClick={() => setShowCancelClass(true)}
                        className="w-full rounded-full"
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {t('customer_detail.cancel_package')}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => setShowClassModal(true)}
                      className="mt-auto w-full rounded-full"
                      variant="outline"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {t('customer_detail.register_class')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Payment Info Card */}
            <Card className="rounded-3xl border border-border bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-5 w-5 text-primary" />
                  {t('customer_detail.payment_card.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <InfoField label={t('customer_detail.payment_card.total_spent')} value={totalSpentLabel} />
                <InfoField label={t('customer_detail.payment_card.last_payment')} value={lastPaymentLabel} />
                <InfoField
                  label={t('customer_detail.payment_card.paid_membership')}
                  value={
                    shouldShowMembership && membershipContract
                      ? formatCurrency(membershipContract.paidAmount || membershipContract.totalAmount || 0, locale)
                      : notUpdatedText
                  }
                />
                <InfoField
                  label={t('customer_detail.payment_card.paid_service')}
                  value={
                    ptContract || classContract
                      ? formatCurrency((ptContract?.paidAmount || 0) + (classContract?.paidAmount || 0), locale)
                      : notUpdatedText
                  }
                />
              </CardContent>
            </Card>

            {customer.notes && (
              <Card className="rounded-3xl border border-border bg-card shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5 text-primary" />
                    {t('customer_detail.notes.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap rounded-2xl border border-dashed border-border/60 bg-muted/30 p-5 text-sm leading-6 text-muted-foreground">
                    {customer.notes}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="workouts" className="pt-4">
            <PlaceholderCard
              icon={Dumbbell}
              title={t('customer_detail.placeholders.workouts.title')}
              description={t('customer_detail.placeholders.workouts.description')}
            />
          </TabsContent>

          <TabsContent value="attendance" className="pt-4">
            <PlaceholderCard
              icon={CalendarCheck}
              title={t('customer_detail.placeholders.attendance.title')}
              description={t('customer_detail.placeholders.attendance.description')}
            />
          </TabsContent>

          <TabsContent value="class-booking" className="pt-4">
            <PlaceholderCard
              icon={CalendarDays}
              title={t('customer_detail.placeholders.class_booking.title')}
              description={t('customer_detail.placeholders.class_booking.description')}
            />
          </TabsContent>

          <TabsContent value="payment" className="pt-4">
            {customer.id && (
              <PaymentHistoryTab
                customerId={customer.id}
                onPaymentActionComplete={() => {
                  // Refresh customer detail when payment is cancelled/confirmed
                  debouncedFetchCustomerDetail();
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="contracts" className="pt-4">
            {customer.id && <ContractDocumentsTab customerId={customer.id} />}
          </TabsContent>
        </Tabs>
      </div>

      {/* Registration Dialogs */}
      <PTRegistrationDialog
        isOpen={showPTModal}
        onClose={() => setShowPTModal(false)}
        customerId={customer.id}
        onSuccess={() => debouncedFetchCustomerDetail()}
      />

      <ClassRegistrationDialog
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
        customerId={customer.id}
        onSuccess={() => debouncedFetchCustomerDetail()}
      />

      <MembershipRegistrationDialog
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
        customerId={customer.id}
        onSuccess={() => debouncedFetchCustomerDetail()}
        onPaymentStepActiveChange={setIsMembershipQRPaymentActive}
        onStepChange={setMembershipWizardStep}
      />

      {/* Cancel Dialogs */}
      {shouldShowMembership && membershipContract && (
        <CancelMembershipDialog
          isOpen={showCancelMembership}
          onClose={() => setShowCancelMembership(false)}
          onSuccess={() => debouncedFetchCustomerDetail()}
          contract={
            {
              _id: membershipContract._id,
              customerId: customer.id,
              branchId: customer.branches?.[0]?._id || '',
              membershipPlanId:
                typeof membershipContract.membershipPlanId === 'string'
                  ? membershipContract.membershipPlanId
                  : membershipContract.membershipPlanId?._id || '',
              discountCampaignId: membershipContract.discountCampaignId?._id,
              price: membershipContract.totalAmount || 0,
              discountAmount: 0,
              total: membershipContract.totalAmount || 0,
              paidAmount: membershipContract.paidAmount || membershipContract.totalAmount || 0,
              status: membershipContract.status || 'ACTIVE',
              startDate: membershipContract.startDate,
              endDate: membershipContract.endDate || customer.expiryDate || '',
              notes: membershipContract.notes,
              createdAt: customer.createdAt || new Date().toISOString(),
              updatedAt: customer.updatedAt || new Date().toISOString()
            } as MembershipContract
          }
        />
      )}

      {hasPTPackage && ptContract && (
        <CancelServiceContractDialog
          isOpen={showCancelPT}
          onClose={() => setShowCancelPT(false)}
          onSuccess={() => debouncedFetchCustomerDetail()}
          contractId={ptContract._id || ''}
          contractType="PT"
          serviceName={ptPackageName}
          paidAmount={ptContract.paidAmount || 0}
          startDate={ptContract.startDate}
          sessionCount={ptContract.sessionCount}
          sessionsUsed={ptContract.sessionsUsed}
          sessionsRemaining={ptContract.sessionsRemaining}
        />
      )}

      {hasClassPackage && classContract && (
        <CancelServiceContractDialog
          isOpen={showCancelClass}
          onClose={() => setShowCancelClass(false)}
          onSuccess={() => debouncedFetchCustomerDetail()}
          contractId={classContract._id || ''}
          contractType="CLASS"
          serviceName={classPackageName}
          paidAmount={classContract.paidAmount || 0}
          startDate={classContract.startDate}
          sessionCount={classContract.sessionCount}
          sessionsUsed={classContract.sessionsUsed}
          sessionsRemaining={classContract.sessionsRemaining}
        />
      )}

      {/* Extend Dialogs */}
      {shouldShowMembership && membershipContract && (
        <ExtendMembershipDialog
          isOpen={showExtendMembership}
          onClose={() => setShowExtendMembership(false)}
          onSuccess={() => debouncedFetchCustomerDetail()}
          contractId={membershipContract._id || ''}
          currentEndDate={customer.expiryDate}
          planName={membershipPlanName}
        />
      )}

      {hasPTPackage && ptContract && (
        <ExtendServiceContractDialog
          isOpen={showExtendPT}
          onClose={() => setShowExtendPT(false)}
          onSuccess={() => debouncedFetchCustomerDetail()}
          contractId={ptContract._id || ''}
          contractType="PT"
          serviceName={ptPackageName}
          currentEndDate={ptContract.endDate}
        />
      )}

      {hasClassPackage && classContract && (
        <ExtendServiceContractDialog
          isOpen={showExtendClass}
          onClose={() => setShowExtendClass(false)}
          onSuccess={() => debouncedFetchCustomerDetail()}
          contractId={classContract._id || ''}
          contractType="CLASS"
          serviceName={classPackageName}
          currentEndDate={classContract.endDate}
        />
      )}
    </div>
  );
};

export default CustomerDetailPage;
