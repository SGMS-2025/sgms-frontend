import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Users,
  Dumbbell,
  CalendarRange as Calendar,
  Tag,
  IdCard,
  User,
  LayoutDashboard,
  MessageSquare,
  UserCheck,
  UsersRound,
  Briefcase,
  Sparkles,
  DollarSign,
  CalendarDays,
  CreditCard,
  Building2,
  FileText,
  TrendingUp
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuthActions, useAuthState } from '@/hooks/useAuth';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { staffApi } from '@/services/api/staffApi';
import { Sidebar, type SidebarItem as SidebarItemType } from '@/components/common/Sidebar';
import {
  SidebarHeader,
  UserProfileSection,
  DropdownSidebarItem,
  SubMenuItem,
  useSidebarProfile
} from '@/components/common/SidebarShared';
import BusinessVerificationModal from '@/components/business/BusinessVerificationModal';
import { subscriptionApi } from '@/services/api/subscriptionApi';
import { userApi } from '@/services/api/userApi';

const UpgradeCard: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [subscriptionName, setSubscriptionName] = useState<string | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await subscriptionApi.getSubscriptionStats();
        if (!mounted || !res?.success) return;
        setHasActiveSubscription(Boolean(res.data?.hasActiveSubscription));
        setSubscriptionName(res.data?.packageName || null);
      } catch (error) {
        console.error('[OwnerSidebar] Failed to load subscription stats', error);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleClick = () => {
    navigate('/manage/subscriptions');
  };

  const headline = hasActiveSubscription
    ? t('sidebar.current_plan', { defaultValue: 'Current plan' })
    : t('sidebar.upgrade_subtitle', { defaultValue: 'For more features' });

  const ctaLabel = hasActiveSubscription
    ? subscriptionName || t('subscription.card.planLabel')
    : t('sidebar.upgrade_cta', { defaultValue: 'Upgrade to Pro' });

  if (isCollapsed) {
    return (
      <div className="px-1 pb-3">
        <button
          type="button"
          onClick={handleClick}
          className="group relative flex h-9 w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 text-white shadow-md outline-none transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-orange-500/40"
        >
          <span className="pointer-events-none absolute inset-0 bg-white/20 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-40" />
          <Sparkles className="relative h-4 w-4 drop-shadow" />
          <span className="sr-only">{ctaLabel}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="px-2 pb-4">
      <button
        type="button"
        onClick={handleClick}
        className="group relative w-full overflow-hidden rounded-xl border border-orange-100 bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 px-4 py-3 text-left text-white shadow-md outline-none transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-orange-300"
      >
        <span className="pointer-events-none absolute -left-6 -top-6 h-16 w-16 rounded-full bg-white/20 blur-xl transition-all duration-500 group-hover:scale-110" />
        <span className="pointer-events-none absolute right-2 top-2 h-10 w-10 rounded-full border border-white/30 bg-white/20 opacity-70 mix-blend-screen transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/75">{headline}</p>
            <p className="text-sm font-semibold leading-tight">{ctaLabel}</p>
          </div>
          <div className="relative h-9 w-9 rounded-full border border-white/40 bg-white/25 text-white shadow-inner shadow-orange-500/30 backdrop-blur flex items-center justify-center">
            <Sparkles className="h-4 w-4 drop-shadow" />
          </div>
        </div>
      </button>
    </div>
  );
};

export const OwnerSidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed } = useSidebar();
  const { user: authUser, isAuthenticated } = useAuthState();
  const { updateUser, logout } = useAuthActions();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = React.useState(false);

  // Use hook for STAFF users, and fetch separately for OWNER/ADMIN
  const { currentStaff: currentStaffFromHook } = useCurrentUserStaff();
  const [currentStaffForOwner, setCurrentStaffForOwner] = React.useState<{ jobTitle?: string } | null>(null);

  const { profile, isProfileLoading } = useSidebarProfile(isAuthenticated, authUser ?? null, updateUser);

  React.useEffect(() => {
    let ignore = false;

    // Skip if user is STAFF (handled by hook)
    if (authUser?.role === 'STAFF') {
      setCurrentStaffForOwner(null);
      return;
    }

    const fetchStaffInfo = async () => {
      try {
        const response = await staffApi.getMyStaffInfo();
        if (!ignore && response.success && response.data) {
          if (response.data.jobTitle) {
            setCurrentStaffForOwner({
              jobTitle: response.data.jobTitle
            });
          }
        }
      } catch (error) {
        console.debug('Failed to fetch staff info:', error);
        setCurrentStaffForOwner(null);
      }
    };

    if (isAuthenticated && authUser) {
      fetchStaffInfo();
    }

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, authUser]);

  // Determine which currentStaff to use: from hook (STAFF) or from fetch (OWNER/ADMIN)
  const currentStaff = React.useMemo(() => {
    if (currentStaffFromHook?.jobTitle) {
      return { jobTitle: currentStaffFromHook.jobTitle };
    }
    if (currentStaffForOwner?.jobTitle) {
      return currentStaffForOwner;
    }
    return null;
  }, [currentStaffFromHook, currentStaffForOwner]);

  const mainNavItems: SidebarItemType[] = [
    {
      icon: <LayoutDashboard className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.dashboard'),
      href: '/manage/owner',
      isActive: location.pathname === '/manage/owner',
      onClick: () => {
        navigate('/manage/owner');
      },
      'data-tour': 'dashboard-menu'
    },
    {
      icon: <Users className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.staff'),
      href: '/manage/staff',
      isActive: location.pathname === '/manage/staff',
      onClick: () => {
        navigate('/manage/staff');
      },
      'data-tour': 'staff-menu-item'
    },
    {
      icon: <User className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.customers'),
      href: '/manage/customers',
      isActive: location.pathname === '/manage/customers',
      onClick: () => {
        navigate('/manage/customers');
      },
      'data-tour': 'customers-menu-item'
    },
    {
      icon: <CreditCard className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.payments', { defaultValue: 'Payments' }),
      isActive: location.pathname === '/manage/payments',
      onClick: () => {
        navigate('/manage/payments');
      },
      'data-tour': 'payments-menu-item'
    },
    {
      icon: <Dumbbell className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.equipment'),
      href: '/manage/equipment',
      isActive: location.pathname === '/manage/equipment',
      onClick: () => {
        navigate('/manage/equipment');
      },
      'data-tour': 'equipment-menu-item'
    },
    {
      icon: <MessageSquare className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.testimonials'),
      href: '/manage/testimonials',
      isActive: location.pathname === '/manage/testimonials',
      onClick: () => {
        navigate('/manage/testimonials');
      },
      'data-tour': 'testimonials-menu-item'
    },
    {
      icon: <FileText className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.contracts', { defaultValue: 'Hợp đồng / Contracts' }),
      href: '/manage/contracts',
      isActive: location.pathname === '/manage/contracts',
      onClick: () => {
        navigate('/manage/contracts');
      },
      'data-tour': 'contracts-menu-item'
    }
  ];

  const ownerExtraMenuItems = (
    <>
      <DropdownMenuItem onClick={() => setIsVerificationModalOpen(true)} className="cursor-pointer">
        <Building2 className="w-4 h-4 mr-3 stroke-[1.75]" />
        {t('sidebar.business_verification', 'Xác thực doanh nghiệp')}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
    </>
  );

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 self-start flex-shrink-0 transition-all duration-300 ${
        isCollapsed ? 'w-16 overflow-hidden' : 'w-64'
      }`}
      style={isCollapsed ? { maxWidth: '64px', minWidth: '64px' } : {}}
    >
      <SidebarHeader isCollapsed={isCollapsed} subtitle="Owner" showMobileClose={false} />

      <div className={`flex-1 py-2 overflow-y-auto ${isCollapsed ? 'px-1' : 'px-3'}`}>
        <Sidebar items={mainNavItems} isCollapsed={isCollapsed} title={t('sidebar.main_menu')} />

        <div className="mt-1 space-y-1">
          {/* Services Dropdown */}
          <DropdownSidebarItem
            icon={<Briefcase className="w-5 h-5 stroke-[1.75]" />}
            label={t('sidebar.business_services') || 'Dịch vụ / Services'}
            isCollapsed={isCollapsed}
            data-tour="business-services-menu"
          >
            <SubMenuItem
              icon={<UserCheck className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.pt_services') || 'PT / Personal Training'}
              isActive={location.pathname === '/manage/pt-services'}
              onClick={() => navigate('/manage/pt-services')}
              data-tour="pt-services-menu-item"
            />
            <SubMenuItem
              icon={<UsersRound className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.class_services') || 'Lớp học / Class Services'}
              isActive={location.pathname === '/manage/class-services'}
              onClick={() => navigate('/manage/class-services')}
              data-tour="class-services-menu-item"
            />
            <SubMenuItem
              icon={<Tag className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.promotions') || 'Khuyến mãi / Promotions'}
              isActive={location.pathname === '/manage/discounts'}
              onClick={() => navigate('/manage/discounts')}
              data-tour="promotions-menu-item"
            />
            <SubMenuItem
              icon={<IdCard className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.membership_plans') || 'Gói thành viên / Membership'}
              isActive={location.pathname === '/manage/memberships'}
              onClick={() => navigate('/manage/memberships')}
              data-tour="membership-plans-menu-item"
            />
          </DropdownSidebarItem>

          {/* Schedule Dropdown */}
          <DropdownSidebarItem
            icon={<Calendar className="w-5 h-5 stroke-[1.75]" />}
            label={t('sidebar.schedule') || 'Schedule'}
            isCollapsed={isCollapsed}
            data-tour="schedule-menu"
          >
            <SubMenuItem
              icon={<Calendar className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.work_schedule') || 'Work Schedule'}
              isActive={location.pathname === '/manage/workshifts/calendar'}
              onClick={() => navigate('/manage/workshifts/calendar')}
              data-tour="work-schedule-menu-item"
            />
            <SubMenuItem
              icon={<CalendarDays className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.time_off') || 'Time Off'}
              isActive={location.pathname.startsWith('/manage/timeoff')}
              onClick={() => navigate('/manage/timeoff')}
              data-tour="timeoff-menu-item"
            />
            <SubMenuItem
              icon={<UsersRound className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.classes') || 'Classes'}
              isActive={location.pathname === '/manage/classes'}
              onClick={() => navigate('/manage/classes')}
              data-tour="classes-menu-item"
            />
          </DropdownSidebarItem>

          {/* Finance Dropdown */}
          <DropdownSidebarItem
            icon={<BarChart3 className="w-5 h-5 stroke-[1.75]" />}
            label={t('sidebar.finance') || 'Finance'}
            isCollapsed={isCollapsed}
            data-tour="finance-menu"
          >
            <SubMenuItem
              icon={<DollarSign className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.expenses') || 'Chi phí / Expenses'}
              isActive={location.pathname === '/manage/expenses'}
              onClick={() => {
                navigate('/manage/expenses');
              }}
              data-tour="expenses-menu-item"
            />
            <SubMenuItem
              icon={<TrendingUp className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.kpi', 'KPI Management')}
              isActive={location.pathname === '/manage/kpi'}
              onClick={() => {
                navigate('/manage/kpi');
              }}
              data-tour="kpi-menu-item"
            />
          </DropdownSidebarItem>
        </div>
      </div>

      <UpgradeCard isCollapsed={isCollapsed} />

      <UserProfileSection
        isCollapsed={isCollapsed}
        user={profile}
        isLoading={isProfileLoading}
        onLogout={logout}
        currentStaff={currentStaff}
        settingsPath="/manage/setting"
        defaultRoleLabel={t('sidebar.owner') || 'Owner'}
        extraMenuItems={ownerExtraMenuItems}
      />

      <BusinessVerificationModal
        open={isVerificationModalOpen}
        onOpenChange={setIsVerificationModalOpen}
        onSuccess={() => {
          if (isAuthenticated) {
            void userApi.getProfile().then((result) => {
              if (result.success && result.data) {
                updateUser(result.data);
              }
            });
          }
        }}
      />
    </div>
  );
};
