import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currency';
import { VIETQR_BANKS } from '@/constants/vietqrBanks';
import type { PayOSPaymentData } from '@/services/api/paymentApi';
import QRCode from 'qrcode';

interface PaymentInfoProps {
  paymentData: PayOSPaymentData;
  paymentStatus: 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED';
  timeRemaining?: number;
  showActions?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
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

export const PaymentInfo: React.FC<PaymentInfoProps> = ({
  paymentData,
  paymentStatus,
  timeRemaining,
  showActions = false,
  onRefresh,
  isRefreshing = false
}) => {
  const { t } = useTranslation();
  const [qrImage, setQrImage] = useState<string | null>(null);

  // Bank info
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

  // Transfer content
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

  // Generate QR code
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
      const rawQrSource = pickFirstString(
        paymentData.qrCode,
        payosMeta?.['qrCode'],
        payosMeta?.['qrImage'],
        payosMeta?.['qrImageUrl'],
        payosMeta?.['qrCodeUrl'],
        payosMeta?.['qr_code_url'],
        payosMeta?.['qrDataUrl'],
        payosMeta?.['qr_data_url']
      );

      const normalizedSource = normalizeImageSource(rawQrSource);
      if (normalizedSource) {
        if (isMounted) setQrImage(normalizedSource);
        return;
      }

      const rawQrPayload =
        pickFirstString(
          paymentData.qrString,
          payosMeta?.['qrString'],
          payosMeta?.['qrContent'],
          payosMeta?.['qr_data'],
          payosMeta?.['qrRaw'],
          payosMeta?.['qr_raw']
        ) ??
        pickFirstString(
          paymentData.checkoutUrl,
          payosMeta?.['checkoutUrl'],
          payosMeta?.['paymentUrl'],
          payosMeta?.['paymentLink']
        );

      if (rawQrPayload) {
        try {
          const dataUrl = await QRCode.toDataURL(rawQrPayload, { width: 256, margin: 1 });
          if (isMounted) setQrImage(dataUrl);
        } catch (error) {
          console.error('Failed to generate QR data URL:', error);
          if (isMounted) setQrImage(null);
        }
        return;
      }

      if (isMounted) setQrImage(null);
    };

    void loadQrImage();

    return () => {
      isMounted = false;
    };
  }, [paymentData]);

  // Format time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
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
      {(paymentStatus === 'PENDING' || paymentStatus === 'PROCESSING') && timeRemaining !== undefined && (
        <div className="flex items-center justify-center space-x-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {t('payment.time_remaining')}: <span className="font-bold text-blue-600">{formatTime(timeRemaining)}</span>
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
                      copyToClipboard(bankInfo.name || bankInfo.shortName || bankInfo.bin || '', t('payment.copied'))
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

      {/* Refresh Action */}
      {showActions && onRefresh && (paymentStatus === 'PENDING' || paymentStatus === 'PROCESSING') && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={onRefresh} disabled={isRefreshing}>
            {isRefreshing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            {t('payment.refresh_status')}
          </Button>
        </div>
      )}
    </div>
  );
};
