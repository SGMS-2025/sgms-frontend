import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX
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
import { useStaffList, useUpdateStaffStatus } from '@/hooks/useStaff';
import { useTableSort } from '@/hooks/useTableSort';
import { useUser } from '@/hooks/useAuth';
import { sortArray, staffSortConfig } from '@/utils/sort';
import StaffProfileModal from '@/components/modals/StaffProfileModal';
import type { StaffFilters, StaffManagementProps, SortField, StaffDisplay } from '@/types/api/Staff';

export const StaffManagement: React.FC<StaffManagementProps> = ({ onAddStaff }) => {
  const { t } = useTranslation();
  const currentUser = useUser();
  const navigate = useNavigate();
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

  // Use the custom sort hook
  const { sortState, handleSort, getSortIcon } = useTableSort<SortField>();

  // Use the custom hook to fetch data
  const { staffList, stats, loading, error, pagination, refetch, updateFilters, goToPage } = useStaffList({
    search: filters.searchTerm || undefined,
    limit: 10
  });

  // Use the hook for updating staff status
  const { updateStaffStatus } = useUpdateStaffStatus();

  const selectedCount = filters.selectedIds.length;

  // Filter out current user's staff record and sort staff list using the utility function
  const sortedStaffList = useMemo(() => {
    const filteredStaffList = currentUser
      ? staffList.filter((staff) => {
          return staff.email !== currentUser.email;
        })
      : staffList;

    return sortArray(filteredStaffList, sortState, (item, field) => {
      const extractor = staffSortConfig[field as keyof typeof staffSortConfig];
      return extractor ? extractor(item) : '';
    });
  }, [staffList, sortState, currentUser]);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: value }));
  };

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateFilters({ search: filters.searchTerm || undefined, page: 1 });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters.searchTerm, updateFilters]);

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

  const handleCloseModal = async () => {
    setIsModalOpen(false);
    setSelectedStaff(null);
    setIsEditMode(false);

    // Refresh staff list when modal closes
    await refetch();
  };

  const handleToggleStaffStatus = (staff: StaffDisplay) => {
    setStaffToUpdate(staff);
    setStatusDialogOpen(true);
  };

  const confirmStatusUpdate = async () => {
    if (!staffToUpdate) return;

    const newStatus = staffToUpdate.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await updateStaffStatus(staffToUpdate.id, newStatus);
    await refetch();
    setStatusDialogOpen(false);
    setStaffToUpdate(null);
  };

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
    <div className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#f05a29]">{t('dashboard.staff_management')}</h1>

        <div className="flex space-x-4">
          <div className="bg-[#f05a29] text-white px-6 py-3 rounded-lg text-center">
            <div className="text-sm">{t('dashboard.total')}</div>
            <div className="text-2xl font-bold flex items-center">
              <Users className="w-5 h-5 mr-1" />
              {currentUser ? Math.max(0, (stats?.totalStaff || 0) - 1) : stats?.totalStaff || 0}
            </div>
          </div>

          <div className="bg-white border border-[#d9d9d9] px-6 py-3 rounded-lg text-center">
            <div className="text-xs text-[#9fa5ad]">{t('dashboard.equipment_management')}</div>
            <div className="text-2xl font-bold text-[#f05a29] flex items-center">
              <Users className="w-5 h-5 mr-1" />
              {stats?.staffByJobTitle?.find((item) => item._id === 'Quản lý thiết bị')?.count || 0}
            </div>
          </div>

          <div className="bg-white border border-[#d9d9d9] px-6 py-3 rounded-lg text-center">
            <div className="text-xs text-[#9fa5ad]">{t('dashboard.branch_management')}</div>
            <div className="text-2xl font-bold text-[#f05a29] flex items-center">
              <Users className="w-5 h-5 mr-1" />
              {stats?.staffByJobTitle?.find((item) => item._id === 'Quản lý chi nhánh')?.count || 0}
            </div>
          </div>

          <div className="bg-white border border-[#d9d9d9] px-6 py-3 rounded-lg text-center">
            <div className="text-xs text-[#9fa5ad]">{t('dashboard.pt')}</div>
            <div className="text-2xl font-bold text-[#f05a29] flex items-center">
              <Users className="w-5 h-5 mr-1" />
              {stats?.staffByJobTitle?.find((item) => item._id === 'PT')?.count || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          className={`px-6 py-2 rounded-lg flex items-center ${
            activeTab === 'staff' ? 'bg-[#f05a29] text-white' : 'bg-[#d9d9d9] text-[#9fa5ad]'
          }`}
          onClick={() => setActiveTab('staff')}
        >
          <FileText className="w-4 h-4 mr-2" />
          {t('dashboard.staff_list')}
        </button>
        <button
          className={`px-6 py-2 rounded-lg ${
            activeTab === 'customer' ? 'bg-[#f05a29] text-white' : 'bg-[#d9d9d9] text-[#9fa5ad]'
          }`}
          onClick={() => setActiveTab('customer')}
        >
          {t('dashboard.customer_list')}
        </button>
      </div>

      {/* Search and Add */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Input
            placeholder={t('dashboard.enter_staff_name')}
            className="w-80 pl-10"
            value={filters.searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#9fa5ad]" />
        </div>

        <Button className="bg-[#f05a29] hover:bg-[#df4615] text-white" onClick={handleAddStaff}>
          <Plus className="w-4 h-4 mr-2" />
          {t('dashboard.add_staff')}
        </Button>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2 mb-4">
        <button
          className={`px-4 py-2 rounded-full text-sm transition-all duration-200 ${
            sortedStaffList.length > 0 && sortedStaffList.every((staff) => filters.selectedIds.includes(staff.id))
              ? 'bg-[#0d1523] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={handleSelectAll}
        >
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border border-white rounded flex items-center justify-center">
              {sortedStaffList.length > 0 &&
                sortedStaffList.every((staff) => filters.selectedIds.includes(staff.id)) && (
                  <span className="text-xs">✓</span>
                )}
            </div>
            <span>{t('dashboard.select_all')}</span>
          </div>
        </button>

        {selectedCount > 0 && (
          <button className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm border border-orange-300">
            {t('dashboard.selected')} {selectedCount}
          </button>
        )}

        {selectedCount > 0 && (
          <div className="flex space-x-2 ml-4">
            <button
              className="w-8 h-8 bg-[#0d1523] text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
              onClick={handleBulkEdit}
              title={t('dashboard.bulk_edit')}
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              className="w-8 h-8 bg-[#f05a29] text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
              onClick={handleBulkDelete}
              title={t('dashboard.bulk_delete')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-[#f05a29] text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">{t('dashboard.serial_number')}</th>
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
              <th className="px-4 py-3 text-left text-sm font-medium">{t('dashboard.action')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedStaffList.map((staff, index) => {
              // Calculate correct STT based on pagination
              const startIndex = pagination ? (pagination.currentPage - 1) * pagination.itemsPerPage : 0;
              const stt = startIndex + index + 1;

              return (
                <tr
                  key={staff.id}
                  className={`border-b border-[#f1f3f4] ${filters.selectedIds.includes(staff.id) ? 'bg-[#f1f3f4]' : ''}`}
                >
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.selectedIds.includes(staff.id)}
                        onCheckedChange={() => handleSelectStaff(staff.id)}
                      />
                      <span className={filters.selectedIds.includes(staff.id) ? 'text-[#f05a29] font-medium' : ''}>
                        {stt}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{staff.name}</td>
                  <td className="px-4 py-3 text-sm text-[#9fa5ad]">{staff.jobTitle}</td>
                  <td className="px-4 py-3 text-sm text-blue-600">{staff.email}</td>
                  <td className="px-4 py-3 text-sm">{staff.phone}</td>
                  <td className="px-4 py-3 text-sm font-medium">{staff.salary}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        staff.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : staff.status === 'INACTIVE'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
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
                    <div className="flex space-x-2">
                      <button className="p-1 hover:bg-[#f1f3f4] rounded" onClick={() => handleViewStaff(staff)}>
                        <Eye className="w-4 h-4 text-[#9fa5ad]" />
                      </button>
                      <button className="p-1 hover:bg-[#f1f3f4] rounded" onClick={() => handleEditStaff(staff)}>
                        <Edit className="w-4 h-4 text-[#9fa5ad]" />
                      </button>
                      <button
                        className="p-1 hover:bg-[#f1f3f4] rounded"
                        onClick={() => handleToggleStaffStatus(staff)}
                        title={
                          staff.status === 'ACTIVE' ? t('dashboard.inactive_staff') : t('dashboard.activate_staff')
                        }
                      >
                        {staff.status === 'ACTIVE' ? (
                          <UserX className="w-4 h-4 text-[#f05a29]" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-green-600" />
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
        <div className="flex items-center justify-between mt-6">
          {/* Pagination Info */}
          <div className="text-sm text-gray-600">
            {`${t('dashboard.showing')} ${(pagination.currentPage - 1) * pagination.itemsPerPage + 1} - ${Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} ${t('dashboard.of_total')} ${currentUser ? Math.max(0, pagination.totalItems - 1) : pagination.totalItems} ${t('dashboard.staff_members')}`}
          </div>

          {/* Main Pagination Container */}
          <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 shadow-sm">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className={`p-2 rounded-full transition-all duration-200 ${
                pagination.hasPrevPage
                  ? 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Info - Single Container */}
            <div className="flex items-center px-4 py-2 mx-2">
              <span className="text-sm text-gray-500 font-medium mr-2">{t('dashboard.page')}</span>
              <div className="bg-[#0d1523] text-white px-2 py-1 rounded text-sm font-bold min-w-[24px] text-center">
                {pagination.currentPage}
              </div>
              <span className="text-sm text-gray-500 font-medium ml-2">/ {pagination.totalPages}</span>
            </div>

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className={`p-2 rounded-full transition-all duration-200 ${
                pagination.hasNextPage
                  ? 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Staff Profile Modal */}
      <StaffProfileModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        staff={selectedStaff}
        initialEditMode={isEditMode}
      />

      {/* Status Update Confirmation Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {staffToUpdate?.status === 'ACTIVE'
                ? t('dashboard.confirm_inactive_staff')
                : t('dashboard.confirm_activate_staff')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {staffToUpdate?.status === 'ACTIVE'
                ? t('dashboard.inactive_staff_description', { name: staffToUpdate?.name })
                : t('dashboard.activate_staff_description', { name: staffToUpdate?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStatusDialogOpen(false)}>{t('dashboard.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusUpdate}
              className={
                staffToUpdate?.status === 'ACTIVE' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }
            >
              {staffToUpdate?.status === 'ACTIVE' ? t('dashboard.inactive') : t('dashboard.activate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
