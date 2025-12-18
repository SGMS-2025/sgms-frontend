import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Copy, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { paymentApi, type PayOSPaymentData } from '@/services/api/paymentApi';
import { usePaymentSocket, type PaymentUpdateData } from '@/hooks/useSocket';
import QRCode from 'qrcode';
import { VIETQR_BANKS } from '@/constants/vietqrBanks';
import { formatCurrency } from '@/utils/currency';

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

const copyToClipboard = async (text: string, successMessage: string) => {
  await navigator.clipboard
    .writeText(text)
    .then(() => toast.success(successMessage))
    .catch(() => toast.error('Không thể sao chép'));
};

const pickFirstString = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return null;
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
  const [hasShownPaidToast, setHasShownPaidToast] = useState(false);
  const paidNotifiedRef = React.useRef(false);
  const cancelPaymentLinkRef = React.useRef<typeof cancelPaymentLink | null>(null);
  const bankInfo = useMemo(() => {
    const bin = paymentData.bin?.trim() || null;
    const entry = bin ? VIETQR_BANKS[bin] : undefined;

    const rawName =
      typeof paymentData.bankName === 'string' && paymentData.bankName.trim().length > 0
        ? paymentData.bankName.trim()
        : null;

    const rawShortName =
      typeof paymentData.bankShortName === 'string' && paymentData.bankShortName.trim().length > 0
        ? paymentData.bankShortName.trim()
        : null;

    return {
      name: rawName ?? entry?.name ?? null,
      shortName: rawShortName ?? entry?.shortName ?? null,
      bin
    };
  }, [paymentData.bankName, paymentData.bankShortName, paymentData.bin]);

  const transferContent = useMemo(() => {
    const direct = pickFirstString(paymentData.transferContent);
    if (direct) {
      return direct;
    }

    const paymentObject = paymentData.payment;
    const paymentMetadata =
      paymentObject && typeof paymentObject === 'object'
        ? (paymentObject as { metadata?: unknown }).metadata
        : undefined;

    const payosMeta =
      paymentMetadata && typeof paymentMetadata === 'object'
        ? ((paymentMetadata as Record<string, unknown>).payos as Record<string, unknown> | undefined)
        : undefined;

    const metadataTransfer = pickFirstString(
      paymentMetadata && typeof paymentMetadata === 'object'
        ? (paymentMetadata as Record<string, unknown>).transferContent
        : undefined,
      paymentMetadata && typeof paymentMetadata === 'object'
        ? (paymentMetadata as Record<string, unknown>).transfer_content
        : undefined,
      payosMeta ? (payosMeta['transferContent'] as string | undefined) : undefined,
      payosMeta ? (payosMeta['transfer_content'] as string | undefined) : undefined
    );

    if (metadataTransfer) {
      return metadataTransfer;
    }

    const descriptionFallback =
      paymentObject && typeof paymentObject === 'object'
        ? pickFirstString((paymentObject as { description?: unknown }).description)
        : null;

    const resolved = pickFirstString(descriptionFallback, paymentData.description);

    return resolved ?? (paymentData.orderCode ? String(paymentData.orderCode) : '');
  }, [paymentData]);

  useEffect(() => {
    let isMounted = true;

    const normalizeImageSource = (input: string | null): string | null => {
      if (!input) return null;
      const trimmed = input.trim();
      if (!trimmed) return null;

      if (trimmed.startsWith('data:image')) {
        return trimmed;
      }

      if (trimmed.startsWith('http://')) {
        if (typeof window !== 'undefined' && window.location?.protocol === 'https:') {
          return `https://${trimmed.slice('http://'.length)}`;
        }
        return trimmed;
      }

      if (trimmed.startsWith('https://')) {
        return trimmed;
      }

      const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
      if (base64Pattern.test(trimmed) && trimmed.length > 200) {
        return `data:image/png;base64,${trimmed}`;
      }

      return null;
    };

    const payosMeta = (() => {
      const payment = paymentData?.payment;
      if (!payment || typeof payment !== 'object') return null;
      const metadata = (payment as { metadata?: unknown }).metadata;
      if (!metadata || typeof metadata !== 'object') return null;
      const payos = (metadata as { payos?: unknown }).payos;
      if (!payos || typeof payos !== 'object') return null;
      return payos as Record<string, unknown>;
    })();

    const loadQrImage = async () => {
      // Priority 1: Try to find QR code image URL from PayOS response
      // This should be the VietQR image URL provided by PayOS
      const rawQrSource = pickFirstString(
        paymentData.qrCode,
        payosMeta?.['qrCode'],
        payosMeta?.['qrImage'],
        payosMeta?.['qrImageUrl'],
        payosMeta?.['qrCodeUrl'],
        payosMeta?.['qr_code_url'],
        payosMeta?.['qrDataUrl'],
        payosMeta?.['qr_data_url'],
        payosMeta?.['qrImageUrl'],
        payosMeta?.['qr_image_url'],
        payosMeta?.['qrCodeImage'],
        payosMeta?.['qr_code_image'],
        payosMeta?.['vietqr'],
        payosMeta?.['vietQr'],
        payosMeta?.['vietQrUrl'],
        payosMeta?.['vietqr_url'],
        payosMeta?.['vietqrImage'],
        payosMeta?.['vietqr_image']
      );

      const normalizedSource = normalizeImageSource(rawQrSource);
      if (normalizedSource) {
        if (isMounted) setQrImage(normalizedSource);
        return;
      }

      // Priority 2: If no QR image URL, try to generate from QR string/data
      // This is the raw QR data that can be used to generate QR code
      const rawQrPayload = pickFirstString(
        paymentData.qrString,
        payosMeta?.['qrString'],
        payosMeta?.['qrContent'],
        payosMeta?.['qr_data'],
        payosMeta?.['qrRaw'],
        payosMeta?.['qr_raw']
      );

      if (rawQrPayload) {
        try {
          const dataUrl = await QRCode.toDataURL(rawQrPayload, { width: 256, margin: 1 });
          if (isMounted) setQrImage(dataUrl);
        } catch (error) {
          console.error('Failed to generate QR data URL from QR string:', error);
          if (isMounted) setQrImage(null);
        }
        return;
      }

      // No QR code available - set to null
      if (isMounted) setQrImage(null);
    };

    void loadQrImage();

    return () => {
      isMounted = false;
    };
  }, [paymentData]);

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

      await paymentApi
        .cancelPayOSPaymentLink(paymentData.orderCode, reason)
        .then(() => {
          setPaymentStatus('CANCELLED');
          setLatestStatus('CANCELLED');
          if (showExpiryToast) {
            toast.error(t('payment.payment_expired'));
          } else {
            toast.info(t('payment.payment_cancelled'));
          }
        })
        .catch(() => {
          setCancelTriggered(false);
          toast.error(t('payment.cancel_failed'));
        })
        .finally(() => {
          setIsCancelling(false);
          if (shouldCloseModal) {
            onClose();
          }
        });
    },
    [cancelTriggered, paymentStatus, paymentData.orderCode, onClose, t]
  );

  // Store cancelPaymentLink in ref to avoid dependency issues in useEffect
  React.useEffect(() => {
    cancelPaymentLinkRef.current = cancelPaymentLink;
  }, [cancelPaymentLink]);

  useEffect(() => {
    setPaymentData(initialPaymentData);
    const initialStatus = (initialPaymentData?.payment as { status?: string } | undefined)?.status;
    const status =
      initialStatus && ['PENDING', 'PROCESSING', 'PAID', 'CANCELLED'].includes(initialStatus)
        ? (initialStatus as 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED')
        : 'PENDING';
    setPaymentStatus(status);
    setLatestStatus(status);
    setTimeRemaining(900);
    setIsRecreating(false);
    setIsCancelling(false);
    setCancelTriggered(false);
    // Reset toast flag when payment data changes
    const isPaid = status === 'PAID';
    setHasShownPaidToast(isPaid);
    paidNotifiedRef.current = isPaid;
  }, [initialPaymentData]);

  // Subscribe to payment updates via WebSocket
  usePaymentSocket(
    paymentData.orderCode,
    (data: PaymentUpdateData) => {
      if (!data.status) {
        return;
      }

      // Ignore duplicate status notifications except when transitioning to PAID once
      if (data.status === paymentStatus && data.status !== 'PAID') {
        return;
      }

      if (data.status) {
        setPaymentStatus(data.status);
        setLatestStatus(data.status);
      }
      if (data.status === 'CANCELLED') {
        setCancelTriggered(true);
      }

      if (data.status === 'PAID') {
        if (!paidNotifiedRef.current && paymentStatus !== 'PAID') {
          toast.success(t('payment.payment_successful_prompt'));
          setHasShownPaidToast(true);
          paidNotifiedRef.current = true;
        }
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
      if (!paymentData.orderCode || !paymentData.paymentLinkId) return;

      await paymentApi
        .getPayOSPaymentStatus(paymentData.paymentLinkId, paymentData.orderCode)
        .then((response) => {
          const apiData = response?.data;
          const remoteStatusRaw = apiData?.status;
          const remoteStatus = typeof remoteStatusRaw === 'string' ? remoteStatusRaw.toUpperCase() : null;

          if (remoteStatus && remoteStatus !== paymentStatus) {
            if (remoteStatus === 'PAID') {
              if (!paidNotifiedRef.current) {
                toast.success(t('payment.payment_successful_prompt'));
                setHasShownPaidToast(true);
                paidNotifiedRef.current = true;
              }
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
        })
        .catch((error) => {
          console.error('[PayOSPaymentModal] Polling error:', error);
        });
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [
    paymentData.paymentLinkId,
    paymentData.orderCode,
    paymentStatus,
    onPaymentSuccess,
    onClose,
    t,
    hasShownPaidToast
  ]);

  // Polling fallback: keeps status in sync even if socket updates are missed

  // Countdown timer
  useEffect(() => {
    if (paymentStatus !== 'PENDING' && paymentStatus !== 'PROCESSING') {
      return;
    }

    // Use ref to track if cancellation is already triggered to avoid duplicate calls
    let isCancelling = false;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!cancelTriggered && !isCancelling && cancelPaymentLinkRef.current) {
            isCancelling = true;
            void cancelPaymentLinkRef.current('Expired due to timeout', { closeModal: false, showExpiryToast: true });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [paymentStatus, cancelTriggered]); // Removed cancelPaymentLink from dependencies to prevent timer recreation

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Recreate payment link when expired
  const handleRecreateLink = async () => {
    setIsRecreating(true);

    await paymentApi
      .createPayOSPaymentLink({
        customerId,
        branchId,
        contractId,
        contractType,
        amount: paymentData.amount,
        description: paymentData.description
      })
      .then((response) => {
        if (response.success && response.data) {
          setPaymentData(response.data);
          setPaymentStatus('PENDING');
          setLatestStatus('PENDING');
          setTimeRemaining(900); // Reset timer
          setCancelTriggered(false);
          setIsCancelling(false);
          toast.success(t('payment.link_recreated'));
        }
      })
      .catch(() => {
        toast.error(t('payment.recreate_link_failed'));
      })
      .finally(() => {
        setIsRecreating(false);
      });
  };

  // Handle manual cancellation
  const handleCancel = () => {
    void cancelPaymentLink('Cancelled by staff', { closeModal: true });
  };

  const handleManualRefresh = async () => {
    if (!paymentData.paymentLinkId) return;
    setIsRefreshing(true);

    if (!paymentData.orderCode || !paymentData.paymentLinkId) {
      setIsRefreshing(false);
      return;
    }

    await paymentApi
      .getPayOSPaymentStatus(paymentData.paymentLinkId, paymentData.orderCode)
      .then((response) => {
        const apiData = response?.data;
        const remoteStatusRaw = apiData?.status;
        const remoteStatus = typeof remoteStatusRaw === 'string' ? remoteStatusRaw.toUpperCase() : null;

        if (remoteStatus === 'PAID') {
          if (!hasShownPaidToast) {
            toast.success(t('payment.payment_successful_prompt'));
            setHasShownPaidToast(true);
          }
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
      })
      .catch((error) => {
        console.error('[PayOSPaymentModal] Manual refresh error:', error);
        toast.error(t('payment.status_refresh_failed'));
      })
      .finally(() => {
        setIsRefreshing(false);
      });
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
                {(bankInfo.name || bankInfo.shortName || bankInfo.bin) && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('payment.bank_name')}:</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex flex-col items-end">
                        <span className="font-medium">{bankInfo.name || bankInfo.shortName || bankInfo.bin}</span>
                        {bankInfo.shortName && bankInfo.name && (
                          <span className="text-xs text-gray-500">{bankInfo.shortName}</span>
                        )}
                        {bankInfo.bin && (bankInfo.name || bankInfo.shortName) && (
                          <span className="text-xs text-gray-400">{bankInfo.bin}</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          copyToClipboard(
                            bankInfo.name || bankInfo.shortName || bankInfo.bin || '',
                            t('payment.copied')
                          )
                        }
                        className="h-6 w-6"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {!!paymentData.accountNumber && (
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

                {!!paymentData.accountName && (
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

                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-600">{t('payment.transfer_content')}:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-right whitespace-pre-wrap break-words max-w-[220px]">
                      {transferContent}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(transferContent, t('payment.copied'))}
                      className="h-6 w-6"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {!!paymentData.orderCode && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('payment.order_code')}:</span>
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
                )}
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
