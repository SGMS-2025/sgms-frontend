import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  ArrowLeft,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  Crown,
  Dumbbell,
  FileText,
  IdCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { customerApi } from '@/services/api/customerApi';
import { cn } from '@/utils/utils';
import type { CustomerDisplay } from '@/types/api/Customer';
import type { LucideIcon } from 'lucide-react';

const formatDate = (value?: string) => {
  if (!value) return '—';
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return parsed.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatCurrency = (value?: string | number) => {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  const amount = typeof value === 'number' ? value : Number(value);

  if (Number.isNaN(amount)) {
    return typeof value === 'string' ? value : '—';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
};

const getGenderLabel = (gender?: string) => {
  if (!gender) return '—';

  const normalized = gender.toLowerCase();

  if (normalized === 'male') return 'Nam';
  if (normalized === 'female') return 'Nữ';
  return gender;
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
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<CustomerDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (id) {
      void fetchCustomerDetail();
    }
  }, [id]);

  const fetchCustomerDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await customerApi.getCustomerById(id);

      if (response.success && response.data) {
        setCustomer(response.data);
      } else {
        setError(response.message || 'Failed to fetch customer details');
      }
    } catch (fetchError) {
      console.error('Error fetching customer detail:', fetchError);
      setError('An error occurred while fetching customer details');
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-sm text-muted-foreground">Đang tải thông tin khách hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="rounded-2xl border border-destructive/40 bg-destructive/10">
          <AlertTitle>Không thể tải thông tin khách hàng</AlertTitle>
          <AlertDescription>{error || 'Customer not found'}</AlertDescription>
        </Alert>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="rounded-full" onClick={fetchCustomerDetail}>
            Thử tải lại
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate('/manage/customers')}>
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
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
  const membershipPlanName =
    customer.latestMembershipContract?.membershipPlanId?.name || customer.membershipType || 'Chưa cập nhật';
  const servicePackageName = customer.latestServiceContract?.servicePackageId?.name || customer.serviceName || '—';
  const membershipContract = customer.latestMembershipContract;
  const serviceContract = customer.latestServiceContract;
  const statusLabel = getStatusText(customer.status);

  const totalSpentDisplay = formatCurrency(customer.totalSpent);
  const totalSpentLabel = totalSpentDisplay === '—' ? 'Chưa cập nhật' : totalSpentDisplay;
  const lastPaymentDisplay = formatDate(customer.lastPaymentDate);
  const lastPaymentLabel = lastPaymentDisplay === '—' ? 'Chưa có giao dịch' : lastPaymentDisplay;
  const membershipStatusDisplay = customer.membershipStatus || 'Chưa cập nhật';
  const branchDisplay = branchNames ?? 'Chưa gán chi nhánh';

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
                  {customer.isLoyal && (
                    <Badge className="border-white/40 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                      <Crown className="h-3.5 w-3.5" />
                      Khách hàng trung thành
                    </Badge>
                  )}
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <span className="text-xs uppercase tracking-wide text-white/70">Gói hội viên</span>
              <p className="mt-1 text-sm font-semibold">{membershipPlanName}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <span className="text-xs uppercase tracking-wide text-white/70">Ngày tham gia</span>
              <p className="mt-1 text-sm font-semibold">{formatDate(customer.joinDate)}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <span className="text-xs uppercase tracking-wide text-white/70">Ngày hết hạn</span>
              <p className="mt-1 text-sm font-semibold">{formatDate(customer.expiryDate)}</p>
            </div>
          </div>
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
                Tổng quan
              </TabsTrigger>
              <TabsTrigger
                value="workouts"
                className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                Luyện tập
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                Điểm danh
              </TabsTrigger>
              <TabsTrigger
                value="class-booking"
                className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                Lịch lớp
              </TabsTrigger>
              <TabsTrigger
                value="payment"
                className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                Thanh toán
              </TabsTrigger>
              <TabsTrigger
                value="fitness-calculator"
                className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                Chỉ số
              </TabsTrigger>
              <TabsTrigger
                value="member-reports"
                className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                Báo cáo
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general" className="space-y-6 pt-4">
            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="rounded-3xl border border-border bg-card shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <IdCard className="h-5 w-5 text-primary" />
                    Hồ sơ cá nhân
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Thông tin nhận diện và trạng thái hội viên.</p>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <InfoField label="Mã hội viên" value={customer.id ? customer.id.slice(-8).toUpperCase() : '—'} />
                  <InfoField label="Giới tính" value={getGenderLabel(customer.gender)} />
                  <InfoField label="Ngày sinh" value={formatDate(customer.dateOfBirth)} />
                  <InfoField
                    label="Tình trạng tài khoản"
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
                  <InfoField label="Ngày tạo hồ sơ" value={formatDate(customer.createdAt)} />
                  <InfoField
                    label="Phân loại"
                    value={customer.isLoyal ? 'Khách hàng trung thành' : 'Khách hàng tiêu chuẩn'}
                  />
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-border bg-card shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5 text-primary" />
                    Gói dịch vụ & hội viên
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Theo dõi hành trình gói tập và dịch vụ đi kèm của khách hàng.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <InfoField label="Gói hội viên" value={membershipPlanName} />
                  <InfoField label="Trạng thái gói" value={membershipStatusDisplay} />
                  <InfoField label="Ngày tham gia" value={formatDate(customer.joinDate)} />
                  <InfoField label="Ngày hết hạn" value={formatDate(customer.expiryDate)} />
                  <InfoField label="Gói dịch vụ" value={servicePackageName} />
                  <InfoField
                    label="Thời hạn dịch vụ"
                    value={
                      serviceContract?.startDate || serviceContract?.endDate
                        ? `${formatDate(serviceContract?.startDate)} → ${formatDate(serviceContract?.endDate)}`
                        : 'Chưa cập nhật'
                    }
                  />
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-border bg-card shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-5 w-5 text-primary" />
                    Liên hệ & chi nhánh
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Giữ thông tin liên hệ thống nhất cho đội ngũ CSKH.</p>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <InfoField label="Số điện thoại" value={customer.phone || 'Chưa cập nhật'} />
                  <InfoField label="Email" value={customer.email || 'Chưa cập nhật'} />
                  <InfoField label="Địa chỉ" value={customer.address || 'Chưa cập nhật'} />
                  <InfoField label="Chi nhánh" value={branchDisplay} />
                  <InfoField label="Người giới thiệu" value={customer.referrerStaffName || 'Chưa cập nhật'} />
                  <InfoField label="Mã thẻ" value={customer.cardCode || 'Chưa cập nhật'} />
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-border bg-card shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Thông tin thanh toán
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <InfoField label="Tổng chi tiêu" value={totalSpentLabel} />
                  <InfoField label="Thanh toán gần nhất" value={lastPaymentLabel} />
                  <InfoField
                    label="Công nợ hội viên"
                    value={membershipContract ? formatCurrency(membershipContract.remainingDebt) : 'Chưa cập nhật'}
                  />
                  <InfoField
                    label="Đã thanh toán (hội viên)"
                    value={membershipContract ? formatCurrency(membershipContract.initialPaidAmount) : 'Chưa cập nhật'}
                  />
                  <InfoField
                    label="Công nợ dịch vụ"
                    value={serviceContract ? formatCurrency(serviceContract.remainingDebt) : 'Chưa cập nhật'}
                  />
                  <InfoField
                    label="Đã thanh toán (dịch vụ)"
                    value={serviceContract ? formatCurrency(serviceContract.initialPaidAmount) : 'Chưa cập nhật'}
                  />
                </CardContent>
              </Card>
            </div>

            {customer.notes && (
              <Card className="rounded-3xl border border-border bg-card shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5 text-primary" />
                    Ghi chú nội bộ
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
              title="Nhật ký luyện tập"
              description="Dữ liệu bài tập sẽ hiển thị tại đây khi tích hợp với ứng dụng luyện tập."
            />
          </TabsContent>

          <TabsContent value="attendance" className="pt-4">
            <PlaceholderCard
              icon={CalendarCheck}
              title="Lịch sử điểm danh"
              description="Theo dõi tần suất tham gia để tối ưu hiệu quả luyện tập cho khách hàng."
            />
          </TabsContent>

          <TabsContent value="class-booking" className="pt-4">
            <PlaceholderCard
              icon={CalendarDays}
              title="Lịch đặt lớp"
              description="Các lịch đặt lớp sẽ đồng bộ khi kết nối với hệ thống đặt lịch của phòng tập."
            />
          </TabsContent>

          <TabsContent value="payment" className="pt-4">
            <PlaceholderCard
              icon={CreditCard}
              title="Lịch sử thanh toán"
              description="Chi tiết giao dịch sẽ xuất hiện ngay khi kết nối với hệ thống kế toán."
            />
          </TabsContent>

          <TabsContent value="fitness-calculator" className="pt-4">
            <PlaceholderCard
              icon={Activity}
              title="Chỉ số thể chất"
              description="Các chỉ số BMI, InBody và mục tiêu sức khỏe sẽ được hiển thị trong phiên bản sắp tới."
            />
          </TabsContent>

          <TabsContent value="member-reports" className="pt-4">
            <PlaceholderCard
              icon={FileText}
              title="Báo cáo hội viên"
              description="Báo cáo chuyên sâu về khách hàng sẽ sẵn sàng khi tính năng báo cáo được kích hoạt."
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
