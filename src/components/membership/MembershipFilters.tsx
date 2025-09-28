import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type ViewMode = 'all' | 'base' | 'custom';
type StatusFilter = 'all' | 'active' | 'inactive';

interface MembershipFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const MembershipFilters: React.FC<MembershipFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  onRefresh,
  isLoading = false
}) => {
  const { t } = useTranslation();

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: t('membershipManager.filters.statusAll') },
    { value: 'active', label: t('membershipManager.filters.statusActive') },
    { value: 'inactive', label: t('membershipManager.filters.statusInactive') }
  ];

  const viewModeOptions: { value: ViewMode; label: string }[] = [
    { value: 'all', label: t('membershipManager.filters.viewAll') },
    { value: 'base', label: t('membershipManager.filters.viewBase') },
    { value: 'custom', label: t('membershipManager.filters.viewCustom') }
  ];

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('membershipManager.filters.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className="rounded-full">
            <Filter className="h-4 w-4 mr-2" />
            {t('membershipManager.actions.refresh')}
          </Button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            {t('membershipManager.filters.statusLabel')}:
          </span>
          <div className="flex rounded-full bg-gray-100 p-1 gap-1">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onStatusFilterChange(option.value)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                  statusFilter === option.value
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-orange-500'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            {t('membershipManager.filters.viewLabel')}:
          </span>
          <div className="flex rounded-full bg-gray-100 p-1 gap-1">
            {viewModeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onViewModeChange(option.value)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                  viewMode === option.value
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-orange-500'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
