import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Dumbbell,
  Calendar,
  Users,
  LayoutDashboard,
  Settings,
  ChevronUp,
  LogOut,
  UserCircle,
  PanelLeft,
  Heart,
  TrendingUp,
  AlertTriangle,
  X,
  CalendarDays,
  ChevronDown,
  ArrowRightLeft,
  ShieldCheck as Shield,
  User
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
// DropdownSidebarItem component will be defined inline
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuthActions, useAuthState } from '@/hooks/useAuth';
import { userApi } from '@/services/api/userApi';
import type { User as ApiUser } from '@/types/api/User';
import { Sidebar, type SidebarItem as SidebarItemType } from '@/components/common/Sidebar';

// TODO: DropdownSidebarItem và SubMenuItem có thể được extract ra common component sau này
// nếu cần dùng ở nhiều sidebar khác

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
      <div className="w-12 flex justify-center items-center">
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
          isCollapsed ? 'justify-center items-center w-12' : 'w-full gap-3 px-3'
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
  const { toggle, setCollapsed, setMobileOpen } = useSidebar();

  return (
    <div className="flex items-center gap-3 px-3 py-4 border-b border-gray-200 dark:border-gray-800">
      <button
        type="button"
        className="flex-shrink-0 w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
        onClick={() => {
          if (isCollapsed) setCollapsed(false);
        }}
        title={isCollapsed ? 'Mở sidebar' : undefined}
        aria-label={isCollapsed ? 'Mở sidebar' : undefined}
      >
        <img src="/src/assets/images/logo2.png" alt="GYM SMART Logo" className="w-6 h-6 object-contain" />
      </button>

      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">GYM SMART</h1>
          <p className="text-xs text-gray-500 truncate">Personal Trainer</p>
        </div>
      )}

      {/* Mobile Close Button */}
      <button
        type="button"
        className="lg:hidden flex-shrink-0 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
        onClick={() => setMobileOpen(false)}
        title="Đóng menu"
        aria-label="Đóng menu"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Desktop Toggle Button */}
      {!isCollapsed && (
        <button
          type="button"
          className="hidden lg:block flex-shrink-0 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
          onClick={toggle}
          title="Thu gọn sidebar"
          aria-label="Thu gọn sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

const formatRole = (role: string): string => {
  if (!role) return '';
  return `${role.charAt(0)}${role.slice(1).toLowerCase()}`;
};

const UserProfile: React.FC<{
  isCollapsed: boolean;
  user: ApiUser | null;
  isLoading: boolean;
  onLogout: () => void;
}> = ({ isCollapsed, user, isLoading, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const displayName = user?.fullName || user?.username || t('sidebar.account') || 'User';
  const roleKey = user?.role ? `roles.${user.role.toLowerCase()}` : '';
  const translatedRole = roleKey ? t(roleKey) : '';

  let roleLabel = t('sidebar.personalTrainer') || 'Personal Trainer';
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
      <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
        <UserCircle className="w-4 h-4 mr-3 stroke-[1.75]" />
        {t('sidebar.profile')}
      </DropdownMenuItem>

      <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
        <Settings className="w-4 h-4 mr-3 stroke-[1.75]" />
        {t('sidebar.account_settings')}
      </DropdownMenuItem>

      <DropdownMenuItem onClick={() => navigate('/security')} className="cursor-pointer">
        <Shield className="w-4 h-4 mr-3 stroke-[1.75]" />
        {t('sidebar.security')}
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <LanguageSwitcher variant="sidebar" />

      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
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

export const PTSidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed, setMobileOpen } = useSidebar();
  const { user: authUser, isAuthenticated } = useAuthState();
  const { updateUser, logout } = useAuthActions();
  const [profile, setProfile] = React.useState<ApiUser | null>(authUser ?? null);
  const [isProfileLoading, setIsProfileLoading] = React.useState(false);
  const [hasInitiallyFetched, setHasInitiallyFetched] = React.useState(false);

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

  const handleNavigation = (path: string) => {
    navigate(path);
    // Close mobile sidebar after navigation
    setMobileOpen(false);
  };

  const menuItems: SidebarItemType[] = [
    {
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: t('sidebar.dashboard'),
      href: '/manage/pt',
      isActive: location.pathname === '/manage/pt',
      onClick: () => handleNavigation('/manage/pt')
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: t('pt.sidebar.clients', 'My Clients'),
      href: '/manage/pt/clients',
      isActive: location.pathname.startsWith('/manage/pt/clients'),
      onClick: () => handleNavigation('/manage/pt/clients')
    },
    // Schedule and Time Off will be handled by dropdown
    {
      icon: <Calendar className="w-5 h-5" />,
      label: t('pt.sidebar.attendanceHistory', 'Attendance History'),
      href: '/manage/pt/attendance',
      isActive: location.pathname.startsWith('/manage/pt/attendance'),
      onClick: () => handleNavigation('/manage/pt/attendance')
    },
    {
      icon: <Dumbbell className="w-5 h-5" />,
      label: t('pt.sidebar.workoutPlans', 'Workout Plans'),
      href: '/manage/pt/workout-plans',
      isActive: location.pathname.startsWith('/manage/pt/workout-plans'),
      onClick: () => handleNavigation('/manage/pt/workout-plans')
    },
    {
      icon: <Heart className="w-5 h-5" />,
      label: t('pt.sidebar.nutrition', 'Nutrition Plans'),
      href: '/manage/pt/nutrition',
      isActive: location.pathname.startsWith('/manage/pt/nutrition'),
      onClick: () => handleNavigation('/manage/pt/nutrition')
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: t('pt.sidebar.progress', 'Client Progress'),
      href: '/manage/pt/progress',
      isActive: location.pathname.startsWith('/manage/pt/progress'),
      onClick: () => handleNavigation('/manage/pt/progress')
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: t('pt.sidebar.reports', 'Reports'),
      href: '/manage/pt/reports',
      isActive: location.pathname.startsWith('/manage/pt/reports'),
      onClick: () => handleNavigation('/manage/pt/reports')
    },
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      label: 'Báo cáo lỗi thiết bị',
      href: '/manage/pt/equipment-issues',
      isActive: location.pathname.startsWith('/manage/pt/equipment-issues'),
      onClick: () => handleNavigation('/manage/pt/equipment-issues')
    }
  ];

  const handleLogout = () => {
    try {
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out h-full ${
        isCollapsed ? 'w-16 items-center' : 'w-64'
      }`}
    >
      <SidebarHeader isCollapsed={isCollapsed} />

      {/* Navigation Menu */}
      <div className={`flex-1 py-4 ${isCollapsed ? 'px-1' : 'px-3'}`}>
        <Sidebar items={menuItems} isCollapsed={isCollapsed} />

        {/* Schedule Dropdown */}
        <div className="mt-1">
          <DropdownSidebarItem
            icon={<Calendar className="w-5 h-5" />}
            label={t('sidebar.schedule', 'Schedule')}
            isCollapsed={isCollapsed}
          >
            <SubMenuItem
              icon={<Calendar className="w-5 h-5" />}
              label={t('pt.sidebar.schedule', 'My Schedule')}
              isActive={location.pathname === '/manage/pt/calendar'}
              onClick={() => handleNavigation('/manage/pt/calendar')}
            />
            <SubMenuItem
              icon={<CalendarDays className="w-5 h-5" />}
              label={t('sidebar.time_off', 'Time Off')}
              isActive={location.pathname.startsWith('/manage/pt/timeoff')}
              onClick={() => handleNavigation('/manage/pt/timeoff')}
            />
            <SubMenuItem
              icon={<ArrowRightLeft className="w-5 h-5" />}
              label={t('sidebar.reschedule') || 'Reschedule'}
              isActive={location.pathname.startsWith('/reschedule')}
              onClick={() => handleNavigation('/reschedule')}
            />
          </DropdownSidebarItem>
        </div>
      </div>

      {/* User Profile */}
      <UserProfile isCollapsed={isCollapsed} user={profile} isLoading={isProfileLoading} onLogout={handleLogout} />
    </div>
  );
};
