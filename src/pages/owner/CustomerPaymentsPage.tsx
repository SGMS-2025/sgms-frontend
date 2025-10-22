import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, CreditCard, RotateCcw } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBranch } from '@/contexts/BranchContext';
import { useCustomerPaymentLedger } from '@/hooks/useCustomerPayments';
import { CustomerPaymentHistoryModal } from '@/components/modals/CustomerPaymentHistoryModal';
import type { PaymentLedgerItem, PaymentContractType } from '@/types/api/Payment';

const contractTypeOptions: Array<{ value: PaymentContractType | 'ALL'; labelKey: string; defaultLabel: string }> = [
  { value: 'ALL', labelKey: 'payment.contract_type_all', defaultLabel: 'All contracts' },
  { value: 'MEMBERSHIP', labelKey: 'payment.contract_type_membership', defaultLabel: 'Membership' },
  { value: 'SERVICE', labelKey: 'payment.contract_type_service', defaultLabel: 'Service package' }
];

const paymentMethodOptions: Array<{ value: string; labelKey: string; defaultLabel: string }> = [
  { value: 'ALL', labelKey: 'payment.method_all', defaultLabel: 'All methods' },
  { value: 'CASH', labelKey: 'payment.method_cash', defaultLabel: 'Cash' },
  { value: 'BANK_TRANSFER', labelKey: 'payment.method_bank_transfer', defaultLabel: 'Bank transfer' },
  { value: 'CARD', labelKey: 'payment.method_card', defaultLabel: 'Card' },
  { value: 'QR_CODE', labelKey: 'payment.method_qr', defaultLabel: 'QR' }
];

const statusOptions = [
  { value: 'ALL', labelKey: 'payment.status_all', defaultLabel: 'All status' },
  { value: 'PENDING_ACTIVATION', labelKey: 'payment.status_pending_activation', defaultLabel: 'Pending activation' },
  { value: 'ACTIVE', labelKey: 'payment.status_active', defaultLabel: 'Active' },
  { value: 'PAST_DUE', labelKey: 'payment.status_past_due', defaultLabel: 'Past due' },
  { value: 'CANCELED', labelKey: 'payment.status_canceled', defaultLabel: 'Canceled' },
  { value: 'EXPIRED', labelKey: 'payment.status_expired', defaultLabel: 'Expired' }
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const PaymentSummaryCell: React.FC<{ item: PaymentLedgerItem }> = ({ item }) => {
  const pendingTransfers = item.paymentSummary.pendingTransfers;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">CASH:</span>
        <span className="font-medium text-gray-900">{formatCurrency(item.paymentSummary.paidByMethod.CASH)}</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">BANK:</span>
        <span className="font-medium text-gray-900">
          {formatCurrency(item.paymentSummary.paidByMethod.BANK_TRANSFER)}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">CARD:</span>
        <span className="font-medium text-gray-900">{formatCurrency(item.paymentSummary.paidByMethod.CARD)}</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">QR:</span>
        <span className="font-medium text-gray-900">{formatCurrency(item.paymentSummary.paidByMethod.QR_CODE)}</span>
      </div>
      {pendingTransfers.length > 0 && (
        <Badge variant="secondary" className="mt-1">
          {pendingTransfers.length} pending / {formatCurrency(item.paymentSummary.pendingAmount)}
        </Badge>
      )}
    </div>
  );
};

const CustomerPaymentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { branches, currentBranch } = useBranch();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<PaymentLedgerItem | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const { items, loading, error, pagination, query, setQuery, goToPage, refetch } = useCustomerPaymentLedger({
    branchId: currentBranch?._id || undefined,
    contractType: undefined,
    paymentMethod: undefined,
    status: undefined,
    search: undefined
  });

  const handleOpenHistory = (item: PaymentLedgerItem) => {
    setSelectedItem(item);
    setHistoryModalOpen(true);
  };

  const handleCloseHistory = () => {
    setHistoryModalOpen(false);
    setSelectedItem(null);
  };

  const handleBranchChange = (value: string) => {
    setQuery({ branchId: value === 'ALL' ? null : value, page: 1 });
  };

  const handleContractTypeChange = (value: string) => {
    setQuery({ contractType: value === 'ALL' ? undefined : (value as PaymentContractType), page: 1 });
  };

  const handlePaymentMethodChange = (value: string) => {
    if (value === 'ALL') {
      setQuery({ paymentMethod: undefined, page: 1 });
    } else {
      setQuery({ paymentMethod: value, page: 1 });
    }
  };

  const handleStatusChange = (value: string) => {
    if (value === 'ALL') {
      setQuery({ status: undefined, page: 1 });
    } else {
      setQuery({ status: value, page: 1 });
    }
  };

  const handleSearch = () => {
    setQuery({ search: searchTerm.trim() || undefined, page: 1 });
  };

  const renderStatus = (status: string) => {
    const statusClasses: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700 border-green-200',
      PENDING_ACTIVATION: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      PAST_DUE: 'bg-red-100 text-red-700 border-red-200',
      CANCELED: 'bg-gray-100 text-gray-600 border-gray-200',
      EXPIRED: 'bg-gray-100 text-gray-600 border-gray-200'
    };

    return <Badge className={statusClasses[status] || 'bg-gray-100 text-gray-600 border-gray-200'}>{status}</Badge>;
  };

  const totalSummary = useMemo(() => {
    const totals = items.reduce(
      (acc, item) => {
        acc.totalAmount += item.totalAmount || 0;
        acc.paidAmount += item.paidAmount || 0;
        acc.debtAmount += item.debtAmount || 0;
        acc.pendingAmount += item.paymentSummary.pendingAmount || 0;
        return acc;
      },
      {
        totalAmount: 0,
        paidAmount: 0,
        debtAmount: 0,
        pendingAmount: 0
      }
    );

    return totals;
  }, [items]);

  return (
    <div className="min-h-screen bg-gray-50 rounded-3xl overflow-hidden space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <CreditCard className="w-5 h-5 text-orange-500" />
            {t('payment.customer_ledger_title', { defaultValue: 'Customer Payments Overview' })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {t('common.branch', { defaultValue: 'Branch' })}
              </label>
              <Select value={query.branchId || 'ALL'} onValueChange={handleBranchChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.branch', { defaultValue: 'Branch' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('common.all', { defaultValue: 'All' })}</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch._id} value={branch._id}>
                      {branch.branchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {t('payment.contract_type', { defaultValue: 'Contract Type' })}
              </label>
              <Select value={query.contractType || 'ALL'} onValueChange={handleContractTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('payment.contract_type', { defaultValue: 'Contract type' })} />
                </SelectTrigger>
                <SelectContent>
                  {contractTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey, { defaultValue: option.defaultLabel })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {t('payment.method', { defaultValue: 'Payment method' })}
              </label>
              <Select value={query.paymentMethod || 'ALL'} onValueChange={handlePaymentMethodChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('payment.method', { defaultValue: 'Payment method' })} />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey, { defaultValue: option.defaultLabel })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {t('payment.status', { defaultValue: 'Status' })}
              </label>
              <Select value={query.status || 'ALL'} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('payment.status', { defaultValue: 'Status' })} />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey, { defaultValue: option.defaultLabel })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 lg:col-span-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {t('common.search', { defaultValue: 'Search' })}
              </label>
              <div className="flex gap-2">
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t('payment.search_placeholder', {
                    defaultValue: 'Search by customer, phone, contract…'
                  })}
                />
                <Button variant="outline" onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center gap-6 text-sm text-gray-700">
              <div>
                <p className="text-xs uppercase text-gray-500">
                  {t('payment.total_amount', { defaultValue: 'Total amount' })}
                </p>
                <p className="font-semibold text-gray-900">{formatCurrency(totalSummary.totalAmount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">
                  {t('payment.total_paid', { defaultValue: 'Total paid' })}
                </p>
                <p className="font-semibold text-gray-900">{formatCurrency(totalSummary.paidAmount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">
                  {t('payment.total_debt', { defaultValue: 'Total debt' })}
                </p>
                <p className="font-semibold text-orange-600">{formatCurrency(totalSummary.debtAmount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">
                  {t('payment.pending_amount', { defaultValue: 'Pending amount' })}
                </p>
                <p className="font-semibold text-blue-600">{formatCurrency(totalSummary.pendingAmount)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refetch}>
                <RotateCcw className="w-4 h-4 mr-2" />
                {t('common.refresh', { defaultValue: 'Refresh' })}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle>{t('payment.contracts_overview', { defaultValue: 'Contracts' })}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center items-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              {t('payment.loading_data', { defaultValue: 'Loading payment data…' })}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600 text-sm">{error}</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              {t('payment.no_data', { defaultValue: 'No payment data found for the selected filters.' })}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('payment.customer', { defaultValue: 'Customer' })}</TableHead>
                    <TableHead>{t('common.branch', { defaultValue: 'Branch' })}</TableHead>
                    <TableHead>{t('payment.contract', { defaultValue: 'Contract' })}</TableHead>
                    <TableHead className="text-right">{t('payment.total_amount', { defaultValue: 'Total' })}</TableHead>
                    <TableHead className="text-right">{t('payment.total_paid', { defaultValue: 'Paid' })}</TableHead>
                    <TableHead className="text-right text-orange-600">
                      {t('payment.total_debt', { defaultValue: 'Debt' })}
                    </TableHead>
                    <TableHead>{t('payment.method_breakdown', { defaultValue: 'Method breakdown' })}</TableHead>
                    <TableHead>{t('payment.last_payment', { defaultValue: 'Last payment' })}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={`${item.contractType}-${item.contractId}`}>
                      <TableCell>
                        {(() => {
                          const name =
                            item.customer.name?.trim() && item.customer.name !== item.customer.id
                              ? item.customer.name
                              : null;
                          const phone =
                            item.customer.phone?.trim() && item.customer.phone !== 'N/A' ? item.customer.phone : null;
                          const email =
                            item.customer.email?.trim() && item.customer.email !== 'N/A' ? item.customer.email : null;
                          return (
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-900">
                                {name || t('common.unknown', { defaultValue: 'Unknown' })}
                              </span>
                              <span className="text-xs text-gray-500">
                                {phone || t('common.not_available', { defaultValue: 'N/A' })}
                              </span>
                              <span className="text-xs text-gray-500">
                                {email || t('common.not_available', { defaultValue: 'N/A' })}
                              </span>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-800">{item.branch?.name || t('common.no_branch')}</div>
                        <div className="text-xs text-gray-500">{renderStatus(item.status)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{item.contractName}</span>
                          <span className="text-xs uppercase text-gray-500">{item.contractType}</span>
                          <span className="text-xs text-gray-400">
                            {item.startDate ? new Date(item.startDate).toLocaleDateString() : '-'} →{' '}
                            {item.endDate ? new Date(item.endDate).toLocaleDateString() : '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        {formatCurrency(item.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        {formatCurrency(item.paidAmount)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-orange-600">
                        {formatCurrency(item.debtAmount)}
                      </TableCell>
                      <TableCell>
                        <PaymentSummaryCell item={item} />
                      </TableCell>
                      <TableCell>
                        {item.paymentSummary.lastPayment ? (
                          <div className="flex flex-col text-sm text-gray-700">
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(item.paymentSummary.lastPayment.amount)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {item.paymentSummary.lastPayment.method} •{' '}
                              {new Date(item.paymentSummary.lastPayment.occurredAt).toLocaleString()}
                            </span>
                            {item.paymentSummary.lastPayment.recordedBy && (
                              <span className="text-xs text-gray-500">
                                {item.paymentSummary.lastPayment.recordedBy.name}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {t('payment.no_transactions', { defaultValue: 'No transactions' })}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => handleOpenHistory(item)}>
                          {t('payment.view_history', { defaultValue: 'View history' })}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination && pagination.totalPages > 1 && (
                <div className="py-4 flex justify-center">
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
              )}
            </>
          )}
        </CardContent>
      </Card>

      <CustomerPaymentHistoryModal
        open={historyModalOpen}
        onClose={handleCloseHistory}
        customerId={selectedItem?.customer.id || null}
        ledgerItem={selectedItem}
      />
    </div>
  );
};

export default CustomerPaymentsPage;
