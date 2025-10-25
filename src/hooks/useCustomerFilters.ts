import { useState, useCallback, useMemo } from 'react';
import type { CustomerFilters, CustomerDisplay } from '@/types/api/Customer';

export const useCustomerFilters = () => {
  const [filters, setFilters] = useState<CustomerFilters>({
    searchTerm: '',
    selectedIds: [],
    visibleColumns: {
      name: true,
      phone: true,
      membershipType: true,
      serviceName: true,
      contractStartDate: false,
      contractEndDate: true,
      referrerStaffName: false,
      status: false,
      lastPaymentDate: false,
      createdAt: false
    }
  });

  const handleSearch = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: value }));
  }, []);

  const toggleColumnVisibility = useCallback((column: keyof CustomerFilters['visibleColumns']) => {
    setFilters((prev) => ({
      ...prev,
      visibleColumns: {
        ...prev.visibleColumns,
        [column]: !prev.visibleColumns[column]
      }
    }));
  }, []);

  const handleSelectAll = useCallback(
    (customerList: CustomerDisplay[]) => {
      const allIds = customerList.map((customer) => customer.id);
      const isAllSelected = allIds.every((id) => filters.selectedIds.includes(id));

      if (isAllSelected) {
        setFilters((prev) => ({
          ...prev,
          selectedIds: prev.selectedIds.filter((id) => !allIds.includes(id))
        }));
      } else {
        setFilters((prev) => ({
          ...prev,
          selectedIds: [...new Set([...prev.selectedIds, ...allIds])]
        }));
      }
    },
    [filters.selectedIds]
  );

  const handleSelectCustomer = useCallback((customerId: string) => {
    setFilters((prev) => {
      const newSelectedIds = prev.selectedIds.includes(customerId)
        ? prev.selectedIds.filter((id) => id !== customerId)
        : [...prev.selectedIds, customerId];
      return {
        ...prev,
        selectedIds: newSelectedIds
      };
    });
  }, []);

  const selectedCount = useMemo(() => filters.selectedIds.length, [filters.selectedIds]);

  return {
    filters,
    setFilters,
    handleSearch,
    toggleColumnVisibility,
    handleSelectAll,
    handleSelectCustomer,
    selectedCount
  };
};
