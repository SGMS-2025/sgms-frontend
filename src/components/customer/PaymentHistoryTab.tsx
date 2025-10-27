import React, { useState } from 'react';
import {
  CreditCard,
  Loader2,
  AlertCircle,
  CalendarDays,
  Building2,
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  User
} from 'lucide-react';
import { useCustomerPaymentHistory } from '@/hooks/useCustomerPayments';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/utils/utils';
import type { CustomerPaymentHistoryTransaction, CustomerPaymentHistoryPendingTransfer } from '@/types/api/Payment';

interface PaymentHistoryTabProps {
  customerId: string;
}

const formatCurrency = (amount?: number | null) => {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDateTime = (dateString?: string | null) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getMethodLabel = (method: string) => {
  const methodMap: Record<string, string> = {
    CASH: 'Tiền mặt',
    BANK_TRANSFER: 'Chuyển khoản',
    CARD: 'Thẻ',
    PAYOS: 'PayOS',
    SEPAY: 'SePay'
  };
  return methodMap[method] || method;
};

const getMethodBadgeColor = (method: string) => {
  switch (method) {
    case 'CASH':
      return 'bg-green-500/10 text-green-700 border-green-200';
    case 'BANK_TRANSFER':
    case 'PAYOS':
    case 'SEPAY':
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'CARD':
      return 'bg-purple-500/10 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-200';
  }
};

const getStatusBadgeProps = (status: string) => {
  switch (status) {
    case 'SUCCESS':
    case 'COMPLETED':
      return {
        icon: CheckCircle2,
        label: 'Thành công',
        className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
      };
    case 'PENDING':
      return {
        icon: Clock,
        label: 'Đang chờ',
        className: 'bg-amber-500/10 text-amber-700 border-amber-200'
      };
    case 'FAILED':
    case 'CANCELLED':
      return {
        icon: XCircle,
        label: 'Thất bại',
        className: 'bg-red-500/10 text-red-700 border-red-200'
      };
    default:
      return {
        icon: AlertCircle,
        label: status,
        className: 'bg-gray-500/10 text-gray-700 border-gray-200'
      };
  }
};

const getContractTypeBadge = (type: string) => {
  switch (type) {
    case 'MEMBERSHIP':
      return { label: 'Gói hội viên', className: 'bg-primary/10 text-primary border-primary/20' };
    case 'SERVICE':
      return { label: 'Gói dịch vụ', className: 'bg-blue-500/10 text-blue-700 border-blue-200' };
    default:
      return { label: type, className: 'bg-gray-500/10 text-gray-700 border-gray-200' };
  }
};

const TransactionCard: React.FC<{ transaction: CustomerPaymentHistoryTransaction }> = ({ transaction }) => {
  const statusBadge = getStatusBadgeProps(transaction.status);
  const StatusIcon = statusBadge.icon;
  const contractTypeBadge = getContractTypeBadge(transaction.contractType);

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn('text-xs font-medium', contractTypeBadge.className)}>
                  {contractTypeBadge.label}
                </Badge>
                <Badge variant="outline" className={cn('text-xs font-medium', statusBadge.className)}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusBadge.label}
                </Badge>
                <Badge variant="outline" className={cn('text-xs font-medium', getMethodBadgeColor(transaction.method))}>
                  {getMethodLabel(transaction.method)}
                </Badge>
              </div>
              <h4 className="font-semibold text-foreground">{transaction.contractName}</h4>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{formatCurrency(transaction.amount)}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            {transaction.branch && (
              <div className="flex items-start gap-2 text-sm">
                <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Chi nhánh</p>
                  <p className="font-medium text-foreground">{transaction.branch.name}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 text-sm">
              <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Thời gian</p>
                <p className="font-medium text-foreground">{formatDateTime(transaction.occurredAt)}</p>
              </div>
            </div>

            {transaction.recordedBy && (
              <div className="flex items-start gap-2 text-sm">
                <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Người ghi nhận</p>
                  <p className="font-medium text-foreground">{transaction.recordedBy.name}</p>
                  {transaction.recordedBy.email && (
                    <p className="text-xs text-muted-foreground">{transaction.recordedBy.email}</p>
                  )}
                </div>
              </div>
            )}

            {transaction.referenceCode && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Mã tham chiếu</p>
                  <p className="font-mono text-xs font-medium text-foreground">{transaction.referenceCode}</p>
                </div>
              </div>
            )}
          </div>

          {transaction.note && (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Ghi chú</p>
              <p className="mt-1 text-sm text-foreground">{transaction.note}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const PendingTransferCard: React.FC<{ transfer: CustomerPaymentHistoryPendingTransfer }> = ({ transfer }) => {
  const contractTypeBadge = getContractTypeBadge(transfer.contractType);

  return (
    <Card className="rounded-2xl border-2 border-amber-200 bg-amber-50/30 shadow-sm">
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn('text-xs font-medium', contractTypeBadge.className)}>
                  {contractTypeBadge.label}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-700 border-amber-200 text-xs font-medium"
                >
                  <Clock className="mr-1 h-3 w-3" />
                  Chờ xác nhận
                </Badge>
                <Badge
                  variant="outline"
                  className={cn('text-xs font-medium', getMethodBadgeColor(transfer.paymentMethod))}
                >
                  {getMethodLabel(transfer.paymentMethod)}
                </Badge>
              </div>
              <h4 className="font-semibold text-foreground">{transfer.contractName}</h4>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-amber-700">{formatCurrency(transfer.amount)}</p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="grid gap-3 sm:grid-cols-2">
            {transfer.branch && (
              <div className="flex items-start gap-2 text-sm">
                <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Chi nhánh</p>
                  <p className="font-medium text-foreground">{transfer.branch.name}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 text-sm">
              <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Tạo lúc</p>
                <p className="font-medium text-foreground">{formatDateTime(transfer.createdAt)}</p>
              </div>
            </div>

            {transfer.orderCode && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Mã đơn hàng</p>
                  <p className="font-mono text-xs font-medium text-foreground">{transfer.orderCode}</p>
                </div>
              </div>
            )}

            {transfer.expiresAt && (
              <div className="flex items-start gap-2 text-sm">
                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Hết hạn</p>
                  <p className="font-medium text-foreground">{formatDateTime(transfer.expiresAt)}</p>
                </div>
              </div>
            )}
          </div>

          {(transfer.bankAccount.name || transfer.bankAccount.number) && (
            <div className="rounded-lg border border-amber-200 bg-white/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">Thông tin chuyển khoản</p>
              {transfer.bankAccount.name && (
                <p className="mt-1 text-sm font-medium text-foreground">{transfer.bankAccount.name}</p>
              )}
              {transfer.bankAccount.number && (
                <p className="font-mono text-sm text-foreground">{transfer.bankAccount.number}</p>
              )}
              {transfer.bankAccount.bankCode && (
                <p className="text-xs text-muted-foreground">Ngân hàng: {transfer.bankAccount.bankCode}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const PaymentHistoryTab: React.FC<PaymentHistoryTabProps> = ({ customerId }) => {
  const { data, loading, error, setQuery, refetch } = useCustomerPaymentHistory(customerId);
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [filterContractType, setFilterContractType] = useState<string>('ALL');

  const handleFilterChange = () => {
    setQuery({
      method: filterMethod === 'ALL' ? null : filterMethod,
      contractType: filterContractType === 'ALL' ? null : (filterContractType as 'MEMBERSHIP' | 'SERVICE'),
      page: 1
    });
  };

  const handlePageChange = (newPage: number) => {
    setQuery({ page: newPage });
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang tải lịch sử thanh toán...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="rounded-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Không thể tải lịch sử thanh toán</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-3 rounded-full">
          Thử lại
        </Button>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert className="rounded-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Không có dữ liệu</AlertTitle>
        <AlertDescription>Không tìm thấy lịch sử thanh toán cho khách hàng này.</AlertDescription>
      </Alert>
    );
  }

  const { summary, transactions, pendingTransfers, pagination } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tổng giao dịch</p>
                <p className="text-xl font-bold text-foreground">{summary.totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tổng thanh toán</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(summary.totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tiền mặt</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(summary.amountByMethod.CASH || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Chuyển khoản</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(summary.amountByMethod.BANK_TRANSFER || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Transfers */}
      {pendingTransfers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-foreground">Thanh toán đang chờ ({pendingTransfers.length})</h3>
          </div>
          <div className="grid gap-4">
            {pendingTransfers.map((transfer) => (
              <PendingTransferCard key={transfer.paymentTransactionId} transfer={transfer} />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterContractType} onValueChange={setFilterContractType}>
          <SelectTrigger className="w-[180px] rounded-full">
            <SelectValue placeholder="Loại hợp đồng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả hợp đồng</SelectItem>
            <SelectItem value="MEMBERSHIP">Gói hội viên</SelectItem>
            <SelectItem value="SERVICE">Gói dịch vụ</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterMethod} onValueChange={setFilterMethod}>
          <SelectTrigger className="w-[180px] rounded-full">
            <SelectValue placeholder="Phương thức" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả phương thức</SelectItem>
            <SelectItem value="CASH">Tiền mặt</SelectItem>
            <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
            <SelectItem value="PAYOS">PayOS</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleFilterChange} variant="outline" className="rounded-full">
          Áp dụng bộ lọc
        </Button>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Lịch sử giao dịch ({pagination.total})</h3>
        </div>

        {transactions.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-border bg-muted/30 shadow-none">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-semibold text-foreground">Chưa có giao dịch</p>
                <p className="text-sm text-muted-foreground">Lịch sử giao dịch sẽ hiển thị ở đây</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {transactions.map((transaction) => (
              <TransactionCard key={transaction.transactionId} transaction={transaction} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              Trang trước
            </Button>
            <span className="text-sm text-muted-foreground">
              Trang {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              Trang sau
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
