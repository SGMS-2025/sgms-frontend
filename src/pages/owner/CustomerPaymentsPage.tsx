import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Calendar as CalendarIcon, CreditCard, Loader2, RotateCcw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useBranch } from '@/contexts/BranchContext';
import { useTransactions } from '@/hooks/useTransactions';
import type {
  Transaction,
  TransactionBranch,
  TransactionCustomer,
  TransactionCustomerUser,
  TransactionRecordedBy,
  TransactionStatus,
  TransactionSubjectType
} from '@/types/api/Transaction';

const getStatusOptions = (
  t: (key: string, options?: Record<string, unknown>) => string
): Array<{ value: TransactionStatus | 'ALL'; label: string }> => [
  { value: 'ALL', label: t('payment.status.all', { defaultValue: 'Tất cả trạng thái' }) },
  { value: 'SETTLED', label: t('payment.status.settled', { defaultValue: 'Hoàn tất' }) },
  { value: 'PENDING', label: t('payment.status.pending', { defaultValue: 'Đang chờ' }) },
  { value: 'FAILED', label: t('payment.status.failed', { defaultValue: 'Thất bại' }) },
  { value: 'VOID', label: t('payment.status.void', { defaultValue: 'Đã hủy' }) }
];

const statusClasses: Record<TransactionStatus, string> = {
  SETTLED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  FAILED: 'bg-red-100 text-red-700 border-red-200',
  VOID: 'bg-gray-100 text-gray-600 border-gray-200'
};

const getStatusLabels = (
  t: (key: string, options?: Record<string, unknown>) => string
): Record<TransactionStatus, string> => ({
  SETTLED: t('payment.status.settled', { defaultValue: 'Hoàn tất' }),
  PENDING: t('payment.status.pending', { defaultValue: 'Đang chờ' }),
  FAILED: t('payment.status.failed', { defaultValue: 'Thất bại' }),
  VOID: t('payment.status.void', { defaultValue: 'Đã hủy' })
});

const getMethodLabels = (t: (key: string, options?: Record<string, unknown>) => string): Record<string, string> => ({
  CASH: t('payment.method.cash', { defaultValue: 'Tiền mặt' }),
  BANK_TRANSFER: t('payment.method.bank_transfer', { defaultValue: 'Chuyển khoản' })
});

const getSubjectLabels = (
  t: (key: string, options?: Record<string, unknown>) => string
): Record<TransactionSubjectType | 'OTHER', string> => ({
  MEMBERSHIP: t('payment.subject.membership', { defaultValue: 'Gói hội viên' }),
  SERVICE: t('payment.subject.service', { defaultValue: 'Gói dịch vụ' }),
  OTHER: t('payment.subject.other', { defaultValue: 'Khác' })
});

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short'
});

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND'
});

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return dateTimeFormatter.format(parsed);
};

const formatCurrency = (value: number | null | undefined) => currencyFormatter.format(value ?? 0);

const resolveUserInfo = (customer: TransactionCustomer | string): TransactionCustomerUser | null => {
  if (!customer || typeof customer === 'string') {
    return null;
  }

  const user = customer.userId;
  if (!user || typeof user === 'string') {
    return null;
  }

  return user;
};

const resolveBranchName = (
  branch: TransactionBranch | string | undefined,
  branchNameById: Map<string, string>
): string | null => {
  if (!branch) return null;

  if (typeof branch === 'string') {
    return branchNameById.get(branch) ?? null;
  }

  return branch.branchName || branchNameById.get(branch._id) || null;
};

const resolveSubjectName = (
  transaction: Transaction,
  t: (key: string, options?: Record<string, unknown>) => string
): string => {
  const subjectLabels = getSubjectLabels(t);

  if (
    transaction.subjectType === 'MEMBERSHIP' &&
    transaction.membershipPlanId &&
    typeof transaction.membershipPlanId !== 'string'
  ) {
    return transaction.membershipPlanId.name || subjectLabels.MEMBERSHIP;
  }

  if (
    transaction.subjectType === 'SERVICE' &&
    transaction.servicePackageId &&
    typeof transaction.servicePackageId !== 'string'
  ) {
    return transaction.servicePackageId.name || subjectLabels.SERVICE;
  }

  return subjectLabels[transaction.subjectType] || subjectLabels.OTHER;
};

const resolvePerformerInfo = (
  recordedBy: TransactionRecordedBy | string | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string
): string => {
  if (!recordedBy) {
    return t('common.not_available', { defaultValue: 'N/A' });
  }

  if (typeof recordedBy === 'string') {
    return recordedBy;
  }

  return recordedBy.fullName || recordedBy.email || t('common.not_available', { defaultValue: 'N/A' });
};

