import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Building2,
  Download,
  ChevronDown,
  Check,
  MapPin,
  HelpCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { QRCodeButton } from '../../components/QRCodeButton';
import { EquipmentDetailModal } from '../../components/modals/EquipmentDetailModal';
import { Checkbox } from '@/components/ui/checkbox';
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
  useEquipmentList,
  useEquipmentStats,
  useDeleteEquipment,
  useUpdateEquipmentStatus
} from '../../hooks/useEquipment';
import { useEquipmentQR } from '../../hooks/useEquipmentQR';
import { useBranch } from '../../contexts/BranchContext';
import { useCurrentUserStaff } from '../../hooks/useCurrentUserStaff';
import type { Equipment, EquipmentCategory, EquipmentStatus } from '../../types/api/Equipment';
import { getEquipmentStatusDisplay, EQUIPMENT_CATEGORY_DISPLAY } from '../../types/api/Equipment';
import { useEquipmentTour } from '../../hooks/useEquipmentTour';
import { EquipmentCategoryCardsMobile } from '../../components/equipment/EquipmentCategoryCardsMobile';

export const EquipmentListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { startEquipmentTour } = useEquipmentTour();

  // Determine base path based on current location
  const getBasePath = () => {
    if (location.pathname.startsWith('/manage/technician')) {
      return '/manage/technician/equipment';
    } else if (location.pathname.startsWith('/manage')) {
      return '/manage/equipment';
    }
    return '/manage/technician/equipment'; // fallback
  };

  const { loading: userLoading } = useCurrentUserStaff();
  const { currentBranch, loading: branchesLoading } = useBranch();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'equipment' | 'repair' | 'maintenance'>('equipment');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);

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
    branchId: currentBranch?._id || undefined,
    category: (selectedCategory as EquipmentCategory) || undefined,
    status: (selectedStatus as EquipmentStatus) || undefined,
    search: searchTerm || undefined
  });

  // Equipment stats - only fetch when a specific branch is selected
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useEquipmentStats(currentBranch?._id || undefined);

  // Delete equipment mutation
  const { deleteEquipment, loading: deleteLoading, error: deleteError } = useDeleteEquipment();

  // Update equipment status mutation
  const { loading: statusLoading, error: statusError } = useUpdateEquipmentStatus();

  // QR Code operations
  const { downloadAllQRCodes, loading: qrLoading, error: qrError } = useEquipmentQR();

  // Update filters when search/filter values change
  useEffect(() => {
    if (!currentBranch?._id) return;

    updateFilters({
      page: currentPage,
      limit: 10,
      branchId: currentBranch._id,
      category: (selectedCategory as EquipmentCategory) || undefined,
      status: (selectedStatus as EquipmentStatus) || undefined,
      search: searchTerm || undefined
    });
  }, [currentPage, currentBranch?._id, selectedCategory, selectedStatus, searchTerm, updateFilters]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowCategoryDropdown(false);
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDelete = (equipment: Equipment) => {
    setEquipmentToDelete(equipment);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!equipmentToDelete) return;

    await deleteEquipment(equipmentToDelete._id);
    refetchEquipments();
    refetchStats();
    toast.success(t('equipment.delete_success'));
    setShowDeleteDialog(false);
    setEquipmentToDelete(null);
  };

  const handleViewEquipment = (equipment: Equipment) => {
    setSelectedEquipmentId(equipment._id);
    setShowDetailModal(true);
  };

  const handleEdit = (equipment: Equipment) => {
    navigate(`${getBasePath()}/${equipment._id}/edit`);
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

    if (window.confirm(t('equipment.confirm_bulk_delete', { count: selectedIds.length }))) {
      const deletePromises = selectedIds.map((id) => deleteEquipment(id));
      await Promise.all(deletePromises);

      setSelectedIds([]);
      refetchEquipments();
      refetchStats();
      toast.success(t('equipment.delete_success'));
    }
  };

  const handleDownloadAllQRCodes = async () => {
    if (!currentBranch?._id) {
      toast.error(t('equipment.select_branch_to_download'));
      return;
    }

    const blob = await downloadAllQRCodes(currentBranch._id);
    if (blob) {
      const branchName = currentBranch.branchName || 'Unknown';

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-codes-${branchName}-${currentBranch._id}.zip`;
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
            {currentBranch?._id && stats && !statsLoading ? (
              <div>
                <div className="mb-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-full w-fit">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-semibold text-orange-600">
                      {t('equipment.filtering_by_branch') || 'Filtering by branch'}: {currentBranch.branchName}
                    </span>
                  </div>
                </div>

                {/* Mobile Category Cards - Simplified (no descriptions) */}
                <EquipmentCategoryCardsMobile
                  totalEquipments={stats.totalEquipments}
                  categoryStats={stats.categoryStats}
                />

                {/* Desktop Category Cards - Full version with descriptions */}
                <div className="hidden lg:block mb-4" data-tour="equipment-stats-cards">
                  <div className="rounded-xl border border-orange-100 bg-[#FFF6EE] p-6">
                    <div className="mb-6">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-orange-500 mb-2">
                          {t('equipment.total_equipment_helper')}
                        </div>
                        <div className="text-4xl font-bold text-gray-900 mb-2">{stats.totalEquipments}</div>
                      </div>
                    </div>

                    {/* Category Cards Grid inside TOTAL card */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-900 mb-1">STRENGTH</div>
                        <div className="text-2xl font-semibold text-gray-900 mb-1">
                          {stats.categoryStats.find((c) => c._id === 'STRENGTH')?.count || 0}
                        </div>
                        <p className="text-xs text-gray-500">
                          {t('equipment.strength_helper') || 'Strength training equipment'}
                        </p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-900 mb-1">CARDIO</div>
                        <div className="text-2xl font-semibold text-gray-900 mb-1">
                          {stats.categoryStats.find((c) => c._id === 'CARDIO')?.count || 0}
                        </div>
                        <p className="text-xs text-gray-500">
                          {t('equipment.cardio_helper') || 'Cardiovascular equipment'}
                        </p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-900 mb-1">
                          FLEXIBILITY
                        </div>
                        <div className="text-2xl font-semibold text-gray-900 mb-1">
                          {stats.categoryStats.find((c) => c._id === 'FLEXIBILITY')?.count || 0}
                        </div>
                        <p className="text-xs text-gray-500">
                          {t('equipment.flexibility_helper') || 'Flexibility & stretching equipment'}
                        </p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-900 mb-1">
                          FUNCTIONAL
                        </div>
                        <div className="text-2xl font-semibold text-gray-900 mb-1">
                          {stats.categoryStats.find((c) => c._id === 'FUNCTIONAL')?.count || 0}
                        </div>
                        <p className="text-xs text-gray-500">
                          {t('equipment.functional_helper') || 'Functional training equipment'}
                        </p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-900 mb-1">SPORTS</div>
                        <div className="text-2xl font-semibold text-gray-900 mb-1">
                          {stats.categoryStats.find((c) => c._id === 'SPORTS')?.count || 0}
                        </div>
                        <p className="text-xs text-gray-500">{t('equipment.sports_helper') || 'Sports equipment'}</p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-900 mb-1">
                          ACCESSORIES
                        </div>
                        <div className="text-2xl font-semibold text-gray-900 mb-1">
                          {stats.categoryStats.find((c) => c._id === 'ACCESSORIES')?.count || 0}
                        </div>
                        <p className="text-xs text-gray-500">
                          {t('equipment.accessories_helper') || 'Equipment accessories'}
                        </p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-900 mb-1">OTHER</div>
                        <div className="text-2xl font-semibold text-gray-900 mb-1">
                          {stats.categoryStats.find((c) => c._id === 'OTHER')?.count || 0}
                        </div>
                        <p className="text-xs text-gray-500">{t('equipment.other_helper') || 'Other equipment'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
                <div className="text-gray-500">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t('common.loading') || 'Loading...'}</h3>
                </div>
              </div>
            )}
          </div>

          {/* Tabs + actions + search */}
          <div className="mb-8 flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2" data-tour="equipment-tabs">
                <button
                  onClick={() => setActiveTab('equipment')}
                  className={`inline-flex items-center rounded-full px-4 sm:px-6 py-2 text-sm font-medium transition-all ${
                    activeTab === 'equipment'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500'
                  }`}
                >
                  <Building2 className="mr-1 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">{t('equipment.equipment_list')}</span>
                  <span className="sm:hidden">Equipment</span>
                </button>
                <button
                  onClick={() => setActiveTab('repair')}
                  className={`inline-flex items-center rounded-full px-4 sm:px-6 py-2 text-sm font-medium transition-all ${
                    activeTab === 'repair'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500'
                  }`}
                >
                  <span className="hidden sm:inline">{t('equipment.repair_requests')}</span>
                  <span className="sm:hidden">Repair</span>
                </button>
                <button
                  onClick={() => setActiveTab('maintenance')}
                  className={`inline-flex items-center rounded-full px-4 sm:px-6 py-2 text-sm font-medium transition-all ${
                    activeTab === 'maintenance'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500'
                  }`}
                >
                  <span className="hidden sm:inline">{t('equipment.report_history')}</span>
                  <span className="sm:hidden">History</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-600">
                    {t('dashboard.selected')} {selectedCount}
                  </span>
                )}
                <button
                  className="h-11 w-11 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
                  onClick={startEquipmentTour}
                  title={t('equipment.tour.button', 'Hướng dẫn')}
                >
                  <HelpCircle className="w-4 h-4 text-gray-500 hover:text-orange-500" />
                </button>
                <button
                  className="h-11 rounded-full bg-orange-500 px-4 sm:px-6 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 flex items-center gap-2"
                  onClick={() => navigate(`${getBasePath()}/add`)}
                  data-tour="equipment-add-button"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('equipment.add_equipment')}</span>
                  <span className="sm:hidden">Add</span>
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
                  data-tour="equipment-search-input"
                />
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2" data-tour="equipment-filters">
                {/* Category Filter */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => {
                      setShowCategoryDropdown(!showCategoryDropdown);
                      setShowStatusDropdown(false);
                    }}
                    className="h-11 px-3 sm:px-4 border border-gray-200 rounded-full bg-white text-sm font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 flex items-center justify-between w-full sm:min-w-[140px] lg:min-w-[160px]"
                  >
                    <span className="truncate flex-1 text-left text-xs sm:text-sm">
                      {selectedCategory
                        ? EQUIPMENT_CATEGORY_DISPLAY[selectedCategory as keyof typeof EQUIPMENT_CATEGORY_DISPLAY]
                        : t('equipment.all_categories')}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform duration-200 ml-2 flex-shrink-0 ${showCategoryDropdown ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                      <button
                        onClick={() => {
                          setSelectedCategory('');
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                          selectedCategory === '' ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                        }`}
                      >
                        <span>{t('equipment.all_categories')}</span>
                        {selectedCategory === '' && <Check className="h-4 w-4 text-orange-500" />}
                      </button>
                      {Object.entries(EQUIPMENT_CATEGORY_DISPLAY).map(([key, value]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setSelectedCategory(key);
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                            selectedCategory === key ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                          }`}
                        >
                          <span>{value}</span>
                          {selectedCategory === key && <Check className="h-4 w-4 text-orange-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Filter */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => {
                      setShowStatusDropdown(!showStatusDropdown);
                      setShowCategoryDropdown(false);
                    }}
                    className="h-11 px-3 sm:px-4 border border-gray-200 rounded-full bg-white text-sm font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 flex items-center justify-between w-full sm:min-w-[140px] lg:min-w-[160px]"
                  >
                    <span className="truncate flex-1 text-left text-xs sm:text-sm">
                      {selectedStatus
                        ? getEquipmentStatusDisplay(selectedStatus, t).label
                        : t('equipment.all_statuses')}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform duration-200 ml-2 flex-shrink-0 ${showStatusDropdown ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showStatusDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                      <button
                        onClick={() => {
                          setSelectedStatus('');
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                          selectedStatus === '' ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                        }`}
                      >
                        <span>{t('equipment.all_statuses')}</span>
                        {selectedStatus === '' && <Check className="h-4 w-4 text-orange-500" />}
                      </button>
                      {['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'REPAIR', 'RETIRED'].map((key) => {
                        const statusDisplay = getEquipmentStatusDisplay(key, t);
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              setSelectedStatus(key);
                              setShowStatusDropdown(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                              selectedStatus === key ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                            }`}
                          >
                            <span>{statusDisplay.label}</span>
                            {selectedStatus === key && <Check className="h-4 w-4 text-orange-500" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleDownloadAllQRCodes}
                disabled={qrLoading || !currentBranch?._id}
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

          {/* Desktop Table */}
          <div
            className="hidden lg:block mt-4 overflow-hidden rounded-2xl border border-orange-100 shadow-sm"
            data-tour="equipment-list"
          >
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
                              onClick={() => handleViewEquipment(equipment)}
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
                              onClick={() => handleDelete(equipment)}
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

          {/* Mobile Cards */}
          <div className="lg:hidden mt-4 space-y-3" data-tour="equipment-list">
            {loading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                      </div>
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                      <div className="flex justify-between">
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : equipments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>{t('equipment.no_equipment')}</p>
              </div>
            ) : (
              equipments.map((equipment, index) => {
                const statusDisplay = getStatusDisplay(equipment.status);
                return (
                  <div
                    key={equipment._id}
                    className={`bg-white border border-gray-200 rounded-lg p-4 ${
                      selectedIds.includes(equipment._id) ? 'ring-2 ring-orange-200 bg-orange-50/50' : ''
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Header with checkbox and status */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedIds.includes(equipment._id)}
                            onCheckedChange={() => handleSelectEquipment(equipment._id)}
                          />
                          <span className="text-sm font-medium text-gray-600">
                            #{(currentPage - 1) * 10 + index + 1}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
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
                      </div>

                      {/* Equipment name */}
                      <div>
                        <h3 className="font-semibold text-gray-900 text-base">{equipment.equipmentName}</h3>
                        <p className="text-sm text-gray-500">Code: {equipment.equipmentCode}</p>
                      </div>

                      {/* Category */}
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Category:</span> {EQUIPMENT_CATEGORY_DISPLAY[equipment.category]}
                      </div>

                      {/* Purchase date */}
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Purchase Date:</span>{' '}
                        {new Date(equipment.dateOfPurchase).toLocaleDateString('vi-VN')}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-orange-200 hover:text-orange-500"
                            onClick={() => handleViewEquipment(equipment)}
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
                            onClick={() => handleDelete(equipment)}
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Info and Controls */}
          {(totalPages > 1 || totalItems > 0 || equipments.length > 0) && (
            <div
              className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
              data-tour="equipment-pagination"
            >
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

      {/* Equipment Detail Modal */}
      <EquipmentDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedEquipmentId(null);
        }}
        equipmentId={selectedEquipmentId}
        onEdit={(equipment) => {
          setShowDetailModal(false);
          setSelectedEquipmentId(null);
          handleEdit(equipment);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('equipment.confirm_delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('equipment.confirm_delete_message', {
                equipmentName: equipmentToDelete?.equipmentName || ''
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700" disabled={deleteLoading}>
              {deleteLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('equipment.deleting')}
                </>
              ) : (
                t('common.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
