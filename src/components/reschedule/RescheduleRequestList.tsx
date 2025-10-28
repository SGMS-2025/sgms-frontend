import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import {
  Search,
  Plus,
  Calendar,
  Clock,
  Loader2,
  RefreshCw,
  ArrowRightLeft,
  UserPlus,
  User,
  Grid3X3,
  List,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  MapPin,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn, formatDate } from '@/utils/utils';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { useTableSort } from '@/hooks/useTableSort';
import { sortArray } from '@/utils/sort';
import RescheduleRequestCard from './RescheduleRequestCard';
import type {
  RescheduleRequestListProps,
  RescheduleState,
  RescheduleType,
  ReschedulePriority,
  RescheduleRequest
} from '@/types/api/Reschedule';
import type { WorkShift } from '@/types/api/WorkShift';

const getStatusOptions = (t: (key: string) => string): { value: RescheduleState | 'ALL'; label: string }[] => [
  { value: 'ALL', label: t('common.all_status') },
  { value: 'PENDING_BROADCAST', label: t('common.pending_broadcast') },
  { value: 'PENDING_ACCEPTANCE', label: t('common.pending_acceptance') },
  { value: 'PENDING_APPROVAL', label: t('common.pending_approval') },
  { value: 'APPROVED', label: t('common.approved') },
  { value: 'REJECTED', label: t('common.rejected') },
  { value: 'CANCELLED', label: t('common.cancelled') },
  { value: 'EXPIRED', label: t('common.expired') },
  { value: 'COMPLETED', label: t('common.completed') }
];

const getTypeOptions = (t: (key: string) => string): { value: RescheduleType | 'ALL'; label: string }[] => [
  { value: 'ALL', label: t('common.all_types') },
  { value: 'FIND_REPLACEMENT', label: t('common.find_replacement') },
  { value: 'DIRECT_SWAP', label: t('common.direct_swap') },
  { value: 'MANAGER_ASSIGN', label: t('common.manager_assign') }
];

const getPriorityOptions = (t: (key: string) => string): { value: ReschedulePriority | 'ALL'; label: string }[] => [
  { value: 'ALL', label: t('common.all_priorities') },
  { value: 'LOW', label: t('common.low') },
  { value: 'MEDIUM', label: t('common.medium') },
  { value: 'HIGH', label: t('common.high') },
  { value: 'URGENT', label: t('common.urgent') }
];

const getStatusText = (status: RescheduleState, t: (key: string) => string) => {
  switch (status) {
    case 'PENDING_BROADCAST':
      return t('common.pending_broadcast');
    case 'PENDING_ACCEPTANCE':
      return t('common.pending_acceptance');
    case 'PENDING_APPROVAL':
      return t('common.pending_approval');
    case 'APPROVED':
      return t('common.approved');
    case 'REJECTED':
      return t('common.rejected');
    case 'CANCELLED':
      return t('common.cancelled');
    case 'EXPIRED':
      return t('common.expired');
    case 'COMPLETED':
      return t('common.completed');
    default:
      return status;
  }
};

const getTypeText = (type: RescheduleType, t: (key: string) => string) => {
  switch (type) {
    case 'FIND_REPLACEMENT':
      return t('common.find_replacement');
    case 'DIRECT_SWAP':
      return t('common.direct_swap');
    case 'MANAGER_ASSIGN':
      return t('common.manager_assign');
    default:
      return type;
  }
};

const getPriorityText = (priority: ReschedulePriority, t: (key: string) => string) => {
  switch (priority) {
    case 'LOW':
      return t('common.low');
    case 'MEDIUM':
      return t('common.medium');
    case 'HIGH':
      return t('common.high');
    case 'URGENT':
      return t('common.urgent');
    default:
      return priority;
  }
};

// ✅ THÊM: Function kiểm tra xung đột lịch
const hasScheduleConflict = (request: RescheduleRequest, currentUserShifts: WorkShift[] = []) => {
  if (!request.originalShiftId || !currentUserShifts.length) {
    return false;
  }

  const originalShift = request.originalShiftId;

  // Kiểm tra nếu originalShift là string (chỉ có ID) thì không thể kiểm tra xung đột
  if (typeof originalShift === 'string') {
    return false;
  }

  return currentUserShifts.some((shift) => {
    // Kiểm tra xung đột thời gian
    const shiftStart = new Date(shift.startTime);
    const shiftEnd = new Date(shift.endTime);
    const originalStart = new Date((originalShift as WorkShift).startTime);
    const originalEnd = new Date((originalShift as WorkShift).endTime);

    // Kiểm tra xung đột: shift hiện tại chồng lấn với ca cần nhận
    return shiftStart < originalEnd && shiftEnd > originalStart && shift.status === 'SCHEDULED';
  });
};

