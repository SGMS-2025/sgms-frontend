import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Users,
  Loader2,
  AlertCircle,
  UserCheck,
  UserX,
  MapPin,
  Settings,
  FileSpreadsheet,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { SortableHeader } from '@/components/ui/SortableHeader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { useCustomerList, useUpdateCustomerStatus } from '@/hooks/useCustomer';
import { useTableSort } from '@/hooks/useTableSort';
import { socketService } from '@/services/socket/socketService';
import type { MembershipContractUpdateEvent } from '@/types/api/Socket';
import { useUser } from '@/hooks/useAuth';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { useBranch } from '@/contexts/BranchContext';
import { useCanManageCustomer } from '@/hooks/useCanManageCustomer';
import { sortArray } from '@/utils/sort';
import { CustomerModal } from '@/components/modals/CustomerModal';
import { CustomerDetailModal } from '@/components/modals/CustomerDetailModal';
import { CustomerExcelImportModal } from '@/components/modals/CustomerExcelImportModal';
import { customerApi } from '@/services/api/customerApi';
import { useCustomersTour } from '@/hooks/useCustomersTour';
import type {
  CustomerFilters,
  CustomerManagementProps,
  CustomerSortField,
  CustomerDisplay
} from '@/types/api/Customer';

// Sort configuration
const customerSortConfig = {
  name: (item: CustomerDisplay) => item.name,
  email: (item: CustomerDisplay) => item.email,
  phone: (item: CustomerDisplay) => item.phone,
  membershipType: (item: CustomerDisplay) => item.membershipType,
  membershipStatus: (item: CustomerDisplay) => item.membershipStatus,
  joinDate: (item: CustomerDisplay) => item.joinDate,
  expiryDate: (item: CustomerDisplay) => item.expiryDate,
  totalSpent: (item: CustomerDisplay) => item.totalSpent,
  status: (item: CustomerDisplay) => item.status,
  serviceName: (item: CustomerDisplay) => item.serviceName || '',
  contractStartDate: (item: CustomerDisplay) => item.contractStartDate || '',
  contractEndDate: (item: CustomerDisplay) => item.contractEndDate || '',
  referrerStaffName: (item: CustomerDisplay) => item.referrerStaffName || '',
  lastPaymentDate: (item: CustomerDisplay) => item.lastPaymentDate || '',
  createdAt: (item: CustomerDisplay) => item.createdAt || ''
};

