import { useState, useEffect, useCallback, useRef } from 'react';
import { branchApi } from '@/services/api/branchApi';
import { convertBranchToDisplay } from '@/utils/branchUtils';
import type {
  Branch,
  BranchListParams,
  MyBranchesApiResponse,
  GymCardData,
  BranchDisplay,
  UseMyBranchesResult,
  BackendPaginationResponse
} from '@/types/api/Branch';

/**
 * Hook result interface for useBranches
 */
export interface UseBranchesResult {
  branches: Branch[];
  gymCards: GymCardData[];
  loading: boolean;
  error: string | null;
  pagination: BackendPaginationResponse | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage branches data
 */
export const useBranches = (params?: BranchListParams): UseBranchesResult => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseBranchesResult['pagination']>(null);

  // Convert Branch to GymCardData for UI display
  const convertToGymCards = (branches: Branch[]): GymCardData[] => {
    const colors: Array<'orange' | 'green' | 'purple'> = ['orange', 'green', 'purple'];

    return branches.map((branch, index) => ({
      id: branch._id,
      name: branch.branchName,
      description: branch.description ?? 'Phòng tập chuyên nghiệp với dịch vụ tốt nhất',
      image: branch.coverImage ?? 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', // Ô lớn: coverImage
      logo: branch.images[0] ?? 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100', // Ô nhỏ: images[0]
      features: branch.facilities.slice(0, 4), // Limit to 4 features for UI
      address: branch.location,
      hours: branch.openingHours,
      rating: branch.rating,
      totalReviews: branch.totalReviews,
      color: colors[index % colors.length],
      tag: 'Gym'
    }));
  };

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await branchApi.getBranches(params).catch(() => ({
      success: false,
      message: 'Network error - Không thể tải danh sách phòng tập',
      data: { branches: [], pagination: null }
    }));

    if (response.success && response.data) {
      setBranches(response.data.branches);
      setPagination(response.data.pagination);
    } else {
      setError(response.message || 'Không thể tải danh sách phòng tập');
    }

    setLoading(false);
  }, [params]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]); // Re-fetch when fetchBranches changes

  const gymCards = convertToGymCards(branches);

  return {
    branches,
    gymCards,
    loading,
    error,
    pagination,
    refetch: fetchBranches
  };
};

/**
 * Hook for owner's branches (my branches)
 */
export const useMyBranches = (params?: BranchListParams): UseMyBranchesResult => {
  const [branches, setBranches] = useState<BranchDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseMyBranchesResult['pagination']>(null);

  const fetchMyBranches = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await branchApi.getMyBranches(params).catch(() => ({
      success: false,
      message: 'Network error - Không thể tải danh sách chi nhánh',
      data: {
        branches: [],
        pagination: null
      }
    }));

    if (response.success && response.data) {
      // Handle both cases: branches array exists or is empty
      const branchesArray = response.data.branches || [];
      const displayBranches = branchesArray.map(convertBranchToDisplay);
      setBranches(displayBranches);
      setPagination(response.data.pagination || null);
    } else {
      setError(response.message || 'Không thể tải danh sách chi nhánh');
      setBranches([]);
    }

    setLoading(false);
  }, [params]);

  useEffect(() => {
    fetchMyBranches();
  }, [fetchMyBranches]);

  return {
    branches,
    loading,
    error,
    pagination,
    refetch: fetchMyBranches
  };
};

/**
 * Hook specifically for landing page top gyms
 */
export const useTopGyms = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopGyms = async () => {
    setLoading(true);
    setError(null);

    const response = await branchApi.getTopGyms().catch(() => ({
      success: false,
      message: 'Network error - Failed to fetch top gyms',
      data: { branches: [] }
    }));

    if (response.success && response.data) {
      setBranches(response.data.branches);
    } else {
      setError(response.message || 'Failed to fetch top gyms');
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTopGyms();
  }, []);

  // Convert to gym cards for UI
  const colors: Array<'orange' | 'green' | 'purple'> = ['orange', 'green', 'purple'];
  const gymCards: GymCardData[] = branches.map((branch, index) => ({
    id: branch._id,
    name: branch.branchName,
    description: branch.description ?? 'Phòng tập chuyên nghiệp với dịch vụ tốt nhất',
    image: branch.coverImage ?? 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', // Ô lớn: coverImage
    logo: branch.images[0] ?? 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100', // Ô nhỏ: images[0]
    features: branch.facilities.slice(0, 4),
    address: branch.location,
    hours: branch.openingHours,
    rating: branch.rating,
    totalReviews: branch.totalReviews,
    color: colors[index % colors.length],
    tag: 'Gym'
  }));

  return {
    branches,
    gymCards,
    loading,
    error,
    refetch: fetchTopGyms
  };
};

/**
 * Hook for attendance page - only fetch branches when logged in
 */
export const useAttendanceBranches = (isLoggedIn: boolean): UseMyBranchesResult => {
  const [branches, setBranches] = useState<BranchDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseMyBranchesResult['pagination']>(null);

  const fetchBranches = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false);
      setBranches([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const response = (await branchApi.getMyBranches({}).catch(() => ({
      success: false,
      message: 'Network error - Không thể tải danh sách chi nhánh',
      data: {
        branches: [],
        pagination: null
      }
    }))) as MyBranchesApiResponse;

    if (response.success && response.data?.branches) {
      const displayBranches = response.data.branches.map(convertBranchToDisplay);
      setBranches(displayBranches);
      setPagination(response.data.pagination);
    } else {
      setError(response.message || 'Không thể tải danh sách chi nhánh');
    }

    setLoading(false);
  }, [isLoggedIn]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  return {
    branches,
    loading,
    error,
    pagination,
    refetch: fetchBranches
  };
};

/**
 * Hook for fetching single branch detail
 */
export const useBranchDetail = (branchId: string) => {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(false);

  const fetchBranchDetail = useCallback(async () => {
    if (!branchId) {
      if (!isMountedRef.current) return;
      setError('Branch ID is required');
      setLoading(false);
      return;
    }

    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);

    const response = await branchApi.getBranchDetail(branchId).catch(() => ({
      success: false,
      message: 'Network error - Không thể tải thông tin phòng tập',
      data: null
    }));

    if (!isMountedRef.current) return;

    if (response.success && response.data) {
      setBranch(response.data);
    } else {
      setError(response.message || 'Không thể tải thông tin phòng tập');
    }

    setLoading(false);
  }, [branchId]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    fetchBranchDetail();
  }, [fetchBranchDetail]);

  // Convert to GymCardData for UI display compatibility
  const gymCardData: GymCardData | null = branch
    ? {
        id: branch._id,
        name: branch.branchName,
        description: branch.description ?? 'Phòng tập chuyên nghiệp với dịch vụ tốt nhất',
        image: branch.coverImage ?? 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
        logo: branch.images[0] ?? 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100',
        features: branch.facilities,
        address: branch.location,
        hours: branch.openingHours,
        rating: branch.rating,
        totalReviews: branch.totalReviews,
        color: 'orange' as const,
        tag: 'Gym'
      }
    : null;

  return {
    branch,
    gymCardData,
    loading,
    error,
    refetch: fetchBranchDetail
  };
};
