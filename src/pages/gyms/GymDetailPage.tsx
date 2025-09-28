import React, { useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/BaseHeader';
import { Footer } from '@/components/layout/BaseFooter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorMessage } from '@/components/ui/error-message';
import { useBranchDetail } from '@/hooks/useBranches';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { GymHeroSection } from '@/components/gyms/GymHeroSection';
import { GymBasicInfo } from '@/components/gyms/GymBasicInfo';
import { GymGallery } from '@/components/gyms/GymGallery';
import { GymServices } from '@/components/gyms/GymServices';
import { GymTrainers } from '@/components/gyms/GymTrainers';
import { GymReviews } from '@/components/gyms/GymReviews';
import { MapPin, Users, Dumbbell, Star, AlertCircle, X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { usePublicMembershipPlans } from '@/hooks/useMembershipPlans';
import type { MembershipPlan } from '@/types/api/Membership';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Mock data for features not yet available from API
const mockServicePackages = [
  {
    name: 'CƠ BẢN',
    price: '399.000 VND',
    period: '/tháng',
    features: [
      'Tự động thanh toán hàng tháng',
      'Tập luyện tại toàn hệ thống The New Gym trên toàn quốc',
      'Miễn phí kiểm tra sức khỏe và sai lệch tư thế, và nhiều hơn nữa!'
    ],
    isPopular: false
  },
  {
    name: 'PREMIUM',
    price: '299.000 VND',
    period: '/tháng',
    features: [
      'Tự động thanh toán hàng tháng',
      'Gói thành viên premium với đầy đủ tiện ích',
      'Hướng dẫn cá nhân từ huấn luyện viên chuyên nghiệp'
    ],
    isPopular: true
  },
  {
    name: 'NÂNG CAO',
    price: '499.000 VND',
    period: '/tháng',
    features: [
      'Tự động thanh toán hàng tháng',
      'Truy cập không giới hạn tất cả thiết bị',
      '1-on-1 personal training sessions'
    ],
    isPopular: false
  }
];

const mockTrainers = [
  {
    id: 1,
    name: 'Nguyễn Văn Minh',
    title: 'Huấn luyện viên',
    experience: '+5 năm kinh nghiệm',
    specialties: 'Chuyên môn: Tăng cơ giảm mỡ, xây dựng thói quen ăn uống và tập luyện khoa học.',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300'
  },
  {
    id: 2,
    name: 'Trần Thị Lan',
    title: 'Huấn luyện viên',
    experience: '+3 năm kinh nghiệm',
    specialties: 'Chuyên môn: Yoga, Pilates, thư giãn cơ thể và tinh thần.',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1594736797933-d0f37b3dad85?w=300'
  },
  {
    id: 3,
    name: 'Lê Hoàng Nam',
    title: 'Huấn luyện viên',
    experience: '+4 năm kinh nghiệm',
    specialties: 'Chuyên môn: Functional Training, CrossFit, nâng cao sức bền.',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1566488907985-df25fa5ea9e6?w=300'
  },
  {
    id: 4,
    name: 'Phạm Thị Hoa',
    title: 'Huấn luyện viên',
    experience: '+6 năm kinh nghiệm',
    specialties: 'Chuyên môn: Cardio, giảm cân, tăng cường sức khỏe tim mạch.',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1544741256-7ad5ac882d5d?w=300'
  }
];

const mockPromotionalOffers = [
  {
    title: 'Đăng ký nhóm giảm 20%',
    location: 'Phòng tập VLOGAWORLD',
    time: '10:00 đến 15:00',
    price: '399.000 VND/tháng',
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=300'
  },
  {
    title: 'Ưu đãi thành viên mới',
    location: 'Phòng tập VLOGAWORLD',
    time: '16:00 đến 20:00',
    price: '299.000 VND/tháng',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300'
  }
];

const GymDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const { t, i18n } = useTranslation();

  const { branch, loading, error, refetch } = useBranchDetail(id || '');
  const branchIdForMembership = branch?._id ?? '';
  const membershipQueryParams = useMemo(
    () => ({
      branchId: branchIdForMembership,
      limit: 9,
      sortBy: 'price' as const,
      sortOrder: 'asc' as const
    }),
    [branchIdForMembership]
  );

  const {
    plans: membershipPlans,
    loading: membershipLoading,
    error: membershipError,
    refetch: refetchMembership
  } = usePublicMembershipPlans(membershipQueryParams, { enabled: Boolean(branchIdForMembership) });
  const [isMembershipDialogOpen, setIsMembershipDialogOpen] = useState(false);
  const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(null);

  const locale = useMemo(() => {
    if (!i18n.language) {
      return 'en-US';
    }
    if (i18n.language.includes('-')) {
      return i18n.language;
    }
    switch (i18n.language) {
      case 'vi':
        return 'vi-VN';
      case 'en':
        return 'en-US';
      default:
        return i18n.language;
    }
  }, [i18n.language]);

  const formatPrice = useCallback(
    (value: number, currency: string) => {
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          maximumFractionDigits: 0
        }).format(value);
      } catch {
        try {
          return `${value.toLocaleString(locale)} ${currency}`;
        } catch {
          return `${value} ${currency}`;
        }
      }
    },
    [locale]
  );

  const selectedPlan = useMemo<MembershipPlan | null>(() => {
    if (!membershipPlans.length) {
      return null;
    }
    if (!selectedMembershipId) {
      return membershipPlans[0];
    }
    return membershipPlans.find((plan: MembershipPlan) => plan._id === selectedMembershipId) ?? membershipPlans[0];
  }, [membershipPlans, selectedMembershipId]);

  // Scroll to top when component mounts
  useScrollToTop();

  const handleBackClick = () => {
    navigate(-1);
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gym-orange mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin phòng tập...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Error state
  if (error || !branch) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Không tìm thấy phòng tập</h1>
            <p className="text-slate-600 mb-6">
              {error || 'Phòng tập bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.'}
            </p>
            <div className="space-y-3">
              <ErrorMessage message={error || 'Không thể tải thông tin phòng tập'} onRetry={refetch} />
              <Button variant="outline" onClick={handleBackClick} className="mt-4">
                ← Quay lại trang trước
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleJoinClick = () => {
    if (!membershipPlans.length) {
      toast.info(t('gymDetail.membership.toast.noPlans'));
      return;
    }
    setSelectedMembershipId(membershipPlans[0]?._id ?? null);
    setIsMembershipDialogOpen(true);
  };

  const handleJoinPlan = () => {
    toast.info(t('gymDetail.membership.toast.onlineSignupComingSoon'));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <GymHeroSection branch={branch} onJoinClick={handleJoinClick} />

      {/* Main Content with Tabs */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-8">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t('gymDetail.tabs.info')}
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              {t('gymDetail.tabs.services')}
            </TabsTrigger>
            <TabsTrigger value="trainers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('gymDetail.tabs.trainers')}
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              {t('gymDetail.tabs.reviews')}
            </TabsTrigger>
          </TabsList>

          {/* Gym Info Tab */}
          <TabsContent value="info" className="space-y-8">
            <GymBasicInfo branch={branch} />
            <GymGallery images={branch.images || []} />
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <GymServices servicePackages={mockServicePackages} promotionalOffers={mockPromotionalOffers} />
          </TabsContent>

          {/* Trainers Tab */}
          <TabsContent value="trainers">
            <GymTrainers trainers={mockTrainers} />
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <GymReviews branch={branch} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <Footer />

      <Dialog
        open={isMembershipDialogOpen}
        onOpenChange={(isOpen) => {
          setIsMembershipDialogOpen(isOpen);
          if (!isOpen) {
            setSelectedMembershipId(null);
          }
        }}
      >
        <DialogContent
          className="max-w-5xl overflow-hidden border border-border/80 bg-background/95 p-0 text-foreground shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/80"
          showCloseButton={false}
        >
          <div className="flex flex-col gap-6">
            <header className="flex items-start gap-4 border-b border-border bg-gradient-to-r from-orange-500/15 via-orange-400/10 to-background px-6 py-6 dark:from-orange-500/25 dark:via-orange-400/15">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-border bg-card">
                <img
                  src={
                    branch.images?.[0] ||
                    branch.coverImage ||
                    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200'
                  }
                  alt={branch.branchName}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{branch.branchName}</span>
                  <span>•</span>
                  <span>{branch.location}</span>
                </div>
                <h2 className="mt-1 text-2xl font-semibold text-foreground">
                  {t('gymDetail.membership.dialog.title')}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('gymDetail.membership.dialog.subtitle', { branchName: branch.branchName })}
                </p>
              </div>
              <DialogClose
                className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                aria-label={t('common.close')}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">{t('common.close')}</span>
              </DialogClose>
            </header>

            <div className="grid gap-6 px-6 pb-6 lg:grid-cols-[240px_minmax(0,1fr)]">
              <aside className="space-y-3 rounded-2xl border border-border bg-muted/70 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('gymDetail.membership.sidebar.title')}
                </h3>
                <div className="space-y-2">
                  {membershipLoading && (
                    <div className="rounded-lg border border-border/80 bg-card px-4 py-3 text-sm text-muted-foreground">
                      {t('gymDetail.membership.sidebar.loading')}
                    </div>
                  )}

                  {!membershipLoading && membershipError && (
                    <button
                      type="button"
                      onClick={() => refetchMembership()}
                      className="w-full rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-left text-sm text-destructive transition hover:bg-destructive/20"
                    >
                      {`${membershipError} - ${t('gymDetail.membership.sidebar.retry')}`}
                    </button>
                  )}

                  {!membershipLoading && !membershipError && membershipPlans.length === 0 && (
                    <div className="rounded-lg border border-border/70 bg-card px-4 py-5 text-center text-sm text-muted-foreground">
                      {t('gymDetail.membership.sidebar.empty')}
                    </div>
                  )}

                  {membershipPlans.map((plan: MembershipPlan) => {
                    const isActivePlan = selectedPlan?._id === plan._id;
                    return (
                      <button
                        key={plan._id}
                        type="button"
                        onClick={() => setSelectedMembershipId(plan._id)}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                          isActivePlan
                            ? 'border-orange-500 bg-orange-500/10 text-foreground shadow-lg shadow-orange-500/25'
                            : 'border-transparent bg-transparent text-muted-foreground hover:border-orange-400/60 hover:bg-orange-500/5 hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-base font-semibold text-foreground">{plan.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {t('gymDetail.membership.sidebar.price', {
                                price: formatPrice(plan.price, plan.currency || 'VND'),
                                interval: t('gymDetail.membership.intervals.monthShort')
                              })}
                            </p>
                          </div>
                          {isActivePlan && (
                            <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-medium text-white shadow-sm">
                              {t('gymDetail.membership.sidebar.activeBadge')}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
                {selectedPlan ? (
                  <>
                    <header className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {t('gymDetail.membership.plan.selectedLabel')}
                          </p>
                          <h3 className="text-xl font-semibold text-foreground">{selectedPlan.name}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-foreground">
                            {formatPrice(selectedPlan.price, selectedPlan.currency || 'VND')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('gymDetail.membership.plan.duration', { count: selectedPlan.durationInMonths })}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={handleJoinPlan}
                        className="mt-2 w-fit rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-sm hover:bg-orange-400"
                      >
                        {t('gymDetail.membership.plan.joinButton')}
                      </Button>
                    </header>

                    {selectedPlan.benefits.length > 0 && (
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <h4 className="font-semibold text-foreground">
                          {t('gymDetail.membership.plan.benefitsTitle')}
                        </h4>
                        <ul className="space-y-2">
                          {selectedPlan.benefits.map((benefit) => (
                            <li key={benefit} className="flex items-start gap-2">
                              <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-orange-500" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p>{t('gymDetail.membership.plan.disclaimerRecurring')}</p>
                      <p>{t('gymDetail.membership.plan.disclaimerPolicy')}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                    {t('gymDetail.membership.plan.emptyState')}
                  </div>
                )}

                <footer className="border-t border-border pt-4 text-xs text-orange-500">
                  <button type="button" className="flex items-center gap-1 font-medium hover:text-orange-400">
                    {t('gymDetail.membership.plan.moreBenefitsCta')}
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 8l5 5 5-5H5z" />
                    </svg>
                  </button>
                </footer>
              </section>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GymDetailPage;
