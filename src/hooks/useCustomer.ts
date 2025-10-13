import { useState, useEffect, useCallback } from 'react';
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
  const [customerList, setCustomerList] = useState<CustomerDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<CustomerPagination | null>(null);
  const [params, setParams] = useState<UseCustomerListOptions>(options);

  // Update params when options change
  useEffect(() => {
    setParams(options);
  }, [options.limit, options.page, options.branchId]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const requestParams = {
      limit: params.limit || 10,
      page: params.page || 1,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
      ...(params.branchId && { branchId: params.branchId })
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
      setError(response.message || 'Failed to fetch customers');
    }

    setLoading(false);
  }, [params.limit, params.page, params.branchId]);

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCustomerStatus = async (customerId: string) => {
    setLoading(true);
    setError(null);

    const response = await customerApi.updateCustomerStatus(customerId);

    if (response.success) {
      setLoading(false);
    } else {
      setError(response.message || 'Failed to update customer status');
      setLoading(false);
      throw new Error(response.message || 'Failed to update customer status');
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importCustomers = useCallback(async (file: File, branchId: string) => {
    setLoading(true);
    setError(null);

    const response = await customerApi.importCustomersFromFile(file, branchId);

    if (response.success) {
      setLoading(false);
      return {
        successCount: response.data?.successCount || 0,
        failedCount: response.data?.failedCount || 0,
        errors: response.data?.errors || []
      };
    } else {
      setError(response.message || 'Failed to import customers');
      setLoading(false);
      throw new Error(response.message || 'Failed to import customers');
    }
  }, []);

  const downloadTemplate = useCallback(async () => {
    setLoading(true);
    setError(null);

    const blob = await customerApi.downloadCustomerTemplate();

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'customer-import-template.xlsx';
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
