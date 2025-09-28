import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar as CalendarIcon, Download, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface DashboardHeaderProps {
  title?: string;
}

const formatSegment = (segment: string) => segment.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title }) => {
  const { t } = useTranslation();
  const location = useLocation();

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

  return (
    <header className="border-b border-gray-200 pb-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl font-semibold leading-tight text-gray-900">{computedTitle}</h1>

        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-start sm:gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Input
              placeholder={t('common.search') || 'Search'}
              className="h-9 rounded-full border border-gray-200 bg-white pl-10 text-sm shadow-sm focus:border-orange-200 focus:ring-orange-200"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="flex items-center justify-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center gap-2 rounded-full border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:border-orange-300 hover:text-orange-500"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('dashboard.this_month') || 'This month'}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem>{t('dashboard.today') || 'Today'}</DropdownMenuItem>
                <DropdownMenuItem>{t('dashboard.yesterday') || 'Yesterday'}</DropdownMenuItem>
                <DropdownMenuItem>{t('dashboard.this_week') || 'This week'}</DropdownMenuItem>
                <DropdownMenuItem>{t('dashboard.this_month') || 'This month'}</DropdownMenuItem>
                <DropdownMenuItem>{t('dashboard.last_month') || 'Last month'}</DropdownMenuItem>
                <DropdownMenuItem>{t('dashboard.last_3_months') || 'Last 3 months'}</DropdownMenuItem>
                <DropdownMenuItem>{t('dashboard.year_to_date') || 'Year to date'}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-orange-500"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.export') || 'Export'}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
