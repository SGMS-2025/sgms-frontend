import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  UserCircle,
  IdCard,
  Calendar,
  TrendingUp,
  Settings,
  ChevronUp,
  LogOut,
  User,
  PanelLeft,
  ShieldCheck as Shield
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
import { Sidebar, type SidebarItem } from '@/components/common/Sidebar';
import logoImage from '@/assets/images/logo2.png';

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
        <img src={logoImage} alt={t('sidebar.gym_smart_logo')} className="w-6 h-6 object-contain" />
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

const formatRole = (role: string) => {
  return `${role.charAt(0)}${role.slice(1).toLowerCase()}`;
};

const UserProfile: React.FC<{
  isCollapsed: boolean;
  user: ApiUser | null;
  isLoading: boolean;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}> = ({ isCollapsed, user, isLoading, onLogout, onNavigate }) => {
  const { t } = useTranslation();

  const displayName = user?.fullName || user?.username || t('sidebar.account') || 'User';
  const roleKey = user?.role ? `roles.${user.role.toLowerCase()}` : '';
  const translatedRole = roleKey ? t(roleKey) : '';

  let roleLabel = t('sidebar.customer') || 'Customer';
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
      <DropdownMenuItem onClick={() => onNavigate('/customer')} className="cursor-pointer">
        <UserCircle className="w-4 h-4 mr-3 stroke-[1.75]" />
        {t('customer.sidebar.profile')}
      </DropdownMenuItem>

      <DropdownMenuItem onClick={() => onNavigate('/settings')} className="cursor-pointer">
        <Settings className="w-4 h-4 mr-3 stroke-[1.75]" />
        {t('sidebar.account_settings')}
      </DropdownMenuItem>

      <DropdownMenuItem onClick={() => onNavigate('/security')} className="cursor-pointer">
        <Shield className="w-4 h-4 mr-3 stroke-[1.75]" />
        {t('customer.sidebar.security')}
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

export const CustomerSidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed, setMobileOpen } = useSidebar();
  const { user: authUser, isAuthenticated } = useAuthState();
  const { updateUser, logout } = useAuthActions();
  const [profile, setProfile] = React.useState<ApiUser | null>(authUser ?? null);
  const [isProfileLoading, setIsProfileLoading] = React.useState(false);
  const [hasInitiallyFetched, setHasInitiallyFetched] = React.useState(false);

  // Helper function to handle navigation and close mobile sidebar
  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false); // Close mobile sidebar after navigation
  };

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

  const mainNavItems: SidebarItem[] = [
    {
      icon: <UserCircle className="w-5 h-5 stroke-[1.75]" />,
      label: t('customer.sidebar.profile', 'Profile'),
      href: '/customer/profile',
      isActive: location.pathname.startsWith('/customer/profile'),
      onClick: () => handleNavigation('/customer/profile')
    },
    {
      icon: <IdCard className="w-5 h-5 stroke-[1.75]" />,
      label: t('customer.sidebar.membership', 'Membership'),
      href: '/customer/membership',
      isActive: location.pathname.startsWith('/customer/membership'),
      onClick: () => handleNavigation('/customer/membership')
    },
    {
      icon: <Calendar className="w-5 h-5 stroke-[1.75]" />,
      label: t('customer.sidebar.schedule', 'Schedule'),
      href: '/customer/schedule',
      isActive: location.pathname.startsWith('/customer/schedule'),
      onClick: () => handleNavigation('/customer/schedule')
    },
    {
      icon: <TrendingUp className="w-5 h-5 stroke-[1.75]" />,
      label: t('customer.sidebar.progress', 'Progress'),
      href: '/customer/progress',
      isActive: location.pathname.startsWith('/customer/progress'),
      onClick: () => handleNavigation('/customer/progress')
    },
    {
      icon: <Shield className="w-5 h-5 stroke-[1.75]" />,
      label: t('customer.sidebar.security', 'Security'),
      href: '/customer/security',
      isActive: location.pathname.startsWith('/customer/security'),
      onClick: () => handleNavigation('/customer/security')
    }
  ];

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-30 transition-all duration-300 ${
        isCollapsed ? 'w-16 overflow-hidden' : 'w-64'
      }`}
      style={isCollapsed ? { maxWidth: '64px', minWidth: '64px' } : {}}
    >
      {/* Header */}
      <SidebarHeader isCollapsed={isCollapsed} />

      {/* Main Navigation */}
      <div className={`flex-1 py-2 overflow-y-auto ${isCollapsed ? 'px-1' : 'px-3'}`}>
        <Sidebar items={mainNavItems} isCollapsed={isCollapsed} title={t('sidebar.main_menu')} />
      </div>

      {/* User Profile */}
      <UserProfile
        isCollapsed={isCollapsed}
        user={profile}
        isLoading={isProfileLoading}
        onLogout={logout}
        onNavigate={handleNavigation}
      />

      {/* Collapse Toggle removed; controlled via header button */}
    </div>
  );
};
