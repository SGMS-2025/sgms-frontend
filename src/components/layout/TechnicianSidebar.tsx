import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dumbbell,
  Calendar,
  Building,
  Users,
  LayoutDashboard,
  FileText,
  ClipboardList,
  CalendarDays
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

export const TechnicianSidebar: React.FC = () => {
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

  const mainNavItems: SidebarItemType[] = [
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
    },
    {
      icon: <Calendar className="w-5 h-5 stroke-[1.75]" />,
      label: t('technician.sidebar.attendanceHistory', 'Attendance History'),
      isActive: location.pathname.startsWith('/manage/technician/attendance'),
      onClick: () => handleNavigation('/manage/technician/attendance')
    },
    {
      icon: <FileText className="w-5 h-5 stroke-[1.75]" />,
      label: t('technician.sidebar.equipmentIssueHistory', 'Lịch sử báo cáo thiết bị'),
      isActive: location.pathname.startsWith('/manage/technician/equipment-issues'),
      onClick: () => handleNavigation('/manage/technician/equipment-issues')
    }
  ];

  // Add role-specific items (Maintenance and Reports removed)

  // For Personal Trainer - show schedule
  if (currentStaff?.jobTitle === 'Personal Trainer') {
    mainNavItems.push({
      icon: <Calendar className="w-5 h-5 stroke-[1.75]" />,
      label: t('sidebar.schedule'),
      isActive: location.pathname.startsWith('/manage/technician/schedule'),
      onClick: () => handleNavigation('/manage/technician/schedule')
    });
  }

  // For OWNER, Manager - show management links
  if (authUser?.role === 'OWNER' || currentStaff?.jobTitle === 'Manager') {
    mainNavItems.push(
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

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out h-full ${
        isCollapsed ? 'w-16 items-center' : 'w-64'
      } shadow-lg lg:shadow-none`}
    >
      <SidebarHeader isCollapsed={isCollapsed} subtitle={currentStaff?.jobTitle || 'Technician'} />

      <div className={`flex-1 py-2 ${isCollapsed ? 'px-1' : 'px-3'}`}>
        {!isCollapsed && (
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-3">
            {t('sidebar.main_menu')}
          </div>
        )}

        <Sidebar items={mainNavItems} isCollapsed={isCollapsed} />

        {/* Schedule Dropdown */}
        <div className="mt-1">
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
          </DropdownSidebarItem>
        </div>
      </div>

      <UserProfileSection
        isCollapsed={isCollapsed}
        user={profile}
        isLoading={isProfileLoading}
        onLogout={logout}
        currentStaff={currentStaff}
        settingsPath="/manage/technician/setting"
        defaultRoleLabel={t('sidebar.technician') || 'Technician'}
      />
    </div>
  );
};
