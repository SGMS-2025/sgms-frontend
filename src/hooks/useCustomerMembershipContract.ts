import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { membershipApi } from '@/services/api/membershipApi';
import { socketService } from '@/services/socket/socketService';
import type { MembershipContract } from '@/types/api/Membership';
import { handleAsyncOperationWithCallbacks } from '@/utils/errorHandler';
import type { MembershipContractUpdateEvent } from '@/types/api/Socket';

interface UseCustomerMembershipContractOptions {
  branchId?: string;
  enabled?: boolean;
}

interface UseCustomerMembershipContractResult {
  contract: MembershipContract | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const VALID_STATUSES: Array<MembershipContract['status']> = ['PENDING_ACTIVATION', 'ACTIVE', 'PAST_DUE'];

export const useCustomerMembershipContract = (
  options: UseCustomerMembershipContractOptions
): UseCustomerMembershipContractResult => {
  const { branchId, enabled = true } = options;
  const [contract, setContract] = useState<MembershipContract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchContract = useCallback(async () => {
    if (!enabled || !branchId) {
      return;
    }

    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);

    await handleAsyncOperationWithCallbacks(
      async () => {
        const response = await membershipApi.getMyMembershipContracts({ branchId });
        return { success: true, data: response };
      },
      (data) => {
        if (!isMountedRef.current) return;

        const matchingContract = (data || [])
          ?.filter((item) => item.branchId === branchId)
          .find((item) => VALID_STATUSES.includes(item.status));

        setContract(matchingContract || null);
      },
      (error) => {
        if (!isMountedRef.current) return;
        const message = error instanceof Error ? error.message : 'Không thể tải hợp đồng thành viên';
        setError(message);
        setContract(null);
      }
    );

    if (isMountedRef.current) {
      setLoading(false);
    }
  }, [branchId, enabled]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  useEffect(() => {
    if (!branchId) return;

    // Debounce refetch to prevent excessive API calls
    let debounceTimeout: NodeJS.Timeout | null = null;

    const handleMembershipContractUpdate = (data: MembershipContractUpdateEvent) => {
      // Check if this update is for the current branch
      if (data.branchId && data.branchId.toString() === branchId.toString()) {
        // Debounce refetch - wait 500ms after last event before refetching
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }

        debounceTimeout = setTimeout(() => {
          void fetchContract();
        }, 500);
      }
    };

    // Listen for membership contract update events from socket
    socketService.on('membership:contract:updated', handleMembershipContractUpdate);

    return () => {
      socketService.off('membership:contract:updated', handleMembershipContractUpdate);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [branchId, fetchContract]);

  return useMemo(
    () => ({
      contract,
      loading,
      error,
      refetch: fetchContract
    }),
    [contract, loading, error, fetchContract]
  );
};
