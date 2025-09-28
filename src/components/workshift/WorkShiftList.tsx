import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, Plus, Calendar } from 'lucide-react';
import WorkShiftCard from './WorkShiftCard';
import type {
  WorkShiftListProps,
  WorkShiftFilters as WorkShiftFiltersType,
  WorkShiftStatus,
  DayOfWeek,
  WorkShiftFiltersComponentProps
} from '@/types/api/WorkShift';

const WorkShiftList: React.FC<WorkShiftListProps> = ({ workShifts, onEdit, onDelete, onView }) => {
  const { t } = useTranslation();

  if (!workShifts || workShifts.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('workshift.no_shifts_found')}</h3>
        <p className="text-gray-500 mb-4">{t('workshift.no_shifts_description')}</p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('workshift.create_first_shift')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Work Shifts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workShifts.map((workShift) => (
          <WorkShiftCard
            key={workShift._id}
            workShift={workShift}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />
        ))}
      </div>
    </div>
  );
};

// WorkShiftFilters Component
export const WorkShiftFilters: React.FC<WorkShiftFiltersComponentProps> = ({
  filters,
  onFiltersChange,
  branchList = []
}) => {
  const { t } = useTranslation();

  const statusOptions: { value: WorkShiftStatus; label: string }[] = [
    { value: 'SCHEDULED', label: t('workshift.status.scheduled') },
    { value: 'IN_PROGRESS', label: t('workshift.status.in_progress') },
    { value: 'COMPLETED', label: t('workshift.status.completed') },
    { value: 'CANCELLED', label: t('workshift.status.cancelled') }
  ];

  const dayOptions: { value: DayOfWeek; label: string }[] = [
    { value: 'MONDAY', label: t('common.days.monday') },
    { value: 'TUESDAY', label: t('common.days.tuesday') },
    { value: 'WEDNESDAY', label: t('common.days.wednesday') },
    { value: 'THURSDAY', label: t('common.days.thursday') },
    { value: 'FRIDAY', label: t('common.days.friday') },
    { value: 'SATURDAY', label: t('common.days.saturday') },
    { value: 'SUNDAY', label: t('common.days.sunday') }
  ];

  const handleFilterChange = (key: keyof WorkShiftFiltersType, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value || undefined
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          {t('workshift.filters')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t('common.search')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('workshift.search_placeholder')}
                className="pl-10"
                value={filters.staff_id || ''}
                onChange={(e) => handleFilterChange('staff_id', e.target.value)}
              />
            </div>
          </div>

          {/* Branch Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t('workshift.branch')}</label>
            <Select
              onValueChange={(value) => handleFilterChange('branch_id', value)}
              value={filters.branch_id || 'all'}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('workshift.all_branches')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('workshift.all_branches')}</SelectItem>
                {branchList.map((branch) => (
                  <SelectItem key={branch._id} value={branch._id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t('workshift.status')}</label>
            <Select onValueChange={(value) => handleFilterChange('status', value)} value={filters.status || 'all'}>
              <SelectTrigger>
                <SelectValue placeholder={t('workshift.all_statuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('workshift.all_statuses')}</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day of Week Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t('workshift.day_of_week')}</label>
            <Select
              onValueChange={(value) => handleFilterChange('day_of_the_week', value)}
              value={filters.day_of_the_week || 'all'}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('workshift.all_days')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('workshift.all_days')}</SelectItem>
                {dayOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t('workshift.start_date')}</label>
            <Input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t('workshift.end_date')}</label>
            <Input
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
            />
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={clearFilters}>
              {t('common.clear_filters')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkShiftList;
