import { useState, useEffect } from 'react';
import { branchApi } from '@/services/api/branchApi';
import type { BranchWorkingConfig } from '@/types/api/BranchWorkingConfig';

export const useBranchWorkingConfig = (branchId?: string) => {
  const [config, setConfig] = useState<BranchWorkingConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!branchId) {
      setConfig(null);
      return;
    }

    const fetchConfig = async () => {
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
    };

    fetchConfig();
  }, [branchId]);

  return { config, loading, error };
};
