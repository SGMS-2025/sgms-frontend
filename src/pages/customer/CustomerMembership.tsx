import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { calculateRemainingDays, formatCurrency, getMembershipStatusLabel, isExpiringSoon } from '@/utils/membership';
import { cn, formatDate } from '@/utils/utils';
import { MembershipCancelDialog } from '@/components/membership/MembershipCancelDialog';
import { ExtendMembershipDialog } from '@/components/customer/ExtendMembershipDialog';
import { membershipApi } from '@/services/api/membershipApi';
import { toast } from 'sonner';

const FALLBACK_BENEFITS = [
  'Truy cập không giới hạn trong khung giờ mở cửa',
  'Hỗ trợ đo chỉ số hình thể định kỳ',
  'Ưu tiên đặt lịch huấn luyện với PT tại quầy',
  'Nhận thông báo sớm về ưu đãi và sự kiện'
];

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

const formatDateLabel = (value?: string) => (value ? formatDate(value) : 'Đang cập nhật');
const formatDurationLabel = (months?: number) => (months ? `${months} tháng` : 'Theo hợp đồng');
const defaultBranchLabel = (id: string) => `Chi nhánh ${id.slice(-4).toUpperCase()}`;
const clampProgress = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
};

export default function CustomerMembership() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuthState();
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

  const fetchBranchSummary = useCallback(async (branchId: string): Promise<BranchSummary | null> => {
    if (!branchId) return null;

    const fallback: BranchSummary = {
      _id: branchId,
      branchName: defaultBranchLabel(branchId),
      location: undefined,
      hotline: undefined
    };

    try {
      const response = await branchApi.getBranchDetail(branchId);
      if (response.success && response.data) {
        return {
          _id: response.data._id,
          branchName: response.data.branchName,
          location: response.data.location,
          hotline: response.data.hotline
        };
      }
    } catch (publicError) {
      console.warn('Failed to load public branch detail', publicError);
    }

    try {
      const response = await branchApi.getBranchDetailProtected(branchId);
      if (response.success && response.data) {
        return {
          _id: response.data._id,
          branchName: response.data.branchName,
          location: response.data.location,
          hotline: response.data.hotline
        };
      }
    } catch (protectedError) {
      console.warn('Failed to load protected branch detail', protectedError);
    }

    return fallback;
  }, []);

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
  }, [branchIds, fetchBranchSummary]);

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

  const benefits = plan?.benefits && plan.benefits.length > 0 ? plan.benefits : FALLBACK_BENEFITS;
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
  const outstanding = enhancedContract?.debtAmount ?? Math.max(0, totalValue - paidAmount);

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

      try {
        setCancelLoading(true);
        await membershipApi.cancelPublicMembershipContract(enhancedContract._id, { reason });

        toast.success('Hủy gói membership thành công!');
        setShowCancelDialog(false);

        // Delay để backend lưu xong
        setTimeout(() => {
          refetch();
        }, 500);
      } catch (error) {
        console.error('Error canceling membership:', error);
        toast.error('Không thể hủy gói membership', {
          description: error instanceof Error ? error.message : 'Vui lòng thử lại sau'
        });
        throw error;
      } finally {
        setCancelLoading(false);
      }
    },
    [enhancedContract?._id, refetch]
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
            <Dumbbell className="h-4 w-4" /> Membership
          </p>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Quản lý gói tập luyện</h1>
          <p className="mt-1 text-sm text-gray-600">Theo dõi trạng thái hợp đồng và quyền lợi thành viên của bạn.</p>
        </div>

        {branchIds.length > 1 ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-gray-500">Chi nhánh</span>
            <Select
              value={selectedBranchId}
              onValueChange={setSelectedBranchId}
              disabled={!branchIds.length || branchSummaryLoading}
            >
              <SelectTrigger className="min-w-[220px] justify-between">
                <SelectValue placeholder="Chọn chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                {branchIds.map((branchId) => {
                  const summary = branchSummaries[branchId];
                  return (
                    <SelectItem key={branchId} value={branchId}>
                      <div className="flex flex-col text-left">
                        <span className="font-medium">{summary?.branchName ?? defaultBranchLabel(branchId)}</span>
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
            <AlertTitle>Không thể tải thông tin membership</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={refetch}>
                Thử lại
              </Button>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {showBranchAlert && (
        <Alert>
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <div>
            <AlertTitle>Chưa có chi nhánh được gán</AlertTitle>
            <AlertDescription>
              Tài khoản của bạn hiện chưa được liên kết với chi nhánh cụ thể. Vui lòng liên hệ quầy tiếp tân để được hỗ
              trợ.
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
            outstanding={outstanding}
            onRenew={handleBrowsePlans}
            onContact={handleContactBranch}
            onExtend={() => setShowExtendDialog(true)}
            onCancel={() => setShowCancelDialog(true)}
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
  outstanding: number;
  onRenew: () => void;
  onContact: () => void;
  onExtend: () => void;
  onCancel: () => void;
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
  outstanding,
  onRenew,
  onContact,
  onExtend,
  onCancel
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
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <MembershipBenefitsCard benefits={benefits} description={plan?.description} />
        <MembershipPaymentCard
          contract={contract}
          totalValue={totalValue}
          paidAmount={paidAmount}
          outstanding={outstanding}
        />
        <MembershipActionsCard
          branch={branch}
          onRenew={onRenew}
          onContact={onContact}
          onExtend={onExtend}
          onCancel={onCancel}
          expiringSoon={expiringSoon}
          contract={contract}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MembershipTimelineCard contract={contract} />
        <MembershipNotesCard contract={contract} />
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
}

function MembershipOverviewCard({
  contract,
  plan,
  branch,
  daysRemaining,
  timelineProgress,
  expiringSoon
}: MembershipOverviewCardProps) {
  const statusLabel = getMembershipStatusLabel(contract.status);

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-6 text-white sm:px-8 sm:py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Gói membership</p>
            <h2 className="text-3xl font-semibold">{plan?.name ?? 'Gói tập luyện hiện tại'}</h2>
            <p className="mt-1 max-w-2xl text-sm text-white/70">
              {plan?.description ?? 'Quyền lợi và hạn sử dụng được cập nhật theo hợp đồng mới nhất.'}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <Badge
              variant="outline"
              className="border-white/40 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white"
            >
              {statusLabel}
            </Badge>
            <span className="text-xs text-white/70">Mã hợp đồng #{contract._id.slice(-8).toUpperCase()}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <InfoRow
            label="Chi nhánh"
            value={branch?.branchName ?? 'Đang cập nhật'}
            subValue={branch?.location}
            icon={MapPin}
          />
          <InfoRow
            label="Chu kỳ"
            value={formatDurationLabel(plan?.durationInMonths)}
            subValue={daysRemaining != null ? `${daysRemaining} ngày còn lại` : undefined}
            icon={Calendar}
          />
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-white/70">
            <span>{formatDateLabel(contract.startDate)}</span>
            <span>{formatDateLabel(contract.endDate)}</span>
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
            Gói của bạn sắp hết hạn, hãy gia hạn sớm để tránh gián đoạn.
          </div>
        )}
      </div>

      <CardContent className="grid gap-4 py-6 text-sm text-gray-700 sm:grid-cols-2 lg:grid-cols-4">
        <KeyStat label="Ngày bắt đầu" value={formatDateLabel(contract.startDate)} icon={Calendar} />
        <KeyStat
          label="Kích hoạt"
          value={formatDateLabel(contract.activationDate ?? contract.startDate)}
          icon={Sparkles}
        />
        <KeyStat label="Ngày hết hạn" value={formatDateLabel(contract.endDate)} icon={Calendar} />
        <KeyStat label="Cập nhật gần nhất" value={formatDateLabel(contract.updatedAt)} icon={RefreshCcw} />
      </CardContent>
    </Card>
  );
}

