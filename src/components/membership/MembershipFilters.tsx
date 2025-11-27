import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ArrowUpDown, ArrowUpIcon, ArrowDownIcon, Filter, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import type { SortState } from '@/types/utils/sort';

type ViewMode = 'all' | 'base' | 'custom';
type StatusFilter = 'all' | 'active' | 'inactive';
type SortField = 'name' | 'price' | 'duration' | 'createdAt' | 'updatedAt' | 'status';

interface MembershipFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortState: SortState<SortField>;
  onSortFieldChange: (field: string) => void;
  onSortOrderChange: (order: string) => void;
}

export const MembershipFilters: React.FC<MembershipFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  sortState,
  onSortFieldChange,
  onSortOrderChange
}) => {
  const { t } = useTranslation();

  // Sort options configuration - Simplified to 3 fields only
  const sortOptions = [
    { field: 'name', label: t('membershipManager.sort.name', 'Name') },
    { field: 'price', label: t('membershipManager.sort.price', 'Price') },
    { field: 'updatedAt', label: t('membershipManager.sort.updatedAt', 'Updated') }
  ];

  // Get current sort label with direction indicator
  const getCurrentSortLabel = () => {
    const option = sortOptions.find((opt) => opt.field === sortState.field);
    if (!option) return t('membershipManager.sort.default', 'Sort By');

    const directionLabel =
      sortState.order === 'asc'
        ? t('membershipManager.sort.ascending', '↑')
        : t('membershipManager.sort.descending', '↓');

    return `${option.label} ${directionLabel}`;
  };

  const currentSortLabel = getCurrentSortLabel();

  // Handle sort click - toggle order if same field, otherwise set to default order
  const handleSortClick = (field: string) => {
    if (sortState.field === field) {
      // Same field: toggle order
      const newOrder = sortState.order === 'asc' ? 'desc' : 'asc';
      onSortOrderChange(newOrder);
    } else {
      // Different field: set to default order
      onSortFieldChange(field);
      // Default order: name/updatedAt = asc, price = asc
      const defaultOrder = field === 'updatedAt' ? 'desc' : 'asc';
      onSortOrderChange(defaultOrder);
    }
  };

  // Status filter options
  const statusOptions = [
    { value: 'all' as const, label: t('membershipManager.filters.status.all', 'All Status'), count: 0 },
    { value: 'active' as const, label: t('membershipManager.filters.status.active', 'Active'), count: 0 },
    { value: 'inactive' as const, label: t('membershipManager.filters.status.inactive', 'Inactive'), count: 0 }
  ];

  const viewModeOptions: { value: ViewMode; label: string }[] = [
    { value: 'all', label: t('membershipManager.filters.viewAll') },
    { value: 'base', label: t('membershipManager.filters.viewBase') },
    { value: 'custom', label: t('membershipManager.filters.viewCustom') }
  ];

  // Check if any filter is active (not default)
  const hasActiveFilters = statusFilter !== 'all' || searchQuery.trim() !== '';

  // Handle clear all filters
  const handleClearFilters = () => {
    onSearchChange('');
    onStatusFilterChange('all');
  };

  return (
    <div className="space-y-4">
      {/* Modern Search & Control Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search Input */}
        <div className="flex-1 w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('membershipManager.filters.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10 w-full h-10 rounded-xl border-gray-300 focus:border-orange-400 focus:ring-orange-400"
              data-tour="membership-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sort & Filter Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Modern Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4 rounded-xl border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-colors"
                data-tour="membership-sort-button"
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{currentSortLabel}</span>
                <span className="sm:hidden">{t('membershipManager.filters.sortLabel', 'Sort')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('membershipManager.filters.sortBy', 'Sort By')}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortOptions.map((option) => {
                const isActive = sortState.field === option.field;
                const currentOrder = isActive ? sortState.order : 'asc';
                const OrderIcon = currentOrder === 'asc' ? ArrowUpIcon : ArrowDownIcon;

                return (
                  <DropdownMenuItem
                    key={option.field}
                    onClick={() => handleSortClick(option.field)}
                    className={`cursor-pointer ${isActive ? 'bg-orange-50 text-orange-600' : ''}`}
                  >
                    <OrderIcon className="h-4 w-4 mr-2" />
                    <span className="flex-1">{option.label}</span>
                    {isActive && <Check className="h-4 w-4 text-orange-500" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Modern Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-10 px-4 rounded-xl border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-colors ${
                  statusFilter !== 'all' ? 'border-orange-500 bg-orange-50 text-orange-600' : ''
                }`}
                data-tour="membership-status-filter"
              >
                <Filter className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">
                  {statusFilter === 'all'
                    ? t('membershipManager.filters.filterLabel', 'Filter')
                    : t(`membershipManager.filters.status.${statusFilter}`)}
                </span>
                <span className="sm:hidden">{t('membershipManager.filters.filterLabel', 'Filter')}</span>
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs bg-orange-500 text-white">
                    1
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('membershipManager.filters.statusLabel', 'Status')}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {statusOptions.map((option) => {
                const isActive = statusFilter === option.value;
                return (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => onStatusFilterChange(option.value)}
                    className={`cursor-pointer ${isActive ? 'bg-orange-50 text-orange-600' : ''}`}
                  >
                    <span className="flex-1">{option.label}</span>
                    {isActive && <Check className="h-4 w-4 text-orange-500" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-10 px-3 rounded-xl text-gray-600 hover:text-orange-600 hover:bg-orange-50"
            >
              <X className="h-4 w-4" />
              <span className="hidden md:inline ml-1">{t('membershipManager.filters.clearAll', 'Clear')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* View Mode Toggle & Active Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">{t('membershipManager.filters.viewLabel', 'View')}:</span>
          <div className="flex rounded-xl bg-gray-100 p-1 gap-1" data-tour="membership-view-mode-tabs">
            {viewModeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onViewModeChange(option.value)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                  viewMode === option.value
                    ? 'bg-white text-orange-600 shadow-sm ring-1 ring-orange-100'
                    : 'text-gray-600 hover:text-orange-500 hover:bg-white/50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <>
            <div className="hidden sm:block h-6 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {t('membershipManager.filters.activeFilters', 'Active filters')}:
              </span>
              {searchQuery && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200">
                  {t('membershipManager.filters.searching', 'Search')}: "{searchQuery.slice(0, 20)}
                  {searchQuery.length > 20 ? '...' : ''}"
                  <button onClick={() => onSearchChange('')} className="ml-1 hover:text-orange-900">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200">
                  {t(`membershipManager.filters.status.${statusFilter}`)}
                  <button onClick={() => onStatusFilterChange('all')} className="ml-1 hover:text-orange-900">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
