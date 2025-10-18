import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Clock,
  MapPin,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  MoreHorizontal,
  ArrowRightLeft,
  UserPlus,
  Timer,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/utils/utils';
import type {
  RescheduleRequestCardProps,
  RescheduleState,
  RescheduleType,
  ReschedulePriority
} from '@/types/api/Reschedule';

interface ShiftTimeData {
  startTime?: string;
  endTime?: string;
}

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

const RescheduleRequestCard: React.FC<RescheduleRequestCardProps> = ({
  request,
  onEdit,
  onDelete,
  onView,
  onAccept,
  onApprove,
  onReject,
  onCancel,
  showActions = true,
  userRole,
  currentUserId
}) => {
  const { t } = useTranslation();

  const handleEdit = () => {
    if (onEdit) {
      onEdit(request._id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(request._id);
    }
  };

  const handleView = () => {
    if (onView) {
      onView(request._id);
    }
  };

  const handleAccept = () => {
    if (onAccept) {
      onAccept(request._id);
    }
  };

  const handleApprove = () => {
    if (onApprove) {
      onApprove(request._id);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(request._id, '');
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel(request._id);
    }
  };

  // Permission checks
  // Chỉ cho phép xem nếu status đã hoàn thành hoặc bị từ chối
  const isFinalStatus = request.status === 'COMPLETED' || request.status === 'REJECTED';

  const canEdit =
    !isFinalStatus &&
    request.status === 'PENDING_BROADCAST' &&
    (typeof request.requesterStaffId === 'string'
      ? request.requesterStaffId === currentUserId
      : request.requesterStaffId._id === currentUserId);

  const canAccept =
    !isFinalStatus &&
    request.status === 'PENDING_BROADCAST' &&
    (typeof request.requesterStaffId === 'string'
      ? request.requesterStaffId !== currentUserId
      : request.requesterStaffId._id !== currentUserId);

  const canApprove =
    !isFinalStatus && request.status === 'PENDING_APPROVAL' && (userRole === 'MANAGER' || userRole === 'OWNER');

  const canReject =
    !isFinalStatus && request.status === 'PENDING_APPROVAL' && (userRole === 'MANAGER' || userRole === 'OWNER');

  const canCancel =
    !isFinalStatus &&
    (request.status === 'PENDING_BROADCAST' || request.status === 'PENDING_ACCEPTANCE') &&
    (typeof request.requesterStaffId === 'string'
      ? request.requesterStaffId === currentUserId
      : request.requesterStaffId._id === currentUserId);

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
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
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
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                {requester?.userId?.fullName || t('common.unknown')}
              </h3>
              <p className="text-xs text-gray-500">{requester?.jobTitle || t('common.staff')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs', getPriorityColor(request.priority))}>{request.priority}</Badge>
            <Badge className={cn('text-xs', getStatusColor(request.status))}>
              {getStatusIcon(request.status)}
              <span className="ml-1">{getStatusText(request.status, t)}</span>
            </Badge>
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-orange-200 hover:text-orange-500 flex-shrink-0"
                    title={t('common.more_actions')}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onView && (
                    <DropdownMenuItem onClick={handleView} className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      {t('common.view')}
                    </DropdownMenuItem>
                  )}
                  {onEdit && canEdit && (
                    <DropdownMenuItem onClick={handleEdit} className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      {t('common.edit')}
                    </DropdownMenuItem>
                  )}
                  {onAccept && canAccept && (
                    <DropdownMenuItem onClick={handleAccept} className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {t('reschedule.accept')}
                    </DropdownMenuItem>
                  )}
                  {onApprove && canApprove && (
                    <DropdownMenuItem onClick={handleApprove} className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {t('reschedule.approve')}
                    </DropdownMenuItem>
                  )}
                  {onReject && canReject && (
                    <DropdownMenuItem onClick={handleReject} className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      {t('reschedule.reject')}
                    </DropdownMenuItem>
                  )}
                  {onCancel && canCancel && (
                    <DropdownMenuItem onClick={handleCancel} className="flex items-center gap-2 text-orange-600">
                      <AlertCircle className="h-4 w-4" />
                      {t('reschedule.cancel')}
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onClick={handleDelete} className="flex items-center gap-2 text-red-600">
                      <Trash2 className="h-4 w-4" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Swap Type */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {getTypeIcon(request.swapType)}
              <span className="font-medium">{getTypeText(request.swapType, t)}</span>
            </div>
          </div>

          {/* Original Shift */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{t('reschedule.original_shift')}:</span>
            <span>
              {originalShift
                ? originalShift.startTimeFmt && originalShift.endTimeFmt
                  ? `${originalShift.startTimeFmt} - ${originalShift.endTimeFmt}`
                  : `${formatTimeLocal((originalShift as ShiftTimeData).startTime)} - ${formatTimeLocal((originalShift as ShiftTimeData).endTime)}`
                : t('common.not_available')}
            </span>
          </div>

          {/* Target Shift (if exists) */}
          {targetShift && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ArrowRightLeft className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{t('reschedule.target_shift')}:</span>
              <span>
                {targetShift.startTimeFmt} - {targetShift.endTimeFmt}
              </span>
            </div>
          )}

          {/* Target Staff (if exists) */}
          {targetStaff && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{t('reschedule.target_staff')}:</span>
              <span>{targetStaff.userId?.fullName || 'Unknown'}</span>
            </div>
          )}

          {/* Branch Information */}
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400 mt-[2px]" />
            <div className="flex flex-col">
              <span className="font-medium">
                {t('common.branch')}: <span className="font-medium">{branch?.branchName || t('common.branch')}</span>
              </span>

              {branch?.location && <span className="text-gray-500">{branch.location}</span>}
            </div>
          </div>

          {/* Expiry Time */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{t('reschedule.expires')}:</span>
            <span className={request.isExpired ? 'text-red-600' : 'text-gray-700'}>
              {formatExpiryTime(request.expiresAt)}
            </span>
          </div>

          {/* Reason */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">{t('reschedule.reason')}:</span>
            <p className="mt-1 text-gray-700 line-clamp-2">{request.reason}</p>
          </div>

          {/* Rejection Reason */}
          {request.rejectionReason && (
            <div className="text-sm text-red-600">
              <span className="font-medium">{t('reschedule.rejection_reason')}:</span>
              <p className="mt-1 line-clamp-2">{request.rejectionReason}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RescheduleRequestCard;
