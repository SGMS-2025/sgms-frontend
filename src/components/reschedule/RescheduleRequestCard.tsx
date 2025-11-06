import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, MapPin, ArrowRightLeft, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/utils';
import StatusBadge from '@/components/common/StatusBadge';
import TypeBadge from '@/components/common/TypeBadge';
import ActionDropdown, { createActionItems } from '@/components/common/ActionDropdown';
import usePermissionChecks from '@/hooks/usePermissionChecks';
import { getPriorityColor } from '@/utils/typeHelpers';
import type { RescheduleRequestCardProps } from '@/types/api/Reschedule';

interface ShiftTimeData {
  startTime?: string;
  endTime?: string;
}

// Helper functions moved to shared utilities
const getPriorityText = (priority: string, t: (key: string) => string) => {
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

const RescheduleRequestCard: React.FC<RescheduleRequestCardProps> = ({
  request,
  onEdit,
  onDelete,
  onView,
  onApprove,
  onReject,
  onCancel,
  showActions = true,
  userRole,
  currentUserId
}) => {
  const { t } = useTranslation();

  // Use permission checks hook
  const isOwnerOrManager =
    userRole === 'OWNER' || userRole === 'owner' || userRole === 'MANAGER' || userRole === 'manager';
  const isFinalStatus =
    request.status === 'REJECTED' ||
    ((request.status === 'COMPLETED' || request.status === 'APPROVED') && !isOwnerOrManager);

  const permissions = usePermissionChecks({
    userRole,
    currentUserId,
    requesterId: request.requesterStaffId,
    status: request.status,
    isFinalStatus
  });

  // Action handlers
  const handleEdit = () => onEdit?.(request._id);
  const handleDelete = () => onDelete?.(request._id);
  const handleView = () => onView?.(request._id);
  const handleApprove = () => onApprove?.(request._id);
  const handleReject = () => onReject?.(request._id, '');
  const handleCancel = () => onCancel?.(request._id);

  // Create action items
  const actionItems = createActionItems({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onApprove: handleApprove,
    onReject: handleReject,
    onCancel: handleCancel,
    canEdit: permissions.canEditReschedule,
    canApprove: permissions.canApproveReschedule,
    canReject: permissions.canRejectReschedule,
    canCancel: permissions.canCancelReschedule,
    t
  });

  // Get requester info
  const requester = typeof request.requesterStaffId === 'string' ? null : request.requesterStaffId;

  const targetStaff = typeof request.targetStaffId === 'string' ? null : request.targetStaffId;

  const originalShift = typeof request.originalShiftId === 'string' ? null : request.originalShiftId;

  const targetShift = typeof request.targetShiftId === 'string' ? null : request.targetShiftId;

  const branch = typeof request.branchId === 'string' ? null : request.branchId;

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

  // Format time fallback if formatted fields are missing
  const formatTimeLocal = (iso: string | undefined) => {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 min-w-0">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage
                src={
                  requester?.userId?.email
                    ? `https://ui-avatars.com/api/?name=${requester.userId?.fullName || 'Unknown'}&background=orange&color=fff`
                    : undefined
                }
                alt={requester?.userId?.fullName || 'Unknown'}
              />
              <AvatarFallback className="bg-orange-500 text-white text-sm font-medium">
                {requester?.userId?.fullName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {requester?.userId?.fullName || t('common.unknown')}
              </h3>
              <p className="text-xs text-gray-500 truncate">{requester?.jobTitle || t('common.staff')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={cn('text-xs', getPriorityColor(request.priority))}>
              {getPriorityText(request.priority, t)}
            </Badge>
            <StatusBadge status={request.status} type="reschedule" t={t} />
            {showActions && <ActionDropdown actions={actionItems} />}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3 min-w-0">
          {/* Swap Type */}
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
              <TypeBadge type={request.swapType} badgeType="reschedule" t={t} showIcon={true} />
            </div>
          </div>

          {/* Original Shift */}
          <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="font-medium flex-shrink-0">{t('reschedule.original_shift')}:</span>
            <span className="truncate">
              {(() => {
                if (!originalShift) return t('common.not_available');
                if (originalShift.startTimeFmt && originalShift.endTimeFmt) {
                  return `${originalShift.startTimeFmt} - ${originalShift.endTimeFmt}`;
                }
                return `${formatTimeLocal((originalShift as ShiftTimeData).startTime)} - ${formatTimeLocal((originalShift as ShiftTimeData).endTime)}`;
              })()}
            </span>
          </div>

          {/* Target Shift (if exists) */}
          {targetShift && (
            <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
              <ArrowRightLeft className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="font-medium flex-shrink-0">{t('reschedule.target_shift')}:</span>
              <span className="truncate">
                {targetShift.startTimeFmt} - {targetShift.endTimeFmt}
              </span>
            </div>
          )}

          {/* Target Staff (if exists) */}
          {targetStaff && (
            <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="font-medium flex-shrink-0">{t('reschedule.target_staff')}:</span>
              <span className="truncate">{targetStaff.userId?.fullName || 'Unknown'}</span>
            </div>
          )}

          {/* Branch Information */}
          <div className="flex items-start gap-2 text-sm text-gray-600 min-w-0">
            <MapPin className="h-4 w-4 text-gray-400 mt-[2px] flex-shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="font-medium break-words">
                {t('common.branch')}: <span className="font-medium">{branch?.branchName || t('common.branch')}</span>
              </div>

              {branch?.location && <span className="text-gray-500 break-words">{branch.location}</span>}
            </div>
          </div>

          {/* Expiry Time */}
          <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
            <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="font-medium flex-shrink-0">{t('reschedule.expires')}:</span>
            <span className={cn('truncate', request.isExpired ? 'text-red-600' : 'text-gray-700')}>
              {formatExpiryTime(request.expiresAt)}
            </span>
          </div>

          {/* Reason */}
          <div className="text-sm text-gray-600 min-w-0">
            <span className="font-medium">{t('reschedule.reason')}:</span>
            <p
              className="mt-1 text-gray-700 break-words line-clamp-2"
              style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
            >
              {request.reason}
            </p>
          </div>

          {/* Rejection Reason */}
          {request.rejectionReason && (
            <div className="text-sm text-red-600 min-w-0">
              <span className="font-medium">{t('reschedule.rejection_reason')}:</span>
              <p
                className="mt-1 break-words line-clamp-2"
                style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
              >
                {request.rejectionReason}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RescheduleRequestCard;
