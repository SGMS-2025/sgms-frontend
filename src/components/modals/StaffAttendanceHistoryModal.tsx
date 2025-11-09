import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, Calendar, Clock3, MapPin, User, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStaffAttendanceHistory } from '@/hooks/useStaffAttendance';
import {
  formatTimeOnly,
  formatToAmPm,
  formatCheckOutTime,
  getCheckInStatus,
  getCheckOutStatus,
  getAttendanceStatusStyles,
  getTimeStatusInfo
} from '@/utils/staffAttendanceUtils';
import type { GetStaffAttendanceHistoryParams } from '@/types/api/StaffAttendance';

interface StaffAttendanceHistoryModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly staffId: string | null;
  readonly staffName?: string;
  readonly jobTitle?: string;
}

export default function StaffAttendanceHistoryModal({
  isOpen,
  onClose,
  staffId,
  staffName,
  jobTitle
}: StaffAttendanceHistoryModalProps) {
  const { t } = useTranslation();

  const initialFilters = useMemo(
    () => (isOpen ? { page: 1, limit: 10, sortBy: 'checkInTime' as const, sortOrder: 'desc' as const } : undefined),
    [isOpen]
  );

  const { items, pagination, loading, error, filters, setFilters, goToPage, refetch } = useStaffAttendanceHistory(
    isOpen ? staffId : null,
    initialFilters
  );

  const translateJobTitle = (jobTitle: string) => {
    const jobTitleMap: Record<string, string> = {
      Manager: 'staff_modal.role_manager',
      Admin: 'staff_modal.role_admin',
      Owner: 'staff_modal.role_owner',
      'Personal Trainer': 'staff_modal.role_personal_trainer',
      Technician: 'staff_modal.role_technician'
    };

    const key = jobTitleMap[jobTitle];
    if (key) {
      const translated = t(key);
      return translated === key ? jobTitle : translated;
    }
    return jobTitle;
  };

  const staffDisplayName = jobTitle ? `${translateJobTitle(jobTitle)}: ${staffName}` : staffName;

  // Helper to render time status badge
  const renderTimeStatus = (status: 'early' | 'on-time' | 'late' | 'overtime' | null) => {
    const statusInfo = getTimeStatusInfo(status);
    if (!statusInfo) return null;
    const statusText = t(statusInfo.translationKey);
    return <span className={`ml-1 text-sm font-semibold ${statusInfo.colorClass}`}>({statusText})</span>;
  };

  // Group items by date (normalize to same day for comparison)
  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof items> = {};
    for (const item of items) {
      // Normalize date to start of day for consistent grouping
      let dateKey = 'unknown';
      if (item.date) {
        // Extract date part directly from ISO string (YYYY-MM-DD)
        // Backend stores date normalized to start of day UTC
        const dateStr = item.date;
        const dateRegex = /^(\d{4}-\d{2}-\d{2})/;
        const dateMatch = dateRegex.exec(dateStr);
        if (dateMatch) {
          dateKey = dateMatch[1]; // YYYY-MM-DD format
        } else {
          // Fallback: use Date object
          const date = new Date(item.date);
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          dateKey = `${year}-${month}-${day}`;
        }
      } else if (item.dateVN) {
        // If dateVN exists, parse it to get consistent key
        // dateVN format: "dd/mm/yyyy" or similar
        const dateVNRegex = /(\d{2})\/(\d{2})\/(\d{4})/;
        const dateVNMatch = dateVNRegex.exec(item.dateVN);
        if (dateVNMatch) {
          const [, day, month, year] = dateVNMatch;
          dateKey = `${year}-${month}-${day}`;
        } else {
          dateKey = item.dateVN;
        }
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    }
    return groups;
  }, [items]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#f05a29]" />
            <p className="text-gray-600">{t('attendance.loading_history') || 'Loading attendance history...'}</p>
          </div>
        </div>
      );
    }

    if (error) {
      return <div className="text-center text-red-600 py-10">{error}</div>;
    }

    if (items.length === 0) {
      return (
        <div className="text-center text-gray-500 py-10">
          {t('attendance.no_records') || 'No attendance records found.'}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {Object.entries(groupedByDate).map(([dateKey, dateItems]) => (
          <div key={dateKey} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Date Header */}
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-sm text-gray-700">
                  {dateItems[0]?.dateVN ||
                    (dateItems[0]?.date ? new Date(dateItems[0].date).toLocaleDateString('vi-VN') : dateKey)}
                </span>
                {dateItems[0]?.dayOfTheWeek && (
                  <span className="text-xs text-gray-500">
                    ({t(`common.days.${dateItems[0].dayOfTheWeek.toLowerCase()}`)})
                  </span>
                )}
                <span className="text-xs text-gray-400 ml-auto">
                  {dateItems.length} {dateItems.length === 1 ? 'shift' : 'shifts'}
                </span>
              </div>
            </div>

            {/* Attendance Items for this date */}
            <div className="divide-y divide-gray-100">
              {dateItems.map((item) => (
                <div key={item._id} className="p-4">
                  <div className="space-y-3">
                    {/* First row: Status and Shift time */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${getAttendanceStatusStyles(item.status)}`}
                      >
                        {t(`attendance.status.values.${item.status}`)}
                      </span>
                      {item.shiftConfig && (
                        <span className="text-xs text-gray-600">
                          {formatToAmPm(item.shiftConfig.startTime)} - {formatToAmPm(item.shiftConfig.endTime)}
                        </span>
                      )}
                    </div>

                    {/* Second row: Check-in, Check-out, and Location */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                      {/* Real check-in/check-out time */}
                      <div className="flex items-center gap-1">
                        <Clock3 className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">
                          Check-in:{' '}
                          <span className="inline-block min-w-[160px]">
                            {item.checkInTime ? (
                              <>
                                {formatTimeOnly(item.checkInTime)}
                                {renderTimeStatus(
                                  getCheckInStatus(item.checkInTime, item.shiftConfig?.startTime, item.date)
                                )}
                              </>
                            ) : (
                              <span className="invisible">11:00 PM (Đúng giờ)</span>
                            )}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock3 className="w-4 h-4 text-red-500" />
                        <span className="font-medium">
                          Check-out:{' '}
                          <span className="inline-block min-w-[160px]">
                            {item.checkOutTime ? (
                              <>
                                {formatCheckOutTime(item.checkOutTime, item.checkInTime)}
                                {renderTimeStatus(
                                  getCheckOutStatus(item.checkOutTime, item.shiftConfig?.endTime, item.date)
                                )}
                              </>
                            ) : (
                              <span className="invisible">11:00 PM (Đúng giờ)</span>
                            )}
                          </span>
                        </span>
                      </div>

                      {item.branchInfo && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-purple-500" />
                          <span className="text-xs">
                            {item.branchInfo?.branchName} • {item.branchInfo?.location}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Third row: Notes */}
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-xs font-medium">{t('attendance.note')}</span>
                      <span className="text-xs italic">{item.notes || 'N/a'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-10 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto hide-scrollbar">
        {/* Header */}
        <div className="bg-[#f05a29] p-4 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 text-white">
            <User className="w-5 h-5" />
            <h3 className="text-lg font-semibold">
              {(() => {
                const translated = t('attendance.history_title', { name: staffDisplayName || '' });
                return translated === 'attendance.history_title'
                  ? `Attendance History - ${staffDisplayName}`
                  : translated;
              })()}
            </h3>
          </div>
        </div>

        {/* Filters & Sort (pattern like MaintenanceLogList) */}
        <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-3 items-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-600">{t('common.sort_by') || 'Sort by'}:</span>
            {(['date', 'checkInTime', 'checkOutTime', 'status'] as const).map((field) => (
              <button
                key={field}
                onClick={() => {
                  const isSame = filters.sortBy === field;
                  let nextOrder: GetStaffAttendanceHistoryParams['sortOrder'];
                  if (isSame) {
                    nextOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc';
                  } else {
                    nextOrder = 'desc';
                  }
                  setFilters({ sortBy: field, sortOrder: nextOrder });
                }}
                className={`px-2 sm:px-3 py-1 text-xs rounded-full transition-colors ${
                  filters.sortBy === field ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="hidden sm:inline">{field}</span>
                <span className="sm:hidden">{field.charAt(0)}</span>
                {filters.sortBy === field && <span className="ml-1">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                setFilters({
                  status: (value === 'all' ? undefined : value) as GetStaffAttendanceHistoryParams['status']
                })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('attendance.all_status') || 'All status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('attendance.all_status') || 'All status'}</SelectItem>
                <SelectItem value="CHECKED_IN">{t('attendance.status.values.CHECKED_IN')}</SelectItem>
                <SelectItem value="CHECKED_OUT">{t('attendance.status.values.CHECKED_OUT')}</SelectItem>
                <SelectItem value="AUTO_CLOSE">{t('attendance.status.values.AUTO_CLOSE')}</SelectItem>
                <SelectItem value="MISSED">{t('attendance.status.values.MISSED')}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="bg-white"
              onClick={() => refetch()}
              title={t('common.refresh') || 'Refresh'}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">{renderContent()}</div>

        {/* Pagination */}
        {pagination && (
          <div className="px-4 pb-4 flex items-center justify-between text-sm text-gray-600">
            <div>
              {t('dashboard.showing') || 'Showing'} {(pagination.page - 1) * pagination.limit + 1} -{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} {t('dashboard.of_total') || 'of'}{' '}
              {pagination.total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(Math.max(1, pagination.page - 1))}
                disabled={!pagination.hasPrev}
                className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                {t('common.previous') || 'Previous'}
              </button>
              <span className="px-2">
                {pagination.page}/{pagination.totalPages}
              </span>
              <button
                onClick={() => goToPage(Math.min(pagination.totalPages, pagination.page + 1))}
                disabled={!pagination.hasNext}
                className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                {t('common.next') || 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
