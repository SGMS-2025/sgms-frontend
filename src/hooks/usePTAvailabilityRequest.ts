import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ptAvailabilityRequestApi } from '@/services/api/ptAvailabilityRequestApi';
import type {
  PTAvailabilityRequest,
  PTAvailabilityRequestStats,
  PTAvailabilityRequestListParams,
  CreatePTAvailabilityRequestRequest,
  CreatePTAvailabilityRequestResponse,
  ApprovePTAvailabilityRequestRequest,
  RejectPTAvailabilityRequestRequest,
  UsePTAvailabilityRequestListReturn
} from '@/types/api/PTAvailabilityRequest';

export const usePTAvailabilityRequestList = (
  initialParams: PTAvailabilityRequestListParams = {}
): UsePTAvailabilityRequestListReturn => {
  const [requests, setRequests] = useState<PTAvailabilityRequest[]>([]);
  const [stats, setStats] = useState<PTAvailabilityRequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UsePTAvailabilityRequestListReturn['pagination']>(null);
  const [params, setParams] = useState<PTAvailabilityRequestListParams>(initialParams);
  const { t } = useTranslation();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const requestParams = {
        ...params,
        limit: params.limit ?? 10
      };

      const { page: _page, limit: _limit, ...statsParams } = params;

      // Fetch requests and stats in parallel
      const [requestsResponse, statsResponse] = await Promise.all([
        ptAvailabilityRequestApi.getRequests(requestParams),
        ptAvailabilityRequestApi.getStats(statsParams)
      ]);

      if (requestsResponse.success) {
        setRequests(requestsResponse.data.data);
        setPagination(requestsResponse.data.pagination);
      } else {
        setError(requestsResponse.message || 'Failed to fetch PT availability requests');
        toast.error(requestsResponse.message || t('pt_availability.fetch_error', 'Failed to fetch requests'));
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error(t('pt_availability.fetch_error', 'Failed to fetch requests'));
    } finally {
      setLoading(false);
    }
  }, [params, t]);

  const refetch = useCallback(async () => {
    await fetchRequests();
  }, [fetchRequests]);

  const updateFilters = useCallback((newFilters: Partial<PTAvailabilityRequestListParams>) => {
    setParams((prev) => ({ ...prev, ...newFilters, page: 1 })); // Reset to page 1 when filters change
  }, []);

  const goToPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Listen for real-time notifications
  useEffect(() => {
    const handleRealtimeNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const notification = customEvent.detail;

      if (notification.category === 'PT_AVAILABILITY' || notification.type?.includes('pt_availability')) {
        setTimeout(() => {
          refetch();
        }, 500);
      }
    };

    const handlePTAvailabilityUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;

      // Refetch when PT availability request is created, approved, or rejected
      if (data?.data?.requestId) {
        setTimeout(() => {
          refetch();
        }, 500);
      }
    };

    globalThis.addEventListener('realtime-notification', handleRealtimeNotification);
    globalThis.addEventListener('pt-availability:updated', handlePTAvailabilityUpdate);

    return () => {
      globalThis.removeEventListener('realtime-notification', handleRealtimeNotification);
      globalThis.removeEventListener('pt-availability:updated', handlePTAvailabilityUpdate);
    };
  }, [refetch]);

  return {
    requests,
    stats,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    goToPage
  };
};

export const usePTAvailabilityRequestOperations = () => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const createRequest = useCallback(
    async (data: CreatePTAvailabilityRequestRequest): Promise<CreatePTAvailabilityRequestResponse | null> => {
      setLoading(true);
      try {
        const response = await ptAvailabilityRequestApi.createRequest(data);
        if (response.success) {
          toast.success(
            response.message || t('pt_availability.create_success', 'PT availability request created successfully')
          );
          return response.data;
        } else {
          // API interceptor already shows toast for 400 errors
          // Check if response has statusCode property (error response from interceptor)
          const errorResponse = response as { statusCode?: number; message: string; success: false };
          if (errorResponse.statusCode !== 400) {
            toast.error(response.message || t('pt_availability.create_error', 'Failed to create request'));
          }
          return null;
        }
      } catch (err) {
        // Interceptor handles most errors and shows toast
        // Only show toast here for unexpected errors (network errors, etc.)
        // Check if error has response property (AxiosError) - if so, interceptor handled it
        const axiosError = err as { response?: { status?: number } };
        if (!axiosError.response) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          toast.error(errorMessage);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  const approveRequest = useCallback(
    async (id: string, data?: ApprovePTAvailabilityRequestRequest): Promise<PTAvailabilityRequest | null> => {
      setLoading(true);
      try {
        const response = await ptAvailabilityRequestApi.approveRequest(id, data);
        if (response.success) {
          toast.success(response.message || t('pt_availability.approve_success', 'Request approved successfully'));
          return response.data;
        } else {
          toast.error(response.message || t('pt_availability.approve_error', 'Failed to approve request'));
          return null;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        toast.error(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  const rejectRequest = useCallback(
    async (id: string, data: RejectPTAvailabilityRequestRequest): Promise<PTAvailabilityRequest | null> => {
      setLoading(true);
      try {
        const response = await ptAvailabilityRequestApi.rejectRequest(id, data);
        if (response.success) {
          toast.success(response.message || t('pt_availability.reject_success', 'Request rejected successfully'));
          return response.data;
        } else {
          toast.error(response.message || t('pt_availability.reject_error', 'Failed to reject request'));
          return null;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        toast.error(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  return {
    createRequest,
    approveRequest,
    rejectRequest,
    loading
  };
};
