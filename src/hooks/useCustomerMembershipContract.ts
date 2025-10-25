import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { membershipApi } from '@/services/api/membershipApi';
import type { MembershipContract } from '@/types/api/Membership';

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

    try {
      const response = await membershipApi.getMyMembershipContracts({ branchId });

      if (!isMountedRef.current) return;

      const matchingContract = (response || [])
        ?.filter((item) => item.branchId === branchId)
        .find((item) => VALID_STATUSES.includes(item.status));

      setContract(matchingContract || null);
    } catch (fetchError) {
      if (!isMountedRef.current) return;
      const message = fetchError instanceof Error ? fetchError.message : 'Không thể tải hợp đồng thành viên';
      setError(message);
      setContract(null);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [branchId, enabled]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

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
