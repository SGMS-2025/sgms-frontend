import { useState, useEffect, useCallback } from 'react';
import { branchApi } from '@/services/api/branchApi';
import type { BranchWorkingConfig } from '@/types/api/BranchWorkingConfig';
import { socketService } from '@/services/socket/socketService';

export const useBranchWorkingConfig = (branchId?: string) => {
  const [config, setConfig] = useState<BranchWorkingConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!branchId) {
      setConfig(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await branchApi.getBranchWorkingConfig(branchId);
      if (response.success && response.data) {
        setConfig(response.data);
      } else {
        setError(response.message || 'Failed to fetch config');
        setConfig(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (!branchId) return;

    const handleConfigUpdate = (data: { branchId: string; configId: string }) => {
      // Chỉ refetch nếu là config của branch hiện tại
      if (data.branchId === branchId) {
        fetchConfig();
      }
    };

    socketService.on('branch:working-config:updated', handleConfigUpdate);

    return () => {
      socketService.off('branch:working-config:updated', handleConfigUpdate);
    };
  }, [branchId, fetchConfig]);

  const refetch = useCallback(async () => {
    await fetchConfig();
  }, [fetchConfig]);

  return { config, loading, error, refetch };
};
