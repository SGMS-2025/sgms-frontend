import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/utils';

// ===== PAYMENT STATUS BADGE =====
interface PaymentStatusBadgeProps {
  status: string;
}

const getPaymentStatusBadgeStyles = (status: string) => {
  switch (status) {
    case 'SETTLED':
      return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    case 'PENDING':
      return 'border-amber-200 bg-amber-100 text-amber-700';
    case 'FAILED':
      return 'border-red-200 bg-red-100 text-red-700';
    case 'VOID':
      return 'border-gray-200 bg-gray-100 text-gray-600';
    default:
      return 'border-gray-200 bg-gray-100 text-gray-600';
  }
};

const getPaymentStatusIcon = (status: string) => {
  switch (status) {
    case 'SETTLED':
      return CheckCircle;
    case 'PENDING':
      return Clock;
    case 'FAILED':
      return XCircle;
    case 'VOID':
      return AlertCircle;
    default:
      return AlertCircle;
  }
};

const getPaymentStatusLabel = (status: string) => {
  switch (status) {
    case 'SETTLED':
      return 'Hoàn tất';
    case 'PENDING':
      return 'Đang chờ';
    case 'FAILED':
      return 'Thất bại';
    case 'VOID':
      return 'Đã hủy';
    default:
      return status;
  }
};

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status }) => {
  const Icon = getPaymentStatusIcon(status);

  return (
    <Badge
      className={cn('flex items-center gap-1.5 px-3 py-1 text-xs font-medium', getPaymentStatusBadgeStyles(status))}
    >
      <Icon className="h-3 w-3" />
      {getPaymentStatusLabel(status)}
    </Badge>
  );
};

// ===== PAYMENT SUMMARY CARD =====
interface PaymentSummaryCardProps {
  title: string;
  value: string;
  caption?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}

export const PaymentSummaryCard: React.FC<PaymentSummaryCardProps> = ({ title, value, caption, tone = 'default' }) => {
  const toneClasses = {
    default: 'border-border bg-card text-foreground',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-red-200 bg-red-50 text-red-700'
  };

  return (
    <div className={cn('rounded-2xl border p-4 shadow-sm', toneClasses[tone])}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      {caption && <p className="mt-1 text-xs text-muted-foreground">{caption}</p>}
    </div>
  );
};
