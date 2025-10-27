import { useCallback, useEffect, useMemo, useState } from 'react';
import { membershipApi } from '@/services/api/membershipApi';
import type {
  MembershipPlanListParams,
  MembershipPlanListResponse,
  PublicMembershipPlanParams,
  MembershipPlan
} from '@/types/api/Membership';
import type { BackendPaginationResponse } from '@/types/api/Branch';

interface UseMembershipPlansOptions {
  initialParams?: MembershipPlanListParams;
  enabled?: boolean;
  resourceBranchIds?: string[];
}

interface UseMembershipPlansResult {
  plans: MembershipPlanListResponse['plans'];
  pagination: MembershipPlanListResponse['pagination'] | null;
  loading: boolean;
  error: string | null;
  params: MembershipPlanListParams;
  setParams: (updater: Partial<MembershipPlanListParams>) => void;
  refetch: () => Promise<void>;
}

const DEFAULT_PARAMS: MembershipPlanListParams = {
  page: 1,
  limit: 10,
  sortBy: 'updatedAt',
  sortOrder: 'desc'
};

export const useMembershipPlans = (options: UseMembershipPlansOptions = {}): UseMembershipPlansResult => {
  const { initialParams, enabled = true, resourceBranchIds = [] } = options;
  const [params, setInternalParams] = useState<MembershipPlanListParams>({
    ...DEFAULT_PARAMS,
    ...(initialParams ?? {})
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<MembershipPlanListResponse['plans']>([]);
  const [pagination, setPagination] = useState<MembershipPlanListResponse['pagination'] | null>(null);

  const fetchPlans = useCallback(async () => {
    if (!enabled) {
      return;
    }

    if (resourceBranchIds.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    const response = await membershipApi.getMembershipPlans(params, resourceBranchIds);
    if (response.success) {
      setPlans(response.data.plans);
      setPagination(response.data.pagination);
    } else {
      setError(response.message ?? 'Unable to load membership plans');
    }

    setLoading(false);
  }, [enabled, JSON.stringify(params), JSON.stringify(resourceBranchIds)]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSetParams = useCallback((updater: Partial<MembershipPlanListParams>) => {
    setInternalParams((prev) => ({
      ...prev,
      ...updater,
      page: updater.page ?? prev.page ?? 1
    }));
  }, []);

  return useMemo(
    () => ({
      plans,
      pagination,
      loading,
      error,
      params,
      setParams: handleSetParams,
      refetch: fetchPlans
    }),
    [error, fetchPlans, handleSetParams, loading, pagination, params, plans]
  );
};

interface UsePublicMembershipPlansOptions {
  enabled?: boolean;
}

interface UsePublicMembershipPlansResult {
  plans: MembershipPlan[];
  pagination: BackendPaginationResponse | null;
  loading: boolean;
  error: string | null;
  refetch: (override?: Partial<PublicMembershipPlanParams>) => Promise<void>;
}

export const usePublicMembershipPlans = (
  params: PublicMembershipPlanParams,
  options: UsePublicMembershipPlansOptions = {}
): UsePublicMembershipPlansResult => {
  const { enabled = true } = options;
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<BackendPaginationResponse | null>(null);

  // Memoize params to prevent unnecessary re-fetches
  const memoizedParams = useMemo(() => params, [params.branchId]);

  const fetchPlans = useCallback(
    async (override: Partial<PublicMembershipPlanParams> = {}) => {
      if (!enabled || !memoizedParams.branchId) {
        return;
      }

      setLoading(true);
      setError(null);

      const response = await membershipApi.getPublicMembershipPlans({ ...memoizedParams, ...override });
      if (response.success) {
        const { plans: fetchedPlans = [], pagination: fetchedPagination = null } = response.data ?? {};
        setPlans(Array.isArray(fetchedPlans) ? fetchedPlans : []);
        setPagination(fetchedPagination);
      } else {
        setError(response.message ?? 'Không thể tải gói membership');
      }

      setLoading(false);
    },
    [enabled, memoizedParams]
  );

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    pagination,
    loading,
    error,
    refetch: fetchPlans
  };
};
