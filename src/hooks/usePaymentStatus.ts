import { useMemo } from 'react';

export interface PaymentStatusConfig {
  status: string;
}

export const usePaymentStatus = ({ status }: PaymentStatusConfig) => {
  const statusConfig = useMemo(() => {
    switch (status) {
      case 'SETTLED':
        return {
          label: 'Hoàn tất',
          className: 'border-emerald-200 bg-emerald-100 text-emerald-700',
          icon: 'CheckCircle'
        };
      case 'PENDING':
        return {
          label: 'Đang chờ',
          className: 'border-amber-200 bg-amber-100 text-amber-700',
          icon: 'Clock'
        };
      case 'FAILED':
        return {
          label: 'Thất bại',
          className: 'border-red-200 bg-red-100 text-red-700',
          icon: 'XCircle'
        };
      case 'VOID':
        return {
          label: 'Đã hủy',
          className: 'border-gray-200 bg-gray-100 text-gray-600',
          icon: 'AlertCircle'
        };
      default:
        return {
          label: status,
          className: 'border-gray-200 bg-gray-100 text-gray-600',
          icon: 'AlertCircle'
        };
    }
  }, [status]);

  return statusConfig;
};
