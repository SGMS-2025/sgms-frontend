import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, MapPin, User, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/utils/utils';
import type { TimeOffApprovalModalProps, TimeOffStatus, TimeOffType } from '@/types/api/TimeOff';

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

const getStatusIcon = (status: TimeOffStatus) => {
  switch (status) {
    case 'PENDING':
      return <AlertCircle className="h-4 w-4" />;
    case 'APPROVED':
      return <CheckCircle className="h-4 w-4" />;
    case 'REJECTED':
      return <XCircle className="h-4 w-4" />;
    case 'CANCELLED':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
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

const TimeOffApprovalModal: React.FC<TimeOffApprovalModalProps> = ({
  isOpen,
  onClose,
  timeOff,
  onApprove,
  onReject
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  if (!timeOff) {
    return null;
  }

  const handleApprove = async () => {
    if (!onApprove) return;

    setLoading(true);
    setAction('approve');

    await onApprove(timeOff);
    onClose();
    setLoading(false);
    setAction(null);
  };

  const handleReject = async () => {
    if (!onReject) return;

    setLoading(true);
    setAction('reject');

    await onReject(timeOff);
    onClose();
    setLoading(false);
    setAction(null);
  };

  const canApprove = timeOff.status === 'PENDING';
  const canReject = timeOff.status === 'PENDING';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">{t('timeoff.approval_request')}</DialogTitle>
            <Badge variant="outline" className={cn('text-xs font-medium', getStatusColor(timeOff.status))}>
              {getStatusIcon(timeOff.status)}
              <span className="ml-1">{getStatusText(timeOff.status, t)}</span>
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Staff Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('timeoff.staff_information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={
                      timeOff.staffId.userId?.email
                        ? `https://ui-avatars.com/api/?name=${timeOff.staffId.userId?.fullName || 'Unknown'}&background=orange&color=fff`
                        : undefined
                    }
                    alt={timeOff.staffId.userId?.fullName || 'Unknown'}
                  />
                  <AvatarFallback className="bg-orange-500 text-white text-lg font-medium">
                    {(timeOff.staffId.userId?.fullName || 'U').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">{timeOff.staffId.userId?.fullName || 'Unknown'}</h3>
                  <p className="text-sm text-gray-600">{timeOff.staffId.jobTitle}</p>
                  <p className="text-xs text-gray-500">{timeOff.staffId.userId.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('timeoff.request_information')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">{t('timeoff.type')}</label>
                  <p className="text-sm font-medium">{getTypeText(timeOff.type, t)}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">{t('timeoff.duration')}</label>
                  <p className="text-sm font-medium">
                    {timeOff.duration} {timeOff.duration === 1 ? t('timeoff.day') : t('timeoff.days')}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">{t('timeoff.date_range')}</label>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">
                    {timeOff.startDateFmt} - {timeOff.endDateFmt}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">{t('timeoff.branch')}</label>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{timeOff.branchId?.branchName || t('common.unknown')}</span>
                </div>
                <p className="text-xs text-gray-500 ml-6">{timeOff.branchId?.location || t('common.unknown')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Reason */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('timeoff.reason')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{timeOff.reason}</p>
            </CardContent>
          </Card>

          {/* Approval Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {t('timeoff.approval_actions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">{t('timeoff.approval_description')}</p>

                <div className="flex gap-4">
                  {canApprove && (
                    <Button
                      onClick={handleApprove}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {loading && action === 'approve' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {t('timeoff.approve')}
                    </Button>
                  )}

                  {canReject && (
                    <Button
                      variant="outline"
                      onClick={handleReject}
                      disabled={loading}
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {loading && action === 'reject' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      {t('timeoff.reject')}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeOffApprovalModal;
