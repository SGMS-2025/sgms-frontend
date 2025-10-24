import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { useTimeOffList, useTimeOffOperations } from '@/hooks/useTimeOff';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { useAuthState } from '@/hooks/useAuth';
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
  const [searchParams] = useSearchParams();
  const { currentStaff } = useCurrentUserStaff();
  const { user } = useAuthState();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTimeOff, setSelectedTimeOff] = useState<TimeOff | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

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

  const { timeOffs, stats, loading, error, pagination, refetch, updateFilters, goToPage } = useTimeOffList({
    // For owner: show all requests
    // For technician/pt: if manager, show all staff in their branches, otherwise show only their own
    staffId: getStaffId(),
    status: statusFilter === 'ALL' ? undefined : (statusFilter as TimeOffStatus),
    type: typeFilter === 'ALL' ? undefined : (typeFilter as TimeOffType)
  });

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

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // Search functionality will be implemented later
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    updateFilters({ status: value === 'ALL' ? undefined : (value as TimeOffStatus) });
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    updateFilters({ type: value === 'ALL' ? undefined : (value as TimeOffType) });
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
      {/* Time Off List */}
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
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        typeFilter={typeFilter}
        onTypeFilterChange={handleTypeFilterChange}
        showFilters={true}
        showStats={true}
        showHeader={true}
        stats={
          stats
            ? {
                total: stats.totalRequests,
                pending: stats.pendingRequests,
                approved: stats.approvedRequests,
                rejected: stats.rejectedRequests,
                cancelled: stats.cancelledRequests
              }
            : undefined
        }
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {t('common.showing')} {(pagination.page - 1) * pagination.limit + 1} -{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} {t('common.of')} {pagination.total}{' '}
                {t('timeoff.requests')}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  {t('common.previous')}
                </Button>
                <span className="text-sm text-gray-600">
                  {t('common.page')} {pagination.page} {t('common.of')} {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
