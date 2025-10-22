import { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { Loader2, RefreshCcw } from 'lucide-react';
import { useCustomerPaymentHistory } from '@/hooks/useCustomerPayments';
import type { CustomerPaymentHistoryPendingTransfer, PaymentContractType } from '@/types/api/Payment';
import { PaymentHistoryItem } from './PaymentHistoryItem';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND'
});

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short'
});

const METHOD_LABELS: Record<string, string> = {
  ALL: 'Tất cả phương thức',
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  CARD: 'Thẻ',
  QR_CODE: 'Mã QR',
  PAYOS: 'PayOS',
  EWALLET: 'Ví điện tử',
  DEBT: 'Công nợ'
};

const STATUS_LABELS: Record<string, string> = {
  ALL: 'Tất cả trạng thái',
  SETTLED: 'Hoàn tất',
  PAID: 'Đã thanh toán',
  REFUNDED: 'Đã hoàn tiền',
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  FAILED: 'Thất bại',
  CANCELED: 'Đã hủy'
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  ALL: 'Tất cả loại hợp đồng',
  MEMBERSHIP: 'Thành viên',
  SERVICE: 'Dịch vụ'
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  SETTLED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PAID: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  REFUNDED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  PROCESSING: 'bg-sky-100 text-sky-700 border-sky-200',
  FAILED: 'bg-red-100 text-red-700 border-red-200',
  CANCELED: 'bg-gray-100 text-gray-600 border-gray-200'
};

const formatDateTime = (value: string | Date | null | undefined) => {
  if (!value) return '-';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return dateTimeFormatter.format(parsed);
};

const formatCurrency = (value: number | null | undefined) => currencyFormatter.format(value || 0);

const getStatusBadgeClass = (status: string) =>
  STATUS_BADGE_CLASS[status] || 'bg-slate-100 text-slate-700 border-slate-200';

