import React, { useState } from 'react';
import {
  useMyRescheduleRequests,
  useAllRescheduleRequestsForApproval,
  useAcceptRescheduleRequest,
  useApproveRescheduleRequest,
  useRejectRescheduleRequest,
  useCancelRescheduleRequest
} from '@/hooks/useReschedule';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import CreateRescheduleModal from './CreateRescheduleModal';
import RescheduleRequestList from './RescheduleRequestList';
import RescheduleRequestDetailModal from './RescheduleRequestDetailModal';
import type { RescheduleRequest, RescheduleState, RescheduleType, ReschedulePriority } from '@/types/api/Reschedule';

const RescheduleManagementLayout: React.FC = () => {
  const { state: authState } = useAuth();
  const { currentStaff } = useCurrentUserStaff();

  // Local state
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<RescheduleState | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<RescheduleType | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<ReschedulePriority | 'ALL'>('ALL');
  const [currentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RescheduleRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch reschedule requests based on user role
  const isOwnerOrManager =
    authState.user?.role === 'OWNER' || (authState.user?.role === 'STAFF' && currentStaff?.jobTitle === 'Manager');

  // Only call approval API if user is Owner/Manager
  const approvalRequests = useAllRescheduleRequestsForApproval(
    {
      status: statusFilter === 'ALL' ? undefined : (statusFilter as RescheduleState),
      swapType: typeFilter === 'ALL' ? undefined : (typeFilter as RescheduleType),
      priority: priorityFilter === 'ALL' ? undefined : (priorityFilter as ReschedulePriority),
      page: currentPage,
      limit: 10
    },
    isOwnerOrManager
  );

  const myRequests = useMyRescheduleRequests({
    status: statusFilter === 'ALL' ? undefined : (statusFilter as RescheduleState),
    swapType: typeFilter === 'ALL' ? undefined : (typeFilter as RescheduleType),
    priority: priorityFilter === 'ALL' ? undefined : (priorityFilter as ReschedulePriority),
    page: currentPage,
    limit: 10
  });

  // Use approval requests if user is Owner/Manager, otherwise use my requests
  // Staff should always be able to see their own requests
  const { data: requests, loading, refetch } = isOwnerOrManager ? approvalRequests : myRequests;

  // Operations hooks
  const { acceptRescheduleRequest } = useAcceptRescheduleRequest();
  const { approveRescheduleRequest } = useApproveRescheduleRequest();
  const { rejectRescheduleRequest } = useRejectRescheduleRequest();
  const { cancelRescheduleRequest } = useCancelRescheduleRequest();

  // Apply client-side filtering
  const filteredRequests = React.useMemo(() => {
    return requests.filter((request) => {
      // Status filter
      const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;

      // Type filter
      const matchesType = typeFilter === 'ALL' || request.swapType === typeFilter;

      // Priority filter
      const matchesPriority = priorityFilter === 'ALL' || request.priority === priorityFilter;

      // Search filter (search in reason and staff names)
      const matchesSearch =
        !searchValue ||
        request.reason?.toLowerCase().includes(searchValue.toLowerCase()) ||
        (typeof request.requesterStaffId === 'object' &&
          request.requesterStaffId?.userId?.fullName?.toLowerCase().includes(searchValue.toLowerCase()));

      return matchesStatus && matchesType && matchesPriority && matchesSearch;
    });
  }, [requests, statusFilter, typeFilter, priorityFilter, searchValue]);

  // Calculate stats based on filtered requests
  const stats = {
    total: filteredRequests.length,
    pending: filteredRequests.filter((r) => r.status === 'PENDING_BROADCAST' || r.status === 'PENDING_ACCEPTANCE')
      .length,
    pendingApproval: filteredRequests.filter((r) => r.status === 'PENDING_APPROVAL').length,
    approved: filteredRequests.filter((r) => r.status === 'APPROVED' || r.status === 'COMPLETED').length,
    rejected: filteredRequests.filter(
      (r) => r.status === 'REJECTED' || r.status === 'CANCELLED' || r.status === 'EXPIRED'
    ).length
  };

  const handleViewRequest = (request: RescheduleRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleAcceptRequest = async (request: RescheduleRequest) => {
    await acceptRescheduleRequest(request._id);
    refetch();
  };

  const handleApproveRequest = async (request: RescheduleRequest) => {
    await approveRescheduleRequest(request._id, authState.user?._id || '');
    refetch();
  };

  const handleRejectRequest = async (request: RescheduleRequest) => {
    await rejectRescheduleRequest(request._id, { rejectionReason: 'Rejected by manager' });
    refetch();
  };

  const handleCancelRequest = async (request: RescheduleRequest) => {
    await cancelRescheduleRequest(request._id);
    refetch();
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Content */}
      <RescheduleRequestList
        requests={filteredRequests}
        loading={loading}
        onRefresh={refetch}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => setStatusFilter(value as RescheduleState | 'ALL')}
        typeFilter={typeFilter}
        onTypeFilterChange={(value) => setTypeFilter(value as RescheduleType | 'ALL')}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={(value) => setPriorityFilter(value as ReschedulePriority | 'ALL')}
        onCreateNew={!isOwnerOrManager ? () => setShowCreateModal(true) : undefined}
        onView={(id) => {
          const request = filteredRequests.find((r) => r._id === id);
          if (request) handleViewRequest(request);
        }}
        onAccept={(id) => {
          const request = filteredRequests.find((r) => r._id === id);
          if (request) handleAcceptRequest(request);
        }}
        onApprove={(id) => {
          const request = filteredRequests.find((r) => r._id === id);
          if (request) handleApproveRequest(request);
        }}
        onReject={(id) => {
          const request = filteredRequests.find((r) => r._id === id);
          if (request) handleRejectRequest(request);
        }}
        onCancel={(id) => {
          const request = filteredRequests.find((r) => r._id === id);
          if (request) handleCancelRequest(request);
        }}
        userRole={currentStaff?.jobTitle === 'Manager' ? 'MANAGER' : authState.user?.role}
        currentUserId={authState.user?._id}
        stats={{
          totalRequests: stats.total,
          pendingBroadcast: 0,
          pendingAcceptance: 0,
          pendingApproval: isOwnerOrManager ? stats.pendingApproval : stats.pending,
          approved: stats.approved,
          rejected: stats.rejected,
          cancelled: 0,
          expired: 0,
          completed: 0,
          requestsByType: [],
          requestsByPriority: []
        }}
        showStats={true}
        showHeader={true}
        showFilters={true}
        isOwnerOrManager={isOwnerOrManager}
      />

      {/* Modals */}
      {showCreateModal && (
        <CreateRescheduleModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showDetailModal && selectedRequest && (
        <RescheduleRequestDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          request={selectedRequest}
          onAccept={handleAcceptRequest}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
          onCancel={handleCancelRequest}
          userRole={currentStaff?.jobTitle === 'Manager' ? 'MANAGER' : authState.user?.role}
        />
      )}
    </div>
  );
};

export default RescheduleManagementLayout;
