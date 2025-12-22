import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, User, CheckCircle2, XCircle, AlertCircle, Loader2, Mail } from 'lucide-react';
import { cn } from '@/utils/utils';
import { usePTAvailabilityRequestOperations } from '@/hooks/usePTAvailabilityRequest';
import { useUser } from '@/hooks/useAuth';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { useBranchWorkingConfig } from '@/hooks/useBranchWorkingConfig';
import type {
  PTAvailabilityRequestDetailModalProps,
  PTAvailabilityServiceContract
} from '@/types/api/PTAvailabilityRequest';
import { ScheduleGridSelector } from './ScheduleGridSelector';
import { startOfWeek } from 'date-fns';

const PTAvailabilityRequestDetailModal: React.FC<PTAvailabilityRequestDetailModalProps> = ({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject
}) => {
  const { t } = useTranslation();
  const user = useUser(); // Must be called before any conditional returns
  const { currentStaff } = useCurrentUserStaff(); // Get staff info to check jobTitle
  const { approveRequest, rejectRequest, loading } = usePTAvailabilityRequestOperations();
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Get branch config for default shifts
  const branchId: string | undefined =
    typeof request?.branchId === 'string' ? request.branchId : request?.branchId?._id;
  const { config: branchConfig } = useBranchWorkingConfig(branchId);

  // Calculate working days from branch config
  const workingDays = useMemo(() => {
    if (!branchConfig) {
      // If no config, allow all days (fallback)
      return [0, 1, 2, 3, 4, 5, 6];
    }

    // Check if there's a role config for PT
    if (request?.staffId?.jobTitle === 'Personal Trainer') {
      const ptRoleConfig = branchConfig.roleConfigs?.find((config) => config.role === 'PT');
      if (ptRoleConfig && ptRoleConfig.workingDays && ptRoleConfig.workingDays.length > 0) {
        return ptRoleConfig.workingDays;
      }
    }

    // Fallback to defaultWorkingDays
    if (branchConfig.defaultWorkingDays && branchConfig.defaultWorkingDays.length > 0) {
      return branchConfig.defaultWorkingDays;
    }

    // Final fallback: all days
    return [0, 1, 2, 3, 4, 5, 6];
  }, [branchConfig, request?.staffId?.jobTitle]);

  // Calculate startDate for ScheduleGridSelector (earliest date in slots)
  // Must be called before early return to follow Rules of Hooks
  const gridStartDate = useMemo(() => {
    if (!request || request.slots.length === 0) return startOfWeek(new Date(), { weekStartsOn: 1 });
    const dates = request.slots.map((slot) => new Date(slot.date));
    const earliestDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    return startOfWeek(earliestDate, { weekStartsOn: 1 });
  }, [request]);

  // Extract customer names from serviceContractIds
  const customerNames = useMemo(() => {
    if (!request || !request.serviceContractIds || request.serviceContractIds.length === 0) return [];

    return request.serviceContractIds.map((contract: PTAvailabilityServiceContract | string, index: number) => {
      let customerName = 'Unknown';

      // Check if contract is populated object
      if (contract && typeof contract === 'object' && '_id' in contract) {
        // Contract is populated
        if (contract.customerId) {
          if (typeof contract.customerId === 'object' && '_id' in contract.customerId) {
            // customerId is populated object
            // Customer model has userId (ref to User), not fullName directly
            if (contract.customerId.userId) {
              if (typeof contract.customerId.userId === 'object' && '_id' in contract.customerId.userId) {
                // userId is populated
                customerName = contract.customerId.userId.fullName || 'Unknown';
              } else if (typeof contract.customerId.userId === 'string') {
                // userId is just ObjectId, not populated
                customerName = `Customer ${index + 1}`;
              }
            } else {
              // customerId object but no userId
              customerName = `Customer ${index + 1}`;
            }
          } else if (typeof contract.customerId === 'string') {
            // customerId is just ObjectId string, not populated
            customerName = `Contract ${index + 1}`;
          }
        } else if (contract.customer && typeof contract.customer === 'object') {
          // Alternative structure
          customerName = contract.customer.fullName || 'Unknown';
        } else {
          // Contract object but no customerId field
          customerName = `Contract ${index + 1}`;
        }
      } else if (typeof contract === 'string') {
        // Contract is just ObjectId string, not populated
        customerName = `Contract ${index + 1}`;
      }

      return customerName;
    });
  }, [request?.serviceContractIds]);

  if (!request) {
    return null;
  }

  const handleApprove = async () => {
    if (!showApproveForm) {
      setShowApproveForm(true);
      setShowRejectForm(false);
      return;
    }

    const result = await approveRequest(request._id, approveNotes ? { notes: approveNotes } : undefined);
    if (result) {
      onApprove?.(request, approveNotes);
      handleClose();
    }
  };

  const handleReject = async () => {
    if (!showRejectForm) {
      setShowRejectForm(true);
      setShowApproveForm(false);
      return;
    }

    if (!rejectionReason.trim()) {
      return;
    }

    const result = await rejectRequest(request._id, { rejectionReason: rejectionReason.trim() });
    if (result) {
      onReject?.(request, rejectionReason);
      handleClose();
    }
  };

  const handleClose = () => {
    setShowApproveForm(false);
    setShowRejectForm(false);
    setApproveNotes('');
    setRejectionReason('');
    onClose();
  };

  // Check if user is PT (STAFF role with Personal Trainer jobTitle) - hide approve/reject buttons for PT
  // Only Owner/Manager can approve/reject requests
  const isPT = user?.role === 'STAFF' && currentStaff?.jobTitle === 'Personal Trainer';

  // Check if user is Manager (STAFF with jobTitle "Manager") or Owner
  const isManager = user?.role === 'OWNER' || (user?.role === 'STAFF' && currentStaff?.jobTitle === 'Manager');

  // Hide approve/reject for PT - only Owner/Manager can approve/reject
  const canApprove = !isPT && isManager && request.status === 'PENDING_APPROVAL';
  const canReject = !isPT && isManager && request.status === 'PENDING_APPROVAL';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] w-[95vw] sm:w-full flex flex-col overflow-hidden p-0">
        <div className="flex flex-col flex-1 overflow-hidden">
          <DialogHeader className="space-y-3 pb-4 border-b px-6 pt-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-orange-500" />
                  {t('pt_availability.request_details', 'Chi Tiết Yêu Cầu')}
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-gray-600">
                  {t('pt_availability.request_details_description', 'Xem chi tiết yêu cầu đăng ký lịch kèm 1vs1')}
                </DialogDescription>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'text-sm font-semibold px-3 py-1',
                  request.status === 'PENDING_APPROVAL' && 'bg-amber-50 text-amber-700 border-amber-300',
                  request.status === 'APPROVED' && 'bg-green-50 text-green-700 border-green-300',
                  request.status === 'REJECTED' && 'bg-red-50 text-red-700 border-red-300'
                )}
              >
                {request.status === 'PENDING_APPROVAL' && (
                  <>
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {t('pt_availability.status.pending', 'Chờ Duyệt')}
                  </>
                )}
                {request.status === 'APPROVED' && (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    {t('pt_availability.status.approved', 'Đã Duyệt')}
                  </>
                )}
                {request.status === 'REJECTED' && (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    {t('pt_availability.status.rejected', 'Đã Từ Chối')}
                  </>
                )}
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* Staff Information & Branch Information */}
              <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <User className="w-5 h-5 text-orange-500" />
                    {t('pt_availability.staff_information', 'Thông Tin PT')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: PT Information */}
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 ring-2 ring-orange-200 flex-shrink-0">
                        <AvatarImage
                          src={
                            request.staffId.userId?.email
                              ? `https://ui-avatars.com/api/?name=${request.staffId.userId?.fullName || 'Unknown'}&background=orange&color=fff`
                              : undefined
                          }
                          alt={request.staffId.userId?.fullName || 'Unknown'}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xl font-bold">
                          {(request.staffId.userId?.fullName || 'U').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-lg">
                            {request.staffId.userId?.fullName || 'Unknown'}
                          </h3>
                          {customerNames.length > 0 && (
                            <>
                              <span className="text-gray-400">|</span>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm text-gray-500 font-medium">
                                  {t('pt_availability.customer', 'Khách hàng')}:
                                </span>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {customerNames.map((name, index) => (
                                    <span key={index} className="text-sm font-medium text-gray-900">
                                      {name}
                                      {index < customerNames.length - 1 && ','}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{request.staffId.jobTitle}</p>
                        {request.staffId.userId?.email && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="break-all">{request.staffId.userId.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Branch Information */}
                    <div className="flex items-start gap-3 border-l border-orange-200 pl-6 md:pl-6">
                      <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500 font-medium mb-1">
                          {t('pt_availability.branch', 'Chi Nhánh')}
                        </p>
                        <p className="font-medium text-gray-900">
                          {request.branchId?.branchName || t('common.unknown', 'Unknown')}
                        </p>
                        {request.branchId?.location && (
                          <p className="text-sm text-gray-600 mt-1">{request.branchId.location}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Time Slots - Using ScheduleGridSelector */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    {t('pt_availability.time_slots', 'Khung Giờ')} ({request.slots.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScheduleGridSelector
                    selectedSlots={request.slots}
                    readOnly={true}
                    slotDuration={30}
                    staffId={request.staffId._id}
                    startDate={gridStartDate}
                    workingDays={workingDays}
                    branchConfig={branchConfig || undefined}
                  />
                </CardContent>
              </Card>

              {/* Notes */}
              {request.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">{t('pt_availability.notes', 'Ghi Chú')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Rejection Reason */}
              {request.rejectionReason && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-red-900 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      {t('pt_availability.rejection_reason', 'Lý Do Từ Chối')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-800 whitespace-pre-wrap">{request.rejectionReason}</p>
                  </CardContent>
                </Card>
              )}

              {/* Approval Info */}
              {request.approvedBy && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-green-900 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      {t('pt_availability.approval_info', 'Thông Tin Duyệt')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-green-800">
                        <span className="font-medium">{t('pt_availability.approved_by', 'Được duyệt bởi')}:</span>{' '}
                        {request.approvedBy.fullName || 'Unknown'}
                      </p>
                      {request.approvedAt && (
                        <p className="text-sm text-green-700">
                          {t('pt_availability.approved_at', 'Vào lúc')}:{' '}
                          {new Date(request.approvedAt).toLocaleString('vi-VN')}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Approve Form */}
              {showApproveForm && canApprove && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-green-900 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      {t('pt_availability.approve_request', 'Duyệt Yêu Cầu')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="approveNotes" className="text-sm font-medium">
                        {t('pt_availability.approve_notes', 'Ghi Chú Duyệt')} ({t('common.optional', 'Tùy chọn')})
                      </Label>
                      <Textarea
                        id="approveNotes"
                        placeholder={t('pt_availability.approve_notes_placeholder', 'Thêm ghi chú khi duyệt...')}
                        value={approveNotes}
                        onChange={(e) => setApproveNotes(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button onClick={handleApprove} disabled={loading} className="bg-green-600 hover:bg-green-700">
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t('common.processing', 'Đang xử lý...')}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {t('pt_availability.confirm_approve', 'Xác Nhận Duyệt')}
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setShowApproveForm(false)} disabled={loading}>
                        {t('common.cancel', 'Hủy')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reject Form */}
              {showRejectForm && canReject && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-red-900 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      {t('pt_availability.reject_request', 'Từ Chối Yêu Cầu')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="rejectionReason" className="text-sm font-medium">
                        {t('pt_availability.rejection_reason', 'Lý Do Từ Chối')} *
                      </Label>
                      <Textarea
                        id="rejectionReason"
                        placeholder={t('pt_availability.rejection_reason_placeholder', 'Nhập lý do từ chối yêu cầu...')}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                        className="resize-none"
                        required
                      />
                      {!rejectionReason.trim() && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {t('pt_availability.rejection_reason_required', 'Vui lòng nhập lý do từ chối')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleReject}
                        disabled={loading || !rejectionReason.trim()}
                        variant="destructive"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t('common.processing', 'Đang xử lý...')}
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            {t('pt_availability.confirm_reject', 'Xác Nhận Từ Chối')}
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setShowRejectForm(false)} disabled={loading}>
                        {t('common.cancel', 'Hủy')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              {!showApproveForm && !showRejectForm && (
                <div className="flex items-center justify-end gap-3 pt-4 border-t mt-6">
                  <Button variant="outline" onClick={handleClose}>
                    {t('common.close', 'Đóng')}
                  </Button>
                  {canApprove && (
                    <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t('pt_availability.approve', 'Duyệt')}
                    </Button>
                  )}
                  {canReject && (
                    <Button onClick={handleReject} variant="destructive">
                      <XCircle className="w-4 h-4 mr-2" />
                      {t('pt_availability.reject', 'Từ Chối')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PTAvailabilityRequestDetailModal;
