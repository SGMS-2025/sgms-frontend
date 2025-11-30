import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Percent, FileText, Loader2, AlertCircle, HelpCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  useCommissionPolicyList,
  useDeleteCommissionPolicy,
  useUpdateCommissionPolicy
} from '@/hooks/useCommissionPolicy';
import { CreateCommissionPolicyModal } from './CreateCommissionPolicyModal';
import { toast } from 'sonner';
import type { CommissionPolicy, CommissionPolicyStatus } from '@/types/api/CommissionPolicy';
import { commissionPolicyApi } from '@/services/api/commissionPolicyApi';

export const CommissionPolicyManagement: React.FC = () => {
  const { t } = useTranslation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<CommissionPolicy | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<CommissionPolicy | null>(null);
  const [selectedPolicies, setSelectedPolicies] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [filters, setFilters] = useState<{
    scope: 'all' | 'BRANCH' | 'ROLE' | 'PACKAGE' | 'GLOBAL';
    status: 'ACTIVE' | 'INACTIVE' | 'all';
    search: string;
  }>({
    scope: 'all',
    status: 'ACTIVE',
    search: ''
  });

  const { policies, loading, error, pagination, refetch, updateFilters, goToPage } = useCommissionPolicyList({
    status: filters.status === 'all' ? undefined : filters.status,
    scope: filters.scope === 'all' ? undefined : (filters.scope as 'BRANCH' | 'ROLE' | 'PACKAGE' | 'GLOBAL' | undefined)
  });

  const { deletePolicy, loading: deleteLoading } = useDeleteCommissionPolicy();
  const { updatePolicy, loading: updateLoading } = useUpdateCommissionPolicy();

  // Fetch stats from API
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      const params = {
        scope:
          filters.scope === 'all' ? undefined : (filters.scope as 'BRANCH' | 'ROLE' | 'PACKAGE' | 'GLOBAL' | undefined)
      };
      const response = await commissionPolicyApi.getPolicyStats(params);
      if (response.success && response.data) {
        setStats(response.data);
      }
      setStatsLoading(false);
    };
    fetchStats();
  }, [filters.scope]);

  // Filter policies by search term
  const filteredPolicies = useMemo(() => {
    if (filters.search === '') return policies;

    const searchTerm = filters.search.toLowerCase();
    return policies.filter((policy) => {
      const scopeLabel = getScopeLabel(policy.scope);
      const detail = getPolicyDetail(policy);
      return (
        scopeLabel.toLowerCase().includes(searchTerm) ||
        detail.toLowerCase().includes(searchTerm) ||
        policy.commissionRate.toString().includes(searchTerm)
      );
    });
  }, [policies, filters.search]);

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setFilters({ ...filters, status: value as typeof filters.status });
    updateFilters({
      status: value !== 'all' ? (value as CommissionPolicyStatus) : undefined
    });
    // Clear selection when filter changes
    setSelectedPolicies(new Set());
  };

  // Handle scope filter change
  const handleScopeFilterChange = (value: string) => {
    setFilters({ ...filters, scope: value as typeof filters.scope });
    updateFilters({
      scope: value !== 'all' ? (value as 'BRANCH' | 'ROLE' | 'PACKAGE' | 'GLOBAL') : undefined
    });
    // Clear selection when filter changes
    setSelectedPolicies(new Set());
  };

  // Handle search change
  const handleSearchChange = (value: string) => {
    setFilters({ ...filters, search: value });
    // Clear selection when search changes
    setSelectedPolicies(new Set());
  };

  // Handle disable/enable
  const handleToggleStatusClick = (policy: CommissionPolicy) => {
    setPolicyToDelete(policy);
    setDeleteDialogOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!policyToDelete) return;

    // If already INACTIVE, enable it
    if (policyToDelete.status === 'INACTIVE') {
      try {
        await updatePolicy(policyToDelete._id, { status: 'ACTIVE' });
        toast.success(t('commission.enable_success', 'Kích hoạt chính sách hoa hồng thành công'));
        // Remove from selection if it was selected
        setSelectedPolicies((prev) => {
          const newSet = new Set(prev);
          newSet.delete(policyToDelete._id);
          return newSet;
        });
        refetch();
        // Refetch stats after update
        const response = await commissionPolicyApi.getPolicyStats({
          scope:
            filters.scope === 'all'
              ? undefined
              : (filters.scope as 'BRANCH' | 'ROLE' | 'PACKAGE' | 'GLOBAL' | undefined)
        });
        if (response.success && response.data) {
          setStats(response.data);
        }
        setDeleteDialogOpen(false);
        setPolicyToDelete(null);
      } catch (_error) {
        toast.error(t('commission.enable_error', 'Không thể kích hoạt chính sách hoa hồng'));
      }
    } else {
      // If ACTIVE, disable it (soft delete)
      try {
        await deletePolicy(policyToDelete._id);
        toast.success(t('commission.disable_success', 'Vô hiệu hóa chính sách hoa hồng thành công'));
        // Remove from selection if it was selected
        setSelectedPolicies((prev) => {
          const newSet = new Set(prev);
          newSet.delete(policyToDelete._id);
          return newSet;
        });
        refetch();
        // Refetch stats after delete
        const response = await commissionPolicyApi.getPolicyStats({
          scope:
            filters.scope === 'all'
              ? undefined
              : (filters.scope as 'BRANCH' | 'ROLE' | 'PACKAGE' | 'GLOBAL' | undefined)
        });
        if (response.success && response.data) {
          setStats(response.data);
        }
        setDeleteDialogOpen(false);
        setPolicyToDelete(null);
      } catch (_error) {
        toast.error(t('commission.disable_error', 'Không thể vô hiệu hóa chính sách hoa hồng'));
      }
    }
  };

  const handleEdit = (policy: CommissionPolicy) => {
    setEditingPolicy(policy);
    setIsCreateModalOpen(true);
  };

  // Handle checkbox selection
  const handleSelectPolicy = (policyId: string, checked: boolean) => {
    setSelectedPolicies((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(policyId);
      } else {
        newSet.delete(policyId);
      }
      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPolicies(new Set(filteredPolicies.map((p) => p._id)));
    } else {
      setSelectedPolicies(new Set());
    }
  };

  // Check if all policies are selected
  const isAllSelected = filteredPolicies.length > 0 && selectedPolicies.size === filteredPolicies.length;

  // Handle bulk delete
  const handleBulkDeleteClick = () => {
    if (selectedPolicies.size === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedPolicies.size === 0) return;

    setBulkDeleteLoading(true);
    const policyIds = Array.from(selectedPolicies);
    // Only disable ACTIVE policies
    const activePolicies = filteredPolicies.filter((p) => selectedPolicies.has(p._id) && p.status === 'ACTIVE');
    let successCount = 0;
    let failCount = 0;

    try {
      // Disable policies one by one (only ACTIVE ones)
      for (const policy of activePolicies) {
        try {
          await deletePolicy(policy._id);
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to disable policy ${policy._id}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(
          t('commission.bulk_disable_success', 'Đã vô hiệu hóa thành công {{count}} chính sách hoa hồng', {
            count: successCount
          })
        );
      }
      if (failCount > 0) {
        toast.error(
          t('commission.bulk_disable_partial', 'Không thể vô hiệu hóa {{count}} chính sách', { count: failCount })
        );
      }
      if (policyIds.length > activePolicies.length) {
        toast.info(
          t('commission.bulk_disable_skipped', 'Đã bỏ qua {{count}} chính sách đã vô hiệu hóa', {
            count: policyIds.length - activePolicies.length
          })
        );
      }

      // Clear selection and refetch
      setSelectedPolicies(new Set());
      refetch();

      // Refetch stats after delete
      const response = await commissionPolicyApi.getPolicyStats({
        scope:
          filters.scope === 'all' ? undefined : (filters.scope as 'BRANCH' | 'ROLE' | 'PACKAGE' | 'GLOBAL' | undefined)
      });
      if (response.success && response.data) {
        setStats(response.data);
      }

      setBulkDeleteDialogOpen(false);
    } catch (_error) {
      toast.error(t('commission.bulk_disable_error', 'Không thể vô hiệu hóa các chính sách hoa hồng đã chọn'));
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    setEditingPolicy(null);
    refetch();
    // Refetch stats after create/update
    commissionPolicyApi
      .getPolicyStats({
        scope:
          filters.scope === 'all' ? undefined : (filters.scope as 'BRANCH' | 'ROLE' | 'PACKAGE' | 'GLOBAL' | undefined)
      })
      .then((response) => {
        if (response.success && response.data) {
          setStats(response.data);
        }
      });
  };

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'BRANCH':
        return t('commission.scope.branch', 'Chi nhánh');
      case 'ROLE':
        return t('commission.scope.role', 'Vai trò');
      case 'PACKAGE':
        return t('commission.scope.package', 'Gói dịch vụ');
      case 'GLOBAL':
        return t('commission.scope.global', 'Toàn hệ thống');
      default:
        return scope;
    }
  };

  const getPolicyDetail = (policy: CommissionPolicy) => {
    if (policy.scope === 'PACKAGE') {
      if (policy.servicePackageId) {
        if (typeof policy.servicePackageId === 'object') {
          return policy.servicePackageId.name;
        }
      }
      if (policy.membershipPlanId) {
        if (typeof policy.membershipPlanId === 'object') {
          return policy.membershipPlanId.name;
        }
      }
      return '-';
    }
    if (policy.scope === 'BRANCH' && policy.branchId) {
      return typeof policy.branchId === 'object' ? policy.branchId.branchName : '-';
    }
    if (policy.scope === 'ROLE') {
      return policy.roleType || '-';
    }
    if (policy.scope === 'GLOBAL') {
      return t('commission.scope.global', 'Toàn hệ thống');
    }
    return '-';
  };

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

  // Handle page change
  const handlePageChange = (newPage: number) => {
    goToPage(newPage);
  };

  // Show loading state
  if (loading && !error) {
    return (
      <div className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#f05a29]" />
            <p className="text-gray-600">{t('commission.loading', 'Đang tải...')}</p>
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
              {t('commission.try_again', 'Thử lại')}
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
              <Percent className="h-3.5 w-3.5" />
              {t('commission.badge', 'QUẢN LÝ CHÍNH SÁCH HOA HỒNG')}
            </span>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900">
              {t('commission.management.title', 'Quản lý Chính sách Hoa hồng')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('commission.management.subtitle', 'Cấu hình tỷ lệ hoa hồng theo từng gói dịch vụ')}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-orange-100 bg-[#FFF6EE] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-orange-500">
              {t('commission.stats.total', 'Tổng Chính Sách')}
            </div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-3xl font-bold text-gray-900">{statsLoading ? '...' : stats.total}</div>
              <div className="rounded-full bg-white/70 p-2 text-orange-500">
                <Percent className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {t('commission.stats.total_helper', 'Tổng số chính sách hoa hồng')}
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-green-600">
              {t('commission.stats.active', 'Chính Sách Đang Hoạt Động')}
            </div>
            <div className="mt-2 flex items-end justify-between text-gray-900">
              <span className="text-3xl font-semibold">{statsLoading ? '...' : stats.active}</span>
              <div className="rounded-full bg-white p-2 text-green-600">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {t('commission.stats.active_helper', 'Chính sách đang được áp dụng')}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-red-600">
              {t('commission.stats.inactive', 'Chính Sách Ngừng Hoạt Động')}
            </div>
            <div className="mt-2 flex items-end justify-between text-gray-900">
              <span className="text-3xl font-semibold">{statsLoading ? '...' : stats.inactive}</span>
              <div className="rounded-full bg-white p-2 text-red-600">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {t('commission.stats.inactive_helper', 'Chính sách đã bị vô hiệu hóa')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs + actions + search */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center rounded-full px-6 py-2 text-sm font-medium bg-orange-500 text-white shadow-sm">
              <FileText className="mr-2 h-4 w-4" />
              {t('commission.list', 'Danh sách Chính sách')}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {selectedPolicies.size > 0 && (
              <Button
                variant="destructive"
                className="h-11 rounded-full px-6 text-sm font-semibold shadow-sm"
                onClick={handleBulkDeleteClick}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('commission.disable_selected', 'Vô hiệu hóa đã chọn ({{count}})', { count: selectedPolicies.size })}
              </Button>
            )}
            <Button
              className="h-11 rounded-full px-6 text-sm font-semibold shadow-sm bg-orange-500 text-white hover:bg-orange-600"
              onClick={() => {
                setEditingPolicy(null);
                setIsCreateModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('commission.create', 'Tạo chính sách mới')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full border-gray-300 hover:bg-gray-50"
              title={t('commission.tour.button', 'Hướng dẫn')}
            >
              <HelpCircle className="w-4 h-4 text-gray-500 hover:text-orange-500" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Input
              placeholder={t('commission.search_placeholder', 'Tìm kiếm theo tên gói, chi nhánh...')}
              className="h-11 rounded-full border border-transparent bg-gray-50 pl-12 text-sm shadow-inner focus:border-orange-200 focus:bg-white focus:ring-orange-200"
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="w-full sm:w-auto">
            <Select value={filters.scope} onValueChange={handleScopeFilterChange}>
              <SelectTrigger className="h-11 rounded-full border-gray-200 bg-white">
                <SelectValue placeholder={t('commission.filter.scope', 'Phạm vi')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('commission.filter.all_scopes', 'Tất cả')}</SelectItem>
                <SelectItem value="GLOBAL">{t('commission.scope.global', 'Toàn hệ thống')}</SelectItem>
                <SelectItem value="BRANCH">{t('commission.scope.branch', 'Chi nhánh')}</SelectItem>
                <SelectItem value="ROLE">{t('commission.scope.role', 'Vai trò')}</SelectItem>
                <SelectItem value="PACKAGE">{t('commission.scope.package', 'Gói dịch vụ')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto">
            <Select value={filters.status} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="h-11 rounded-full border-gray-200 bg-white">
                <SelectValue placeholder={t('commission.filter.status', 'Trạng thái')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('commission.filter.all', 'Tất cả')}</SelectItem>
                <SelectItem value="ACTIVE">{t('commission.status.active', 'Đang hoạt động')}</SelectItem>
                <SelectItem value="INACTIVE">{t('commission.status.inactive', 'Ngừng hoạt động')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredPolicies.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-orange-100 shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-[#FFF7EF]">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-orange-600 first:rounded-l-2xl w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-orange-600">
                    {t('dashboard.serial_number', 'STT')}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-orange-600">
                    {t('commission.table.scope', 'Phạm vi')}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-orange-600">
                    {t('commission.table.details', 'Chi tiết')}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-orange-600">
                    {t('commission.table.rate', 'Tỷ lệ (%)')}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-orange-600">
                    {t('commission.table.status', 'Trạng thái')}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-orange-600 last:rounded-r-2xl">
                    {t('common.actions', 'Thao tác')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50 bg-white text-gray-700">
                {filteredPolicies.map((policy, index) => {
                  const startIndex = pagination ? (pagination.currentPage - 1) * pagination.itemsPerPage : 0;
                  const stt = startIndex + index + 1;

                  return (
                    <tr
                      key={policy._id}
                      className={`${
                        index % 2 === 0 ? 'bg-white' : 'bg-[#FFF9F2]'
                      } hover:bg-orange-50 transition-colors`}
                    >
                      <td className="px-4 py-3 w-12">
                        <Checkbox
                          checked={selectedPolicies.has(policy._id)}
                          onCheckedChange={(checked) => handleSelectPolicy(policy._id, checked as boolean)}
                          className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className="font-medium text-gray-700">{stt}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{getScopeLabel(policy.scope)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{getPolicyDetail(policy)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="font-semibold text-orange-600">{policy.commissionRate}%</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex min-w-[88px] justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                            policy.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                          }`}
                        >
                          {policy.status === 'ACTIVE'
                            ? t('commission.status.active', 'Đang hoạt động')
                            : t('commission.status.inactive', 'Ngừng hoạt động')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-orange-200 hover:text-orange-500"
                            onClick={() => handleEdit(policy)}
                            title={t('common.edit', 'Sửa')}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {policy.status === 'ACTIVE' ? (
                            <button
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-orange-100 bg-orange-50 text-orange-500 transition-colors hover:bg-orange-100"
                              onClick={() => handleToggleStatusClick(policy)}
                              title={t('commission.disable', 'Vô hiệu hóa')}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-green-100 bg-green-50 text-green-500 transition-colors hover:bg-green-100"
                              onClick={() => handleToggleStatusClick(policy)}
                              title={t('commission.enable', 'Kích hoạt')}
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Info and Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-gray-500">
                {`${t('dashboard.showing', 'Hiển thị')} ${(pagination.currentPage - 1) * pagination.itemsPerPage + 1} - ${Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} ${t('dashboard.of_total', 'của')} ${pagination.totalItems} ${t('commission.items', 'chính sách')}`}
              </div>
              <Pagination className="justify-end md:justify-center">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      className={pagination.hasPrevPage ? 'cursor-pointer' : 'pointer-events-none opacity-50'}
                    />
                  </PaginationItem>
                  {paginationPages.map((page, idx) => {
                    const showEllipsisBefore = idx > 0 && page - paginationPages[idx - 1] > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsisBefore && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={page === pagination.currentPage}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      </React.Fragment>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      className={pagination.hasNextPage ? 'cursor-pointer' : 'pointer-events-none opacity-50'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg p-8 border-2 border-gray-200 shadow-sm">
          <div className="text-center py-10">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t('commission.no_policies', 'Chưa có chính sách hoa hồng nào')}</p>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreateCommissionPolicyModal
        open={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingPolicy(null);
        }}
        onSuccess={handleCreateSuccess}
        editingPolicy={editingPolicy}
      />

      {/* Disable/Enable Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {policyToDelete?.status === 'INACTIVE'
                ? t('commission.enable_title', 'Kích hoạt chính sách hoa hồng')
                : t('commission.disable_title', 'Vô hiệu hóa chính sách hoa hồng')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {policyToDelete?.status === 'INACTIVE'
                ? t(
                    'commission.enable_description',
                    'Bạn có chắc chắn muốn kích hoạt chính sách hoa hồng này? Chính sách sẽ được áp dụng lại.'
                  )
                : t(
                    'commission.disable_description',
                    'Bạn có chắc chắn muốn vô hiệu hóa chính sách hoa hồng này? Chính sách sẽ không còn được áp dụng.'
                  )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Hủy')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleStatus}
              disabled={deleteLoading || updateLoading}
              className={
                policyToDelete?.status === 'INACTIVE'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {deleteLoading || updateLoading
                ? policyToDelete?.status === 'INACTIVE'
                  ? t('common.enabling', 'Đang kích hoạt...')
                  : t('common.disabling', 'Đang vô hiệu hóa...')
                : policyToDelete?.status === 'INACTIVE'
                  ? t('commission.enable', 'Kích hoạt')
                  : t('commission.disable', 'Vô hiệu hóa')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Disable Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('commission.bulk_disable_title', 'Vô hiệu hóa {{count}} chính sách hoa hồng', {
                count: selectedPolicies.size
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'commission.bulk_disable_description',
                'Bạn có chắc chắn muốn vô hiệu hóa {{count}} chính sách hoa hồng đã chọn? Các chính sách đã vô hiệu hóa sẽ được bỏ qua.',
                { count: selectedPolicies.size }
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Hủy')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              disabled={bulkDeleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkDeleteLoading
                ? t('common.disabling', 'Đang vô hiệu hóa...')
                : t('commission.disable', 'Vô hiệu hóa')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
