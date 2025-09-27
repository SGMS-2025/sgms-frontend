import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Users,
  Dumbbell,
  CalendarRange as Calendar,
  Tag,
  User,
  LayoutDashboard,
  MessageSquare,
  Settings,
  HelpCircle,
  ChevronUp,
  LogOut,
  UserCircle,
  ShieldCheck as Shield,
  PanelLeft
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
import { BranchSelectorButton } from '@/components/dashboard/BranchSelectorButton';
import { useBranch } from '@/contexts/BranchContext';
import type { BranchDisplay } from '@/types/api/Branch';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuthActions, useAuthState } from '@/hooks/useAuth';
import { userApi } from '@/services/api/userApi';
import type { User as ApiUser } from '@/types/api/User';
// no extra popovers here; BranchSelectorButton handles its own popover

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
  const { toggle, setCollapsed } = useSidebar();

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

const QuickActions: React.FC<{
  isCollapsed: boolean;
  currentBranch: BranchDisplay | null;
  branches: BranchDisplay[];
  onBranchSelect: (branch: BranchDisplay) => void;
  onAddBranch: () => void;
  onViewBranch: (branch: BranchDisplay) => void | Promise<void>;
}> = ({ isCollapsed, currentBranch, branches, onBranchSelect, onAddBranch, onViewBranch }) => {
  if (isCollapsed) {
    return (
      <div className="px-2 py-3 flex justify-center">
        <BranchSelectorButton
          currentBranch={currentBranch}
          branches={branches}
          onBranchSelect={onBranchSelect}
          onAddBranch={onAddBranch}
          onViewBranch={onViewBranch}
          collapsed
        />
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <BranchSelectorButton
            currentBranch={currentBranch}
            branches={branches}
            onBranchSelect={onBranchSelect}
            onAddBranch={onAddBranch}
            onViewBranch={onViewBranch}
          />
        </div>
        {/* Refresh icon is moved inside BranchSelectorButton component as a second popover trigger */}
      </div>
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
}> = ({ isCollapsed, user, isLoading, onLogout }) => {
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
      <div className="px-3 py-2 border-t border-gray-200 flex justify-center">
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

export const OwnerSidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed } = useSidebar();
  const { currentBranch, branches, setCurrentBranch, switchBranch } = useBranch();
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
  }, [isAuthenticated, hasInitiallyFetched]);

  const handleBranchSelect = (branch: BranchDisplay) => {
    setCurrentBranch(branch);
  };

  const handleViewBranchDetail = async (branch: BranchDisplay) => {
    await switchBranch(branch._id);
    navigate(`/manage/branch/${branch._id}`);
  };

  const handleAddBranch = () => {
    navigate('/manage/add-branch');
  };

  const mainNavItems = [
    {
      icon: <LayoutDashboard className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.dashboard'),
      isActive: location.pathname === '/manage/owner',
      onClick: () => {
        navigate('/manage/owner');
      }
    },
    {
      icon: <Users className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.users'),
      isActive: location.pathname === '/manage/staff',
      onClick: () => {
        navigate('/manage/staff');
      }
    },
    {
      icon: <Dumbbell className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.equipment'),
      isActive: location.pathname.startsWith('/manage/equipment'),
      onClick: () => {
        navigate('/manage/equipment');
      }
    },
    {
      icon: <Tag className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.services_promotions'),
      isActive: location.pathname === '/manage/discounts',
      onClick: () => {
        navigate('/manage/discounts');
      }
    },
    {
      icon: <BarChart3 className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.finance'),
      onClick: () => console.log('Finance clicked')
    },
    {
      icon: <Calendar className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.work_schedule'),
      onClick: () => console.log('Work Schedule clicked')
    },
    {
      icon: <MessageSquare className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.feedback'),
      badge: 3, // Mock notification badge
      onClick: () => console.log('Feedback clicked')
    }
  ];

  const secondaryNavItems = [
    {
      icon: <Settings className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.settings'),
      onClick: () => console.log('Settings clicked')
    },
    {
      icon: <HelpCircle className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.help'),
      onClick: () => console.log('Help clicked')
    }
  ];

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <SidebarHeader isCollapsed={isCollapsed} />

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-2 overflow-y-auto">
        {!isCollapsed && (
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-3">
            {t('sidebar.main_menu')}
          </div>
        )}
        <nav className="space-y-1" role="navigation" aria-label="Main">
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
        <div className="mt-8">
          {!isCollapsed && (
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-3">
              {t('sidebar.support')}
            </div>
          )}
          <nav className="space-y-1" role="navigation" aria-label="Support">
            {secondaryNavItems.map((item) => (
              <SidebarItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                onClick={item.onClick}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* Branch switch + notifications (above profile) */}
      <div className="border-t border-gray-200">
        <QuickActions
          isCollapsed={isCollapsed}
          currentBranch={currentBranch}
          branches={branches}
          onBranchSelect={handleBranchSelect}
          onAddBranch={handleAddBranch}
          onViewBranch={handleViewBranchDetail}
        />
      </div>

      {/* User Profile */}
      <UserProfile isCollapsed={isCollapsed} user={profile} isLoading={isProfileLoading} onLogout={logout} />

      {/* Collapse Toggle removed; controlled via header button */}
    </div>
  );
};
