import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Dumbbell,
  Calendar,
  User,
  Wrench,
  Building,
  Users,
  LayoutDashboard,
  ChevronUp,
  LogOut,
  UserCircle,
  ShieldCheck as Shield,
  PanelLeft,
  X,
  FileText,
  ClipboardList,
  CalendarDays,
  ChevronDown,
  ArrowRightLeft
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
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
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
        isActive ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-500'
      } ${isCollapsed ? 'justify-center items-center w-12' : 'w-full gap-3 px-3'}`}
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
            <span className="text-sm font-medium truncate flex-1 text-left">{label}</span>
            <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
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

const SidebarHeader: React.FC<{ isCollapsed: boolean; currentStaff?: { jobTitle?: string } | null }> = ({
  isCollapsed,
  currentStaff
}) => {
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
          <p className="text-xs text-gray-500 truncate">{currentStaff?.jobTitle || 'Staff'}</p>
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
          className="hidden lg:flex ml-auto h-8 w-8 rounded-lg items-center justify-center transition-colors bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-600 active:bg-orange-100 active:shadow-inner dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          onClick={toggle}
          aria-pressed={!isCollapsed}
          aria-label="Đóng sidebar"
          title="Đóng sidebar"
        >
          <PanelLeft className="h-4 w-4" />
          <span className="sr-only">Đóng sidebar</span>
        </button>
      )}
    </div>
  );
};

const formatRole = (role?: string) => {
  if (!role) return 'Technician';
  return `${role.charAt(0)}${role.slice(1).toLowerCase()}`;
};

const UserProfile: React.FC<{
  isCollapsed: boolean;
  user: ApiUser | null;
  isLoading: boolean;
  onLogout: () => void;
  currentStaff?: { jobTitle?: string } | null;
}> = ({ isCollapsed, user, isLoading, onLogout, currentStaff }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const displayName = user?.fullName || user?.username || t('sidebar.account') || 'User';
  const roleKey = user?.role ? `roles.${user.role.toLowerCase()}` : '';
  const translatedRole = roleKey ? t(roleKey) : '';

  let roleLabel = t('sidebar.technician') || 'Technician';
  if (user?.role) {
    if (translatedRole && translatedRole !== roleKey) {
      roleLabel = translatedRole;
    } else {
      roleLabel = formatRole(user.role);
    }
  }

  // Override with job title if available
  if (currentStaff?.jobTitle) {
    roleLabel = currentStaff.jobTitle;
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
          navigate('/security');
        }}
        className="cursor-pointer"
      >
        <Shield className="w-4 h-4 mr-3 stroke-[1.75]" />
        {t('sidebar.security')}
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
      <div className={`py-2 border-t border-gray-200 ${isCollapsed ? 'flex justify-center' : 'px-3'}`}>
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
    <div className="px-3 py-2 border-t border-gray-200">
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

export const TechnicianSidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed, setMobileOpen } = useSidebar();
  const { user: authUser, isAuthenticated } = useAuthState();
  const { updateUser, logout } = useAuthActions();
  const { currentStaff } = useCurrentUserStaff();
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
      } catch (_error) {
        // Handle error silently
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

  const mainNavItems: Array<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
    badge?: number;
  }> = [
    {
      icon: <LayoutDashboard className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.dashboard'),
      isActive: location.pathname === '/manage/technician',
      onClick: () => handleNavigation('/manage/technician')
    },
    {
      icon: <Dumbbell className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.equipment'),
      isActive:
        location.pathname === '/manage/technician/equipment' ||
        (location.pathname.startsWith('/manage/technician/equipment/') &&
          !location.pathname.startsWith('/manage/technician/equipment-inventory') &&
          !location.pathname.startsWith('/manage/technician/equipment-issues')),
      onClick: () => handleNavigation('/manage/technician/equipment')
    },
    {
      icon: <ClipboardList className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.equipmentInventory'),
      isActive: location.pathname.startsWith('/manage/technician/equipment-inventory'),
      onClick: () => handleNavigation('/manage/technician/equipment-inventory')
    }
  ];

  // Build additional navigation items
  const roleSpecificItems = [];
  const personalTrainerItems = [];
  const equipmentItems = [];
  const managementItems = [];

  // Add role-specific items
  if (currentStaff?.jobTitle === 'Technician' || currentStaff?.jobTitle === 'Personal Trainer') {
    roleSpecificItems.push(
      {
        icon: <Wrench className="w-5 h-5 stroke-[1.75]" />,
        label: t('sidebar.maintenance'),
        isActive: location.pathname.startsWith('/manage/technician/maintenance'),
        onClick: () => handleNavigation('/manage/technician/maintenance')
      },
      {
        icon: <BarChart3 className="w-5 h-5 stroke-[1.75]" />,
        label: t('sidebar.reports'),
        isActive: location.pathname.startsWith('/manage/technician/reports'),
        onClick: () => handleNavigation('/manage/technician/reports')
      }
    );
  }

  // For Personal Trainer - show schedule
  if (currentStaff?.jobTitle === 'Personal Trainer') {
    personalTrainerItems.push({
      icon: <Calendar className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.schedule'),
      isActive: location.pathname.startsWith('/manage/technician/schedule'),
      onClick: () => handleNavigation('/manage/technician/schedule')
    });
  }

  // Add calendar for all technician roles
  mainNavItems.push({
    icon: <Calendar className="w-5 h-5 stroke-[1.75]" />,
    label: t('technician.sidebar.schedule', 'My Schedule'),
    isActive: location.pathname.startsWith('/manage/technician/calendar'),
    onClick: () => handleNavigation('/manage/technician/calendar')
  });

  mainNavItems.push({
    icon: <Calendar className="w-5 h-5 stroke-[1.75]" />,
    label: t('technician.sidebar.attendanceHistory', 'Attendance History'),
    isActive: location.pathname.startsWith('/manage/technician/attendance'),
    onClick: () => handleNavigation('/manage/technician/attendance')
  });
  // Add equipment issue history for technician
  equipmentItems.push({
    icon: <FileText className="w-5 h-5 stroke-[1.75]" />,
    label: t('technician.sidebar.equipmentIssueHistory', 'Lịch sử báo cáo thiết bị'),
    isActive: location.pathname.startsWith('/manage/technician/equipment-issues'),
    onClick: () => handleNavigation('/manage/technician/equipment-issues')
  });

  // For OWNER, Manager - show management links
  if (authUser?.role === 'OWNER' || currentStaff?.jobTitle === 'Manager') {
    managementItems.push(
      {
        icon: <Building className="w-5 h-5 stroke-[1.75]" />,
        label: t('sidebar.branch'),
        isActive: false,
        onClick: () => handleNavigation('/manage/owner')
      },
      {
        icon: <Users className="w-5 h-5 stroke-[1.75]" />,
        label: t('sidebar.staff'),
        isActive: false,
        onClick: () => handleNavigation('/manage/staff')
      }
    );
  }

  // Add all additional items to main navigation
  mainNavItems.push(...roleSpecificItems, ...personalTrainerItems, ...equipmentItems, ...managementItems);

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out h-full ${
        isCollapsed ? 'w-16 items-center' : 'w-64'
      }`}
    >
      {/* Header */}
      <SidebarHeader isCollapsed={isCollapsed} currentStaff={currentStaff} />

      {/* Main Navigation */}
      <div className={`flex-1 py-2 ${isCollapsed ? 'px-1' : 'px-3'}`}>
        {!isCollapsed && (
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-3">
            {t('sidebar.main_menu')}
          </div>
        )}
        <nav
          className={`space-y-1 ${isCollapsed ? 'flex flex-col items-center' : ''}`}
          role="navigation"
          aria-label="Main"
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

          {/* Schedule Dropdown */}
          <DropdownSidebarItem
            icon={<Calendar className="w-5 h-5 stroke-[1.75]" />}
            label={t('sidebar.schedule', 'Schedule')}
            isCollapsed={isCollapsed}
          >
            <SubMenuItem
              icon={<Calendar className="w-5 h-5 stroke-[1.75]" />}
              label={t('technician.sidebar.schedule', 'My Schedule')}
              isActive={location.pathname.startsWith('/manage/technician/calendar')}
              onClick={() => handleNavigation('/manage/technician/calendar')}
            />
            <SubMenuItem
              icon={<CalendarDays className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.time_off', 'Time Off')}
              isActive={location.pathname.startsWith('/manage/technician/timeoff')}
              onClick={() => handleNavigation('/manage/technician/timeoff')}
            />
            <SubMenuItem
              icon={<ArrowRightLeft className="w-5 h-5 stroke-[1.75]" />}
              label={t('sidebar.reschedule') || 'Reschedule'}
              isActive={location.pathname.startsWith('/reschedule')}
              onClick={() => handleNavigation('/reschedule')}
            />
          </DropdownSidebarItem>
        </nav>
      </div>

      {/* User Profile */}
      <UserProfile
        isCollapsed={isCollapsed}
        user={profile}
        isLoading={isProfileLoading}
        onLogout={logout}
        currentStaff={currentStaff}
      />

      {/* Collapse Toggle removed; controlled via header button */}
    </div>
  );
};
