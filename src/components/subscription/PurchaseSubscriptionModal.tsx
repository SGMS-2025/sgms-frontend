import { useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  DollarSign,
  Building2,
  Check,
  Calendar,
  AlertCircle,
  QrCode,
  Copy,
  Clock,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { subscriptionApi } from '@/services/api/subscriptionApi';
import { extractAndTranslateApiError } from '@/utils/errorHandler';
import { usePaymentSocket } from '@/hooks/usePaymentSocket';
import type {
  SubscriptionPackage,
  PaymentTransactionInfo,
  PurchaseSubscriptionResponse
} from '@/types/api/Subscription';

interface PurchaseSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package: SubscriptionPackage | null;
  onSuccess?: () => void;
}

type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'PAYOS';
type FlowStep = 'details' | 'bank-qr' | 'bank-wait' | 'bank-success';

export const PurchaseSubscriptionModal = ({
  open,
  onOpenChange,
  package: pkg,
  onSuccess
}: PurchaseSubscriptionModalProps) => {
  const { t } = useTranslation();

  const paymentMethods = [
    {
      value: 'CASH' as PaymentMethod,
      label: t('subscription.modal.payment.cash'),
      description: t('subscription.modal.payment.cashDesc'),
      icon: DollarSign,
      available: true
    },
    {
      value: 'BANK_TRANSFER' as PaymentMethod,
      label: t('subscription.modal.payment.bankTransfer'),
      description: t('subscription.modal.payment.bankTransferDesc'),
      icon: Building2,
      available: true
    },
    {
      value: 'CREDIT_CARD' as PaymentMethod,
      label: t('subscription.modal.payment.creditCard'),
      description: t('subscription.modal.payment.creditCardDesc'),
      icon: CreditCard,
      available: false
    }
  ];
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [months, setMonths] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<FlowStep>('details');
  const [paymentTransaction, setPaymentTransaction] = useState<PaymentTransactionInfo | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'expired'>('pending');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [initialTimeRemaining, setInitialTimeRemaining] = useState<number>(0);
  const [isPolling, setIsPolling] = useState(false);

  const allowedMonths = [1, 3, 6, 9, 12];
  const features = Array.isArray(pkg?.features) ? pkg?.features : [];
  const featurePreview = features.slice(0, 4);

  // Reset state when modal closes or package changes
  useEffect(() => {
    if (!open) {
      setMonths(1);
      setPaymentMethod('CASH');
      setPaymentTransaction(null);
      setPaymentStatus('pending');
      setTimeRemaining(0);
      setInitialTimeRemaining(0);
      setIsPolling(false);
      setCurrentStep('details');
    }
  }, [open]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('subscription.payment.copied'), {
      description: `${label}: ${text}`
    });
  };

  // Live countdown for bank transfer expiry
  useEffect(() => {
    if (!open || !paymentTransaction) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(paymentTransaction.expiresAt).getTime();
      const remaining = Math.max(0, expires - now);
      setTimeRemaining(remaining);

      if (remaining === 0 && paymentStatus === 'pending') {
        setPaymentStatus('expired');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [open, paymentTransaction, paymentStatus]);

  // Real-time socket listener
  const { isConnected } = usePaymentSocket({
    paymentTransactionId: paymentTransaction?._id,
    enabled: currentStep === 'bank-wait' && paymentStatus === 'pending',
    onPaymentPaid: (payment) => {
      console.log('[PurchaseSubscriptionModal] Payment paid via socket:', payment);
      setPaymentStatus('paid');
      setCurrentStep('bank-success');
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
      }, 1600);
    }
  });

  // Fallback polling if socket not connected
  useEffect(() => {
    if (!open || !paymentTransaction || paymentStatus !== 'pending' || currentStep !== 'bank-wait') return;
    if (isConnected) return;

    const checkPayment = async () => {
      if (isPolling) return;
      setIsPolling(true);
      try {
        const result = await subscriptionApi.checkPaymentStatus(paymentTransaction._id);
        if (result.success && result.data.status === 'PAID') {
          setPaymentStatus('paid');
          setCurrentStep('bank-success');
          toast.success(t('subscription.payment.success'));
          setTimeout(() => {
            onOpenChange(false);
            onSuccess?.();
          }, 1600);
        }
      } catch (error) {
        console.error('[PurchaseSubscriptionModal] Error checking payment:', error);
      } finally {
        setIsPolling(false);
      }
    };

    const interval = setInterval(checkPayment, 5000);
    return () => clearInterval(interval);
  }, [open, paymentTransaction, paymentStatus, currentStep, isConnected, isPolling, t, onOpenChange, onSuccess]);

  const progressPercent = useMemo(() => {
    if (!paymentTransaction || initialTimeRemaining === 0) return 0;
    const elapsed = Math.max(0, initialTimeRemaining - timeRemaining);
    return Math.min(100, (elapsed / initialTimeRemaining) * 100);
  }, [paymentTransaction, initialTimeRemaining, timeRemaining]);

  const startBankFlow = (tx: PaymentTransactionInfo) => {
    setPaymentTransaction(tx);
    setPaymentStatus('pending');
    setInitialTimeRemaining(Math.max(0, new Date(tx.expiresAt).getTime() - new Date().getTime()));
    setTimeRemaining(Math.max(0, new Date(tx.expiresAt).getTime() - new Date().getTime()));
    setCurrentStep('bank-qr');
  };

  const resetFlow = () => {
    setPaymentTransaction(null);
    setPaymentStatus('pending');
    setTimeRemaining(0);
    setInitialTimeRemaining(0);
    setIsPolling(false);
    setCurrentStep('details');
  };

  const handleSubmit = async () => {
    if (!pkg) return;

    setIsSubmitting(true);

    try {
      const result = await subscriptionApi.purchaseSubscription({
        packageId: pkg._id,
        paymentMethod,
        months: Number(months)
      });

      if (result.success) {
        // Bank transfer flow
        const responseData = result.data as PurchaseSubscriptionResponse['data'];
        if (
          typeof responseData === 'object' &&
          'status' in responseData &&
          responseData.status === 'PENDING_PAYMENT' &&
          'paymentTransaction' in responseData
        ) {
          const txData = responseData.paymentTransaction as PaymentTransactionInfo;
          startBankFlow(txData);
        } else {
          toast.success(t('subscription.modal.success.title'), {
            description: t('subscription.modal.success.description')
          });
          onOpenChange(false);
          onSuccess?.();
        }
      }
    } catch (error: unknown) {
      const errorMessage = extractAndTranslateApiError(error, t, 'subscription.modal.error');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pkg) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
        <div className="relative overflow-hidden rounded-3xl border border-orange-100 bg-white/90 shadow-[0_32px_90px_rgba(244,114,36,0.18)] backdrop-blur">
          <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-orange-100/50 blur-3xl"></div>
          <div className="pointer-events-none absolute -right-10 -bottom-10 h-72 w-72 rounded-full bg-amber-100/60 blur-3xl"></div>

          <DialogHeader className="relative z-10 flex flex-col gap-1 border-b border-orange-100/80 px-8 pt-7 pb-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">{t('subscription.modal.title')}</DialogTitle>
                <DialogDescription className="mt-2 text-sm text-gray-600">
                  {t('subscription.modal.description')}
                </DialogDescription>
              </div>
              <div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600 border border-orange-100">
                {t('subscription.modal.secure', 'Secure checkout')}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
              {[
                { key: 'details', label: t('subscription.modal.step.plan', 'Plan & billing') },
                { key: 'payment', label: t('subscription.modal.step.payment', 'Payment') },
                { key: 'confirmation', label: t('subscription.modal.step.confirmation', 'Confirmation') }
              ].map((step, index) => {
                const isActive =
                  (step.key === 'details' && currentStep === 'details') ||
                  (step.key === 'payment' &&
                    currentStep !== 'details' &&
                    currentStep !== 'bank-success' &&
                    paymentStatus !== 'expired') ||
                  (step.key === 'confirmation' && (currentStep === 'bank-success' || paymentStatus === 'expired'));

                const isDone =
                  (step.key === 'details' && currentStep !== 'details') ||
                  (step.key === 'payment' && (currentStep === 'bank-success' || paymentStatus === 'expired'));

                return (
                  <div key={step.key} className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        isDone
                          ? 'bg-green-500 text-white'
                          : isActive
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    <span className={isActive || isDone ? 'text-gray-900' : ''}>{step.label}</span>
                    {index < 2 && <div className="h-px w-8 rounded-full bg-gray-200"></div>}
                  </div>
                );
              })}
            </div>
          </DialogHeader>

          <ScrollArea className="relative z-10 max-h-[70vh]">
            {currentStep === 'details' && (
              <div className="grid gap-6 px-8 py-6 lg:grid-cols-[1.1fr_1fr]">
                {/* Snapshot column */}
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-orange-100 shadow-[0_20px_60px_rgba(244,114,36,0.14)]">
                    <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-orange-200/40 blur-3xl"></div>
                    <div className="pointer-events-none absolute left-10 bottom-0 h-24 w-24 rounded-full bg-amber-200/40 blur-2xl"></div>
                    <div className="relative z-10 space-y-5 p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-600">
                            {t('subscription.card.planLabel')}
                          </p>
                          <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                        </div>
                        <div className="rounded-xl border border-orange-100 bg-white/70 px-4 py-2 text-right shadow-sm backdrop-blur">
                          <p className="text-xs font-medium text-orange-600">{t('subscription.modal.pricePerMonth')}</p>
                          <p className="text-2xl font-extrabold text-orange-600">{formatPrice(pkg.price)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/70 bg-white/70 p-3 shadow-inner shadow-orange-50">
                          <p className="text-xs font-medium text-orange-600">{t('subscription.modal.branches')}</p>
                          <p className="text-lg font-bold text-gray-900">
                            {t('subscription.modal.max')} {pkg.maxBranches}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/70 bg-white/70 p-3 shadow-inner shadow-orange-50">
                          <p className="text-xs font-medium text-orange-600">{t('subscription.modal.customers')}</p>
                          <p className="text-lg font-bold text-gray-900">
                            {t('subscription.modal.max')} {pkg.maxCustomers}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-orange-100 bg-white/80 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-semibold text-orange-700">
                            <DollarSign className="h-4 w-4" />
                            {t('subscription.modal.totalPayment')}
                          </div>
                          <div className="text-3xl font-extrabold text-orange-600">
                            {formatPrice(pkg.price * months)}
                          </div>
                        </div>
                        {months > 1 && (
                          <p className="mt-2 text-xs text-gray-500 text-right">
                            {months} {t('subscription.modal.month')} × {formatPrice(pkg.price)}
                          </p>
                        )}
                      </div>

                      {featurePreview.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                            {t('subscription.modal.includes', 'What you get')}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {featurePreview.map((item, idx) => (
                              <span
                                key={idx}
                                className="rounded-full border border-orange-100 bg-white/80 px-3 py-1 text-xs font-medium text-gray-800 shadow-sm"
                              >
                                {item}
                              </span>
                            ))}
                            {features.length > featurePreview.length && (
                              <span className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                                +{features.length - featurePreview.length}{' '}
                                {t('subscription.modal.moreFeatures', 'more')}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Controls column */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-orange-100 bg-white/90 p-5 shadow-sm">
                    <Label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      {t('subscription.modal.selectMonths')}
                    </Label>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                      {allowedMonths.map((month) => (
                        <button
                          key={month}
                          type="button"
                          onClick={() => setMonths(month)}
                          className={`relative flex h-20 flex-col items-center justify-center rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                            months === month
                              ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/40 scale-[1.02]'
                              : 'border-orange-100 bg-white text-orange-700 hover:border-orange-300 hover:bg-orange-50'
                          }`}
                        >
                          {months === month && (
                            <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-orange-600 shadow">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                          <span className="text-lg">{month}</span>
                          <span className="text-[11px] opacity-80">{t('subscription.modal.month')}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-orange-100 bg-white/90 p-5 shadow-sm">
                    <Label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <CreditCard className="h-4 w-4 text-orange-500" />
                      {t('subscription.modal.paymentMethod')}
                    </Label>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                    >
                      <div className="space-y-2">
                        {paymentMethods.map((method) => (
                          <div
                            key={method.value}
                            className={`relative flex items-center gap-3 rounded-xl border-2 p-3 transition-all duration-200 ${
                              paymentMethod === method.value
                                ? 'border-orange-500/80 bg-gradient-to-r from-orange-50 to-white shadow-md shadow-orange-500/10'
                                : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/40'
                            } ${!method.available ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                            onClick={() => method.available && setPaymentMethod(method.value)}
                          >
                            <RadioGroupItem
                              value={method.value}
                              id={method.value}
                              disabled={!method.available}
                              className={paymentMethod === method.value ? 'border-orange-500' : ''}
                            />
                            <div
                              className={`rounded-lg border p-2 ${
                                paymentMethod === method.value
                                  ? 'border-orange-200 bg-orange-50'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <method.icon
                                className={`h-4 w-4 ${paymentMethod === method.value ? 'text-orange-600' : 'text-gray-500'}`}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <label
                                htmlFor={method.value}
                                className={`flex items-center gap-2 text-sm font-semibold ${
                                  paymentMethod === method.value ? 'text-orange-900' : 'text-gray-800'
                                }`}
                              >
                                <span className="truncate">{method.label}</span>
                                {!method.available && (
                                  <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                                    {t('subscription.modal.payment.comingSoon')}
                                  </span>
                                )}
                              </label>
                              <p
                                className={`mt-0.5 text-xs ${paymentMethod === method.value ? 'text-orange-600' : 'text-gray-500'}`}
                              >
                                {method.description}
                              </p>
                            </div>
                            {paymentMethod === method.value && (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </RadioGroup>

                    {paymentMethod === 'BANK_TRANSFER' && (
                      <Alert className="mt-4 border-orange-200 bg-orange-50/70">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-sm text-orange-900">
                          {t('subscription.modal.bankTransfer.willShowQR')}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep !== 'details' && paymentTransaction && (
              <div className="px-8 py-6 space-y-6">
                {/* Bank QR Step */}
                {currentStep === 'bank-qr' && (
                  <div className="space-y-5">
                    <Alert className="border-orange-200 bg-orange-50/60">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="flex items-center justify-between text-sm text-orange-900">
                        <span>{t('subscription.payment.expiresIn')}</span>
                        <Badge variant="outline" className="border-orange-300 bg-white text-orange-700">
                          {formatTime(timeRemaining)}
                        </Badge>
                      </AlertDescription>
                    </Alert>

                    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                      <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5 shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-lg font-bold text-orange-900">
                            <QrCode className="h-5 w-5" />
                            {t('subscription.payment.scanQR')}
                          </div>
                          <div className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                            {formatPrice(paymentTransaction.amount)}
                          </div>
                        </div>
                        <div className="mt-4 flex justify-center">
                          <div className="rounded-2xl border-2 border-orange-100 bg-white p-4 shadow-inner">
                            <img
                              src={paymentTransaction.qrCodeUrl}
                              alt="QR Code"
                              className="h-56 w-56 object-contain"
                            />
                          </div>
                        </div>
                        <p className="mt-3 text-center text-sm text-gray-600">
                          {t('subscription.payment.scanInstructions')}
                        </p>
                      </div>

                      <div className="space-y-3 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                              {t('subscription.payment.paymentCode')}
                            </p>
                            <p className="font-mono text-2xl font-bold text-gray-900">
                              {paymentTransaction.paymentCode}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-orange-600 hover:bg-orange-50"
                            onClick={() =>
                              copyToClipboard(paymentTransaction.paymentCode, t('subscription.payment.paymentCode'))
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-orange-700">{t('subscription.payment.paymentCodeHint')}</p>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">{t('subscription.payment.bankName')}</p>
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-900">{paymentTransaction.bankCode}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:bg-gray-200"
                                onClick={() =>
                                  copyToClipboard(paymentTransaction.bankCode, t('subscription.payment.bankName'))
                                }
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">{t('subscription.payment.accountNumber')}</p>
                            <div className="mt-1 flex items-center justify-between">
                              <span className="font-mono text-sm font-semibold text-gray-900">
                                {paymentTransaction.bankAccountNumber}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:bg-gray-200"
                                onClick={() =>
                                  copyToClipboard(
                                    paymentTransaction.bankAccountNumber,
                                    t('subscription.payment.accountNumber')
                                  )
                                }
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">{t('subscription.payment.accountName')}</p>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900">
                              {paymentTransaction.bankAccountName}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:bg-gray-200"
                              onClick={() =>
                                copyToClipboard(
                                  paymentTransaction.bankAccountName,
                                  t('subscription.payment.accountName')
                                )
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <Button variant="outline" className="h-11 border-gray-200" onClick={resetFlow}>
                        {t('subscription.payment.backToMethods', 'Change payment method')}
                      </Button>
                      <Button
                        className="h-11 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/40 hover:-translate-y-0.5"
                        onClick={() => setCurrentStep('bank-wait')}
                      >
                        {t('subscription.payment.transferred')}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Waiting */}
                {currentStep === 'bank-wait' && paymentStatus === 'pending' && (
                  <div className="space-y-5">
                    <div
                      className={`rounded-xl border p-4 ${
                        isConnected ? 'border-green-200 bg-green-50/60' : 'border-yellow-200 bg-yellow-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {isConnected ? (
                          <>
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-green-900">{t('subscription.payment.realtimeConnected')}</span>
                          </>
                        ) : (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-yellow-700" />
                            <span className="text-yellow-900">{t('subscription.payment.checkingPeriodically')}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-8 text-center shadow">
                      <div className="relative mx-auto h-20 w-20">
                        <Loader2 className="h-20 w-20 animate-spin text-orange-500 opacity-70" />
                        <Clock className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-orange-600" />
                      </div>
                      <h3 className="mt-4 text-xl font-bold text-gray-900">{t('subscription.payment.waitingTitle')}</h3>
                      <p className="mt-1 text-sm text-gray-600">{t('subscription.payment.waitingSubtitle')}</p>

                      <div className="mt-6 space-y-2">
                        <Progress value={progressPercent} className="h-2 bg-orange-100" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{t('subscription.payment.checking')}</span>
                          <span>
                            {formatTime(timeRemaining)} {t('subscription.payment.remaining')}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 rounded-xl border border-orange-100 bg-white p-4 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{t('subscription.payment.paymentCode')}</span>
                          <span className="font-mono text-lg font-semibold text-orange-900">
                            {paymentTransaction.paymentCode}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm text-gray-600">{t('subscription.payment.amount')}</span>
                          <span className="text-lg font-bold text-orange-900">
                            {formatPrice(paymentTransaction.amount)}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="mt-6 h-10 border-gray-200"
                        onClick={() => setCurrentStep('bank-qr')}
                      >
                        {t('subscription.payment.backToQR')}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Success */}
                {currentStep === 'bank-success' && paymentStatus === 'paid' && (
                  <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-8 text-center shadow-lg">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white shadow-lg">
                      <Check className="h-10 w-10" />
                    </div>
                    <h3 className="mt-4 text-2xl font-bold text-gray-900">{t('subscription.payment.successTitle')}</h3>
                    <p className="mt-2 text-sm text-gray-600">{t('subscription.payment.successMessage')}</p>

                    <div className="mt-6 rounded-xl border border-green-100 bg-white p-4 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t('subscription.payment.package')}</span>
                        <span className="text-lg font-semibold text-green-900">
                          {pkg.name || paymentTransaction.metadata?.packageName}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t('subscription.payment.duration')}</span>
                        <span className="text-lg font-semibold text-green-900">
                          {paymentTransaction.metadata?.months || months} {t('subscription.payment.months')}
                        </span>
                      </div>
                    </div>

                    <Button
                      className="mt-6 h-11 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/40"
                      onClick={() => {
                        onOpenChange(false);
                        onSuccess?.();
                      }}
                    >
                      {t('subscription.payment.close', 'Close')}
                    </Button>
                  </div>
                )}

                {/* Expired */}
                {paymentStatus === 'expired' && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-sm text-red-900">
                      {t('subscription.payment.expired')}
                    </AlertDescription>
                    <div className="mt-3">
                      <Button onClick={resetFlow} className="bg-red-500 text-white hover:bg-red-600">
                        {t('subscription.payment.retry', 'Choose another payment')}
                      </Button>
                    </div>
                  </Alert>
                )}
              </div>
            )}
          </ScrollArea>

          {currentStep === 'details' && (
            <DialogFooter className="relative z-10 flex flex-col gap-3 border-t border-orange-100/80 bg-white/80 px-8 py-5 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="h-11 border-gray-200 bg-white/90 font-semibold hover:bg-gray-50"
              >
                {t('subscription.modal.button.cancel')}
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-11 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/40 transition-all duration-300 hover:shadow-orange-500/60 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    {t('subscription.modal.button.processing')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    {paymentMethod === 'BANK_TRANSFER'
                      ? t('subscription.modal.button.continue', 'Continue')
                      : t('subscription.modal.button.confirm')}
                  </span>
                )}
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
