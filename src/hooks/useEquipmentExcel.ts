import { useState, useCallback } from 'react';
import { equipmentApi } from '@/services/api/equipmentApi';
import type { ExcelImportResult } from '@/types/api/Equipment';
import type { ApiResponse } from '@/types/api/Api';

// Hook for Excel operations
export const useEquipmentExcel = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadTemplate = useCallback(async () => {
    setLoading(true);
    setError(null);

    const blob = await equipmentApi.downloadEquipmentTemplate().catch(() => {
      setError('Failed to download template');
      setLoading(false);
      return null;
    });

    if (blob) {
      setLoading(false);
      return blob;
    }

    return null;
  }, []);

  const importFromExcel = useCallback(async (file: File, branchId: string): Promise<ExcelImportResult | null> => {
    setLoading(true);
    setError(null);

    const response = await equipmentApi.importEquipmentFromExcel(file, branchId).catch((error) => {
      console.error('Excel import error:', error);
      console.error('Error response data:', error.response?.data);

      // Handle specific error types
      if (error.code === 'ERR_UPLOAD_FILE_CHANGED') {
        setError('File was modified during upload. Please try again.');
        setLoading(false);
        return null;
      } else if (error.response?.status === 401) {
        setError('Session expired. Please refresh the page and try again.');
        setLoading(false);
        return null;
      } else if (error.response?.status === 413) {
        setError('File too large. Please use a smaller file.');
        setLoading(false);
        return null;
      } else if (error.code === 'ECONNABORTED') {
        setError('Upload timeout. Please try again with a smaller file.');
        setLoading(false);
        return null;
      } else if (error.response?.status === 400) {
        // Handle Excel validation errors - return error data instead of setting error state
        const errorData = error.response.data;
        const validationErrors = errorData?.error?.meta?.errors || errorData?.meta?.errors || [];

        if (validationErrors.length > 0) {
          // Return error data so modal can display detailed errors
          setLoading(false);
          const errorResult: ExcelImportResult = {
            successCount: 0,
            errorCount: validationErrors.length,
            errors: validationErrors,
            totalCount: errorData?.error?.meta?.totalCount || errorData?.meta?.totalCount || 0,
            importedEquipment: []
          };
          return errorResult;
        } else {
          setError('Excel file contains validation errors. Please check the data format.');
          setLoading(false);
          return null;
        }
      } else {
        setError('Network error: Failed to import equipment from Excel');
        setLoading(false);
        return null;
      }
    });

    // If response is from catch block (error data), return it directly
    if (response && typeof response === 'object' && 'successCount' in response) {
      return response as ExcelImportResult;
    }

    // Handle ApiResponse<ExcelImportResult>
    if (response && 'success' in response && response.success) {
      setLoading(false);
      return (response as ApiResponse<ExcelImportResult>).data;
    } else if (response && 'success' in response) {
      // For non-success ApiResponse, return error data
      setLoading(false);
      const apiResponse = response as ApiResponse<ExcelImportResult>;
      return {
        successCount: 0,
        errorCount: 1,
        errors: [
          {
            row: 0,
            equipmentName: 'Unknown',
            errors: [apiResponse.message || 'Failed to import equipment from Excel']
          }
        ],
        totalCount: 0,
        importedEquipment: []
      } as ExcelImportResult;
    }

    return null;
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    downloadTemplate,
    importFromExcel,
    loading,
    error,
    resetError
  };
};
