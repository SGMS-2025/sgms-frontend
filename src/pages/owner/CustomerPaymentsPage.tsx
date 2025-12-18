import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import {
  Calendar as CalendarIcon,
  CreditCard,
  Loader2,
  RotateCcw,
  Search,
  TrendingUp,
  TrendingDown,
  Clock,
  XCircle,
  DollarSign,
  CheckCircle2,
  HelpCircle,
  Image as ImageIcon,
  ZoomIn
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useBranch } from '@/contexts/BranchContext';
import { useTransactions } from '@/hooks/useTransactions';
import { usePaymentsTour } from '@/hooks/usePaymentsTour';
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
  SETTLED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
  VOID: 'bg-gray-50 text-gray-600 border-gray-200'
};

const getStatusLabels = (
  t: (key: string, options?: Record<string, unknown>) => string
): Record<TransactionStatus, string> => ({
  SETTLED: t('payment.status.settled', { defaultValue: 'Hoàn tất' }),
  PENDING: t('payment.status.pending', { defaultValue: 'Đang chờ' }),
  FAILED: t('payment.status.failed', { defaultValue: 'Thất bại' }),
  VOID: t('payment.status.void', { defaultValue: 'Đa hủy' })
});

const getMethodLabels = (t: (key: string, options?: Record<string, unknown>) => string): Record<string, string> => ({
  CASH: t('payment.method.cash', { defaultValue: 'Tiền mặt' }),
  BANK_TRANSFER: t('payment.method.bank_transfer', { defaultValue: 'Chuyển khoản' }),
  QR_BANK: t('payment.method.qr_bank', { defaultValue: 'QR Bank' })
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

// Shadcn UI style Summary Card
const SummaryCard: React.FC<{
  title: string;
  value: string;
  caption?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  'data-tour'?: string;
}> = ({ title, value, caption, icon: Icon, trend = 'neutral', 'data-tour': dataTour }) => {
  const trendColors = {
    up: 'text-emerald-600',
    down: 'text-red-600',
    neutral: 'text-orange-600'
  };

  return (
    <Card data-tour={dataTour}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${trendColors[trend]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {caption && <p className="text-xs text-muted-foreground mt-1">{caption}</p>}
      </CardContent>
    </Card>
  );
};

// Status Badge
const StatusBadge: React.FC<{ status: TransactionStatus; statusLabels: Record<TransactionStatus, string> }> = ({
  status,
  statusLabels
}) => (
  <Badge variant="outline" className={`${statusClasses[status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
    {statusLabels[status] || status}
  </Badge>
);

// Payment Method Badge
const PaymentMethodBadge: React.FC<{ method: string }> = ({ method }) => {
  return (
    <Badge variant="secondary" className="font-normal">
      {method}
    </Badge>
  );
};

const CustomerPaymentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { branches, currentBranch } = useBranch();
  const { startPaymentsTour } = usePaymentsTour();
  const [searchTerm, setSearchTerm] = useState('');

  // Get translated labels
  const statusOptions = getStatusOptions(t);
  const statusLabels = getStatusLabels(t);
  const methodLabels = getMethodLabels(t);
  const subjectLabels = getSubjectLabels(t);

  const {
    transactions,
    loading,
    error,
    pagination,
    summary: apiSummary,
    query,
    setQuery,
    goToPage,
    refetch
  } = useTransactions();

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

  const computedSummary = useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        const amount = transaction.amount || 0;

        if (transaction.type === 'RECEIPT') {
          acc.totalAmount += amount;
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
          acc.totalAmount -= amount;
          acc.totalCount += 1;

          if (transaction.status === 'SETTLED') {
            acc.settledAmount -= amount;
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
  const summary = apiSummary || computedSummary;

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
  };

  const handleClearDateRange = () => {
    setQuery({ startDate: undefined, endDate: undefined });
  };

  const branchId = currentBranch?._id;

  // Keep branch filter in sync with global branch switch
  useEffect(() => {
    setQuery({ branchId });
  }, [branchId, setQuery]);

  // Generate pagination pages array with ellipsis
  const generatePaginationPages = useMemo(() => {
    return (currentPage: number, totalPages: number): Array<number | 'ellipsis'> => {
      const pages: Array<number | 'ellipsis'> = [];

      // If total pages <= 7, show all pages
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
        return pages;
      }

      // Always show first page
      pages.push(1);

      // Calculate if we need ellipsis
      const showEllipsisStart = currentPage > 3;
      const showEllipsisEnd = currentPage < totalPages - 2;

      if (showEllipsisStart) {
        pages.push('ellipsis');
      }

      // Show pages around current page
      const rangeStart = Math.max(2, currentPage - 1);
      const rangeEnd = Math.min(totalPages - 1, currentPage + 1);

      for (let i = rangeStart; i <= rangeEnd; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }

      if (showEllipsisEnd) {
        pages.push('ellipsis');
      }

      // Always show last page if more than 1 page
      if (totalPages > 1) {
        pages.push(totalPages);
      }

      return pages;
    };
  }, []);

  const renderTableSection = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p className="text-sm">{t('payment.loading_transactions', { defaultValue: 'Đang tải giao dịch...' })}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <XCircle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <CreditCard className="h-12 w-12 mb-2 opacity-20" />
          <p className="text-sm font-medium">
            {t('payment.no_transactions_found', { defaultValue: 'Không có giao dịch nào' })}
          </p>
          <p className="text-xs mt-1">
            {t('payment.no_transactions_hint', {
              defaultValue: 'Thử thay đổi bộ lọc để xem kết quả khác'
            })}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="rounded-md border" data-tour="payments-transactions-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">{t('payment.date', { defaultValue: 'Ngày' })}</TableHead>
                <TableHead className="w-[200px]">{t('payment.customer', { defaultValue: 'Khách hàng' })}</TableHead>
                <TableHead>{t('payment.contract', { defaultValue: 'Dịch vụ' })}</TableHead>
                <TableHead className="text-right">{t('payment.amount', { defaultValue: 'Số tiền' })}</TableHead>
                <TableHead>{t('payment.method', { defaultValue: 'Phương thức' })}</TableHead>
                <TableHead>{t('payment.status', { defaultValue: 'Trạng thái' })}</TableHead>
                <TableHead>{t('payment.performer', { defaultValue: 'Người thực hiện' })}</TableHead>
                <TableHead>{t('payment.reference_code', { defaultValue: 'Mã giao dịch' })}</TableHead>
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
                  <TableRow key={transaction._id}>
                    <TableCell className="font-medium">{occurredAt}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {userInfo?.fullName || t('common.not_available', { defaultValue: 'N/A' })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {userInfo?.phoneNumber || userInfo?.email || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{subjectName}</span>
                        <span className="text-xs text-muted-foreground">
                          {subjectLabels[transaction.subjectType] || subjectLabels.OTHER}
                          {branchName ? ` • ${branchName}` : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.type === 'REFUND' ? (
                        <div className="flex items-center justify-end gap-1 text-red-600">
                          <TrendingDown className="h-3 w-3" />
                          <span className="font-semibold">{formatCurrency(Math.abs(transaction.amount))}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 text-emerald-600">
                          <TrendingUp className="h-3 w-3" />
                          <span className="font-semibold">{formatCurrency(transaction.amount)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <PaymentMethodBadge method={methodLabel} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={transaction.status} statusLabels={statusLabels} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{resolvePerformerInfo(transaction.recordedBy, t)}</span>
                        {resolvePerformerEmail(transaction.recordedBy) && (
                          <span className="text-xs text-muted-foreground">
                            {resolvePerformerEmail(transaction.recordedBy)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <code className="text-xs font-mono">{reference || '-'}</code>
                        {transaction.note && (
                          <span className="text-xs text-muted-foreground italic">{transaction.note}</span>
                        )}
                        {transaction.method === 'QR_BANK' && transaction.transferReceiptImage?.url && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-7 text-xs">
                                <ImageIcon className="h-3 w-3" />
                                <span>
                                  {t('payment.view_transfer_image_button', {
                                    defaultValue: 'Xem ảnh chuyển khoản'
                                  })}
                                </span>
                                <ZoomIn className="h-3 w-3 ml-auto" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                  {t('payment.transfer_image_title', { defaultValue: 'Ảnh chuyển khoản' })}
                                </h3>
                                <div className="flex items-center justify-center bg-muted rounded-lg p-4">
                                  <img
                                    src={transaction.transferReceiptImage.url}
                                    alt="Transfer receipt"
                                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                                  />
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center mt-4" data-tour="payments-pagination">
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
                {(() => {
                  const currentPage = pagination.page || 1;
                  return generatePaginationPages(currentPage, pagination.totalPages).map((page, index) => {
                    if (page === 'ellipsis') {
                      return (
                        <PaginationItem key={`ellipsis-${currentPage}-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    return (
                      <PaginationItem key={`page-${page}`}>
                        <PaginationLink
                          href="#"
                          isActive={(pagination.page || 1) === page}
                          onClick={(event) => {
                            event.preventDefault();
                            goToPage(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  });
                })()}
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
        )}
      </>
    );
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t('payment.transaction_history_title', { defaultValue: 'Lịch sử giao dịch' })}
          </h2>
          <p className="text-muted-foreground">
            {t('payment.transaction_history_subtitle', {
              defaultValue: 'Theo dõi tổng quan giao dịch và dòng tiền tại câu lạc bộ'
            })}
          </p>
        </div>
        <div className="flex items-center gap-2" data-tour="payments-action-buttons">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('common.refresh', { defaultValue: 'Làm mới' })}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={startPaymentsTour}
            title={t('payment.tour.button', 'Hướng dẫn')}
          >
            <HelpCircle className="h-4 w-4 text-gray-500 hover:text-orange-500" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-tour="payments-stats-cards">
        <SummaryCard
          title={t('payment.summary_total_amount', { defaultValue: 'Tổng doanh thu' })}
          value={formatCurrency(summary.totalAmount)}
          caption={t('payment.summary_total_transactions', {
            defaultValue: '{{count}} giao dịch',
            count: summary.totalCount
          })}
          icon={DollarSign}
          trend="neutral"
          data-tour="payments-total-card"
        />
        <SummaryCard
          title={t('payment.summary_settled', { defaultValue: 'Đã thu' })}
          value={formatCurrency(summary.settledAmount)}
          caption={t('payment.summary_total_transactions', {
            defaultValue: '{{count}} giao dịch',
            count: summary.settledCount
          })}
          icon={CheckCircle2}
          trend="up"
        />
        <SummaryCard
          title={t('payment.summary_pending', { defaultValue: 'Đang chờ xử lý' })}
          value={formatCurrency(summary.pendingAmount)}
          caption={t('payment.summary_total_transactions', {
            defaultValue: '{{count}} giao dịch',
            count: summary.pendingCount
          })}
          icon={Clock}
          trend="neutral"
        />
        <SummaryCard
          title={t('payment.summary_failed', { defaultValue: 'Thất bại' })}
          value={formatCurrency(summary.failedAmount)}
          caption={t('payment.summary_total_transactions', {
            defaultValue: '{{count}} giao dịch',
            count: summary.failedCount
          })}
          icon={XCircle}
          trend="down"
        />
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payment.transactions', { defaultValue: 'Giao dịch' })}</CardTitle>
          <CardDescription>
            {t('payment.transactions_subtitle', { defaultValue: 'Danh sách giao dịch mới nhất' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" data-tour="payments-transactions-content">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-tour="payments-filters">
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('payment.search_transactions_placeholder', {
                    defaultValue: 'Tìm theo khách hàng, mã giao dịch...'
                  })}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="pl-8"
                  data-tour="payments-search-input"
                />
              </div>
            </div>

            <Select value={query.status || 'ALL'} onValueChange={handleStatusChange}>
              <SelectTrigger>
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

            {/* Date range filter - behavior similar to DiscountCampaignForm */}
            <Popover modal={false}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedRange?.from || selectedRange?.to
                    ? rangeLabel
                    : t('payment.date_range_placeholder', { defaultValue: 'Chọn khoảng thời gian' })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={selectedRange}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={1}
                  defaultMonth={selectedRange?.from ?? selectedRange?.to ?? new Date()}
                />
                {selectedRange && (
                  <div className="border-t p-3">
                    <Button variant="ghost" size="sm" onClick={handleClearDateRange} className="w-full">
                      {t('payment.clear_date_filter', { defaultValue: 'Xóa bộ lọc' })}
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          {/* Table */}
          {renderTableSection()}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerPaymentsPage;
