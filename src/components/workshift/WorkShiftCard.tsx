import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, MapPin, Edit, Trash2, Eye, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/utils/utils';
import type { WorkShiftCardProps, WorkShiftStatus } from '@/types/api/WorkShift';

const getStatusColor = (status: WorkShiftStatus) => {
  switch (status) {
    case 'SCHEDULED':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'IN_PROGRESS':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'COMPLETED':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusText = (status: WorkShiftStatus, t: (key: string) => string) => {
  switch (status) {
    case 'SCHEDULED':
      return t('workshift.status.scheduled');
    case 'IN_PROGRESS':
      return t('workshift.status.in_progress');
    case 'COMPLETED':
      return t('workshift.status.completed');
    case 'CANCELLED':
      return t('workshift.status.cancelled');
    default:
      return status;
  }
};

const WorkShiftCard: React.FC<WorkShiftCardProps> = ({ workShift, onEdit, onDelete, onView }) => {
  const { t } = useTranslation();

  const handleEdit = () => {
    if (onEdit) {
      onEdit(workShift._id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(workShift._id);
    }
  };

  const handleView = () => {
    if (onView) {
      onView(workShift._id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={
                  workShift.staffId.email
                    ? `https://ui-avatars.com/api/?name=${workShift.staffId.firstName || ''}+${workShift.staffId.lastName || ''}&background=orange&color=fff`
                    : undefined
                }
                alt={`${workShift.staffId.firstName || ''} ${workShift.staffId.lastName || ''}`}
              />
              <AvatarFallback className="bg-orange-500 text-white text-sm font-medium">
                {(workShift.staffId.firstName || '').charAt(0)}
                {(workShift.staffId.lastName || '').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                {workShift.staffId.firstName || ''} {workShift.staffId.lastName || ''}
              </h3>
              <p className="text-xs text-gray-500">{workShift.staffId.email || ''}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn('text-xs font-medium', getStatusColor(workShift.status))}>
            {getStatusText(workShift.status, t)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Branch Information */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{workShift.branchId.name}</span>
          </div>

          {/* Date and Time Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <span>{workShift.startTimeFmt.split(' ')[1]}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="font-medium">
                {workShift.startTimeLocal} - {workShift.endTimeLocal}
              </span>
            </div>
          </div>

          {/* Timezone Information */}
          <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
            {t('workshift.timezone')}: {workShift.branchTz}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {onView && (
              <Button variant="outline" size="sm" onClick={handleView} className="flex-1 text-xs">
                <Eye className="h-3 w-3 mr-1" />
                {t('common.view')}
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" size="sm" onClick={handleEdit} className="flex-1 text-xs">
                <Edit className="h-3 w-3 mr-1" />
                {t('common.edit')}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="flex-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {t('common.delete')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkShiftCard;
