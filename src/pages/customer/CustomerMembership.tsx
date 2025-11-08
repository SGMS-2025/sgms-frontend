import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  Calendar,
  CreditCard,
  Dumbbell,
  FileText,
  MapPin,
  PhoneCall,
  RefreshCcw,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthState } from '@/hooks/useAuth';
import { branchApi } from '@/services/api/branchApi';
import { useCustomerMembershipContract } from '@/hooks/useCustomerMembershipContract';
import type { MembershipContract, MembershipPlan } from '@/types/api/Membership';
import { calculateRemainingDays, getMembershipStatusLabel, isExpiringSoon } from '@/utils/membership';
import { cn } from '@/utils/utils';
import { MembershipCancelDialog } from '@/components/membership/MembershipCancelDialog';
import { ExtendMembershipDialog } from '@/components/customer/ExtendMembershipDialog';
import { membershipApi } from '@/services/api/membershipApi';
import { toast } from 'sonner';

type BranchSummary = {
  _id: string;
  branchName: string;
  location?: string;
  hotline?: string;
};

type EnhancedMembershipContract = Omit<MembershipContract, 'membershipPlanId'> & {
  membershipPlanSnapshot?: Partial<MembershipPlan>;
  membershipPlanId?: string | (MembershipPlan & { benefits?: string[] });
  discountCampaignSnapshot?: {
    campaignName?: string;
    discountPercentage?: number;
  };
};

type NormalizedPlan = Pick<MembershipPlan, 'name' | 'description' | 'durationInMonths' | 'price' | 'benefits'> | null;

type TranslationFunction = (
  key: string,
  options?: {
    defaultValue?: string;
    count?: number;
    id?: string;
    hotline?: string;
    branchName?: string;
    [key: string]: string | number | undefined;
  }
) => string;

const clampProgress = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
};

