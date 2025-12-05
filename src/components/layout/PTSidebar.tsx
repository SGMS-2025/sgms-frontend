import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Users,
  LayoutDashboard,
  TrendingUp,
  AlertTriangle,
  CalendarDays,
  UserCheck,
  Bot,
  Clock
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuthActions, useAuthState } from '@/hooks/useAuth';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { Sidebar, type SidebarItem as SidebarItemType } from '@/components/common/Sidebar';
import {
  SidebarHeader,
  UserProfileSection,
  DropdownSidebarItem,
  SubMenuItem,
  useSidebarProfile
} from '@/components/common/SidebarShared';

export const PTSidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed, setMobileOpen } = useSidebar();
  const { user: authUser, isAuthenticated } = useAuthState();
  const { updateUser, logout } = useAuthActions();
  const { currentStaff } = useCurrentUserStaff();

  const { profile, isProfileLoading } = useSidebarProfile(isAuthenticated, authUser ?? null, updateUser);

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    try {
      logout();
      navigate('/login');
    } catch (_error) {
      // Handle error silently
    }
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
    {
      icon: <UserCheck className="w-5 h-5" />,
      label: t('pt.sidebar.registerPackage', 'Register Package'),
      href: '/manage/pt/customers',
      isActive: location.pathname.startsWith('/manage/pt/customers'),
      onClick: () => handleNavigation('/manage/pt/customers')
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: t('pt.sidebar.attendanceHistory', 'Attendance History'),
      href: '/manage/pt/attendance',
      isActive: location.pathname.startsWith('/manage/pt/attendance'),
      onClick: () => handleNavigation('/manage/pt/attendance')
    },
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      label: t('pt.sidebar.equipmentIssues', 'Equipment Issues'),
      href: '/manage/pt/equipment-issues',
      isActive: location.pathname.startsWith('/manage/pt/equipment-issues'),
      onClick: () => handleNavigation('/manage/pt/equipment-issues')
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: t('pt.sidebar.myKPI', 'My KPI'),
      href: '/manage/pt/kpi',
      isActive: location.pathname === '/manage/pt/kpi',
      onClick: () => handleNavigation('/manage/pt/kpi')
    },
    {
      icon: <Bot className="w-5 h-5" />,
      label: t('pt.sidebar.aiChat', 'AI Chat'),
      href: '/manage/pt/chat',
      isActive: location.pathname.startsWith('/manage/pt/chat'),
      onClick: () => handleNavigation('/manage/pt/chat')
    }
  ];

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out h-full ${
        isCollapsed ? 'w-16 items-center' : 'w-64'
      }`}
    >
      <SidebarHeader isCollapsed={isCollapsed} subtitle="Personal Trainer" />

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
              icon={<Clock className="w-5 h-5" />}
              label={t('sidebar.pt_availability_requests')}
              isActive={location.pathname.startsWith('/manage/pt/pt-availability-requests')}
              onClick={() => handleNavigation('/manage/pt/pt-availability-requests')}
            />
          </DropdownSidebarItem>
        </div>
      </div>

      <UserProfileSection
        isCollapsed={isCollapsed}
        user={profile}
        isLoading={isProfileLoading}
        onLogout={handleLogout}
        currentStaff={currentStaff ? { jobTitle: currentStaff.jobTitle } : null}
        settingsPath="/manage/pt/setting"
        defaultRoleLabel={t('sidebar.personalTrainer') || 'Personal Trainer'}
      />
    </div>
  );
};
