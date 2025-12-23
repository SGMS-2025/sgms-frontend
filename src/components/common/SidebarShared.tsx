import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, LogOut, PanelLeft, User, UserCircle, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSidebar } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/use-mobile';
import LanguageSwitcher from '@/components/ui/language-switcher';
import logoImage from '@/assets/images/logo2.png';
import type { User as ApiUser } from '@/types/api/User';

// ============================================================================
// Shared Types
// ============================================================================

export interface SubMenuItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  'data-tour'?: string;
}

export interface DropdownSidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isCollapsed?: boolean;
  children: React.ReactNode;
  'data-tour'?: string;
}

export interface SidebarHeaderProps {
  isCollapsed: boolean;
  subtitle?: string;
  showMobileClose?: boolean;
}

export interface UserProfileProps {
  isCollapsed: boolean;
  user: ApiUser | null;
  isLoading: boolean;
  onLogout: () => void;
  currentStaff?: { jobTitle?: string } | null;
  settingsPath: string;
  defaultRoleLabel: string;
  extraMenuItems?: React.ReactNode;
}

// ============================================================================
// Shared Utility Functions
// ============================================================================

export const formatRole = (role?: string, defaultValue = 'User'): string => {
  if (!role) return defaultValue;
  return `${role.charAt(0)}${role.slice(1).toLowerCase()}`;
};

export const translateJobTitle = (jobTitle: string, t: (key: string) => string): string => {
  const jobTitleMap: Record<string, string> = {
    Manager: 'staff.manager',
    Admin: 'staff.admin',
    Owner: 'staff.owner',
    'Personal Trainer': 'staff_modal.role_personal_trainer',
    Technician: 'staff.technician'
  };

  const translationKey = jobTitleMap[jobTitle];
  if (translationKey) {
    const translated = t(translationKey);
    return translated !== translationKey ? translated : jobTitle;
  }
  return jobTitle;
};

// ============================================================================
// Shared Components
// ============================================================================

export const SubMenuItem: React.FC<SubMenuItemProps> = ({
  icon,
  label,
  isActive = false,
  onClick,
  'data-tour': dataTour
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 w-full gap-3 px-3 ${
        isActive ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-500'
      }`}
      aria-current={isActive ? 'page' : undefined}
      data-tour={dataTour}
    >
      <span className="flex-shrink-0 w-5 h-5 relative">{icon}</span>
      <span className="text-sm font-medium truncate">{label}</span>
    </button>
  );
};

export const DropdownSidebarItem: React.FC<DropdownSidebarItemProps> = ({
  icon,
  label,
  isCollapsed = false,
  children,
  'data-tour': dataTour
}) => {
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
              data-tour={dataTour}
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
        data-tour={dataTour}
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

      {!isCollapsed && isOpen && <div className="ml-4 mt-1 space-y-1">{children}</div>}
    </div>
  );
};

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isCollapsed,
  subtitle = 'Staff',
  showMobileClose = true
}) => {
  const { toggle, setCollapsed, setMobileOpen } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <div className="flex items-center gap-3 px-3 py-4 border-b border-gray-200 dark:border-gray-800">
      {/* Logo - Always visible */}
      <button
        type="button"
        className="flex-shrink-0 w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
        onClick={() => {
          if (isCollapsed && !isMobile) setCollapsed(false);
        }}
        title={isCollapsed && !isMobile ? 'Mở sidebar' : undefined}
        aria-label={isCollapsed && !isMobile ? 'Mở sidebar' : undefined}
      >
        <img src={logoImage} alt="GYM SMART Logo" className="w-6 h-6 object-contain" />
      </button>

      {/* Title and Subtitle - Show on mobile when open, or desktop when not collapsed */}
      {(isMobile || !isCollapsed) && (
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">GYM SMART</h1>
          {/* Hide subtitle on mobile to save space */}
          {!isMobile && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>
      )}

      {/* Mobile Close Button */}
      {showMobileClose && isMobile && (
        <button
          type="button"
          className="flex-shrink-0 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
          onClick={() => setMobileOpen(false)}
          title="Đóng menu"
          aria-label="Đóng menu"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Desktop Toggle Button - Only show when not collapsed */}
      {!isCollapsed && !isMobile && (
        <button
          type="button"
          className="ml-auto h-8 w-8 rounded-lg flex items-center justify-center transition-colors bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-600 active:bg-orange-100 active:shadow-inner dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
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

export const UserProfileSection: React.FC<UserProfileProps> = ({
  isCollapsed,
  user,
  isLoading,
  onLogout,
  currentStaff,
  settingsPath,
  defaultRoleLabel,
  extraMenuItems
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  const displayName = user?.fullName || user?.username || t('sidebar.account') || 'User';

  let roleLabel: string;
  if (currentStaff?.jobTitle) {
    roleLabel = translateJobTitle(currentStaff.jobTitle, t);
  } else {
    const roleKey = user?.role ? `roles.${user.role.toLowerCase()}` : '';
    const translatedRole = roleKey ? t(roleKey) : '';

    roleLabel = defaultRoleLabel;
    if (user?.role) {
      if (translatedRole && translatedRole !== roleKey) {
        roleLabel = translatedRole;
      } else {
        roleLabel = formatRole(user.role, defaultRoleLabel);
      }
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
      {/* Only show Profile menu item if no extraMenuItems provided or user is not CUSTOMER */}
      {/* For CUSTOMER with extraMenuItems, we only show Account Settings */}
      {(!extraMenuItems || user?.role !== 'CUSTOMER') && (
        <DropdownMenuItem onClick={() => navigate(settingsPath)} className="cursor-pointer">
          <UserCircle className="w-4 h-4 mr-3 stroke-[1.75]" />
          {t('sidebar.profile')}
        </DropdownMenuItem>
      )}

      {extraMenuItems}

      <DropdownMenuSeparator />

      <LanguageSwitcher variant="sidebar" onLanguageChange={() => setOpen(false)} />

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
        <DropdownMenu open={open} onOpenChange={setOpen}>
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
          <DropdownMenuContent
            side={isMobile ? 'top' : 'right'}
            align={isMobile ? 'center' : 'end'}
            sideOffset={isMobile ? 12 : 8}
            className={`w-56 ${isMobile ? 'z-[150]' : 'z-50'}`}
          >
            {menuItems}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className={`py-2 border-t border-gray-200 ${isCollapsed ? 'px-1 flex justify-center' : 'px-3'}`}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
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

        <DropdownMenuContent
          side={isMobile ? 'top' : 'right'}
          align={isMobile ? 'center' : 'end'}
          sideOffset={isMobile ? 12 : 8}
          className={`w-56 ${isMobile ? 'z-[150]' : 'z-50'} ${isMobile ? '' : 'ml-2'}`}
        >
          {menuItems}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// ============================================================================
// Custom Hook for Sidebar Profile Logic
// ============================================================================

export const useSidebarProfile = (
  isAuthenticated: boolean,
  authUser: ApiUser | null,
  updateUser: (user: ApiUser) => void
) => {
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
        const { userApi } = await import('@/services/api/userApi');
        const response = await userApi.getProfile();
        if (!ignore && response.success && response.data) {
          setProfile(response.data);
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

  return { profile, isProfileLoading };
};
