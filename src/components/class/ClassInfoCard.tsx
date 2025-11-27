import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Clock, MapPin, Zap, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DAY_LABELS } from '@/types/Class';
import type { ClassInfoCardProps } from '@/types/class/ClassInfoCard';

// Helper function to convert MongoDB Decimal to number
const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (value?.$numberDecimal) return parseFloat(value.$numberDecimal);
  return 0;
};

export const ClassInfoCard: React.FC<ClassInfoCardProps> = ({
  classData,
  onClick,
  isCompact = false,
  onEdit,
  onEnroll,
  onDelete
}) => {
  const { t } = useTranslation();
  // Extract trainer names
  const trainerNames = classData.trainerIds
    .map((trainer: any) => {
      if (typeof trainer === 'object' && trainer.userId) {
        return trainer.userId.fullName;
      }
      return 'Unknown';
    })
    .slice(0, 2) // Show max 2 trainers
    .join(', ');

  const moreTrainers =
    classData.trainerIds.length > 2 ? t('class.card.more_trainers', { count: classData.trainerIds.length - 2 }) : '';

  // Format schedule
  const scheduleDisplay = classData.schedulePattern.daysOfWeek
    .slice(0, 3)
    .map((day: any) => {
      const label = DAY_LABELS[day as keyof typeof DAY_LABELS];
      return label?.substring(0, 3);
    })
    .join(', ');

  const moreSchedule =
    classData.schedulePattern.daysOfWeek.length > 3
      ? t('class.card.more_days', { count: classData.schedulePattern.daysOfWeek.length - 3 })
      : '';

  // Capacity calculation
  const occupancyPercent = toNumber(classData.occupancyPercentage) || 0;
  const capacityColor =
    occupancyPercent >= 90 ? 'text-red-600' : occupancyPercent >= 70 ? 'text-yellow-600' : 'text-green-600';

  if (isCompact) {
    return (
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">{classData.name}</h4>
          <Badge variant={classData.status === 'ACTIVE' ? 'default' : 'secondary'}>{classData.status}</Badge>
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3" />
            <span>{trainerNames}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>
              {classData.schedulePattern.startTime} - {classData.schedulePattern.endTime}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card
      className="p-4 hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col relative"
      onClick={onClick}
    >
      {/* Action Menu - Top Right */}
      {(onEdit || onEnroll || onDelete) && (
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100"
                onClick={(e) => e.stopPropagation()}
                data-tour="class-actions-menu"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {onEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {t('class.card.action_edit')}
                </DropdownMenuItem>
              )}
              {onEnroll && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEnroll();
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {t('class.card.action_enroll')}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('class.card.action_delete')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="flex flex-col h-full space-y-3">
        {/* Header: Class Name */}
        <div className="flex items-start justify-between pr-8">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight line-clamp-2">{classData.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500 line-clamp-1">
                {typeof classData.servicePackageId === 'object'
                  ? classData.servicePackageId.name
                  : t('class.card.unknown_package')}
              </p>
              <Badge
                variant={classData.status === 'ACTIVE' ? 'default' : 'secondary'}
                className="text-xs flex-shrink-0"
              >
                {classData.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content Section - Flexible */}
        <div className="flex-1 space-y-2 min-h-0">
          {/* Trainers */}
          {classData.trainerIds.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Users className="w-4 h-4 text-orange-600 flex-shrink-0" />
              <span className="truncate">
                {trainerNames}
                {moreTrainers && <span className="text-gray-500 ml-1">{moreTrainers}</span>}
              </span>
            </div>
          )}

          {/* Schedule */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="truncate">
              {scheduleDisplay}
              {moreSchedule && <span className="text-gray-500 ml-1">{moreSchedule}</span>}
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Zap className="w-4 h-4 text-yellow-600 flex-shrink-0" />
            <span>
              {classData.schedulePattern.startTime} - {classData.schedulePattern.endTime}
            </span>
          </div>

          {/* Location - Always show space even if empty */}
          <div className="flex items-center gap-2 text-sm text-gray-700 min-h-[20px]">
            {classData.location && (
              <>
                <MapPin className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="truncate">{classData.location}</span>
              </>
            )}
          </div>

          {/* Description (if available) */}
          {classData.description && <p className="text-xs text-gray-600 line-clamp-2">{classData.description}</p>}
        </div>

        {/* Capacity Section - Fixed at bottom */}
        <div className="border-t space-y-2 flex-shrink-0">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">{t('class.card.capacity_label')}</span>
            <span className={`font-semibold ${capacityColor}`}>
              {toNumber(classData.activeEnrollment)}/{toNumber(classData.capacity)}
            </span>
          </div>
          <Progress value={occupancyPercent} className="h-2" />

          {/* Status under progress */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>{t('class.card.occupancy_percent', { percent: occupancyPercent })}</span>
            {classData.isFull && (
              <Badge variant="destructive" className="text-xs py-0">
                {t('class.card.status_full')}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
