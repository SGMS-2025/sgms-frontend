import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import TypeBadge from '@/components/common/TypeBadge';
import ActionDropdown, { createActionItems } from '@/components/common/ActionDropdown';
import usePermissionChecks from '@/hooks/usePermissionChecks';
import type { TimeOffCardProps } from '@/types/api/TimeOff';

// Helper functions moved to shared utilities

const TimeOffCard: React.FC<TimeOffCardProps> = ({
  timeOff,
  onEdit,
  onDelete,
  onView,
  onApprove,
  onReject,
  onCancel,
  showActions = true
}) => {
  const { t } = useTranslation();

  // Use permission checks hook
  const permissions = usePermissionChecks({
    userRole: undefined, // TimeOff doesn't use role-based permissions
    currentUserId: undefined,
    requesterId: timeOff.staffId,
    status: timeOff.status,
    isFinalStatus: timeOff.status === 'REJECTED' || timeOff.status === 'CANCELLED'
  });

  // Action handlers
  const handleEdit = () => onEdit?.(timeOff._id);
  const handleDelete = () => onDelete?.(timeOff._id);
  const handleView = () => onView?.(timeOff._id);
  const handleApprove = () => onApprove?.(timeOff._id);
  const handleReject = () => onReject?.(timeOff._id);
  const handleCancel = () => onCancel?.(timeOff._id);

  // Create action items
  const actionItems = createActionItems({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onApprove: handleApprove,
    onReject: handleReject,
    onCancel: handleCancel,
    canEdit: permissions.canEditTimeOff,
    canApprove: permissions.canApproveTimeOff,
    canReject: permissions.canRejectTimeOff,
    canCancel: permissions.canCancelTimeOff,
    t
  });

  // Helper functions moved to shared utilities

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={
                  timeOff.staffId.userId?.email
                    ? `https://ui-avatars.com/api/?name=${timeOff.staffId.userId?.fullName || 'Unknown'}&background=orange&color=fff`
                    : undefined
                }
                alt={timeOff.staffId.userId?.fullName || 'Unknown'}
              />
              <AvatarFallback className="bg-orange-500 text-white text-sm font-medium">
                {(timeOff.staffId.userId?.fullName || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{timeOff.staffId.userId?.fullName || 'Unknown'}</h3>
              <p className="text-xs text-gray-500">{timeOff.staffId.jobTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TypeBadge type={timeOff.type} badgeType="timeoff" t={t} />
            <StatusBadge status={timeOff.status} type="timeoff" t={t} />
            {showActions && <ActionDropdown actions={actionItems} />}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Type and Duration */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{t(`timeoff.type.${timeOff.type.toLowerCase()}`)}</span>
            </div>
            <div className="text-xs text-gray-500">
              {timeOff.duration} {timeOff.duration === 1 ? t('timeoff.day') : t('timeoff.days')}
            </div>
          </div>

          {/* Branch Information */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{timeOff.branchId?.branchName || t('common.unknown')}</span>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="font-medium">
              {timeOff.startDateFmt} - {timeOff.endDateFmt}
            </span>
          </div>

          {/* Reason */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">{t('timeoff.reason')}:</span>
            <p className="mt-1 text-gray-700 line-clamp-2">{timeOff.reason}</p>
          </div>

          {/* Approved By */}
          {timeOff.approvedBy && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{t('timeoff.approved_by')}:</span>
              <span>{timeOff.approvedBy.userId?.fullName || 'Unknown'}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeOffCard;
