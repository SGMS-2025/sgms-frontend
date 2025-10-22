import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { useCustomerPaymentHistory } from '@/hooks/useCustomerPayments';
import type { PaymentLedgerItem, CustomerPaymentHistoryResponse } from '@/types/api/Payment';

interface CustomerPaymentHistoryModalProps {
  open: boolean;
  onClose: () => void;
  customerId: string | null;
  ledgerItem: PaymentLedgerItem | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const formatDateTime = (value: string | Date | null | undefined) => {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, 'dd/MM/yyyy HH:mm');
};

const PaymentSummaryCard: React.FC<{ title: string; amount: number; highlight?: boolean }> = ({
  title,
  amount,
  highlight
}) => (
  <div
    className={`p-4 rounded-xl border ${
      highlight ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-700'
    }`}
  >
    <p className="text-xs font-medium uppercase tracking-wide mb-1">{title}</p>
    <p className="text-xl font-semibold">
      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)}
    </p>
  </div>
);

const PendingTransferCard: React.FC<{
  transfer: NonNullable<CustomerPaymentHistoryResponse['pendingTransfers'][number]>;
  t: (key: string, options?: Record<string, unknown>) => string;
}> = ({ transfer, t }) => {
  const statusColor =
    transfer.status === 'PENDING'
      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
      : transfer.status === 'PROCESSING'
        ? 'bg-blue-100 text-blue-700 border-blue-200'
        : 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <div className="p-3 rounded-lg border border-gray-200 bg-white space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{transfer.contractName}</p>
          <p className="text-xs text-gray-500">
            {transfer.branch?.name ? `${t('common.branch')}: ${transfer.branch.name}` : t('common.no_branch')}
          </p>
        </div>
        <Badge className={statusColor}>{transfer.status}</Badge>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div>
          <p className="font-medium text-gray-700">{t('payment.amount')}</p>
          <p className="text-sm font-semibold text-gray-900">{formatCurrency(transfer.amount)}</p>
        </div>
        <div>
          <p className="font-medium text-gray-700">{t('payment.transfer_content')}</p>
          <p className="text-sm text-gray-900">{transfer.orderCode || transfer.paymentCode || '-'}</p>
        </div>
        <div>
          <p className="font-medium text-gray-700">{t('common.created_at')}</p>
          <p className="text-sm text-gray-900">{formatDateTime(transfer.createdAt)}</p>
        </div>
        <div>
          <p className="font-medium text-gray-700">{t('payment.expires_at')}</p>
          <p className="text-sm text-gray-900">{transfer.expiresAt ? formatDateTime(transfer.expiresAt) : '-'}</p>
        </div>
      </div>

      <div className="text-xs text-gray-600 space-y-1">
        <p className="font-medium text-gray-700">{t('payment.bank_info')}</p>
        <p>
          {transfer.bankAccount.name || '-'} ({transfer.bankAccount.bankCode || 'N/A'})
        </p>
        <p>{transfer.bankAccount.number || '-'}</p>
        {transfer.checkoutUrl && (
          <a
            href={transfer.checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 hover:text-orange-700"
          >
            {t('payment.open_payment_page')}
          </a>
        )}
      </div>
    </div>
  );
};

