/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useClassList } from '@/hooks/useClassList';
import { useClassesByTrainer } from '@/hooks/useClassesByTrainer';
import { ClassInfoCard } from './ClassInfoCard';
import { ClassQuickViewModal } from './ClassQuickViewModal';
import type { ClassCalendarTabProps } from '@/types/class/ClassCalendarTab';

// Helper function to convert MongoDB Decimal to number
const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (value?.$numberDecimal) return parseFloat(value.$numberDecimal);
  return 0;
};

// Helper function to convert time string to minutes
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

/**
 * Example:
 * - Shift: 05:00 - 10:00
 * - Class 1: 08:00 - 10:00 ✅ (overlaps 08:00-10:00)
 * - Class 2: 09:00 - 11:00 ✅ (overlaps 09:00-10:00)
 * - Class 3: 04:00 - 05:00 ❌ (no overlap)
 */

export const ClassCalendarTab: React.FC<ClassCalendarTabProps> = ({ branchId, date, timeSlot, staffId }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const classesByTrainerResult = useClassesByTrainer(staffId || null, { enabled: !!staffId });

  const classListResult = useClassList({
    branchId,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search
  });

  const classes = staffId ? classesByTrainerResult.classes : classListResult.classes;
  const loading = staffId ? classesByTrainerResult.loading : classListResult.loading;
  const error = staffId ? classesByTrainerResult.error?.message : classListResult.error;
  const refetch = staffId ? classesByTrainerResult.refetch : classListResult.refetch;

  // Filter classes by schedule pattern using TIME OVERLAP detection
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  let filteredClasses = classes;

  if (staffId && search) {
    filteredClasses = filteredClasses.filter((cls) => cls.name.toLowerCase().includes(search.toLowerCase()));
  }

  if (staffId && statusFilter !== 'ALL') {
    filteredClasses = filteredClasses.filter((cls) => cls.status === statusFilter);
  }

  const classesInSlot = filteredClasses.filter((cls) => {
    // 1. Check day of week matches
    if (!cls.schedulePattern?.daysOfWeek?.includes(dayName as any)) {
      return false;
    }

    // 2. Check time overlap (NOT exact match)
    // This allows showing all classes that occur during the shift period
    const classStartMin = timeToMinutes(cls.schedulePattern.startTime);
    const classEndMin = timeToMinutes(cls.schedulePattern.endTime);
    const slotStartMin = timeToMinutes(timeSlot.startTime);
    const slotEndMin = timeToMinutes(timeSlot.endTime);

    // Two time ranges overlap if:
    // - Class starts before slot ends AND
    // - Class ends after slot starts
    const hasTimeOverlap = classStartMin < slotEndMin && classEndMin > slotStartMin;

    return hasTimeOverlap;
  });

  // Total capacity stats
  const totalCapacity = classesInSlot.reduce((sum, cls) => sum + toNumber(cls.capacity), 0);
  const totalEnrolled = classesInSlot.reduce((sum, cls) => sum + toNumber(cls.activeEnrollment), 0);

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold">{t('class.calendar.header')}</h3>
          <p className="text-sm text-gray-500">
            {t('class.calendar.time_slot', { startTime: timeSlot.startTime, endTime: timeSlot.endTime })}
            {classesInSlot.length > 0 && ` • ${t('class.calendar.class_count', { count: classesInSlot.length })}`}
          </p>
        </div>

        {/* Controls: Search, Filter, View Toggle */}
        <div className="flex gap-2 flex-wrap">
          {/* Search */}
          <Input
            placeholder={t('class.calendar.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] h-9"
          />

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as 'ACTIVE' | 'INACTIVE' | 'ALL')}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">{t('class.calendar.status_active')}</SelectItem>
              <SelectItem value="INACTIVE">{t('class.calendar.status_inactive')}</SelectItem>
              <SelectItem value="ALL">{t('class.calendar.status_all')}</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              onClick={() => setViewMode('card')}
              className="h-7 w-7 p-0"
              title={t('class.calendar.view_card')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              onClick={() => setViewMode('table')}
              className="h-7 w-7 p-0"
              title={t('class.calendar.view_table')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
              {t('class.calendar.error_try_again')}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && classesInSlot.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>{t('class.calendar.empty_state')}</p>
          </div>
        )}

        {/* Card View */}
        {!loading && !error && classesInSlot.length > 0 && viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-fr">
            {classesInSlot.map((cls) => (
              <div key={cls._id} onClick={() => setSelectedClassId(cls._id)} className="h-full">
                <ClassInfoCard classData={cls} />
              </div>
            ))}
          </div>
        )}

        {/* Table View */}
        {!loading && !error && classesInSlot.length > 0 && viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-gray-600">
                  <th className="text-left py-2 px-3">{t('class.calendar.table_header_name')}</th>
                  <th className="text-left py-2 px-3">{t('class.calendar.table_header_trainers')}</th>
                  <th className="text-center py-2 px-3">{t('class.calendar.table_header_capacity')}</th>
                  <th className="text-center py-2 px-3">{t('class.calendar.table_header_status')}</th>
                </tr>
              </thead>
              <tbody>
                {classesInSlot.map((cls) => (
                  <tr
                    key={cls._id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedClassId(cls._id)}
                  >
                    <td className="py-3 px-3 font-medium">{cls.name}</td>
                    <td className="py-3 px-3 text-gray-600">
                      {cls.trainerIds
                        .map((trainer: any) =>
                          typeof trainer === 'object' && trainer.userId ? trainer.userId.fullName : 'Unknown'
                        )
                        .slice(0, 2)
                        .join(', ')}
                      {cls.trainerIds.length > 2 && ` +${cls.trainerIds.length - 2}`}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-sm font-medium">
                        {toNumber(cls.activeEnrollment)}/{toNumber(cls.capacity)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          cls.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {cls.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {!loading && classesInSlot.length > 0 && (
        <div className="border-t pt-3 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>{t('class.calendar.total_enrolled')}</span>
            <span className="font-medium">
              {totalEnrolled}/{totalCapacity}
            </span>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      {selectedClassId && (
        <ClassQuickViewModal
          classId={selectedClassId}
          isOpen={!!selectedClassId}
          onClose={() => setSelectedClassId(null)}
          onRefresh={refetch}
        />
      )}
    </div>
  );
};
