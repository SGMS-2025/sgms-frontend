import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBreakpoint } from '@/hooks/useWindowSize';
import MobileTimeOffView from '@/components/timeoff/mobile/MobileTimeOffView';
import { RefreshCw } from 'lucide-react';
import { useTimeOffList, useTimeOffOperations } from '@/hooks/useTimeOff';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { useAuthState } from '@/hooks/useAuth';
import { useTimeOffTour } from '@/hooks/useTimeOffTour';
import { useBranch } from '@/contexts/BranchContext';
import TimeOffList from '@/components/timeoff/TimeOffList';
import CreateTimeOffModal from '@/components/timeoff/CreateTimeOffModal';
import TimeOffDetailModal from '@/components/timeoff/TimeOffDetailModal';
import TimeOffApprovalModal from '@/components/timeoff/TimeOffApprovalModal';
import TimeOffDetailSheet from '@/components/timeoff/TimeOffDetailSheet';
import type { TimeOff, TimeOffStatus, TimeOffType } from '@/types/api/TimeOff';

interface TimeOffPageProps {
  userRole: 'owner' | 'technician' | 'pt';
  showHighlight?: boolean;
}

const TimeOffPage: React.FC<TimeOffPageProps> = ({ userRole, showHighlight = false }) => {
  const { t } = useTranslation();
  const { startTimeOffTour } = useTimeOffTour();
  const [searchParams] = useSearchParams();
  const { currentStaff } = useCurrentUserStaff();
  const { user } = useAuthState();
  const { currentBranch } = useBranch();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTimeOff, setSelectedTimeOff] = useState<TimeOff | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [localSearchValue, setLocalSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine if user can view all requests or only their own
  const canViewAll = userRole === 'owner';
  const isManager = currentStaff?.jobTitle === 'Manager';
  const canApprove = userRole === 'owner' || isManager;

  // Determine staffId based on role and permissions
  const getStaffId = () => {
    if (canViewAll) return undefined;
    if (isManager) return undefined;
    return currentStaff?._id;
  };

  // Only pass date filters when both dates are selected
  const dateFilters =
    startDate && endDate
      ? {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      : {};

  const { timeOffs, loading, error, pagination, refetch, updateFilters, goToPage } = useTimeOffList({
    // For owner: show all requests
    // For technician/pt: if manager, show all staff in their branches, otherwise show only their own
    staffId: getStaffId(),
    status: statusFilter === 'ALL' ? undefined : (statusFilter as TimeOffStatus),
    type: typeFilter === 'ALL' ? undefined : (typeFilter as TimeOffType),
    branchId: currentBranch?._id,
    ...dateFilters,
    search: searchValue.trim() || undefined
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

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const { approveTimeOff, rejectTimeOff, cancelTimeOff, deleteTimeOff } = useTimeOffOperations();

  const handleCreateNew = () => {
    setShowCreateModal(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    refetch();
  };

  const handleViewTimeOff = (id: string) => {
    const timeOff = timeOffs.find((t) => t._id === id);
    if (timeOff) {
      setSelectedTimeOff(timeOff);
      setShowDetailSheet(true);
    }
  };

  const handleEditTimeOff = (id: string) => {
    const timeOff = timeOffs.find((t) => t._id === id);
    if (timeOff) {
      setSelectedTimeOff(timeOff);
      setShowDetailModal(true);
    }
  };

  const handleApproveTimeOff = async (id: string) => {
    if (canApprove) {
      const result = await approveTimeOff(id);
      if (result) {
        refetch();
      } else {
        // If approval failed, refresh data to get latest status
        setTimeout(() => {
          refetch();
        }, 1000);
      }
    }
  };

  const handleRejectTimeOff = async (id: string) => {
    if (canApprove) {
      const result = await rejectTimeOff(id);
      if (result) {
        refetch();
      }
    }
  };

  const handleCancelTimeOff = async (id: string) => {
    const result = await cancelTimeOff(id);
    if (result) {
      refetch();
    }
  };

  const handleDeleteTimeOff = async (id: string) => {
    const result = await deleteTimeOff(id);
    if (result) {
      refetch();
    }
  };

  const handleApproveFromDetail = async (timeOff: TimeOff) => {
    if (canApprove) {
      const result = await approveTimeOff(timeOff._id);
      if (result) {
        setShowDetailSheet(false);
        refetch();
      } else {
        // If approval failed, refresh data to get latest status
        setTimeout(() => {
          refetch();
        }, 1000);
      }
    }
  };

  const handleRejectFromDetail = async (timeOff: TimeOff) => {
    if (canApprove) {
      const result = await rejectTimeOff(timeOff._id);
      if (result) {
        setShowDetailSheet(false);
        refetch();
      }
    }
  };

  const handleCancelFromDetail = async (timeOff: TimeOff) => {
    const result = await cancelTimeOff(timeOff._id);
    if (result) {
      setShowDetailSheet(false);
      refetch();
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearchValue(value);

      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout to update filters after 500ms of inactivity
      searchTimeoutRef.current = setTimeout(() => {
        setSearchValue(value);
        updateFilters({
          search: value.trim() || undefined,
          branchId: currentBranch?._id,
          page: 1 // Reset to first page when search changes
        });
      }, 500);
    },
    [currentBranch?._id, updateFilters]
  );

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    updateFilters({
      status: value === 'ALL' ? undefined : (value as TimeOffStatus),
      branchId: currentBranch?._id,
      page: 1 // Reset to first page when filter changes
    });
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    updateFilters({
      type: value === 'ALL' ? undefined : (value as TimeOffType),
      branchId: currentBranch?._id,
      page: 1 // Reset to first page when filter changes
    });
  };

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start);
    setEndDate(end);
    // Only update filters when both dates are provided or both are cleared
    // This prevents API call when only one date is selected
    if ((start && end) || (!start && !end)) {
      updateFilters({
        startDate: start ? start.toISOString().split('T')[0] : undefined,
        endDate: end ? end.toISOString().split('T')[0] : undefined,
        branchId: currentBranch?._id,
        page: 1 // Reset to first page when date range changes
      });
    }
  };

  const handleExport = () => {
    // Export functionality will be implemented later
  };

  // Handle highlight query parameter (only for owner)
  useEffect(() => {
    if (showHighlight && userRole === 'owner') {
      const highlightId = searchParams.get('highlight');
      if (highlightId && timeOffs.length > 0) {
        const timeOffToHighlight = timeOffs.find((t) => t._id === highlightId);
        if (timeOffToHighlight) {
          setSelectedTimeOff(timeOffToHighlight);
          setShowDetailSheet(true);

          // Remove the highlight parameter from URL after opening
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('highlight');
          const queryString = newSearchParams.toString();
          const newUrl = globalThis.location.pathname + (queryString ? `?${queryString}` : '');
          globalThis.history.replaceState({}, '', newUrl);
        }
      }
    }
  }, [searchParams, timeOffs, showHighlight, userRole]);

  const { isMobile } = useBreakpoint();

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('timeoff.error_loading')}</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('common.try_again')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Time Off List / Mobile View */}
      {isMobile ? (
        <MobileTimeOffView
          timeOffs={timeOffs}
          loading={loading}
          stats={{
            total: timeOffs.length,
            pending: timeOffs.filter((t) => t.status === 'PENDING').length,
            approved: timeOffs.filter((t) => t.status === 'APPROVED').length,
            rejected: timeOffs.filter((t) => t.status === 'REJECTED').length,
            cancelled: timeOffs.filter((t) => t.status === 'CANCELLED').length
          }}
          onCreateNew={userRole !== 'owner' ? handleCreateNew : undefined}
          onRefresh={handleRefresh}
          onView={handleViewTimeOff}
        />
      ) : (
        <TimeOffList
          timeOffs={timeOffs}
          loading={loading}
          onEdit={handleEditTimeOff}
          onDelete={handleDeleteTimeOff}
          onView={handleViewTimeOff}
          onApprove={canApprove ? handleApproveTimeOff : undefined}
          onReject={canApprove ? handleRejectTimeOff : undefined}
          onCancel={handleCancelTimeOff}
          userRole={userRole}
          currentUserId={user?._id}
          onCreateNew={userRole !== 'owner' ? handleCreateNew : undefined}
          onRefresh={handleRefresh}
          onExport={handleExport}
          searchValue={localSearchValue}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          typeFilter={typeFilter}
          onTypeFilterChange={handleTypeFilterChange}
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={handleDateRangeChange}
          showFilters={true}
          showStats={true}
          showHeader={true}
          onStartTour={startTimeOffTour}
          pagination={pagination}
          onPageChange={goToPage}
          stats={{
            total: timeOffs.length,
            pending: timeOffs.filter((t) => t.status === 'PENDING').length,
            approved: timeOffs.filter((t) => t.status === 'APPROVED').length,
            rejected: timeOffs.filter((t) => t.status === 'REJECTED').length,
            cancelled: timeOffs.filter((t) => t.status === 'CANCELLED').length
          }}
        />
      )}

      {/* Modals */}
      <CreateTimeOffModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <TimeOffDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        timeOff={selectedTimeOff}
        onApprove={canApprove ? handleApproveFromDetail : undefined}
        onReject={canApprove ? handleRejectFromDetail : undefined}
        onCancel={handleCancelFromDetail}
      />

      <TimeOffDetailSheet
        isOpen={showDetailSheet}
        onClose={() => setShowDetailSheet(false)}
        timeOff={selectedTimeOff}
        onApprove={canApprove ? handleApproveFromDetail : undefined}
        onReject={canApprove ? handleRejectFromDetail : undefined}
        onCancel={handleCancelFromDetail}
      />

      <TimeOffApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        timeOff={selectedTimeOff}
        onApprove={canApprove ? handleApproveFromDetail : undefined}
        onReject={canApprove ? handleRejectFromDetail : undefined}
      />
    </div>
  );
};

export default TimeOffPage;
