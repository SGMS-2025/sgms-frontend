import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Search, Bell } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { useSocketNotifications } from '@/hooks/useSocket';
import { Badge } from '@/components/ui/badge';

interface CustomerHeaderProps {
  title?: string;
}

const formatSegment = (segment: string) => segment.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({ title }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { unreadCount } = useSocketNotifications();

  const computedTitle = React.useMemo(() => {
    if (title) return title;

    const segments = location.pathname.split('/').filter(Boolean);
    let lastSegment = segments.at(-1) ?? 'dashboard';

    // Nếu lastSegment là ObjectId (24 ký tự hex), dùng segment trước đó
    if (lastSegment && /^[a-f\d]{24}$/i.test(lastSegment)) {
      lastSegment = segments.at(-2) ?? 'dashboard';
    }

    const translationMap: Record<string, string> = {
      customer: t('dashboard.overview'),
      dashboard: t('dashboard.overview'),
      profile: t('sidebar.profile'),
      membership: t('sidebar.membership'),
      schedule: t('sidebar.schedule'),
      payments: t('customer.sidebar.payments', 'Payments'),
      progress: t('sidebar.progress'),
      contracts: t('sidebar.contracts'),
      security: t('sidebar.security')
    };

    return translationMap[lastSegment] ?? formatSegment(lastSegment);
  }, [location.pathname, t, title]);

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
              placeholder={t('dashboard.search_placeholder')}
              className="h-10 rounded-full border border-gray-200 bg-white pl-10 text-sm shadow-sm focus:border-orange-200 focus:ring-orange-200"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Right side - Notifications */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
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
            <DropdownMenuContent align="end" className="w-96 p-0">
              <NotificationDropdown showBadge={false} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