const resolvePerformerEmail = (recordedBy: TransactionRecordedBy | string | null | undefined): string | null => {
  if (!recordedBy || typeof recordedBy === 'string') {
    return null;
  }

  return recordedBy.email || null;
};

const SummaryCard: React.FC<{
  title: string;
  value: string;
  caption?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}> = ({ title, value, caption, tone = 'default' }) => {
  const toneClasses: Record<string, string> = {
    default: 'border-gray-200 bg-white text-gray-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-red-200 bg-red-50 text-red-700'
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {caption ? <p className="mt-2 text-xs text-gray-500">{caption}</p> : null}
    </div>
  );
};

const StatusPill: React.FC<{ status: TransactionStatus; statusLabels: Record<TransactionStatus, string> }> = ({
  status,
  statusLabels
}) => (
  <Badge className={`${statusClasses[status] || 'bg-slate-100 text-slate-700 border-slate-200'} px-3 py-1 font-medium`}>
    {statusLabels[status] || status}
  </Badge>
);

const CustomerPaymentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { branches } = useBranch();
  const [searchTerm, setSearchTerm] = useState('');

  // Get translated labels
  const statusOptions = getStatusOptions(t);
  const statusLabels = getStatusLabels(t);
  const methodLabels = getMethodLabels(t);
  const subjectLabels = getSubjectLabels(t);

  const { transactions, loading, error, pagination, query, setQuery, goToPage, refetch } = useTransactions();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const branchNameById = useMemo(() => {
    return new Map(branches.map((branch) => [branch._id, branch.branchName]));
  }, [branches]);

  const selectedRange = useMemo<DateRange | undefined>(() => {
    if (!query.startDate && !query.endDate) {
      return undefined;
    }

    const from = query.startDate ? new Date(query.startDate) : undefined;
    const to = query.endDate ? new Date(query.endDate) : undefined;

    if (from && Number.isNaN(from.getTime())) {
      return undefined;
    }

    if (to && Number.isNaN(to.getTime())) {
      return { from };
    }

    if (from || to) {
      return { from: from || to || undefined, to };
    }

    return undefined;
  }, [query.startDate, query.endDate]);

  const rangeLabel = useMemo(() => {
    if (!selectedRange?.from && !selectedRange?.to) {
      return t('payment.date_range_placeholder', { defaultValue: 'All dates' });
    }

    const formatDisplay = (date: Date | undefined) =>
      date ? format(date, 'dd/MM/yyyy') : t('payment.date_range_placeholder', { defaultValue: 'All dates' });

    if (selectedRange?.from && selectedRange?.to) {
      return `${formatDisplay(selectedRange.from)} - ${formatDisplay(selectedRange.to)}`;
    }

    return formatDisplay(selectedRange?.from || selectedRange?.to);
  }, [selectedRange, t]);

  const summary = useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        const amount = transaction.amount || 0;

        // For revenue calculation, we need to consider transaction type
        // RECEIPT transactions are positive (money in)
        // REFUND transactions should reduce total (subtract from total)
        if (transaction.type === 'RECEIPT') {
          acc.totalAmount += amount; // Positive amount for receipts
          acc.totalCount += 1;

          if (transaction.status === 'SETTLED') {
            acc.settledAmount += amount;
            acc.settledCount += 1;
          } else if (transaction.status === 'PENDING') {
            acc.pendingAmount += amount;
            acc.pendingCount += 1;
          } else if (transaction.status === 'FAILED') {
            acc.failedAmount += amount;
            acc.failedCount += 1;
          }
        } else if (transaction.type === 'REFUND') {
          // Refunds reduce the total amount (subtract from total)
          acc.totalAmount -= amount; // Subtract refund amount from total
          acc.totalCount += 1;

          if (transaction.status === 'SETTLED') {
            acc.settledAmount -= amount; // Subtract from settled amount
            acc.settledCount += 1;
          } else if (transaction.status === 'PENDING') {
            acc.pendingAmount -= amount;
            acc.pendingCount += 1;
          } else if (transaction.status === 'FAILED') {
            acc.failedAmount -= amount;
            acc.failedCount += 1;
          }
        }

        return acc;
      },
      {
        totalAmount: 0,
        settledAmount: 0,
        pendingAmount: 0,
        failedAmount: 0,
        totalCount: 0,
        settledCount: 0,
        pendingCount: 0,
        failedCount: 0
      }
    );
  }, [transactions]);

  const handleBranchChange = (value: string) => {
    setQuery({ branchId: value === 'ALL' ? undefined : value });
  };

  const handleStatusChange = (value: string) => {
    if (value === 'ALL') {
      setQuery({ status: 'ALL' });
    } else {
      setQuery({ status: value as TransactionStatus });
    }
  };

  const handleSearch = () => {
    setQuery({ search: searchTerm.trim() || undefined });
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (!range) {
      setQuery({ startDate: undefined, endDate: undefined });
      return;
    }

    const startValue = range.from ? format(range.from, 'yyyy-MM-dd') : undefined;
    const endValue = range.to ? format(range.to, 'yyyy-MM-dd') : undefined;

    setQuery({
      startDate: startValue,
      endDate: endValue
    });

    if (range.from && range.to) {
      setDatePickerOpen(false);
    }
  };

  const handleClearDateRange = () => {
    setQuery({ startDate: undefined, endDate: undefined });
    setDatePickerOpen(false);
  };

  const renderTableSection = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          {t('payment.loading_transactions', { defaultValue: 'Đang tải giao dịch...' })}
        </div>
      );
    }

    if (error) {
      return <div className="py-12 text-center text-sm text-red-600">{error}</div>;
    }

    if (transactions.length === 0) {
      return (
        <div className="py-12 text-center text-sm text-gray-500">
          {t('payment.no_transactions_found', { defaultValue: 'Không có giao dịch nào' })}
        </div>
      );
    }

    return (
      <>
        <ScrollArea className="max-h-[520px] rounded-2xl border border-gray-100">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow className="border-b border-gray-100">
                <TableHead className="w-40 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t('payment.date', { defaultValue: 'Ngày' })}
                </TableHead>
                <TableHead className="w-52 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t('payment.customer', { defaultValue: 'Khách hàng' })}
                </TableHead>
                <TableHead className="w-64 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t('payment.contract', { defaultValue: 'Dịch vụ' })}
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t('payment.amount', { defaultValue: 'Số tiền' })}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t('payment.method', { defaultValue: 'Phương thức' })}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t('payment.status', { defaultValue: 'Trạng thái' })}
                </TableHead>
                <TableHead className="w-48 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t('payment.performer', { defaultValue: 'Người thực hiện' })}
                </TableHead>
                <TableHead className="w-56 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t('payment.reference_code', { defaultValue: 'Mã giao dịch' })}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => {
                const userInfo = resolveUserInfo(transaction.customerId);
                const branchName = resolveBranchName(transaction.branchId, branchNameById);
                const subjectName = resolveSubjectName(transaction, t);
                const methodLabel = methodLabels[transaction.method] || transaction.method;
                const occurredAt = formatDateTime(transaction.occurredAt);
                const reference =
                  transaction.referenceCode ||
                  (transaction.meta && typeof transaction.meta === 'object'
                    ? (transaction.meta as { reference?: string }).reference
                    : null);

                return (
                  <TableRow key={transaction._id} className="border-b border-gray-100 last:border-b-0">
                    <TableCell className="align-top text-sm font-medium text-gray-900">{occurredAt}</TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {userInfo?.fullName || t('common.not_available', { defaultValue: 'N/A' })}
                        </span>
                        <span className="text-xs text-gray-500">{userInfo?.phoneNumber || userInfo?.email || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-gray-900">{subjectName}</span>
                        <span className="text-xs text-gray-500">
                          {subjectLabels[transaction.subjectType] || subjectLabels.OTHER}
                          {branchName ? ` • ${branchName}` : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-right text-sm font-semibold text-gray-900">
                      {transaction.type === 'REFUND' ? (
                        <span className="text-red-600">{formatCurrency(Math.abs(transaction.amount))}</span>
                      ) : (
                        <span className="text-green-600">{formatCurrency(transaction.amount)}</span>
                      )}
                    </TableCell>
                    <TableCell className="align-top text-sm text-gray-700">{methodLabel}</TableCell>
                    <TableCell className="align-top">
                      <StatusPill status={transaction.status} statusLabels={statusLabels} />
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {resolvePerformerInfo(transaction.recordedBy, t)}
                        </span>
                        {resolvePerformerEmail(transaction.recordedBy) ? (
                          <span className="text-xs text-gray-500">{resolvePerformerEmail(transaction.recordedBy)}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-col gap-1 text-sm text-gray-800">
                        <span className="font-semibold">{reference || '-'}</span>
                        {transaction.note ? <span className="text-xs text-gray-500">{transaction.note}</span> : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex justify-center pt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (pagination.hasPrev) {
                        goToPage((pagination.page || 1) - 1);
                      }
                    }}
                  />
                </PaginationItem>
                {Array.from({ length: pagination.totalPages }).map((_, index) => (
                  <PaginationItem key={`page-${index + 1}`}>
                    <PaginationLink
                      href="#"
                      isActive={pagination.page === index + 1}
                      onClick={(event) => {
                        event.preventDefault();
                        goToPage(index + 1);
                      }}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (pagination.hasNext) {
                        goToPage((pagination.page || 1) + 1);
                      }
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : null}
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
            <CreditCard className="h-6 w-6 text-orange-500" />
            {t('payment.transaction_history_title', { defaultValue: 'Lịch sử giao dịch' })}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('payment.transaction_history_subtitle', {
              defaultValue: 'Theo dõi tổng quan giao dịch và dòng tiền tại câu lạc bộ'
            })}
          </p>
        </div>
        <Button variant="outline" className="self-start" onClick={refetch}>
          <RotateCcw className="mr-2 h-4 w-4" />
          {t('common.refresh', { defaultValue: 'Làm mới' })}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title={t('payment.summary_total_amount', { defaultValue: 'Tổng doanh thu' })}
          value={formatCurrency(summary.totalAmount)}
          caption={t('payment.summary_total_transactions', {
            defaultValue: '{{count}} giao dịch',
            count: summary.totalCount
          })}
        />
        <SummaryCard
          title={t('payment.summary_settled', { defaultValue: 'Đã thu' })}
          value={formatCurrency(summary.settledAmount)}
          caption={t('payment.summary_total_transactions', {
            defaultValue: '{{count}} giao dịch',
            count: summary.settledCount
          })}
          tone="success"
        />
        <SummaryCard
          title={t('payment.summary_pending', { defaultValue: 'Đang chờ xử lý' })}
          value={formatCurrency(summary.pendingAmount)}
          caption={t('payment.summary_total_transactions', {
            defaultValue: '{{count}} giao dịch',
            count: summary.pendingCount
          })}
          tone="warning"
        />
        <SummaryCard
          title={t('payment.summary_failed', { defaultValue: 'Thất bại' })}
          value={formatCurrency(summary.failedAmount)}
          caption={t('payment.summary_total_transactions', {
            defaultValue: '{{count}} giao dịch',
            count: summary.failedCount
          })}
          tone="danger"
        />
      </div>

      <Card className="border-none bg-white shadow-sm">
        <CardContent className="space-y-6 p-6">
          <div className="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,2.3fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1.3fr)]">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('common.search', { defaultValue: 'Tìm kiếm' })}
              </label>
              <div className="relative">
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  placeholder={t('payment.search_transactions_placeholder', {
                    defaultValue: 'Tìm theo khách hàng, mã giao dịch hoặc mô tả'
                  })}
                  className="h-11 pr-12"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 rounded-xl border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50"
                  onClick={handleSearch}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('common.branch', { defaultValue: 'Chi nhánh' })}
              </label>
              <Select value={query.branchId || 'ALL'} onValueChange={handleBranchChange}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200">
                  <SelectValue placeholder={t('common.branch', { defaultValue: 'Chi nhánh' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('common.all', { defaultValue: 'Tất cả' })}</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch._id} value={branch._id}>
                      {branch.branchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('payment.status', { defaultValue: 'Trạng thái' })}
              </label>
              <Select value={query.status || 'ALL'} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200">
                  <SelectValue placeholder={t('payment.status', { defaultValue: 'Trạng thái' })} />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('payment.date_range', { defaultValue: 'Khoảng thời gian' })}
              </label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex h-11 w-full items-center justify-start gap-2 rounded-xl border-gray-200 px-3 text-left font-medium text-gray-700"
                  >
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span className="truncate">
                      {selectedRange?.from || selectedRange?.to
                        ? rangeLabel
                        : t('payment.date_range_placeholder', { defaultValue: 'Tất cả thời gian' })}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="range"
                    numberOfMonths={1}
                    selected={selectedRange}
                    onSelect={handleDateRangeChange}
                    defaultMonth={selectedRange?.from ?? selectedRange?.to ?? new Date()}
                  />
                  <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-4 py-2">
                    <span className="text-xs text-gray-500">{rangeLabel}</span>
                    {selectedRange ? (
                      <Button variant="ghost" size="sm" onClick={handleClearDateRange}>
                        {t('payment.clear_date_filter', { defaultValue: 'Xóa bộ lọc ngày' })}
                      </Button>
                    ) : null}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t('payment.transactions', { defaultValue: 'Giao dịch' })}
              </h2>
              <p className="text-sm text-gray-500">
                {t('payment.transactions_subtitle', { defaultValue: 'Danh sách giao dịch mới nhất' })}
              </p>
            </div>

            {renderTableSection()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerPaymentsPage;