export const CustomerPaymentHistoryModal: React.FC<CustomerPaymentHistoryModalProps> = ({
  open,
  onClose,
  customerId,
  ledgerItem
}) => {
  const { t } = useTranslation();
  const { data, loading, error } = useCustomerPaymentHistory(customerId, {
    branchId: ledgerItem?.branch?.id || undefined,
    contractType: ledgerItem?.contractType,
    contractId: ledgerItem?.contractId,
    includePending: true
  });

  const summary = data?.summary;
  const transactions = data?.transactions || [];
  const pendingTransfers = data?.pendingTransfers || [];

  const hasPending = pendingTransfers.length > 0;

  const amountByMethodDisplay = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.amountByMethod || {}).map(([method, amount]) => ({
      method,
      amount
    }));
  }, [summary]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {t('payment.customer_payment_history', { defaultValue: 'Customer Payment History' })}
          </DialogTitle>
          <DialogDescription>
            {ledgerItem
              ? `${ledgerItem.customer.name} • ${ledgerItem.contractName} • ${ledgerItem.branch?.name || t('common.no_branch')}`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-2">
          {loading && (
            <div className="py-10 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
          )}

          {error && <div className="p-4 border border-red-200 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

          {!loading && !error && data && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <PaymentSummaryCard
                  title={t('payment.total_amount', { defaultValue: 'Total Amount' })}
                  amount={summary?.totalAmount || 0}
                />
                <PaymentSummaryCard
                  title={t('payment.pending_amount', { defaultValue: 'Pending Amount' })}
                  amount={summary?.pendingAmount || 0}
                  highlight={summary?.pendingAmount ? summary.pendingAmount > 0 : false}
                />
                <PaymentSummaryCard
                  title={t('payment.total_transactions', { defaultValue: 'Total Transactions' })}
                  amount={summary?.totalTransactions || 0}
                />
                <div className="p-4 rounded-xl border border-gray-200 bg-white">
                  <p className="text-xs font-medium uppercase tracking-wide mb-1">
                    {t('payment.by_method', { defaultValue: 'By Method' })}
                  </p>
                  <div className="space-y-1 text-sm text-gray-700">
                    {amountByMethodDisplay.length === 0 && (
                      <p>{t('payment.no_transactions', { defaultValue: 'No transactions' })}</p>
                    )}
                    {amountByMethodDisplay.map((entry) => (
                      <p key={entry.method} className="flex justify-between">
                        <span>{entry.method}</span>
                        <span className="font-semibold">{formatCurrency(entry.amount)}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <Tabs defaultValue={hasPending ? 'pending' : 'transactions'}>
                <TabsList>
                  {hasPending && (
                    <TabsTrigger value="pending">
                      {t('payment.pending_transfers', { defaultValue: 'Pending Transfers' })}{' '}
                      <Badge variant="secondary" className="ml-2">
                        {pendingTransfers.length}
                      </Badge>
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="transactions">
                    {t('payment.transactions', { defaultValue: 'Transactions' })}
                  </TabsTrigger>
                </TabsList>

                {hasPending && (
                  <TabsContent value="pending" className="mt-4">
                    <div className="space-y-3">
                      {pendingTransfers.map((transfer) => (
                        <PendingTransferCard key={transfer.paymentTransactionId} transfer={transfer} t={t} />
                      ))}
                    </div>
                  </TabsContent>
                )}

                <TabsContent value="transactions" className="mt-4">
                  {transactions.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-500">
                      {t('payment.no_transactions_found', { defaultValue: 'No transactions found' })}
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[420px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('payment.date', { defaultValue: 'Date' })}</TableHead>
                            <TableHead>{t('payment.contract', { defaultValue: 'Contract' })}</TableHead>
                            <TableHead>{t('common.branch', { defaultValue: 'Branch' })}</TableHead>
                            <TableHead>{t('payment.method', { defaultValue: 'Method' })}</TableHead>
                            <TableHead className="text-right">
                              {t('payment.amount', { defaultValue: 'Amount' })}
                            </TableHead>
                            <TableHead>{t('payment.recorded_by', { defaultValue: 'Recorded by' })}</TableHead>
                            <TableHead>{t('payment.reference_code', { defaultValue: 'Reference' })}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow key={transaction.transactionId}>
                              <TableCell>{formatDateTime(transaction.occurredAt)}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm text-gray-900">{transaction.contractName}</span>
                                  <span className="text-xs uppercase text-gray-500">{transaction.contractType}</span>
                                </div>
                              </TableCell>
                              <TableCell>{transaction.branch?.name || t('common.no_branch')}</TableCell>
                              <TableCell>{transaction.method}</TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell>
                                {transaction.recordedBy ? (
                                  <div className="flex flex-col">
                                    <span className="text-sm text-gray-900">{transaction.recordedBy.name}</span>
                                    <span className="text-xs text-gray-500">{transaction.recordedBy.email}</span>
                                  </div>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell>{transaction.referenceCode || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
