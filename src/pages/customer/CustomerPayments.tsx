import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTransactions } from '@/hooks/useTransactions';
import type { Transaction, TransactionStatus } from '@/types/api/Transaction';
import { Wallet, RefreshCcw, Clock3, CheckCircle2, Loader2, Receipt, ArrowDownCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const statusClasses: Record<TransactionStatus, string> = {
  SETTLED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
  VOID: 'bg-gray-50 text-gray-600 border-gray-200'
};

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND'
});

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short'
});

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return dateTimeFormatter.format(parsed);
};

const renderAmount = (transaction: Transaction, currencyLabel: string) => {
  const signedAmount = (transaction.amount || 0) * (transaction.type === 'REFUND' ? -1 : 1);
  const tone =
    transaction.type === 'REFUND'
      ? 'text-red-600'
      : transaction.status === 'SETTLED'
        ? 'text-emerald-700'
        : 'text-gray-800';

  return (
    <div className={`text-sm font-semibold ${tone}`}>
      {currencyFormatter.format(signedAmount)}
      {transaction.currency && transaction.currency !== 'VND' ? ` ${transaction.currency}` : currencyLabel}
    </div>
  );
};

const CustomerPayments: React.FC = () => {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { transactions, loading, error, pagination, summary, setQuery, goToPage, refetch } = useTransactions(
    {
      limit: 10,
      sortBy: 'occurredAt',
      sortOrder: 'desc'
    },
    { useSelfEndpoint: true }
  );

  const statusLabels = useMemo<Record<TransactionStatus, string>>(
    () => ({
      SETTLED: t('payment.status.settled', { defaultValue: 'Settled' }),
      PENDING: t('payment.status.pending', { defaultValue: 'Pending' }),
      FAILED: t('payment.status.failed', { defaultValue: 'Failed' }),
      VOID: t('payment.status.void', { defaultValue: 'Voided' })
    }),
    [t]
  );

  const methodLabels = useMemo<Record<string, string>>(
    () => ({
      CASH: t('payment.method.cash', { defaultValue: 'Cash' }),
      BANK_TRANSFER: t('payment.method.bank_transfer', { defaultValue: 'Bank transfer' }),
      QR_BANK: t('payment.method.qr_bank', { defaultValue: 'QR bank transfer' })
    }),
    [t]
  );

  const transactionSummary = useMemo(
    () =>
      summary ?? {
        totalAmount: 0,
        settledAmount: 0,
        pendingAmount: 0,
        failedAmount: 0,
        totalCount: 0,
        settledCount: 0,
        pendingCount: 0,
        failedCount: 0
      },
    [summary]
  );

  const handleStatusChange = (value: string) => {
    const nextValue = value as TransactionStatus | 'ALL';
    setStatusFilter(nextValue);
    setQuery({ status: nextValue });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setQuery({ search: value });
  };

  const currentPage = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;

  const resolveSubjectName = (transaction: Transaction): string => {
    if (
      transaction.subjectType === 'MEMBERSHIP' &&
      transaction.membershipPlanId &&
      typeof transaction.membershipPlanId !== 'string'
    ) {
      return (
        transaction.membershipPlanId.name || t('payment.subject.membership', { defaultValue: 'Membership package' })
      );
    }

    if (
      transaction.subjectType === 'SERVICE' &&
      transaction.servicePackageId &&
      typeof transaction.servicePackageId !== 'string'
    ) {
      return transaction.servicePackageId.name || t('payment.subject.service', { defaultValue: 'Service package' });
    }

    return transaction.subjectType === 'MEMBERSHIP'
      ? t('payment.subject.membership', { defaultValue: 'Membership package' })
      : t('payment.subject.service', { defaultValue: 'Service package' });
  };

  const currencyLabel = t('payment.currency.vnd', { defaultValue: '' });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900">
          {t('customer.payments.title', { defaultValue: 'Payment history' })}
        </h1>
        <p className="text-gray-600">
          {t('customer.payments.subtitle', { defaultValue: 'Track your payments and refunds.' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('customer.payments.summary.total', { defaultValue: 'Total value' })}
            </CardTitle>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {currencyFormatter.format(transactionSummary.totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('customer.payments.summary.total_caption', {
                defaultValue: '{{count}} transactions',
                count: transactionSummary.totalCount
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('customer.payments.summary.settled', { defaultValue: 'Completed' })}
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {currencyFormatter.format(transactionSummary.settledAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('customer.payments.summary.settled_caption', {
                defaultValue: '{{count}} successful transactions',
                count: transactionSummary.settledCount
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('customer.payments.summary.pending', { defaultValue: 'Processing' })}
            </CardTitle>
            <Clock3 className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {currencyFormatter.format(transactionSummary.pendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('customer.payments.summary.pending_caption', {
                defaultValue: '{{count}} pending transactions',
                count: transactionSummary.pendingCount
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base font-semibold text-gray-900">
            {t('customer.payments.filters.title', { defaultValue: 'Filters' })}
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Input
              placeholder={t('customer.payments.filters.search_placeholder', {
                defaultValue: 'Search by code, note or package name...'
              })}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full md:w-64"
            />
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue
                  placeholder={t('customer.payments.filters.status_placeholder', {
                    defaultValue: 'Status'
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('payment.status.all', { defaultValue: 'All statuses' })}</SelectItem>
                <SelectItem value="SETTLED">{statusLabels.SETTLED}</SelectItem>
                <SelectItem value="PENDING">{statusLabels.PENDING}</SelectItem>
                <SelectItem value="FAILED">{statusLabels.FAILED}</SelectItem>
                <SelectItem value="VOID">{statusLabels.VOID}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={refetch} className="inline-flex items-center gap-2">
              <RefreshCcw className="w-4 h-4" />
              {t('common.refresh', { defaultValue: 'Refresh' })}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">{t('customer.payments.table.time', { defaultValue: 'Time' })}</TableHead>
                <TableHead>{t('customer.payments.table.content', { defaultValue: 'Details' })}</TableHead>
                <TableHead className="text-right">
                  {t('customer.payments.table.amount', { defaultValue: 'Amount' })}
                </TableHead>
                <TableHead>{t('customer.payments.table.status', { defaultValue: 'Status' })}</TableHead>
                <TableHead>{t('customer.payments.table.method', { defaultValue: 'Method' })}</TableHead>
                <TableHead>{t('customer.payments.table.reference', { defaultValue: 'Reference code' })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-gray-600">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      {t('customer.payments.table.loading', { defaultValue: 'Loading your transactions...' })}
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!loading && error && (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center">
                    <div className="space-y-2">
                      <p className="text-sm text-red-600">
                        {t('customer.payments.table.error', {
                          defaultValue: 'Unable to load transactions: {{message}}',
                          message: error
                        })}
                      </p>
                      <Button size="sm" variant="outline" onClick={refetch}>
                        {t('common.retry', { defaultValue: 'Retry' })}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!loading && !error && transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-gray-600">
                    {t('customer.payments.table.empty', { defaultValue: 'No transactions yet.' })}
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                !error &&
                transactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell className="text-sm text-gray-700">
                      <div className="font-medium">{formatDateTime(transaction.occurredAt)}</div>
                      <p className="text-xs text-muted-foreground">
                        {transaction.type === 'REFUND'
                          ? t('customer.payments.table.type.refund', { defaultValue: 'Refund' })
                          : t('customer.payments.table.type.receipt', { defaultValue: 'Payment' })}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">{resolveSubjectName(transaction)}</div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{transaction.note || '—'}</p>
                    </TableCell>
                    <TableCell className="text-right align-middle">
                      {renderAmount(transaction, currencyLabel)}
                    </TableCell>
                    <TableCell className="align-middle">
                      <Badge variant="outline" className={statusClasses[transaction.status]}>
                        {statusLabels[transaction.status] || transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {methodLabels[transaction.method] || transaction.method}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {transaction.referenceCode || (transaction.meta?.reference as string) || '—'}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
        <div className="flex items-center justify-between px-6 py-4 text-sm text-gray-600">
          <div>
            {t('customer.payments.table.pagination', {
              defaultValue: 'Page {{page}} / {{totalPages}} • {{total}} transactions',
              page: currentPage,
              totalPages,
              total: pagination?.total ?? transactions.length
            })}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination?.hasPrev}
              onClick={() => goToPage(currentPage - 1)}
              className="inline-flex items-center gap-1"
            >
              <Receipt className="w-4 h-4" />
              {t('customer.payments.table.prev', { defaultValue: 'Prev' })}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination?.hasNext}
              onClick={() => goToPage(currentPage + 1)}
              className="inline-flex items-center gap-1"
            >
              <ArrowDownCircle className="w-4 h-4" />
              {t('customer.payments.table.next', { defaultValue: 'Next' })}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CustomerPayments;
