import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/utils';
import {
  getRescheduleStatusColor,
  getRescheduleStatusIcon,
  getRescheduleStatusText,
  getTimeOffStatusColor,
  getTimeOffStatusIcon,
  getTimeOffStatusText,
  type RescheduleState,
  type TimeOffStatus
} from '@/utils/statusHelpers';

interface StatusBadgeProps {
  status: RescheduleState | TimeOffStatus;
  type: 'reschedule' | 'timeoff';
  t: (key: string) => string;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type, t, className, showIcon = true }) => {
  const getColor = () => {
    if (type === 'reschedule') {
      return getRescheduleStatusColor(status as RescheduleState);
    }
    return getTimeOffStatusColor(status as TimeOffStatus);
  };

  const getIcon = () => {
    if (type === 'reschedule') {
      return getRescheduleStatusIcon(status as RescheduleState);
    }
    return getTimeOffStatusIcon(status as TimeOffStatus);
  };

  const getText = () => {
    if (type === 'reschedule') {
      return getRescheduleStatusText(status as RescheduleState, t);
    }
    return getTimeOffStatusText(status as TimeOffStatus, t);
  };

  return (
    <Badge className={cn('text-xs', getColor(), className)}>
      {showIcon && getIcon()}
      <span className={showIcon ? 'ml-1' : ''}>{getText()}</span>
    </Badge>
  );
};

export default StatusBadge;
