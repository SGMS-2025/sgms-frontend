import { cn } from '@/utils/utils';

export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'SETTLED'
  | 'PROCESSING'
  | 'VOID';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

const statusConfig = {
  PENDING: {
    label: 'Đang chờ',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  COMPLETED: {
    label: 'Hoàn thành',
    className: 'bg-green-100 text-green-800 border-green-200'
  },
  FAILED: {
    label: 'Thất bại',
    className: 'bg-red-100 text-red-800 border-red-200'
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    className: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  SETTLED: {
    label: 'Đã thanh toán',
    className: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  PROCESSING: {
    label: 'Đang xử lý',
    className: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  VOID: {
    label: 'Vô hiệu',
    className: 'bg-gray-100 text-gray-800 border-gray-200'
  }
};

export default function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
