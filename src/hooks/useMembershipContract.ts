import { useCallback, useEffect, useRef, useState } from 'react';
import { membershipApi } from '@/services/api/membershipApi';
import type {
  CreatePublicMembershipContractPayload,
  CreatePublicMembershipContractResponse,
  CreatePublicMembershipContractPayOSPayload,
  CreatePublicMembershipContractPayOSResponse
} from '@/types/api/Membership';

interface UseCreatePublicMembershipContractResult {
  createContract: (
    payload: CreatePublicMembershipContractPayload
  ) => Promise<CreatePublicMembershipContractResponse | null>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Hook để tạo hợp đồng membership từ phía khách hàng (public flow).
 * Đảm bảo không setState sau khi component unmount bằng cách dùng ref.
 */
export const useCreatePublicMembershipContract = (): UseCreatePublicMembershipContractResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const createContract = useCallback(
    async (payload: CreatePublicMembershipContractPayload): Promise<CreatePublicMembershipContractResponse | null> => {
      if (!isMountedRef.current) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await membershipApi.createPublicMembershipContract(payload);

        if (!isMountedRef.current) return null;

        if (response.success) {
          return response.data;
        }

        const message = response.message ?? 'Không thể tạo hợp đồng membership';
        setError(message);
        throw new Error(message);
      } catch (err) {
        if (!isMountedRef.current) return null;

        const message = err instanceof Error ? err.message : 'Không thể tạo hợp đồng membership';
        setError(message);
        throw err;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  const reset = useCallback(() => {
    if (!isMountedRef.current) return;
    setError(null);
  }, []);

  return {
    createContract,
    loading,
    error,
    reset
  };
};

interface UseCreatePublicMembershipContractPayOSResult {
  createContractPayOS: (
    payload: CreatePublicMembershipContractPayOSPayload
  ) => Promise<CreatePublicMembershipContractPayOSResponse | null>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Hook để tạo hợp đồng membership với PayOS từ phía khách hàng (public flow).
 * Đảm bảo không setState sau khi component unmount bằng cách dùng ref.
 */
export const useCreatePublicMembershipContractPayOS = (): UseCreatePublicMembershipContractPayOSResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const createContractPayOS = useCallback(
    async (
      payload: CreatePublicMembershipContractPayOSPayload
    ): Promise<CreatePublicMembershipContractPayOSResponse | null> => {
      if (!isMountedRef.current) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await membershipApi.createPublicMembershipContractPayOS(payload);

        if (!isMountedRef.current) return null;

        if (response.success) {
          return response.data;
        }

        const message = response.message ?? 'Không thể tạo hợp đồng membership với PayOS';
        setError(message);
        throw new Error(message);
      } catch (err) {
        if (!isMountedRef.current) return null;

        const message = err instanceof Error ? err.message : 'Không thể tạo hợp đồng membership với PayOS';
        setError(message);
        throw err;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  const reset = useCallback(() => {
    if (!isMountedRef.current) return;
    setError(null);
  }, []);

  return {
    createContractPayOS,
    loading,
    error,
    reset
  };
};
