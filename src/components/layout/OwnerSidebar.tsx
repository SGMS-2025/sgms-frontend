import React from 'react';
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
  Settings,
  ChevronUp,
  ChevronDown,
  LogOut,
  UserCircle,
  ShieldCheck as Shield,
  PanelLeft,
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
import LanguageSwitcher from '@/components/ui/language-switcher';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuthActions, useAuthState } from '@/hooks/useAuth';
import { userApi } from '@/services/api/userApi';
import type { User as ApiUser } from '@/types/api/User';
import { Sidebar, type SidebarItem as SidebarItemType } from '@/components/common/Sidebar';
import BusinessVerificationModal from '@/components/business/BusinessVerificationModal';

interface DropdownSidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isCollapsed?: boolean;
  children: React.ReactNode;
}

interface SubMenuItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

const SubMenuItem: React.FC<SubMenuItemProps> = ({ icon, label, isActive = false, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 w-full gap-3 px-3 ${
        isActive ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-500'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="flex-shrink-0 w-5 h-5 relative">{icon}</span>
      <span className="text-sm font-medium truncate">{label}</span>
    </button>
  );
};

const DropdownSidebarItem: React.FC<DropdownSidebarItemProps> = ({ icon, label, isCollapsed = false, children }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (isCollapsed) {
    return (
      <div className="px-1 w-12 flex justify-center">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="group relative flex items-center justify-center py-2.5 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 w-full"
              aria-label={label}
              title={label}
            >
              <span className="flex-shrink-0 w-5 h-5 relative">{icon}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" sideOffset={8} className="w-48">
            {children}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 text-gray-700 hover:bg-orange-50 hover:text-orange-500 ${
          isCollapsed ? 'justify-center px-1 w-12' : 'w-full px-3'
        }`}
        aria-label={label}
        title={isCollapsed ? label : undefined}
      >
        <span className="flex-shrink-0 w-5 h-5 relative">{icon}</span>
        {!isCollapsed && (
          <>
            <span className="text-sm font-medium truncate flex-1 text-left ml-3">{label}</span>
            <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center ml-1">
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </span>
          </>
        )}
      </button>

      {/* Inline submenu - only show when not collapsed */}
      {!isCollapsed && isOpen && <div className="ml-4 mt-1 space-y-1">{children}</div>}
    </div>
  );
};

const SidebarHeader: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
  const { t } = useTranslation();
  const { toggle, setCollapsed } = useSidebar();

  return (
    <div
      className={`flex items-center py-4 border-b border-gray-200 dark:border-gray-800 ${isCollapsed ? 'justify-center px-1' : 'gap-3 px-3'}`}
    >
      <button
        type="button"
        className="flex-shrink-0 w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
        onClick={() => {
          if (isCollapsed) setCollapsed(false);
        }}
        title={isCollapsed ? t('sidebar.open_sidebar') : undefined}
        aria-label={isCollapsed ? t('sidebar.open_sidebar') : undefined}
      >
        <img src="/src/assets/images/logo2.png" alt={t('sidebar.gym_smart_logo')} className="w-6 h-6 object-contain" />
      </button>
      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            <span className="text-orange-500">GYM</span>
            <span className="text-gray-800">SMART</span>
          </h1>
        </div>
      )}

      {/* Show the toggle on the right when expanded; hide when collapsed */}
      {!isCollapsed && (
        <button
          type="button"
          onClick={toggle}
          className="ml-auto h-8 w-8 rounded-lg flex items-center justify-center transition-colors bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-600 active:bg-orange-100 active:shadow-inner dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          aria-pressed={!isCollapsed}
          aria-label={t('sidebar.close_sidebar')}
          title={t('sidebar.close_sidebar')}
        >
          <PanelLeft className="h-4 w-4" />
          <span className="sr-only">{t('sidebar.close_sidebar')}</span>
        </button>
      )}
    </div>
  );
};

const UpgradeCard: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/manage/subscriptions');
  };

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
          <span className="sr-only">{t('sidebar.upgrade_cta', { defaultValue: 'Upgrade to Pro' })}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="px-2 pb-4">
      <button
        type="button"
        onClick={handleClick}
        className="group relative w-full overflow-hidden rounded-xl border border-orange-100 bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 px-4 py-[10px] text-left text-white shadow-md outline-none transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-orange-300"
      >
        <span className="pointer-events-none absolute -left-8 -top-8 h-20 w-20 rounded-full bg-white/20 blur-2xl transition-all duration-500 group-hover:scale-110" />
        <span className="pointer-events-none absolute right-4 top-3 h-10 w-10 rounded-full border border-white/40 bg-white/30 opacity-60 mix-blend-screen transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        <div className="relative flex flex-col gap-2.5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">
              {t('sidebar.upgrade_subtitle', { defaultValue: 'For more features' })}
            </p>
            <p className="text-base font-semibold leading-tight">
              {t('sidebar.upgrade_cta', { defaultValue: 'Upgrade to Pro' })}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
};

const formatRole = (role?: string) => {
  if (!role) return 'Owner';
  return `${role.charAt(0)}${role.slice(1).toLowerCase()}`;
};

const UserProfile: React.FC<{
  isCollapsed: boolean;
  user: ApiUser | null;
  isLoading: boolean;
  onLogout: () => void;
  onOpenVerificationModal: () => void;
}> = ({ isCollapsed, user, isLoading, onLogout, onOpenVerificationModal }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const displayName = user?.fullName || user?.username || t('sidebar.account') || 'User';
  const roleKey = user?.role ? `roles.${user.role.toLowerCase()}` : '';
  const translatedRole = roleKey ? t(roleKey) : '';

  let roleLabel = t('sidebar.owner') || 'Owner';
  if (user?.role) {
    if (translatedRole && translatedRole !== roleKey) {
      roleLabel = translatedRole;
    } else {
      roleLabel = formatRole(user.role);
    }
  }

  const avatarUrl = user?.avatar?.url;

  if (isLoading && !user) {
    return (
      <div className={`py-2 border-t border-gray-200 ${isCollapsed ? 'px-1 flex justify-center' : 'px-3'}`}>
        <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-100 animate-pulse">
          <div className="h-8 w-8 rounded-full bg-gray-200" />
          {!isCollapsed && (
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 rounded bg-gray-200" />
              <div className="h-3 w-16 rounded bg-gray-200" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = (
    <>
      <DropdownMenuItem
        onClick={() => {
          navigate('/profile');
        }}
        className="cursor-pointer"
      >
        <UserCircle className="w-4 h-4 mr-3 stroke-[1.75]" />
        {t('sidebar.profile')}
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={() => {
          navigate('/settings');
        }}
        className="cursor-pointer"
      >
        <Settings className="w-4 h-4 mr-3 stroke-[1.75]" />
        {t('sidebar.account_settings')}
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={() => {
          navigate('/security');
        }}
        className="cursor-pointer"
      >
        <Shield className="w-4 h-4 mr-3 stroke-[1.75]" />
        {t('sidebar.security')}
      </DropdownMenuItem>

      <DropdownMenuItem onClick={onOpenVerificationModal} className="cursor-pointer">
        <Building2 className="w-4 h-4 mr-3 stroke-[1.75]" />
        {t('sidebar.business_verification', 'Xác thực doanh nghiệp')}
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <LanguageSwitcher variant="sidebar" />

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onClick={() => {
          onLogout();
        }}
        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
      >
        <LogOut className="w-4 h-4 mr-3 stroke-[1.75]" />
        {t('sidebar.logout')}
      </DropdownMenuItem>
    </>
  );

  if (isCollapsed) {
    return (
      <div className="px-1 py-2 border-t border-gray-200 flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
              aria-label={displayName}
              title={displayName}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback>
                  <User className="w-4 h-4 text-gray-600 stroke-[1.75]" />
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" sideOffset={8} className="w-56">
            {menuItems}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className={`py-2 border-t border-gray-200 ${isCollapsed ? 'px-1 flex justify-center' : 'px-3'}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-200 w-full">
            <Avatar className="w-8 h-8">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback>
                <User className="w-4 h-4 text-gray-600 stroke-[1.75]" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{roleLabel}</p>
            </div>
            <ChevronUp className="w-4 h-4 text-gray-400" />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="right" align="end" className="w-56 ml-2" sideOffset={8}>
          {menuItems}
        </DropdownMenuContent>
      </DropdownMenu>
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
  const [profile, setProfile] = React.useState<ApiUser | null>(authUser ?? null);
  const [isProfileLoading, setIsProfileLoading] = React.useState(false);
  const [hasInitiallyFetched, setHasInitiallyFetched] = React.useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = React.useState(false);

  React.useEffect(() => {
    setProfile(authUser ?? null);
  }, [authUser]);

  React.useEffect(() => {
    let ignore = false;

    if (!isAuthenticated || hasInitiallyFetched) {
      setIsProfileLoading(false);
      return () => {
        ignore = true;
      };
    }

    const fetchProfile = async () => {
      setIsProfileLoading(true);
      try {
        const response = await userApi.getProfile();
        if (!ignore && response.success && response.data) {
          setProfile(response.data);
          // Only update user if profile data is different from current authUser
          if (JSON.stringify(response.data) !== JSON.stringify(authUser)) {
            updateUser(response.data);
          }
          setHasInitiallyFetched(true);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        if (!ignore) {
          setIsProfileLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, hasInitiallyFetched, authUser, updateUser]);

  const mainNavItems: SidebarItemType[] = [
    {
      icon: <LayoutDashboard className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.dashboard'),
      href: '/manage/owner',
      isActive: location.pathname === '/manage/owner',
      onClick: () => {
        navigate('/manage/owner');
      }
    },
    {
      icon: <Users className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.staff'),
      href: '/manage/staff',
      isActive: location.pathname === '/manage/staff',
      onClick: () => {
        navigate('/manage/staff');
      }
    },
    {
      icon: <User className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.customers'),
      href: '/manage/customers',
      isActive: location.pathname === '/manage/customers',
      onClick: () => {
        navigate('/manage/customers');
      }
    },
    {
      icon: <CreditCard className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.payments', { defaultValue: 'Payments' }),
      isActive: location.pathname === '/manage/payments',
      onClick: () => {
        navigate('/manage/payments');
      }
    },
    {
      icon: <Dumbbell className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.equipment'),
      href: '/manage/equipment',
      isActive: location.pathname === '/manage/equipment',
      onClick: () => {
        navigate('/manage/equipment');
      }
    },
    {
      icon: <MessageSquare className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.testimonials'),
      href: '/manage/testimonials',
      isActive: location.pathname === '/manage/testimonials',
      onClick: () => {
        navigate('/manage/testimonials');
      }
    },
    {
      icon: <FileText className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.contracts', { defaultValue: 'Hợp đồng / Contracts' }),
      href: '/manage/contracts',
      isActive: location.pathname === '/manage/contracts',
      onClick: () => {
        navigate('/manage/contracts');
      }
    }
  ];

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 self-start flex-shrink-0 transition-all duration-300 ${
        isCollapsed ? 'w-16 overflow-hidden' : 'w-64'
      }`}
      style={isCollapsed ? { maxWidth: '64px', minWidth: '64px' } : {}}
    >
      {/* Header */}
      <SidebarHeader isCollapsed={isCollapsed} />

      {/* Main Navigation */}
      <div className={`flex-1 py-2 overflow-y-auto ${isCollapsed ? 'px-1' : 'px-3'}`}>
        <Sidebar items={mainNavItems} isCollapsed={isCollapsed} title={t('sidebar.main_menu')} />

        <div className="mt-1 space-y-1">
          {/* Services Dropdown */}
          <DropdownSidebarItem
            icon={<Briefcase className="w-5 h-5 stroke-[1.75]" />}
            label={t('sidebar.business_services') || 'Dịch vụ / Services'}
            isCollapsed={isCollapsed}
          >
            <SubMenuItem
              icon={<UserCheck className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.pt_services') || 'PT / Personal Training'}
              isActive={location.pathname === '/manage/pt-services'}
              onClick={() => navigate('/manage/pt-services')}
            />
            <SubMenuItem
              icon={<UsersRound className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.class_services') || 'Lớp học / Class Services'}
              isActive={location.pathname === '/manage/class-services'}
              onClick={() => navigate('/manage/class-services')}
            />
            <SubMenuItem
              icon={<Tag className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.promotions') || 'Khuyến mãi / Promotions'}
              isActive={location.pathname === '/manage/discounts'}
              onClick={() => navigate('/manage/discounts')}
            />
            <SubMenuItem
              icon={<IdCard className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.membership_plans') || 'Gói thành viên / Membership'}
              isActive={location.pathname === '/manage/memberships'}
              onClick={() => navigate('/manage/memberships')}
            />
          </DropdownSidebarItem>

          {/* Schedule Dropdown */}
          <DropdownSidebarItem
            icon={<Calendar className="w-5 h-5 stroke-[1.75]" />}
            label={t('sidebar.schedule') || 'Schedule'}
            isCollapsed={isCollapsed}
          >
            <SubMenuItem
              icon={<Calendar className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.work_schedule') || 'Work Schedule'}
              isActive={location.pathname === '/manage/workshifts/calendar'}
              onClick={() => navigate('/manage/workshifts/calendar')}
            />
            {/* Schedule Template menu item hidden - feature not needed */}
            {/* <SubMenuItem
              icon={<Calendar className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.schedule_templates')}
              isActive={location.pathname === '/manage/schedule-templates'}
              onClick={() => navigate('/manage/schedule-templates')}
            /> */}
            <SubMenuItem
              icon={<CalendarDays className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.time_off') || 'Time Off'}
              isActive={location.pathname.startsWith('/manage/timeoff')}
              onClick={() => navigate('/manage/timeoff')}
            />
          </DropdownSidebarItem>

          {/* Finance Dropdown */}
          <DropdownSidebarItem
            icon={<BarChart3 className="w-5 h-5 stroke-[1.75]" />}
            label={t('sidebar.finance') || 'Finance'}
            isCollapsed={isCollapsed}
          >
            <SubMenuItem
              icon={<DollarSign className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.expenses') || 'Chi phí / Expenses'}
              isActive={location.pathname === '/manage/expenses'}
              onClick={() => navigate('/manage/expenses')}
            />
            <SubMenuItem
              icon={<TrendingUp className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.kpi', 'KPI Management')}
              isActive={location.pathname === '/manage/kpi'}
              onClick={() => navigate('/manage/kpi')}
            />
          </DropdownSidebarItem>
        </div>
      </div>

      {/* Upgrade prompt */}
      <UpgradeCard isCollapsed={isCollapsed} />

      {/* User Profile */}
      <UserProfile
        isCollapsed={isCollapsed}
        user={profile}
        isLoading={isProfileLoading}
        onLogout={logout}
        onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
      />

      {/* Collapse Toggle removed; controlled via header button */}

      {/* Business Verification Modal */}
      <BusinessVerificationModal
        open={isVerificationModalOpen}
        onOpenChange={setIsVerificationModalOpen}
        onSuccess={() => {
          // Refresh profile after successful verification
          if (isAuthenticated) {
            setIsProfileLoading(true);
            userApi.getProfile().then((result) => {
              if (result.success && result.data) {
                setProfile(result.data);
                updateUser(result.data);
              }
              setIsProfileLoading(false);
            });
          }
        }}
      />
    </div>
  );
};
