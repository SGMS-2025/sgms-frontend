import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/utils';
import {
  getRescheduleTypeText,
  getRescheduleTypeIcon,
  getTimeOffTypeText,
  getTimeOffTypeColor,
  type RescheduleType,
  type TimeOffType
} from '@/utils/typeHelpers';

interface TypeBadgeProps {
  type: RescheduleType | TimeOffType;
  badgeType: 'reschedule' | 'timeoff';
  t: (key: string) => string;
  className?: string;
  showIcon?: boolean;
}

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type, badgeType, t, className, showIcon = true }) => {
  const getColor = () => {
    if (badgeType === 'timeoff') {
      return getTimeOffTypeColor(type as TimeOffType);
    }
    return 'bg-blue-100 text-blue-800'; // Default for reschedule
  };

  const getIcon = () => {
    if (badgeType === 'reschedule') {
      return getRescheduleTypeIcon(type as RescheduleType);
    }
    return null; // TimeOff types don't have icons
  };

  const getText = () => {
    if (badgeType === 'reschedule') {
      return getRescheduleTypeText(type as RescheduleType, t);
    }
    return getTimeOffTypeText(type as TimeOffType, t);
  };

  return (
    <Badge className={cn('text-xs', getColor(), className)}>
      {showIcon && getIcon()}
      <span className={showIcon ? 'ml-1' : ''}>{getText()}</span>
    </Badge>
  );
};

export default TypeBadge;
