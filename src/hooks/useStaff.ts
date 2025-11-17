import { useState, useEffect, useCallback } from 'react';
import { staffApi } from '@/services/api/staffApi';
import { createErrorWithMeta } from './utils/apiErrorHandler';
import type { FailedApiResponse } from './utils/apiErrorHandler';
import type {
  Staff,
  StaffStats,
  StaffDisplay,
  StaffListParams,
  UseStaffListReturn,
  StaffUpdateData,
  CreateStaffRequest,
  StaffImportResult
} from '@/types/api/Staff';

const transformStaffToDisplay = (staff: Staff): StaffDisplay => ({
  id: staff._id,
  userId: staff.userId?._id, // Add userId field
  name: staff.userId?.fullName || staff.userId?.username,
  jobTitle: staff.jobTitle,
  email: staff.userId?.email,
  phone: staff.userId?.phoneNumber || '',
  salary: staff.salary.toLocaleString('vi-VN'),
  branch: staff.branchId.length > 0 ? staff.branchId[0]?.branchName : '', // Primary branch for display
  branches: staff.branchId, // All branches
  status: staff.status,
  selected: staff.selected || false
});

export const useStaffList = (initialParams: StaffListParams = {}): UseStaffListReturn => {
  const [staffList, setStaffList] = useState<StaffDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseStaffListReturn['pagination']>(null);
  const [params, setParams] = useState<StaffListParams>(initialParams);

  const fetchStaffList = useCallback(async () => {
    setLoading(true);
    setError(null);

    const requestParams = {
      limit: 10,
      ...params
    };

    const staffResponse = await staffApi.getStaffList(requestParams);

    // Handle staff list response
    if (staffResponse.success) {
      const transformedStaff = staffResponse.data.staffList.map(transformStaffToDisplay);
      setStaffList(transformedStaff);

      // Transform pagination data to match frontend interface
      const paginationData = staffResponse.data.pagination;
      const transformedPagination = {
        currentPage: paginationData.page,
        totalPages: paginationData.totalPages,
        totalItems: paginationData.total,
        itemsPerPage: paginationData.limit,
        hasNextPage: paginationData.hasNext,
        hasPrevPage: paginationData.hasPrev
      };
      setPagination(transformedPagination);
    } else {
      setError(staffResponse.message || 'Failed to fetch staff list');
    }

    setLoading(false);
  }, [params]);

  const refetch = useCallback(async () => {
    await fetchStaffList();
  }, [fetchStaffList]);

  const updateFilters = useCallback((newFilters: Partial<StaffListParams>) => {
    setParams((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  useEffect(() => {
    fetchStaffList();
  }, [fetchStaffList]);

  return {
    staffList,
    stats: null,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    goToPage
  };
};

// Hook for staff stats only
export const useStaffStats = (params?: { branchId?: string }) => {
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const branchId = params?.branchId;

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await staffApi.getStaffStats(branchId ? { branchId } : undefined);

    if (response.success) {
      setStats(response.data);
    } else {
      setError(response.message || 'Failed to fetch staff stats');
    }

    setLoading(false);
  }, [branchId]);

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

// Hook for getting staff details by ID
export const useStaffDetails = (staffId: string | null) => {
  const [staffDetails, setStaffDetails] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStaffDetails = useCallback(async () => {
    if (!staffId) return;

    setLoading(true);
    setError(null);

    const response = await staffApi.getStaffById(staffId);

    if (response.success) {
      setStaffDetails(response.data);
    } else {
      setError(response.message || 'Failed to fetch staff details');
    }

    setLoading(false);
  }, [staffId]);

  const refetch = useCallback(async () => {
    await fetchStaffDetails();
  }, [fetchStaffDetails]);

  return {
    staffDetails,
    loading,
    error,
    refetch
  };
};

// Hook for getting staff details by userId
export const useStaffDetailsByUserId = (userId: string | null) => {
  const [staffDetails, setStaffDetails] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStaffDetails = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    const response = await staffApi.getStaffByUserId(userId);

    if (response.success) {
      setStaffDetails(response.data);
    } else {
      setError(response.message || 'Failed to fetch staff details');
    }

    setLoading(false);
  }, [userId]);

  const refetch = useCallback(async () => {
    await fetchStaffDetails();
  }, [fetchStaffDetails]);

  useEffect(() => {
    fetchStaffDetails();
  }, [fetchStaffDetails]);

  return {
    staffDetails,
    loading,
    error,
    refetch
  };
};

export const useUpdateStaff = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStaff = useCallback(async (staffId: string, updateData: StaffUpdateData) => {
    setLoading(true);
    setError(null);

    const response = await staffApi.updateStaff(staffId, updateData);

    if (response.success) {
      setLoading(false);
      return response.data;
    } else {
      setError(response.message || 'Failed to update staff');
      setLoading(false);
      return createErrorWithMeta(response as FailedApiResponse, 'Failed to update staff');
    }
  }, []);

  return {
    updateStaff,
    loading,
    error
  };
};

