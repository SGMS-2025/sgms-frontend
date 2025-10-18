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
  MoreHorizontal
} from 'lucide-react';
import type { TimeOffCardProps, TimeOffStatus, TimeOffType } from '@/types/api/TimeOff';

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

  const handleEdit = () => {
    if (onEdit) {
      onEdit(timeOff._id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(timeOff._id);
    }
  };

  const handleView = () => {
    if (onView) {
      onView(timeOff._id);
    }
  };

  const handleApprove = () => {
    if (onApprove) {
      onApprove(timeOff._id);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(timeOff._id);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel(timeOff._id);
    }
  };

  const canEdit = timeOff.status === 'PENDING';
  const canApprove = timeOff.status === 'PENDING';
  const canReject = timeOff.status === 'PENDING';
  const canCancel = timeOff.status === 'PENDING' || timeOff.status === 'APPROVED';

  // Get status badge
  const getStatusBadge = (status: TimeOffStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('timeoff.status.approved')}
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            {t('timeoff.status.pending')}
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            {t('timeoff.status.rejected')}
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <XCircle className="h-3 w-3 mr-1" />
            {t('timeoff.status.cancelled')}
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get type badge
  const getTypeBadge = (type: TimeOffType) => {
    const colors = {
      VACATION: 'bg-blue-100 text-blue-800',
      SICK_LEAVE: 'bg-red-100 text-red-800',
      PERSONAL_LEAVE: 'bg-purple-100 text-purple-800',
      UNPAID_LEAVE: 'bg-gray-100 text-gray-800',
      EMERGENCY: 'bg-orange-100 text-orange-800',
      OTHER: 'bg-teal-100 text-teal-800'
    };

    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>{t(`timeoff.type.${type.toLowerCase()}`)}</Badge>
    );
  };

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
            {getTypeBadge(timeOff.type)}
            {getStatusBadge(timeOff.status)}
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
                  {onApprove && canApprove && (
                    <DropdownMenuItem onClick={handleApprove} className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {t('timeoff.approve')}
                    </DropdownMenuItem>
                  )}
                  {onReject && canReject && (
                    <DropdownMenuItem onClick={handleReject} className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      {t('timeoff.reject')}
                    </DropdownMenuItem>
                  )}
                  {onCancel && canCancel && (
                    <DropdownMenuItem onClick={handleCancel} className="flex items-center gap-2 text-orange-600">
                      <AlertCircle className="h-4 w-4" />
                      {t('timeoff.cancel')}
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
          {/* Type and Duration */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{getTypeText(timeOff.type, t)}</span>
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