const formatDateLabel = (t: TranslationFunction, value?: string, locale: string = 'vi-VN') => {
  if (!value) return t('customer_membership.updating', { defaultValue: 'Updating' });
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t('customer_membership.updating', { defaultValue: 'Updating' });
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatDurationLabel = (t: TranslationFunction, months?: number) => {
  if (months) return t('customer_membership.duration_months', { count: months, defaultValue: `${months} months` });
  return t('customer_membership.by_contract', { defaultValue: 'By contract' });
};

const defaultBranchLabel = (id: string, t: TranslationFunction) => {
  return t('customer_membership.branch_label', {
    id: id.slice(-4).toUpperCase(),
    defaultValue: `Branch ${id.slice(-4).toUpperCase()}`
  });
};

const getFallbackBenefits = (t: TranslationFunction): string[] => {
  return [
    t('customer_membership.benefits.unlimited_access', {
      defaultValue: 'Unlimited access during opening hours'
    }),
    t('customer_membership.benefits.body_measurements', {
      defaultValue: 'Regular body measurements support'
    }),
    t('customer_membership.benefits.pt_priority', {
      defaultValue: 'Priority booking for PT training at the counter'
    }),
    t('customer_membership.benefits.early_notifications', {
      defaultValue: 'Early notifications about promotions and events'
    })
  ];
};

export default function CustomerMembership() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuthState();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const branchField = user?.customer?.branchId;

  const branchIds = useMemo(() => {
    if (!branchField) return [] as string[];

    const normalizeValue = (value: unknown): string | null => {
      if (typeof value === 'string') return value;
      if (typeof value === 'object' && value !== null && '_id' in (value as Record<string, unknown>)) {
        return (value as { _id?: string })._id ?? null;
      }
      return null;
    };

    if (Array.isArray(branchField)) {
      return branchField.map(normalizeValue).filter((id): id is string => Boolean(id));
    }

    const normalized = normalizeValue(branchField);
    return normalized ? [normalized] : [];
  }, [branchField]);

  const [selectedBranchId, setSelectedBranchId] = useState(() => branchIds[0] ?? '');

  useEffect(() => {
    if (!branchIds.length) {
      setSelectedBranchId('');
      return;
    }

    setSelectedBranchId((current) => {
      if (current && branchIds.includes(current)) {
        return current;
      }
      return branchIds[0];
    });
  }, [branchIds]);

  const [branchSummaries, setBranchSummaries] = useState<Record<string, BranchSummary>>({});
  const [branchSummaryLoading, setBranchSummaryLoading] = useState(false);

  const fetchBranchSummary = useCallback(
    async (branchId: string): Promise<BranchSummary | null> => {
      if (!branchId) return null;

      const fallback: BranchSummary = {
        _id: branchId,
        branchName: defaultBranchLabel(branchId, t),
        location: undefined,
        hotline: undefined
      };

      const publicResponse = await branchApi.getBranchDetail(branchId);
      if (publicResponse.success && publicResponse.data) {
        return {
          _id: publicResponse.data._id,
          branchName: publicResponse.data.branchName,
          location: publicResponse.data.location,
          hotline: publicResponse.data.hotline
        };
      }

      const protectedResponse = await branchApi.getBranchDetailProtected(branchId);
      if (protectedResponse.success && protectedResponse.data) {
        return {
          _id: protectedResponse.data._id,
          branchName: protectedResponse.data.branchName,
          location: protectedResponse.data.location,
          hotline: protectedResponse.data.hotline
        };
      }

      return fallback;
    },
    [t]
  );

  useEffect(() => {
    if (!branchIds.length) {
      setBranchSummaries({});
      return;
    }

    let isMounted = true;
    setBranchSummaryLoading(true);

    const load = async () => {
      const results = await Promise.all(branchIds.map((branchId) => fetchBranchSummary(branchId)));
      if (!isMounted) return;

      const mapped: Record<string, BranchSummary> = {};
      results.forEach((summary) => {
        if (summary) {
          mapped[summary._id] = summary;
        }
      });
      setBranchSummaries(mapped);
      setBranchSummaryLoading(false);
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [branchIds, fetchBranchSummary, t]);

  const {
    contract,
    loading: membershipLoading,
    error,
    refetch
  } = useCustomerMembershipContract({
    branchId: selectedBranchId,
    enabled: Boolean(selectedBranchId)
  });

  const enhancedContract = contract as EnhancedMembershipContract | null;

  // Dialog states
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const plan: NormalizedPlan = useMemo(() => {
    if (!enhancedContract) return null;

    if (enhancedContract.membershipPlanSnapshot) {
      return {
        name: enhancedContract.membershipPlanSnapshot.name,
        description: enhancedContract.membershipPlanSnapshot.description,
        durationInMonths: enhancedContract.membershipPlanSnapshot.durationInMonths,
        price: enhancedContract.membershipPlanSnapshot.price,
        benefits: enhancedContract.membershipPlanSnapshot.benefits
      } as NormalizedPlan;
    }

    const planFromContract = enhancedContract.membershipPlanId;
    if (planFromContract && typeof planFromContract === 'object' && 'name' in planFromContract) {
      const { name, description, durationInMonths, price, benefits } = planFromContract as MembershipPlan & {
        benefits?: string[];
      };
      return {
        name,
        description,
        durationInMonths,
        price,
        benefits
      } as NormalizedPlan;
    }

    return null;
  }, [enhancedContract]);

  const benefits = plan?.benefits && plan.benefits.length > 0 ? plan.benefits : getFallbackBenefits(t);
  const branchInfo = selectedBranchId ? (branchSummaries[selectedBranchId] ?? null) : null;
  const daysRemaining = enhancedContract?.endDate
    ? Math.max(0, calculateRemainingDays(enhancedContract.endDate))
    : null;

  const timelineProgress = useMemo(() => {
    if (!enhancedContract?.startDate || !enhancedContract?.endDate) return null;
    const start = new Date(enhancedContract.startDate).getTime();
    const end = new Date(enhancedContract.endDate).getTime();
    const now = Date.now();
    const total = Math.max(end - start, 0);
    if (!total) return null;
    const elapsed = Math.min(Math.max(now - start, 0), total);
    return (elapsed / total) * 100;
  }, [enhancedContract?.startDate, enhancedContract?.endDate]);

  const expiringSoon = enhancedContract?.endDate ? isExpiringSoon(enhancedContract.endDate, 10) : false;
  const totalValue = enhancedContract?.total ?? plan?.price ?? 0;
  const paidAmount = enhancedContract?.paidAmount ?? 0;

  const showEmptyState = Boolean(selectedBranchId && !membershipLoading && !enhancedContract && !error && !authLoading);
  const shouldShowSkeleton = Boolean((membershipLoading || authLoading) && selectedBranchId);
  const showBranchAlert = !branchIds.length && !shouldShowSkeleton;

  const handleBrowsePlans = useCallback(() => {
    if (selectedBranchId) {
      navigate(`/gyms/${selectedBranchId}`);
    } else {
      navigate('/gyms');
    }
  }, [navigate, selectedBranchId]);

  const handleContactBranch = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (branchInfo?.hotline) {
      window.location.href = `tel:${branchInfo.hotline}`;
    }
  }, [branchInfo?.hotline]);

  const handleCancelMembership = useCallback(
    async (reason?: string) => {
      if (!enhancedContract?._id) return;

      setCancelLoading(true);
      const response = await membershipApi.cancelPublicMembershipContract(enhancedContract._id, { reason });

      if (response.success) {
        toast.success(
          t('customer_membership.cancel_success', { defaultValue: 'Membership package canceled successfully!' })
        );
        setShowCancelDialog(false);

        // Delay để backend lưu xong
        setTimeout(() => {
          refetch();
        }, 500);
      } else {
        toast.error(t('customer_membership.cancel_failed', { defaultValue: 'Unable to cancel membership package' }), {
          description:
            response.message || t('customer_membership.please_try_again', { defaultValue: 'Please try again later' })
        });
      }

      setCancelLoading(false);
    },
    [enhancedContract?._id, refetch, t]
  );

  const handleExtendSuccess = useCallback(() => {
    setShowExtendDialog(false);
    // Delay để backend lưu xong
    setTimeout(() => {
      refetch();
    }, 500);
  }, [refetch]);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-orange-500">
            <Dumbbell className="h-4 w-4" /> {t('customer_membership.membership', { defaultValue: 'Membership' })}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {t('customer_membership.title', { defaultValue: 'Manage Training Package' })}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {t('customer_membership.description', { defaultValue: 'Track your contract status and member benefits.' })}
          </p>
        </div>

        {branchIds.length > 1 ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-gray-500">
              {t('customer_membership.branch', { defaultValue: 'Branch' })}
            </span>
            <Select
              value={selectedBranchId}
              onValueChange={setSelectedBranchId}
              disabled={!branchIds.length || branchSummaryLoading}
            >
              <SelectTrigger className="min-w-[220px] justify-between">
                <SelectValue placeholder={t('customer_membership.select_branch', { defaultValue: 'Select branch' })} />
              </SelectTrigger>
              <SelectContent>
                {branchIds.map((branchId) => {
                  const summary = branchSummaries[branchId];
                  return (
                    <SelectItem key={branchId} value={branchId}>
                      <div className="flex flex-col text-left">
                        <span className="font-medium">{summary?.branchName ?? defaultBranchLabel(branchId, t)}</span>
                        {summary?.location && <span className="text-xs text-muted-foreground">{summary.location}</span>}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        ) : branchInfo ? (
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm">
            <MapPin className="h-4 w-4 text-orange-500" />
            <span>{branchInfo.branchName}</span>
          </div>
        ) : null}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <AlertTitle>
              {t('customer_membership.error.load_failed', { defaultValue: 'Unable to load membership information' })}
            </AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={refetch}>
                {t('customer_membership.retry', { defaultValue: 'Retry' })}
              </Button>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {showBranchAlert && (
        <Alert>
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <div>
            <AlertTitle>{t('customer_membership.error.no_branch', { defaultValue: 'No branch assigned' })}</AlertTitle>
            <AlertDescription>
              {t('customer_membership.error.no_branch_description', {
                defaultValue:
                  'Your account is not currently linked to a specific branch. Please contact the reception desk for assistance.'
              })}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {shouldShowSkeleton && <MembershipSkeleton />}

      {showEmptyState && (
        <MembershipEmptyState
          branchName={branchInfo?.branchName}
          onBrowsePlans={handleBrowsePlans}
          loadingBranches={branchSummaryLoading}
          t={t}
        />
      )}

      {enhancedContract && !shouldShowSkeleton && (
        <>
          <MembershipDetails
            contract={enhancedContract}
            plan={plan}
            branch={branchInfo}
            benefits={benefits}
            daysRemaining={daysRemaining}
            timelineProgress={timelineProgress}
            expiringSoon={expiringSoon}
            totalValue={totalValue}
            paidAmount={paidAmount}
            onRenew={handleBrowsePlans}
            onContact={handleContactBranch}
            onExtend={() => setShowExtendDialog(true)}
            onCancel={() => setShowCancelDialog(true)}
            t={t}
            locale={locale}
          />

          {/* Cancel Dialog */}
          <MembershipCancelDialog
            isOpen={showCancelDialog}
            onClose={() => setShowCancelDialog(false)}
            onConfirm={handleCancelMembership}
            loading={cancelLoading}
          />

          {/* Extend Dialog */}
          <ExtendMembershipDialog
            isOpen={showExtendDialog}
            onClose={() => setShowExtendDialog(false)}
            onSuccess={handleExtendSuccess}
            contractId={enhancedContract._id}
            currentEndDate={enhancedContract.endDate}
            planName={plan?.name}
          />
        </>
      )}
    </div>
  );
}

interface MembershipDetailsProps {
  contract: EnhancedMembershipContract;
  plan: NormalizedPlan;
  branch: BranchSummary | null;
  benefits: string[];
  daysRemaining: number | null;
  timelineProgress: number | null;
  expiringSoon: boolean;
  totalValue: number;
  paidAmount: number;
  onRenew: () => void;
  onContact: () => void;
  onExtend: () => void;
  onCancel: () => void;
  t: TranslationFunction;
  locale: string;
}

function MembershipDetails({
  contract,
  plan,
  branch,
  benefits,
  daysRemaining,
  timelineProgress,
  expiringSoon,
  totalValue,
  paidAmount,
  onRenew,
  onContact,
  onExtend,
  onCancel,
  t,
  locale
}: MembershipDetailsProps) {
  return (
    <div className="space-y-6">
      <MembershipOverviewCard
        contract={contract}
        plan={plan}
        branch={branch}
        daysRemaining={daysRemaining}
        timelineProgress={timelineProgress}
        expiringSoon={expiringSoon}
        t={t}
        locale={locale}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <MembershipBenefitsCard benefits={benefits} description={plan?.description} t={t} />
        <MembershipPaymentCard
          contract={contract}
          totalValue={totalValue}
          paidAmount={paidAmount}
          t={t}
          locale={locale}
        />
        <MembershipActionsCard
          branch={branch}
          onRenew={onRenew}
          onContact={onContact}
          onExtend={onExtend}
          onCancel={onCancel}
          expiringSoon={expiringSoon}
          contract={contract}
          t={t}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MembershipTimelineCard contract={contract} t={t} locale={locale} />
        <MembershipNotesCard contract={contract} t={t} />
      </div>
    </div>
  );
}

interface MembershipOverviewCardProps {
  contract: EnhancedMembershipContract;
  plan: NormalizedPlan;
  branch: BranchSummary | null;
  daysRemaining: number | null;
  timelineProgress: number | null;
  expiringSoon: boolean;
  t: TranslationFunction;
  locale: string;
}

function MembershipOverviewCard({
  contract,
  plan,
  branch,
  daysRemaining,
  timelineProgress,
  expiringSoon,
  t,
  locale
}: MembershipOverviewCardProps) {
  const statusLabel = t(`membership.status.${contract.status.toLowerCase()}`, {
    defaultValue: getMembershipStatusLabel(contract.status)
  });

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-6 text-white sm:px-8 sm:py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">
              {t('customer_membership.membership_package', { defaultValue: 'Membership Package' })}
            </p>
            <h2 className="text-3xl font-semibold">
              {plan?.name ?? t('customer_membership.current_package', { defaultValue: 'Current Training Package' })}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-white/70">
              {plan?.description ??
                t('customer_membership.contract_description', {
                  defaultValue: 'Benefits and validity are updated according to the latest contract.'
                })}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <Badge
              variant="outline"
              className="border-white/40 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white"
            >
              {statusLabel}
            </Badge>
            <span className="text-xs text-white/70">
              {t('customer_membership.contract_id', {
                id: contract._id.slice(-8).toUpperCase(),
                defaultValue: `Contract #${contract._id.slice(-8).toUpperCase()}`
              })}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <InfoRow
            label={t('customer_membership.branch', { defaultValue: 'Branch' })}
            value={branch?.branchName ?? t('customer_membership.updating', { defaultValue: 'Updating' })}
            subValue={branch?.location}
            icon={MapPin}
          />
          <InfoRow
            label={t('customer_membership.cycle', { defaultValue: 'Cycle' })}
            value={formatDurationLabel(t, plan?.durationInMonths)}
            subValue={
              daysRemaining != null
                ? t('customer_membership.days_remaining', {
                    count: daysRemaining,
                    defaultValue: `${daysRemaining} days remaining`
                  })
                : undefined
            }
            icon={Calendar}
          />
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-white/70">
            <span>{formatDateLabel(t, contract.startDate, locale)}</span>
            <span>{formatDateLabel(t, contract.endDate, locale)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-orange-400"
              style={{ width: `${clampProgress(timelineProgress)}%` }}
            />
          </div>
        </div>

        {expiringSoon && (
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white">
            <AlertCircle className="h-4 w-4" />
            {t('customer_membership.expiring_soon', {
              defaultValue: 'Your package is expiring soon, please renew early to avoid interruption.'
            })}
          </div>
        )}
      </div>

      <CardContent className="grid gap-4 py-6 text-sm text-gray-700 sm:grid-cols-2 lg:grid-cols-4">
        <KeyStat
          label={t('customer_membership.start_date', { defaultValue: 'Start Date' })}
          value={formatDateLabel(t, contract.startDate, locale)}
          icon={Calendar}
        />
        <KeyStat
          label={t('customer_membership.activation', { defaultValue: 'Activation' })}
          value={formatDateLabel(t, contract.activationDate ?? contract.startDate, locale)}
          icon={Sparkles}
        />
        <KeyStat
          label={t('customer_membership.expiry_date', { defaultValue: 'Expiry Date' })}
          value={formatDateLabel(t, contract.endDate, locale)}
          icon={Calendar}
        />
        <KeyStat
          label={t('customer_membership.last_updated', { defaultValue: 'Last Updated' })}
          value={formatDateLabel(t, contract.updatedAt, locale)}
          icon={RefreshCcw}
        />
      </CardContent>
    </Card>
  );
}

interface MembershipBenefitsCardProps {
  benefits: string[];
  description?: string;
  t: TranslationFunction;
}

function MembershipBenefitsCard({ benefits, description, t }: MembershipBenefitsCardProps) {
  return (
    <Card className="h-full border border-orange-100 bg-gradient-to-br from-orange-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <ShieldCheck className="h-4 w-4" />{' '}
          {t('customer_membership.member_benefits', { defaultValue: 'Member Benefits' })}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">
        {benefits.map((benefit, index) => (
          <div
            key={`${benefit}-${index}`}
            className="flex items-start gap-3 rounded-lg bg-white/60 px-3 py-2 shadow-sm"
          >
            <div className="mt-1 h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-sm text-gray-700">{benefit}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface MembershipPaymentCardProps {
  contract: EnhancedMembershipContract;
  totalValue: number;
  paidAmount: number;
  t: TranslationFunction;
  locale: string;
}

function MembershipPaymentCard({ contract, totalValue, paidAmount, t, locale }: MembershipPaymentCardProps) {
  const discountCampaign = contract.discountCampaignSnapshot?.campaignName;

  const formatCurrencyWithLocale = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <CreditCard className="h-4 w-4 text-orange-500" />{' '}
          {t('customer_membership.payment', { defaultValue: 'Payment' })}
        </CardTitle>
        <CardDescription>
          {t('customer_membership.payment_description', { defaultValue: 'Overview of debt and applied promotions' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <PaymentStat
          label={t('customer_membership.total_fee', { defaultValue: 'Total Fee' })}
          value={formatCurrencyWithLocale(totalValue)}
        />
        <PaymentStat
          label={t('customer_membership.paid', { defaultValue: 'Paid' })}
          value={formatCurrencyWithLocale(paidAmount)}
        />
        <div className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-600">
          {t('customer_membership.applied_promotion', { defaultValue: 'Applied Promotion' })}:{' '}
          <span className="font-medium">
            {discountCampaign ?? t('customer_membership.none', { defaultValue: 'None' })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface MembershipActionsCardProps {
  branch: BranchSummary | null;
  onRenew: () => void;
  onContact: () => void;
  onExtend: () => void;
  onCancel: () => void;
  expiringSoon: boolean;
  contract: EnhancedMembershipContract;
  t: TranslationFunction;
}

function MembershipActionsCard({
  branch,
  onRenew,
  onContact,
  onExtend,
  onCancel,
  expiringSoon,
  contract,
  t
}: MembershipActionsCardProps) {
  const canExtend = ['ACTIVE', 'EXPIRED', 'PAST_DUE'].includes(contract.status);
  const canCancel = ['ACTIVE', 'PENDING_ACTIVATION'].includes(contract.status);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t('customer_membership.manage_package', { defaultValue: 'Manage Your Package' })}</CardTitle>
        <CardDescription>
          {t('customer_membership.manage_description', { defaultValue: 'Extend, cancel package or contact branch' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">
            {branch?.branchName ?? t('customer_membership.branch_not_updated', { defaultValue: 'Branch not updated' })}
          </p>
          {branch?.location && <p className="text-xs text-gray-500">{branch.location}</p>}
          {branch?.hotline && (
            <p className="text-xs text-gray-500">
              {t('customer_membership.hotline', {
                hotline: branch.hotline,
                defaultValue: `Hotline: ${branch.hotline}`
              })}
            </p>
          )}
          {!branch?.hotline && (
            <p className="text-xs text-gray-500">
              {t('customer_membership.hotline_not_updated', { defaultValue: 'Hotline not updated' })}
            </p>
          )}
        </div>
        {expiringSoon && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t('customer_membership.expiring_renew', {
              defaultValue: 'Package expiring soon — please renew to maintain benefits.'
            })}
          </div>
        )}
        <div className="flex flex-col gap-3">
          <Button
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:from-orange-600 hover:to-orange-700"
            onClick={onExtend}
            disabled={!canExtend}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {t('customer_membership.extend_package', { defaultValue: 'Extend Package' })}
          </Button>
          <Button variant="outline" onClick={onRenew} className="justify-center">
            <Sparkles className="h-4 w-4 mr-2" />
            {t('customer_membership.upgrade_package', { defaultValue: 'Upgrade to New Package' })}
          </Button>
          <Button variant="outline" onClick={onContact} disabled={!branch?.hotline} className="justify-center">
            <PhoneCall className="h-4 w-4 mr-2" />{' '}
            {t('customer_membership.call_hotline', { defaultValue: 'Call Hotline' })}
          </Button>
          <Button variant="destructive" onClick={onCancel} disabled={!canCancel} className="justify-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {t('customer_membership.cancel_package', { defaultValue: 'Cancel Package' })}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface MembershipTimelineCardProps {
  contract: EnhancedMembershipContract;
  t: TranslationFunction;
  locale: string;
}

function MembershipTimelineCard({ contract, t, locale }: MembershipTimelineCardProps) {
  const timeline = [
    {
      label: t('customer_membership.timeline.created', { defaultValue: 'Contract Created' }),
      value: formatDateLabel(t, contract.createdAt, locale),
      icon: FileText
    },
    {
      label: t('customer_membership.timeline.activation', { defaultValue: 'Activation' }),
      value: formatDateLabel(t, contract.activationDate ?? contract.startDate, locale),
      icon: Sparkles
    },
    {
      label: t('customer_membership.timeline.start_date', { defaultValue: 'Start Date' }),
      value: formatDateLabel(t, contract.startDate, locale),
      icon: Calendar
    },
    {
      label: t('customer_membership.timeline.end_date', { defaultValue: 'End Date' }),
      value: formatDateLabel(t, contract.endDate, locale),
      icon: Calendar
    },
    {
      label: t('customer_membership.timeline.last_updated', { defaultValue: 'Last Updated' }),
      value: formatDateLabel(t, contract.updatedAt, locale),
      icon: RefreshCcw
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t('customer_membership.timeline.title', { defaultValue: 'Contract Timeline' })}</CardTitle>
        <CardDescription>
          {t('customer_membership.timeline.description', { defaultValue: 'Check important milestones of membership' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {timeline.map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2">
            <div className="rounded-full bg-gray-100 p-2">
              <item.icon className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500">{item.value}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface MembershipNotesCardProps {
  contract: EnhancedMembershipContract;
  t: TranslationFunction;
}

function MembershipNotesCard({ contract, t }: MembershipNotesCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t('customer_membership.notes.title', { defaultValue: 'Contract Notes' })}</CardTitle>
        <CardDescription>
          {t('customer_membership.notes.description', { defaultValue: 'Track notes and discount campaigns (if any)' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-gray-700">
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">
            {t('customer_membership.notes.applied_campaign', { defaultValue: 'Applied Campaign' })}
          </p>
          <p className="font-medium text-gray-900">
            {contract.discountCampaignSnapshot?.campaignName ??
              t('customer_membership.notes.no_campaign', { defaultValue: 'No promotion campaign' })}
          </p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
          <p className="text-xs text-gray-500">{t('customer_membership.notes.notes', { defaultValue: 'Notes' })}</p>
          <p>{contract.notes ?? t('customer_membership.notes.no_notes', { defaultValue: 'No additional notes.' })}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
}

function InfoRow({ label, value, subValue, icon: Icon }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="rounded-full bg-white/10 p-2">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">{label}</p>
        <p className="text-base font-semibold">{value}</p>
        {subValue && <p className="text-xs text-white/70">{subValue}</p>}
      </div>
    </div>
  );
}

interface KeyStatProps {
  label: string;
  value: string;
  icon: LucideIcon;
}

function KeyStat({ label, value, icon: Icon }: KeyStatProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2">
      <div className="rounded-full bg-gray-50 p-2">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

interface PaymentStatProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function PaymentStat({ label, value, highlight }: PaymentStatProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={cn('font-semibold', highlight && 'text-red-600')}>{value}</span>
    </div>
  );
}

interface MembershipEmptyStateProps {
  branchName?: string;
  onBrowsePlans: () => void;
  loadingBranches: boolean;
  t: TranslationFunction;
}

function MembershipEmptyState({ branchName, onBrowsePlans, loadingBranches, t }: MembershipEmptyStateProps) {
  return (
    <Card className="border-dashed border-gray-200 bg-white text-center">
      <CardHeader>
        <CardTitle className="flex flex-col items-center gap-2 text-gray-900">
          <Dumbbell className="h-5 w-5 text-orange-500" />
          {t('customer_membership.empty_state.title', { defaultValue: "You don't have an active membership package" })}
        </CardTitle>
        <CardDescription>
          {loadingBranches
            ? t('customer_membership.empty_state.loading_branches', { defaultValue: 'Loading your branches...' })
            : t('customer_membership.empty_state.description', {
                branchName:
                  branchName ??
                  t('customer_membership.empty_state.selected_branch', { defaultValue: 'selected branch' }),
                defaultValue: `No contract at ${branchName ?? 'selected branch'}. Register now to receive member privileges.`
              })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={onBrowsePlans} className="bg-orange-500 text-white hover:bg-orange-600">
          {t('customer_membership.empty_state.explore_packages', { defaultValue: 'Explore Membership Packages' })}
        </Button>
      </CardContent>
    </Card>
  );
}

function MembershipSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24 bg-white/40" />
          <Skeleton className="h-8 w-64 bg-white/30" />
          <Skeleton className="h-4 w-48 bg-white/20" />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-16 rounded-xl bg-white/10" />
          <Skeleton className="h-16 rounded-xl bg-white/10" />
        </div>
        <Skeleton className="mt-6 h-2 w-full rounded-full bg-white/20" />
      </div>
      <CardContent className="grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 rounded-lg bg-gray-100" />
        ))}
      </CardContent>
    </Card>
  );
}
