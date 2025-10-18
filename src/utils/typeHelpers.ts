import React from 'react';
import { UserPlus, ArrowRightLeft, User, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';

// Reschedule Type Types
export type RescheduleType = 'FIND_REPLACEMENT' | 'DIRECT_SWAP' | 'MANAGER_ASSIGN';

// TimeOff Type Types
export type TimeOffType = 'VACATION' | 'SICK_LEAVE' | 'PERSONAL_LEAVE' | 'UNPAID_LEAVE' | 'EMERGENCY' | 'OTHER';

// Priority Types
export type ReschedulePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Reschedule Type Helpers
export const getRescheduleTypeText = (type: RescheduleType, t: (key: string) => string): string => {
  switch (type) {
    case 'FIND_REPLACEMENT':
      return t('reschedule.type.find_replacement');
    case 'DIRECT_SWAP':
      return t('reschedule.type.direct_swap');
    case 'MANAGER_ASSIGN':
      return t('reschedule.type.manager_assign');
    default:
      return type;
  }
};

export const getRescheduleTypeIcon = (type: RescheduleType): React.ReactElement => {
  switch (type) {
    case 'FIND_REPLACEMENT':
      return React.createElement(UserPlus, { className: 'h-4 w-4' });
    case 'DIRECT_SWAP':
      return React.createElement(ArrowRightLeft, { className: 'h-4 w-4' });
    case 'MANAGER_ASSIGN':
      return React.createElement(User, { className: 'h-4 w-4' });
    default:
      return React.createElement(ArrowRightLeft, { className: 'h-4 w-4' });
  }
};

// TimeOff Type Helpers
export const getTimeOffTypeText = (type: TimeOffType, t: (key: string) => string): string => {
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

export const getTimeOffTypeColor = (type: TimeOffType): string => {
  const colors = {
    VACATION: 'bg-blue-100 text-blue-800',
    SICK_LEAVE: 'bg-red-100 text-red-800',
    PERSONAL_LEAVE: 'bg-purple-100 text-purple-800',
    UNPAID_LEAVE: 'bg-gray-100 text-gray-800',
    EMERGENCY: 'bg-orange-100 text-orange-800',
    OTHER: 'bg-teal-100 text-teal-800'
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

// Priority Helpers
export const getPriorityColor = (priority: ReschedulePriority): string => {
  switch (priority) {
    case 'LOW':
      return 'bg-gray-100 text-gray-800';
    case 'MEDIUM':
      return 'bg-blue-100 text-blue-800';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800';
    case 'URGENT':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Common Icon Helpers
export const getCommonIcon = (iconType: 'calendar' | 'clock' | 'map' | 'alert'): React.ReactElement => {
  switch (iconType) {
    case 'calendar':
      return React.createElement(Calendar, { className: 'h-4 w-4' });
    case 'clock':
      return React.createElement(Clock, { className: 'h-4 w-4' });
    case 'map':
      return React.createElement(MapPin, { className: 'h-4 w-4' });
    case 'alert':
      return React.createElement(AlertCircle, { className: 'h-4 w-4' });
    default:
      return React.createElement(AlertCircle, { className: 'h-4 w-4' });
  }
};
