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
  Grid3X3,
  List,
  Download,
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  MapPin
} from 'lucide-react';
import { cn, formatDate } from '@/utils/utils';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { useTableSort } from '@/hooks/useTableSort';
import { sortArray } from '@/utils/sort';
import TimeOffCard from './TimeOffCard';
import type { TimeOffListProps, TimeOffStatus, TimeOffType, TimeOff } from '@/types/api/TimeOff';

// Helper function to check if user can cancel timeoff (matches usePermissionChecks logic)
const canCancelTimeOff = (timeOff: TimeOff, userRole?: string, currentUserId?: string): boolean => {
  // Check if status is PENDING
  if (timeOff.status !== 'PENDING') {
    return false;
  }

  // Check if user is STAFF
  const isStaff = userRole === 'STAFF' || userRole === 'staff';
  if (!isStaff) {
    return false;
  }

  // Check if user is the requester
  const requesterId = typeof timeOff.staffId === 'string' ? timeOff.staffId : timeOff.staffId?.userId?._id;

  return requesterId === currentUserId;
};

const getStatusOptions = (t: (key: string) => string): { value: TimeOffStatus | 'ALL'; label: string }[] => [
  { value: 'ALL', label: t('common.all_status') },
  { value: 'PENDING', label: t('common.pending') },
  { value: 'APPROVED', label: t('common.approved') },
  { value: 'REJECTED', label: t('common.rejected') },
  { value: 'CANCELLED', label: t('common.cancelled') }
];

const getTypeOptions = (t: (key: string) => string): { value: TimeOffType | 'ALL'; label: string }[] => [
  { value: 'ALL', label: t('common.all_types') },
  { value: 'VACATION', label: t('timeoff.type.vacation') },
  { value: 'SICK_LEAVE', label: t('timeoff.type.sick_leave') },
  { value: 'PERSONAL_LEAVE', label: t('timeoff.type.personal_leave') },
  { value: 'UNPAID_LEAVE', label: t('timeoff.type.unpaid_leave') },
  { value: 'EMERGENCY', label: t('timeoff.type.emergency') },
  { value: 'OTHER', label: t('timeoff.type.other') }
];

const getTypeText = (type: TimeOffType, t: (key: string) => string) => {
  switch (type) {
    case 'VACATION':
      return t('timeoff.type.vacation');
    case 'SICK_LEAVE':
      return t('timeoff.type.sick_leave');
    case 'PERSONAL_LEAVE':
      return t('timeoff.type.personal_leave');
    case 'UNPAID_LEAVE':
      return t('timeoff.type.unpaid_leave');
    case 'EMERGENCY':
      return t('timeoff.type.emergency');
    case 'OTHER':
      return t('timeoff.type.other');
    default:
      return type;
  }
};

const TimeOffList: React.FC<
  TimeOffListProps & {
    onCreateNew?: () => void;
    onRefresh?: () => void;
    onExport?: () => void;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    statusFilter?: string;
    onStatusFilterChange?: (value: string) => void;
    typeFilter?: string;
    onTypeFilterChange?: (value: string) => void;
    showFilters?: boolean;
    showStats?: boolean;
    showHeader?: boolean;
    stats?: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      cancelled: number;
    };
  }
