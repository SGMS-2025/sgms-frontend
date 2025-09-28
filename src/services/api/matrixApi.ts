import { api } from './api';
import type { MatrixResponse, MatrixQueryParams } from '@/types/api/Matrix';

export const matrixApi = {
  /**
   * Get complete matrix view for a branch
   */
  getMatrixForBranch: async (params: MatrixQueryParams): Promise<MatrixResponse> => {
    // Validate branchId
    if (!params.branchId) {
      throw new Error('branchId is required');
    }

    const searchParams = new URLSearchParams();
    searchParams.append('branchId', params.branchId);

    if (params.effectiveDate) {
      searchParams.append('effectiveDate', params.effectiveDate);
    }

    if (params.type) {
      searchParams.append('type', params.type);
    }

    const response = await api.get<MatrixResponse>(`/matrix?${searchParams.toString()}`);
    return response.data;
  },

  /**
   * Save matrix changes for a branch
   */
  saveMatrixChanges: async (
    branchId: string,
    changes: Record<
      string,
      {
        features?: Record<string, { isIncluded: boolean | null }>;
      }
    >
  ): Promise<{ success: boolean; message: string }> => {
    if (!branchId) {
      throw new Error('branchId is required');
    }
    const response = await api.post('/matrix/save', { branchId, changes });
    return response.data;
  }
};
