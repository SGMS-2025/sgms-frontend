import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, AlertCircle, Mail, Phone } from 'lucide-react';
import { cn } from '@/utils/utils';
import type { TimeOffDetailModalProps, TimeOffStatus, TimeOffType } from '@/types/api/TimeOff';
import usePermissionChecks from '@/hooks/usePermissionChecks';
import { useUser } from '@/hooks/useAuth';

const getStatusColor = (status: TimeOffStatus) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'APPROVED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'REJECTED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = () => {
  return <AlertCircle className="h-4 w-4" />;
};

const getStatusText = (status: TimeOffStatus, t: (key: string) => string) => {
  switch (status) {
    case 'PENDING':
      return t('timeoff.status.pending');
    case 'APPROVED':
      return t('timeoff.status.approved');
    case 'REJECTED':
      return t('timeoff.status.rejected');
    case 'CANCELLED':
      return t('timeoff.status.cancelled');
    default:
      return status;
  }
};

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

const TimeOffDetailModal: React.FC<TimeOffDetailModalProps> = ({ isOpen, onClose, timeOff, onCancel }) => {
  const { t } = useTranslation();
  const user = useUser();

  // Đảm bảo hooks luôn được gọi với cùng thứ tự mỗi lần render
  const permissions = usePermissionChecks({
    userRole: user?.role,
    currentUserId: user?._id,
    requesterId: timeOff?.staffId, // Safe optional chaining
    status: timeOff?.status || 'PENDING', // Default value để tránh undefined
    isFinalStatus: timeOff?.status === 'REJECTED' || timeOff?.status === 'CANCELLED'
  });

  if (!timeOff) {
    return null;
  }

  const canCancel = permissions.canCancelTimeOff;

  const handleCancel = () => {
    if (onCancel) {
      onCancel(timeOff);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">{t('timeoff.request_details')}</DialogTitle>
            <div className="flex items-center gap-4 pr-2">
              <Badge variant="outline" className={cn('text-xs font-medium', getStatusColor(timeOff.status))}>
                {getStatusIcon()}
                <span className="ml-1">{getStatusText(timeOff.status, t)}</span>
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Staff Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={
                    timeOff.staffId?.userId?.email
                      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(timeOff.staffId.userId?.fullName || 'Unknown')}&background=orange&color=fff`
                      : undefined
                  }
                  alt={timeOff.staffId?.userId?.fullName || 'Staff'}
                />
                <AvatarFallback className="bg-orange-500 text-white text-lg font-medium">
                  {timeOff.staffId?.userId?.fullName?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900 text-base">
                  {timeOff.staffId?.userId?.fullName || 'Unknown Staff'}
                </h3>
                <p className="text-sm text-gray-600">{timeOff.staffId?.jobTitle || 'Unknown Role'}</p>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-500">{timeOff.staffId?.userId?.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-500">Hotline: 1900-xxxx</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Request Information */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-6">
              {/* Date Range */}
              <div className="space-y-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</span>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">
                    {timeOff.startDateFmt || new Date(timeOff.startDate).toLocaleDateString()} →{' '}
                    {timeOff.endDateFmt || new Date(timeOff.endDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  ({timeOff.duration || 0} {timeOff.duration === 1 ? t('timeoff.day') : t('timeoff.days')})
                </p>
              </div>

              {/* Type */}
              <div className="space-y-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</span>
                <div className="inline-flex items-center">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1">
                    {getTypeText(timeOff.type, t) || timeOff.type || 'Unknown Type'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Reason */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</span>
            <p className="text-sm text-gray-700 leading-relaxed">{timeOff.reason || 'No reason provided'}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="text-gray-600">
              {t('common.close')}
            </Button>

            {onCancel && canCancel && (
              <Button
                variant="outline"
                onClick={handleCancel}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {t('timeoff.cancel')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeOffDetailModal;
