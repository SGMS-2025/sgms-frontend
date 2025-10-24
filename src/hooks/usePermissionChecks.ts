import { useMemo } from 'react';

// Custom type for requester ID that can be either string or populated staff object
type RequesterId =
  | string
  | {
      _id: string;
      userId?: {
        _id: string;
      };
    };

interface PermissionCheckParams {
  userRole?: string;
  currentUserId?: string;
  requesterId?: RequesterId;
  status: string;
  isFinalStatus?: boolean;
}

export const usePermissionChecks = ({
  userRole,
  currentUserId,
  requesterId,
  status,
  isFinalStatus = false
}: PermissionCheckParams) => {
  const permissions = useMemo(() => {
    const isRequester = (() => {
      if (typeof requesterId === 'string') {
        return requesterId === currentUserId;
      }

      if (requesterId && 'userId' in requesterId && requesterId.userId) {
        return requesterId.userId._id === currentUserId;
      }

      return false;
    })();

    const isManager = userRole === 'MANAGER' || userRole === 'OWNER' || userRole === 'owner' || userRole === 'manager';

    return {
      // Reschedule permissions
      canEditReschedule: !isFinalStatus && status === 'PENDING_BROADCAST' && isRequester,

      canAcceptReschedule: !isFinalStatus && status === 'PENDING_BROADCAST' && !isRequester,

      canApproveReschedule: !isFinalStatus && status === 'PENDING_APPROVAL' && isManager,

      canRejectReschedule: !isFinalStatus && status === 'PENDING_APPROVAL' && isManager,

      canCancelReschedule:
        !isFinalStatus && (status === 'PENDING_BROADCAST' || status === 'PENDING_ACCEPTANCE') && isRequester,

      // TimeOff permissions
      canEditTimeOff: status === 'PENDING',
      canApproveTimeOff: status === 'PENDING' && isManager,
      canRejectTimeOff: status === 'PENDING' && isManager,
      canCancelTimeOff: status === 'PENDING' || status === 'APPROVED',

      // Common permissions
      canView: true, // Always can view
      canDelete: isManager || isRequester // Manager or requester can delete
    };
  }, [userRole, currentUserId, requesterId, status, isFinalStatus]);

  return permissions;
};

export default usePermissionChecks;
