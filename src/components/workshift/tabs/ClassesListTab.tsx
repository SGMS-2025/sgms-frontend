import React from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { Calendar, MapPin, Users, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Class, DayName } from '@/types/Class';

interface ClassesListTabProps {
  classes: Class[];
  loading: boolean;
  error?: Error | null;
  staffId?: string;
  filterStartTime?: string; // Filter by shift start time (HH:MM)
  filterEndTime?: string; // Filter by shift end time (HH:MM)
  filterDayOfWeek?: string; // Filter by day of week (MONDAY, TUESDAY, etc.)
  onClassClick?: (classId: string) => void; // Callback when class is clicked
}

/**
 * Component to display list of classes assigned to a Personal Trainer
 * Shown as a tab in WorkShift Detail Modal
 *
 * Can optionally filter by shift time to show only classes matching that time slot
 *
 * @param classes - Array of class objects
 * @param loading - Loading state
 * @param error - Error object if fetching failed
 * @param staffId - The trainer's staff ID
 * @param filterStartTime - Optional: filter by shift start time
 * @param filterEndTime - Optional: filter by shift end time
 * @param filterDayOfWeek - Optional: filter by day of week
 */
export const ClassesListTab: React.FC<ClassesListTabProps> = ({
  classes,
  loading,
  error,
  staffId: _staffId,
  filterStartTime,
  filterEndTime,
  filterDayOfWeek,
  onClassClick
}) => {
  const { t } = useTranslation();

  // Filter classes by shift time if provided
  const filteredClasses = React.useMemo(() => {
    if (!filterStartTime || !filterEndTime || !filterDayOfWeek) {
      return classes;
    }

    return classes.filter((cls) => {
      // Check if class has schedule pattern
      if (!cls.schedulePattern) return false;

      // Check if day matches
      if (!cls.schedulePattern.daysOfWeek?.includes(filterDayOfWeek as DayName)) {
        return false;
      }

      // Check if time overlaps
      const classStart = cls.schedulePattern.startTime;
      const classEnd = cls.schedulePattern.endTime;

      // Simple overlap check: class starts before shift ends AND class ends after shift starts
      const startMatch = classStart <= filterEndTime && classEnd >= filterStartTime;

      return startMatch;
    });
  }, [classes, filterStartTime, filterEndTime, filterDayOfWeek]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">{t('classesListTab.loading')}</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
        <div className="text-red-600">
          <p className="font-medium">{t('classesListTab.error')}</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  // Empty state - no classes at all
  if (classes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <div className="text-center text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">{t('classesListTab.noClassesAssigned')}</p>
          <p className="text-sm mt-1">{t('classesListTab.noClassesDescription')}</p>
        </div>
      </div>
    );
  }

  // Empty state - no classes in this time slot
  if (filteredClasses.length === 0 && filterStartTime) {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <div className="text-center text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">{t('classesListTab.noClassesInTimeSlot')}</p>
          <p className="text-sm mt-1">
            {t('classesListTab.timeSlot', {
              startTime: filterStartTime,
              endTime: filterEndTime,
              dayOfWeek: filterDayOfWeek
            })}
          </p>
        </div>
      </div>
    );
  }

  // Classes list
  return (
    <div className="overflow-y-auto max-h-[600px]">
      <div className="space-y-3 p-4">
        {filteredClasses.map((classItem) => (
          <div key={classItem._id} onClick={() => onClassClick?.(classItem._id)} className="cursor-pointer">
            <ClassCard classItem={classItem} t={t} />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Individual class card component
 */
interface ClassCardProps {
  classItem: Class;
  t: (key: string) => string;
}

const ClassCard: React.FC<ClassCardProps> = ({ classItem, t }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getCapacityStatus = () => {
    const total = classItem.activeEnrollment + (classItem.inactiveEnrollment || 0);
    const isFull = total >= classItem.capacity;
    return {
      isFull,
      text: `${total}/${classItem.capacity}`
    };
  };

  const capacityStatus = getCapacityStatus();

  // Format time range
  const timeRange = classItem.schedulePattern
    ? `${classItem.schedulePattern.startTime} - ${classItem.schedulePattern.endTime}`
    : 'N/A';

  // Format days of week
  const daysOfWeek = classItem.schedulePattern?.daysOfWeek?.join(', ') || 'N/A';

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white hover:bg-gray-50">
      {/* Header: Name and Status */}
      <div className="flex justify-between items-start mb-3 gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-gray-900 truncate">{classItem.name}</h3>
          {classItem.description && <p className="text-xs text-gray-600 line-clamp-2 mt-1">{classItem.description}</p>}
        </div>
        <Badge variant="outline" className={`flex-shrink-0 ${getStatusColor(classItem.status)}`}>
          {t(`classesListTab.classCard.status.${classItem.status}`) || classItem.status}
        </Badge>
      </div>

      {/* Service Package and Branch */}
      <div className="space-y-2 mb-3 text-sm">
        {classItem.servicePackageId && typeof classItem.servicePackageId === 'object' && (
          <div>
            <span className="text-gray-600 font-medium">{t('classesListTab.classCard.package')}: </span>
            <span className="text-gray-900">{classItem.servicePackageId.name}</span>
          </div>
        )}
        {classItem.branchId && typeof classItem.branchId === 'object' && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-900">{classItem.branchId.branchName}</span>
          </div>
        )}
      </div>

      {/* Schedule Information */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Time */}
        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-600 font-medium">{t('classesListTab.classCard.time')}</p>
            <p className="text-sm font-semibold text-gray-900">{timeRange}</p>
          </div>
        </div>

        {/* Days */}
        <div>
          <p className="text-xs text-gray-600 font-medium">{t('classesListTab.classCard.days')}</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{daysOfWeek}</p>
        </div>

        {/* Members */}
        <div className="flex items-start gap-2">
          <Users className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-600 font-medium">{t('classesListTab.classCard.members')}</p>
            <p className={`text-sm font-semibold ${capacityStatus.isFull ? 'text-red-600' : 'text-gray-900'}`}>
              {capacityStatus.text}
            </p>
          </div>
        </div>

        {/* Type */}
        <div>
          <p className="text-xs text-gray-600 font-medium">{t('classesListTab.classCard.type')}</p>
          <p className="text-sm font-semibold text-gray-900 capitalize">
            {typeof classItem.servicePackageId === 'object'
              ? classItem.servicePackageId.type?.toLowerCase() || 'N/A'
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Class Period */}
      {(classItem.startDate || classItem.endDate) && (
        <div className="text-xs text-gray-600 space-y-1">
          {classItem.startDate && (
            <p>
              <span className="font-medium">{t('classesListTab.classCard.start')}: </span>
              {new Date(classItem.startDate).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
            </p>
          )}
          {classItem.endDate && (
            <p>
              <span className="font-medium">{t('classesListTab.classCard.end')}: </span>
              {new Date(classItem.endDate).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
            </p>
          )}
        </div>
      )}

      {/* Capacity Warning */}
      {capacityStatus.isFull && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          ⚠️ {t('classesListTab.classCard.fullCapacity')}
        </div>
      )}
    </div>
  );
};

export default ClassesListTab;
