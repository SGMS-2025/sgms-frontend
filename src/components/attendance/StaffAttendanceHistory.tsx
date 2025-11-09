import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { vi, enUS } from 'date-fns/locale';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { useTableSort } from '@/hooks/useTableSort';
import { sortArray } from '@/utils/sort';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { useAttendanceHistory } from '@/hooks/useStaffAttendance';
import {
  formatToAmPm,
  formatTimeOnly,
  formatCheckOutTime,
  getAttendanceStatusStyles,
  getCheckInStatus,
  getCheckOutStatus,
  getTimeStatusInfo
} from '@/utils/staffAttendanceUtils';

const StaffAttendanceHistory: React.FC = () => {
  const { t, i18n } = useTranslation();
  const calendarLocale = i18n.language?.startsWith('vi') ? vi : enUS;
  const { items, loading, error, setFilters } = useAttendanceHistory({ sort: '-checkInTime' });
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = React.useState<Date | undefined>(undefined);
  const { sortState, handleSort, getSortIcon } = useTableSort();
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const applyFilters = React.useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      fromDate: dateFrom ? dateFrom.toISOString() : undefined,
      toDate: dateTo ? dateTo.toISOString() : undefined
    }));
  }, [dateFrom, dateTo, setFilters]);

  // Derived sorted items
  const sortedItems = React.useMemo(() => {
    if (!sortState.field || !sortState.order) return items;
    return sortArray(items, sortState, (att, field) => {
      switch (field) {
        case 'workshift':
          return att.shiftConfig?.startTime ? new Date(`2000-01-01T${att.shiftConfig.startTime}`).getTime() : 0;
        case 'day': {
          const dayDate = att.checkInTime ?? att.checkOutTime ?? att.createdAt;
          if (dayDate) {
            return new Date(dayDate).getTime();
          }
          return 0;
        }
        case 'checkInTime':
          return att.checkInTime ? new Date(att.checkInTime).getTime() : 0;
        case 'checkOutTime':
          return att.checkOutTime ? new Date(att.checkOutTime).getTime() : 0;
        case 'status':
          return att.status || '';
        default:
          return '';
      }
    });
  }, [items, sortState]);

  // Group items by date for display
  const groupedItems = React.useMemo(() => {
    // Helper to get date key from item
    const getDateKey = (item: (typeof sortedItems)[0]): string => {
      if (item.dateVN) {
        const dateVNRegex = /(\d{2})\/(\d{2})\/(\d{4})/;
        const dateVNMatch = dateVNRegex.exec(item.dateVN);
        if (dateVNMatch) {
          const [, day, month, year] = dateVNMatch;
          return `${year}-${month}-${day}`;
        }
        return item.dateVN;
      }
      if (item.date) {
        const dateRegex = /^(\d{4}-\d{2}-\d{2})/;
        const dateMatch = dateRegex.exec(item.date);
        if (dateMatch) {
          return dateMatch[1];
        }
        const date = new Date(item.date);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return 'unknown';
    };

    // Helper to get date display from item
    const getDateDisplay = (item: (typeof sortedItems)[0]): string => {
      if (item.dateVN) return item.dateVN;
      if (item.date) {
        const date = new Date(item.date);
        return date.toLocaleDateString('vi-VN');
      }
      return '-';
    };
    const dateMap = new Map<string, typeof sortedItems>();

    for (const item of sortedItems) {
      const dateKey = getDateKey(item);
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(item);
    }

    // Convert map to array
    const groups: Array<{ dateKey: string; dateDisplay: string; items: typeof sortedItems }> = [];
    for (const [dateKey, items] of dateMap.entries()) {
      const dateDisplay = getDateDisplay(items[0]);
      groups.push({ dateKey, dateDisplay, items });
    }

    // Sort groups by dateKey (descending)
    groups.sort((a, b) => b.dateKey.localeCompare(a.dateKey));

    return groups;
  }, [sortedItems]);

  // Flatten grouped items for pagination
  const flattenedItems = React.useMemo(() => {
    return groupedItems.flatMap((group) => group.items);
  }, [groupedItems]);

  // Pagination
  const totalPages = Math.ceil(flattenedItems.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Get paginated groups (only include groups that have items in the current page)
  const paginatedGroups = React.useMemo(() => {
    const result: Array<{ dateKey: string; dateDisplay: string; items: typeof sortedItems; startIndex: number }> = [];
    let currentIndex = 0;

    for (const group of groupedItems) {
      const groupStartIndex = currentIndex;
      const groupEndIndex = currentIndex + group.items.length;

      // Check if this group overlaps with the current page
      if (groupEndIndex > startIndex && groupStartIndex < endIndex) {
        // Get items that are in the current page
        const pageStartInGroup = Math.max(0, startIndex - groupStartIndex);
        const pageEndInGroup = Math.min(group.items.length, endIndex - groupStartIndex);
        const itemsInPage = group.items.slice(pageStartInGroup, pageEndInGroup);

        if (itemsInPage.length > 0) {
          result.push({
            dateKey: group.dateKey,
            dateDisplay: group.dateDisplay,
            items: itemsInPage,
            startIndex: groupStartIndex + pageStartInGroup
          });
        }
      }

      currentIndex = groupEndIndex;
    }

    return result;
  }, [groupedItems, startIndex, endIndex]);

  // Reset to first page when filters or sort change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, sortState]);

  // Helper to check if this is the first item in a date group
  const isFirstItemInGroup = (itemIndex: number) => {
    return itemIndex === 0;
  };

  // Helper to render time status
  const renderTimeStatus = (status: 'early' | 'on-time' | 'late' | 'overtime' | null) => {
    const statusInfo = getTimeStatusInfo(status);
    if (!statusInfo) return null;
    return <span className={`text-xs font-semibold ${statusInfo.colorClass}`}>({t(statusInfo.translationKey)})</span>;
  };

  return (
    <div className="basic-management">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center gap-2 text-black">
          <CalendarIcon className="w-5 h-5" />
          <span className="text-xl sm:text-2xl font-semibold">{t('attendance.history.title')}</span>
        </div>
        <Card>
          <CardContent className="">
            <div className="text-sm font-semibold text-gray-700 mb-2">{t('common.filter')}</div>
            <div className="grid grid-cols-1 md:[grid-template-columns:1fr_1fr_auto] gap-2 md:gap-3 items-center">
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-600">{t('attendance.history.from_date')}</div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-10 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? dateFrom.toLocaleDateString('vi-VN') : t('attendance.history.from_date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="bottom" align="start" sideOffset={4} alignOffset={0} className="w-auto p-0">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={calendarLocale} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-600">{t('attendance.history.to_date')}</div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-10 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? dateTo.toLocaleDateString('vi-VN') : t('attendance.history.to_date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="bottom" align="start" sideOffset={4} alignOffset={0} className="w-auto p-0">
                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={calendarLocale} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1 md:self-end">
                <div className="text-sm font-medium invisible">{t('common.filter')}</div>
                <Button
                  onClick={applyFilters}
                  disabled={loading}
                  className="h-10 bg-orange-500 hover:bg-orange-600 w-full"
                >
                  {t('common.filter')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-2">
        <div className="text-lg font-semibold mb-3">{t('attendance.history.list_title')}</div>
        {(() => {
          if (loading) {
            return (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            );
          }
          if (error) {
            return <div className="text-center text-red-600 py-8">{error}</div>;
          }
          if (items.length === 0) {
            return <div className="text-center text-gray-500 py-8">{t('attendance.history.empty')}</div>;
          }
          return (
            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full min-w-[720px] text-xs md:text-sm">
                <thead className="border-b bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <SortableHeader
                      field="day"
                      label={t('attendance.history.day', 'Day')}
                      sortState={sortState}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                    <SortableHeader
                      field="workshift"
                      label={t('attendance.history.workshift', 'Work shift (Start - End)')}
                      sortState={sortState}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                    <SortableHeader
                      field="checkInTime"
                      label={t('attendance.status.checkin')}
                      sortState={sortState}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                    <SortableHeader
                      field="checkOutTime"
                      label={t('attendance.status.checkout')}
                      sortState={sortState}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                    <SortableHeader
                      field="status"
                      label={t('attendance.status.status_label')}
                      sortState={sortState}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedGroups.map((group) =>
                    group.items.map((it, itemIndex) => (
                      <tr key={it._id} className="hover:bg-gray-50">
                        {isFirstItemInGroup(itemIndex) && (
                          <td
                            className="px-2 py-3 md:px-4 md:py-4 whitespace-nowrap font-semibold bg-gray-50"
                            rowSpan={group.items.length}
                          >
                            {group.dateDisplay}
                            {group.items[0]?.dayOfTheWeek && (
                              <span className="text-xs text-gray-500 ml-1">
                                ({t(`common.days.${group.items[0].dayOfTheWeek.toLowerCase()}`)})
                              </span>
                            )}
                          </td>
                        )}
                        <td className="px-2 py-3 md:px-4 md:py-4 whitespace-nowrap">
                          {it.shiftConfig
                            ? `${formatToAmPm(it.shiftConfig.startTime)} - ${formatToAmPm(it.shiftConfig.endTime)}`
                            : '-'}
                        </td>
                        <td className="px-2 py-3 md:px-4 md:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {formatTimeOnly(it.checkInTime)}
                            {renderTimeStatus(getCheckInStatus(it.checkInTime, it.shiftConfig?.startTime, it.date))}
                          </div>
                        </td>
                        <td className="px-2 py-3 md:px-4 md:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {formatCheckOutTime(it.checkOutTime, it.checkInTime)}
                            {renderTimeStatus(getCheckOutStatus(it.checkOutTime, it.shiftConfig?.endTime, it.date))}
                          </div>
                        </td>
                        <td className="px-2 py-3 md:px-4 md:py-4 whitespace-nowrap">
                          <Badge className={`text-[10px] md:text-xs ${getAttendanceStatusStyles(it.status)}`}>
                            {t(`attendance.status.values.${it.status}`)}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {flattenedItems.length > itemsPerPage && (
        <div className="flex justify-center mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default StaffAttendanceHistory;
