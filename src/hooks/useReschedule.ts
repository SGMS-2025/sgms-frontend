import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { rescheduleApi } from '@/services/api/rescheduleApi';
import { useRescheduleRealtime } from './useRescheduleRealtime';
import type { UseDataReturn, UseCreateReturn } from '@/types/hooks/HookTypes';
import type {
  RescheduleRequest,
  RescheduleRequestFilters,
  CreateRescheduleRequestDto,
  RejectRescheduleRequestDto
} from '@/types/api/Reschedule';

/**
 * Get localized error message for reschedule operations
 */
const getRescheduleErrorMessage = (
  message: string,
  t: (key: string) => string,
  fallbackKey: string = 'reschedule.error'
): string => {
  if (message === 'RESCHEDULE_REQUEST_NOT_FOUND') {
    return t('error.RESCHEDULE_REQUEST_NOT_FOUND');
  } else if (message === 'RESCHEDULE_REQUEST_ALREADY_EXISTS') {
    return t('error.RESCHEDULE_REQUEST_ALREADY_EXISTS');
  } else if (message === 'RESCHEDULE_REQUEST_INVALID_STATUS') {
    return t('error.RESCHEDULE_REQUEST_INVALID_STATUS');
  } else if (message === 'RESCHEDULE_REQUEST_CANNOT_ACCEPT') {
    return t('error.RESCHEDULE_REQUEST_CANNOT_ACCEPT');
  } else if (message === 'RESCHEDULE_REQUEST_CANNOT_APPROVE') {
    return t('error.RESCHEDULE_REQUEST_CANNOT_APPROVE');
  } else if (message === 'RESCHEDULE_REQUEST_CANNOT_REJECT') {
    return t('error.RESCHEDULE_REQUEST_CANNOT_REJECT');
  } else if (message === 'RESCHEDULE_REQUEST_CANNOT_CANCEL') {
    return t('error.RESCHEDULE_REQUEST_CANNOT_CANCEL');
  } else if (message === 'RESCHEDULE_REQUEST_EXPIRED') {
    return t('error.RESCHEDULE_REQUEST_EXPIRED');
  } else if (message === 'RESCHEDULE_REQUEST_OWNER_ONLY') {
    return t('error.RESCHEDULE_REQUEST_OWNER_ONLY');
  } else if (message === 'RESCHEDULE_REQUEST_CANCEL_OWN_ONLY') {
    return t('error.RESCHEDULE_REQUEST_CANCEL_OWN_ONLY');
  } else if (message === 'RESCHEDULE_REQUEST_BRANCH_ACCESS') {
    return t('error.RESCHEDULE_REQUEST_BRANCH_ACCESS');
  } else if (message === 'RESCHEDULE_REQUEST_APPROVER_PERMISSION') {
    return t('error.RESCHEDULE_REQUEST_APPROVER_PERMISSION');
  } else if (message === 'RESCHEDULE_REQUEST_APPROVER_BRANCH') {
    return t('error.RESCHEDULE_REQUEST_APPROVER_BRANCH');
  } else if (message === 'RESCHEDULE_REQUEST_TARGET_SHIFT_NOT_FOUND') {
    return t('error.RESCHEDULE_REQUEST_TARGET_SHIFT_NOT_FOUND');
  } else if (message === 'RESCHEDULE_REQUEST_INVALID_PRIORITY') {
    return t('error.RESCHEDULE_REQUEST_INVALID_PRIORITY');
  } else if (message === 'RESCHEDULE_REQUEST_INVALID_TYPE') {
    return t('error.RESCHEDULE_REQUEST_INVALID_TYPE');
  } else if (message === 'RESCHEDULE_REQUEST_REASON_REQUIRED') {
    return t('error.RESCHEDULE_REQUEST_REASON_REQUIRED');
  } else if (message === 'RESCHEDULE_REQUEST_REASON_TOO_LONG') {
    return t('error.RESCHEDULE_REQUEST_REASON_TOO_LONG');
  } else if (message === 'RESCHEDULE_REQUEST_EXPIRY_INVALID') {
    return t('error.RESCHEDULE_REQUEST_EXPIRY_INVALID');
  } else if (message === 'RESCHEDULE_REQUEST_CONFLICT_DETECTED') {
    return t('error.RESCHEDULE_REQUEST_CONFLICT_DETECTED');
  } else if (message === 'RESCHEDULE_ADVANCE_NOTICE_REQUIRED') {
    return t('error.RESCHEDULE_ADVANCE_NOTICE_REQUIRED');
  }

  // Return the original message or fallback if no specific localization found
  return message || t(fallbackKey);
};

