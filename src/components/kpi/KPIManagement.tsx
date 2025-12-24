import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  MapPin,
  Target,
  Calendar,
  XCircle,
  BarChart3,
  FileText,
  Loader2,
  AlertCircle,
  HelpCircle,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortableHeader } from '@/components/ui/SortableHeader';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
import { useKPIList, useDisableKPI } from '@/hooks/useKPI';
import { useKPITour } from '@/hooks/useKPITour';
import { kpiApi } from '@/services/api/kpiApi';
import { socketService } from '@/services/socket/socketService';
import { useTableSort } from '@/hooks/useTableSort';
import { useBranch } from '@/contexts/BranchContext';
import { sortArray } from '@/utils/sort';
import { formatCurrency } from '@/utils/currency';
import { CreateKPIModal } from './CreateKPIModal';
import { KPIDetailModal } from './KPIDetailModal';
import { toast } from 'sonner';
import type { KPIStatus, KPIDisplay, KPIListParams } from '@/types/api/KPI';
import type { KPIUpdateEvent } from '@/types/api/Socket';

type KPISortField = 'staffName' | 'actualRevenue' | 'commission';

const kpiSortConfig = {
  staffName: (item: KPIDisplay) => item.staffName || '',
  actualRevenue: (item: KPIDisplay) => item.actualRevenue || 0,
  commission: (item: KPIDisplay) => item.commission || 0
};

