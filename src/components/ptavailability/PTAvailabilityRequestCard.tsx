import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import ActionDropdown, { createActionItems } from '@/components/common/ActionDropdown';
import usePermissionChecks from '@/hooks/usePermissionChecks';
import { useUser } from '@/hooks/useAuth';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { cn } from '@/utils/utils';
import type { PTAvailabilityRequestCardProps } from '@/types/api/PTAvailabilityRequest';

const PTAvailabilityRequestCard: React.FC<PTAvailabilityRequestCardProps> = ({
  request,
  onEdit,
  onDelete,
  onView,
  onApprove,
  onReject,
  showActions = true,
  userRole,
  currentUserId
}) => {
  const { t } = useTranslation();
  const user = useUser();
  const { currentStaff } = useCurrentUserStaff();

  // Get user role from props or from user hook
  const currentUserRole = userRole || user?.role;

  // Use permission checks hook
  const permissions = usePermissionChecks({
    userRole: currentUserRole,
    currentUserId: currentUserId,
    requesterId: request.staffId._id,
    status: request.status,
    isFinalStatus: request.status === 'REJECTED' || request.status === 'APPROVED'
  });

  // Action handlers
  const handleEdit = () => onEdit?.(request._id);
  const handleDelete = () => onDelete?.(request._id);
  const handleView = () => onView?.(request._id);
  const handleApprove = () => onApprove?.(request._id);
  const handleReject = () => onReject?.(request._id, '');

  // Hide approve/reject for PT (STAFF role with Personal Trainer jobTitle) - only Owner/Manager can approve/reject
  const isPT =
    (currentUserRole === 'STAFF' || currentUserRole === 'staff') && currentStaff?.jobTitle === 'Personal Trainer';

  // Check if user is Manager (STAFF with jobTitle "Manager") or Owner
  const isManager =
    currentUserRole === 'OWNER' ||
    currentUserRole === 'owner' ||
    (currentUserRole === 'STAFF' && currentStaff?.jobTitle === 'Manager');

  // Check if user is the requester
  const isRequester = (() => {
    if (typeof request.staffId === 'string') {
      return false; // Can't check if not populated
    }
    if (request.staffId?.userId) {
      if (typeof request.staffId.userId === 'object') {
        return request.staffId.userId._id === currentUserId;
      }
      return request.staffId.userId === currentUserId;
    }
    return false;
  })();

  // Delete permission: Owner, Manager, or requester (PT) can delete
  // PT can only delete their own requests, Manager/Owner can delete any request
  const canDelete = isManager || isRequester;

  // Create action items
  const actionItems = createActionItems({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: canDelete ? handleDelete : undefined,
    onApprove: handleApprove,
    onReject: handleReject,
    canEdit: false, // PT availability requests cannot be edited after creation
    canApprove: !isPT && permissions.canApprovePTAvailability, // Hide for PT, show for Owner/Manager
    canReject: !isPT && permissions.canRejectPTAvailability, // Hide for PT, show for Owner/Manager
    canCancel: false,
    t
  });

  const getStatusIcon = () => {
    switch (request.status) {
      case 'APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'PENDING_APPROVAL':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  return (
    <Card
      className={cn(
        'hover:shadow-lg transition-all duration-200 overflow-hidden border-2',
        request.status === 'PENDING_APPROVAL' && 'border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/50',
        request.status === 'APPROVED' && 'border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50',
        request.status === 'REJECTED' && 'border-red-200 bg-gradient-to-br from-red-50/50 to-rose-50/50'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-orange-200">
              <AvatarImage
                src={
                  request.staffId.userId?.email
                    ? `https://ui-avatars.com/api/?name=${request.staffId.userId?.fullName || 'Unknown'}&background=orange&color=fff`
                    : undefined
                }
                alt={request.staffId.userId?.fullName || 'Unknown'}
              />
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white text-sm font-bold">
                {(request.staffId.userId?.fullName || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 text-base truncate flex items-center gap-2">
                {request.staffId.userId?.fullName || 'Unknown'}
                {getStatusIcon()}
              </h3>
              <p className="text-xs text-gray-600 truncate mt-1">{request.staffId.jobTitle}</p>
            </div>
            {showActions && <ActionDropdown actions={actionItems} />}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                request.status === 'PENDING_APPROVAL' && 'bg-amber-50 text-amber-700 border-amber-300',
                request.status === 'APPROVED' && 'bg-green-50 text-green-700 border-green-300',
                request.status === 'REJECTED' && 'bg-red-50 text-red-700 border-red-300'
              )}
            >
              {request.status === 'PENDING_APPROVAL' && t('pt_availability.status.pending', 'Chờ Duyệt')}
              {request.status === 'APPROVED' && t('pt_availability.status.approved', 'Đã Duyệt')}
              {request.status === 'REJECTED' && t('pt_availability.status.rejected', 'Đã Từ Chối')}
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
              {request.slots.length} {t('pt_availability.slots', 'Khung giờ')}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Branch Information */}
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
          <span className="font-medium truncate">{request.branchId?.branchName || t('common.unknown', 'Unknown')}</span>
        </div>

        {/* Slots Preview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Clock className="h-4 w-4 text-orange-500" />
            {t('pt_availability.time_slots', 'Time Slots')}:
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
            {request.slots.map((slot, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs bg-white/60 rounded-lg p-2 border border-gray-200"
              >
                <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-700">{formatDate(slot.date)}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">
                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                </span>
                {slot.maxCapacity > 1 && (
                  <Badge variant="outline" className="ml-auto text-xs bg-blue-50 text-blue-700 border-blue-300">
                    {slot.maxCapacity} {t('pt_availability.capacity', 'người')}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Service Contracts */}
        {request.serviceContractIds && request.serviceContractIds.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User className="h-4 w-4 text-orange-500 flex-shrink-0" />
            <span className="font-medium">
              {request.serviceContractIds.length} {t('pt_availability.service_contracts', 'Hợp đồng dịch vụ')}
            </span>
          </div>
        )}

        {/* Notes */}
        {request.notes && (
          <div className="text-sm text-gray-600 bg-white/60 rounded-lg p-2 border border-gray-200">
            <span className="font-medium">{t('pt_availability.notes', 'Ghi Chú')}:</span>
            <p className="mt-1 text-gray-700 line-clamp-2 break-words">{request.notes}</p>
          </div>
        )}

        {/* Approved/Rejected Info */}
        {request.approvedBy && (
          <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t border-gray-200">
            <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="font-medium">{t('pt_availability.approved_by', 'Được duyệt bởi')}:</span>
            <span className="truncate">{request.approvedBy.fullName || 'Unknown'}</span>
            {request.approvedAt && (
              <span className="text-gray-500 text-xs ml-auto">
                {new Date(request.approvedAt).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>
        )}

        {request.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2">
            <div className="flex items-start gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-medium text-red-800">
                  {t('pt_availability.rejection_reason', 'Lý do từ chối')}:
                </span>
                <p className="mt-1 text-red-700 break-words">{request.rejectionReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Created Date */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
          {t('common.created_at', 'Tạo lúc')}: {new Date(request.createdAt).toLocaleString('vi-VN')}
        </div>
      </CardContent>
    </Card>
  );
};

export default PTAvailabilityRequestCard;