// Hook for creating new staff
export const useCreateStaff = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createStaff = useCallback(async (staffData: CreateStaffRequest, avatar?: File) => {
    setLoading(true);
    setError(null);

    const response = await staffApi.createStaff(staffData, avatar);
    if (response.success) {
      setLoading(false);
      return response.data;
    } else {
      setError(response.message || 'Failed to create staff');
      setLoading(false);
      return createErrorWithMeta(response as FailedApiResponse, 'Failed to create staff');
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createStaff,
    loading,
    error,
    resetError
  };
};

// Hook for updating staff status (automatically sets to DELETED)
export const useUpdateStaffStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStaffStatus = useCallback(async (staffId: string) => {
    setLoading(true);
    setError(null);

    const response = await staffApi.updateStaffStatus(staffId);

    if (response.success) {
      setLoading(false);
      return response.data;
    } else {
      setError(response.message || 'Failed to update staff status');
      setLoading(false);
      throw new Error(response.message || 'Failed to update staff status');
    }
  }, []);

  return {
    updateStaffStatus,
    loading,
    error
  };
};

// Hook for staff Excel import
export const useStaffImport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importStaffs = useCallback(async (file: File, branchId: string): Promise<StaffImportResult> => {
    setLoading(true);
    setError(null);

    try {
      const response = await staffApi.importStaffsFromFile(file, branchId);

      if (response.success) {
        setLoading(false);
        return {
          successCount: response.data?.successCount || 0,
          failedCount: response.data?.failedCount || 0,
          errors: response.data?.errors || [],
          generatedPasswords: response.data?.generatedPasswords || []
        };
      } else {
        const errorMsg = response.message || 'Failed to import staffs';
        setError(errorMsg);
        setLoading(false);
        throw new Error(errorMsg);
      }
    } catch (err: unknown) {
      setLoading(false);

      // Handle 500 error for missing required columns
      const errorWithResponse = err as {
        response?: {
          status?: number;
          data?: {
            error?: {
              message?: string;
              meta?: { errors?: unknown[] };
            };
            meta?: { errors?: unknown[] };
          };
        };
      };
      if (errorWithResponse?.response?.status === 500) {
        const errorMessage = errorWithResponse?.response?.data?.error?.message || (err as Error)?.message || '';
        if (errorMessage.includes('Missing required columns')) {
          // Extract missing columns from error message
          const missingColumnsMatch = errorMessage.match(/Missing required columns: (.+)/);
          const missingColumns = missingColumnsMatch
            ? missingColumnsMatch[1].split(', ').map((col: string) => col.trim())
            : [];

          // Create inline error similar to validation errors
          const inlineErrors: StaffImportResult['errors'] = [
            {
              row: 1,
              errorKey: 'staff_import.error_missing_required_columns',
              errorData: { missingColumns: missingColumns.join(', ') }
            }
          ];

          // Return error result so modal can display detailed errors
          return {
            successCount: 0,
            failedCount: inlineErrors.length,
            errors: inlineErrors,
            generatedPasswords: []
          };
        }
      }

      // Handle validation errors (400/422) with detailed errors
      if (errorWithResponse?.response?.status === 400 || errorWithResponse?.response?.status === 422) {
        const errorData = errorWithResponse?.response?.data;
        const validationErrors = errorData?.error?.meta?.errors || errorData?.meta?.errors || [];

        if (validationErrors.length > 0) {
          // Map validation errors to the correct type
          const mappedErrors: StaffImportResult['errors'] = validationErrors.map((error: unknown) => {
            // Type guard to check if error has the expected structure
            if (typeof error === 'object' && error !== null) {
              const errObj = error as Record<string, unknown>;
              return {
                row: typeof errObj.row === 'number' ? errObj.row : 0,
                error: typeof errObj.error === 'string' ? errObj.error : undefined,
                errorKey: typeof errObj.errorKey === 'string' ? errObj.errorKey : undefined,
                errorData:
                  typeof errObj.errorData === 'object' && errObj.errorData !== null
                    ? (errObj.errorData as Record<string, unknown>)
                    : undefined,
                message: typeof errObj.message === 'string' ? errObj.message : undefined,
                field: typeof errObj.field === 'string' ? errObj.field : undefined
              };
            }
            // Fallback for unknown error format
            return {
              row: 0,
              error: String(error)
            };
          });

          // Return error data so modal can display detailed errors
          return {
            successCount: 0,
            failedCount: mappedErrors.length,
            errors: mappedErrors,
            generatedPasswords: []
          };
        }
      }

      throw err;
    }
  }, []);

  const downloadTemplate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const blob = await staffApi.downloadStaffTemplate();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'staff-import-template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to download template');
      throw err;
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    importStaffs,
    downloadTemplate,
    loading,
    error,
    resetError
  };
};
