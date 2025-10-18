import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRightLeft,
  UserPlus,
  Timer,
  AlertTriangle,
  Ban,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/utils/utils';
import type {
  RescheduleRequestDetailModalProps,
  RescheduleState,
  RescheduleType,
  ReschedulePriority
} from '@/types/api/Reschedule';

// Type for requester ID that can be string or populated object
type RequesterIdType =
  | string
  | {
      _id: string;
      userId?: {
        _id: string;
      };
    };

// Helper function to safely compare requester ID with current user ID
const isRequesterUser = (requesterId: RequesterIdType, currentUserId?: string): boolean => {
  if (!currentUserId) {
    return false;
  }

  if (typeof requesterId === 'string') {
    return requesterId === currentUserId;
  }

  if (requesterId && typeof requesterId === 'object') {
    // Check if it's a populated staff object with userId
    if ('userId' in requesterId && requesterId.userId && typeof requesterId.userId === 'object') {
      return requesterId.userId._id === currentUserId;
    }

    // Check if it's a simple object with _id
    if ('_id' in requesterId) {
      return requesterId._id === currentUserId;
    }
  }

  return false;
};

const getStatusColor = (status: RescheduleState) => {
  switch (status) {
    case 'PENDING_BROADCAST':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'PENDING_ACCEPTANCE':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'PENDING_APPROVAL':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'APPROVED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'REJECTED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'EXPIRED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: RescheduleState) => {
  switch (status) {
    case 'PENDING_BROADCAST':
      return <AlertCircle className="h-4 w-4" />;
    case 'PENDING_ACCEPTANCE':
      return <Timer className="h-4 w-4" />;
    case 'PENDING_APPROVAL':
      return <AlertTriangle className="h-4 w-4" />;
    case 'APPROVED':
      return <CheckCircle className="h-4 w-4" />;
    case 'REJECTED':
      return <XCircle className="h-4 w-4" />;
    case 'CANCELLED':
      return <XCircle className="h-4 w-4" />;
    case 'EXPIRED':
      return <AlertTriangle className="h-4 w-4" />;
    case 'COMPLETED':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getStatusText = (status: RescheduleState, t: (key: string) => string) => {
  switch (status) {
    case 'PENDING_BROADCAST':
      return t('reschedule.status.pending_broadcast');
    case 'PENDING_ACCEPTANCE':
      return t('reschedule.status.pending_acceptance');
    case 'PENDING_APPROVAL':
      return t('reschedule.status.pending_approval');
    case 'APPROVED':
      return t('reschedule.status.approved');
    case 'REJECTED':
      return t('reschedule.status.rejected');
    case 'CANCELLED':
      return t('reschedule.status.cancelled');
    case 'EXPIRED':
      return t('reschedule.status.expired');
    case 'COMPLETED':
      return t('reschedule.status.completed');
    default:
      return status;
  }
};

const getTypeText = (type: RescheduleType, t: (key: string) => string) => {
  switch (type) {
    case 'FIND_REPLACEMENT':
      return t('reschedule.type.find_replacement');
    case 'DIRECT_SWAP':
      return t('reschedule.type.direct_swap');
    case 'MANAGER_ASSIGN':
      return t('reschedule.type.manager_assign');
    default:
      return type;
  }
};

const getTypeIcon = (type: RescheduleType) => {
  switch (type) {
    case 'FIND_REPLACEMENT':
      return <UserPlus className="h-4 w-4" />;
    case 'DIRECT_SWAP':
      return <ArrowRightLeft className="h-4 w-4" />;
    case 'MANAGER_ASSIGN':
      return <User className="h-4 w-4" />;
    default:
      return <ArrowRightLeft className="h-4 w-4" />;
  }
};

const getPriorityColor = (priority: ReschedulePriority) => {
  switch (priority) {
    case 'LOW':
      return 'bg-gray-100 text-gray-800';
    case 'MEDIUM':
      return 'bg-blue-100 text-blue-800';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800';
    case 'URGENT':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const RescheduleRequestDetailModal: React.FC<RescheduleRequestDetailModalProps> = ({
  isOpen,
  onClose,
  request,
  onAccept,
  onApprove,
  onReject,
  onCancel,
  userRole,
  currentUserId
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Reset states when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setShowConfirmCancel(false);
    }
  }, [isOpen]);

  if (!request) return null;

  // Get populated data
  const requester = typeof request.requesterStaffId === 'string' ? null : request.requesterStaffId;

  const targetStaff = typeof request.targetStaffId === 'string' ? null : request.targetStaffId;

  const originalShift = typeof request.originalShiftId === 'string' ? null : request.originalShiftId;

  const branch = typeof request.branchId === 'string' ? null : request.branchId;

  // Permission checks
  const canAccept = request.status === 'PENDING_BROADCAST' && !isRequesterUser(request.requesterStaffId, currentUserId);

  const canApprove = request.status === 'PENDING_APPROVAL' && (userRole === 'MANAGER' || userRole === 'OWNER');

  const canReject = request.status === 'PENDING_APPROVAL' && (userRole === 'MANAGER' || userRole === 'OWNER');

  const canCancel =
    (request.status === 'PENDING_BROADCAST' || request.status === 'PENDING_ACCEPTANCE') &&
    (typeof request.requesterStaffId === 'string'
      ? request.requesterStaffId === currentUserId
      : request.requesterStaffId.userId?._id === currentUserId);

  const handleAccept = async () => {
    if (onAccept) {
      setIsLoading(true);
      try {
        await onAccept(request);
        // Đóng modal sau khi thành công
        onClose();
      } catch (error) {
        console.error('Error accepting reschedule request:', error);
        // Không đóng modal nếu có lỗi
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleApprove = async () => {
    if (onApprove) {
      setIsLoading(true);
      try {
        await onApprove(request);
        // Đóng modal sau khi thành công
        onClose();
      } catch (error) {
        console.error('Error approving reschedule request:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleReject = async () => {
    if (onReject) {
      setIsLoading(true);
      try {
        await onReject(request, '');
        // Đóng modal sau khi thành công
        onClose();
      } catch (error) {
        console.error('Error rejecting reschedule request:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCancel = async () => {
    if (onCancel) {
      setIsLoading(true);
      try {
        await onCancel(request);
        // Đóng modal sau khi thành công
        onClose();
        setShowConfirmCancel(false);
      } catch (error) {
        console.error('Error cancelling reschedule request:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Format expiry time
  const formatExpiryTime = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) {
      return t('reschedule.expired');
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return t('reschedule.expires_in_hours', { hours, minutes });
    } else {
      return t('reschedule.expires_in_minutes', { minutes });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="overflow-y-auto p-0"
          style={{
            width: '800px',
            height: '600px',
            maxWidth: '100vw',
            maxHeight: '100vh'
          }}
        >
          <DialogTitle className="sr-only">{t('reschedule.request_details')}</DialogTitle>
          <DialogDescription className="sr-only">{t('reschedule.view_request_details')}</DialogDescription>

          {/* Title Section */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{t('reschedule.request_details')}</h2>
              <div className="flex items-center gap-3 mr-9">
                <Badge className={cn('text-xs', getStatusColor(request.status))}>
                  {getStatusIcon(request.status)}
                  <span className="ml-1">{getStatusText(request.status, t)}</span>
                </Badge>
                <Badge className={cn('text-xs', getPriorityColor(request.priority))}>{request.priority}</Badge>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Requester Information */}
              <div className="flex items-start gap-3 py-3 px-2 hover:bg-gray-50 rounded cursor-pointer">
                <User className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {requester?.userId?.fullName || requester?.userId?.email || t('common.staff_member')}
                      </div>
                      <div className="text-sm text-gray-600">{requester?.jobTitle || t('common.staff')}</div>
                      <div className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline">
                        {t('common.view_profile')}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-gray-600 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 flex-shrink-0" />
                        <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                          {originalShift?.startTime ? formatDate(originalShift.startTime) : t('common.not_available')}
                        </div>
                      </div>
                      {originalShift?.startTime && originalShift?.endTime && (
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(originalShift.startTime).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}{' '}
                          -{' '}
                          {new Date(originalShift.endTime).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Swap Type */}

              {/* Location */}
              <div className="flex items-start gap-3 py-3 px-2 hover:bg-gray-50 rounded cursor-pointer">
                <MapPin className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {branch?.branchName || t('common.branch')}
                      </div>
                      <div className="text-sm text-gray-600">{branch?.location || t('common.location')}</div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-5 w-5 flex-shrink-0" />
                        <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                          {t('reschedule.expires')}
                        </div>
                      </div>
                      <div
                        className={cn(
                          'text-sm whitespace-nowrap',
                          request.isExpired ? 'text-red-600' : 'text-gray-600'
                        )}
                      >
                        {formatExpiryTime(request.expiresAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 py-3 px-2 hover:bg-gray-50 rounded cursor-pointer">
                {getTypeIcon(request.swapType)}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{getTypeText(request.swapType, t)}</div>
                  <div className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline">
                    {t('reschedule.view_swap_details')}
                  </div>
                </div>
              </div>
              {/* Target Staff (if exists) */}
              {targetStaff && (
                <div className="flex items-start gap-3 py-3 px-2 hover:bg-gray-50 rounded cursor-pointer">
                  <UserPlus className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {targetStaff.userId?.fullName || targetStaff.userId?.email || t('common.staff_member')}
                    </div>
                    <div className="text-sm text-gray-600">{targetStaff.jobTitle || t('common.staff')}</div>
                    <div className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline">
                      {t('common.view_profile')}
                    </div>
                  </div>
                </div>
              )}

              {/* Reason */}
              <div className="py-3">
                <div className="text-sm font-medium text-gray-900 mb-2">{t('reschedule.reason')}</div>
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{request.reason}</div>
              </div>

              {/* Rejection Reason */}
              {request.rejectionReason && (
                <div className="py-3">
                  <div className="text-sm font-medium text-red-600 mb-2">{t('reschedule.rejection_reason')}</div>
                  <div className="text-sm text-red-700 bg-red-50 p-3 rounded-md">{request.rejectionReason}</div>
                </div>
              )}

              {/* State History */}
              {request.stateHistory && request.stateHistory.length > 0 && (
                <div className="py-3">
                  <button
                    type="button"
                    onClick={() => setShowHistory((v) => !v)}
                    className="w-full flex items-center justify-between text-sm font-medium text-gray-900 mb-2"
                  >
                    <span>
                      {t('reschedule.state_history')} ({request.stateHistory.length})
                    </span>
                    <ChevronDown className={cn('h-4 w-4 transition-transform', showHistory ? 'rotate-180' : '')} />
                  </button>
                  {showHistory && (
                    <div className="space-y-2">
                      {request.stateHistory.map((history, index) => (
                        <div
                          key={`${history.state}-${history.changedAt}-${index}`}
                          className="flex items-center gap-2 text-xs text-gray-600"
                        >
                          <Badge className={cn('text-xs', getStatusColor(history.state))}>
                            {getStatusText(history.state, t)}
                          </Badge>
                          <span>{formatDate(history.changedAt)}</span>
                          {history.reason && <span>- {history.reason}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center p-4 border-t">
            <div className="flex gap-2">
              <button className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                {t('common.more_options')}
              </button>
              {canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                  onClick={() => setShowConfirmCancel(true)}
                  disabled={isLoading}
                >
                  <Ban className="h-4 w-4 mr-1" />
                  {t('reschedule.cancel')}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                {t('common.close')}
              </Button>
              {canAccept && (
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleAccept}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('common.processing')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t('reschedule.accept')}
                    </>
                  )}
                </Button>
              )}
              {canApprove && (
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleApprove}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('common.processing')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t('reschedule.approve')}
                    </>
                  )}
                </Button>
              )}
              {canReject && (
                <Button variant="destructive" onClick={handleReject} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('common.processing')}
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      {t('reschedule.reject')}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Cancel */}
      {showConfirmCancel && (
        <Dialog open={showConfirmCancel} onOpenChange={setShowConfirmCancel}>
          <DialogContent className="max-w-md">
            <DialogTitle>{t('reschedule.cancel_request')}</DialogTitle>
            <DialogDescription>{t('reschedule.cancel_confirmation')}</DialogDescription>

            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm font-medium text-gray-900">
                  {requester?.userId?.fullName || requester?.userId?.email || t('common.staff_member')}
                </div>
                <div className="text-sm text-gray-600">
                  {originalShift?.startTimeFmt} - {originalShift?.endTimeFmt}
                </div>
                <div className="text-xs text-gray-500">{getTypeText(request.swapType, t)}</div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowConfirmCancel(false)} disabled={isLoading}>
                  {t('common.cancel')}
                </Button>
                <Button variant="destructive" onClick={handleCancel} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('common.processing')}
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4 mr-2" />
                      {t('reschedule.cancel')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default RescheduleRequestDetailModal;
