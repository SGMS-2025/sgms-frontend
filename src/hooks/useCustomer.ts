import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type {
  CustomerDisplay,
  UseCustomerListOptions,
  CustomerPagination,
  UseCustomerListReturn,
  UseUpdateCustomerStatusReturn,
  UseCustomerImportReturn,
  RawCustomerData
} from '@/types/api/Customer';
import { customerApi } from '@/services/api/customerApi';

export const useCustomerList = (options: UseCustomerListOptions = {}): UseCustomerListReturn => {
  const { t } = useTranslation();
  const [customerList, setCustomerList] = useState<CustomerDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<CustomerPagination | null>(null);
  const [params, setParams] = useState<UseCustomerListOptions>(options);

  // Update params when options change
  useEffect(() => {
    setParams(options);
  }, [options.limit, options.page, options.branchId, options.search]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const requestParams = {
      limit: params.limit || 10,
      page: params.page || 1,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
      ...(params.branchId && { branchId: params.branchId }),
      ...(params.search && { search: params.search })
    };

    const response = await customerApi.getCustomerList(requestParams);

    if (response.success) {
      // Transform data to match CustomerDisplay interface
      const transformedCustomers: CustomerDisplay[] = response.data.customers.map((customer: RawCustomerData) => ({
        id: (customer.id || customer._id) as string,
        name: customer.name as string,
        email: customer.email as string,
        phone: customer.phone as string,
        membershipType: customer.membershipType as string,
        membershipStatus: customer.membershipStatus as string,
        joinDate: customer.joinDate as string,
        expiryDate: customer.expiryDate as string,
        totalSpent: customer.totalSpent as string,
        status: customer.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
        branches: (customer.branches || []) as Array<{ _id: string; branchName: string }>,
        // New fields from backend
        serviceName: customer.serviceName as string,
        ptServiceName: customer.ptServiceName as string,
        classServiceName: customer.classServiceName as string,
        contractStartDate: customer.contractStartDate as string,
        contractEndDate: customer.contractEndDate as string,
        referrerStaffName: customer.referrerStaffName as string,
        lastPaymentDate: customer.lastPaymentDate as string,
        createdAt: customer.createdAt as string
      }));

      setCustomerList(transformedCustomers);

      // Transform pagination data
      const paginationData = response.data.pagination;
      setPagination({
        currentPage: paginationData.currentPage,
        totalPages: paginationData.totalPages,
        totalItems: paginationData.totalItems,
        itemsPerPage: paginationData.itemsPerPage,
        hasNextPage: paginationData.hasNextPage,
        hasPrevPage: paginationData.hasPrevPage
      });
    } else {
      setError(response.message || t('customer.error.failed_to_fetch'));
    }

    setLoading(false);
  }, [params.limit, params.page, params.branchId, params.search, t]);

  const refetch = useCallback(async () => {
    await fetchCustomers();
  }, [fetchCustomers]);

  const goToPage = useCallback((page: number) => {
    // Update params to trigger refetch with new page
    setParams((prev) => ({ ...prev, page }));
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers, params.branchId, params.page]);

  return {
    customerList,
    loading,
    error,
    pagination,
    refetch,
    goToPage
  };
};

export const useUpdateCustomerStatus = (): UseUpdateCustomerStatusReturn => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCustomerStatus = async (customerId: string) => {
    setLoading(true);
    setError(null);

    const response = await customerApi.updateCustomerStatus(customerId);

    if (response.success) {
      setLoading(false);
      toast.success(response.message || t('customer.error.failed_to_update_status'));
    } else {
      setError(response.message || t('customer.error.failed_to_update_status'));
      setLoading(false);
      throw new Error(response.message || t('customer.error.failed_to_update_status'));
    }
  };

  return {
    updateCustomerStatus,
    loading,
    error
  };
};

// Hook for customer Excel import

export const useCustomerImport = (): UseCustomerImportReturn => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importCustomers = useCallback(
    async (file: File, branchId: string) => {
      setLoading(true);
      setError(null);

      const response = await customerApi.importCustomersFromFile(file, branchId).catch((error) => {
        // Handle Excel validation errors - return error data instead of throwing
        if (error.response?.status === 400 || error.response?.status === 422) {
          const errorData = error.response.data;
          const validationErrors = errorData?.error?.meta?.errors || errorData?.meta?.errors || [];

          if (validationErrors.length > 0) {
            setLoading(false);
            const errorResult = {
              successCount: 0,
              failedCount: validationErrors.length,
              errors: validationErrors
            };
            return { success: false, data: errorResult, message: errorData?.error?.message || 'VALIDATION_FAILED' };
          } else {
            setError(t('customer.error.excel_validation_errors'));
            setLoading(false);
            throw error;
          }
        } else if (error.response?.status === 500) {
          // Handle 500 error for missing required columns
          const errorMessage = error.response?.data?.error?.message || error.message || '';
          if (errorMessage.includes('Missing required columns')) {
            // Extract missing columns from error message
            const missingColumnsMatch = errorMessage.match(/Missing required columns: (.+)/);
            const missingColumns = missingColumnsMatch
              ? missingColumnsMatch[1].split(', ').map((col: string) => col.trim())
              : [];

            // Create inline error similar to validation errors
            const inlineErrors = [
              {
                row: 1,
                errorKey: 'customer_import.error_missing_required_columns',
                errorData: { missingColumns: missingColumns.join(', ') }
              }
            ];

            setLoading(false);
            const errorResult = {
              successCount: 0,
              failedCount: inlineErrors.length,
              errors: inlineErrors
            };
            return { success: false, data: errorResult, message: 'VALIDATION_FAILED' };
          }
        }

        if (error.code === 'ECONNABORTED') {
          setError(t('customer.error.upload_timeout'));
          setLoading(false);
          throw error;
        } else {
          setError(t('customer.error.network_import_error'));
          setLoading(false);
          throw error;
        }
      });

      // If response is from catch block (error data), return it directly
      if (response && typeof response === 'object' && !response.success && 'data' in response) {
        return response.data;
      }

      if (response.success) {
        setLoading(false);
        return {
          successCount: response.data?.successCount || 0,
          failedCount: response.data?.failedCount || 0,
          errors: response.data?.errors || []
        };
      } else {
        setError(response.message || t('customer.error.failed_to_import'));
        setLoading(false);
        throw new Error(response.message || t('customer.error.failed_to_import'));
      }
    },
    [t]
  );

  const downloadTemplate = useCallback(async () => {
    setLoading(true);
    setError(null);

    const blob = await customerApi.downloadCustomerTemplate();

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = t('customer.import.template_filename');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    setLoading(false);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    importCustomers,
    downloadTemplate,
    loading,
    error,
    resetError
  };
};
