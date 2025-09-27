import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Trash2, Building2, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { QRCodeButton } from '../../components/QRCodeButton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis
} from '@/components/ui/pagination';
// TechnicianSidebar is now handled by TechnicianLayout
// Import hooks thay vì API trực tiếp
import {
  useEquipmentList,
  useEquipmentStats,
  useDeleteEquipment,
  useUpdateEquipmentStatus
} from '../../hooks/useEquipment';
import { useEquipmentQR } from '../../hooks/useEquipmentQR';
import { useBranches } from '../../hooks/useBranches';
import { useCurrentUserStaff } from '../../hooks/useCurrentUserStaff';
import type { Equipment, EquipmentCategory, EquipmentStatus } from '../../types/api/Equipment';
import { getEquipmentStatusDisplay, EQUIPMENT_CATEGORY_DISPLAY } from '../../types/api/Equipment';

export const EquipmentListPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Sử dụng hooks thay vì state và API calls
  const { currentStaff: currentUser, loading: userLoading } = useCurrentUserStaff();
  const { branches, loading: branchesLoading } = useBranches();

  // Local state cho UI
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'equipment' | 'repair' | 'maintenance'>('equipment');
  const [currentPage, setCurrentPage] = useState(1);

  // Equipment list với filtering và pagination
  const {
    equipments,
    loading: equipmentsLoading,
    error: equipmentsError,
    pagination,
    refetch: refetchEquipments,
    updateFilters
  } = useEquipmentList({
    page: currentPage,
    limit: 10,
    branchId: selectedBranch || undefined,
    category: (selectedCategory as EquipmentCategory) || undefined,
    status: (selectedStatus as EquipmentStatus) || undefined,
    search: searchTerm || undefined
  });

  // Equipment stats
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useEquipmentStats(selectedBranch || undefined);

  // Delete equipment mutation
  const { deleteEquipment, loading: deleteLoading, error: deleteError } = useDeleteEquipment();

  // Update equipment status mutation
  const { loading: statusLoading, error: statusError } = useUpdateEquipmentStatus();

  // QR Code operations
  const { downloadAllQRCodes, loading: qrLoading, error: qrError } = useEquipmentQR();

  // Filter branches based on user role
  const filteredBranches = React.useMemo(() => {
    if (!currentUser) return branches;

    if (currentUser.isOwner || currentUser.isAdmin) {
      return branches; // Show all branches
    }

    // For STAFF, only show branches they have access to
    if (currentUser.branchId) {
      const userBranchIds = currentUser.branchId.map((branch) => branch._id);
      return branches.filter((branch) => userBranchIds.includes(branch._id));
    }

    return branches;
  }, [currentUser, branches]);

  // Auto-select first branch for STAFF if they only have access to one branch
  useEffect(() => {
    if (currentUser && !currentUser.isOwner && !currentUser.isAdmin && filteredBranches.length === 1) {
      const branchId = filteredBranches[0]._id;
      setSelectedBranch(branchId);
    }
  }, [currentUser, filteredBranches]);

  // Update filters when search/filter values change
  useEffect(() => {
    updateFilters({
      page: currentPage,
      limit: 10,
      branchId: selectedBranch || undefined,
      category: (selectedCategory as EquipmentCategory) || undefined,
      status: (selectedStatus as EquipmentStatus) || undefined,
      search: searchTerm || undefined
    });
  }, [currentPage, selectedBranch, selectedCategory, selectedStatus, searchTerm, updateFilters]);

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('equipment.confirm_delete'))) {
      await deleteEquipment(id);
      refetchEquipments();
      refetchStats();
      toast.success(t('equipment.delete_success'));
    }
  };

  const handleEdit = (equipment: Equipment) => {
    navigate(`/manage/technician/equipment/${equipment._id}/edit`);
  };

  const getStatusDisplay = (status: string) => {
    return getEquipmentStatusDisplay(status, t);
  };

  const selectedCount = selectedIds.length;

  const handleSelectAll = () => {
    const allIds = equipments.map((equipment) => equipment._id);
    const isAllSelected = allIds.every((id) => selectedIds.includes(id));

    if (isAllSelected) {
      // Bỏ chọn tất cả
      setSelectedIds(selectedIds.filter((id) => !allIds.includes(id)));
    } else {
      // Chọn tất cả
      setSelectedIds([...new Set([...selectedIds, ...allIds])]);
    }
  };

  const handleSelectEquipment = (equipmentId: string) => {
    setSelectedIds((prev) =>
      prev.includes(equipmentId) ? prev.filter((id) => id !== equipmentId) : [...prev, equipmentId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    if (window.confirm(t('equipment.confirm_delete'))) {
      const deletePromises = selectedIds.map((id) => deleteEquipment(id));
      await Promise.all(deletePromises);

      setSelectedIds([]);
      refetchEquipments();
      refetchStats();
      toast.success(t('equipment.delete_success'));
    }
  };

  const handleDownloadAllQRCodes = async () => {
    if (!selectedBranch) {
      toast.error(t('equipment.select_branch_to_download'));
      return;
    }

    const blob = await downloadAllQRCodes(selectedBranch);
    if (blob) {
      const branch = branches.find((b) => b._id === selectedBranch);
      const branchName = branch ? branch.branchName : 'Unknown';

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-codes-${branchName}-${selectedBranch}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(t('equipment.download_all_qr_codes_success'));
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedIds([]); // Clear selection when changing page
  };

  // Combined loading and error states
  const loading =
    equipmentsLoading || statsLoading || userLoading || branchesLoading || deleteLoading || statusLoading || qrLoading;
  const error = equipmentsError || statsError || deleteError || statusError || qrError;

  // Pagination info
  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.totalItems || 0;

  return (
    <div className="px-3 sm:px-4 lg:px-6">
      <div className="mt-4">
        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-500">
                  <Building2 className="h-3.5 w-3.5" />
                  {t('equipment.equipment_management')}
                </span>
                <h2 className="mt-3 text-2xl font-semibold text-gray-900">{t('equipment.equipment')}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {t('equipment.equipment_overview_subtitle') ||
                    'Monitor equipment distribution and status across your facilities.'}
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-orange-100 bg-[#FFF6EE] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-orange-500">TOTAL</div>
                  <div className="mt-2 flex items-end justify-between">
                    <div className="text-3xl font-bold text-gray-900">{stats.totalEquipments}</div>
                    <div className="rounded-full bg-white/70 p-2 text-orange-500">
                      <Building2 className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {t('equipment.total_equipment_helper') || 'Total equipment items'}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">Strength</div>
                  <div className="mt-2 flex items-end justify-between text-gray-900">
                    <span className="text-3xl font-semibold">
                      {stats.categoryStats.find((c) => c._id === 'STRENGTH')?.count || 0}
                    </span>
                    <div className="rounded-full bg-white p-2 text-gray-500">
                      <span className="text-orange-600 font-bold text-sm">💪</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {t('equipment.strength_helper') || 'Strength training equipment'}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">Cardio</div>
                  <div className="mt-2 flex items-end justify-between text-gray-900">
                    <span className="text-3xl font-semibold">
                      {stats.categoryStats.find((c) => c._id === 'CARDIO')?.count || 0}
                    </span>
                    <div className="rounded-full bg-white p-2 text-gray-500">
                      <span className="text-red-600 font-bold text-sm">❤️</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {t('equipment.cardio_helper') || 'Cardiovascular equipment'}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">Flexibility</div>
                  <div className="mt-2 flex items-end justify-between text-gray-900">
                    <span className="text-3xl font-semibold">
                      {stats.categoryStats.find((c) => c._id === 'FLEXIBILITY')?.count || 0}
                    </span>
                    <div className="rounded-full bg-white p-2 text-gray-500">
                      <span className="text-blue-600 font-bold text-sm">🧘</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {t('equipment.flexibility_helper') || 'Flexibility & stretching equipment'}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">Functional</div>
                  <div className="mt-2 flex items-end justify-between text-gray-900">
                    <span className="text-3xl font-semibold">
                      {stats.categoryStats.find((c) => c._id === 'FUNCTIONAL')?.count || 0}
                    </span>
                    <div className="rounded-full bg-white p-2 text-gray-500">
                      <span className="text-green-600 font-bold text-sm">🏃</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {t('equipment.functional_helper') || 'Functional training equipment'}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">Sports</div>
                  <div className="mt-2 flex items-end justify-between text-gray-900">
                    <span className="text-3xl font-semibold">
                      {stats.categoryStats.find((c) => c._id === 'SPORTS')?.count || 0}
                    </span>
                    <div className="rounded-full bg-white p-2 text-gray-500">
                      <span className="text-purple-600 font-bold text-sm">⚽</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{t('equipment.sports_helper') || 'Sports equipment'}</p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">Accessories</div>
                  <div className="mt-2 flex items-end justify-between text-gray-900">
                    <span className="text-3xl font-semibold">
                      {stats.categoryStats.find((c) => c._id === 'ACCESSORIES')?.count || 0}
                    </span>
                    <div className="rounded-full bg-white p-2 text-gray-500">
                      <span className="text-yellow-600 font-bold text-sm">🔧</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {t('equipment.accessories_helper') || 'Equipment accessories'}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">Other</div>
                  <div className="mt-2 flex items-end justify-between text-gray-900">
                    <span className="text-3xl font-semibold">
                      {stats.categoryStats.find((c) => c._id === 'OTHER')?.count || 0}
                    </span>
                    <div className="rounded-full bg-white p-2 text-gray-500">
                      <span className="text-gray-600 font-bold text-sm">📦</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{t('equipment.other_helper') || 'Other equipment'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Tabs + actions + search */}
          <div className="mb-8 flex flex-col gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('equipment')}
                  className={`inline-flex items-center rounded-full px-6 py-2 text-sm font-medium transition-all ${
                    activeTab === 'equipment'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500'
                  }`}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  {t('equipment.equipment_list')}
                </button>
                <button
                  onClick={() => setActiveTab('repair')}
                  className={`inline-flex items-center rounded-full px-6 py-2 text-sm font-medium transition-all ${
                    activeTab === 'repair'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500'
                  }`}
                >
                  {t('equipment.repair_requests')}
                </button>
                <button
                  onClick={() => setActiveTab('maintenance')}
                  className={`inline-flex items-center rounded-full px-6 py-2 text-sm font-medium transition-all ${
                    activeTab === 'maintenance'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500'
                  }`}
                >
                  {t('equipment.report_history')}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-600">
                    {t('dashboard.selected')} {selectedCount}
                  </span>
                )}
                <button
                  className="h-11 rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 flex items-center gap-2"
                  onClick={() => navigate('/manage/technician/equipment/add')}
                >
                  <Plus className="h-4 w-4" />
                  {t('equipment.add_equipment')}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={t('equipment.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 w-full rounded-full border border-transparent bg-gray-50 pl-12 pr-4 text-sm shadow-inner focus:border-orange-200 focus:bg-white focus:ring-orange-200"
                />
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Branch Selector - Hide for STAFF with only 1 branch */}
              {(() => {
                const shouldHideSelector =
                  currentUser && !currentUser.isOwner && !currentUser.isAdmin && branches.length === 1;

                if (shouldHideSelector) {
                  return (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-full min-w-[200px]">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {branches[0]?.branchName} - {branches[0]?.location}
                      </span>
                    </div>
                  );
                }

                return (
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={selectedBranch}
                      onChange={(e) => handleBranchChange(e.target.value)}
                      className="h-11 pl-10 pr-4 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 min-w-[200px] bg-white"
                      disabled={branchesLoading}
                    >
                      <option value="">{t('equipment.all_branches')}</option>
                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.branchName} - {branch.location}
                        </option>
                      ))}
                    </select>
                    {branchesLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-11 px-4 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="">{t('equipment.all_categories')}</option>
                {Object.entries(EQUIPMENT_CATEGORY_DISPLAY).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-11 px-4 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="">{t('equipment.all_statuses')}</option>
                {['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'REPAIR', 'RETIRED'].map((key) => {
                  const statusDisplay = getEquipmentStatusDisplay(key, t);
                  return (
                    <option key={key} value={key}>
                      {statusDisplay.label}
                    </option>
                  );
                })}
              </select>

              <button
                onClick={handleDownloadAllQRCodes}
                disabled={qrLoading || !selectedBranch}
                className="h-11 rounded-full bg-blue-500 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm">
                  {qrLoading ? t('equipment.downloading_all_qr_codes') : t('equipment.qr_codes_short')}
                </span>
              </button>
            </div>
          </div>

          {selectedCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-gray-600">{t('dashboard.bulk_actions') || 'Bulk actions'}:</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-600 transition-all hover:bg-orange-100"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  {t('dashboard.bulk_delete')}
                </button>
              </div>
            </div>
          )}

          <button
            className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              equipments.length > 0 && equipments.every((equipment) => selectedIds.includes(equipment._id))
                ? 'border border-orange-200 bg-orange-100 text-orange-600 shadow-sm'
                : 'border border-gray-200 bg-white text-gray-500 hover:border-orange-200 hover:text-orange-500'
            }`}
            onClick={handleSelectAll}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                equipments.length > 0 && equipments.every((equipment) => selectedIds.includes(equipment._id))
                  ? 'border-orange-400 bg-orange-500 text-white'
                  : 'border-gray-300 text-transparent'
              }`}
            >
              {equipments.length > 0 && equipments.every((equipment) => selectedIds.includes(equipment._id)) && (
                <span className="text-[10px]">✓</span>
              )}
            </span>
            <span>{t('dashboard.select_all')}</span>
          </button>

          {/* Table */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-orange-100 shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-[#FFF7EF]">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-orange-600 first:rounded-l-2xl">
                    {t('equipment.stt')}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-orange-600">{t('equipment.code')}</th>
                  <th className="px-4 py-3 text-sm font-semibold text-orange-600">{t('equipment.equipment_name')}</th>
                  <th className="px-4 py-3 text-sm font-semibold text-orange-600">{t('equipment.equipment_status')}</th>
                  <th className="px-4 py-3 text-sm font-semibold text-orange-600">
                    {t('equipment.equipment_category')}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-orange-600">{t('equipment.date_of_purchase')}</th>
                  <th className="px-4 py-3 text-sm font-semibold text-orange-600 last:rounded-r-2xl">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50 bg-white text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : equipments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      {t('equipment.no_equipment')}
                    </td>
                  </tr>
                ) : (
                  equipments.map((equipment, index) => {
                    const statusDisplay = getStatusDisplay(equipment.status);
                    return (
                      <tr
                        key={equipment._id}
                        className={`${selectedIds.includes(equipment._id) ? 'bg-orange-50/80' : index % 2 === 0 ? 'bg-white' : 'bg-[#FFF9F2]'}`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={selectedIds.includes(equipment._id)}
                              onCheckedChange={() => handleSelectEquipment(equipment._id)}
                            />
                            <span
                              className={
                                selectedIds.includes(equipment._id)
                                  ? 'font-semibold text-orange-500'
                                  : 'font-medium text-gray-700'
                              }
                            >
                              {(currentPage - 1) * 10 + index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{equipment.equipmentCode}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{equipment.equipmentName}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex min-w-[88px] justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                              statusDisplay.color === 'green'
                                ? 'bg-green-50 text-green-600'
                                : statusDisplay.color === 'yellow'
                                  ? 'bg-yellow-50 text-yellow-600'
                                  : statusDisplay.color === 'red'
                                    ? 'bg-red-50 text-red-500'
                                    : statusDisplay.color === 'orange'
                                      ? 'bg-orange-50 text-orange-600'
                                      : 'bg-gray-50 text-gray-600'
                            }`}
                          >
                            {statusDisplay.icon} {statusDisplay.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {EQUIPMENT_CATEGORY_DISPLAY[equipment.category]}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(equipment.dateOfPurchase).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-orange-200 hover:text-orange-500"
                              onClick={() => navigate(`/manage/technician/equipment/${equipment._id}`)}
                              title="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <QRCodeButton
                              equipment={equipment}
                              size="sm"
                              variant="outline"
                              showText={false}
                              onQRGenerated={() => {
                                refetchEquipments();
                              }}
                            />
                            <button
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-orange-200 hover:text-orange-500"
                              onClick={() => handleEdit(equipment)}
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-orange-100 bg-orange-50 text-orange-500 transition-colors hover:bg-orange-100"
                              onClick={() => handleDelete(equipment._id)}
                              title="Xóa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Info and Controls */}
          {(totalPages > 1 || totalItems > 0 || equipments.length > 0) && (
            <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-gray-500">
                {`${t('dashboard.showing')} ${(currentPage - 1) * 10 + 1} - ${Math.min(currentPage * 10, totalItems)} ${t('dashboard.of_total')} ${totalItems} ${t('equipment.equipment')}`}
              </div>

              {/* Pagination - Show if more than 1 page OR more than 10 items */}
              {(totalPages > 1 || totalItems > 10) && (
                <div className="flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(currentPage - 1)}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>

                      {(() => {
                        const maxVisible = 7;
                        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                        const endPage = Math.min(totalPages, startPage + maxVisible - 1);

                        if (endPage - startPage + 1 < maxVisible) {
                          startPage = Math.max(1, endPage - maxVisible + 1);
                        }

                        const pages = [];

                        // First page + ellipsis
                        if (startPage > 1) {
                          pages.push(
                            <PaginationItem key={1}>
                              <PaginationLink onClick={() => handlePageChange(1)} className="cursor-pointer">
                                1
                              </PaginationLink>
                            </PaginationItem>
                          );
                          if (startPage > 2) {
                            pages.push(
                              <PaginationItem key="ellipsis1">
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                        }

                        // Middle pages
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <PaginationItem key={i}>
                              <PaginationLink
                                onClick={() => handlePageChange(i)}
                                isActive={i === currentPage}
                                className={`cursor-pointer ${i === currentPage ? 'border-orange-200 text-orange-600' : ''}`}
                              >
                                {i}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }

                        // Last page + ellipsis
                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <PaginationItem key="ellipsis2">
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          pages.push(
                            <PaginationItem key={totalPages}>
                              <PaginationLink onClick={() => handlePageChange(totalPages)} className="cursor-pointer">
                                {totalPages}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }

                        return pages;
                      })()}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(currentPage + 1)}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{t('common.error')}</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        refetchEquipments();
                        refetchStats();
                      }}
                      className="bg-red-100 px-2 py-1 text-sm font-medium text-red-800 rounded-md hover:bg-red-200"
                    >
                      {t('common.retry')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