/**
 * Hook to fetch reschedule requests for the current user
 */
export const useMyRescheduleRequests = (filters: RescheduleRequestFilters = {}): UseDataReturn<RescheduleRequest> => {
  const [requests, setRequests] = useState<RescheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  // Memoize filters to prevent infinite re-renders
  const memoizedFilters = useMemo(
    () => ({
      page: filters.page,
      limit: filters.limit,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      status: filters.status,
      swapType: filters.swapType,
      priority: filters.priority,
      requesterStaffId: filters.requesterStaffId,
      targetStaffId: filters.targetStaffId,
      branchId: filters.branchId,
      isExpired: filters.isExpired,
      startDate: filters.startDate,
      endDate: filters.endDate
    }),
    [
      filters.page,
      filters.limit,
      filters.sortBy,
      filters.sortOrder,
      filters.status,
      filters.swapType,
      filters.priority,
      filters.requesterStaffId,
      filters.targetStaffId,
      filters.branchId,
      filters.isExpired,
      filters.startDate,
      filters.endDate
    ]
  );

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Convert RescheduleRequestFilters to RescheduleListParams
    const apiParams = {
      page: memoizedFilters.page,
      limit: memoizedFilters.limit,
      sortBy: memoizedFilters.sortBy as 'createdAt' | 'updatedAt' | 'expiresAt' | 'priority' | undefined,
      sortOrder: memoizedFilters.sortOrder,
      status: memoizedFilters.status,
      swapType: memoizedFilters.swapType,
      priority: memoizedFilters.priority,
      requesterStaffId: memoizedFilters.requesterStaffId,
      targetStaffId: memoizedFilters.targetStaffId,
      branchId: memoizedFilters.branchId,
      isExpired: memoizedFilters.isExpired,
      startDate: memoizedFilters.startDate,
      endDate: memoizedFilters.endDate
    };

    const response = await rescheduleApi.getMyRescheduleRequests(apiParams);

    if (response.success) {
      setRequests(response.data.data);
    } else {
      setError(response.message || 'Failed to fetch reschedule requests');
      toast.error(t('reschedule.fetch_error'));
    }
    setLoading(false);
  }, [memoizedFilters, t]);

  const refetch = useCallback(async () => {
    await fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Add realtime update
  useRescheduleRealtime(refetch);

  return {
    data: requests,
    loading,
    error,
    refetch
  };
};

/**
 * Hook to fetch all reschedule requests for approval (Owner/Manager)
 * Only makes API call if user has permission
 */
export const useAllRescheduleRequestsForApproval = (
  filters: RescheduleRequestFilters = {},
  enabled: boolean = true
): UseDataReturn<RescheduleRequest> => {
  const [requests, setRequests] = useState<RescheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  // Memoize filters to prevent infinite re-renders
  const memoizedFilters = useMemo(
    () => ({
      page: filters.page,
      limit: filters.limit,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      status: filters.status,
      swapType: filters.swapType,
      priority: filters.priority,
      requesterStaffId: filters.requesterStaffId,
      targetStaffId: filters.targetStaffId,
      branchId: filters.branchId,
      isExpired: filters.isExpired,
      startDate: filters.startDate,
      endDate: filters.endDate
    }),
    [
      filters.page,
      filters.limit,
      filters.sortBy,
      filters.sortOrder,
      filters.status,
      filters.swapType,
      filters.priority,
      filters.requesterStaffId,
      filters.targetStaffId,
      filters.branchId,
      filters.isExpired,
      filters.startDate,
      filters.endDate
    ]
  );

  const fetchRequests = useCallback(async () => {
    // Don't fetch if not enabled (no permission)
    if (!enabled) {
      setRequests([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Convert RescheduleRequestFilters to RescheduleListParams
    const apiParams = {
      page: memoizedFilters.page,
      limit: memoizedFilters.limit,
      sortBy: memoizedFilters.sortBy as 'createdAt' | 'updatedAt' | 'expiresAt' | 'priority' | undefined,
      sortOrder: memoizedFilters.sortOrder,
      status: memoizedFilters.status,
      swapType: memoizedFilters.swapType,
      priority: memoizedFilters.priority,
      requesterStaffId: memoizedFilters.requesterStaffId,
      targetStaffId: memoizedFilters.targetStaffId,
      branchId: memoizedFilters.branchId,
      isExpired: memoizedFilters.isExpired,
      startDate: memoizedFilters.startDate,
      endDate: memoizedFilters.endDate
    };

    const response = await rescheduleApi.getAllRescheduleRequestsForApproval(apiParams);

    if (response.success) {
      setRequests(response.data.data);
    } else {
      setError(response.message || 'Failed to fetch reschedule requests');
    }
    setLoading(false);
  }, [memoizedFilters, t, enabled]);

  const refetch = useCallback(async () => {
    await fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Add realtime update
  useRescheduleRealtime(refetch);

  return {
    data: requests,
    loading,
    error,
    refetch
  };
};

/**
 * Hook to create a new reschedule request
 */
export const useCreateRescheduleRequest = (): UseCreateReturn<RescheduleRequest, CreateRescheduleRequestDto> => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (data: CreateRescheduleRequestDto) => {
      setLoading(true);
      setError(null);

      const response = await rescheduleApi.createRescheduleRequest(data);

      if (response.success) {
        toast.success(response.message || t('reschedule.create_success'));
        setLoading(false);
        return response.data;
      } else {
        const errorMessage = getRescheduleErrorMessage(
          response.message || 'RESCHEDULE_REQUEST_CREATE_ERROR',
          t,
          'reschedule.create_error'
        );
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        throw new Error(errorMessage);
      }
    },
    [t]
  );

  return {
    create,
    loading,
    error
  };
};

/**
 * Hook to accept a reschedule request
 */
export const useAcceptRescheduleRequest = () => {
  const { t } = useTranslation();

  const acceptRescheduleRequest = useCallback(
    async (requestId: string) => {
      const response = await rescheduleApi.acceptRescheduleRequest(requestId);

      if (response.success) {
        toast.success(response.message || t('reschedule.accept_success'));
        return response.data;
      } else {
        // Don't show toast here - API interceptor already handled it
        throw new Error(response.message || 'Failed to accept reschedule request');
      }
    },
    [t]
  );

  return {
    acceptRescheduleRequest
  };
};

/**
 * Hook to approve a reschedule request
 */
export const useApproveRescheduleRequest = () => {
  const { t } = useTranslation();

  const approveRescheduleRequest = useCallback(
    async (requestId: string, approvedBy: string) => {
      const response = await rescheduleApi.approveRescheduleRequest(requestId, { approvedBy });

      if (response.success) {
        toast.success(response.message || t('reschedule.approve_success'));
        return response.data;
      } else {
        // Don't show toast here - API interceptor already handled it
        throw new Error(response.message || 'Failed to approve reschedule request');
      }
    },
    [t]
  );

  return {
    approveRescheduleRequest
  };
};

/**
 * Hook to reject a reschedule request
 */
export const useRejectRescheduleRequest = () => {
  const { t } = useTranslation();

  const rejectRescheduleRequest = useCallback(
    async (requestId: string, data: RejectRescheduleRequestDto) => {
      const response = await rescheduleApi.rejectRescheduleRequest(requestId, data);

      if (response.success) {
        toast.success(response.message || t('reschedule.reject_success'));
        return response.data;
      } else {
        // Don't show toast here - API interceptor already handled it
        throw new Error(response.message || 'Failed to reject reschedule request');
      }
    },
    [t]
  );

  return {
    rejectRescheduleRequest
  };
};

/**
 * Hook to cancel a reschedule request
 */
export const useCancelRescheduleRequest = () => {
  const { t } = useTranslation();

  const cancelRescheduleRequest = useCallback(
    async (requestId: string) => {
      const response = await rescheduleApi.cancelRescheduleRequest(requestId);

      if (response.success) {
        toast.success(response.message || t('reschedule.cancel_success'));
        return response.data;
      } else {
        // Don't show toast here - API interceptor already handled it
        throw new Error(response.message || 'Failed to cancel reschedule request');
      }
    },
    [t]
  );

  return {
    cancelRescheduleRequest
  };
};

/**
 * Hook to delete a reschedule request
 */
export const useDeleteRescheduleRequest = () => {
  const { t } = useTranslation();

  const deleteRescheduleRequest = useCallback(
    async (requestId: string) => {
      const response = await rescheduleApi.deleteRescheduleRequest(requestId);

      if (response.success) {
        toast.success(response.message || t('reschedule.delete_success'));
        return response.data;
      } else {
        // Don't show toast here - API interceptor already handled it
        throw new Error(response.message || 'Failed to delete reschedule request');
      }
    },
    [t]
  );

  return {
    deleteRescheduleRequest
  };
};
