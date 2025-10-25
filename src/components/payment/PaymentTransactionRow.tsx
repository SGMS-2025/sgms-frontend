import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import PaymentStatusBadge, { type PaymentStatus } from './PaymentStatusBadge';
import { formatCurrency } from '@/utils/currency';
import type { CustomerPaymentHistoryTransaction } from '@/types/api/Payment';

interface PaymentTransactionRowProps {
  transaction: CustomerPaymentHistoryTransaction;
}

const formatDateTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'BANK_TRANSFER':
      return 'Chuyển khoản';
    case 'CASH':
      return 'Tiền mặt';
    case 'CARD':
      return 'Thẻ';
    case 'E_WALLET':
      return 'Ví điện tử';
    case 'OTHER':
      return 'Khác';
    default:
      return method;
  }
};

const getContractTypeLabel = (type: string) => {
  switch (type) {
    case 'MEMBERSHIP':
      return 'Gói hội viên';
    case 'SERVICE':
      return 'Gói dịch vụ';
    default:
      return type;
  }
};

const mapToPaymentStatus = (status: string): PaymentStatus => {
  const statusMap: Record<string, PaymentStatus> = {
    PENDING: 'PENDING',
    SETTLED: 'SETTLED',
    FAILED: 'FAILED',
    VOID: 'VOID',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED',
    PROCESSING: 'PROCESSING'
  };
  return statusMap[status] || 'PENDING';
};

const PaymentTransactionRow: React.FC<PaymentTransactionRowProps> = ({ transaction }) => {
  // Debug: Log transaction data to see what's available
  console.log('Transaction data:', transaction);
  console.log('RecordedBy:', transaction.recordedBy);

  return (
    <TableRow className="border-b border-border/50 last:border-b-0">
      <TableCell className="text-sm font-medium text-foreground">{formatDateTime(transaction.occurredAt)}</TableCell>
      <TableCell className="text-sm text-foreground">
        <div className="space-y-1">
          <p className="font-medium">{transaction.contractName}</p>
          <p className="text-xs text-muted-foreground">{getContractTypeLabel(transaction.contractType)}</p>
        </div>
      </TableCell>
      <TableCell className="text-right text-sm font-semibold text-foreground">
        {formatCurrency(transaction.amount)}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{getPaymentMethodLabel(transaction.method)}</TableCell>
      <TableCell>
        <PaymentStatusBadge status={mapToPaymentStatus(transaction.status)} />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{transaction.recordedBy?.name || '—'}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{transaction.referenceCode || '—'}</TableCell>
    </TableRow>
  );
};

export default PaymentTransactionRow;
