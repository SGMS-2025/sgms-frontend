import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Calendar,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  ChevronUp,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { cn } from '@/utils/utils';
import type { TimeOffDetailSheetProps, TimeOffStatus, TimeOffType, TimeOff } from '@/types/api/TimeOff';
import { timeOffApi } from '@/services/api/timeOffApi';
import usePermissionChecks from '@/hooks/usePermissionChecks';
import { useUser } from '@/hooks/useAuth';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';

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

const getTypeColor = (type: TimeOffType) => {
  switch (type) {
    case 'VACATION':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'SICK_LEAVE':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'PERSONAL_LEAVE':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'UNPAID_LEAVE':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'EMERGENCY':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'OTHER':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
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

const TimeOffDetailSheet: React.FC<TimeOffDetailSheetProps> = ({
  isOpen,
  onClose,
  timeOff,
  onApprove,
  onReject,
  onCancel,
  onDelete
}) => {
  const { t } = useTranslation();
  const user = useUser();
  const { currentStaff } = useCurrentUserStaff();
  const [showHistory, setShowHistory] = React.useState(false);
  const [historyData, setHistoryData] = React.useState<TimeOff[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);

  // Đảm bảo hooks luôn được gọi với cùng thứ tự mỗi lần render
  const permissions = usePermissionChecks({
    userRole: user?.role,
    currentUserId: user?._id,
    requesterId: timeOff?.staffId, // Safe optional chaining
    status: timeOff?.status || 'PENDING', // Default value để tránh undefined
    isFinalStatus: timeOff?.status === 'REJECTED' || timeOff?.status === 'CANCELLED'
  });

  // Fetch history when showing history section
  React.useEffect(() => {
    const fetchHistory = async () => {
      if (showHistory && timeOff?.staffId?._id) {
        setLoadingHistory(true);
        try {
          const response = await timeOffApi.getTimeOffsByStaff(timeOff.staffId._id, {
            page: 1,
            limit: 10,
            sortBy: 'startDate',
            sortOrder: 'desc'
          });

          if (response.data?.data) {
            // Filter out current timeoff request
            const history = response.data.data.filter((item) => item._id !== timeOff._id);
            setHistoryData(history);
          }
        } catch (error) {
          console.error('Failed to fetch timeoff history:', error);
          setHistoryData([]);
        } finally {
          setLoadingHistory(false);
        }
      }
    };

    fetchHistory();
  }, [showHistory, timeOff?.staffId?._id, timeOff?._id]);

  if (!timeOff) {
    return null;
  }

  // Owner có role 'OWNER', Manager có jobTitle 'Manager' (có thể có role 'STAFF')
  const isOwner = user?.role === 'OWNER';
  const isManagerByJobTitle = currentStaff?.jobTitle === 'Manager';
  const isManager = isOwner || isManagerByJobTitle;

  const canApprove = (permissions.canApproveTimeOff || isManager) && timeOff.status === 'PENDING';
  const canReject = (permissions.canRejectTimeOff || isManager) && timeOff.status === 'PENDING';
  const canCancel = permissions.canCancelTimeOff;
  const canDelete = permissions.canDelete;

  const handleApprove = () => {
    if (onApprove) {
      onApprove(timeOff);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(timeOff);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel(timeOff);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(timeOff);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[450px] max-w-none sm:max-w-none overflow-y-auto p-0">
        <div className="p-6">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-semibold text-gray-900">{t('timeoff.request_details')}</SheetTitle>
          </SheetHeader>

          <div className="space-y-8">
            {/* Staff Information */}
            <div className="space-y-4">
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
                  <AvatarFallback className="bg-orange-500 text-white text-sm font-medium">
                    {timeOff.staffId?.userId?.fullName?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-base">
                    {timeOff.staffId?.userId?.fullName || 'Unknown Staff'}
                  </h3>
                  <p className="text-sm text-gray-600">{timeOff.staffId?.jobTitle || 'Unknown Role'}</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="flex gap-3">
                {timeOff.staffId?.userId?.email && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-1">
                    <Mail className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-700 flex-1">{timeOff.staffId.userId.email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-200"
                      onClick={() => copyToClipboard(timeOff.staffId?.userId?.email || '')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-1">
                  <Phone className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-700 flex-1">(704) 555-0127</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-200"
                    onClick={() => copyToClipboard('(704) 555-0127')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Current Request Details */}
            <div className="space-y-4">
              {/* Date and Type Row */}
              <div className="flex gap-4">
                <div className="flex-1 bg-gray-50 rounded-lg p-4 space-y-2">
                  <span className="text-sm font-medium text-gray-500">{t('timeoff.date')}</span>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {timeOff.startDateFmt || new Date(timeOff.startDate).toLocaleDateString()} →{' '}
                      {timeOff.endDateFmt || new Date(timeOff.endDate).toLocaleDateString()}
                    </span>
                    <span className="text-gray-500">
                      ({timeOff.duration || 0} {timeOff.duration === 1 ? t('timeoff.day') : t('timeoff.days')})
                    </span>
                  </div>
                </div>

                <div className="flex-1 bg-gray-50 rounded-lg p-4 space-y-2">
                  <span className="text-sm font-medium text-gray-500">{t('timeoff.type')}</span>
                  <div className="inline-flex items-center">
                    <Badge
                      variant="outline"
                      className={cn('text-sm font-medium px-3 py-1', getTypeColor(timeOff.type))}
                    >
                      {getTypeText(timeOff.type, t)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-500">{t('timeoff.notes')}</span>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {timeOff.reason || t('timeoff.no_reason_provided')}
                </p>
              </div>

              {/* Attachments */}
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-500">{t('timeoff.attachments')}</span>
                <p className="text-sm text-gray-500">-</p>
              </div>
            </div>

            {/* History Section */}
            <div className="space-y-3">
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto hover:bg-transparent"
                onClick={() => setShowHistory(!showHistory)}
              >
                <span className="font-medium text-gray-500 text-sm">{t('timeoff.history')}</span>
                {showHistory ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </Button>

              {showHistory && (
                <div className="space-y-0 border-t border-gray-100">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">Loading history...</span>
                    </div>
                  ) : historyData.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-gray-500">{t('timeoff.no_history')}</p>
                    </div>
                  ) : (
                    historyData.map((historyItem, index) => (
                      <div
                        key={historyItem._id}
                        className={cn(
                          'flex items-center justify-between py-3',
                          index < historyData.length - 1 && 'border-b border-gray-100'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900">
                            {historyItem.startDateFmt ||
                              new Date(historyItem.startDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}{' '}
                            →{' '}
                            {historyItem.endDateFmt ||
                              new Date(historyItem.endDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                          </span>
                          <Badge variant="outline" className={cn('text-xs px-2 py-1', getTypeColor(historyItem.type))}>
                            {getTypeText(historyItem.type, t)}
                          </Badge>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn('text-xs px-2 py-1', getStatusColor(historyItem.status))}
                        >
                          {getStatusText(historyItem.status, t)}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 mt-6">
            {canReject && onReject && (
              <Button
                variant="outline"
                onClick={handleReject}
                className="flex-1 h-10 text-gray-700 hover:text-gray-800 hover:bg-gray-50 border-gray-200"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {t('timeoff.decline')}
              </Button>
            )}
            {canApprove && onApprove && (
              <Button onClick={handleApprove} className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('timeoff.approve')}
              </Button>
            )}
            {canCancel && !canApprove && !canReject && (
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1 h-10 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {t('timeoff.cancel')}
              </Button>
            )}
            {canDelete && !canApprove && !canReject && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="flex-1 h-10 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TimeOffDetailSheet;
