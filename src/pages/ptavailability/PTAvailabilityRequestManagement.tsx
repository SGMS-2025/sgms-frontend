import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Search,
  Plus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  CalendarIcon,
  Clock,
  X,
  Grid3X3,
  List,
  Target,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/utils/utils';
import { format } from 'date-fns';
import { usePTAvailabilityRequestList } from '@/hooks/usePTAvailabilityRequest';
import { CreatePTAvailabilityRequestModal } from '@/components/ptavailability/CreatePTAvailabilityRequestModal';
import PTAvailabilityRequestCard from '@/components/ptavailability/PTAvailabilityRequestCard';
import PTAvailabilityRequestDetailModal from '@/components/ptavailability/PTAvailabilityRequestDetailModal';
import { useUser } from '@/hooks/useAuth';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { useBranch } from '@/contexts/BranchContext';
import type { PTAvailabilityRequest, PTAvailabilityRequestStatus } from '@/types/api/PTAvailabilityRequest';

const PTAvailabilityRequestManagement: React.FC = () => {
  const { t } = useTranslation();
  const user = useUser();
  const { currentStaff } = useCurrentUserStaff();
  const { currentBranch } = useBranch();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<PTAvailabilityRequestStatus | 'ALL'>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<PTAvailabilityRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const previousRangeRef = useRef<{ from?: Date; to?: Date } | undefined>(undefined);

  // Date range filters for API
  const dateFilters =
    dateRange.from && dateRange.to
      ? {
          startDate: dateRange.from.toISOString().split('T')[0],
          endDate: dateRange.to.toISOString().split('T')[0]
        }
      : {};

  const { requests, stats, loading, error, pagination, refetch, updateFilters, goToPage } =
    usePTAvailabilityRequestList({
      search: searchValue || undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      branchId: currentBranch?._id,
      ...dateFilters,
      page: 1,
      limit: 6
    });

  // Update filters when branch changes
  useEffect(() => {
    if (currentBranch?._id) {
      updateFilters({
        branchId: currentBranch._id,
        page: 1
      });
    }
  }, [currentBranch?._id, updateFilters]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    updateFilters({
      search: value || undefined,
      branchId: currentBranch?._id,
      page: 1
    });
  };

  const handleStatusFilter = (value: string) => {
    const newStatus = value as PTAvailabilityRequestStatus | 'ALL';
    setStatusFilter(newStatus);
    updateFilters({
      status: newStatus !== 'ALL' ? newStatus : undefined,
      branchId: currentBranch?._id,
      page: 1
    });
  };

  // Handle date range change
  const handleDateRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range) {
      const newRange = { from: range.from, to: range.to };
      const prevRange = previousRangeRef.current;

      // Check if this is a real second date selection
      const isSecondDateSelection =
        prevRange?.from &&
        !prevRange?.to &&
        range.from &&
        range.to &&
        range.from.getTime() === prevRange.from.getTime();

      // Check if dates are different
      const hasDifferentDates =
        range.from &&
        range.to &&
        new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate()).getTime() !==
          new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate()).getTime();

      setDateRange(newRange);
      previousRangeRef.current = newRange;

      if (range.from && range.to && (hasDifferentDates || isSecondDateSelection)) {
        const dateFilters = {
          startDate: range.from.toISOString().split('T')[0],
          endDate: range.to.toISOString().split('T')[0]
        };
        updateFilters({ ...dateFilters, branchId: currentBranch?._id, page: 1 });
        setDatePickerOpen(false);
      } else if (range.from && !range.to) {
        // Just update local state for first date
      }
    }
  };

  const handleClearDateRange = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDateRange({ from: undefined, to: undefined });
    previousRangeRef.current = undefined;
    updateFilters({ startDate: undefined, endDate: undefined, branchId: currentBranch?._id, page: 1 });
  };

  const handleView = (id: string) => {
    const request = requests.find((r) => r._id === id);
    if (request) {
      setSelectedRequest(request);
      setIsDetailModalOpen(true);
    }
  };

  const handleApprove = (id: string) => {
    handleView(id);
  };

  const handleReject = (id: string) => {
    handleView(id);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRequest(null);
    refetch();
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    refetch();
  };

  // Only PT (STAFF with jobTitle "Personal Trainer") can create requests, not Managers
  const isPT = user?.role === 'STAFF' && currentStaff?.jobTitle === 'Personal Trainer';
  const canCreate = isPT;

  return (
    <div className="space-y-6 p-6">
      <div className="basic-management">
        {/* Header */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-500">
                <Calendar className="h-3.5 w-3.5" />
                {t('pt_availability.badge', 'PT AVAILABILITY')}
              </span>
              <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-gray-900">
                {t('pt_availability.management_title', 'PT Availability Request Management')}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {t(
                  'pt_availability.management_description',
                  'Manage and approve 1vs1 schedule registration requests from PTs'
                )}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {canCreate && (
                <Button
                  className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('pt_availability.create_request', '+ Create PT 1vs1 Schedule Request')}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
          <div className="rounded-2xl border border-orange-100 bg-[#FFF6EE] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-orange-500">
              {t('pt_availability.stats.total', 'Total Requests')}
            </div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-3xl font-bold text-gray-900">{stats?.totalRequests || 0}</div>
              <div className="rounded-full bg-white/70 p-2 text-orange-500">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {currentBranch
                ? `${t('pt_availability.stats.total_helper', 'Tổng số yêu cầu')} - ${currentBranch.branchName}`
                : t('pt_availability.stats.total_helper', 'Tổng số yêu cầu')}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-yellow-600">
              {t('pt_availability.stats.pending', 'Pending')}
            </div>
            <div className="mt-2 flex items-end justify-between text-gray-900">
              <span className="text-3xl font-semibold">{stats?.pendingRequests || 0}</span>
              <div className="rounded-full bg-white p-2 text-yellow-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {t('pt_availability.stats.pending_helper', 'Yêu cầu đang chờ phê duyệt')}
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-green-600">
              {t('pt_availability.stats.approved', 'Approved')}
            </div>
            <div className="mt-2 flex items-end justify-between text-gray-900">
              <span className="text-3xl font-semibold">{stats?.approvedRequests || 0}</span>
              <div className="rounded-full bg-white p-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {t('pt_availability.stats.approved_helper', 'Yêu cầu đã được phê duyệt')}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-red-600">
              {t('pt_availability.stats.rejected', 'Rejected')}
            </div>
            <div className="mt-2 flex items-end justify-between text-gray-900">
              <span className="text-3xl font-semibold">{stats?.rejectedRequests || 0}</span>
              <div className="rounded-full bg-white p-2 text-red-600">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {t('pt_availability.stats.rejected_helper', 'Yêu cầu đã bị từ chối')}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <Card className="shadow-sm border-0 bg-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder={t('pt_availability.search_placeholder', 'Search by PT name, notes...')}
                      value={searchValue}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10 h-11 text-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                    />
                  </div>
                </div>

                {/* Date Range Picker */}
                <div className="w-full sm:w-auto relative">
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'h-11 w-full sm:w-[240px] justify-start text-left font-normal border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg pr-8',
                          !dateRange.from && !dateRange.to && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from && dateRange.to ? (
                          <>
                            {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
                          </>
                        ) : dateRange.from ? (
                          <>
                            {format(dateRange.from, 'dd/MM/yyyy')} -{' '}
                            {t('pt_availability.select_date_range', 'Select date range')}
                          </>
                        ) : (
                          <span>{t('pt_availability.select_date_range', 'Select date range')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={dateRange}
                        onSelect={(range) => {
                          handleDateRangeSelect(range);
                        }}
                        numberOfMonths={2}
                        className="bg-white"
                      />
                    </PopoverContent>
                  </Popover>
                  {/* Clear button */}
                  {(dateRange.from || dateRange.to) && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClearDateRange(e);
                      }}
                      aria-label="Clear date range"
                    >
                      <X className="h-4 w-4 opacity-50 hover:opacity-100" />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="w-full sm:w-32 lg:w-36">
                  <Select value={statusFilter} onValueChange={handleStatusFilter}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg">
                      <SelectValue placeholder={t('common.all_status', 'All Status')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">{t('common.all_status', 'All Status')}</SelectItem>
                      <SelectItem value="PENDING_APPROVAL">{t('pt_availability.status.pending', 'Pending')}</SelectItem>
                      <SelectItem value="APPROVED">{t('pt_availability.status.approved', 'Approved')}</SelectItem>
                      <SelectItem value="REJECTED">{t('pt_availability.status.rejected', 'Rejected')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* View Toggle Buttons */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  <Button
                    variant={viewMode === 'card' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('card')}
                    className={cn(
                      'h-9 px-3 rounded-md transition-all',
                      viewMode === 'card'
                        ? 'bg-white shadow-sm text-gray-900'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('table')}
                    className={cn(
                      'h-9 px-3 rounded-md transition-all',
                      viewMode === 'table'
                        ? 'bg-white shadow-sm text-gray-900'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <p className="text-gray-600 ml-3">{t('pt_availability.loading_requests', 'Loading requests...')}</p>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('pt_availability.no_requests', 'No requests')}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t('pt_availability.no_requests_description', 'No PT availability requests found')}
                </p>
                {canCreate && (
                  <Button onClick={() => setIsCreateModalOpen(true)} className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('pt_availability.create_first_request', 'Create First Request')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {requests.map((request) => (
                  <PTAvailabilityRequestCard
                    key={request._id}
                    request={request}
                    onView={handleView}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    userRole={user?.role}
                    currentUserId={user?._id}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <PTAvailabilityRequestCard
                    key={request._id}
                    request={request}
                    onView={handleView}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    userRole={user?.role}
                    currentUserId={user?._id}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center mt-8 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={!pagination.hasPrev || loading}
                  className="h-10 px-3 rounded-[20px] border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t('common.previous', 'Previous')}
                </Button>

                {/* Page Numbers - Hidden on mobile */}
                <div className="hidden md:flex items-center space-x-1">
                  {(() => {
                    const currentPage = pagination.page;
                    const totalPages = pagination.totalPages;
                    const maxVisible = 5; // Show max 5 page numbers at once

                    // Calculate page range
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

                    // Adjust start if we're near the end
                    if (endPage - startPage + 1 < maxVisible) {
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }

                    const pages = [];

                    // First page + ellipsis
                    if (startPage > 1) {
                      pages.push(
                        <Button
                          key={1}
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(1)}
                          className="h-10 w-10 rounded-[20px] border-gray-200 bg-white hover:bg-gray-50"
                        >
                          1
                        </Button>
                      );
                      if (startPage > 2) {
                        pages.push(
                          <span key="ellipsis1" className="px-2 text-muted-foreground">
                            ...
                          </span>
                        );
                      }
                    }

                    // Page numbers in range
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <Button
                          key={i}
                          variant={i === currentPage ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => goToPage(i)}
                          className={`h-10 w-10 rounded-[20px] ${
                            i === currentPage
                              ? 'bg-[#F05A29] text-white hover:bg-[#df4615]'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {i}
                        </Button>
                      );
                    }

                    // Last page + ellipsis
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span key="ellipsis2" className="px-2 text-muted-foreground">
                            ...
                          </span>
                        );
                      }
                      pages.push(
                        <Button
                          key={totalPages}
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(totalPages)}
                          className="h-10 w-10 rounded-[20px] border-gray-200 bg-white hover:bg-gray-50"
                        >
                          {totalPages}
                        </Button>
                      );
                    }

                    return pages;
                  })()}
                </div>

                {/* Mobile Page Info */}
                <div className="md:hidden flex items-center px-3">
                  <span className="text-sm text-muted-foreground">
                    {pagination.page}/{pagination.totalPages}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={!pagination.hasNext || loading}
                  className="h-10 px-3 rounded-[20px] border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.next', 'Next')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <CreatePTAvailabilityRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <PTAvailabilityRequestDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        request={selectedRequest}
        onApprove={(request) => {
          handleApprove(request._id);
        }}
        onReject={(request) => {
          handleReject(request._id);
        }}
      />
    </div>
  );
};

export default PTAvailabilityRequestManagement;