export const KPIManagement: React.FC = () => {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();
  const { startKPITour } = useKPITour();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingKpiId, setEditingKpiId] = useState<string | null>(null);
  const [viewingKpiId, setViewingKpiId] = useState<string | null>(null);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [kpiToDisable, setKpiToDisable] = useState<KPIDisplay | null>(null);
  const prevBranchIdRef = useRef<string | undefined>(undefined);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use the custom sort hook
  const { sortState, handleSort, getSortIcon } = useTableSort<KPISortField>();

  // KPI list hook
  const { kpiList, loading, error, pagination, refetch, updateFilters, goToPage } = useKPIList({
    branchId: currentBranch?._id,
    status: statusFilter !== 'all' ? (statusFilter as KPIStatus) : undefined
  });

  // KPI stats state
  const [kpiStats, setKpiStats] = useState({ total: 0, active: 0, cancelled: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // ✅ FIX: Refetch when branch changes
  useEffect(() => {
    const currentBranchId = currentBranch?._id;

    if (currentBranchId && currentBranchId !== prevBranchIdRef.current) {
      prevBranchIdRef.current = currentBranchId;
      updateFilters({
        page: 1,
        limit: 10,
        branchId: currentBranchId,
        status: statusFilter !== 'all' ? (statusFilter as KPIStatus) : undefined
      });
    } else if (!currentBranchId && prevBranchIdRef.current) {
      prevBranchIdRef.current = undefined;
      updateFilters({
        page: 1,
        limit: 10,
        branchId: undefined,
        status: statusFilter !== 'all' ? (statusFilter as KPIStatus) : undefined
      });
    }
  }, [currentBranch?._id, updateFilters, statusFilter]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const params: Partial<KPIListParams> = {};
      // Only add branchId if it exists
      if (currentBranch?._id) {
        params.branchId = currentBranch._id;
      }
      const response = await kpiApi.getKPIStats(params);
      if (response.success && response.data) {
        setKpiStats(response.data);
      } else {
        console.error('Failed to fetch KPI stats:', response.message);
      }
    } catch (err) {
      console.error('Failed to fetch KPI stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [currentBranch?._id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!currentBranch?._id) return;

    // Debounce refetch to prevent excessive API calls
    let debounceTimeout: NodeJS.Timeout | null = null;

    const handleKPIEvent = (data: KPIUpdateEvent) => {
      // Check if this event is for the current branch
      if (data?.branchId && currentBranch._id && data.branchId.toString() !== currentBranch._id.toString()) {
        return;
      }

      // Debounce refetch - wait 500ms after last event before refetching
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      debounceTimeout = setTimeout(() => {
        // Refetch both KPI list and stats for realtime update
        void refetch();
        void fetchStats();
      }, 500);
    };

    // Listen for both KPI creation and update events from socket
    socketService.on('kpi:created', handleKPIEvent);
    socketService.on('kpi:updated', handleKPIEvent);

    return () => {
      socketService.off('kpi:created', handleKPIEvent);
      socketService.off('kpi:updated', handleKPIEvent);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [currentBranch?._id, fetchStats, refetch]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Disable KPI hook
  const { disableKPI } = useDisableKPI();

  // Sort KPI list (search is now handled by backend)
  const filteredAndSortedKPIList = useMemo(() => {
    // Apply sorting only (search is done on backend)
    return sortArray(kpiList, sortState, (item, field) => {
      const extractor = kpiSortConfig[field as keyof typeof kpiSortConfig];
      return extractor ? extractor(item) : '';
    });
  }, [kpiList, sortState]);

  // Handle disable KPI - open dialog
  const handleDisableKPI = (kpi: KPIDisplay) => {
    setKpiToDisable(kpi);
    setDisableDialogOpen(true);
  };

  // Confirm disable KPI
  const confirmDisableKPI = async () => {
    if (!kpiToDisable) return;

    try {
      await disableKPI(kpiToDisable.id);
      toast.success(t('kpi.disable_success', 'Vô hiệu hóa KPI thành công'));
      refetch();
      // Refetch stats after disabling
      const params: Partial<KPIListParams> = {};
      if (currentBranch?._id) {
        params.branchId = currentBranch._id;
      }
      const statsResponse = await kpiApi.getKPIStats(params);
      if (statsResponse.success && statsResponse.data) {
        setKpiStats(statsResponse.data);
      }
      setDisableDialogOpen(false);
      setKpiToDisable(null);
    } catch (_error) {
      toast.error(t('kpi.disable_error', 'Không thể vô hiệu hóa KPI'));
    }
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    updateFilters({
      status: value !== 'all' ? (value as KPIStatus) : undefined
    });
  };

  // Handle search change with debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search to avoid too many API calls
    searchTimeoutRef.current = setTimeout(() => {
      updateFilters({
        search: value.trim() || undefined,
        page: 1 // Reset to page 1 when searching
      });
    }, 500); // Wait 500ms after user stops typing
  };

  // Handle view KPI
  const handleViewKPI = (id: string) => {
    setViewingKpiId(id);
  };

  // Handle select all
  const handleSelectAll = () => {
    const allIds = filteredAndSortedKPIList.map((kpi) => kpi.id);
    const isAllSelected = allIds.every((id) => selectedIds.includes(id));

    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...allIds])]);
    }
  };

  // Handle select KPI
  const handleSelectKPI = (kpiId: string) => {
    setSelectedIds((prev) => (prev.includes(kpiId) ? prev.filter((id) => id !== kpiId) : [...prev, kpiId]));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    goToPage(newPage);
  };

  const selectedCount = selectedIds.length;

  // Pagination pages calculation
  const paginationPages = useMemo(() => {
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
            <p className="text-gray-600">{t('kpi.loading', 'Đang tải KPI...')}</p>
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
              {t('kpi.try_again', 'Thử lại')}
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
              <Target className="h-3.5 w-3.5" />
              {t('kpi.badge', 'QUẢN LÝ KPI')}
            </span>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900">{t('kpi.management.title', 'Quản Lý KPI')}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('kpi.management.subtitle', 'Quản lý và theo dõi hiệu suất nhân viên với hệ thống KPI')}
            </p>
            {currentBranch && (
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-600 font-medium">
                  {t('kpi.filtering_by_branch', 'Đang lọc theo chi nhánh')}: {currentBranch.branchName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-orange-100 bg-[#FFF6EE] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-orange-500">
              {t('kpi.stats.total', 'Tổng KPI')}
            </div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-3xl font-bold text-gray-900">{statsLoading ? '...' : kpiStats.total}</div>
              <div className="rounded-full bg-white/70 p-2 text-orange-500">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {currentBranch
                ? `${t('kpi.stats.total_helper', 'Tổng số KPI')} - ${currentBranch.branchName}`
                : t('kpi.stats.total_helper', 'Tổng số KPI')}
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-green-600">
              {t('kpi.stats.active', 'KPI Đang Hoạt Động')}
            </div>
            <div className="mt-2 flex items-end justify-between text-gray-900">
              <span className="text-3xl font-semibold">{statsLoading ? '...' : kpiStats.active}</span>
              <div className="rounded-full bg-white p-2 text-green-600">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">{t('kpi.stats.active_helper', 'KPI đang được theo dõi')}</p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-red-600">
              {t('kpi.stats.cancelled', 'KPI Đã Hủy')}
            </div>
            <div className="mt-2 flex items-end justify-between text-gray-900">
              <span className="text-3xl font-semibold">{statsLoading ? '...' : kpiStats.cancelled}</span>
              <div className="rounded-full bg-white p-2 text-red-600">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">{t('kpi.stats.cancelled_helper', 'KPI đã bị vô hiệu hóa')}</p>
          </div>
        </div>
      </div>

      {/* Tabs + actions + search */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center rounded-full px-6 py-2 text-sm font-medium bg-orange-500 text-white shadow-sm">
              <FileText className="mr-2 h-4 w-4" />
              {t('kpi.list', 'Danh sách KPI')}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-600">
                {t('dashboard.selected', 'Đã chọn')} {selectedCount}
              </span>
            )}
            <Button
              className="h-11 rounded-full px-6 text-sm font-semibold shadow-sm bg-orange-500 text-white hover:bg-orange-600"
              onClick={() => setIsCreateModalOpen(true)}
              data-tour="create-kpi-button"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('kpi.actions.create', 'Tạo KPI')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full border-gray-300 hover:bg-gray-50"
              onClick={startKPITour}
              title={t('kpi.tour.button', 'Hướng dẫn')}
            >
              <HelpCircle className="w-4 h-4 text-gray-500 hover:text-orange-500" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Input
              placeholder={t('kpi.search_placeholder', 'Tìm kiếm theo tên, chi nhánh...')}
              className="h-11 rounded-full border border-transparent bg-gray-50 pl-12 text-sm shadow-inner focus:border-orange-200 focus:bg-white focus:ring-orange-200"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="h-11 rounded-full border-gray-200 bg-white">
                <SelectValue placeholder={t('kpi.filter_by_status', 'Lọc theo trạng thái')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('kpi.status.all', 'Tất cả trạng thái')}</SelectItem>
                <SelectItem value="ACTIVE">{t('kpi.status.active', 'Đang hoạt động')}</SelectItem>
                <SelectItem value="CANCELLED">{t('kpi.status.cancelled', 'Đã hủy')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <button
            className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              filteredAndSortedKPIList.length > 0 &&
              filteredAndSortedKPIList.every((kpi) => selectedIds.includes(kpi.id))
                ? 'border border-orange-200 bg-orange-100 text-orange-600 shadow-sm'
                : 'border border-gray-200 bg-white text-gray-500 hover:border-orange-200 hover:text-orange-500'
            }`}
            onClick={handleSelectAll}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                filteredAndSortedKPIList.length > 0 &&
                filteredAndSortedKPIList.every((kpi) => selectedIds.includes(kpi.id))
                  ? 'border-orange-400 bg-orange-500 text-white'
                  : 'border-gray-300 text-transparent'
              }`}
            >
              {filteredAndSortedKPIList.length > 0 &&
                filteredAndSortedKPIList.every((kpi) => selectedIds.includes(kpi.id)) && (
                  <span className="text-[10px]">✓</span>
                )}
            </span>
            <span>{t('dashboard.select_all', 'Chọn tất cả')}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      {filteredAndSortedKPIList.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-orange-100 shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-[#FFF7EF]">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-orange-600 first:rounded-l-2xl">
                    {t('dashboard.serial_number', 'STT')}
                  </th>
                  <SortableHeader
                    field="staffName"
                    label={t('kpi.table.staff_name', 'Nhân viên')}
                    sortState={sortState}
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                  />
                  <th className="px-4 py-3 text-sm font-semibold text-orange-600">{t('kpi.table.period', 'Kỳ')}</th>
                  <th className="px-4 py-3 text-sm font-semibold text-orange-600">
                    {t('kpi.table.targets', 'Mục tiêu')}
                  </th>
                  <SortableHeader
                    field="actualRevenue"
                    label={t('kpi.table.actual', 'Thực tế')}
                    sortState={sortState}
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                  />
                  <SortableHeader
                    field="commission"
                    label={t('kpi.table.commission', 'Hoa hồng')}
                    sortState={sortState}
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                  />
                  <th className="px-4 py-3 text-sm font-semibold text-orange-600 last:rounded-r-2xl">
                    {t('kpi.table.actions', 'Thao tác')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50 bg-white text-gray-700">
                {filteredAndSortedKPIList.map((kpi, index) => {
                  const startIndex = pagination ? (pagination.currentPage - 1) * pagination.itemsPerPage : 0;
                  const stt = startIndex + index + 1;

                  return (
                    <tr
                      key={kpi.id}
                      className={`${
                        selectedIds.includes(kpi.id) ? 'bg-orange-50/80' : index % 2 === 0 ? 'bg-white' : 'bg-[#FFF9F2]'
                      } hover:bg-orange-50 transition-colors`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedIds.includes(kpi.id)}
                            onCheckedChange={() => handleSelectKPI(kpi.id)}
                          />
                          <span
                            className={
                              selectedIds.includes(kpi.id)
                                ? 'font-semibold text-orange-500'
                                : 'font-medium text-gray-700'
                            }
                          >
                            {stt}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{kpi.staffName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">{kpi.period}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="space-y-1">
                          {kpi.targetRevenue !== undefined && kpi.targetRevenue !== null && kpi.targetRevenue > 0 && (
                            <div className="text-xs">
                              <span className="font-medium">DT:</span> {formatCurrency(kpi.targetRevenue)}
                            </div>
                          )}
                          {kpi.targetNewMembers !== undefined &&
                            kpi.targetNewMembers !== null &&
                            kpi.targetNewMembers > 0 && (
                              <div className="text-xs">
                                <span className="font-medium">KH:</span> {kpi.targetNewMembers}
                              </div>
                            )}
                          {kpi.targetPtSessions !== undefined &&
                            kpi.targetPtSessions !== null &&
                            kpi.targetPtSessions > 0 && (
                              <div className="text-xs">
                                <span className="font-medium">PT:</span> {kpi.targetPtSessions}
                              </div>
                            )}
                          {kpi.targetContracts !== undefined &&
                            kpi.targetContracts !== null &&
                            kpi.targetContracts > 0 && (
                              <div className="text-xs">
                                <span className="font-medium">HĐ:</span> {kpi.targetContracts}
                              </div>
                            )}
                          {(!kpi.targetRevenue || kpi.targetRevenue === 0) &&
                            (!kpi.targetNewMembers || kpi.targetNewMembers === 0) &&
                            (!kpi.targetPtSessions || kpi.targetPtSessions === 0) &&
                            (!kpi.targetContracts || kpi.targetContracts === 0) && (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="space-y-1">
                          {kpi.actualRevenue !== undefined && kpi.actualRevenue !== null && (
                            <div className="text-xs">
                              <span className="font-medium">DT:</span> {formatCurrency(kpi.actualRevenue)}
                            </div>
                          )}
                          {kpi.actualPtSessions !== undefined && kpi.actualPtSessions !== null && (
                            <div className="text-xs">
                              <span className="font-medium">PT:</span> {kpi.actualPtSessions}
                            </div>
                          )}
                          {(kpi.actualRevenue === undefined || kpi.actualRevenue === null) &&
                            (kpi.actualPtSessions === undefined || kpi.actualPtSessions === null) && (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {kpi.commission !== undefined && kpi.commission !== null && kpi.commission > 0
                          ? formatCurrency(kpi.commission)
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-orange-200 hover:text-orange-500 hover:bg-orange-50"
                              title={t('kpi.actions.menu', 'Thao tác')}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleViewKPI(kpi.id)}>
                              <BarChart3 className="mr-2 h-4 w-4" />
                              <span>{t('kpi.actions.view', 'Xem chi tiết')}</span>
                            </DropdownMenuItem>
                            {kpi.status === 'ACTIVE' && (
                              <>
                                <DropdownMenuItem onClick={() => setEditingKpiId(kpi.id)}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  <span>{t('kpi.actions.edit', 'Chỉnh sửa')}</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDisableKPI(kpi)}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  <span>{t('kpi.actions.disable', 'Vô hiệu hóa')}</span>
                                </DropdownMenuItem>
                              </>
                            )}
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
          {pagination && (
            <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-gray-500">
                {`${t('dashboard.showing', 'Hiển thị')} ${(pagination.currentPage - 1) * pagination.itemsPerPage + 1} - ${Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} ${t('dashboard.of_total', 'của')} ${pagination.totalItems} ${t('kpi.items', 'KPI')}`}
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
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-12 text-center">
          <div className="text-gray-400 mb-4">
            <BarChart3 className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('kpi.no_kpi_found', 'Không tìm thấy KPI nào')}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? t('kpi.no_kpi_filtered', 'Không có KPI nào phù hợp với bộ lọc của bạn')
              : t('kpi.no_kpi_message', 'Bắt đầu bằng cách tạo KPI mới cho nhân viên của bạn')}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('kpi.actions.create', 'Tạo KPI')}
            </Button>
          )}
        </div>
      )}

      {/* Create/Edit KPI Modal */}
      <CreateKPIModal
        open={isCreateModalOpen || editingKpiId !== null}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingKpiId(null);
        }}
        onSuccess={() => {
          refetch();
          setIsCreateModalOpen(false);
          setEditingKpiId(null);
        }}
        kpiId={editingKpiId || undefined}
        mode={editingKpiId ? 'edit' : 'create'}
      />

      {/* KPI Detail Modal */}
      <KPIDetailModal
        kpiId={viewingKpiId}
        isOpen={viewingKpiId !== null}
        onClose={() => {
          setViewingKpiId(null);
        }}
      />

      {/* Disable KPI Confirmation Dialog */}
      <AlertDialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('kpi.confirm.disable_title', 'Xác nhận vô hiệu hóa KPI')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('kpi.confirm.disable', 'Bạn có chắc chắn muốn vô hiệu hóa KPI này?')}
              {kpiToDisable && (
                <span className="block mt-2 font-semibold text-gray-900">
                  {t('kpi.staff_name', 'Nhân viên')}: {kpiToDisable.staffName}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDisableDialogOpen(false)}>
              {t('dashboard.cancel', 'Hủy')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisableKPI} className="bg-red-600 hover:bg-red-700">
              {t('kpi.actions.disable', 'Vô hiệu hóa')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
