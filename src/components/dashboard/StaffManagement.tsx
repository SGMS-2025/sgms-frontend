import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Users,
  FileText,
  Loader2,
  AlertCircle,
  UserCheck,
  UserX,
  Settings,
  Shield,
  MapPin,
  FileSpreadsheet,
  MoreVertical,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useStaffList, useStaffStats, useUpdateStaffStatus } from '@/hooks/useStaff';
import { useTableSort } from '@/hooks/useTableSort';
import { useUser } from '@/hooks/useAuth';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { useBranch } from '@/contexts/BranchContext';
import { useCanManageStaff } from '@/hooks/useCanManageStaff';
import { sortArray, staffSortConfig } from '@/utils/sort';
import { formatStaffSalary } from '@/utils/staffUtils';
import StaffProfileModal from '@/components/modals/StaffProfileModal';
import StaffPermissionOverlayModal from '@/components/modals/StaffPermissionOverlayModal';
import StaffAttendanceHistoryModal from '@/components/modals/StaffAttendanceHistoryModal';
import { StaffExcelImportModal } from '@/components/modals/StaffExcelImportModal';
import { useStaffTour } from '@/hooks/useStaffTour';
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
  const { currentBranch, loading: branchLoading } = useBranch();
  const { canManageStaff } = useCanManageStaff();
  const { startStaffTour } = useStaffTour();
  const [filters, setFilters] = useState<StaffFilters>({
    searchTerm: ''
  });

  const [selectedStaff, setSelectedStaff] = useState<StaffDisplay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [shouldRefreshStaffList, setShouldRefreshStaffList] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [staffToUpdate, setStaffToUpdate] = useState<StaffDisplay | null>(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [permissionStaff, setPermissionStaff] = useState<StaffForPermissionModal | null>(null);
  const [permissionLoadingId, setPermissionLoadingId] = useState<string | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceStaff, setAttendanceStaff] = useState<StaffDisplay | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Use the custom sort hook
  const { sortState, handleSort, getSortIcon } = useTableSort<SortField>();

  // Use the custom hook to fetch data (without search parameter)
  const { staffList, loading, error, pagination, refetch, goToPage, updateFilters } = useStaffList({
    limit: 10,
    branchId: branchLoading ? undefined : currentBranch?._id
  });

  const statsParams = React.useMemo(() => {
    if (branchLoading) {
      return undefined;
    }
    if (currentBranch?._id) {
      return { branchId: currentBranch._id };
    }
    return undefined;
  }, [currentBranch, branchLoading]);

  const { stats: staffStats, refetch: refetchStaffStats } = useStaffStats(statsParams);

  // Use the hook for updating staff status
  const { updateStaffStatus } = useUpdateStaffStatus();

  React.useEffect(() => {
    // Only update filters when branch is loaded (not during initial loading)
    // This prevents fetching all staff when branch is still loading
    if (branchLoading) {
      return; // Wait for branch to load
    }

    if (currentBranch?._id) {
      updateFilters({ branchId: currentBranch._id, page: 1 });
    } else {
      updateFilters({ branchId: undefined, page: 1 });
    }
  }, [currentBranch?._id, branchLoading, updateFilters]);

  // Filter out current user's staff record, search, and sort staff list using the utility function
  // Note: Branch filtering is already handled by API via branchId parameter, so we don't filter again here
  const sortedStaffList = useMemo(() => {
    let filteredStaffList = currentUser
      ? staffList.filter((staff) => {
          return staff.email !== currentUser.email;
        })
      : staffList;

    // Frontend search filter (API search parameter may not cover all fields)
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
  }, [staffList, sortState, currentUser, filters.searchTerm]);

  const totalStaffCount = staffStats?.totalStaff ?? sortedStaffList.length;
  const activeStaffCount =
    staffStats?.activeStaff ?? sortedStaffList.filter((staff) => staff.status === 'ACTIVE').length;
  const inactiveStaffCount =
    staffStats?.inactiveStaff ?? sortedStaffList.filter((staff) => staff.status === 'INACTIVE').length;
  const jobTitleCounts = React.useMemo(() => {
    if (!staffStats) {
      return {
        technician: sortedStaffList.filter((staff) => staff.jobTitle === 'Technician').length,
        manager: sortedStaffList.filter((staff) => staff.jobTitle === 'Manager').length,
        pt: sortedStaffList.filter((staff) => staff.jobTitle === 'Personal Trainer').length
      };
    }
    const map = staffStats.staffByJobTitle.reduce<Record<string, number>>((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    return {
      technician: map['Technician'] || 0,
      manager: map['Manager'] || 0,
      pt: map['Personal Trainer'] || 0
    };
  }, [staffStats, sortedStaffList]);

  const canManageStaffActions =
    currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN' || currentStaff?.jobTitle === 'Manager';

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: value }));
  };

  const handlePageChange = (newPage: number) => {
    if (!pagination) return;
    const total = Math.max(pagination.totalPages, 1);
    const clampedPage = Math.min(Math.max(newPage, 1), total);
    if (clampedPage !== pagination.currentPage) {
      goToPage(clampedPage);
    }
  };

  const handleAddStaff = () => {
    // Navigate to add staff page
    navigate('/manage/staff/add');
    // Also call the onAddStaff prop if provided
    if (onAddStaff) {
      onAddStaff();
    }
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

    if (shouldRefreshStaffList) {
      await Promise.all([refetch(), refetchStaffStats()]);
      setShouldRefreshStaffList(false);
    }
  };

  const handlePermissionModalDismiss = () => {
    setIsPermissionModalOpen(false);
    setPermissionStaff(null);
    setPermissionLoadingId(null);
  };

  const handlePermissionSuccess = async () => {
    await refetch();
    await refetchStaffStats();
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
    await refetchStaffStats();
    setStatusDialogOpen(false);
    setStaffToUpdate(null);
  };

  const paginationPages = React.useMemo(() => {
    if (!pagination || !pagination.totalPages) return [];
    const pages = new Set<number>();
    const total = Math.max(pagination.totalPages, 1);
    const current = Math.min(Math.max(pagination.currentPage, 1), total);

    pages.add(1);
    pages.add(total);
    pages.add(current);

    const neighbors = [current - 1, current + 1, current - 2, current + 2];
    neighbors.forEach((page) => {
      if (page > 1 && page < total) {
        pages.add(page);
      }
    });

    return Array.from(pages)
      .filter((page) => page >= 1 && page <= total)
      .sort((a, b) => a - b);
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
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-4" data-tour="staff-stats-cards">
          <div className="rounded-2xl border border-orange-100 bg-[#FFF6EE] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-orange-500">{t('dashboard.total')}</div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-3xl font-bold text-gray-900">{totalStaffCount}</div>
              <div className="rounded-full bg-white/70 p-2 text-orange-500">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {currentBranch
                ? `${t('dashboard.total_staff_helper') || 'Active staff members'} - ${currentBranch.branchName}`
                : t('dashboard.total_staff_helper') || 'Active staff members overall'}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {t('dashboard.active_staff', 'Active')}: {activeStaffCount} · {t('dashboard.inactive_staff', 'Inactive')}:{' '}
              {inactiveStaffCount}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t('dashboard.technician')}
            </div>
            <div className="mt-2 flex items-end justify-between text-gray-900">
              <span className="text-3xl font-semibold">{jobTitleCounts.technician}</span>
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
              <span className="text-3xl font-semibold">{jobTitleCounts.manager}</span>
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
              <span className="text-3xl font-semibold">{jobTitleCounts.pt}</span>
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
            <button className="inline-flex items-center rounded-full px-6 py-2 text-sm font-medium bg-orange-500 text-white shadow-sm">
              <FileText className="mr-2 h-4 w-4" />
              {t('dashboard.staff_list')}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-2" data-tour="staff-action-buttons">
              <Button
                className={`h-11 rounded-full px-6 text-sm font-semibold shadow-sm ${
                  canManageStaffActions
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={canManageStaffActions ? () => setIsImportModalOpen(true) : undefined}
                disabled={!canManageStaffActions}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {t('dashboard.import_excel_button', 'Import Excel')}
              </Button>
              <Button
                className={`h-11 rounded-full px-6 text-sm font-semibold shadow-sm ${
                  canManageStaffActions
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={canManageStaffActions ? handleAddStaff : undefined}
                disabled={!canManageStaffActions}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('dashboard.add_staff')}
              </Button>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full border-gray-300 bg-white hover:bg-gray-50"
              onClick={startStaffTour}
              title={t('staff.tour.button', 'Hướng dẫn')}
            >
              <HelpCircle className="h-4 w-4 text-gray-500 hover:text-orange-500" />
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
              data-tour="staff-search-input"
            />
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-orange-100 shadow-sm" data-tour="staff-table">
        <table className="w-full text-left">
          <thead className="bg-[#FFF7EF]">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-orange-600 text-center first:rounded-l-2xl">
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
              <th className="px-4 py-3 text-sm font-semibold text-orange-600 text-center last:rounded-r-2xl">
                {t('dashboard.action')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-50 bg-white text-gray-700">
            {sortedStaffList.map((staff, index) => {
              // Calculate correct STT based on pagination
              const startIndex = pagination ? (pagination.currentPage - 1) * pagination.itemsPerPage : 0;
              const stt = startIndex + index + 1;

              const canManageCurrentStaff = canManageStaff(staff);
              const toggleLabel =
                staff.status === 'ACTIVE' ? t('dashboard.inactive_staff') : t('dashboard.activate_staff');

              return (
                <tr key={staff.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#FFF9F2]'}>
                  <td className="px-4 py-3 text-sm text-gray-600 text-center">
                    <span className="font-medium text-gray-700">{stt}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{staff.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{staff.jobTitle}</td>
                  <td className="px-4 py-3 text-sm text-blue-600">{staff.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{staff.phone}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatStaffSalary(staff.salary)}</td>
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
                  <td className="px-4 py-3 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="inline-flex items-center justify-center p-2 text-gray-500 transition-colors hover:text-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
                          aria-label={t('common.more_actions') || 'More actions'}
                          data-tour="staff-actions-menu"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleViewStaff(staff)} className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          {t('common.view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={!canManageCurrentStaff}
                          onClick={canManageCurrentStaff ? () => handleViewAttendanceHistory(staff) : undefined}
                          className="cursor-pointer"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          {t('dashboard.view_attendance_history') || 'View attendance history'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={!canManageCurrentStaff}
                          onClick={canManageCurrentStaff ? () => handleEditStaff(staff) : undefined}
                          className="cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={!canManageCurrentStaff || permissionLoadingId === staff.id}
                          onClick={canManageCurrentStaff ? () => handleManagePermissions(staff) : undefined}
                          className="cursor-pointer"
                        >
                          {permissionLoadingId === staff.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Shield className="mr-2 h-4 w-4" />
                          )}
                          {t('dashboard.manage_permissions')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={!canManageCurrentStaff}
                          onClick={canManageCurrentStaff ? () => handleToggleStaffStatus(staff) : undefined}
                          className="cursor-pointer"
                        >
                          {staff.status === 'ACTIVE' ? (
                            <UserX className="mr-2 h-4 w-4" />
                          ) : (
                            <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                          )}
                          {toggleLabel}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Info and Controls */}
      {pagination && pagination.totalPages > 0 && paginationPages.length > 0 && (
        <div
          className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          data-tour="staff-pagination"
        >
          <div className="text-sm text-gray-500">
            {`${t('dashboard.showing')} ${(pagination.currentPage - 1) * pagination.itemsPerPage + 1} - ${Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} ${t('dashboard.of_total')} ${pagination.totalItems} ${t('dashboard.staff_members')}`}
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
        onDataChanged={() => setShouldRefreshStaffList(true)}
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

      {/* Staff Excel Import Modal */}
      <StaffExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => {
          refetch();
          setIsImportModalOpen(false);
        }}
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
