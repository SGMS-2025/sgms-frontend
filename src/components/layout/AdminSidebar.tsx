import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldCheck,
  Settings,
  LogOut,
  UserCircle,
  PanelLeft,
  ChevronUp,
  FileText,
  BarChart3,
  Shield
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

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  isCollapsed?: boolean;
  badge?: number;
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
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
      className={`group relative flex items-center py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${
        isActive ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
      } ${isCollapsed ? 'justify-center px-1 w-12' : 'w-full gap-3 px-3'}`}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      title={isCollapsed ? label : undefined}
    >
      <span className="flex-shrink-0 w-5 h-5 relative">
        {icon}
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold">
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
  const { toggle } = useSidebar();
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      {!isCollapsed && (
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/admin')}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-orange-400 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">Admin Panel</h2>
            <p className="text-xs text-gray-500">Quản trị hệ thống</p>
          </div>
        </div>
      )}
      <button
        onClick={toggle}
        className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
        aria-label="Toggle sidebar"
      >
        <PanelLeft className={`w-5 h-5 text-gray-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};

const UserProfile: React.FC<{
  isCollapsed: boolean;
  user: ApiUser | null;
  isLoading: boolean;
  onLogout: () => void;
}> = ({ isCollapsed, user, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getInitials = (name?: string) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
      <div className="p-2 border-t border-gray-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40">
              <Avatar className="w-8 h-8 mx-auto">
                <AvatarImage src={user.avatar?.url} alt={user.fullName || user.username} />
                <AvatarFallback className="bg-gradient-to-br from-orange-600 to-orange-400 text-white text-xs font-semibold">
                  {getInitials(user.fullName || user.username)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right" className="w-56">
            <div className="px-2 py-1.5 text-sm font-semibold text-gray-900">{user.fullName || user.username}</div>
            <div className="px-2 pb-1.5 text-xs text-gray-500">{user.email}</div>
            <div className="px-2 pb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </span>
            </div>
            <DropdownMenuSeparator />
            {menuItems}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-gray-200">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-full p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={user.avatar?.url} alt={user.fullName || user.username} />
              <AvatarFallback className="bg-gradient-to-br from-orange-600 to-orange-400 text-white text-sm font-semibold">
                {getInitials(user.fullName || user.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName || user.username}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56">
          <div className="px-2 py-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              <Shield className="w-3 h-3 mr-1" />
              Administrator
            </span>
          </div>
          <DropdownMenuSeparator />
          {menuItems}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const AdminSidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed } = useSidebar();
  const { user: authUser, isAuthenticated } = useAuthState();
  const { logout, updateUser } = useAuthActions();

  const [user, setUser] = useState<ApiUser | null>(authUser);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [hasInitiallyFetched, setHasInitiallyFetched] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchProfile = async () => {
      if (!isAuthenticated || hasInitiallyFetched) return;

      setIsLoadingProfile(true);
      const result = await userApi.getProfile();
      setIsLoadingProfile(false);

      if (!ignore) {
        if (result.success && result.data) {
          setUser(result.data);
          updateUser(result.data);
          setHasInitiallyFetched(true);
        }
      }
    };

    fetchProfile();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, hasInitiallyFetched, authUser, updateUser]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const mainNavItems: MenuItemProps[] = [
    {
      icon: <LayoutDashboard className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.dashboard', 'Dashboard'),
      isActive: location.pathname === '/admin' || location.pathname === '/admin/dashboard',
      onClick: () => navigate('/admin')
    },
    {
      icon: <Building2 className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.business_verification', 'Xác thực doanh nghiệp'),
      isActive: location.pathname === '/admin/business-verifications',
      onClick: () => navigate('/admin/business-verifications')
      // TODO: Add badge with pending count when API is ready
      // badge: pendingCount
    },
    {
      icon: <Users className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.users', 'Quản lý người dùng'),
      isActive: location.pathname === '/admin/users',
      onClick: () => navigate('/admin/users')
    },
    {
      icon: <ShieldCheck className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.roles_permissions', 'Phân quyền'),
      isActive: location.pathname === '/admin/roles',
      onClick: () => navigate('/admin/roles')
    },
    {
      icon: <BarChart3 className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.reports', 'Báo cáo & Thống kê'),
      isActive: location.pathname === '/admin/reports',
      onClick: () => navigate('/admin/reports')
    },
    {
      icon: <FileText className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.logs', 'Nhật ký hệ thống'),
      isActive: location.pathname === '/admin/logs',
      onClick: () => navigate('/admin/logs')
    }
  ];

  const secondaryNavItems: MenuItemProps[] = [
    {
      icon: <Settings className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.system_settings', 'Cài đặt hệ thống'),
      isActive: location.pathname === '/admin/settings',
      onClick: () => navigate('/admin/settings')
    }
  ];

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 transition-all duration-300 ${
        isCollapsed ? 'w-16 overflow-hidden' : 'w-64'
      }`}
      style={isCollapsed ? { maxWidth: '64px', minWidth: '64px' } : {}}
    >
      {/* Header */}
      <SidebarHeader isCollapsed={isCollapsed} />

      {/* Main Navigation */}
      <div className={`flex-1 py-2 overflow-y-auto ${isCollapsed ? 'px-1' : 'px-3'}`}>
        {!isCollapsed && (
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-3">
            {t('sidebar.main_menu', 'Menu chính')}
          </div>
        )}
        <nav
          className={`space-y-1 ${isCollapsed ? 'overflow-hidden' : ''}`}
          role="navigation"
          aria-label="Main navigation"
        >
          {mainNavItems.map((item) => (
            <SidebarItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              isActive={item.isActive}
              onClick={item.onClick}
              isCollapsed={isCollapsed}
              badge={item.badge}
            />
          ))}
        </nav>

        {/* Secondary Navigation */}
        {!isCollapsed && (
          <div className="mt-6">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-3">
              {t('sidebar.settings', 'Cài đặt')}
            </div>
            <nav className="space-y-1">
              {secondaryNavItems.map((item) => (
                <SidebarItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  isActive={item.isActive}
                  onClick={item.onClick}
                  isCollapsed={isCollapsed}
                />
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* User Profile */}
      <UserProfile isCollapsed={isCollapsed} user={user} isLoading={isLoadingProfile} onLogout={handleLogout} />
    </div>
  );
};
