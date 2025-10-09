import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  MapPin,
  ChevronDown,
  Eye,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { equipmentIssueApi } from '@/services/api/equipmentIssueApi';
import { useBranch } from '@/contexts/BranchContext';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { EquipmentIssue } from '@/types/api/EquipmentIssue';

export const EquipmentIssueHistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();
  const [equipmentIssues, setEquipmentIssues] = useState<EquipmentIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<EquipmentIssue | null>(null);
  const [resolvingIssue, setResolvingIssue] = useState<string | null>(null);

  // Fetch equipment issues for technician to manage
  const fetchEquipmentIssues = async () => {
    setLoading(true);
    setError(null);

    const response = await equipmentIssueApi.getEquipmentIssues({
      page: 1,
      limit: 50,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      branchId: currentBranch?._id // Filter by selected branch
    });

    if (response.success && response.data) {
      setEquipmentIssues(response.data);
    } else {
      setError(t('equipmentIssue.listError', 'Không thể tải danh sách báo cáo'));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchEquipmentIssues();
  }, [currentBranch?._id]); // Refetch when branch changes

  const getStatusBadge = (status: string) => {
    const getStatusInfo = (status: string) => {
      switch (status) {
        case 'pending':
          return {
            badge: (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                <Clock className="w-3 h-3 mr-1" />
                {t('equipmentIssue.pendingStatus', 'Chờ xử lý')}
              </Badge>
            ),
            tooltip: t('equipmentIssue.pendingTooltip', 'Báo cáo đang chờ xử lý')
          };
        case 'resolved':
          return {
            badge: (
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                {t('equipmentIssue.resolvedStatus', 'Đã xử lý')}
              </Badge>
            ),
            tooltip: t('equipmentIssue.resolvedTooltip', 'Báo cáo đã được giải quyết')
          };
        case 'delete':
          return {
            badge: (
              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                <XCircle className="w-3 h-3 mr-1" />
                {t('equipmentIssue.deletedStatus', 'Đã xóa')}
              </Badge>
            ),
            tooltip: t('equipmentIssue.deletedTooltip', 'Báo cáo đã bị xóa')
          };
        default:
          return {
            badge: <Badge variant="outline">{status}</Badge>,
            tooltip: `Trạng thái: ${status}`
          };
      }
    };

    const { badge, tooltip } = getStatusInfo(status);

    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  // Calculate stats
  const stats = {
    total: equipmentIssues.length,
    pending: equipmentIssues.filter((issue) => issue.status === 'pending').length,
    resolved: equipmentIssues.filter((issue) => issue.status === 'resolved').length,
    deleted: equipmentIssues.filter((issue) => issue.status === 'delete').length
  };

  // Filter equipment issues based on search and status
  const filteredIssues = equipmentIssues.filter((issue) => {
    const matchesSearch =
      !searchTerm ||
      issue.equipment_id?.equipmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.equipment_id?.equipmentCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.reported_by?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || statusFilter === 'all' || issue.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewDetail = (issue: EquipmentIssue) => {
    setSelectedIssue(issue);
    setShowDetailModal(true);
  };

  const handleResolveIssue = async (issueId: string) => {
    setResolvingIssue(issueId);

    const response = await equipmentIssueApi.resolveEquipmentIssue(issueId);

    if (response.success) {
      toast.success(t('equipmentIssue.resolveSuccess', 'Đã giải quyết báo cáo thành công'));
      fetchEquipmentIssues(); // Refresh the list
      setShowDetailModal(false);
    } else {
      toast.error(t('equipmentIssue.resolveError', 'Không thể giải quyết báo cáo'));
    }

    setResolvingIssue(null);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          {/* Breadcrumb */}
          <div className="text-xs sm:text-sm text-orange-500 font-medium">
            {t('equipmentIssue.management', 'QUẢN LÝ BÁO CÁO THIẾT BỊ')}
          </div>

          {/* Main Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {t('equipmentIssue.historyTitle', 'LỊCH SỬ BÁO CÁO THIẾT BỊ')}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {t('equipmentIssue.historySubtitle', 'Xem và quản lý các báo cáo lỗi thiết bị từ Personal Trainer.')}
              </p>
            </div>
          </div>

          {/* Branch Filter Badge */}
          {currentBranch && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 text-xs sm:text-sm">
                <MapPin className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">
                  {t('equipmentIssue.filteringByBranch', 'Đang lọc theo chi nhánh')}:{' '}
                </span>
                <span className="sm:hidden">{t('equipmentIssue.filteringByBranch', 'Đang lọc theo chi nhánh')}</span>
                <span className="font-medium">{currentBranch.branchName}</span>
              </Badge>
            </div>
          )}
        </div>

        {/* Main Content Card */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Stats Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-900 mb-1">
                    {t('equipmentIssue.total', 'TỔNG')}
                  </div>
                  <div className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">{stats.total}</div>
                  <p className="text-xs text-gray-500">{t('equipmentIssue.totalHelper', 'Tổng số báo cáo thiết bị')}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-yellow-600 mb-1">
                    {t('equipmentIssue.pending', 'CHỜ XỬ LÝ')}
                  </div>
                  <div className="text-xl sm:text-2xl font-semibold text-yellow-600 mb-1">{stats.pending}</div>
                  <p className="text-xs text-gray-500">{t('equipmentIssue.pendingHelper', 'Đang chờ giải quyết')}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-1">
                    {t('equipmentIssue.resolved', 'ĐÃ XỬ LÝ')}
                  </div>
                  <div className="text-xl sm:text-2xl font-semibold text-green-600 mb-1">{stats.resolved}</div>
                  <p className="text-xs text-gray-500">
                    {t('equipmentIssue.resolvedHelper', 'Đã giải quyết thành công')}
                  </p>
                </div>
              </div>

              <Separator className="my-4 sm:my-6" />

              {/* Search and Filter Bar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={t(
                      'equipmentIssue.searchPlaceholder',
                      'Nhập tên thiết bị, mã, mô tả lỗi hoặc người báo cáo'
                    )}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 sm:h-11 w-full rounded-full border border-transparent bg-gray-50 pl-10 sm:pl-12 pr-4 text-sm shadow-inner focus:border-orange-200 focus:bg-white focus:ring-orange-200"
                  />
                  <Search className="pointer-events-none absolute left-3 sm:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>

                {/* Status Filter */}
                <div className="relative dropdown-container">
                  <button
                    className="h-10 sm:h-11 rounded-full border border-gray-200 bg-white px-3 sm:px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-200 flex items-center gap-2 w-full sm:min-w-[140px] justify-between"
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  >
                    <span className="truncate">
                      {statusFilter === 'all'
                        ? t('equipmentIssue.allStatuses', 'Tất cả trạng thái')
                        : statusFilter === 'pending'
                          ? t('equipmentIssue.pendingStatus', 'Chờ xử lý')
                          : statusFilter === 'resolved'
                            ? t('equipmentIssue.resolvedStatus', 'Đã xử lý')
                            : statusFilter}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                        showStatusDropdown ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showStatusDropdown && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                      <div className="py-1">
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            setStatusFilter('all');
                            setShowStatusDropdown(false);
                          }}
                        >
                          {t('equipmentIssue.allStatuses', 'Tất cả trạng thái')}
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            setStatusFilter('pending');
                            setShowStatusDropdown(false);
                          }}
                        >
                          {t('equipmentIssue.pendingStatus', 'Chờ xử lý')}
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            setStatusFilter('resolved');
                            setShowStatusDropdown(false);
                          }}
                        >
                          {t('equipmentIssue.resolvedStatus', 'Đã xử lý')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-4 sm:my-6" />

              {/* Reports Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader className="bg-orange-50">
                      <TableRow className="border-orange-100 hover:bg-orange-50">
                        <TableHead className="text-orange-600 font-semibold">{t('equipmentIssue.no', 'STT')}</TableHead>
                        <TableHead className="text-orange-600 font-semibold">
                          {t('equipmentIssue.equipmentName', 'Tên thiết bị')}
                        </TableHead>
                        <TableHead className="text-orange-600 font-semibold">
                          {t('equipmentIssue.reportedBy', 'Người báo cáo')}
                        </TableHead>
                        <TableHead className="text-orange-600 font-semibold">
                          {t('equipmentIssue.issueDescription', 'Mô tả lỗi')}
                        </TableHead>
                        <TableHead className="text-orange-600 font-semibold">
                          {t('equipmentIssue.status', 'Trạng thái')}
                        </TableHead>
                        <TableHead className="text-orange-600 font-semibold">
                          {t('equipmentIssue.reportedDate', 'Ngày báo cáo')}
                        </TableHead>
                        <TableHead className="text-orange-600 font-semibold">
                          {t('common.actions', 'Thao tác')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <>
                          {Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Skeleton className="h-4 w-8" />
                              </TableCell>
                              <TableCell>
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-20" />
                                </div>
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-24" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-48" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-6 w-16 rounded-full" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-24" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-8 w-16" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      ) : error ? (
                        <TableRow>
                          <TableCell colSpan={7} className="p-0">
                            <Alert variant="destructive" className="m-4">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>Error loading data: {error}</AlertDescription>
                            </Alert>
                          </TableCell>
                        </TableRow>
                      ) : filteredIssues.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <div className="text-gray-500 mb-2">
                              {equipmentIssues.length === 0
                                ? t('equipmentIssue.noIssuesFound', 'Không tìm thấy báo cáo thiết bị nào')
                                : t('equipmentIssue.noMatchingIssues', 'Không tìm thấy báo cáo phù hợp')}
                            </div>
                            <div className="text-sm text-gray-400">
                              {equipmentIssues.length === 0
                                ? t(
                                    'equipmentIssue.noIssuesDescription',
                                    'Chưa có báo cáo lỗi thiết bị nào từ Personal Trainer.'
                                  )
                                : t(
                                    'equipmentIssue.noMatchingDescription',
                                    'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.'
                                  )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredIssues.map((issue: EquipmentIssue, index: number) => (
                          <TableRow
                            key={issue._id}
                            className={`hover:bg-orange-50/50 transition-colors ${
                              index % 2 === 0 ? 'bg-white' : 'bg-[#FFF9F2]'
                            }`}
                          >
                            <TableCell className="font-medium text-orange-500">{index + 1}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {issue.equipment_id?.equipmentName ||
                                    t('equipmentIssue.unknownEquipment', 'Thiết bị không xác định')}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {t('equipmentIssue.code', 'Mã')}:{' '}
                                  {issue.equipment_id?.equipmentCode || issue.equipment_id?._id}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {issue.reported_by?.fullName || t('equipmentIssue.unknownReporter', 'Không xác định')}
                                </div>
                                <div className="text-xs text-gray-500">{issue.reported_by?.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate" title={issue.reason}>
                                {issue.reason}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(issue.status)}</TableCell>
                            <TableCell className="text-gray-600">
                              {format(new Date(issue.createdAt), 'dd/MM/yyyy HH:mm')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetail(issue)}
                                  className="h-8 px-3"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  {t('common.view', 'Xem')}
                                </Button>
                                {issue.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleResolveIssue(issue._id)}
                                    disabled={resolvingIssue === issue._id}
                                    className="h-8 px-3 bg-green-500 hover:bg-green-600"
                                  >
                                    {resolvingIssue === issue._id ? (
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                    ) : (
                                      <Check className="w-4 h-4 mr-1" />
                                    )}
                                    {t('equipmentIssue.resolveAction', 'Giải quyết')}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden">
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
                  ) : error ? (
                    <div className="p-4">
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>Error loading data: {error}</AlertDescription>
                      </Alert>
                    </div>
                  ) : filteredIssues.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p>{t('equipmentIssue.noIssuesFound', 'Không tìm thấy báo cáo thiết bị nào')}</p>
                    </div>
                  ) : (
                    filteredIssues.map((issue: EquipmentIssue, index: number) => (
                      <div key={issue._id} className="bg-white border border-gray-200 rounded-lg p-4 m-4">
                        <div className="space-y-3">
                          {/* Header with status */}
                          <div className="flex justify-between items-start">
                            <div className="text-sm font-medium text-gray-600">#{index + 1}</div>
                            {getStatusBadge(issue.status)}
                          </div>

                          {/* Equipment name */}
                          <div>
                            <h3 className="font-semibold text-gray-900 text-base">
                              {issue.equipment_id?.equipmentName ||
                                t('equipmentIssue.unknownEquipment', 'Thiết bị không xác định')}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {t('equipmentIssue.code', 'Mã')}:{' '}
                              {issue.equipment_id?.equipmentCode || issue.equipment_id?._id}
                            </p>
                          </div>

                          {/* Reporter */}
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">{t('equipmentIssue.reportedBy', 'Người báo cáo')}:</span>{' '}
                            {issue.reported_by?.fullName || t('equipmentIssue.unknownReporter', 'Không xác định')}
                          </div>

                          {/* Issue description */}
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">{t('equipmentIssue.issueDescription', 'Mô tả lỗi')}:</span>{' '}
                            {issue.reason}
                          </div>

                          {/* Report date */}
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">{t('equipmentIssue.reportedDate', 'Ngày báo cáo')}:</span>{' '}
                            {format(new Date(issue.createdAt), 'dd/MM/yyyy HH:mm')}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetail(issue)}
                              className="flex-1 mr-2"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              {t('common.view', 'Xem')}
                            </Button>
                            {issue.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleResolveIssue(issue._id)}
                                disabled={resolvingIssue === issue._id}
                                className="flex-1 bg-green-500 hover:bg-green-600"
                              >
                                {resolvingIssue === issue._id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                ) : (
                                  <Check className="w-4 h-4 mr-1" />
                                )}
                                {t('equipmentIssue.resolveAction', 'Giải quyết')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                {t('equipmentIssue.detailTitle', 'Chi tiết báo cáo lỗi thiết bị')}
              </DialogTitle>
            </DialogHeader>

            {selectedIssue && (
              <div className="mt-4 space-y-6">
                {/* Equipment Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {t('equipmentIssue.equipmentInfo', 'Thông tin thiết bị')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        {t('equipmentIssue.equipmentName', 'Tên thiết bị')}:
                      </span>
                      <p className="text-sm text-gray-900">{selectedIssue.equipment_id?.equipmentName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        {t('equipmentIssue.code', 'Mã thiết bị')}:
                      </span>
                      <p className="text-sm text-gray-900">{selectedIssue.equipment_id?.equipmentCode}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        {t('equipmentIssue.category', 'Danh mục')}:
                      </span>
                      <p className="text-sm text-gray-900">{selectedIssue.equipment_id?.category}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        {t('equipmentIssue.status', 'Trạng thái')}:
                      </span>
                      <div className="mt-1">{getStatusBadge(selectedIssue.status)}</div>
                    </div>
                  </div>
                </div>

                {/* Reporter Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {t('equipmentIssue.reporterInfo', 'Thông tin người báo cáo')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        {t('equipmentIssue.reporterName', 'Tên')}:
                      </span>
                      <p className="text-sm text-gray-900">{selectedIssue.reported_by?.fullName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        {t('equipmentIssue.reporterEmail', 'Email')}:
                      </span>
                      <p className="text-sm text-gray-900">{selectedIssue.reported_by?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Issue Description */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {t('equipmentIssue.issueDescription', 'Mô tả lỗi')}
                  </h3>
                  <p className="text-sm text-gray-900">{selectedIssue.reason}</p>
                </div>

                {/* Images */}
                {selectedIssue.images && selectedIssue.images.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">{t('equipmentIssue.images', 'Hình ảnh')}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {selectedIssue.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image.url}
                            alt={`Issue image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{t('equipmentIssue.timestamps', 'Thời gian')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        {t('equipmentIssue.reportedDate', 'Ngày báo cáo')}:
                      </span>
                      <p className="text-sm text-gray-900">
                        {format(new Date(selectedIssue.createdAt), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        {t('equipmentIssue.lastUpdated', 'Cập nhật cuối')}:
                      </span>
                      <p className="text-sm text-gray-900">
                        {format(new Date(selectedIssue.updatedAt), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resolved Info */}
                {selectedIssue.status === 'resolved' && selectedIssue.resolved_by && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-3">
                      {t('equipmentIssue.resolvedInfo', 'Thông tin giải quyết')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-green-600">
                          {t('equipmentIssue.resolvedBy', 'Giải quyết bởi')}:
                        </span>
                        <p className="text-sm text-green-900">{selectedIssue.resolved_by.fullName}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-green-600">
                          {t('equipmentIssue.resolvedAt', 'Thời gian giải quyết')}:
                        </span>
                        <p className="text-sm text-green-900">
                          {format(new Date(selectedIssue.updatedAt), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                    {t('common.close', 'Đóng')}
                  </Button>
                  {selectedIssue.status === 'pending' && (
                    <Button
                      onClick={() => handleResolveIssue(selectedIssue._id)}
                      disabled={resolvingIssue === selectedIssue._id}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      {resolvingIssue === selectedIssue._id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      {t('equipmentIssue.resolveReport', 'Giải quyết báo cáo')}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};
