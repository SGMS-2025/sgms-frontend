import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, Clock, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { businessVerificationApi } from '@/services/api/businessVerificationApi';
import socketService from '@/services/socket/socketService';
import type {
  BusinessVerification,
  BusinessVerificationListQuery,
  BusinessVerificationStatistics
} from '@/types/api/BusinessVerification';
import type { BusinessVerificationUpdateEvent } from '@/types/api/Socket';
import { BusinessVerificationStatus } from '@/types/api/BusinessVerification';
import { format } from 'date-fns';

const BusinessVerificationManagementPage = () => {
  const { t } = useTranslation();
  const [verifications, setVerifications] = useState<BusinessVerification[]>([]);
  const [statistics, setStatistics] = useState<BusinessVerificationStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<BusinessVerification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Filters
  const [filters, setFilters] = useState<BusinessVerificationListQuery>({
    status: undefined,
    page: 1,
    limit: 10,
    sortBy: 'submittedAt',
    sortOrder: 'desc',
    search: ''
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  const loadVerifications = useCallback(async () => {
    setIsLoading(true);
    const result = await businessVerificationApi.getVerificationList(filters);
    setIsLoading(false);

    if (result.success) {
      setVerifications(result.data.verifications);
      setPagination(result.data.pagination);
    } else {
      toast.error(
        result.message ||
          t('admin.business_verification.toast.load_failed', 'Không thể tải danh sách yêu cầu. Vui lòng thử lại.')
      );
    }
  }, [filters, t]);

  const loadStatistics = useCallback(async () => {
    const result = await businessVerificationApi.getStatistics();
    if (result.success) {
      setStatistics(result.data);
    } else {
      // Silent fail for statistics - not critical
      console.error('Failed to load statistics:', result.message);
    }
  }, []);

  useEffect(() => {
    loadVerifications();
    loadStatistics();
  }, [loadVerifications, loadStatistics]);

  // Realtime updates via socket
  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout | null = null;

    const handleBusinessVerificationUpdate = (data: BusinessVerificationUpdateEvent) => {
      console.log('[Socket] Business verification updated:', data);

      // Debounce refetch - wait 500ms after last event before refetching
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      debounceTimeout = setTimeout(() => {
        // Reload verifications and statistics
        loadVerifications();
        loadStatistics();
      }, 500);
    };

    // Listen for all business verification update events
    socketService.on('business-verification:submitted', handleBusinessVerificationUpdate);
    socketService.on('business-verification:approved', handleBusinessVerificationUpdate);
    socketService.on('business-verification:rejected', handleBusinessVerificationUpdate);

    // Cleanup
    return () => {
      socketService.off('business-verification:submitted', handleBusinessVerificationUpdate);
      socketService.off('business-verification:approved', handleBusinessVerificationUpdate);
      socketService.off('business-verification:rejected', handleBusinessVerificationUpdate);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [loadVerifications, loadStatistics]);

  const handleApprove = async () => {
    if (!selectedVerification) return;

    setIsLoading(true);
    const result = await businessVerificationApi.approveVerification(selectedVerification._id, {
      adminNotes
    });
    setIsLoading(false);

    if (result.success) {
      toast.success(t('admin.business_verification.toast.approve_success'));
      setShowApproveModal(false);
      setAdminNotes('');
      loadVerifications();
      loadStatistics();
    } else {
      toast.error(
        result.message ||
          t('admin.business_verification.toast.approve_failed', 'Phê duyệt yêu cầu thất bại. Vui lòng thử lại.')
      );
    }
  };

  const handleReject = async () => {
    if (!selectedVerification || !rejectionReason) {
      toast.error(t('admin.business_verification.toast.reject_reason_required'));
      return;
    }

    setIsLoading(true);
    const result = await businessVerificationApi.rejectVerification(selectedVerification._id, {
      rejectionReason,
      adminNotes
    });
    setIsLoading(false);

    if (result.success) {
      toast.success(t('admin.business_verification.toast.reject_success'));
      setShowRejectModal(false);
      setRejectionReason('');
      setAdminNotes('');
      loadVerifications();
      loadStatistics();
    } else {
      toast.error(
        result.message ||
          t('admin.business_verification.toast.reject_failed', 'Từ chối yêu cầu thất bại. Vui lòng thử lại.')
      );
    }
  };

  const getStatusBadge = (status: BusinessVerificationStatus) => {
    switch (status) {
      case BusinessVerificationStatus.PENDING:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            {t('admin.business_verification.status.pending')}
          </Badge>
        );
      case BusinessVerificationStatus.APPROVED:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {t('admin.business_verification.status.approved')}
          </Badge>
        );
      case BusinessVerificationStatus.REJECTED:
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            {t('admin.business_verification.status.rejected')}
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const openDetailModal = (verification: BusinessVerification) => {
    setSelectedVerification(verification);
    setShowDetailModal(true);
  };

  const openApproveModal = (verification: BusinessVerification) => {
    setSelectedVerification(verification);
    setShowApproveModal(true);
  };

  const openRejectModal = (verification: BusinessVerification) => {
    setSelectedVerification(verification);
    setShowRejectModal(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.business_verification.title')}</h1>
          <p className="text-gray-600 mt-1">{t('admin.business_verification.subtitle')}</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t('admin.business_verification.stats.total')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-600">
                {t('admin.business_verification.stats.pending')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statistics.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600">
                {t('admin.business_verification.stats.approved')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600">
                {t('admin.business_verification.stats.rejected')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.rejected}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('admin.business_verification.filters.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('admin.business_verification.filters.status')}</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    status: value === 'all' ? undefined : (value as BusinessVerificationStatus)
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.business_verification.filters.status_all_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.business_verification.filters.status_all')}</SelectItem>
                  <SelectItem value={BusinessVerificationStatus.PENDING}>
                    {t('admin.business_verification.filters.status_pending')}
                  </SelectItem>
                  <SelectItem value={BusinessVerificationStatus.APPROVED}>
                    {t('admin.business_verification.filters.status_approved')}
                  </SelectItem>
                  <SelectItem value={BusinessVerificationStatus.REJECTED}>
                    {t('admin.business_verification.filters.status_rejected')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.business_verification.filters.sort_by')}</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) =>
                  setFilters({ ...filters, sortBy: value as BusinessVerificationListQuery['sortBy'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submittedAt">{t('admin.business_verification.filters.sort_submitted')}</SelectItem>
                  <SelectItem value="reviewedAt">{t('admin.business_verification.filters.sort_reviewed')}</SelectItem>
                  <SelectItem value="businessName">
                    {t('admin.business_verification.filters.sort_business_name')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.business_verification.filters.search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t('admin.business_verification.filters.search_placeholder')}
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.business_verification.table.title')}</CardTitle>
          <CardDescription>
            {t('admin.business_verification.table.showing', {
              current: verifications.length,
              total: pagination.total
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('admin.business_verification.table.loading')}</p>
            </div>
          ) : verifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{t('admin.business_verification.table.empty')}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.business_verification.table.headers.business')}</TableHead>
                    <TableHead>{t('admin.business_verification.table.headers.sender')}</TableHead>
                    <TableHead>{t('admin.business_verification.table.headers.tax_code')}</TableHead>
                    <TableHead>{t('admin.business_verification.table.headers.submitted_date')}</TableHead>
                    <TableHead>{t('admin.business_verification.table.headers.status')}</TableHead>
                    <TableHead className="text-right">
                      {t('admin.business_verification.table.headers.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifications.map((verification) => (
                    <TableRow key={verification._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={verification.logo.url}
                              alt={verification.businessName}
                              className="w-10 h-10 rounded object-cover"
                            />
                            {verification.documents && verification.documents.length > 0 && (
                              <div className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {verification.documents.length}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{verification.businessName}</div>
                            <div className="text-sm text-gray-500">{verification.businessEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{verification.userInfo?.fullName || verification.userInfo?.username}</div>
                        <div className="text-sm text-gray-500">{verification.userInfo?.email}</div>
                      </TableCell>
                      <TableCell>{verification.taxCode || verification.businessCode || 'N/A'}</TableCell>
                      <TableCell>{format(new Date(verification.submittedAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell>{getStatusBadge(verification.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openDetailModal(verification)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {verification.isPending && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => openApproveModal(verification)}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => openRejectModal(verification)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  {t('admin.business_verification.pagination.page', {
                    page: pagination.page,
                    total: pagination.totalPages
                  })}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
                    disabled={filters.page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
                    disabled={filters.page === pagination.totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.business_verification.modal.detail_title')}</DialogTitle>
          </DialogHeader>
          {selectedVerification && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedVerification.logo.url}
                  alt={selectedVerification.businessName}
                  className="w-20 h-20 rounded object-cover border"
                />
                <div>
                  <h3 className="text-xl font-bold">{selectedVerification.businessName}</h3>
                  {getStatusBadge(selectedVerification.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">{t('admin.business_verification.modal.tax_code')}</Label>
                  <p className="font-medium">{selectedVerification.taxCode || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">{t('admin.business_verification.modal.business_code')}</Label>
                  <p className="font-medium">{selectedVerification.businessCode || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">{t('admin.business_verification.modal.phone')}</Label>
                  <p className="font-medium">{selectedVerification.businessPhone}</p>
                </div>
                <div>
                  <Label className="text-gray-600">{t('admin.business_verification.modal.email')}</Label>
                  <p className="font-medium">{selectedVerification.businessEmail}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-600">{t('admin.business_verification.modal.address')}</Label>
                  <p className="font-medium">{selectedVerification.businessAddress}</p>
                </div>
                {selectedVerification.description && (
                  <div className="col-span-2">
                    <Label className="text-gray-600">{t('admin.business_verification.modal.description')}</Label>
                    <p className="font-medium">{selectedVerification.description}</p>
                  </div>
                )}
                <div>
                  <Label className="text-gray-600">{t('admin.business_verification.modal.submitted_date')}</Label>
                  <p className="font-medium">
                    {format(new Date(selectedVerification.submittedAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                {selectedVerification.reviewedAt && (
                  <div>
                    <Label className="text-gray-600">{t('admin.business_verification.modal.reviewed_date')}</Label>
                    <p className="font-medium">
                      {format(new Date(selectedVerification.reviewedAt), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                )}
                {selectedVerification.rejectionReason && (
                  <div className="col-span-2">
                    <Label className="text-gray-600">{t('admin.business_verification.modal.rejection_reason')}</Label>
                    <Alert variant="destructive" className="mt-2">
                      <AlertDescription>{selectedVerification.rejectionReason}</AlertDescription>
                    </Alert>
                  </div>
                )}
                {selectedVerification.adminNotes && (
                  <div className="col-span-2">
                    <Label className="text-gray-600">{t('admin.business_verification.modal.admin_notes')}</Label>
                    <p className="font-medium mt-1">{selectedVerification.adminNotes}</p>
                  </div>
                )}
              </div>

              {/* Documents Section */}
              {selectedVerification.documents && selectedVerification.documents.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-900 font-semibold text-base">
                      {t('admin.business_verification.modal.documents_title', {
                        count: selectedVerification.documents.length
                      })}
                    </Label>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {selectedVerification.documents.map((doc, index) => (
                      <a
                        key={index}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group cursor-pointer block"
                      >
                        <img
                          src={doc.url}
                          alt={doc.fileName || `Document ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 hover:border-orange-500 transition-all duration-200 hover:shadow-lg"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-lg flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute bottom-2 left-2 bg-orange-600 text-white text-xs px-2 py-0.5 rounded font-medium">
                          {index + 1}
                        </div>
                        {doc.fileName && (
                          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded max-w-[80%] truncate">
                            {doc.fileName}
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 italic">
                    {t('admin.business_verification.modal.documents_hint')}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('admin.business_verification.modal.approve_title')}</DialogTitle>
            <DialogDescription>
              {t('admin.business_verification.modal.approve_description', {
                businessName: selectedVerification?.businessName
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('admin.business_verification.modal.approve_notes')}</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={t('admin.business_verification.modal.approve_notes_placeholder')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveModal(false)}>
              {t('admin.business_verification.modal.cancel')}
            </Button>
            <Button onClick={handleApprove} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
              {isLoading
                ? t('admin.business_verification.modal.approve_processing')
                : t('admin.business_verification.modal.approve_button')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('admin.business_verification.modal.reject_title')}</DialogTitle>
            <DialogDescription>
              {t('admin.business_verification.modal.reject_description', {
                businessName: selectedVerification?.businessName
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {t('admin.business_verification.modal.reject_reason')} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t('admin.business_verification.modal.reject_reason_placeholder')}
                rows={3}
                className={!rejectionReason ? 'border-red-500' : ''}
              />
              {!rejectionReason && (
                <p className="text-sm text-red-500 mt-1">
                  {t('admin.business_verification.modal.reject_reason_required')}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('admin.business_verification.modal.reject_notes')}</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={t('admin.business_verification.modal.reject_notes_placeholder')}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              {t('admin.business_verification.modal.cancel')}
            </Button>
            <Button onClick={handleReject} disabled={isLoading || !rejectionReason} variant="destructive">
              {isLoading
                ? t('admin.business_verification.modal.reject_processing')
                : t('admin.business_verification.modal.reject_button')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessVerificationManagementPage;