interface MembershipBenefitsCardProps {
  benefits: string[];
  description?: string;
}

function MembershipBenefitsCard({ benefits, description }: MembershipBenefitsCardProps) {
  return (
    <Card className="h-full border border-orange-100 bg-gradient-to-br from-orange-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <ShieldCheck className="h-4 w-4" /> Quyền lợi thành viên
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
  outstanding: number;
}

function MembershipPaymentCard({ contract, totalValue, paidAmount, outstanding }: MembershipPaymentCardProps) {
  const discountCampaign = contract.discountCampaignSnapshot?.campaignName;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <CreditCard className="h-4 w-4 text-orange-500" /> Thanh toán
        </CardTitle>
        <CardDescription>Tổng quan công nợ và ưu đãi áp dụng</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <PaymentStat label="Tổng phí" value={formatCurrency(totalValue)} />
        <PaymentStat label="Đã thanh toán" value={formatCurrency(paidAmount)} />
        <PaymentStat label="Công nợ còn lại" value={formatCurrency(outstanding)} highlight={outstanding > 0} />
        <div className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-600">
          Ưu đãi áp dụng: <span className="font-medium">{discountCampaign ?? 'Không có'}</span>
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
}

function MembershipActionsCard({
  branch,
  onRenew,
  onContact,
  onExtend,
  onCancel,
  expiringSoon,
  contract
}: MembershipActionsCardProps) {
  const canExtend = ['ACTIVE', 'EXPIRED', 'PAST_DUE'].includes(contract.status);
  const canCancel = ['ACTIVE', 'PENDING_ACTIVATION'].includes(contract.status);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quản lý gói của bạn</CardTitle>
        <CardDescription>Gia hạn, hủy gói hoặc liên hệ chi nhánh</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">{branch?.branchName ?? 'Chi nhánh chưa cập nhật'}</p>
          {branch?.location && <p className="text-xs text-gray-500">{branch.location}</p>}
          {branch?.hotline && <p className="text-xs text-gray-500">Hotline: {branch.hotline}</p>}
          {!branch?.hotline && <p className="text-xs text-gray-500">Hotline chưa được cập nhật</p>}
        </div>
        {expiringSoon && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Gói sắp hết hạn — hãy gia hạn để duy trì quyền lợi.
          </div>
        )}
        <div className="flex flex-col gap-3">
          <Button
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:from-orange-600 hover:to-orange-700"
            onClick={onExtend}
            disabled={!canExtend}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Gia hạn gói
          </Button>
          <Button variant="outline" onClick={onRenew} className="justify-center">
            <Sparkles className="h-4 w-4 mr-2" />
            Nâng cấp gói mới
          </Button>
          <Button variant="outline" onClick={onContact} disabled={!branch?.hotline} className="justify-center">
            <PhoneCall className="h-4 w-4 mr-2" /> Gọi hotline
          </Button>
          <Button variant="destructive" onClick={onCancel} disabled={!canCancel} className="justify-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Hủy gói
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface MembershipTimelineCardProps {
  contract: EnhancedMembershipContract;
}

function MembershipTimelineCard({ contract }: MembershipTimelineCardProps) {
  const timeline = [
    { label: 'Tạo hợp đồng', value: formatDateLabel(contract.createdAt), icon: FileText },
    { label: 'Kích hoạt', value: formatDateLabel(contract.activationDate ?? contract.startDate), icon: Sparkles },
    { label: 'Ngày bắt đầu', value: formatDateLabel(contract.startDate), icon: Calendar },
    { label: 'Ngày kết thúc', value: formatDateLabel(contract.endDate), icon: Calendar },
    { label: 'Cập nhật gần nhất', value: formatDateLabel(contract.updatedAt), icon: RefreshCcw }
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Dòng thời gian hợp đồng</CardTitle>
        <CardDescription>Kiểm tra các mốc quan trọng của membership</CardDescription>
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
}

function MembershipNotesCard({ contract }: MembershipNotesCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Ghi chú hợp đồng</CardTitle>
        <CardDescription>Theo dõi ghi chú và chiến dịch giảm giá (nếu có)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-gray-700">
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">Chiến dịch áp dụng</p>
          <p className="font-medium text-gray-900">
            {contract.discountCampaignSnapshot?.campaignName ?? 'Không có chiến dịch ưu đãi'}
          </p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
          <p className="text-xs text-gray-500">Ghi chú</p>
          <p>{contract.notes ?? 'Không có ghi chú bổ sung.'}</p>
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
}

function MembershipEmptyState({ branchName, onBrowsePlans, loadingBranches }: MembershipEmptyStateProps) {
  return (
    <Card className="border-dashed border-gray-200 bg-white text-center">
      <CardHeader>
        <CardTitle className="flex flex-col items-center gap-2 text-gray-900">
          <Dumbbell className="h-5 w-5 text-orange-500" />
          Bạn chưa có gói membership hoạt động
        </CardTitle>
        <CardDescription>
          {loadingBranches
            ? 'Đang tải chi nhánh của bạn...'
            : `Chưa có hợp đồng tại ${branchName ?? 'chi nhánh được chọn'}. Hãy đăng ký ngay để nhận đặc quyền thành viên.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={onBrowsePlans} className="bg-orange-500 text-white hover:bg-orange-600">
          Khám phá gói membership
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
