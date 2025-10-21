import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  FileText,
  Loader2,
  AlertCircle,
  UserCheck,
  UserX,
  Settings,
  Shield,
  MapPin
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
import { useStaffList, useUpdateStaffStatus } from '@/hooks/useStaff';
import { useTableSort } from '@/hooks/useTableSort';
import { useUser } from '@/hooks/useAuth';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { useBranch } from '@/contexts/BranchContext';
import { useCanManageStaff } from '@/hooks/useCanManageStaff';
import { sortArray, staffSortConfig } from '@/utils/sort';
import StaffProfileModal from '@/components/modals/StaffProfileModal';
import StaffPermissionOverlayModal from '@/components/modals/StaffPermissionOverlayModal';
import StaffAttendanceHistoryModal from '@/components/modals/StaffAttendanceHistoryModal';
import type {
  StaffFilters,
  StaffManagementProps,
  SortField,
  StaffDisplay,
  StaffForPermissionModal
} from '@/types/api/Staff';
import { staffApi } from '@/services/api/staffApi';
import { toast } from 'sonner';

export const StaffManagement: React.FC<StaffManagementProps> = ({ onAddStaff }) => {
  const { t } = useTranslation();
  const currentUser = useUser();
  const { currentStaff } = useCurrentUserStaff();
  const navigate = useNavigate();
  const { currentBranch } = useBranch();
  const { canManageStaff } = useCanManageStaff();
  const [filters, setFilters] = useState<StaffFilters>({
    searchTerm: '',
    selectedIds: []
  });

  const [activeTab, setActiveTab] = useState<'staff' | 'customer'>('staff');
  const [selectedStaff, setSelectedStaff] = useState<StaffDisplay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [staffToUpdate, setStaffToUpdate] = useState<StaffDisplay | null>(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [permissionStaff, setPermissionStaff] = useState<StaffForPermissionModal | null>(null);
  const [permissionLoadingId, setPermissionLoadingId] = useState<string | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceStaff, setAttendanceStaff] = useState<StaffDisplay | null>(null);

  // Use the custom sort hook
  const { sortState, handleSort, getSortIcon } = useTableSort<SortField>();

  // Use the custom hook to fetch data (without search parameter)
  const { staffList, loading, error, pagination, refetch, goToPage } = useStaffList({
    limit: 10
  });

  // Use the hook for updating staff status
  const { updateStaffStatus } = useUpdateStaffStatus();

  const selectedCount = filters.selectedIds.length;

  // Filter out current user's staff record, filter by current branch, search, and sort staff list using the utility function
  const sortedStaffList = useMemo(() => {
    let filteredStaffList = currentUser
      ? staffList.filter((staff) => {
          return staff.email !== currentUser.email;
        })
      : staffList;

    // Filter by current branch if one is selected
    if (currentBranch) {
      filteredStaffList = filteredStaffList.filter((staff) => {
        return staff.branches.some((branch) => branch._id === currentBranch._id);
      });
    }

    // Frontend search filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredStaffList = filteredStaffList.filter((staff) => {
        return (
          staff.name.toLowerCase().includes(searchTerm) ||
          staff.email.toLowerCase().includes(searchTerm) ||
          staff.phone.toLowerCase().includes(searchTerm) ||
          staff.jobTitle.toLowerCase().includes(searchTerm) ||
          staff.branch.toLowerCase().includes(searchTerm) ||
          staff.branches.some((branch) => branch.branchName.toLowerCase().includes(searchTerm))
        );
      });
    }

    return sortArray(filteredStaffList, sortState, (item, field) => {
      const extractor = staffSortConfig[field as keyof typeof staffSortConfig];
      return extractor ? extractor(item) : '';
    });
  }, [staffList, sortState, currentUser, currentBranch, filters.searchTerm]);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: value }));
  };

  const handleSelectAll = () => {
    const allIds = sortedStaffList.map((staff) => staff.id);
    const isAllSelected = allIds.every((id) => filters.selectedIds.includes(id));

    if (isAllSelected) {
      // Bỏ chọn tất cả
      setFilters((prev) => ({
        ...prev,
        selectedIds: prev.selectedIds.filter((id) => !allIds.includes(id))
      }));
    } else {
      // Chọn tất cả
      setFilters((prev) => ({
        ...prev,
        selectedIds: [...new Set([...prev.selectedIds, ...allIds])]
      }));
    }
  };

  const handleSelectStaff = (staffId: string) => {
    console.log('Selecting staff:', staffId);
    setFilters((prev) => {
      const newSelectedIds = prev.selectedIds.includes(staffId)
        ? prev.selectedIds.filter((id) => id !== staffId)
        : [...prev.selectedIds, staffId];
      console.log('New selected IDs:', newSelectedIds);
      return {
        ...prev,
        selectedIds: newSelectedIds
      };
    });
  };

  const handlePageChange = (newPage: number) => {
    goToPage(newPage);
  };

  const handleAddStaff = () => {
    // Navigate to add staff page
    navigate('/manage/staff/add');
    // Also call the onAddStaff prop if provided
    if (onAddStaff) {
      onAddStaff();
    }
  };

  const handleBulkEdit = () => {
    const selectedStaff = sortedStaffList.filter((staff) => filters.selectedIds.includes(staff.id));
    console.log('Bulk edit selected staff:', selectedStaff);
    // TODO: Implement bulk edit functionality
  };

  const handleBulkDelete = () => {
    const selectedStaff = sortedStaffList.filter((staff) => filters.selectedIds.includes(staff.id));
    console.log('Bulk delete selected staff:', selectedStaff);
    // TODO: Implement bulk delete functionality
  };

  const handleViewStaff = (staff: StaffDisplay) => {
    setSelectedStaff(staff);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEditStaff = (staff: StaffDisplay) => {
    setSelectedStaff(staff);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleManagePermissions = async (staff: StaffDisplay) => {
    setPermissionLoadingId(staff.id);

    const response = await staffApi.getStaffById(staff.id);
    if (response.success && response.data) {
      const staffData = response.data;
      if (!staffData.userId?._id) {
        toast.error(t('permissions.fetch_staff_error'));
        setPermissionLoadingId(null);
        return;
      }
      setPermissionStaff({
        _id: staffData._id,
        userId: {
          _id: staffData.userId?._id || '',
          fullName: staffData.userId?.fullName || staffData.userId?.username || staff.name,
          email: staffData.userId?.email || staff.email,
          phoneNumber: staffData.userId?.phoneNumber
        },
        jobTitle: staffData.jobTitle,
        status: staffData.status || 'ACTIVE',
        branchId: staffData.branchId || []
      });
      setIsPermissionModalOpen(true);
    } else {
      toast.error(t('permissions.fetch_staff_error'));
    }

    setPermissionLoadingId(null);
  };

  const handleCloseModal = async () => {
    setIsModalOpen(false);
    setSelectedStaff(null);
    setIsEditMode(false);

    // Refresh staff list when modal closes
    await refetch();
  };

  const handlePermissionModalDismiss = () => {
    setIsPermissionModalOpen(false);
    setPermissionStaff(null);
    setPermissionLoadingId(null);
  };

  const handlePermissionSuccess = async () => {
    await refetch();
  };

  const handleToggleStaffStatus = (staff: StaffDisplay) => {
    setStaffToUpdate(staff);
    setStatusDialogOpen(true);
  };

  const handleViewAttendanceHistory = (staff: StaffDisplay) => {
    setAttendanceStaff(staff);
    setIsAttendanceModalOpen(true);
  };

  const handleCloseAttendanceModal = () => {
    setIsAttendanceModalOpen(false);
    setAttendanceStaff(null);
  };

  const confirmStatusUpdate = async () => {
    if (!staffToUpdate) return;

    await updateStaffStatus(staffToUpdate.id);
    await refetch();
    setStatusDialogOpen(false);
    setStaffToUpdate(null);
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
            <p className="text-gray-600">{t('dashboard.loading_staff_list')}</p>
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
    <div className="basic-management">
      {/* Header */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-500">
              <Settings className="h-3.5 w-3.5" />
              {t('dashboard.staff_management')}
            </span>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900">
              {t('dashboard.staff_overview_title') || 'Training & staff'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('dashboard.staff_overview_subtitle') ||
                'Monitor staffing distribution and performance across your facilities.'}
            </p>
            {currentBranch && (
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-600 font-medium">
                  {t('dashboard.filtering_by_branch') || 'Filtering by branch'}: {currentBranch.branchName}
                </span>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            className="rounded-full border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-500"
          >
            {t('dashboard.detailed_report') || 'Detailed report'}
          </Button>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-orange-100 bg-[#FFF6EE] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-orange-500">{t('dashboard.total')}</div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-3xl font-bold text-gray-900">{sortedStaffList.length}</div>
              <div className="rounded-full bg-white/70 p-2 text-orange-500">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {currentBranch
                ? `${t('dashboard.total_staff_helper') || 'Active staff members'} - ${currentBranch.branchName}`
                : t('dashboard.total_staff_helper') || 'Active staff members overall'}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t('dashboard.equipment_management')}
            </div>
            <div className="mt-2 flex items-end justify-between text-gray-900">
              <span className="text-3xl font-semibold">
                {sortedStaffList.filter((staff) => staff.jobTitle === 'Technician').length}
              </span>
              <div className="rounded-full bg-white p-2 text-gray-500">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {t('dashboard.equipment_management_helper') || 'Equipment supervisors on duty'}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t('dashboard.branch_management')}
            </div>
            <div className="mt-2 flex items-end justify-between text-gray-900">
              <span className="text-3xl font-semibold">
                {sortedStaffList.filter((staff) => staff.jobTitle === 'Manager').length}
              </span>
              <div className="rounded-full bg-white p-2 text-gray-500">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {t('dashboard.branch_management_helper') || 'Branch managers assigned'}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">{t('dashboard.pt')}</div>
            <div className="mt-2 flex items-end justify-between text-gray-900">
              <span className="text-3xl font-semibold">
                {sortedStaffList.filter((staff) => staff.jobTitle === 'Personal Trainer').length}
              </span>
              <div className="rounded-full bg-white p-2 text-gray-500">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">{t('dashboard.pt_helper') || 'Personal trainers available'}</p>
          </div>
        </div>
      </div>

      {/* Tabs + actions + search */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              className={`inline-flex items-center rounded-full px-6 py-2 text-sm font-medium transition-all ${
                activeTab === 'staff'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500'
              }`}
              onClick={() => setActiveTab('staff')}
            >
              <FileText className="mr-2 h-4 w-4" />
              {t('dashboard.staff_list')}
            </button>
            <button
              className={`inline-flex items-center rounded-full px-6 py-2 text-sm font-medium transition-all ${
                activeTab === 'customer'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500'
              }`}
              onClick={() => setActiveTab('customer')}
            >
              {t('dashboard.customer_list')}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-600">
                {t('dashboard.selected')} {selectedCount}
              </span>
            )}
            <Button
              className={`h-11 rounded-full px-6 text-sm font-semibold shadow-sm ${
                currentUser?.role === 'OWNER' ||
                currentUser?.role === 'ADMIN' ||
                (currentStaff && currentStaff.jobTitle === 'Manager')
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={
                currentUser?.role === 'OWNER' ||
                currentUser?.role === 'ADMIN' ||
                (currentStaff && currentStaff.jobTitle === 'Manager')
                  ? handleAddStaff
                  : undefined
              }
              disabled={
                !(
                  currentUser?.role === 'OWNER' ||
                  currentUser?.role === 'ADMIN' ||
                  (currentStaff && currentStaff.jobTitle === 'Manager')
                )
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('dashboard.add_staff')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Input
              placeholder={t('dashboard.enter_staff_name')}
              className="h-11 rounded-full border border-transparent bg-gray-50 pl-12 text-sm shadow-inner focus:border-orange-200 focus:bg-white focus:ring-orange-200"
              value={filters.searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          <button
            className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              currentUser?.role === 'OWNER' ||
              currentUser?.role === 'ADMIN' ||
              (currentStaff && currentStaff.jobTitle === 'Manager')
                ? sortedStaffList.length > 0 && sortedStaffList.every((staff) => filters.selectedIds.includes(staff.id))
                  ? 'border border-orange-200 bg-orange-100 text-orange-600 shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-500 hover:border-orange-200 hover:text-orange-500'
                : 'border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            onClick={
              currentUser?.role === 'OWNER' ||
              currentUser?.role === 'ADMIN' ||
              (currentStaff && currentStaff.jobTitle === 'Manager')
                ? handleSelectAll
                : undefined
            }
            disabled={
              !(
                currentUser?.role === 'OWNER' ||
                currentUser?.role === 'ADMIN' ||
                (currentStaff && currentStaff.jobTitle === 'Manager')
              )
            }
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                currentUser?.role === 'OWNER' ||
                currentUser?.role === 'ADMIN' ||
                (currentStaff && currentStaff.jobTitle === 'Manager')
                  ? sortedStaffList.length > 0 &&
                    sortedStaffList.every((staff) => filters.selectedIds.includes(staff.id))
                    ? 'border-orange-400 bg-orange-500 text-white'
                    : 'border-gray-300 text-transparent'
                  : 'border-gray-300 bg-gray-200 text-gray-400'
              }`}
            >
              {currentUser?.role === 'OWNER' ||
              currentUser?.role === 'ADMIN' ||
              (currentStaff && currentStaff.jobTitle === 'Manager')
                ? sortedStaffList.length > 0 &&
                  sortedStaffList.every((staff) => filters.selectedIds.includes(staff.id)) && (
                    <span className="text-[10px]">✓</span>
                  )
                : null}
            </span>
            <span>{t('dashboard.select_all')}</span>
          </button>
        </div>

        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-600">{t('dashboard.bulk_actions') || 'Bulk actions'}:</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all ${
                  currentUser?.role === 'OWNER' ||
                  currentUser?.role === 'ADMIN' ||
                  (currentStaff && currentStaff.jobTitle === 'Manager')
                    ? 'border border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:text-orange-500'
                    : 'border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                onClick={
                  currentUser?.role === 'OWNER' ||
                  currentUser?.role === 'ADMIN' ||
                  (currentStaff && currentStaff.jobTitle === 'Manager')
                    ? handleBulkEdit
                    : undefined
                }
                disabled={
                  !(
                    currentUser?.role === 'OWNER' ||
                    currentUser?.role === 'ADMIN' ||
                    (currentStaff && currentStaff.jobTitle === 'Manager')
                  )
                }
              >
                <Edit className="h-4 w-4" />
                {t('dashboard.bulk_edit')}
              </button>
              <button
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all ${
                  currentUser?.role === 'OWNER' ||
                  currentUser?.role === 'ADMIN' ||
                  (currentStaff && currentStaff.jobTitle === 'Manager')
                    ? 'border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100'
                    : 'border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                onClick={
                  currentUser?.role === 'OWNER' ||
                  currentUser?.role === 'ADMIN' ||
                  (currentStaff && currentStaff.jobTitle === 'Manager')
                    ? handleBulkDelete
                    : undefined
                }
                disabled={
                  !(
                    currentUser?.role === 'OWNER' ||
                    currentUser?.role === 'ADMIN' ||
                    (currentStaff && currentStaff.jobTitle === 'Manager')
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
                {t('dashboard.bulk_delete')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-orange-100 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#FFF7EF]">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-orange-600 first:rounded-l-2xl">
                {t('dashboard.serial_number')}
              </th>
              <SortableHeader
                field="name"
                label={t('dashboard.full_name')}
                sortState={sortState}
                onSort={handleSort}
                getSortIcon={getSortIcon}
              />
              <SortableHeader
                field="jobTitle"
                label={t('dashboard.role')}
                sortState={sortState}
                onSort={handleSort}
                getSortIcon={getSortIcon}
              />
              <SortableHeader
                field="email"
                label={t('dashboard.email')}
                sortState={sortState}
                onSort={handleSort}
                getSortIcon={getSortIcon}
              />
              <SortableHeader
                field="phone"
                label={t('dashboard.phone_number')}
                sortState={sortState}
                onSort={handleSort}
                getSortIcon={getSortIcon}
              />
              <SortableHeader
                field="salary"
                label={t('dashboard.salary')}
                sortState={sortState}
                onSort={handleSort}
                getSortIcon={getSortIcon}
              />
              <SortableHeader
                field="status"
                label={t('dashboard.status')}
                sortState={sortState}
                onSort={handleSort}
                getSortIcon={getSortIcon}
              />
              <th className="px-4 py-3 text-sm font-semibold text-orange-600 last:rounded-r-2xl">
                {t('dashboard.action')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-50 bg-white text-gray-700">
            {sortedStaffList.map((staff, index) => {
              // Calculate correct STT based on pagination
              const startIndex = pagination ? (pagination.currentPage - 1) * pagination.itemsPerPage : 0;
              const stt = startIndex + index + 1;

              return (
                <tr
                  key={staff.id}
                  className={`${filters.selectedIds.includes(staff.id) ? 'bg-orange-50/80' : index % 2 === 0 ? 'bg-white' : 'bg-[#FFF9F2]'}`}
                >
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={filters.selectedIds.includes(staff.id)}
                        onCheckedChange={
                          currentUser?.role === 'OWNER' ||
                          currentUser?.role === 'ADMIN' ||
                          (currentStaff && currentStaff.jobTitle === 'Manager')
                            ? () => handleSelectStaff(staff.id)
                            : undefined
                        }
                        disabled={
                          !(
                            currentUser?.role === 'OWNER' ||
                            currentUser?.role === 'ADMIN' ||
                            (currentStaff && currentStaff.jobTitle === 'Manager')
                          )
                        }
                        className={
                          currentUser?.role === 'OWNER' ||
                          currentUser?.role === 'ADMIN' ||
                          (currentStaff && currentStaff.jobTitle === 'Manager')
                            ? ''
                            : 'opacity-50'
                        }
                      />
                      <span
                        className={
                          filters.selectedIds.includes(staff.id)
                            ? 'font-semibold text-orange-500'
                            : 'font-medium text-gray-700'
                        }
                      >
                        {stt}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{staff.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{staff.jobTitle}</td>
                  <td className="px-4 py-3 text-sm text-blue-600">{staff.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{staff.phone}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{staff.salary}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex min-w-[88px] justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                        staff.status === 'ACTIVE'
                          ? 'bg-green-50 text-green-600'
                          : staff.status === 'INACTIVE'
                            ? 'bg-red-50 text-red-500'
                            : 'bg-yellow-50 text-yellow-600'
                      }`}
                    >
                      {staff.status === 'ACTIVE'
                        ? t('staff_modal.status_active')
                        : staff.status === 'INACTIVE'
                          ? t('staff_modal.status_inactive')
                          : staff.status === 'SUSPENDED'
                            ? t('staff_modal.status_suspended')
                            : t('staff_modal.status_active')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-orange-200 hover:text-orange-500"
                        onClick={() => handleViewStaff(staff)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                          canManageStaff(staff)
                            ? 'border-gray-200 bg-white text-gray-500 hover:border-orange-200 hover:text-orange-500'
                            : 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
                        }`}
                        onClick={canManageStaff(staff) ? () => handleViewAttendanceHistory(staff) : undefined}
                        title={t('dashboard.view_attendance_history') || 'View attendance history'}
                        disabled={!canManageStaff(staff)}
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                          canManageStaff(staff)
                            ? 'border-gray-200 bg-white text-gray-500 hover:border-orange-200 hover:text-orange-500'
                            : 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
                        }`}
                        onClick={canManageStaff(staff) ? () => handleEditStaff(staff) : undefined}
                        disabled={!canManageStaff(staff)}
                        title={canManageStaff(staff) ? t('common.edit') : t('dashboard.no_permission')}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                          canManageStaff(staff)
                            ? 'border-gray-200 bg-white text-gray-500 hover:border-orange-200 hover:text-orange-500'
                            : 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
                        }`}
                        onClick={canManageStaff(staff) ? () => handleManagePermissions(staff) : undefined}
                        title={canManageStaff(staff) ? t('dashboard.manage_permissions') : t('dashboard.no_permission')}
                        aria-label={`${t('dashboard.manage_permissions')} - ${staff.name}`}
                        disabled={!canManageStaff(staff) || permissionLoadingId === staff.id}
                      >
                        {permissionLoadingId === staff.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                          canManageStaff(staff)
                            ? 'border-orange-100 bg-orange-50 text-orange-500 hover:bg-orange-100'
                            : 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
                        }`}
                        onClick={canManageStaff(staff) ? () => handleToggleStaffStatus(staff) : undefined}
                        title={
                          canManageStaff(staff)
                            ? staff.status === 'ACTIVE'
                              ? t('dashboard.inactive_staff')
                              : t('dashboard.activate_staff')
                            : t('dashboard.no_permission')
                        }
                        disabled={!canManageStaff(staff)}
                      >
                        {staff.status === 'ACTIVE' ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Info and Controls */}
      {pagination && (
        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-gray-500">
            {`${t('dashboard.showing')} ${(pagination.currentPage - 1) * pagination.itemsPerPage + 1} - ${Math.min(pagination.currentPage * pagination.itemsPerPage, sortedStaffList.length)} ${t('dashboard.of_total')} ${sortedStaffList.length} ${t('dashboard.staff_members')}`}
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

      {/* Staff Profile Modal */}
      <StaffProfileModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        staff={selectedStaff}
        initialEditMode={isEditMode}
      />

      <StaffPermissionOverlayModal
        isOpen={isPermissionModalOpen}
        onClose={handlePermissionModalDismiss}
        staff={permissionStaff}
        onSuccess={handlePermissionSuccess}
      />

      {/* Staff Attendance History Modal */}
      <StaffAttendanceHistoryModal
        isOpen={isAttendanceModalOpen}
        onClose={handleCloseAttendanceModal}
        staffId={attendanceStaff?.id || null}
        staffName={attendanceStaff?.name}
        jobTitle={attendanceStaff?.jobTitle}
      />

      {/* Delete Staff Confirmation Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboard.confirm_delete_staff')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard.delete_staff_description', { name: staffToUpdate?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStatusDialogOpen(false)}>{t('dashboard.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusUpdate} className="bg-red-600 hover:bg-red-700">
              {t('dashboard.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
