import React from 'react';
import { Clock } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/currency';
import type { CustomerPaymentHistoryPendingTransfer } from '@/types/api/Payment';

interface PendingTransferRowProps {
  transfer: CustomerPaymentHistoryPendingTransfer;
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

const PendingTransferRow: React.FC<PendingTransferRowProps> = ({ transfer }) => {
  return (
    <TableRow className="border-b border-amber-200/50 bg-amber-50/50 last:border-b-0">
      <TableCell className="text-sm font-medium text-foreground">{formatDateTime(transfer.createdAt)}</TableCell>
      <TableCell className="text-sm text-foreground">
        <div className="space-y-1">
          <p className="font-medium">{transfer.contractName}</p>
          <p className="text-xs text-muted-foreground">{getContractTypeLabel(transfer.contractType)}</p>
        </div>
      </TableCell>
      <TableCell className="text-right text-sm font-semibold text-foreground">
        {formatCurrency(transfer.amount)}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{getPaymentMethodLabel(transfer.paymentMethod)}</TableCell>
      <TableCell>
        <Badge className="flex items-center gap-1.5 border-amber-200 bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
          <Clock className="h-3 w-3" />
          Đang chờ
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">—</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {transfer.orderCode || transfer.paymentCode || '—'}
      </TableCell>
    </TableRow>
  );
};

export default PendingTransferRow;
