import { useState, useEffect, useCallback } from 'react';
import { branchApi } from '@/services/api/branchApi';
import type { Branch, BranchListParams, GymCardData } from '@/types/api/Branch';

interface UseBranchesResult {
  branches: Branch[];
  gymCards: GymCardData[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
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
    try {
      setLoading(true);
      setError(null);

      // Add minimum loading time for better UX (prevent flash)
      const startTime = Date.now();

      const response = await branchApi.getBranches(params);

      // Ensure minimum 300ms loading time for smooth UX
      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 300;

      if (elapsedTime < minLoadingTime) {
        await new Promise((resolve) => setTimeout(resolve, minLoadingTime - elapsedTime));
      }

      if (response.success) {
        setBranches(response.data.branches);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || 'Không thể tải danh sách phòng tập');
      }
    } catch (err) {
      console.error('Error fetching branches:', err);

      // Better error messages in Vietnamese
      let errorMessage = 'Đã xảy ra lỗi khi tải dữ liệu';

      if (err instanceof Error) {
        if (err.message.includes('Network Error') || err.message.includes('fetch')) {
          errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Kết nối quá chậm. Vui lòng thử lại sau.';
        } else if (err.message.includes('500')) {
          errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau ít phút.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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
 * Hook specifically for landing page top gyms
 */
export const useTopGyms = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopGyms = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await branchApi.getTopGyms();

      if (response.success) {
        setBranches(response.data.branches);
      } else {
        setError(response.message || 'Failed to fetch top gyms');
      }
    } catch (err) {
      console.error('Error fetching top gyms:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching top gyms');
    } finally {
      setLoading(false);
    }
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
