import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Clock, CheckCircle, XCircle, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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

  // Format time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const statusUi = useMemo(() => {
    switch (paymentStatus) {
      case 'PAID':
        return {
          icon: <CheckCircle className="text-green-700 dark:text-green-300" />,
          className:
            'border-green-200/70 bg-green-50 text-green-950 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-100',
          title: t('payment.payment_successful')
        };
      case 'CANCELLED':
        return {
          icon: <XCircle className="text-red-700 dark:text-red-300" />,
          className:
            'border-red-200/70 bg-red-50 text-red-950 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100',
          title: t('payment.payment_cancelled')
        };
      case 'PROCESSING':
        return {
          icon: <RefreshCw className="animate-spin text-amber-700 dark:text-amber-300" />,
          className:
            'border-amber-200/70 bg-amber-50 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100',
          title: t('payment.processing')
        };
      case 'PENDING':
      default:
        return {
          icon: <Clock className="text-blue-700 dark:text-blue-300" />,
          className:
            'border-blue-200/70 bg-blue-50 text-blue-950 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-100',
          title: t('payment.waiting_for_payment')
        };
    }
  }, [paymentStatus, t]);

  const InfoRow = ({
    label,
    value,
    copyText,
    valueClassName
  }: {
    label: string;
    value: React.ReactNode;
    copyText?: string;
    valueClassName?: string;
  }) => {
    return (
      <div className="grid grid-cols-12 items-start gap-3 py-2">
        <div className="col-span-12 sm:col-span-5 text-sm text-muted-foreground">{label}</div>
        <div className="col-span-12 sm:col-span-7 flex items-start justify-between gap-3">
          <div className={`min-w-0 text-sm font-medium text-foreground ${valueClassName || ''}`}>{value}</div>
          {copyText ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => copyToClipboard(copyText, t('payment.copied'))}
              aria-label="Copy"
            >
              <Copy className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Alert className={statusUi.className}>
        {statusUi.icon}
        <AlertTitle className="text-current">{statusUi.title}</AlertTitle>
        <AlertDescription className="text-current/80">
          {(paymentStatus === 'PENDING' || paymentStatus === 'PROCESSING') && timeRemaining !== undefined ? (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                {t('payment.time_remaining')}: <span className="font-semibold">{formatTime(timeRemaining)}</span>
              </span>
            </div>
          ) : null}
        </AlertDescription>
      </Alert>

      {(paymentStatus === 'PENDING' || paymentStatus === 'PROCESSING') && (
        <div className="grid items-start gap-6 lg:grid-cols-12">
          <Card className="h-fit lg:col-span-5">
            <CardHeader className="border-b">
              <CardTitle className="text-base">{t('payment.scan_qr_code')}</CardTitle>
              <CardDescription>{t('payment.scan_qr_description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mx-auto w-full max-w-[340px]">
                <div className="rounded-2xl border bg-background p-4 shadow-sm">
                  <div className="aspect-square overflow-hidden rounded-xl bg-muted flex items-center justify-center">
                    {qrImage ? (
                      <img src={qrImage} alt="QR Code" className="h-full w-full object-contain" />
                    ) : (
                      <Button asChild variant="link" className="px-4 text-center">
                        <a href={paymentData.checkoutUrl} target="_blank" rel="noopener noreferrer">
                          {t('payment.click_to_pay')}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t">
              <div className="flex w-full flex-col gap-2">
                <Button asChild variant="outline" className="w-full">
                  <a href={paymentData.checkoutUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    {t('payment.open_payment_page')}
                  </a>
                </Button>
              </div>
            </CardFooter>
          </Card>

          {paymentData.accountNumber ? (
            <Card className="h-fit lg:col-span-7">
              <CardHeader className="border-b">
                <CardTitle className="text-base">{t('payment.bank_info')}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {bankInfo.name || bankInfo.shortName || bankInfo.bin ? (
                  <>
                    <InfoRow
                      label={`${t('payment.bank_name')}:`}
                      value={
                        <div className="min-w-0 text-right">
                          <div className="truncate">{bankInfo.name || bankInfo.shortName || bankInfo.bin}</div>
                          {bankInfo.shortName && bankInfo.name ? (
                            <div className="text-xs text-muted-foreground">{bankInfo.shortName}</div>
                          ) : null}
                          {bankInfo.bin && (bankInfo.name || bankInfo.shortName) ? (
                            <div className="text-xs text-muted-foreground">{bankInfo.bin}</div>
                          ) : null}
                        </div>
                      }
                      copyText={bankInfo.name || bankInfo.shortName || bankInfo.bin || ''}
                    />
                    <Separator />
                  </>
                ) : null}

                <InfoRow
                  label={`${t('payment.account_number')}:`}
                  value={<span className="font-mono">{paymentData.accountNumber}</span>}
                  copyText={paymentData.accountNumber}
                />
                <Separator />

                {paymentData.accountName ? (
                  <>
                    <InfoRow
                      label={`${t('payment.account_name')}:`}
                      value={<span className="truncate">{paymentData.accountName}</span>}
                      copyText={paymentData.accountName}
                    />
                    <Separator />
                  </>
                ) : null}

                <InfoRow
                  label={`${t('payment.amount')}:`}
                  value={formatCurrency(paymentData.amount)}
                  copyText={paymentData.amount.toString()}
                  valueClassName="text-base font-semibold text-primary"
                />
                <Separator />

                <InfoRow
                  label={`${t('payment.transfer_content')}:`}
                  value={<span className="font-mono break-words">{transferContent}</span>}
                  copyText={transferContent}
                />

                {paymentData.orderCode ? (
                  <>
                    <Separator />
                    <InfoRow
                      label={`${t('payment.order_code')}:`}
                      value={<span className="font-mono">{paymentData.orderCode}</span>}
                      copyText={paymentData.orderCode.toString()}
                    />
                  </>
                ) : null}

                <div className="mt-4">
                  <Alert className="border-red-200/70 bg-red-50 text-red-950 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
                    <AlertCircle className="text-red-700 dark:text-red-300" />
                    <AlertDescription className="text-red-800 dark:text-red-200/90">
                      <p>{t('payment.transfer_content_warning')}</p>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {showActions && onRefresh && (paymentStatus === 'PENDING' || paymentStatus === 'PROCESSING') ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={onRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {t('payment.refresh_status')}
          </Button>
        </div>
      ) : null}
    </div>
  );
};
