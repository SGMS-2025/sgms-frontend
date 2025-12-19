import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/utils';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'SETTLED' | 'PROCESSING' | 'VOID';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export default function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const { t } = useTranslation();

  const statusConfig: Record<PaymentStatus, { labelKey: string; className: string }> = {
    PENDING: {
      labelKey: 'payment_history.status.pending',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    COMPLETED: {
      labelKey: 'payment_history.status.success',
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    FAILED: {
      labelKey: 'payment_history.status.failed',
      className: 'bg-red-100 text-red-800 border-red-200'
    },
    CANCELLED: {
      labelKey: 'payment_history.status.cancelled',
      className: 'bg-gray-100 text-gray-800 border-gray-200'
    },
    SETTLED: {
      labelKey: 'payment_history.status.settled',
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    PROCESSING: {
      labelKey: 'payment_history.status.processing',
      className: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    VOID: {
      labelKey: 'payment_history.status.failed',
      className: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  };

  const config = statusConfig[status] || statusConfig.PENDING;
  const label = t(config.labelKey, status);

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {label}
    </span>
  );
}
