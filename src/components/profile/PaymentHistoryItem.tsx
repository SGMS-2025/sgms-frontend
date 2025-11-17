import { Badge } from '@/components/ui/badge';
import type { CustomerPaymentHistoryTransaction } from '@/types/api/Payment';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND'
});

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short'
});

const STATUS_BADGE_CLASS: Record<string, string> = {
  SETTLED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  PROCESSING: 'bg-sky-100 text-sky-700 border-sky-200',
  PAID: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  FAILED: 'bg-red-100 text-red-700 border-red-200',
  CANCELED: 'bg-gray-100 text-gray-600 border-gray-200'
};

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  PAYOS: 'PayOS'
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  MEMBERSHIP: 'Thành viên',
  SERVICE: 'Dịch vụ'
};

export interface PaymentHistoryItemProps {
  transaction: CustomerPaymentHistoryTransaction;
}

const getStatusBadgeClass = (status: string) =>
  STATUS_BADGE_CLASS[status] || 'bg-slate-100 text-slate-700 border-slate-200';

const formatDateTime = (value: string | Date | null | undefined) => {
  if (!value) return '-';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return dateTimeFormatter.format(parsed);
};

const formatCurrency = (value: number | null | undefined) => currencyFormatter.format(value || 0);

export const PaymentHistoryItem: React.FC<PaymentHistoryItemProps> = ({ transaction }) => {
  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">{transaction.contractName}</p>
          <p className="text-xs text-gray-500">
            {CONTRACT_TYPE_LABELS[transaction.contractType] || transaction.contractType}
            {transaction.branch?.name ? ` • ${transaction.branch.name}` : ''}
          </p>
        </div>
        <Badge className={`${getStatusBadgeClass(transaction.status)} border`}>{transaction.status}</Badge>
      </div>

      <div className="grid gap-3 text-sm text-gray-600 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Số tiền</p>
          <p className="font-semibold text-gray-900">{formatCurrency(transaction.amount)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Phương thức</p>
          <p className="font-semibold text-gray-900">{METHOD_LABELS[transaction.method] || transaction.method}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Thời gian</p>
          <p className="font-semibold text-gray-900">{formatDateTime(transaction.occurredAt)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Mã tham chiếu</p>
          <p className="font-semibold text-gray-900">{transaction.referenceCode || '-'}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <div>
          <span className="font-medium text-gray-600">Mã giao dịch:</span> {transaction.transactionId}
        </div>
        {transaction.recordedBy?.name && (
          <div>
            <span className="font-medium text-gray-600">Ghi nhận bởi:</span> {transaction.recordedBy.name}
          </div>
        )}
        {transaction.note && (
          <div className="max-w-full">
            <span className="font-medium text-gray-600">Ghi chú:</span> {transaction.note}
          </div>
        )}
      </div>
    </div>
  );
};