export const CustomerManagement: React.FC<CustomerManagementProps> = ({ onAddCustomer }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useUser();
  const { currentStaff } = useCurrentUserStaff();
  const { currentBranch } = useBranch();
  const { canManageCustomer } = useCanManageCustomer();
  const { startCustomersTour } = useCustomersTour();
  // filter columns default
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

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDisplay | null>(null);
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<CustomerDisplay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [customerToUpdate, setCustomerToUpdate] = useState<CustomerDisplay | null>(null);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);

  // Use the custom sort hook
  const { sortState, handleSort, getSortIcon } = useTableSort<CustomerSortField>();

  // Use the custom hook to fetch data
  const { customerList, loading, error, pagination, refetch, goToPage } = useCustomerList({
    limit: 10,
    branchId: currentBranch?._id
  });

  // Use the hook for updating customer status
  const { updateCustomerStatus } = useUpdateCustomerStatus();
  const selectedCount = filters.selectedIds.length;

  // Reset pagination when branch changes
  React.useEffect(() => {
    if (currentBranch) {
      // Reset to page 1 when branch changes
      goToPage(1);
    }
  }, [currentBranch?._id, goToPage]);

  const branchId = currentBranch?._id;

  React.useEffect(() => {
    if (!branchId) return;

    let debounceTimeout: NodeJS.Timeout | null = null;

    const handleMembershipContractUpdate = (data: MembershipContractUpdateEvent) => {
      if (data?.branchId && branchId && data.branchId.toString() !== branchId.toString()) {
        return;
      }

      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      debounceTimeout = setTimeout(() => {
        refetch();
      }, 500);
    };

    // Listen for membership contract update events from socket
    socketService.on('membership:contract:updated', handleMembershipContractUpdate);

    return () => {
      socketService.off('membership:contract:updated', handleMembershipContractUpdate);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [branchId, refetch]);

  // Filter customers by search and sort customer list using the utility function
  const sortedCustomerList = useMemo(() => {
    let filteredCustomerList = customerList;

    // Frontend search filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredCustomerList = filteredCustomerList.filter((customer) => {
        return (
          (customer.name?.toLowerCase() || '').includes(searchTerm) ||
          (customer.email?.toLowerCase() || '').includes(searchTerm) ||
          (customer.phone?.toLowerCase() || '').includes(searchTerm) ||
          (customer.membershipType?.toLowerCase() || '').includes(searchTerm) ||
          (customer.membershipStatus?.toLowerCase() || '').includes(searchTerm) ||
          (customer.serviceName?.toLowerCase() || '').includes(searchTerm) ||
          (customer.referrerStaffName?.toLowerCase() || '').includes(searchTerm) ||
          (customer.branches || []).some((branch) => (branch.branchName?.toLowerCase() || '').includes(searchTerm))
        );
      });
    }

    return sortArray(filteredCustomerList, sortState, (item, field) => {
      const extractor = customerSortConfig[field as keyof typeof customerSortConfig];
      return extractor ? extractor(item) : '';
    });
  }, [customerList, sortState, filters.searchTerm]);

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

  const handleSelectAll = () => {
    const allIds = sortedCustomerList.map((customer) => customer.id);
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
  };

  const handleSelectCustomer = (customerId: string) => {
    setFilters((prev) => {
      const newSelectedIds = prev.selectedIds.includes(customerId)
        ? prev.selectedIds.filter((id) => id !== customerId)
        : [...prev.selectedIds, customerId];
      return {
        ...prev,
        selectedIds: newSelectedIds
      };
    });
  };

  const handlePageChange = (newPage: number) => {
    goToPage(newPage);
  };

  const handleAddCustomer = () => {
    // Open modal for adding new customer
    setSelectedCustomer(null);
    setIsEditMode(false);
    setIsModalOpen(true);
    // Also call the onAddCustomer prop if provided
    if (onAddCustomer) {
      onAddCustomer();
    }
  };

  const handleExcelImport = () => {
    setIsExcelImportModalOpen(true);
  };

  const handleViewCustomer = (customer: CustomerDisplay) => {
    if (!customer) {
      return;
    }

    // Show modal preview
    setSelectedCustomerForDetail(customer);
    setIsDetailModalOpen(true);
  };

  const handleRowClick = (customer: CustomerDisplay) => {
    if (!customer) {
      return;
    }

    // Determine the correct route based on current location
    // If we're in PT route (/manage/pt/customers), navigate to PT customer detail route
    // Otherwise, navigate to Manager/Owner customer detail route
    const isPTRoute = location.pathname.includes('/manage/pt/customers');
    const detailPath = isPTRoute
      ? `/manage/pt/customers/${customer.id}/detail`
      : `/manage/customers/${customer.id}/detail`;

    navigate(detailPath);
  };

  const handleEditCustomer = async (customer: CustomerDisplay) => {
    if (!customer?.id) {
      return;
    }

    const response = await customerApi.getCustomerById(customer.id, currentBranch?._id);

    if (response.success && response.data) {
      setSelectedCustomer(response.data);
    } else {
      setSelectedCustomer(customer);
    }

    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleCloseModal = async () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
    setIsEditMode(false);
    // Clear any form state that might be lingering
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedCustomerForDetail(null);
  };

  const handleToggleCustomerStatus = (customer: CustomerDisplay) => {
    setCustomerToUpdate(customer);
    setStatusDialogOpen(true);
  };

  const confirmStatusUpdate = async () => {
    if (!customerToUpdate) return;

    await updateCustomerStatus(customerToUpdate.id);
    await refetch();
    setStatusDialogOpen(false);
    setCustomerToUpdate(null);
  };

  // Helper function to determine if user can manage customers
  const canManageCustomers = () => {
    return (
      currentUser?.role === 'OWNER' ||
      currentUser?.role === 'ADMIN' ||
      (currentStaff && (currentStaff.jobTitle === 'Manager' || currentStaff.jobTitle === 'Personal Trainer'))
    );
  };

  // Helper function to get select all button class
  const getSelectAllButtonClass = () => {
    if (!canManageCustomers()) {
      return 'border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed';
    }

    const isAllSelected =
      sortedCustomerList.length > 0 &&
      sortedCustomerList.every((customer) => filters.selectedIds.includes(customer.id));

    return isAllSelected
      ? 'border border-orange-200 bg-orange-100 text-orange-600 shadow-sm'
      : 'border border-gray-200 bg-white text-gray-500 hover:border-orange-200 hover:text-orange-500';
  };

  // Helper function to get select all checkbox class
  const getSelectAllCheckboxClass = () => {
    if (!canManageCustomers()) {
      return 'border-gray-300 bg-gray-200 text-gray-400';
    }

    const isAllSelected =
      sortedCustomerList.length > 0 &&
      sortedCustomerList.every((customer) => filters.selectedIds.includes(customer.id));

    return isAllSelected ? 'border-orange-400 bg-orange-500 text-white' : 'border-gray-300 text-transparent';
  };

  // Helper function to get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-50 text-green-600';
      case 'INACTIVE':
        return 'bg-red-50 text-red-500';
      case 'SUSPENDED':
        return 'bg-yellow-50 text-yellow-600';
      default:
        return 'bg-green-50 text-green-600';
    }
  };

  // Helper function to get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return t('customer_modal.status_active') || 'Active';
      case 'INACTIVE':
        return t('customer_modal.status_inactive') || 'Inactive';
      case 'SUSPENDED':
        return t('customer_modal.status_suspended') || 'Suspended';
      default:
        return t('customer_modal.status_active') || 'Active';
    }
  };

  // Helper function to get toggle status button title
  const getToggleStatusButtonTitle = (customer: CustomerDisplay) => {
    if (!canManageCustomer(customer)) {
      return t('dashboard.no_permission');
    }

    return customer.status === 'ACTIVE'
      ? t('dashboard.inactive_customer') || 'Deactivate Customer'
      : t('dashboard.activate_customer') || 'Activate Customer';
  };

  // Helper function to get table row class
  const getTableRowClass = (customer: CustomerDisplay, index: number) => {
    if (filters.selectedIds.includes(customer.id)) {
      return 'bg-orange-50/80';
    }
    return index % 2 === 0 ? 'bg-white' : 'bg-[#FFF9F2]';
  };

  // Helper function to render customer table row
  const renderCustomerTableRow = (customer: CustomerDisplay, index: number) => {
    // Calculate correct STT based on pagination
    const startIndex = pagination ? (pagination.currentPage - 1) * pagination.itemsPerPage : 0;
    const stt = startIndex + index + 1;

    return (
      <tr
        key={customer.id}
        className={`${getTableRowClass(customer, index)} cursor-pointer hover:bg-orange-50 transition-colors`}
        onClick={() => handleRowClick(customer)}
      >
        <td className="px-4 py-3 text-sm text-gray-600">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={filters.selectedIds.includes(customer.id)}
              onCheckedChange={canManageCustomers() ? () => handleSelectCustomer(customer.id) : undefined}
              disabled={!canManageCustomers()}
              className={canManageCustomers() ? '' : 'opacity-50'}
              onClick={(e) => e.stopPropagation()}
            />
            <span
              className={
                filters.selectedIds.includes(customer.id)
                  ? 'font-semibold text-orange-500'
                  : 'font-medium text-gray-700'
              }
            >
              {stt}
            </span>
          </div>
        </td>
        {filters.visibleColumns.name && (
          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{customer.name}</td>
        )}
        {filters.visibleColumns.phone && <td className="px-4 py-3 text-sm text-gray-600">{customer.phone}</td>}
        {filters.visibleColumns.membershipType && (
          <td className="px-4 py-3 text-sm text-gray-500">{customer.membershipType || '-'}</td>
        )}
        {filters.visibleColumns.serviceName && (
          <td className="px-4 py-3 text-sm text-gray-500">{customer.serviceName || '-'}</td>
        )}
        {filters.visibleColumns.contractStartDate && (
          <td className="px-4 py-3 text-sm text-gray-600">{customer.contractStartDate || '-'}</td>
        )}
        {filters.visibleColumns.contractEndDate && (
          <td className="px-4 py-3 text-sm text-gray-600">{customer.contractEndDate || '-'}</td>
        )}
        {filters.visibleColumns.referrerStaffName && (
          <td className="px-4 py-3 text-sm text-gray-500">{customer.referrerStaffName || '-'}</td>
        )}
        {filters.visibleColumns.status && (
          <td className="px-4 py-3 text-sm">
            <span
              className={`inline-flex min-w-[88px] justify-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(customer.status)}`}
            >
              {getStatusText(customer.status)}
            </span>
          </td>
        )}
        {filters.visibleColumns.lastPaymentDate && (
          <td className="px-4 py-3 text-sm text-gray-600">{customer.lastPaymentDate || '-'}</td>
        )}
        {filters.visibleColumns.createdAt && (
          <td className="px-4 py-3 text-sm text-gray-600">{customer.createdAt || '-'}</td>
        )}
        <td className="px-1 py-3">
          <div className="flex items-center gap-0.5">
            <button
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-orange-200 hover:text-orange-500"
              onClick={(e) => {
                e.stopPropagation();
                handleViewCustomer(customer);
              }}
            >
              <Eye className="h-3 w-3" />
            </button>
            <button
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                canManageCustomer(customer)
                  ? 'border-gray-200 bg-white text-gray-500 hover:border-orange-200 hover:text-orange-500'
                  : 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
              onClick={
                canManageCustomer(customer)
                  ? (e) => {
                      e.stopPropagation();
                      handleEditCustomer(customer);
                    }
                  : undefined
              }
              disabled={!canManageCustomer(customer)}
              title={canManageCustomer(customer) ? t('common.edit') : t('dashboard.no_permission')}
            >
              <Edit className="h-3 w-3" />
            </button>
            <button
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                canManageCustomer(customer)
                  ? 'border-orange-100 bg-orange-50 text-orange-500 hover:bg-orange-100'
                  : 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
              onClick={
                canManageCustomer(customer)
                  ? (e) => {
                      e.stopPropagation();
                      handleToggleCustomerStatus(customer);
                    }
                  : undefined
              }
              title={getToggleStatusButtonTitle(customer)}
              disabled={!canManageCustomer(customer)}
            >
              {customer.status === 'ACTIVE' ? (
                <UserX className="h-3 w-3" />
              ) : (
                <UserCheck className="h-3 w-3 text-green-600" />
              )}
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const paginationPages = React.useMemo(() => {
    if (!pagination) return [];
    const pages = new Set<number>();
    const total = pagination.totalPages;
    const current = pagination.currentPage;

    pages.add(1);
    pages.add(total);
    pages.add(current);

    const neighbors = [current - 1, current + 1, current - 2, current + 2];
    neighbors.forEach((page) => {
      if (page > 1 && page < total) {
        pages.add(page);
      }
    });

    return Array.from(pages).sort((a, b) => a - b);
  }, [pagination]);

  // Show loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#f05a29]" />
            <p className="text-gray-600">{t('dashboard.loading_customer_list')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={refetch} className="bg-[#f05a29] hover:bg-[#df4615] text-white">
              {t('dashboard.try_again')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-500">
              <Users className="h-3.5 w-3.5" />
              {t('dashboard.customer_management')}
            </span>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900">{t('dashboard.customer_overview_title')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('dashboard.customer_overview_subtitle')}</p>
            {currentBranch && (
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-600 font-medium">
                  {t('dashboard.filtering_by_branch')}: {currentBranch.branchName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs + actions + search */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-orange-500 text-white shadow-sm px-6 py-2 text-sm font-medium">
              <Users className="mr-2 h-4 w-4" />
              {t('dashboard.customer_list')}
            </span>
          </div>

          <div className="flex items-center gap-2" data-tour="customers-action-buttons">
            {selectedCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-600">
                {t('dashboard.selected')} {selectedCount}
              </span>
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full border-gray-300 bg-white hover:bg-gray-50"
              onClick={startCustomersTour}
              title={t('customer.tour.button', 'Hướng dẫn')}
            >
              <HelpCircle className="h-4 w-4 text-gray-500 hover:text-orange-500" />
            </Button>

            {/* Column Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 rounded-full border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-500"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {t('dashboard.columns')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="font-semibold text-gray-900">
                  {t('dashboard.select_columns')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                <DropdownMenuCheckboxItem
                  checked={filters.visibleColumns.name}
                  onCheckedChange={() => toggleColumnVisibility('name')}
                >
                  {t('dashboard.full_name')}
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={filters.visibleColumns.phone}
                  onCheckedChange={() => toggleColumnVisibility('phone')}
                >
                  {t('dashboard.phone_number')}
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={filters.visibleColumns.membershipType}
                  onCheckedChange={() => toggleColumnVisibility('membershipType')}
                >
                  {t('dashboard.membership')}
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={filters.visibleColumns.serviceName}
                  onCheckedChange={() => toggleColumnVisibility('serviceName')}
                >
                  {t('dashboard.pt_class')}
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={filters.visibleColumns.contractStartDate}
                  onCheckedChange={() => toggleColumnVisibility('contractStartDate')}
                >
                  {t('dashboard.start_date')}
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={filters.visibleColumns.contractEndDate}
                  onCheckedChange={() => toggleColumnVisibility('contractEndDate')}
                >
                  {t('dashboard.end_date')}
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={filters.visibleColumns.referrerStaffName}
                  onCheckedChange={() => toggleColumnVisibility('referrerStaffName')}
                >
                  {t('dashboard.referrer_staff')}
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={filters.visibleColumns.status}
                  onCheckedChange={() => toggleColumnVisibility('status')}
                >
                  {t('dashboard.status') || 'Trạng thái'}
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={filters.visibleColumns.lastPaymentDate}
                  onCheckedChange={() => toggleColumnVisibility('lastPaymentDate')}
                >
                  {t('dashboard.payment_date')}
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={filters.visibleColumns.createdAt}
                  onCheckedChange={() => toggleColumnVisibility('createdAt')}
                >
                  {t('dashboard.created_date')}
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              className={`h-11 rounded-full px-6 text-sm font-semibold shadow-sm ${
                canManageCustomers()
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={canManageCustomers() ? handleExcelImport : undefined}
              disabled={!canManageCustomers()}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import Excel
            </Button>
            <Button
              className={`h-11 rounded-full px-6 text-sm font-semibold shadow-sm ${
                canManageCustomers()
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={canManageCustomers() ? handleAddCustomer : undefined}
              disabled={!canManageCustomers()}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('dashboard.add_customer')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Input
              placeholder={t('dashboard.enter_customer_name')}
              className="h-11 rounded-full border border-transparent bg-gray-50 pl-12 text-sm shadow-inner focus:border-orange-200 focus:bg-white focus:ring-orange-200"
              value={filters.searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              data-tour="customers-search-input"
            />
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          <button
            className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${getSelectAllButtonClass()}`}
            onClick={canManageCustomers() ? handleSelectAll : undefined}
            disabled={!canManageCustomers()}
            data-tour="customers-select-all"
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full border ${getSelectAllCheckboxClass()}`}
            >
              {canManageCustomers() &&
                sortedCustomerList.length > 0 &&
                sortedCustomerList.every((customer) => filters.selectedIds.includes(customer.id)) && (
                  <span className="text-[10px]">✓</span>
                )}
            </span>
            <span>{t('dashboard.select_all')}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-orange-100 shadow-sm" data-tour="customers-table">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-[#FFF7EF]">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-orange-600 first:rounded-l-2xl">
                {t('dashboard.serial_number')}
              </th>
              {filters.visibleColumns.name && (
                <SortableHeader
                  field="name"
                  label={t('dashboard.full_name')}
                  sortState={sortState}
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
                />
              )}
              {filters.visibleColumns.phone && (
                <SortableHeader
                  field="phone"
                  label={t('dashboard.phone_number')}
                  sortState={sortState}
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
                />
              )}
              {filters.visibleColumns.membershipType && (
                <SortableHeader
                  field="membershipType"
                  label={t('dashboard.membership')}
                  sortState={sortState}
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
                />
              )}
              {filters.visibleColumns.serviceName && (
                <SortableHeader
                  field="serviceName"
                  label={t('dashboard.pt_class')}
                  sortState={sortState}
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
                />
              )}
              {filters.visibleColumns.contractStartDate && (
                <SortableHeader
                  field="contractStartDate"
                  label={t('dashboard.start_date')}
                  sortState={sortState}
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
                />
              )}
              {filters.visibleColumns.contractEndDate && (
                <SortableHeader
                  field="contractEndDate"
                  label={t('dashboard.end_date')}
                  sortState={sortState}
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
                />
              )}
              {filters.visibleColumns.referrerStaffName && (
                <SortableHeader
                  field="referrerStaffName"
                  label={t('dashboard.referrer_staff')}
                  sortState={sortState}
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
                />
              )}
              {filters.visibleColumns.status && (
                <SortableHeader
                  field="status"
                  label={t('dashboard.status')}
                  sortState={sortState}
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
                />
              )}
              {filters.visibleColumns.lastPaymentDate && (
                <SortableHeader
                  field="lastPaymentDate"
                  label={t('dashboard.payment_date')}
                  sortState={sortState}
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
                />
              )}
              {filters.visibleColumns.createdAt && (
                <SortableHeader
                  field="createdAt"
                  label={t('dashboard.created_date')}
                  sortState={sortState}
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
                />
              )}
              <th className="px-1 py-3 text-sm font-semibold text-orange-600 last:rounded-r-2xl">
                {t('dashboard.action')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-50 bg-white text-gray-700">
            {sortedCustomerList.map((customer, index) => renderCustomerTableRow(customer, index))}
          </tbody>
        </table>
      </div>

      {/* Pagination Info and Controls */}
      {pagination && (
        <div
          className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          data-tour="customers-pagination"
        >
          <div className="text-sm text-gray-500">
            {`${t('dashboard.showing')} ${(pagination.currentPage - 1) * pagination.itemsPerPage + 1} - ${Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} ${t('dashboard.of_total')} ${pagination.totalItems} ${t('dashboard.customers')}`}
          </div>
          <Pagination className="justify-end md:justify-center">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    if (pagination.hasPrevPage) {
                      handlePageChange(pagination.currentPage - 1);
                    }
                  }}
                  className={!pagination.hasPrevPage ? 'pointer-events-none opacity-40' : ''}
                />
              </PaginationItem>

              {paginationPages.map((page, index) => {
                const previousPage = paginationPages[index - 1];
                const showEllipsis = previousPage && page - previousPage > 1;
                return (
                  <React.Fragment key={page}>
                    {showEllipsis && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        isActive={page === pagination.currentPage}
                        className={page === pagination.currentPage ? 'border-orange-200 text-orange-600' : ''}
                        onClick={(event) => {
                          event.preventDefault();
                          handlePageChange(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  </React.Fragment>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    if (pagination.hasNextPage) {
                      handlePageChange(pagination.currentPage + 1);
                    }
                  }}
                  className={!pagination.hasNextPage ? 'pointer-events-none opacity-40' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        customer={selectedCustomer}
        isEditMode={isEditMode}
        onCustomerUpdate={refetch}
      />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        customer={selectedCustomerForDetail}
      />

      {/* Excel Import Modal */}
      <CustomerExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onImportSuccess={() => {
          setIsExcelImportModalOpen(false);
          refetch();
        }}
      />

      {/* Customer Status Update Confirmation Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {customerToUpdate?.status === 'ACTIVE'
                ? t('dashboard.confirm_disable_customer')
                : t('dashboard.confirm_enable_customer')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {customerToUpdate?.status === 'ACTIVE'
                ? t('dashboard.disable_customer_description', { name: customerToUpdate?.name })
                : t('dashboard.enable_customer_description', { name: customerToUpdate?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStatusDialogOpen(false)}>{t('dashboard.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusUpdate}
              className={
                customerToUpdate?.status === 'ACTIVE'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }
            >
              {customerToUpdate?.status === 'ACTIVE' ? t('dashboard.disable') : t('dashboard.enable')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
