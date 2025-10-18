import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useTimeOffList, useTimeOffOperations } from '@/hooks/useTimeOff';
import { localDateStringYMD } from '@/utils/datetime';
import CreateTimeOffModal from './CreateTimeOffModal';
import TimeOffDetailModal from './TimeOffDetailModal';
import type { TimeOff, TimeOffStatus, TimeOffType } from '@/types/api/TimeOff';

interface TimeOffRequestTabProps {
  staffId: string;
  selectedDate: Date;
  onTimeOffCreated?: () => void;
}

const TimeOffRequestTab: React.FC<TimeOffRequestTabProps> = ({ staffId, selectedDate, onTimeOffCreated }) => {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTimeOff, setSelectedTimeOff] = useState<TimeOff | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { timeOffs, loading, error, refetch } = useTimeOffList({
    staffId
  });

  const { cancelTimeOff } = useTimeOffOperations();

  // Get time off requests for the selected date
  const getTimeOffForDate = (date: Date) => {
    return timeOffs.filter((timeOff) => {
      const startDate = new Date(timeOff.startDate);
      const endDate = new Date(timeOff.endDate);
      return date >= startDate && date <= endDate;
    });
  };

  const timeOffsForDate = getTimeOffForDate(selectedDate);

  // Handle modal success
  const handleModalSuccess = () => {
    setShowCreateModal(false);
    refetch();
    onTimeOffCreated?.();
  };

  // Handle view time off
  const handleViewTimeOff = (timeOff: TimeOff) => {
    setSelectedTimeOff(timeOff);
    setShowDetailModal(true);
  };

  // Handle cancel time off
  const handleCancelTimeOff = async (timeOff: TimeOff) => {
    const result = await cancelTimeOff(timeOff._id);
    if (result) {
      setShowDetailModal(false);
      refetch();
    }
  };

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

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{t('timeoff.out_of_office')}</h3>
          <p className="text-sm text-gray-600">
            {t('timeoff.manage_time_off_for')}{' '}
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-black hover:bg-gray-800">
          <Calendar className="h-4 w-4 mr-2" />
          {t('timeoff.request_time_off')}
        </Button>
      </div>

      {/* Time Off Requests for Selected Date */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">{t('common.loading')}</p>
          </div>
        </div>
      ) : timeOffsForDate.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('timeoff.no_time_off_scheduled')}</h3>
              <p className="text-gray-600 mb-4">{t('timeoff.no_time_off_description')}</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                {t('timeoff.request_time_off')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {timeOffsForDate.map((timeOff) => (
            <Card key={timeOff._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(timeOff.status)}
                    {getTypeBadge(timeOff.type)}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleViewTimeOff(timeOff)}>
                    {t('common.view')}
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {timeOff.startDateFmt} - {timeOff.endDateFmt}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {timeOff.duration} {t('timeoff.days')}
                    </span>
                  </div>

                  {timeOff.reason && (
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span className="text-sm text-gray-600">{timeOff.reason}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateTimeOffModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleModalSuccess}
        prefillData={{
          startDate: localDateStringYMD(selectedDate),
          endDate: localDateStringYMD(selectedDate)
        }}
        hideDateSelection={true}
      />

      <TimeOffDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        timeOff={selectedTimeOff}
        onCancel={handleCancelTimeOff}
      />
    </div>
  );
};

export default TimeOffRequestTab;