> = ({
  timeOffs,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onApprove,
  onReject,
  onCancel,
  userRole,
  currentUserId,
  onCreateNew,
  onRefresh,
  onExport,
  searchValue = '',
  onSearchChange,
  statusFilter = 'ALL',
  onStatusFilterChange,
  typeFilter = 'ALL',
  onTypeFilterChange,
  showFilters = true,
  showStats = true,
  showHeader = true,
  stats
}) => {
  const { t } = useTranslation();

  // State for view mode and pagination
  const [viewMode, setViewMode] = React.useState<'card' | 'table'>('card');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  // Sort functionality
  const { sortState, handleSort, getSortIcon } = useTableSort();

  const getStatusColor = (status: TimeOffStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: TimeOffType) => {
    switch (type) {
      case 'VACATION':
        return 'bg-green-100 text-green-800';
      case 'SICK_LEAVE':
        return 'bg-red-100 text-red-800';
      case 'PERSONAL_LEAVE':
        return 'bg-purple-100 text-purple-800';
      case 'UNPAID_LEAVE':
        return 'bg-gray-100 text-gray-800';
      case 'EMERGENCY':
        return 'bg-orange-100 text-orange-800';
      case 'OTHER':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and sort requests
  const filteredTimeOffs = React.useMemo(() => {
    let filtered = timeOffs.filter((timeOff) => {
      const matchesStatus = statusFilter === 'ALL' || timeOff.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || timeOff.type === typeFilter;

      const matchesSearch =
        !searchValue ||
        timeOff.reason?.toLowerCase().includes(searchValue.toLowerCase()) ||
        (typeof timeOff.staffId === 'object' &&
          timeOff.staffId?.userId?.fullName?.toLowerCase().includes(searchValue.toLowerCase()));

      return matchesStatus && matchesType && matchesSearch;
    });

    // Apply sorting
    if (sortState.field && sortState.order) {
      filtered = sortArray(filtered, sortState, (item, field) => {
        switch (field) {
          case 'reason':
            return item.reason?.toLowerCase() || '';
          case 'status':
            return item.status.toLowerCase();
          case 'type':
            return item.type.toLowerCase();
          case 'startDate':
            return new Date(item.startDate).getTime();
          case 'duration':
            return item.duration || 0;
          case 'staffId':
            return typeof item.staffId === 'object' ? item.staffId?.userId?.fullName?.toLowerCase() || '' : '';
          case 'createdAt':
            return new Date(item.createdAt).getTime();
          default:
            return '';
        }
      });
    }

    return filtered;
  }, [timeOffs, statusFilter, typeFilter, searchValue, sortState]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTimeOffs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTimeOffs = filteredTimeOffs.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, statusFilter, typeFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        {showHeader && (
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{t('timeoff.requests')}</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('common.refresh')}
              </Button>
              {onCreateNew && (
                <Button size="sm" disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('timeoff.create_request')}
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
            <p className="text-gray-600">{t('timeoff.loading_requests')}</p>
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
                  <Calendar className="h-3.5 w-3.5" />
                  {t('timeoff.badge') || 'TIME OFF MANAGEMENT'}
                </span>
                <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-gray-900">
                  {t('timeoff.requests') || 'Time Off Requests'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {t('timeoff.subtitle') || 'Manage and track time off requests'}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {onExport && (
                  <Button variant="outline" size="sm" onClick={onExport}>
                    <Download className="h-4 w-4 mr-2" />
                    {t('common.export') || 'Export'}
                  </Button>
                )}
                {onRefresh && (
                  <Button variant="outline" size="sm" onClick={onRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('common.refresh')}
                  </Button>
                )}
                {onCreateNew && (
                  <Button className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto" onClick={onCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('timeoff.request_time_off') || 'Create Time Off Request'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {showStats && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('timeoff.total_requests') || 'Total'}</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                    <p className="text-sm font-medium text-gray-600">{t('timeoff.pending') || 'Pending'}</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
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
                    <p className="text-sm font-medium text-gray-600">{t('timeoff.approved') || 'Approved'}</p>
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
                    <p className="text-sm font-medium text-gray-600">{t('timeoff.rejected') || 'Rejected'}</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
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
                        placeholder={t('timeoff.search_placeholder') || 'Search requests...'}
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
                          <SelectValue placeholder={t('timeoff.filter_by_status') || 'Status'} />
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
                          <SelectValue placeholder={t('timeoff.filter_by_type') || 'Type'} />
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

        {/* Time Off Requests */}
        {viewMode === 'card' ? (
          paginatedTimeOffs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Calendar className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('timeoff.no_requests') || 'No requests found'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchValue || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                    ? t('timeoff.no_requests_filtered') || 'No requests match your current filters'
                    : t('timeoff.no_requests_description') || 'Get started by creating your first time off request'}
                </p>
                {onCreateNew && (
                  <Button className="bg-orange-500 hover:bg-orange-600" onClick={onCreateNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('timeoff.create_first_request') || 'Create Request'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedTimeOffs.map((timeOff) => (
                <TimeOffCard
                  key={timeOff._id}
                  timeOff={timeOff}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onView={onView}
                  onApprove={onApprove}
                  onReject={onReject}
                  onCancel={onCancel}
                  showActions={true}
                  userRole={userRole}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
            {paginatedTimeOffs.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Calendar className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('timeoff.no_requests') || 'No requests found'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchValue || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                    ? t('timeoff.no_requests_filtered') || 'No requests match your current filters'
                    : t('timeoff.no_requests_description') || 'Get started by creating your first time off request'}
                </p>
                {onCreateNew && (
                  <Button className="bg-orange-500 hover:bg-orange-600" onClick={onCreateNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('timeoff.create_first_request') || 'Create Request'}
                  </Button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <SortableHeader
                      field="staffId"
                      label={t('timeoff.staff_name') || 'Staff Name'}
                      sortState={sortState}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                    <SortableHeader
                      field="type"
                      label={t('timeoff.type') || 'Type'}
                      sortState={sortState}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                    <SortableHeader
                      field="startDate"
                      label={t('timeoff.date_range') || 'Date Range'}
                      sortState={sortState}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                    <SortableHeader
                      field="duration"
                      label={t('timeoff.duration') || 'Duration'}
                      sortState={sortState}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                    <SortableHeader
                      field="reason"
                      label={t('timeoff.reason') || 'Reason'}
                      sortState={sortState}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                    <SortableHeader
                      field="status"
                      label={t('timeoff.status') || 'Status'}
                      sortState={sortState}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                    <SortableHeader
                      field="createdAt"
                      label={t('timeoff.created_at') || 'Created At'}
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
                  {paginatedTimeOffs.map((timeOff) => (
                    <tr key={timeOff._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {typeof timeOff.staffId === 'object'
                              ? timeOff.staffId?.userId?.fullName || 'Unknown'
                              : 'Unknown'}
                          </div>
                          {typeof timeOff.branchId === 'object' && timeOff.branchId?.branchName && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {timeOff.branchId.branchName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={cn('text-xs', getTypeColor(timeOff.type))}>
                          {getTypeText(timeOff.type, t)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {formatDate(timeOff.startDate)} - {formatDate(timeOff.endDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {timeOff.duration} {timeOff.duration === 1 ? t('timeoff.day') : t('timeoff.days')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 truncate max-w-xs">
                          {timeOff.reason || 'No reason provided'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={cn('text-xs', getStatusColor(timeOff.status))}>{timeOff.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(timeOff.createdAt)}
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
                              <DropdownMenuItem onClick={() => onView(timeOff._id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t('common.view')}
                              </DropdownMenuItem>
                            )}
                            {onEdit && timeOff.status === 'PENDING' && (
                              <DropdownMenuItem onClick={() => onEdit(timeOff._id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('common.edit')}
                              </DropdownMenuItem>
                            )}
                            {onApprove && timeOff.status === 'PENDING' && (
                              <DropdownMenuItem onClick={() => onApprove(timeOff._id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {t('common.approve')}
                              </DropdownMenuItem>
                            )}
                            {onReject && timeOff.status === 'PENDING' && (
                              <DropdownMenuItem onClick={() => onReject(timeOff._id)} className="text-red-600">
                                <XCircle className="mr-2 h-4 w-4" />
                                {t('common.reject')}
                              </DropdownMenuItem>
                            )}
                            {onCancel && canCancelTimeOff(timeOff, userRole, currentUserId) && (
                              <DropdownMenuItem onClick={() => onCancel(timeOff._id)} className="text-orange-600">
                                <XCircle className="mr-2 h-4 w-4" />
                                {t('common.cancel')}
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem onClick={() => onDelete(timeOff._id)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('common.delete')}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
      </div>
    </div>
  );
};

export default TimeOffList;
