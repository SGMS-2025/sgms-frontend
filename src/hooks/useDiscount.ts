import { useState, useEffect, useCallback } from 'react';
import { discountCampaignApi } from '@/services/api/discountApi';
import type {
  DiscountCampaign,
  DiscountCampaignListParams,
  UseDiscountCampaignListReturn,
  DiscountCampaignStats,
  DiscountCampaignStatus
} from '@/types/api/Discount';

export const useDiscountCampaignList = (
  initialParams: DiscountCampaignListParams = {}
): UseDiscountCampaignListReturn => {
  const [campaigns, setCampaigns] = useState<DiscountCampaign[]>([]);
  const [stats] = useState<DiscountCampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseDiscountCampaignListReturn['pagination']>(null);
  const [params, setParams] = useState<DiscountCampaignListParams>(initialParams);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);

    const requestParams = {
      page: 1,
      limit: 20,
      ...params,
      ...(statusFilter && statusFilter !== 'all' && { status: statusFilter as DiscountCampaignStatus })
    };

    try {
      const response = await discountCampaignApi.getCampaignList(requestParams);

      if (response.success) {
        setCampaigns(response.data.campaigns || []);

        // Transform pagination data to match frontend interface
        const paginationData = response.data.pagination;
        const transformedPagination = {
          currentPage: paginationData.currentPage,
          totalPages: paginationData.totalPages,
          totalItems: paginationData.totalItems,
          itemsPerPage: paginationData.itemsPerPage
        };
        setPagination(transformedPagination);
      } else {
        setError(response.message || 'Failed to fetch discount campaigns');
      }
    } catch {
      setError('Failed to fetch discount campaigns');
    } finally {
      setLoading(false);
    }
  }, [params, statusFilter]);

  const refetch = useCallback(async () => {
    await fetchCampaigns();
  }, [fetchCampaigns]);

  const updateFilters = useCallback((newFilters: Partial<DiscountCampaignListParams>) => {
    setParams((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    campaigns,
    stats,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    goToPage,
    statusFilter,
    setStatusFilter
  };
};

// Hook for discount campaign stats only
export const useDiscountCampaignStats = () => {
  const [stats, setStats] = useState<DiscountCampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Assuming there's a stats endpoint, if not, we can calculate from campaigns
      const response = await discountCampaignApi.getCampaignList({ limit: 1000 });

      if (response.success) {
        const campaigns = response.data.campaigns;
        const calculatedStats = {
          totalCampaigns: campaigns.length,
          activeCampaigns: campaigns.filter((c) => c.status === 'ACTIVE').length,
          expiredCampaigns: campaigns.filter((c) => c.status === 'EXPIRED').length,
          pendingCampaigns: campaigns.filter((c) => c.status === 'PENDING').length
        };
        setStats(calculatedStats);
      } else {
        setError(response.message || 'Failed to fetch discount campaign stats');
      }
    } catch {
      setError('Failed to fetch discount campaign stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};

// Hook for getting campaign details by ID
export const useDiscountCampaignDetails = (campaignId: string | null) => {
  const [campaignDetails, setCampaignDetails] = useState<DiscountCampaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaignDetails = useCallback(async () => {
    if (!campaignId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await discountCampaignApi.getCampaignById(campaignId);

      if (response.success) {
        setCampaignDetails(response.data);
      } else {
        setError(response.message || 'Failed to fetch campaign details');
      }
    } catch {
      setError('Failed to fetch campaign details');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  const refetch = useCallback(async () => {
    await fetchCampaignDetails();
  }, [fetchCampaignDetails]);

  return {
    campaignDetails,
    loading,
    error,
    refetch
  };
};

// Hook for creating new campaign
export const useCreateDiscountCampaign = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCampaign = useCallback(async (campaignData: Partial<DiscountCampaign>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await discountCampaignApi.createCampaign(campaignData);

      if (response.success) {
        setLoading(false);
        return response.data;
      } else {
        setError(response.message || 'Failed to create campaign');
        setLoading(false);
        throw new Error(response.message || 'Failed to create campaign');
      }
    } catch (err) {
      setError('Failed to create campaign');
      setLoading(false);
      throw err;
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createCampaign,
    loading,
    error,
    resetError
  };
};

// Hook for updating campaign
export const useUpdateDiscountCampaign = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCampaign = useCallback(async (campaignId: string, updateData: Partial<DiscountCampaign>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await discountCampaignApi.updateCampaign(campaignId, updateData);

      if (response.success) {
        setLoading(false);
        return response.data;
      } else {
        setError(response.message || 'Failed to update campaign');
        setLoading(false);
        throw new Error(response.message || 'Failed to update campaign');
      }
    } catch (err) {
      setError('Failed to update campaign');
      setLoading(false);
      throw err;
    }
  }, []);

  return {
    updateCampaign,
    loading,
    error
  };
};

// Hook for deleting campaign
export const useDeleteDiscountCampaign = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteCampaign = useCallback(async (campaignId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await discountCampaignApi.deleteCampaign(campaignId);

      if (response.success) {
        setLoading(false);
        return response.data;
      } else {
        setError(response.message || 'Failed to delete campaign');
        setLoading(false);
        throw new Error(response.message || 'Failed to delete campaign');
      }
    } catch (err) {
      setError('Failed to delete campaign');
      setLoading(false);
      throw err;
    }
  }, []);

  return {
    deleteCampaign,
    loading,
    error
  };
};
