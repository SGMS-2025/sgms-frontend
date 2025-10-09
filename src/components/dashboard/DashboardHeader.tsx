import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Mail, Settings, Bell } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { useSocketNotifications } from '@/hooks/useSocket';
import { Badge } from '@/components/ui/badge';
import { useBranch } from '@/contexts/BranchContext';
import { BranchSelectorButton } from '@/components/dashboard/BranchSelectorButton';
import type { BranchDisplay } from '@/types/api/Branch';

interface DashboardHeaderProps {
  title?: string;
}

const formatSegment = (segment: string) => segment.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useSocketNotifications();
  const { currentBranch, branches, setCurrentBranch, switchBranch } = useBranch();

  const computedTitle = React.useMemo(() => {
    if (title) return title;

    const segments = location.pathname.split('/').filter(Boolean);
    const lastSegment = segments.at(-1) ?? 'overview';

    const translationMap: Record<string, string> = {
      owner: t('dashboard.overview'),
      dashboard: t('dashboard.overview'),
      staff: t('sidebar.staff'),
      branch: t('sidebar.branch'),
      branches: t('sidebar.branch')
    };

    return translationMap[lastSegment] ?? formatSegment(lastSegment);
  }, [location.pathname, t, title]);

  // Branch switching handlers
  const handleBranchSelect = (branch: BranchDisplay) => {
    setCurrentBranch(branch);
  };

  const handleAddBranch = () => {
    navigate('/manage/add-branch');
  };

  const handleViewBranch = async (branch: BranchDisplay) => {
    await switchBranch(branch._id);
    navigate(`/manage/branch/${branch._id}`);
  };

  return (
    <header>
      <div className="flex items-center justify-between">
        {/* Left side - Sidebar indicator + Title */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Sidebar indicator bar */}
          <div className="w-1 h-6 sm:h-8 bg-gray-800 rounded-full"></div>

          {/* Page title */}
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{computedTitle}</h1>
        </div>

        {/* Center - Search bar (hidden on mobile) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
          <div className="relative w-full">
            <Input
              placeholder="Type to search ..."
              className="h-10 rounded-full border border-gray-200 bg-white pl-10 text-sm shadow-sm focus:border-orange-200 focus:ring-orange-200"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Right side - Icons and User Profile */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Messages icon (hidden on mobile) */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex h-10 w-10 rounded-full p-0 text-gray-600 hover:text-orange-500 hover:bg-orange-50"
          >
            <Mail className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 rounded-full p-0 text-gray-600 hover:text-orange-500 hover:bg-orange-50 relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <NotificationDropdown showBadge={false} />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Branch Selector - Mobile */}
          <div className="sm:hidden">
            <BranchSelectorButton
              currentBranch={currentBranch}
              branches={branches}
              onBranchSelect={handleBranchSelect}
              onAddBranch={handleAddBranch}
              onViewBranch={handleViewBranch}
              collapsed
            />
          </div>

          {/* Separator (hidden on mobile) */}
          <div className="hidden sm:block h-6 w-px bg-gray-200"></div>

          {/* Branch Selector */}
          <div className="hidden sm:block w-64 flex-shrink-0">
            <BranchSelectorButton
              currentBranch={currentBranch}
              branches={branches}
              onBranchSelect={handleBranchSelect}
              onAddBranch={handleAddBranch}
              onViewBranch={handleViewBranch}
            />
          </div>

          {/* Settings icon (hidden on mobile) */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex h-10 w-10 rounded-full p-0 text-gray-600 hover:text-orange-500 hover:bg-orange-50"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
