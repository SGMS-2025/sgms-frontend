/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  LayoutGrid,
  List,
  Edit2,
  Users,
  Trash2,
  AlertCircle,
  Search,
  BookOpen,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { useTableSort } from '@/hooks/useTableSort';
import { sortArray } from '@/utils/sort';
import { useClassList } from '@/hooks/useClassList';
import { useClass } from '@/hooks/useClass';
import { useBranch } from '@/contexts/BranchContext';
import { ClassInfoCard } from './ClassInfoCard';
import { ClassFormModal } from './ClassFormModal';
import { ClassFormModalErrorBoundary } from './ClassFormModal.ErrorBoundary';
import { EnrollStudentsModal } from './EnrollStudentsModal';
import { ClassQuickViewModal } from './ClassQuickViewModal';
import { toast } from 'sonner';
import type { Class } from '@/types/Class';
import type { ClassListViewProps } from '@/types/class/ClassListView';

// Helper function to convert MongoDB Decimal to number
const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (value?.$numberDecimal) return parseFloat(value.$numberDecimal);
  return 0;
};

export const ClassListView: React.FC<ClassListViewProps> = ({ branchId: propBranchId }) => {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();
  // Use prop branchId if provided, otherwise use currentBranch from context
  const branchId = propBranchId || currentBranch?._id;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [formModal, setFormModal] = useState<{ open: boolean; classId?: string }>({ open: false });
  const [enrollModal, setEnrollModal] = useState<{ open: boolean; classId?: string }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; classId?: string }>({ open: false });
  const [viewModal, setViewModal] = useState<{ open: boolean; classId?: string }>({ open: false });

  // Fetch classes - only fetch if branchId is available
  // useMemo to prevent infinite loop when initialParams object changes
  const classListParams = React.useMemo(
    () => ({
      branchId: branchId || undefined,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      search: search || undefined
    }),
    [branchId, statusFilter, search]
  );

  const { classes, loading, error, pagination, refetch, nextPage, prevPage } = useClassList(classListParams);

  // Sort functionality
  const { sortState, handleSort, getSortIcon } = useTableSort();

  // Filter and sort classes
  const sortedClasses = useMemo(() => {
    if (!sortState.field || !sortState.order) {
      return classes;
    }

    return sortArray(classes, sortState, (item: Class, field: string) => {
      switch (field) {
        case 'name':
          return item.name?.toLowerCase() || '';
        case 'package': {
          const packageName =
            typeof item.servicePackageId === 'object' && item.servicePackageId?.name ? item.servicePackageId.name : '';
          return packageName.toLowerCase();
        }
        case 'schedule':
          // Sort by first day of week
          return item.schedulePattern?.daysOfWeek?.[0]?.toLowerCase() || '';
        case 'capacity':
          return toNumber(item.capacity);
        case 'enrollment':
          return toNumber(item.activeEnrollment);
        case 'status':
          return item.status?.toLowerCase() || '';
        case 'createdAt':
          return new Date(item.createdAt || '').getTime();
        default:
          return '';
      }
    });
  }, [classes, sortState]);

  // Delete operation
  const { deleteClass, loading: deleting } = useClass({
    onSuccess: () => {
      toast.success(t('class.list.delete_success'));
      refetch();
      setDeleteConfirm({ open: false });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('class.list.delete_error'));
    }
  });

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.classId) {
      await deleteClass(deleteConfirm.classId);
    }
  };

  // Debug logging removed for production

  // Show message if no branch selected
  if (!branchId) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{t('class.list.no_branch_selected')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('class.list.title')}</h2>
            <p className="text-sm text-gray-500">
              {classes.length > 0 ? t('class.list.count', { count: classes.length }) : t('class.list.no_classes')}
            </p>
          </div>
          <Button
            onClick={() => setFormModal({ open: true, classId: undefined })}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('class.list.button_new_class')}
          </Button>
        </div>

        {/* Controls: Search, Filter, View Toggle */}
        <div className="flex gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
            <Input
              placeholder={t('class.list.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 text-sm sm:text-base bg-white border-gray-300 shadow-sm"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as 'ACTIVE' | 'INACTIVE' | 'ALL')}>
            <SelectTrigger className="w-[140px] bg-white border-gray-300 shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">{t('class.list.filter_active')}</SelectItem>
              <SelectItem value="INACTIVE">{t('class.list.filter_inactive')}</SelectItem>
              <SelectItem value="ALL">{t('class.list.filter_all')}</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              onClick={() => setViewMode('card')}
              className="h-9 px-3"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              onClick={() => setViewMode('table')}
              className="h-9 px-3"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-600 font-medium">{t('class.list.error_load')}</p>
                <p className="text-sm text-red-500 mt-1">{error}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={refetch} className="mt-3">
              {t('class.list.button_retry')}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && classes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-medium">{t('class.list.empty_title')}</p>
            <p className="text-sm mt-1">{t('class.list.empty_description')}</p>
            <Button onClick={() => setFormModal({ open: true, classId: undefined })} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              {t('class.list.button_create')}
            </Button>
          </div>
        )}

        {/* Card View */}
        {!loading && !error && classes.length > 0 && viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
            {sortedClasses.map((cls) => (
              <ClassInfoCard
                key={cls._id}
                classData={cls}
                onClick={() => setViewModal({ open: true, classId: cls._id })}
                onEdit={() => setFormModal({ open: true, classId: cls._id })}
                onEnroll={() => setEnrollModal({ open: true, classId: cls._id })}
                onDelete={() => setDeleteConfirm({ open: true, classId: cls._id })}
              />
            ))}
          </div>
        )}

        {/* Table View */}
        {!loading && !error && classes.length > 0 && viewMode === 'table' && (
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <SortableHeader
                    field="name"
                    label={t('class.list.column_name')}
                    sortState={sortState}
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                  />
                  <SortableHeader
                    field="package"
                    label={t('class.list.column_package')}
                    sortState={sortState}
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                  />
                  <SortableHeader
                    field="schedule"
                    label={t('class.list.column_schedule')}
                    sortState={sortState}
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                  />
                  <SortableHeader
                    field="capacity"
                    label={t('class.list.column_capacity')}
                    sortState={sortState}
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                    className="justify-center"
                  />
                  <SortableHeader
                    field="status"
                    label={t('class.list.column_status')}
                    sortState={sortState}
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                    className="justify-center"
                  />
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('class.list.column_actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedClasses.map((cls) => (
                  <tr
                    key={cls._id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setViewModal({ open: true, classId: cls._id })}
                  >
                    {/* Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{cls.name}</div>
                    </td>

                    {/* Package */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {typeof cls.servicePackageId === 'object' && cls.servicePackageId.name
                          ? cls.servicePackageId.name
                          : 'Unknown'}
                      </div>
                    </td>

                    {/* Schedule */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{cls.schedulePattern.daysOfWeek.slice(0, 2).join(', ')}</div>
                        <div className="text-gray-500">
                          {cls.schedulePattern.startTime} - {cls.schedulePattern.endTime}
                        </div>
                      </div>
                    </td>

                    {/* Capacity */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {toNumber(cls.activeEnrollment)}/{toNumber(cls.capacity)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-center">
                        <Badge variant={cls.status === 'ACTIVE' ? 'default' : 'secondary'}>{cls.status}</Badge>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setFormModal({ open: true, classId: cls._id })}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            <span>{t('class.list.action_edit')}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEnrollModal({ open: true, classId: cls._id })}>
                            <Users className="w-4 h-4 mr-2" />
                            <span>{t('class.list.action_enroll')}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirm({ open: true, classId: cls._id })}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            <span>{t('class.list.action_delete')}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && classes.length > 0 && pagination && (
        <div className="border-t pt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {t('class.list.pagination_page')} <span className="font-medium">{pagination.currentPage}</span>{' '}
            {t('class.list.pagination_of')} <span className="font-medium">{pagination.totalPages}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={prevPage} disabled={!pagination.hasPrevPage || loading}>
              {t('class.list.button_prev')}
            </Button>
            <Button variant="outline" size="sm" onClick={nextPage} disabled={!pagination.hasNextPage || loading}>
              {t('class.list.button_next')}
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}

      {/* Form Modal */}
      <ClassFormModalErrorBoundary>
        <ClassFormModal
          isOpen={formModal.open}
          onClose={() => setFormModal({ open: false })}
          classId={formModal.classId}
          branchId={branchId || ''}
          onSuccess={refetch}
        />
      </ClassFormModalErrorBoundary>

      {/* Enroll Modal */}
      <EnrollStudentsModal
        isOpen={enrollModal.open}
        onClose={() => setEnrollModal({ open: false })}
        classId={enrollModal.classId || ''}
        onSuccess={refetch}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => !open && setDeleteConfirm({ open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('class.list.delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('class.list.delete_description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end pt-4">
            <AlertDialogCancel>{t('class.list.button_cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? t('class.list.button_deleting') : t('class.list.button_delete')}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Class Detail Modal */}
      {viewModal.classId && (
        <ClassQuickViewModal
          classId={viewModal.classId}
          isOpen={viewModal.open}
          onClose={() => setViewModal({ open: false })}
          onRefresh={refetch}
          onEditClick={(classId) => {
            setViewModal({ open: false });
            setFormModal({ open: true, classId });
          }}
          onEnrollClick={(classId) => {
            setViewModal({ open: false });
            setEnrollModal({ open: true, classId });
          }}
        />
      )}
    </div>
  );
};
