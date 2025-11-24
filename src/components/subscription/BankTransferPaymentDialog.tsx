import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { QrCode, Copy, CheckCircle2, Clock, AlertCircle, Building2, ArrowRight, Loader2, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { subscriptionApi } from '@/services/api/subscriptionApi';
import { usePaymentSocket } from '@/hooks/usePaymentSocket';

interface PaymentTransactionInfo {
  _id: string;
  paymentCode: string;
  amount: number;
  bankAccountNumber: string;
  bankCode: string;
  bankAccountName: string;
  description: string;
  expiresAt: string;
  qrCodeUrl: string;
  metadata?: {
    packageName?: string;
    months?: number;
  };
}

interface BankTransferPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentTransaction: PaymentTransactionInfo | null;
  packageName?: string;
  onPaymentSuccess?: () => void;
}

type Step = 'qr-code' | 'waiting' | 'success';

export const BankTransferPaymentDialog = ({
  open,
  onOpenChange,
  paymentTransaction,
  packageName,
  onPaymentSuccess
}: BankTransferPaymentDialogProps) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<Step>('qr-code');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isPolling, setIsPolling] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'expired'>('pending');

  console.log('[BankTransferPaymentDialog] Render:', { open, paymentTransaction, currentStep });

  // Calculate time remaining
  useEffect(() => {
    if (!open || !paymentTransaction) {
      setPaymentStatus('pending');
      setCurrentStep('qr-code');
      return;
    }

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
    enabled: open && currentStep === 'waiting' && paymentStatus === 'pending',
    onPaymentPaid: (payment) => {
      console.log('[Dialog] Payment paid via socket:', payment);
      setPaymentStatus('paid');
      setCurrentStep('success');

      // Wait 2 seconds then close and callback
      setTimeout(() => {
        onOpenChange(false);
        onPaymentSuccess?.();
      }, 2000);
    }
  });

  // Fallback polling (every 5 seconds) if socket is not connected
  useEffect(() => {
    if (!open || !paymentTransaction || paymentStatus !== 'pending' || currentStep !== 'waiting') {
      return;
    }

    // Only poll if socket is not connected
    if (isConnected) {
      return;
    }

    const checkPayment = async () => {
      if (isPolling) return;

      setIsPolling(true);
      try {
        const result = await subscriptionApi.checkPaymentStatus(paymentTransaction._id);
        if (result.success && result.data.paymentStatus === 'PAID') {
          console.log('[Dialog] Payment paid via polling:', result.data);
          setPaymentStatus('paid');
          setCurrentStep('success');
          toast.success(t('subscription.payment.success'));

          setTimeout(() => {
            onOpenChange(false);
            onPaymentSuccess?.();
          }, 2000);
        }
      } catch (error) {
        console.error('[Dialog] Error checking payment:', error);
      } finally {
        setIsPolling(false);
      }
    };

    const interval = setInterval(checkPayment, 5000);
    return () => clearInterval(interval);
  }, [open, paymentTransaction, paymentStatus, currentStep, onPaymentSuccess, t, isConnected, isPolling, onOpenChange]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('subscription.payment.copied'), {
      description: `${label}: ${text}`
    });
  };

  const handleNextStep = () => {
    setCurrentStep('waiting');
  };

  const progressPercent = useMemo(() => {
    if (!paymentTransaction) return 0;
    const total = new Date(paymentTransaction.expiresAt).getTime() - new Date().getTime();
    const elapsed = total - timeRemaining;
    return Math.min(100, (elapsed / total) * 100);
  }, [timeRemaining, paymentTransaction]);

  if (!paymentTransaction) {
    console.log('[BankTransferPaymentDialog] No payment transaction, returning null');
    return null;
  }

  console.log('[BankTransferPaymentDialog] Rendering dialog with open:', open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-w-2xl p-0 max-h-[90vh] overflow-hidden z-[100]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200/60">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-semibold text-gray-900">
                {t('subscription.payment.title')}
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                {packageName || paymentTransaction.metadata?.packageName || t('subscription.payment.subtitle')}
              </DialogDescription>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep === 'qr-code' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                }`}
              >
                {currentStep === 'qr-code' ? '1' : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep === 'waiting'
                    ? 'bg-orange-500 text-white'
                    : currentStep === 'success'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep === 'success' ? <CheckCircle2 className="w-5 h-5" /> : '2'}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* STEP 1: QR CODE & BANK INFO */}
          {currentStep === 'qr-code' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Timer Warning */}
              <Alert className="border-orange-200 bg-orange-50/50">
                <Clock className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-sm text-orange-900 flex items-center justify-between">
                  <span>{t('subscription.payment.expiresIn')}</span>
                  <Badge variant="outline" className="ml-2 text-orange-700 border-orange-300 bg-white">
                    {formatTime(timeRemaining)}
                  </Badge>
                </AlertDescription>
              </Alert>

              {/* QR Code Section */}
              <Card className="border-2 border-orange-200/60 bg-gradient-to-br from-orange-50/80 to-white shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <h3 className="text-lg font-bold text-orange-900 flex items-center justify-center gap-2">
                      <QrCode className="w-5 h-5" />
                      {t('subscription.payment.scanQR')}
                    </h3>

                    {/* QR Code Image */}
                    <div className="relative inline-block">
                      <div className="bg-white p-4 rounded-xl shadow-md border-2 border-orange-100">
                        <img src={paymentTransaction.qrCodeUrl} alt="QR Code" className="w-64 h-64 object-contain" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        {formatCurrency(paymentTransaction.amount)}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600">{t('subscription.payment.scanInstructions')}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Bank Account Details */}
              <Card className="border-2 border-gray-200/60">
                <CardContent className="p-5 space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-600" />
                    {t('subscription.payment.bankDetails')}
                  </h4>

                  {/* Payment Code - Most Important */}
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-orange-700 font-medium mb-1">
                          {t('subscription.payment.paymentCode')} <span className="text-red-500">*</span>
                        </p>
                        <p className="text-2xl font-bold text-orange-900 font-mono tracking-wider">
                          {paymentTransaction.paymentCode}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(paymentTransaction.paymentCode, t('subscription.payment.paymentCode'))
                        }
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                      >
                        <Copy className="w-5 h-5" />
                      </Button>
                    </div>
                    <p className="text-xs text-orange-600 mt-2">{t('subscription.payment.paymentCodeHint')}</p>
                  </div>

                  {/* Other Bank Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500">{t('subscription.payment.bankName')}</p>
                        <p className="font-semibold text-gray-900">{paymentTransaction.bankCode}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(paymentTransaction.bankCode, t('subscription.payment.bankName'))}
                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-200"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500">{t('subscription.payment.accountNumber')}</p>
                        <p className="font-semibold text-gray-900 font-mono">{paymentTransaction.bankAccountNumber}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(paymentTransaction.bankAccountNumber, t('subscription.payment.accountNumber'))
                        }
                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-200"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500">{t('subscription.payment.accountName')}</p>
                      <p className="font-semibold text-gray-900">{paymentTransaction.bankAccountName}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(paymentTransaction.bankAccountName, t('subscription.payment.accountName'))
                      }
                      className="text-gray-600 hover:text-gray-700 hover:bg-gray-200"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Next Step Button */}
              <Button
                onClick={handleNextStep}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-orange-500/50 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {t('subscription.payment.transferred')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* STEP 2: WAITING FOR CONFIRMATION */}
          {currentStep === 'waiting' && paymentStatus === 'pending' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Connection Status */}
              <Alert
                className={`${isConnected ? 'border-green-200 bg-green-50/50' : 'border-yellow-200 bg-yellow-50/50'}`}
              >
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-900 font-medium">
                        {t('subscription.payment.realtimeConnected')}
                      </span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-900 font-medium">
                        {t('subscription.payment.checkingPeriodically')}
                      </span>
                    </>
                  )}
                </div>
              </Alert>

              {/* Waiting Animation */}
              <Card className="border-2 border-orange-200/60 bg-gradient-to-br from-orange-50/30 to-white">
                <CardContent className="p-10 text-center space-y-6">
                  <div className="relative inline-block">
                    <Loader2 className="w-20 h-20 text-orange-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Clock className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('subscription.payment.waitingTitle')}</h3>
                    <p className="text-gray-600">{t('subscription.payment.waitingSubtitle')}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress value={progressPercent} className="h-2 bg-orange-100" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{t('subscription.payment.checking')}</span>
                      <span>
                        {formatTime(timeRemaining)} {t('subscription.payment.remaining')}
                      </span>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-white border-2 border-orange-100 rounded-lg p-4 text-left">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">{t('subscription.payment.paymentCode')}</span>
                      <span className="text-lg font-bold text-orange-900 font-mono">
                        {paymentTransaction.paymentCode}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t('subscription.payment.amount')}</span>
                      <span className="text-lg font-bold text-orange-900">
                        {formatCurrency(paymentTransaction.amount)}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500">
                    {isConnected
                      ? t('subscription.payment.autoNotifySocket')
                      : t('subscription.payment.autoNotifyPolling')}
                  </p>
                </CardContent>
              </Card>

              {/* Back Button */}
              <Button
                variant="outline"
                onClick={() => setCurrentStep('qr-code')}
                className="w-full border-gray-300 hover:bg-gray-50"
              >
                {t('subscription.payment.backToQR')}
              </Button>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {currentStep === 'success' && paymentStatus === 'paid' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white shadow-xl">
                <CardContent className="p-10 text-center space-y-6">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                      <CheckCircle2 className="w-16 h-16 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full animate-ping"></div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('subscription.payment.successTitle')}</h3>
                    <p className="text-gray-600">{t('subscription.payment.successMessage')}</p>
                  </div>

                  <div className="bg-white border-2 border-green-100 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">{t('subscription.payment.package')}</span>
                      <span className="text-lg font-bold text-green-900">
                        {packageName || paymentTransaction.metadata?.packageName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t('subscription.payment.duration')}</span>
                      <span className="text-lg font-bold text-green-900">
                        {paymentTransaction.metadata?.months || 1} {t('subscription.payment.months')}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-green-700 font-medium">{t('subscription.payment.redirecting')}...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* EXPIRED */}
          {paymentStatus === 'expired' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-900">{t('subscription.payment.expired')}</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
