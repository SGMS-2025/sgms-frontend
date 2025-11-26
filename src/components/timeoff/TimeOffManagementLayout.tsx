import React, { useState, useEffect } from 'react';
import { useTimeOffList, useTimeOffOperations } from '@/hooks/useTimeOff';
import { useTimeOffTour } from '@/hooks/useTimeOffTour';
import CreateTimeOffModal from './CreateTimeOffModal';
import TimeOffDetailModal from './TimeOffDetailModal';
import TimeOffApprovalModal from './TimeOffApprovalModal';
import TimeOffList from './TimeOffList';
import type { TimeOff, TimeOffStatus, TimeOffType } from '@/types/api/TimeOff';

interface TimeOffManagementLayoutProps {
  staffId?: string;
  showStats?: boolean;
  onExport?: () => void;
}

const TimeOffManagementLayout: React.FC<TimeOffManagementLayoutProps> = ({ staffId, showStats = true, onExport }) => {
  const { startTimeOffTour } = useTimeOffTour();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTimeOff, setSelectedTimeOff] = useState<TimeOff | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('');
  const [statusFilter] = useState('ALL');
  const [typeFilter] = useState('ALL');
  const [currentPage] = useState(1);

  // Debounce search value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const { timeOffs, loading, refetch, updateFilters } = useTimeOffList({
    staffId,
    status: statusFilter !== 'ALL' ? (statusFilter as TimeOffStatus) : undefined,
    type: typeFilter !== 'ALL' ? (typeFilter as TimeOffType) : undefined,
    // Always pass current debounced search to hook so requests include it
    search: debouncedSearchValue.trim() || undefined,
    page: currentPage,
    limit: 10
  });

  // Update filters when debounced search value changes
  useEffect(() => {
    const searchParam = debouncedSearchValue.trim() || undefined;

    if (updateFilters) {
      updateFilters({
        search: searchParam,
        page: 1 // Reset page when search changes
      });
    }
  }, [debouncedSearchValue, updateFilters]);

  // Reset page when search value changes
  useEffect(() => {
    // Page will be reset by TimeOffList component
  }, [debouncedSearchValue]);

  const { approveTimeOff, rejectTimeOff, cancelTimeOff } = useTimeOffOperations();

  // Handle view time off
  const handleViewTimeOff = (id: string) => {
    const timeOff = timeOffs.find((t) => t._id === id);
    if (timeOff) {
      setSelectedTimeOff(timeOff);
      setShowDetailModal(true);
    }
  };

  // Handle approve time off
  const handleApproveTimeOff = (id: string) => {
    const timeOff = timeOffs.find((t) => t._id === id);
    if (timeOff) {
      setSelectedTimeOff(timeOff);
      setShowApprovalModal(true);
    }
  };

  // Handle reject time off
  const handleRejectTimeOff = (id: string) => {
    const timeOff = timeOffs.find((t) => t._id === id);
    if (timeOff) {
      setSelectedTimeOff(timeOff);
      setShowApprovalModal(true);
    }
  };

  // Handle cancel time off
  const handleCancelTimeOff = async (id: string) => {
    const result = await cancelTimeOff(id);
    if (result) {
      setShowDetailModal(false);
      refetch();
    }
  };

  // Handle approval action
  const handleApprovalAction = async (action: 'approve' | 'reject') => {
    if (!selectedTimeOff) return;

    const result =
      action === 'approve' ? await approveTimeOff(selectedTimeOff._id) : await rejectTimeOff(selectedTimeOff._id);

    if (result) {
      setShowApprovalModal(false);
      setSelectedTimeOff(null);
      refetch();
    } else {
      // If approval failed, check if it's because request was already approved
      // and refresh data to get latest status
      setTimeout(() => {
        refetch();
      }, 1000);
    }
  };

  // Handle search
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  // Calculate stats
  const calculatedStats = {
    total: timeOffs.length,
    pending: timeOffs.filter((t) => t.status === 'PENDING').length,
    approved: timeOffs.filter((t) => t.status === 'APPROVED').length,
    rejected: timeOffs.filter((t) => t.status === 'REJECTED').length,
    cancelled: timeOffs.filter((t) => t.status === 'CANCELLED').length
  };

  return (
    <div className="space-y-6">
      {/* Content */}
      <TimeOffList
        timeOffs={timeOffs}
        loading={loading}
        onRefresh={refetch}
        onExport={onExport}
        onView={handleViewTimeOff}
        onApprove={handleApproveTimeOff}
        onReject={handleRejectTimeOff}
        onCancel={handleCancelTimeOff}
        onCreateNew={() => setShowCreateModal(true)}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) =>
          updateFilters({ status: value !== 'ALL' ? (value as TimeOffStatus) : undefined })
        }
        typeFilter={typeFilter}
        onTypeFilterChange={(value) => updateFilters({ type: value !== 'ALL' ? (value as TimeOffType) : undefined })}
        showStats={showStats}
        stats={calculatedStats}
        showFilters={true}
        showHeader={true}
        onStartTour={startTimeOffTour}
      />

      {/* Modals */}
      <CreateTimeOffModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          refetch();
        }}
      />

      <TimeOffDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        timeOff={selectedTimeOff}
        onCancel={(timeOff) => handleCancelTimeOff(timeOff._id)}
      />

      <TimeOffApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        timeOff={selectedTimeOff}
        onApprove={() => handleApprovalAction('approve')}
        onReject={() => handleApprovalAction('reject')}
      />
    </div>
  );
};

export default TimeOffManagementLayout;
