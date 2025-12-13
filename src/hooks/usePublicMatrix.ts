import { useState, useEffect, useCallback } from 'react';
import { matrixApi } from '@/services/api/matrixApi';
import type { MatrixResponse } from '@/types/api/Matrix';
import { convertMatrixToLegacyFormat } from '@/utils/matrixUtils';

export function usePublicMatrix(branchId: string | undefined, serviceType?: 'PT' | 'CLASS') {
  const [matrixData, setMatrixData] = useState<MatrixResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMatrix = useCallback(async () => {
    if (!branchId) {
      setMatrixData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await matrixApi.getMatrixForBranch(
        {
          branchId,
          type: serviceType
        },
        true // Use public endpoint
      );

      if (response?.success && response?.data) {
        setMatrixData(response.data);
      } else {
        setMatrixData(null);
        setError(response?.message || 'Failed to load matrix');
      }
    } catch (err) {
      setMatrixData(null);
      setError(err instanceof Error ? err.message : 'Failed to load matrix');
    } finally {
      setLoading(false);
    }
  }, [branchId, serviceType]);

  useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  // Convert to display format
  const displayData = matrixData ? convertMatrixToLegacyFormat(matrixData) : null;

  return {
    matrixData,
    displayData,
    loading,
    error,
    refetch: loadMatrix
  };
}