const RescheduleRequestList: React.FC<RescheduleRequestListProps> = ({
  requests,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onAccept,
  onApprove,
  onReject,
  onCancel,
  onCreateNew,
  onRefresh,
  searchValue = '',
  onSearchChange,
  statusFilter = 'ALL',
  onStatusFilterChange,
  typeFilter = 'ALL',
  onTypeFilterChange,
  priorityFilter = 'ALL',
  onPriorityFilterChange,
  showFilters = true,
  // ✅ THÊM: Current user shifts để kiểm tra xung đột lịch
  currentUserShifts = [],
  showStats = true,
  showHeader = true,
  stats,
  userRole,
  currentUserId
}) => {
  const { t } = useTranslation();

  // State for view mode and pagination
  const [viewMode, setViewMode] = React.useState<'card' | 'table'>('card');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  // Sort functionality
  const { sortState, handleSort, getSortIcon } = useTableSort();

  const getStatusColor = (status: RescheduleState) => {
    switch (status) {
      case 'PENDING_BROADCAST':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING_ACCEPTANCE':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING_APPROVAL':
        return 'bg-orange-100 text-orange-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and sort requests
  const filteredRequests = React.useMemo(() => {
    // Apply sorting only (filtering is done in parent component)
    let filtered = [...requests];

    if (sortState.field && sortState.order) {
      filtered = sortArray(filtered, sortState, (item, field) => {
        switch (field) {
          case 'reason':
            return item.reason?.toLowerCase() || '';
          case 'status':
            return item.status.toLowerCase();
          case 'swapType':
            return item.swapType.toLowerCase();
          case 'priority':
            return item.priority.toLowerCase();
          case 'createdAt':
            return new Date(item.createdAt).getTime();
          case 'requesterStaffId':
            return typeof item.requesterStaffId === 'object'
              ? item.requesterStaffId?.userId?.fullName?.toLowerCase() || ''
              : '';
          default:
            return '';
        }
      });
    }

    return filtered;
  }, [requests, sortState]);

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  // Reset to first page when requests change (due to filtering in parent)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [requests.length]);

  if (loading) {
    return (
      <div className="space-y-6">
        {showHeader && (
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{t('reschedule.requests')}</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('common.refresh')}
              </Button>
              {onCreateNew && (
                <Button size="sm" disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('reschedule.create_request')}
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
            <p className="text-gray-600">{t('reschedule.loading_requests')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="basic-management">
        {/* Header */}
        {showHeader && (
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-500">
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  {t('reschedule.badge') || 'RESCHEDULE MANAGEMENT'}
                </span>
                <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-gray-900">
                  {t('reschedule.requests') || 'Reschedule Requests'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {t('reschedule.subtitle') || 'Manage and track reschedule requests'}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {onRefresh && (
                  <Button variant="outline" size="sm" onClick={onRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('common.refresh')}
                  </Button>
                )}
                {onCreateNew && (
                  <Button className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto" onClick={onCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('reschedule.create_request')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {showStats && stats && (
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ArrowRightLeft className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('common.total')}</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('common.pending')}</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingApproval}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('common.approved')}</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('common.rejected')}</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.rejected || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="mb-6">
            <Card className="shadow-sm border-0 bg-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
                  {/* Search Bar */}
                  <div className="flex-1 min-w-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder={t('reschedule.search_placeholder') || 'Search by staff name or reason...'}
                        value={searchValue}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        className="pl-10 h-11 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Filter Dropdowns */}
                  <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                    <div className="w-full sm:w-32 lg:w-36">
                      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                        <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                          <SelectValue placeholder={t('reschedule.filter_by_status') || 'All Status'} />
                        </SelectTrigger>
                        <SelectContent>
                          {getStatusOptions(t).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full sm:w-32 lg:w-36">
                      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                        <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                          <SelectValue placeholder={t('reschedule.filter_by_type') || 'All Types'} />
                        </SelectTrigger>
                        <SelectContent>
                          {getTypeOptions(t).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full sm:w-32 lg:w-36">
                      <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
                        <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                          <SelectValue placeholder={t('reschedule.filter_by_priority') || 'All Priorities'} />
                        </SelectTrigger>
                        <SelectContent>
                          {getPriorityOptions(t).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* View Toggle Buttons */}
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    <Button
                      variant={viewMode === 'card' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('card')}
                      className={`h-9 px-3 rounded-md transition-all ${
                        viewMode === 'card'
                          ? 'bg-white shadow-sm text-gray-900'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('table')}
                      className={`h-9 px-3 rounded-md transition-all ${
                        viewMode === 'table'
                          ? 'bg-white shadow-sm text-gray-900'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reschedule Requests */}
        {viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedRequests.map((request) => (
              <RescheduleRequestCard
                key={request._id}
                request={request}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
                onAccept={onAccept}
                onApprove={onApprove}
                onReject={onReject}
                onCancel={onCancel}
                showActions={true}
                userRole={userRole}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <SortableHeader
                    field="reason"
                    label={t('reschedule.reason') || 'Reason'}
                    sortState={sortState}
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                  />
                  <SortableHeader
                    field="status"
                    label={t('reschedule.status') || 'Status'}
                    sortState={sortState}
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                  />
                  <SortableHeader
                    field="swapType"
                    label={t('reschedule.type') || 'Type'}
                    sortState={sortState}
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                  />
                  <SortableHeader
                    field="priority"
                    label={t('reschedule.priority') || 'Priority'}
                    sortState={sortState}
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                  />
                  <SortableHeader
                    field="requesterStaffId"
                    label={t('reschedule.requested_by') || 'Requested By'}
                    sortState={sortState}
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                  />
                  <SortableHeader
                    field="createdAt"
                    label={t('reschedule.created_at') || 'Created At'}
                    sortState={sortState}
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                  />
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions') || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedRequests.map((request) => {
                  // Chỉ cho phép xem nếu status đã hoàn thành hoặc bị từ chối
                  const isFinalStatus = request.status === 'COMPLETED' || request.status === 'REJECTED';

                  return (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {request.reason || 'No reason provided'}
                          </div>
                          {request.originalShiftId &&
                            typeof request.originalShiftId === 'object' &&
                            request.originalShiftId.branchId &&
                            typeof request.originalShiftId.branchId === 'object' &&
                            request.originalShiftId.branchId?.branchName && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {request.originalShiftId.branchId.branchName}
                              </div>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={cn('text-xs', getStatusColor(request.status))}>
                          {getStatusText(request.status, t)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {request.swapType === 'FIND_REPLACEMENT' && (
                            <UserPlus className="h-4 w-4 mr-2 text-blue-500" />
                          )}
                          {request.swapType === 'DIRECT_SWAP' && (
                            <ArrowRightLeft className="h-4 w-4 mr-2 text-green-500" />
                          )}
                          {request.swapType === 'MANAGER_ASSIGN' && <User className="h-4 w-4 mr-2 text-purple-500" />}
                          <span className="text-sm text-gray-900">{getTypeText(request.swapType, t)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            request.priority === 'URGENT' && 'border-red-500 text-red-700',
                            request.priority === 'HIGH' && 'border-orange-500 text-orange-700',
                            request.priority === 'MEDIUM' && 'border-yellow-500 text-yellow-700',
                            request.priority === 'LOW' && 'border-green-500 text-green-700'
                          )}
                        >
                          {getPriorityText(request.priority, t)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {typeof request.requesterStaffId === 'object'
                          ? request.requesterStaffId?.userId?.fullName || 'Unknown'
                          : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onView && (
                              <DropdownMenuItem onClick={() => onView(request._id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t('common.view')}
                              </DropdownMenuItem>
                            )}
                            {!isFinalStatus && onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(request._id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('common.edit')}
                              </DropdownMenuItem>
                            )}
                            {!isFinalStatus && onAccept && !hasScheduleConflict(request, currentUserShifts) && (
                              <DropdownMenuItem onClick={() => onAccept(request._id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {t('common.accept')}
                              </DropdownMenuItem>
                            )}
                            {!isFinalStatus && onAccept && hasScheduleConflict(request, currentUserShifts) && (
                              <DropdownMenuItem disabled className="text-gray-400 cursor-not-allowed">
                                <XCircle className="mr-2 h-4 w-4" />
                                {t('reschedule.schedule_conflict')}
                              </DropdownMenuItem>
                            )}
                            {!isFinalStatus && onApprove && (
                              <DropdownMenuItem onClick={() => onApprove(request._id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {t('common.approve')}
                              </DropdownMenuItem>
                            )}
                            {!isFinalStatus && onReject && (
                              <DropdownMenuItem
                                onClick={() => onReject(request._id, 'Rejected from table view')}
                                className="text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                {t('common.reject')}
                              </DropdownMenuItem>
                            )}
                            {!isFinalStatus && onCancel && (
                              <DropdownMenuItem onClick={() => onCancel(request._id)} className="text-red-600">
                                <XCircle className="mr-2 h-4 w-4" />
                                {t('common.cancel')}
                              </DropdownMenuItem>
                            )}
                            {!isFinalStatus && onDelete && (
                              <DropdownMenuItem onClick={() => onDelete(request._id)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('common.delete')}
                              </DropdownMenuItem>
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
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {filteredRequests.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Calendar className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('reschedule.no_requests') || 'No requests found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchValue || statusFilter !== 'ALL' || typeFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? t('reschedule.no_requests_filtered') || 'No requests match your current filters'
                  : t('reschedule.no_requests_description') || 'Get started by creating your first reschedule request'}
              </p>
              {onCreateNew && (
                <Button className="bg-orange-500 hover:bg-orange-600" onClick={onCreateNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('reschedule.create_first_request') || 'Create Request'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RescheduleRequestList;