const PendingTransferCard: React.FC<{
  transfer: CustomerPaymentHistoryPendingTransfer;
}> = ({ transfer }) => {
  return (
    <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50/60 p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">{transfer.contractName}</p>
          <p className="text-xs text-gray-500">
            {CONTRACT_TYPE_LABELS[transfer.contractType] || transfer.contractType}
            {transfer.branch?.name ? ` • ${transfer.branch.name}` : ''}
          </p>
        </div>
        <Badge className={`${getStatusBadgeClass(transfer.status)} border`}>{transfer.status}</Badge>
      </div>

      <div className="grid gap-3 text-sm text-gray-600 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Số tiền</p>
          <p className="font-semibold text-gray-900">{formatCurrency(transfer.amount)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Nội dung chuyển khoản</p>
          <p className="font-semibold text-gray-900">{transfer.orderCode || transfer.paymentCode || '-'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Ngày tạo</p>
          <p className="font-semibold text-gray-900">{formatDateTime(transfer.createdAt)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Hết hạn</p>
          <p className="font-semibold text-gray-900">
            {transfer.expiresAt ? formatDateTime(transfer.expiresAt) : 'Không xác định'}
          </p>
        </div>
      </div>

      <Separator />

      <div className="grid gap-2 text-xs text-gray-600 md:grid-cols-2">
        <div>
          <p className="font-medium text-gray-600">Ngân hàng</p>
          <p>
            {transfer.bankAccount.name || '-'}{' '}
            {transfer.bankAccount.bankCode ? `(${transfer.bankAccount.bankCode})` : ''}
          </p>
        </div>
        <div>
          <p className="font-medium text-gray-600">Số tài khoản</p>
          <p>{transfer.bankAccount.number || '-'}</p>
        </div>
        {transfer.checkoutUrl && (
          <div className="md:col-span-2">
            <a
              href={transfer.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              Mở trang thanh toán
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

interface SummaryCardProps {
  title: string;
  amount: number;
  highlight?: boolean;
  suffix?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, highlight, suffix }) => (
  <div
    className={`rounded-xl border p-4 shadow-sm ${
      highlight ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-white' : 'border-gray-200 bg-white'
    }`}
  >
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
    <p className="mt-1 text-xl font-semibold text-gray-900">
      {suffix ? amount : formatCurrency(amount)}
      {suffix ? ` ${suffix}` : ''}
    </p>
  </div>
);

export interface PaymentHistoryTabProps {
  customerId?: string | null;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 10;

export const PaymentHistoryTab: React.FC<PaymentHistoryTabProps> = ({ customerId, pageSize = DEFAULT_PAGE_SIZE }) => {
  const { data, loading, error, refetch, query, setQuery } = useCustomerPaymentHistory(customerId ?? null, {
    limit: pageSize,
    includePending: true
  });

  const transactions = data?.transactions ?? [];
  const pendingTransfers = useMemo(
    () =>
      (data?.pendingTransfers ?? []).slice().sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      }),
    [data?.pendingTransfers]
  );

  const summary = data?.summary;
  const pagination = data?.pagination;

  const hasPendingTransfers = (query.includePending ?? true) && pendingTransfers.length > 0;

  const amountByMethodEntries = useMemo(() => {
    if (!summary?.amountByMethod) return [];
    return Object.entries(summary.amountByMethod).map(([method, amount]) => ({
      method,
      amount
    }));
  }, [summary?.amountByMethod]);

  const handleContractTypeChange = (value: string) => {
    const nextValue = value === 'ALL' ? null : (value as PaymentContractType);
    setQuery({ contractType: nextValue, page: 1 });
  };

  const handleMethodChange = (value: string) => {
    setQuery({ method: value === 'ALL' ? null : value, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    setQuery({ status: value === 'ALL' ? null : value, page: 1 });
  };

  const handleIncludePendingChange = (checked: boolean) => {
    setQuery({ includePending: checked, page: 1 });
  };

  const handleChangePage = (page: number) => {
    if (!pagination) return;
    const clamped = Math.max(1, Math.min(page, pagination.totalPages || 1));
    setQuery({ page: clamped });
  };

  if (!customerId) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <p className="text-sm font-medium text-gray-600">Không tìm thấy mã khách hàng liên kết với tài khoản này.</p>
        <p className="mt-1 text-xs text-gray-500">
          Vui lòng liên hệ quản trị viên để được cấp quyền truy cập lịch sử thanh toán.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Lịch sử thanh toán</h2>
          <p className="text-sm text-gray-500">Theo dõi các giao dịch thanh toán gần đây và trạng thái xử lý.</p>
        </div>
        <Button
          variant="outline"
          className="border-orange-200 text-orange-600 hover:bg-orange-50"
          onClick={refetch}
          disabled={loading}
        >
          <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Tải lại
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <div className="mt-2">
            <Button size="sm" variant="secondary" onClick={refetch}>
              Thử lại
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard title="Tổng số giao dịch" amount={summary?.totalTransactions ?? 0} suffix="giao dịch" />
        <SummaryCard title="Tổng tiền đã thanh toán" amount={summary?.totalAmount ?? 0} highlight />
        <SummaryCard
          title="Số tiền đang chờ"
          amount={summary?.pendingAmount ?? 0}
          highlight={Boolean(summary?.pendingAmount)}
        />
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Theo phương thức</p>
          <div className="mt-2 space-y-1 text-sm text-gray-600">
            {amountByMethodEntries.length === 0 && <p>Chưa có dữ liệu</p>}
            {amountByMethodEntries.map((entry) => (
              <div key={entry.method} className="flex items-center justify-between">
                <span>{METHOD_LABELS[entry.method] || entry.method}</span>
                <span className="font-semibold text-gray-900">{formatCurrency(entry.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Loại hợp đồng</label>
              <Select
                defaultValue={query.contractType ? String(query.contractType) : 'ALL'}
                onValueChange={handleContractTypeChange}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:ring-orange-500">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Phương thức</label>
              <Select defaultValue={query.method ?? 'ALL'} onValueChange={handleMethodChange}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:ring-orange-500">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(METHOD_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Trạng thái</label>
              <Select defaultValue={query.status ?? 'ALL'} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:ring-orange-500">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Hiển thị giao dịch chờ
              </label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Bao gồm công nợ</span>
                <Switch checked={query.includePending ?? true} onCheckedChange={handleIncludePendingChange} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <>
          {hasPendingTransfers && (
            <div className="space-y-3 rounded-2xl border border-orange-200 bg-white p-4 shadow-sm">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Giao dịch chờ xác nhận</h3>
                <p className="text-sm text-gray-500">
                  Hoàn tất chuyển khoản hoặc cập nhật trạng thái để hoàn tất thanh toán.
                </p>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {pendingTransfers.map((transfer) => (
                  <PendingTransferCard key={transfer.paymentTransactionId} transfer={transfer} />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Giao dịch gần đây</h3>
                <p className="text-sm text-gray-500">Danh sách cập nhật theo bộ lọc và phân trang bên dưới.</p>
              </div>
              {summary?.totalTransactions !== undefined && (
                <div className="text-sm text-gray-500">
                  Tổng cộng <span className="font-semibold text-gray-900">{summary.totalTransactions}</span> giao dịch
                </div>
              )}
            </div>

            {transactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
                Chưa có giao dịch nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Thời gian</TableHead>
                        <TableHead>Hợp đồng</TableHead>
                        <TableHead>Chi nhánh</TableHead>
                        <TableHead>Phương thức</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Mã tham chiếu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.transactionId}>
                          <TableCell className="font-medium text-gray-900">
                            {formatDateTime(transaction.occurredAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{transaction.contractName}</span>
                              <span className="text-xs text-gray-500">
                                {CONTRACT_TYPE_LABELS[transaction.contractType] || transaction.contractType}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{transaction.branch?.name || '-'}</TableCell>
                          <TableCell>{METHOD_LABELS[transaction.method] || transaction.method}</TableCell>
                          <TableCell className="font-semibold text-gray-900">
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusBadgeClass(transaction.status)} border`}>
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.referenceCode || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-3 md:hidden">
                  {transactions.map((transaction) => (
                    <PaymentHistoryItem key={transaction.transactionId} transaction={transaction} />
                  ))}
                </div>
              </>
            )}

            {pagination && pagination.totalPages > 1 && (
              <Pagination className="pt-2">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (pagination.hasPrev) {
                          handleChangePage((pagination.page || 1) - 1);
                        }
                      }}
                    />
                  </PaginationItem>
                  {Array.from({ length: pagination.totalPages }).map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <PaginationItem key={`payment-history-page-${pageNumber}`}>
                        <PaginationLink
                          href="#"
                          isActive={pagination.page === pageNumber}
                          onClick={(event) => {
                            event.preventDefault();
                            handleChangePage(pageNumber);
                          }}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (pagination.hasNext) {
                          handleChangePage((pagination.page || 1) + 1);
                        }
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </>
      )}
    </div>
  );
};
