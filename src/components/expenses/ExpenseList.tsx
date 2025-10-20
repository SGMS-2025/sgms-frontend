import { useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, DollarSign, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExpenses } from '@/hooks/useExpenses';
import { useBranch } from '@/contexts/BranchContext';
import type { Expense, ExpenseCategory, ExpenseFilters } from '@/types/api/Expenses';
import { EXPENSE_CATEGORY_DISPLAY } from '@/types/api/Expenses';

interface ExpenseListProps {
  onExpenseSelect?: (expense: Expense) => void;
  onExpenseEdit?: (expense: Expense) => void;
  onExpenseDelete?: (expense: Expense) => void;
  onCreateExpense?: () => void;
}

export interface ExpenseListRef {
  refetch: () => Promise<void>;
}

export const ExpenseList = forwardRef<ExpenseListRef, ExpenseListProps>(
  ({ onExpenseSelect, onExpenseEdit, onExpenseDelete, onCreateExpense }, ref) => {
    const { t } = useTranslation();
    const { currentBranch } = useBranch();

    const [filters, setFilters] = useState<ExpenseFilters>({
      search: '',
      category: 'all',
      startDate: '',
      endDate: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const prevBranchIdRef = useRef<string | null>(null);

    const { expenses, loading, error, pagination, updateFilters, refetch } = useExpenses({
      page: currentPage,
      limit: pageSize,
      search: filters.search || undefined,
      category: filters.category && filters.category !== 'all' ? (filters.category as ExpenseCategory) : undefined,
      status: 'ACTIVE', // Only show active expenses
      branchId: currentBranch?._id, // Use current branch from context
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    // Refetch when currentBranch changes (avoid infinite loop)
    useEffect(() => {
      const currentBranchId = currentBranch?._id;

      // Only refetch if branchId actually changed
      if (currentBranchId && currentBranchId !== prevBranchIdRef.current) {
        prevBranchIdRef.current = currentBranchId;

        // Use current filters state directly
        updateFilters({
          page: 1,
          limit: pageSize,
          search: filters.search || undefined,
          category: filters.category && filters.category !== 'all' ? (filters.category as ExpenseCategory) : undefined,
          status: 'ACTIVE', // Only show active expenses
          branchId: currentBranchId,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });
      }
    }, [
      currentBranch?._id,
      updateFilters,
      pageSize,
      filters.search,
      filters.category,
      filters.startDate,
      filters.endDate
    ]); // Include all dependencies but use ref to prevent infinite loop

    const handleFilterChange = (key: keyof ExpenseFilters, value: string) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      setCurrentPage(1);

      updateFilters({
        page: 1,
        limit: pageSize,
        search: newFilters.search || undefined,
        category:
          newFilters.category && newFilters.category !== 'all' ? (newFilters.category as ExpenseCategory) : undefined,
        status: 'ACTIVE', // Only show active expenses
        branchId: currentBranch?._id, // Use current branch from context
        startDate: newFilters.startDate || undefined,
        endDate: newFilters.endDate || undefined
      });
    };

    const handlePageChange = (page: number) => {
      setCurrentPage(page);
      updateFilters({ page, limit: pageSize });
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    const getBranchName = (branchId: string | { branchName: string; _id: string }) => {
      // Handle both string and object branchId
      if (typeof branchId === 'string') {
        return currentBranch?.branchName || branchId;
      } else if (branchId && typeof branchId === 'object') {
        return branchId.branchName || branchId._id || 'Unknown Branch';
      }
      return currentBranch?.branchName || 'Unknown Branch';
    };

    // Expose refetch function to parent component
    useImperativeHandle(
      ref,
      () => ({
        refetch
      }),
      [refetch]
    );

    const categoryOptions = Object.entries(EXPENSE_CATEGORY_DISPLAY).map(([key, _]) => [
      key as ExpenseCategory,
      t(`expenses.categories.${key.toLowerCase()}`, EXPENSE_CATEGORY_DISPLAY[key as ExpenseCategory])
    ]) as [ExpenseCategory, string][];

    if (error) {
      return (
        <Card className="p-6">
          <div className="text-center text-red-500">
            <p>{t('expenses.error.loading', 'Có lỗi xảy ra khi tải danh sách chi phí')}</p>
          </div>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('expenses.search_placeholder', 'Tìm kiếm chi phí...')}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category */}
            <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('expenses.filter_category', 'Danh mục')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all', 'Tất cả')}</SelectItem>
                {categoryOptions.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Expense List */}
        <Card>
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : !expenses || expenses.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('expenses.empty.title', 'Chưa có chi phí nào')}
              </h3>
              <p className="text-gray-500 mb-4">
                {t('expenses.empty.description', 'Bắt đầu tạo chi phí đầu tiên của bạn')}
              </p>
              <Button onClick={onCreateExpense} className="bg-orange-500 hover:bg-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                {t('expenses.create', 'Tạo chi phí')}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {expenses?.map((expense) => (
                <div key={expense._id} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <Tag className="h-4 w-4 text-orange-600" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {t(
                              `expenses.categories.${expense.category.toLowerCase()}`,
                              EXPENSE_CATEGORY_DISPLAY[expense.category]
                            )}
                          </h3>
                        </div>

                        <p className="text-gray-600 text-xs mb-1 line-clamp-1">{expense.description}</p>

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">{getBranchName(expense.branchId as string)}</div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(expense.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(expense.amount)}</p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onExpenseSelect?.(expense)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t('common.view', 'Xem')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onExpenseEdit?.(expense)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t('common.edit', 'Chỉnh sửa')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onExpenseDelete?.(expense)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('common.delete', 'Xóa')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {t('common.pagination.showing', 'Hiển thị')} {(pagination.page - 1) * pagination.limit + 1} -{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} {t('common.pagination.of', 'của')}{' '}
                  {pagination.total}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    {t('common.previous', 'Trước')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    {t('common.next', 'Tiếp')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }
);
