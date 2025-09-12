import { useState, useEffect, useCallback } from 'react';
import { branchApi } from '@/services/api/branchApi';
import { convertBranchToDisplay } from '@/utils/branchUtils';
import type {
  Branch,
  BranchListParams,
  GymCardData,
  BranchDisplay,
  UseMyBranchesResult,
  BackendPaginationResponse
} from '@/types/api/Branch';

interface UseBranchesResult {
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
      data: { data: { branches: [], pagination: null } }
    }));

    if (response.success && response.data?.data?.branches) {
      const displayBranches = response.data.data.branches.map(convertBranchToDisplay);
      setBranches(displayBranches);
      setPagination(response.data.data.pagination);
    } else {
      setError(response.message || 'Không thể tải danh sách chi nhánh');
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
