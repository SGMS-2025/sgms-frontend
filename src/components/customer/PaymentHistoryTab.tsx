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
  User,
  Image as ImageIcon,
  ZoomIn,
  QrCode,
  Check,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useCustomerPaymentHistory } from '@/hooks/useCustomerPayments';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/utils/utils';
import { membershipApi } from '@/services/api/membershipApi';
import { serviceContractApi } from '@/services/api/serviceContractApi';
import { paymentApi } from '@/services/api/paymentApi';
import type { CustomerPaymentHistoryTransaction, CustomerPaymentHistoryPendingTransfer } from '@/types/api/Payment';

interface PaymentHistoryTabProps {
  customerId: string;
  onPaymentActionComplete?: () => void;
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

const getMethodLabel = (method: string, t: (key: string) => string) => {
  const methodMap: Record<string, string> = {
    CASH: t('payment_history.method.cash'),
    BANK_TRANSFER: t('payment_history.method.bank_transfer'),
    // QR_BANK and PAYOS are subtypes of BANK_TRANSFER, show as "Bank Transfer"
    QR_BANK: t('payment_history.method.bank_transfer'),
    PAYOS: t('payment_history.method.bank_transfer'),
    CARD: 'Card',
    SEPAY: 'SePay'
  };
  return methodMap[method] || method;
};

const getMethodBadgeColor = (method: string) => {
  switch (method) {
    case 'CASH':
      return 'bg-green-500/10 text-green-700 border-green-200';
    case 'BANK_TRANSFER':
    case 'QR_BANK':
    case 'PAYOS':
    case 'SEPAY':
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'CARD':
      return 'bg-purple-500/10 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-200';
  }
};

const getStatusBadgeProps = (status: string, t: (key: string) => string) => {
  switch (status) {
    case 'SUCCESS':
    case 'COMPLETED':
      return {
        icon: CheckCircle2,
        label: t('payment_history.status.success'),
        className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
      };
    case 'PENDING':
      return {
        icon: Clock,
        label: t('payment_history.status.pending'),
        className: 'bg-amber-500/10 text-amber-700 border-amber-200'
      };
    case 'FAILED':
      return {
        icon: XCircle,
        label: t('payment_history.status.failed'),
        className: 'bg-red-500/10 text-red-700 border-red-200'
      };
    case 'CANCELLED':
      return {
        icon: XCircle,
        label: t('payment_history.status.cancelled'),
        className: 'bg-gray-500/10 text-gray-700 border-gray-200'
      };
    default:
      return {
        icon: AlertCircle,
        label: status,
        className: 'bg-gray-500/10 text-gray-700 border-gray-200'
      };
  }
};

const getContractTypeBadge = (type: string, t: (key: string) => string) => {
  switch (type) {
    case 'MEMBERSHIP':
      return {
        label: t('payment_history.contract_type.membership_full'),
        className: 'bg-primary/10 text-primary border-primary/20'
      };
    case 'SERVICE':
      return {
        label: t('payment_history.contract_type.service_full'),
        className: 'bg-blue-500/10 text-blue-700 border-blue-200'
      };
    default:
      return { label: type, className: 'bg-gray-500/10 text-gray-700 border-gray-200' };
  }
};

const TransactionCard: React.FC<{ transaction: CustomerPaymentHistoryTransaction }> = ({ transaction }) => {
  const { t } = useTranslation();
  const statusBadge = getStatusBadgeProps(transaction.status, t);
  const StatusIcon = statusBadge.icon;
  const contractTypeBadge = getContractTypeBadge(transaction.contractType, t);

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
                  {getMethodLabel(transaction.method, t)}
                </Badge>
              </div>
              <h4 className="font-semibold text-foreground">
                {transaction.contractName &&
                transaction.contractName.trim() !== '' &&
                transaction.contractName !== 'N/A'
                  ? transaction.contractName
                  : t('payment_history.contract_name.unknown', 'Chưa có tên')}
              </h4>
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
                  <p className="text-xs text-muted-foreground">{t('payment_history.transaction.branch')}</p>
                  <p className="font-medium text-foreground">{transaction.branch.name}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 text-sm">
              <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('payment_history.transaction.time')}</p>
                <p className="font-medium text-foreground">{formatDateTime(transaction.occurredAt)}</p>
              </div>
            </div>

