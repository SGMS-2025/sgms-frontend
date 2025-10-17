import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Dumbbell,
  Calendar,
  Users,
  LayoutDashboard,
  Settings,
  HelpCircle,
  ChevronUp,
  LogOut,
  UserCircle,
  PanelLeft,
  Heart,
  TrendingUp,
  AlertTriangle,
  X
} from 'lucide-react';
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

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  isCollapsed?: boolean;
  badge?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  isActive = false,
  onClick,
  isCollapsed = false,
  badge
}) => {
  return (
    <button
      type="button"
      className={`group relative flex w-full items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${
        isActive ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-500'
      } ${isCollapsed ? 'justify-center px-2' : ''}`}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      title={isCollapsed ? label : undefined}
    >
      <span className="flex-shrink-0 w-5 h-5 relative">
        {icon}
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      {!isCollapsed && <span className="text-sm font-medium truncate">{label}</span>}

      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
          {label}
        </span>
      )}
    </button>
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
      <div className="px-3 py-2 border-t border-gray-200">
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
        <UserCircle className="mr-2 h-4 w-4" />
        <span>{t('sidebar.profile')}</span>
      </DropdownMenuItem>
      <DropdownMenuItem className="cursor-pointer">
        <Settings className="mr-2 h-4 w-4" />
        <span>{t('sidebar.settings')}</span>
      </DropdownMenuItem>
      <DropdownMenuItem className="cursor-pointer">
        <HelpCircle className="mr-2 h-4 w-4" />
        <span>{t('sidebar.help')}</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600 focus:text-red-600">
        <LogOut className="mr-2 h-4 w-4" />
        <span>{t('sidebar.logout')}</span>
      </DropdownMenuItem>
    </>
  );

  if (isCollapsed) {
    return (
      <div className="px-3 py-2 border-t border-gray-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="w-full p-2 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
              title={displayName}
            >
              <Avatar className="h-8 w-8 mx-auto">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-orange-500 text-white text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
            <DropdownMenuSeparator />
            {menuItems}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 border-t border-gray-200">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-orange-500 text-white text-sm">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{roleLabel}</p>
            </div>
            <ChevronUp className="h-4 w-4 text-gray-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="w-56">
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

  const menuItems = [
    {
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: t('sidebar.dashboard'),
      path: '/manage/pt',
      isActive: location.pathname === '/manage/pt'
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: t('pt.sidebar.clients', 'My Clients'),
      path: '/manage/pt/clients',
      isActive: location.pathname.startsWith('/manage/pt/clients')
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: t('pt.sidebar.schedule', 'My Schedule'),
      path: '/manage/pt/calendar',
      isActive: location.pathname === '/manage/pt/calendar'
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: t('pt.sidebar.attendanceHistory', 'Attendance History'),
      path: '/manage/pt/attendance',
      isActive: location.pathname.startsWith('/manage/pt/attendance')
    },
    {
      icon: <Dumbbell className="w-5 h-5" />,
      label: t('pt.sidebar.workoutPlans', 'Workout Plans'),
      path: '/manage/pt/workout-plans',
      isActive: location.pathname.startsWith('/manage/pt/workout-plans')
    },
    {
      icon: <Heart className="w-5 h-5" />,
      label: t('pt.sidebar.nutrition', 'Nutrition Plans'),
      path: '/manage/pt/nutrition',
      isActive: location.pathname.startsWith('/manage/pt/nutrition')
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: t('pt.sidebar.progress', 'Client Progress'),
      path: '/manage/pt/progress',
      isActive: location.pathname.startsWith('/manage/pt/progress')
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: t('pt.sidebar.reports', 'Reports'),
      path: '/manage/pt/reports',
      isActive: location.pathname.startsWith('/manage/pt/reports')
    },
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      label: 'Báo cáo lỗi thiết bị',
      path: '/manage/pt/equipment-issues',
      isActive: location.pathname.startsWith('/manage/pt/equipment-issues')
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    // Close mobile sidebar after navigation
    setMobileOpen(false);
  };

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
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <SidebarHeader isCollapsed={isCollapsed} />

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            isActive={item.isActive}
            isCollapsed={isCollapsed}
            onClick={() => handleNavigation(item.path)}
          />
        ))}
      </nav>

      {/* User Profile */}
      <UserProfile isCollapsed={isCollapsed} user={profile} isLoading={isProfileLoading} onLogout={handleLogout} />
    </div>
  );
};
