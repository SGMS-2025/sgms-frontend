import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Copy, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { paymentApi, type PayOSPaymentData } from '@/services/api/paymentApi';
import { usePaymentSocket, type PaymentUpdateData } from '@/hooks/useSocket';
import QRCode from 'qrcode';

interface PayOSPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: PayOSPaymentData;
  onPaymentSuccess: () => void;
  customerId: string;
  branchId: string;
  contractId: string;
  contractType: 'service' | 'membership';
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

const copyToClipboard = async (text: string, successMessage: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch (_error) {
    toast.error('Không thể sao chép');
  }
};

export const PayOSPaymentModal: React.FC<PayOSPaymentModalProps> = ({
  isOpen,
  onClose,
  paymentData: initialPaymentData,
  onPaymentSuccess,
  customerId,
  branchId,
  contractId,
  contractType
}) => {
  const { t } = useTranslation();
  const [paymentData, setPaymentData] = useState(initialPaymentData);
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED'>('PENDING');
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes in seconds
  const [isRecreating, setIsRecreating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelTriggered, setCancelTriggered] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [latestStatus, setLatestStatus] = useState<'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED'>('PENDING');

  useEffect(() => {
    let isMounted = true;

    const resolveQr = async () => {
      const raw = paymentData.qrCode || null;
      const qrString = paymentData.qrString || null;

      if (raw?.startsWith('data:image')) {
        if (isMounted) setQrImage(raw);
        return;
      }

      if (raw?.startsWith('http')) {
        if (isMounted) setQrImage(raw);
        return;
      }

      if (qrString) {
        try {
          const dataUrl = await QRCode.toDataURL(qrString, { width: 256, margin: 1 });
          if (isMounted) setQrImage(dataUrl);
        } catch (error) {
          console.error('Failed to generate QR data URL:', error);
          if (isMounted) setQrImage(null);
        }
        return;
      }

      setQrImage(null);
    };

    resolveQr();

    return () => {
      isMounted = false;
    };
  }, [paymentData.qrCode, paymentData.qrString]);

  const cancelPaymentLink = useCallback(
    async (reason: string, options: { closeModal?: boolean; showExpiryToast?: boolean } = {}) => {
      const { closeModal = false, showExpiryToast = false } = options;
      const shouldCloseModal = closeModal;

      if (cancelTriggered || paymentStatus === 'CANCELLED') {
        if (closeModal) {
          onClose();
        }
        return;
      }

      setCancelTriggered(true);
      setIsCancelling(true);

      try {
        await paymentApi.cancelPayOSPaymentLink(paymentData.orderCode, reason);
        setPaymentStatus('CANCELLED');
        setLatestStatus('CANCELLED');
        if (showExpiryToast) {
          toast.error(t('payment.payment_expired'));
        } else {
          toast.info(t('payment.payment_cancelled'));
        }
      } catch (_error) {
        setCancelTriggered(false);
        toast.error(t('payment.cancel_failed'));
      } finally {
        setIsCancelling(false);
        if (shouldCloseModal) {
          onClose();
        }
      }
    },
    [cancelTriggered, paymentStatus, paymentData.orderCode, onClose, t]
  );

  useEffect(() => {
    setPaymentData(initialPaymentData);
    const initialStatus = (initialPaymentData?.payment as { status?: string } | undefined)?.status;
    setPaymentStatus(
      initialStatus && ['PENDING', 'PROCESSING', 'PAID', 'CANCELLED'].includes(initialStatus)
        ? (initialStatus as 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED')
        : 'PENDING'
    );
    setLatestStatus(
      initialStatus && ['PENDING', 'PROCESSING', 'PAID', 'CANCELLED'].includes(initialStatus)
        ? (initialStatus as 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED')
        : 'PENDING'
    );
    setTimeRemaining(900);
    setIsRecreating(false);
    setIsCancelling(false);
    setCancelTriggered(false);
  }, [initialPaymentData]);

  // Subscribe to payment updates via WebSocket
  usePaymentSocket(
    paymentData.orderCode,
    (data: PaymentUpdateData) => {
      console.log('[PayOSPaymentModal] Received payment update:', data);
      if (data.status) {
        setPaymentStatus(data.status);
        setLatestStatus(data.status);
      }
      if (data.status === 'CANCELLED') {
        setCancelTriggered(true);
      }

      if (data.status === 'PAID') {
        toast.success(t('payment.payment_successful_prompt'));
      } else if (data.status === 'CANCELLED') {
        toast.error(t('payment.payment_cancelled'));
      }
    },
    {
      paymentLinkId: paymentData.paymentLinkId,
      onFallback: () => setIsRefreshing(false)
    }
  );

  // Fallback polling in case WebSocket updates are not received
  useEffect(() => {
    if (!paymentData.paymentLinkId || paymentStatus === 'PAID' || paymentStatus === 'CANCELLED') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        if (!paymentData.orderCode || !paymentData.paymentLinkId) return;
        const response = await paymentApi.getPayOSPaymentStatus(paymentData.paymentLinkId, paymentData.orderCode);
        const apiData = response?.data;
        const remoteStatusRaw = apiData?.status;
        const remoteStatus = typeof remoteStatusRaw === 'string' ? remoteStatusRaw.toUpperCase() : null;

        if (remoteStatus && remoteStatus !== paymentStatus) {
          if (remoteStatus === 'PAID') {
            toast.success(t('payment.payment_successful_prompt'));
            setPaymentStatus('PAID');
            setLatestStatus('PAID');
          } else if (remoteStatus === 'CANCELLED') {
            toast.error(t('payment.payment_cancelled'));
            setPaymentStatus('CANCELLED');
            setLatestStatus('CANCELLED');
          } else if (remoteStatus === 'PROCESSING') {
            setPaymentStatus('PROCESSING');
            setLatestStatus('PROCESSING');
          } else if (remoteStatus === 'PENDING') {
            setPaymentStatus('PENDING');
            setLatestStatus('PENDING');
          }
        }
      } catch (error) {
        console.error('[PayOSPaymentModal] Polling error:', error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [paymentData.paymentLinkId, paymentData.orderCode, paymentStatus, onPaymentSuccess, onClose, t]);

  // Polling fallback: keeps status in sync even if socket updates are missed

  // Countdown timer
  useEffect(() => {
    if (paymentStatus !== 'PENDING' && paymentStatus !== 'PROCESSING') {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!cancelTriggered) {
            void cancelPaymentLink('Expired due to timeout', { closeModal: false, showExpiryToast: true });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentStatus, cancelTriggered, cancelPaymentLink]);

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Recreate payment link when expired
  const handleRecreateLink = async () => {
    setIsRecreating(true);
    try {
      const response = await paymentApi.createPayOSPaymentLink({
        customerId,
        branchId,
        contractId,
        contractType,
        amount: paymentData.amount,
        description: paymentData.description
      });

      if (response.success && response.data) {
        setPaymentData(response.data);
        setPaymentStatus('PENDING');
        setLatestStatus('PENDING');
        setTimeRemaining(900); // Reset timer
        setCancelTriggered(false);
        setIsCancelling(false);
        toast.success(t('payment.link_recreated'));
      }
    } catch (_error) {
      toast.error(t('payment.recreate_link_failed'));
    } finally {
      setIsRecreating(false);
    }
  };

  // Handle manual cancellation
  const handleCancel = () => {
    void cancelPaymentLink('Cancelled by staff', { closeModal: true });
  };

  const handleManualRefresh = async () => {
    if (!paymentData.paymentLinkId) return;
    setIsRefreshing(true);
    try {
      if (!paymentData.orderCode || !paymentData.paymentLinkId) return;
      const response = await paymentApi.getPayOSPaymentStatus(paymentData.paymentLinkId, paymentData.orderCode);
      const apiData = response?.data;
      const remoteStatusRaw = apiData?.status;
      const remoteStatus = typeof remoteStatusRaw === 'string' ? remoteStatusRaw.toUpperCase() : null;

      if (remoteStatus === 'PAID') {
        toast.success(t('payment.payment_successful_prompt'));
        setPaymentStatus('PAID');
        setLatestStatus('PAID');
      } else if (remoteStatus === 'CANCELLED') {
        toast.error(t('payment.payment_cancelled'));
        setPaymentStatus('CANCELLED');
        setLatestStatus('CANCELLED');
      } else if (remoteStatus === 'PROCESSING') {
        toast.info(t('payment.status_processing'));
        setPaymentStatus('PROCESSING');
        setLatestStatus('PROCESSING');
      } else if (remoteStatus === 'PENDING') {
        toast.info(t('payment.status_pending'));
        setPaymentStatus('PENDING');
        setLatestStatus('PENDING');
      } else if (remoteStatus) {
        toast.info(t('payment.status_other', { status: remoteStatus }));
        if (['PENDING', 'PROCESSING', 'PAID', 'CANCELLED'].includes(remoteStatus)) {
          setLatestStatus(remoteStatus as 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED');
        }
      } else {
        toast.warning(t('payment.status_unknown'));
      }
    } catch (error) {
      console.error('[PayOSPaymentModal] Manual refresh error:', error);
      toast.error(t('payment.status_refresh_failed'));
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{t('payment.bank_transfer')}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Status */}
          <div className="flex items-center justify-center space-x-3 p-4 rounded-lg bg-gray-50">
            {paymentStatus === 'PENDING' && (
              <>
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-blue-600 font-medium">{t('payment.waiting_for_payment')}</span>
              </>
            )}
            {paymentStatus === 'PROCESSING' && (
              <>
                <RefreshCw className="h-5 w-5 text-orange-500 animate-spin" />
                <span className="text-orange-600 font-medium">{t('payment.processing')}</span>
              </>
            )}
            {paymentStatus === 'PAID' && (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-600 font-medium">{t('payment.payment_successful')}</span>
              </>
            )}
            {paymentStatus === 'CANCELLED' && (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-600 font-medium">{t('payment.payment_cancelled')}</span>
              </>
            )}
          </div>

          {/* Timer */}
          {(paymentStatus === 'PENDING' || paymentStatus === 'PROCESSING') && (
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {t('payment.time_remaining')}:{' '}
                <span className="font-bold text-blue-600">{formatTime(timeRemaining)}</span>
              </span>
            </div>
          )}

          {/* QR Code */}
          {(paymentStatus === 'PENDING' || paymentStatus === 'PROCESSING') && (
            <div className="flex flex-col items-center space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">{t('payment.scan_qr_code')}</h3>
                <p className="text-sm text-gray-600">{t('payment.scan_qr_description')}</p>
              </div>

              <div className="border-4 border-gray-200 rounded-lg p-4 bg-white">
                {qrImage ? (
                  <img src={qrImage} alt="QR Code" className="w-64 h-64 object-contain" />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <a
                      href={paymentData.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-center px-4"
                    >
                      {t('payment.click_to_pay')}
                    </a>
                  </div>
                )}
              </div>

              <a
                href={paymentData.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                {t('payment.open_payment_page')}
              </a>
            </div>
          )}

          {/* Bank Transfer Information */}
          {(paymentStatus === 'PENDING' || paymentStatus === 'PROCESSING') && paymentData.accountNumber && (
            <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold text-gray-800">{t('payment.bank_info')}</h3>

              <div className="space-y-2">
                {paymentData.bin && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('payment.bank_name')}:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{paymentData.bin}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(paymentData.bin || '', t('payment.copied'))}
                        className="h-6 w-6"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {paymentData.accountNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('payment.account_number')}:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{paymentData.accountNumber}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(paymentData.accountNumber || '', t('payment.copied'))}
                        className="h-6 w-6"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {paymentData.accountName && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('payment.account_name')}:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{paymentData.accountName}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(paymentData.accountName || '', t('payment.copied'))}
                        className="h-6 w-6"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('payment.amount')}:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg text-blue-600">{formatCurrency(paymentData.amount)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(paymentData.amount.toString(), t('payment.copied'))}
                      className="h-6 w-6"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('payment.transfer_content')}:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{paymentData.orderCode}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(paymentData.orderCode.toString(), t('payment.copied'))}
                      className="h-6 w-6"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-red-600 mt-3">{t('payment.transfer_content_warning')}</p>
            </div>
          )}

          {/* Expired State - Recreate Link */}
          {paymentStatus === 'CANCELLED' && timeRemaining === 0 && (
            <div className="text-center space-y-4">
              <p className="text-gray-600">{t('payment.link_expired_message')}</p>
              <Button onClick={handleRecreateLink} disabled={isRecreating} className="w-full">
                {isRecreating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {t('payment.recreating')}
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('payment.recreate_link')}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            {paymentStatus === 'PENDING' && (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isCancelling}>
                  {isCancelling && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  {t('payment.cancel')}
                </Button>
                <Button variant="outline" onClick={handleManualRefresh} disabled={isRefreshing}>
                  {isRefreshing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  {t('payment.refresh_status')}
                </Button>
                <Button variant="secondary" disabled className="cursor-not-allowed">
                  <Clock className="mr-2 h-4 w-4" />
                  {t('payment.waiting_for_webhook_confirmation')}
                </Button>
              </>
            )}

            {paymentStatus === 'PROCESSING' && (
              <>
                <Button variant="outline" onClick={handleManualRefresh} disabled={isRefreshing}>
                  {isRefreshing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  {t('payment.refresh_status')}
                </Button>
                <Button variant="secondary" disabled className="cursor-not-allowed">
                  <Clock className="mr-2 h-4 w-4" />
                  {t('payment.waiting_for_webhook_confirmation')}
                </Button>
              </>
            )}

            {paymentStatus === 'PAID' && (
              <>
                <Button variant="outline" onClick={handleManualRefresh} disabled={isRefreshing}>
                  {isRefreshing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  {t('payment.refresh_status')}
                </Button>
                <Button
                  onClick={() => {
                    onPaymentSuccess();
                    onClose();
                  }}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={latestStatus !== 'PAID'}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {t('payment.confirm_payment')}
                </Button>
                <Button variant="secondary" onClick={onClose}>
                  {t('common.close')}
                </Button>
              </>
            )}

            {paymentStatus === 'CANCELLED' && timeRemaining > 0 && (
              <Button onClick={onClose}>{t('common.close')}</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