            {transaction.recordedBy && (
              <div className="flex items-start gap-2 text-sm">
                <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('payment_history.transaction.recorded_by')}</p>
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
                  <p className="text-xs text-muted-foreground">{t('payment_history.transaction.reference_code')}</p>
                  <p className="font-mono text-xs font-medium text-foreground">{transaction.referenceCode}</p>
                </div>
              </div>
            )}
          </div>

          {transaction.note && (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">{t('payment_history.transaction.note')}</p>
              <p className="mt-1 text-sm text-foreground">{transaction.note}</p>
            </div>
          )}

          {/* Transfer Receipt Image for QR_BANK */}
          {transaction.method === 'QR_BANK' && transaction.transferReceiptImage?.url && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground mb-2">{t('payment_history.transaction.transfer_receipt')}</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 hover:bg-muted">
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm">{t('payment_history.transaction.view_receipt')}</span>
                    <ZoomIn className="h-4 w-4 ml-auto" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                  <DialogDescription className="sr-only">
                    {t('payment_history.transaction.receipt_image')}
                  </DialogDescription>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{t('payment_history.transaction.receipt_image')}</h3>
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const PendingTransferCard: React.FC<{
  transfer: CustomerPaymentHistoryPendingTransfer;
  onActionComplete?: () => void;
}> = ({ transfer, onActionComplete }) => {
  const { t } = useTranslation();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const contractTypeBadge = getContractTypeBadge(transfer.contractType, t);
  const isQRBank = transfer.paymentMethod === 'QR_BANK';
  const isBankTransfer = transfer.paymentMethod === 'BANK_TRANSFER';

  const handleConfirmPayment = async () => {
    if (!transfer.contractId) {
      toast.error(t('payment_history.error.no_contract_id'));
      return;
    }

    try {
      setIsConfirming(true);
      if (transfer.contractType === 'MEMBERSHIP') {
        await membershipApi.confirmQRBankPayment(transfer.contractId);
      } else if (transfer.contractType === 'SERVICE') {
        await serviceContractApi.confirmQRBankPayment(transfer.contractId);
      }
      toast.success(t('payment_history.success.payment_confirmed'));
      onActionComplete?.();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errorMessage || t('payment_history.error.confirm_failed'));
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!transfer.orderCode) {
      toast.error(t('payment_history.error.no_order_code'));
      return;
    }

    // Prevent duplicate calls
    if (isCanceling) {
      return;
    }

    if (!confirm(t('payment_history.confirm_cancel'))) {
      return;
    }

    try {
      setIsCanceling(true);
      const response = await paymentApi.cancelPayOSPaymentLink(Number(transfer.orderCode), 'Cancelled by owner');

      // Only show success if cancellation was actually successful
      if (response?.success) {
        // Backend automatically cancels the membership/service contract when payment is cancelled
        // No need to call cancelMembership API from frontend - backend handles it in cancelPendingContractForTransaction

        toast.success(t('payment_history.success.payment_cancelled'));
        // Delay refetch to allow backend to update payment status, cancel contract, and socket event to process
        // This ensures the cancelled payment is filtered out from pending transfers and contract is updated
        setTimeout(() => {
          onActionComplete?.();
        }, 1000);
      } else {
        toast.error(response?.message || t('payment_history.error.cancel_failed'));
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err?.response?.data?.message || err?.message || t('payment_history.error.cancel_failed');
      toast.error(errorMessage);
    } finally {
      setIsCanceling(false);
    }
  };

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
                  {t('payment_history.status.waiting')}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn('text-xs font-medium', getMethodBadgeColor(transfer.paymentMethod))}
                >
                  {getMethodLabel(transfer.paymentMethod, t)}
                </Badge>
              </div>
              <h4 className="font-semibold text-foreground">
                {transfer.contractName && transfer.contractName.trim() !== '' && transfer.contractName !== 'N/A'
                  ? transfer.contractName
                  : t('payment_history.contract_name.unknown', 'Chưa có tên')}
              </h4>
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
                  <p className="text-xs text-muted-foreground">{t('payment_history.transaction.branch')}</p>
                  <p className="font-medium text-foreground">{transfer.branch.name}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 text-sm">
              <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('payment_history.pending.created_at')}</p>
                <p className="font-medium text-foreground">{formatDateTime(transfer.createdAt)}</p>
              </div>
            </div>

            {transfer.orderCode && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('payment_history.pending.order_code')}</p>
                  <p className="font-mono text-xs font-medium text-foreground">{transfer.orderCode}</p>
                </div>
              </div>
            )}

            {transfer.expiresAt && (
              <div className="flex items-start gap-2 text-sm">
                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('payment_history.pending.expires_at')}</p>
                  <p className="font-medium text-foreground">{formatDateTime(transfer.expiresAt)}</p>
                </div>
              </div>
            )}
          </div>

          {(transfer.bankAccount.name || transfer.bankAccount.number) && (
            <div className="rounded-lg border border-amber-200 bg-white/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">{t('payment_history.pending.transfer_info')}</p>
              {transfer.bankAccount.name && (
                <p className="mt-1 text-sm font-medium text-foreground">{transfer.bankAccount.name}</p>
              )}
              {transfer.bankAccount.number && (
                <p className="font-mono text-sm text-foreground">{transfer.bankAccount.number}</p>
              )}
              {transfer.bankAccount.bankCode && (
                <p className="text-xs text-muted-foreground">
                  {t('payment_history.pending.bank_label')}: {transfer.bankAccount.bankCode}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200">
            {isQRBank && (
              <Button
                onClick={handleConfirmPayment}
                disabled={isConfirming || isCanceling}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                size="sm"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('payment_history.action.confirming')}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {t('payment_history.action.confirm_payment')}
                  </>
                )}
              </Button>
            )}

            {isBankTransfer && transfer.qrCode && (
              <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                    <QrCode className="h-4 w-4 mr-2" />
                    {t('payment_history.action.view_qr')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogDescription className="sr-only">{t('payment_history.qr_code_title')}</DialogDescription>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{t('payment_history.qr_code_title')}</h3>
                    <div className="flex items-center justify-center bg-muted rounded-lg p-4">
                      <img
                        src={transfer.qrCode}
                        alt="QR Code"
                        className="max-w-full max-h-[400px] object-contain rounded-lg"
                      />
                    </div>
                    {transfer.checkoutUrl && (
                      <Button
                        onClick={() => window.open(transfer.checkoutUrl || undefined, '_blank')}
                        className="w-full"
                        variant="outline"
                      >
                        {t('payment_history.action.open_payment_link')}
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {isBankTransfer && transfer.orderCode && (
              <Button
                onClick={handleCancelPayment}
                disabled={isConfirming || isCanceling}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                {isCanceling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('payment_history.action.cancelling')}
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    {t('payment_history.action.cancel_payment')}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const PaymentHistoryTab: React.FC<PaymentHistoryTabProps> = ({ customerId, onPaymentActionComplete }) => {
  const { t } = useTranslation();
  const { data, loading, error, setQuery, refetch } = useCustomerPaymentHistory(customerId);
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [filterContractType, setFilterContractType] = useState<string>('ALL');

  const handleFilterChange = () => {
    // Map filter method to backend query
    // BANK_TRANSFER includes QR_BANK and PAYOS
    let methodFilter: string | null = null;
    if (filterMethod === 'ALL') {
      methodFilter = null;
    } else if (filterMethod === 'BANK_TRANSFER') {
      // Backend will handle filtering for BANK_TRANSFER, QR_BANK, and PAYOS
      methodFilter = 'BANK_TRANSFER';
    } else {
      methodFilter = filterMethod;
    }

    setQuery({
      method: methodFilter,
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
          <p className="text-sm text-muted-foreground">{t('payment_history.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="rounded-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('payment_history.error.title')}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-3 rounded-full">
          {t('payment_history.try_again')}
        </Button>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert className="rounded-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('payment_history.error.no_data')}</AlertTitle>
        <AlertDescription>{t('payment_history.error.no_data_description')}</AlertDescription>
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
                <p className="text-xs text-muted-foreground">{t('payment_history.summary.total_transactions_label')}</p>
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
                <p className="text-xs text-muted-foreground">{t('payment_history.summary.total_amount_label')}</p>
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
                <p className="text-xs text-muted-foreground">{t('payment_history.summary.cash_label')}</p>
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
                <p className="text-xs text-muted-foreground">{t('payment_history.summary.bank_transfer_label')}</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(
                    (summary.amountByMethod.BANK_TRANSFER || 0) +
                      (summary.amountByMethod.QR_BANK || 0) +
                      (summary.amountByMethod.PAYOS || 0)
                  )}
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
            <h3 className="text-lg font-semibold text-foreground">
              {t('payment_history.pending_count', { count: pendingTransfers.length })}
            </h3>
          </div>
          <div className="grid gap-4">
            {pendingTransfers.map((transfer) => (
              <PendingTransferCard
                key={transfer.paymentTransactionId}
                transfer={transfer}
                onActionComplete={() => {
                  refetch();
                  // Also refresh customer detail to update membership status
                  onPaymentActionComplete?.();
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterContractType} onValueChange={setFilterContractType}>
          <SelectTrigger className="w-[180px] rounded-full">
            <SelectValue placeholder={t('payment_history.filter.contract_type_placeholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('payment_history.filter.all_contracts')}</SelectItem>
            <SelectItem value="MEMBERSHIP">{t('payment_history.filter.membership')}</SelectItem>
            <SelectItem value="SERVICE">{t('payment_history.filter.service')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterMethod} onValueChange={setFilterMethod}>
          <SelectTrigger className="w-[180px] rounded-full">
            <SelectValue placeholder={t('payment_history.filter.method_placeholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('payment_history.filter.all_methods_text')}</SelectItem>
            <SelectItem value="CASH">{t('payment_history.method.cash')}</SelectItem>
            <SelectItem value="BANK_TRANSFER">{t('payment_history.method.bank_transfer')}</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleFilterChange} variant="outline" className="rounded-full">
          {t('payment_history.apply_filter')}
        </Button>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            {t('payment_history.transaction_history_title', { count: pagination.total })}
          </h3>
        </div>

        {transactions.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-border bg-muted/30 shadow-none">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-semibold text-foreground">{t('payment_history.no_transactions_title')}</p>
                <p className="text-sm text-muted-foreground">{t('payment_history.no_transactions_description')}</p>
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
              {t('payment_history.page_prev')}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t('payment_history.page_info', { current: pagination.page, total: pagination.totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              {t('payment_history.page_next')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
