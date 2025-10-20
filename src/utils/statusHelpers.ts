import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Timer, AlertTriangle, Clock } from 'lucide-react';

// Reschedule Status Types
export type RescheduleState =
  | 'PENDING_BROADCAST'
  | 'PENDING_ACCEPTANCE'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'COMPLETED';

// TimeOff Status Types
export type TimeOffStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

// Reschedule Status Helpers
export const getRescheduleStatusColor = (status: RescheduleState): string => {
  switch (status) {
    case 'PENDING_BROADCAST':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'PENDING_ACCEPTANCE':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'PENDING_APPROVAL':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'APPROVED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'REJECTED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'EXPIRED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getRescheduleStatusIcon = (status: RescheduleState): React.ReactElement => {
  switch (status) {
    case 'PENDING_BROADCAST':
      return React.createElement(AlertCircle, { className: 'h-4 w-4' });
    case 'PENDING_ACCEPTANCE':
      return React.createElement(Timer, { className: 'h-4 w-4' });
    case 'PENDING_APPROVAL':
      return React.createElement(AlertTriangle, { className: 'h-4 w-4' });
    case 'APPROVED':
      return React.createElement(CheckCircle, { className: 'h-4 w-4' });
    case 'REJECTED':
      return React.createElement(XCircle, { className: 'h-4 w-4' });
    case 'CANCELLED':
      return React.createElement(XCircle, { className: 'h-4 w-4' });
    case 'EXPIRED':
      return React.createElement(AlertTriangle, { className: 'h-4 w-4' });
    case 'COMPLETED':
      return React.createElement(CheckCircle, { className: 'h-4 w-4' });
    default:
      return React.createElement(AlertCircle, { className: 'h-4 w-4' });
  }
};

export const getRescheduleStatusText = (status: RescheduleState, t: (key: string) => string): string => {
  switch (status) {
    case 'PENDING_BROADCAST':
      return t('reschedule.status.pending_broadcast');
    case 'PENDING_ACCEPTANCE':
      return t('reschedule.status.pending_acceptance');
    case 'PENDING_APPROVAL':
      return t('reschedule.status.pending_approval');
    case 'APPROVED':
      return t('reschedule.status.approved');
    case 'REJECTED':
      return t('reschedule.status.rejected');
    case 'CANCELLED':
      return t('reschedule.status.cancelled');
    case 'EXPIRED':
      return t('reschedule.status.expired');
    case 'COMPLETED':
      return t('reschedule.status.completed');
    default:
      return status;
  }
};

// TimeOff Status Helpers
export const getTimeOffStatusColor = (status: TimeOffStatus): string => {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-100 text-green-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getTimeOffStatusIcon = (status: TimeOffStatus): React.ReactElement => {
  switch (status) {
    case 'APPROVED':
      return React.createElement(CheckCircle, { className: 'h-3 w-3' });
    case 'PENDING':
      return React.createElement(Clock, { className: 'h-3 w-3' });
    case 'REJECTED':
      return React.createElement(XCircle, { className: 'h-3 w-3' });
    case 'CANCELLED':
      return React.createElement(XCircle, { className: 'h-3 w-3' });
    default:
      return React.createElement(AlertCircle, { className: 'h-3 w-3' });
  }
};

export const getTimeOffStatusText = (status: TimeOffStatus, t: (key: string) => string): string => {
  switch (status) {
    case 'APPROVED':
      return t('timeoff.status.approved');
    case 'PENDING':
      return t('timeoff.status.pending');
    case 'REJECTED':
      return t('timeoff.status.rejected');
    case 'CANCELLED':
      return t('timeoff.status.cancelled');
    default:
      return status;
  }
};
