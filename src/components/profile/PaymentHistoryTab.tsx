import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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

const STATUS_BADGE_CLASS: Record<string, string> = {
  SETTLED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PAID: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  PROCESSING: 'bg-sky-100 text-sky-700 border-sky-200',
  FAILED: 'bg-red-100 text-red-700 border-red-200',
  CANCELED: 'bg-gray-100 text-gray-600 border-gray-200'
};

const formatDateTime = (value: string | Date | null | undefined, locale: string = 'vi-VN') => {
  if (!value) return '-';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short'
  });
  return formatter.format(parsed);
};

const formatCurrency = (value: number | null | undefined, locale: string = 'vi-VN') => {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'VND'
  });
  return formatter.format(value || 0);
};

const getStatusBadgeClass = (status: string) =>
  STATUS_BADGE_CLASS[status] || 'bg-slate-100 text-slate-700 border-slate-200';

const PendingTransferCard: React.FC<{
  transfer: CustomerPaymentHistoryPendingTransfer;
  t: (key: string) => string;
  locale: string;
}> = ({ transfer, t, locale }) => {
  const getContractTypeLabel = (type: string) => {
    switch (type) {
      case 'MEMBERSHIP':
        return t('payment_history.contract_type.membership');
      case 'SERVICE':
        return t('payment_history.contract_type.service');
      default:
        return type;
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50/60 p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">{transfer.contractName}</p>
          <p className="text-xs text-gray-500">
            {getContractTypeLabel(transfer.contractType)}
            {transfer.branch?.name ? ` • ${transfer.branch.name}` : ''}
          </p>
        </div>
        <Badge className={`${getStatusBadgeClass(transfer.status)} border`}>{transfer.status}</Badge>
      </div>

      <div className="grid gap-3 text-sm text-gray-600 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('payment_history.amount')}</p>
          <p className="font-semibold text-gray-900">{formatCurrency(transfer.amount, locale)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {t('payment_history.transfer_content')}
          </p>
          <p className="font-semibold text-gray-900">{transfer.orderCode || transfer.paymentCode || '-'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('payment_history.created_at')}</p>
          <p className="font-semibold text-gray-900">{formatDateTime(transfer.createdAt, locale)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('payment_history.expires_at')}</p>
          <p className="font-semibold text-gray-900">
            {transfer.expiresAt ? formatDateTime(transfer.expiresAt, locale) : t('payment_history.unknown')}
          </p>
        </div>
      </div>

      <Separator />

      <div className="grid gap-2 text-xs text-gray-600 md:grid-cols-2">
        <div>
          <p className="font-medium text-gray-600">{t('payment_history.bank')}</p>
          <p>
            {transfer.bankAccount.name || '-'}{' '}
            {transfer.bankAccount.bankCode ? `(${transfer.bankAccount.bankCode})` : ''}
          </p>
        </div>
        <div>
          <p className="font-medium text-gray-600">{t('payment_history.account_number')}</p>
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
              {t('payment_history.open_payment_page')}
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
  locale?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, highlight, suffix, locale = 'vi-VN' }) => (
  <div
    className={`rounded-xl border p-4 shadow-sm ${
      highlight ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-white' : 'border-gray-200 bg-white'
    }`}
  >
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
    <p className="mt-1 text-xl font-semibold text-gray-900">
      {suffix ? amount : formatCurrency(amount, locale)}
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
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
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

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH':
        return t('payment_history.method.cash');
      case 'BANK_TRANSFER':
        return t('payment_history.method.bank_transfer');
      case 'PAYOS':
        return t('payment_history.method.payos');
      default:
        return method;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SETTLED':
        return t('payment_history.status.settled');
      case 'PAID':
        return t('payment_history.status.paid');
      case 'PENDING':
        return t('payment_history.status.pending');
      case 'PROCESSING':
        return t('payment_history.status.processing');
      case 'FAILED':
        return t('payment_history.status.failed');
      case 'CANCELED':
        return t('payment_history.status.canceled');
      default:
        return status;
    }
  };

  const getContractTypeLabel = (type: string) => {
    switch (type) {
      case 'MEMBERSHIP':
        return t('payment_history.contract_type.membership');
      case 'SERVICE':
        return t('payment_history.contract_type.service');
      default:
        return type;
    }
  };

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
        <p className="text-sm font-medium text-gray-600">{t('payment_history.no_customer_id')}</p>
        <p className="mt-1 text-xs text-gray-500">{t('payment_history.contact_admin')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t('payment_history.title')}</h2>
          <p className="text-sm text-gray-500">{t('payment_history.description')}</p>
        </div>
        <Button
          variant="outline"
          className="border-orange-200 text-orange-600 hover:bg-orange-50"
          onClick={refetch}
          disabled={loading}
        >
          <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t('payment_history.refresh')}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <div className="mt-2">
            <Button size="sm" variant="secondary" onClick={refetch}>
              {t('payment_history.try_again')}
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard
          title={t('payment_history.summary.total_transactions')}
          amount={summary?.totalTransactions ?? 0}
          suffix={t('payment_history.summary.transactions_unit')}
          locale={locale}
        />
        <SummaryCard
          title={t('payment_history.summary.total_paid')}
          amount={summary?.totalAmount ?? 0}
          highlight
          locale={locale}
        />
        <SummaryCard
          title={t('payment_history.summary.pending_amount')}
          amount={summary?.pendingAmount ?? 0}
          highlight={Boolean(summary?.pendingAmount)}
          locale={locale}
        />
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {t('payment_history.summary.by_method')}
          </p>
          <div className="mt-2 space-y-1 text-sm text-gray-600">
            {amountByMethodEntries.length === 0 && <p>{t('payment_history.no_data')}</p>}
            {amountByMethodEntries.map((entry) => (
              <div key={entry.method} className="flex items-center justify-between">
                <span>{getMethodLabel(entry.method)}</span>
                <span className="font-semibold text-gray-900">{formatCurrency(entry.amount, locale)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {t('payment_history.filter.contract_type')}
              </label>
              <Select
                defaultValue={query.contractType ? String(query.contractType) : 'ALL'}
                onValueChange={handleContractTypeChange}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:ring-orange-500">
                  <SelectValue placeholder={t('payment_history.filter.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('payment_history.filter.all_contract_types')}</SelectItem>
                  <SelectItem value="MEMBERSHIP">{t('payment_history.contract_type.membership')}</SelectItem>
                  <SelectItem value="SERVICE">{t('payment_history.contract_type.service')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {t('payment_history.filter.method')}
              </label>
              <Select defaultValue={query.method ?? 'ALL'} onValueChange={handleMethodChange}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:ring-orange-500">
                  <SelectValue placeholder={t('payment_history.filter.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('payment_history.filter.all_methods')}</SelectItem>
                  <SelectItem value="CASH">{t('payment_history.method.cash')}</SelectItem>
                  <SelectItem value="BANK_TRANSFER">{t('payment_history.method.bank_transfer')}</SelectItem>
                  <SelectItem value="PAYOS">{t('payment_history.method.payos')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {t('payment_history.filter.status')}
              </label>
              <Select defaultValue={query.status ?? 'ALL'} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:ring-orange-500">
                  <SelectValue placeholder={t('payment_history.filter.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('payment_history.filter.all_statuses')}</SelectItem>
                  <SelectItem value="SETTLED">{t('payment_history.status.settled')}</SelectItem>
                  <SelectItem value="PAID">{t('payment_history.status.paid')}</SelectItem>
                  <SelectItem value="PENDING">{t('payment_history.status.pending')}</SelectItem>
                  <SelectItem value="PROCESSING">{t('payment_history.status.processing')}</SelectItem>
                  <SelectItem value="FAILED">{t('payment_history.status.failed')}</SelectItem>
                  <SelectItem value="CANCELED">{t('payment_history.status.canceled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {t('payment_history.filter.show_pending')}
              </label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{t('payment_history.filter.include_pending')}</span>
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
                <h3 className="text-base font-semibold text-gray-900">{t('payment_history.pending_transactions')}</h3>
                <p className="text-sm text-gray-500">{t('payment_history.pending_description')}</p>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {pendingTransfers.map((transfer) => (
                  <PendingTransferCard key={transfer.paymentTransactionId} transfer={transfer} t={t} locale={locale} />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{t('payment_history.recent_transactions')}</h3>
                <p className="text-sm text-gray-500">{t('payment_history.recent_description')}</p>
              </div>
              {summary?.totalTransactions !== undefined && (
                <div className="text-sm text-gray-500">
                  {t('payment_history.total_transactions_count', {
                    count: summary.totalTransactions
                  })}
                </div>
              )}
            </div>

            {transactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
                {t('payment_history.no_transactions_filter')}
              </div>
            ) : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('payment_history.table.time')}</TableHead>
                        <TableHead>{t('payment_history.table.contract')}</TableHead>
                        <TableHead>{t('payment_history.table.branch')}</TableHead>
                        <TableHead>{t('payment_history.table.method')}</TableHead>
                        <TableHead>{t('payment_history.table.amount')}</TableHead>
                        <TableHead>{t('payment_history.table.status')}</TableHead>
                        <TableHead>{t('payment_history.table.reference')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.transactionId}>
                          <TableCell className="font-medium text-gray-900">
                            {formatDateTime(transaction.occurredAt, locale)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{transaction.contractName}</span>
                              <span className="text-xs text-gray-500">
                                {getContractTypeLabel(transaction.contractType)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{transaction.branch?.name || '-'}</TableCell>
                          <TableCell>{getMethodLabel(transaction.method)}</TableCell>
                          <TableCell className="font-semibold text-gray-900">
                            {formatCurrency(transaction.amount, locale)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusBadgeClass(transaction.status)} border`}>
                              {getStatusLabel(transaction.status)}
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
