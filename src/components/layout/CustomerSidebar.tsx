import React from 'react';
import { useTranslation } from 'react-i18next';
import { IdCard, Calendar, TrendingUp, Settings, FileText, BookOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuthActions, useAuthState } from '@/hooks/useAuth';
import { Sidebar, type SidebarItem } from '@/components/common/Sidebar';
import { SidebarHeader, UserProfileSection, useSidebarProfile } from '@/components/common/SidebarShared';

export const CustomerSidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed, setMobileOpen } = useSidebar();
  const { user: authUser, isAuthenticated } = useAuthState();
  const { updateUser, logout } = useAuthActions();

  // Helper function to handle navigation and close mobile sidebar
  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false); // Close mobile sidebar after navigation
  };

  const { profile, isProfileLoading } = useSidebarProfile(isAuthenticated, authUser ?? null, updateUser);

  const mainNavItems: SidebarItem[] = [
    {
      icon: <TrendingUp className="w-5 h-5 stroke-[1.75]" />,
      label: t('customer.sidebar.progress', 'Progress'),
      href: '/customer/progress',
      isActive: location.pathname.startsWith('/customer/progress'),
      onClick: () => handleNavigation('/customer/progress')
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
      icon: <BookOpen className="w-5 h-5 stroke-[1.75]" />,
      label: t('customer.sidebar.my_classes', 'My Classes'),
      href: '/customer/my-classes',
      isActive: location.pathname.startsWith('/customer/my-classes'),
      onClick: () => handleNavigation('/customer/my-classes')
    },
    {
      icon: <FileText className="w-5 h-5 stroke-[1.75]" />,
      label: t('customer.sidebar.contracts', 'Hợp đồng'),
      href: '/customer/contracts',
      isActive: location.pathname.startsWith('/customer/contracts'),
      onClick: () => handleNavigation('/customer/contracts')
    }
  ];

  const customerExtraMenuItems = (
    <>
      <DropdownMenuItem onClick={() => handleNavigation('/customer/profile')} className="cursor-pointer">
        <Settings className="w-4 h-4 mr-3 stroke-[1.75]" />
        {t('sidebar.account_settings')}
      </DropdownMenuItem>
    </>
  );

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-30 transition-all duration-300 ${
        isCollapsed ? 'w-16 overflow-hidden' : 'w-64'
      }`}
      style={isCollapsed ? { maxWidth: '64px', minWidth: '64px' } : {}}
    >
      {/* Header */}
      <SidebarHeader isCollapsed={isCollapsed} subtitle="Customer" showMobileClose={true} />

      {/* Main Navigation */}
      <div className={`flex-1 py-2 overflow-y-auto ${isCollapsed ? 'px-1' : 'px-3'}`}>
        <Sidebar items={mainNavItems} isCollapsed={isCollapsed} title={t('sidebar.main_menu')} />
      </div>

      {/* User Profile */}
      <UserProfileSection
        isCollapsed={isCollapsed}
        user={profile}
        isLoading={isProfileLoading}
        onLogout={logout}
        settingsPath="/customer/profile"
        defaultRoleLabel={t('sidebar.customer') || 'Customer'}
        extraMenuItems={customerExtraMenuItems}
      />
    </div>
  );
};
