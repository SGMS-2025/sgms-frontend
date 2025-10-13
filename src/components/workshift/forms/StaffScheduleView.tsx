import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { StaffScheduleViewProps } from '@/types/forms/StaffScheduleFormTypes';

const StaffScheduleView: React.FC<StaffScheduleViewProps> = ({
  staffId,
  templateStaffInfo,
  workShifts,
  loadingWorkShifts,
  workShiftError,
  onRefetch
}) => {
  const { t } = useTranslation();

  const renderContent = () => {
    // No staff selected
    if (!templateStaffInfo && !staffId) {
      return (
        <div className="text-center py-6">
          <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">{t('workshift.select_staff_first')}</p>
        </div>
      );
    }

    // Loading state
    if (loadingWorkShifts) {
      return (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
          <span className="ml-2 text-sm text-gray-500">{t('common.loading')}</span>
        </div>
      );
    }

    // Error state
    if (workShiftError) {
      return (
        <div className="text-center py-6">
          <p className="text-sm text-red-600 mb-2">{t('workshift.fetch_error')}</p>
          <Button variant="outline" size="sm" onClick={() => onRefetch()}>
            {t('common.retry')}
          </Button>
        </div>
      );
    }

    // No shifts found
    if (workShifts.length === 0) {
      return (
        <div className="text-center py-6">
          <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700 mb-1">{t('workshift.no_existing_shifts')}</p>
          <p className="text-xs text-gray-500">{t('workshift.no_conflicts_expected')}</p>
        </div>
      );
    }

    // Show existing shifts with conflict detection
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">
            {t('workshift.found_shifts', { count: workShifts.length })}
          </span>
          <Button variant="outline" size="sm" onClick={() => onRefetch()} className="h-6 text-xs">
            <CalendarIcon className="h-3 w-3 mr-1" />
            {t('common.refresh')}
          </Button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {workShifts.slice(0, 5).map((shift) => (
            <div key={shift._id} className="flex items-center gap-3 p-2 bg-gray-50 rounded border text-xs">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{new Date(shift.createdAt).toLocaleDateString()}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">
                    {shift.startTime} - {shift.endTime}
                  </span>
                </div>
                <div className="text-gray-500 mt-1">{shift.branchId.name}</div>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${(() => {
                    switch (shift.status) {
                      case 'SCHEDULED':
                        return 'bg-blue-500';
                      case 'IN_PROGRESS':
                        return 'bg-green-500';
                      case 'COMPLETED':
                        return 'bg-gray-500';
                      default:
                        return 'bg-red-500';
                    }
                  })()}`}
                />
                <span className="text-gray-500 capitalize">{shift.status.toLowerCase().replace('_', ' ')}</span>
              </div>
            </div>
          ))}

          {workShifts.length > 5 && (
            <div className="text-center py-2">
              <span className="text-xs text-gray-500">
                {t('workshift.and_more_shifts', { count: workShifts.length - 5 })}
              </span>
            </div>
          )}
        </div>

        {/* Conflict Warning */}
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-800">{t('workshift.conflict_warning')}</span>
          </div>
          <p className="text-xs text-yellow-700 mt-1">{t('workshift.conflict_warning_description')}</p>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          {t('workshift.staff_current_schedule')}
        </CardTitle>
        <p className="text-xs text-gray-500">
          {templateStaffInfo
            ? `${t('workshift.current_schedule_for')} ${templateStaffInfo.name}`
            : t('workshift.select_staff_to_view_schedule')}
        </p>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
};

export default StaffScheduleView;
