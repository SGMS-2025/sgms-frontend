import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Calendar,
  Clock,
  User,
  MapPin,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useMyRescheduleRequests } from '@/hooks/useReschedule';
import CreateRescheduleModal from './CreateRescheduleModal';
import RescheduleRequestDetailModal from './RescheduleRequestDetailModal';
import type { WorkShift } from '@/types/api/WorkShift';
import type { RescheduleRequest, RescheduleState } from '@/types/api/Reschedule';
import type { BaseComponentProps } from '@/types/components/ComponentTypes';

interface RescheduleTabProps extends BaseComponentProps {
  workShift: WorkShift;
  onClose?: () => void;
}

const RescheduleTab: React.FC<RescheduleTabProps> = ({ workShift }) => {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RescheduleRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch reschedule requests for this work shift
  const { data: requests, loading, error, refetch } = useMyRescheduleRequests();

  // Get reschedule requests for this work shift
  const getRescheduleForShift = () => {
    return requests.filter(
      (request) => request.originalShiftId === workShift._id || request.targetShiftId === workShift._id
    );
  };

  const rescheduleRequests = getRescheduleForShift();

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    refetch();
  };

  const handleViewDetail = (request: RescheduleRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const getStatusIcon = (status: RescheduleState) => {
    switch (status) {
      case 'PENDING_BROADCAST':
      case 'PENDING_ACCEPTANCE':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'PENDING_APPROVAL':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'APPROVED':
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REJECTED':
      case 'CANCELLED':
      case 'EXPIRED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: RescheduleState) => {
    switch (status) {
      case 'PENDING_BROADCAST':
      case 'PENDING_ACCEPTANCE':
        return 'secondary';
      case 'PENDING_APPROVAL':
        return 'default';
      case 'APPROVED':
      case 'COMPLETED':
        return 'default';
      case 'REJECTED':
      case 'CANCELLED':
      case 'EXPIRED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('reschedule.requests')}</h3>
          <p className="text-sm text-gray-600">{t('reschedule.manage_requests_for_shift')}</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('reschedule.create_request')}
        </Button>
      </div>

      {/* Work Shift Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('reschedule.current_shift')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{workShift.staffId?.userId?.fullName || t('common.unknown')}</span>
              <span className="text-gray-600">({workShift.staffId?.jobTitle || t('common.staff')})</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>
                {workShift.startTimeLocal || '08:00'} - {workShift.endTimeLocal || '17:00'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>
                {typeof workShift.branchId === 'string'
                  ? t('common.branch')
                  : workShift.branchId?.branchName || t('common.branch')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-gray-400 mx-auto mb-3 animate-spin" />
              <p className="text-sm text-gray-600">{t('common.loading')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <XCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
              <p className="text-sm text-red-600">{error}</p>
              <Button size="sm" variant="outline" onClick={() => refetch()} className="mt-2">
                {t('common.retry')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reschedule Requests List */}
      {!loading && !error && rescheduleRequests.length > 0 && (
        <div className="space-y-3">
          {rescheduleRequests.map((request) => (
            <Card
              key={request._id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewDetail(request)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {t(`reschedule.types.${request.swapType.toLowerCase()}`)}
                        </span>
                        <Badge variant={getStatusBadgeVariant(request.status)}>
                          {t(`reschedule.states.${request.status.toLowerCase()}`)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {t('reschedule.created_at')}: {formatDate(request.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{t(`reschedule.priorities.${request.priority.toLowerCase()}`)}</Badge>
                    {request.expiresAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {t('reschedule.expires_at')}: {formatDate(request.expiresAt)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && rescheduleRequests.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <ArrowRightLeft className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <h4 className="text-sm font-medium text-gray-900 mb-1">{t('reschedule.no_requests')}</h4>
              <p className="text-xs text-gray-600 mb-4">{t('reschedule.no_requests_description')}</p>
              <Button
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('reschedule.create_first_request')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Reschedule Modal */}
      {showCreateModal && (
        <CreateRescheduleModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          workShiftId={workShift._id}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Reschedule Detail Modal */}
      {showDetailModal && selectedRequest && (
        <RescheduleRequestDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
        />
      )}
    </div>
  );
};

export default RescheduleTab;
