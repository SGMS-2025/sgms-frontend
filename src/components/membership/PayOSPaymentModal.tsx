import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, ExternalLink, QrCode, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { usePaymentSocket, type PaymentUpdateData } from '@/hooks/useSocket';
import type { MembershipPlan } from '@/types/api/Membership';
import type { PayOSPaymentData } from '@/services/api/paymentApi';
import type { Branch } from '@/types/api/Branch';
import QRCode from 'qrcode';
import { VIETQR_BANKS } from '@/constants/vietqrBanks';

interface PayOSPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch;
  plan: MembershipPlan;
  paymentInfo: PayOSPaymentData;
  loading: boolean;
  error?: string | null;
  onPaymentComplete?: () => void;
}

export const PayOSPaymentModal: React.FC<PayOSPaymentModalProps> = ({
  isOpen,
  onClose,
  branch,
  plan,
  paymentInfo,
  loading,
  error,
  onPaymentComplete
}) => {
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('PENDING');
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);

  // Format price
  const formatPrice = (value: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} đã được sao chép`);
    } catch {
      toast.error('Không thể sao chép');
    }
  };

  const pickFirstString = (...values: Array<unknown>): string | null => {
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

  const paymentMetadata = useMemo(() => {
    const paymentObj = paymentInfo.payment;
    if (!paymentObj || typeof paymentObj !== 'object') return null;
    const metadata = (paymentObj as { metadata?: unknown }).metadata;
    return metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : null;
  }, [paymentInfo.payment]);

  const payosMeta = useMemo(() => {
    const meta = paymentMetadata && typeof paymentMetadata.payos === 'object' ? paymentMetadata.payos : null;
    return meta && typeof meta === 'object' ? (meta as Record<string, unknown>) : {};
  }, [paymentMetadata]);

  const bankInfo = useMemo(() => {
    const bin = paymentInfo.bin?.trim() || null;
    const metaBin = pickFirstString(paymentInfo.bin, payosMeta['bankCode'], payosMeta['bin']);
    const resolvedBin = metaBin ?? bin;
    const entry = resolvedBin ? VIETQR_BANKS[resolvedBin] : undefined;

    const resolvedName =
      pickFirstString(paymentInfo.bankName, payosMeta['bankName'], payosMeta['bank'], payosMeta['bank_label']) ??
      entry?.name ??
      null;

    const resolvedShortName =
      pickFirstString(paymentInfo.bankShortName, payosMeta['bankShortName'], payosMeta['bank_short']) ??
      entry?.shortName ??
      null;

    return {
      name: resolvedName,
      shortName: resolvedShortName,
      bin: resolvedBin ?? null
    };
  }, [paymentInfo.bankName, paymentInfo.bankShortName, paymentInfo.bin, payosMeta]);

  // Open payment link
  const openPaymentLink = () => {
    const link = pickFirstString(paymentInfo.checkoutUrl, payosMeta['checkoutUrl'], payosMeta['paymentUrl']);
    if (link) {
      window.open(link, '_blank');
    }
  };

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

    const loadQrImage = async () => {
      const rawQrSource = pickFirstString(
        paymentInfo.qrCode,
        payosMeta['qrCode'],
        payosMeta['qrImage'],
        payosMeta['qrImageUrl'],
        payosMeta['qrCodeUrl'],
        payosMeta['qr_code_url'],
        payosMeta['qrDataUrl'],
        payosMeta['qr_data_url']
      );

      const normalizedSource = normalizeImageSource(rawQrSource);
      if (normalizedSource) {
        if (isMounted) setQrImage(normalizedSource);
        return;
      }

      const rawQrPayload =
        pickFirstString(
          paymentInfo.qrString,
          payosMeta['qrString'],
          payosMeta['qrContent'],
          payosMeta['qr_data'],
          payosMeta['qrRaw'],
          payosMeta['qr_raw']
        ) ?? pickFirstString(paymentInfo.checkoutUrl, payosMeta['checkoutUrl'], payosMeta['paymentUrl']);

      if (rawQrPayload) {
        try {
          const dataUrl = await QRCode.toDataURL(rawQrPayload, { width: 256, margin: 1 });
          if (isMounted) setQrImage(dataUrl);
        } catch (_error) {
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
  }, [paymentInfo, payosMeta]);

  const transferContent = useMemo(() => {
    const resolved = pickFirstString(
      paymentInfo.transferContent,
      paymentMetadata?.transferContent,
      paymentMetadata?.transfer_content,
      payosMeta['transferContent'],
      payosMeta['transfer_content'],
      paymentInfo.description,
      typeof paymentInfo.orderCode === 'number' ? String(paymentInfo.orderCode) : null
    );
    return resolved ?? '';
  }, [paymentInfo, paymentMetadata, payosMeta]);

  // Use socket service for realtime payment updates
  usePaymentSocket(
    paymentInfo?.orderCode || null,
    (data: PaymentUpdateData) => {
      if (data.status) {
        setPaymentStatus(data.status);

        if (data.status === 'PAID') {
          setIsPaymentCompleted(true);
          toast.success('Thanh toán thành công! Gói membership đã được kích hoạt.');
          setTimeout(() => {
            onPaymentComplete?.();
          }, 2000);
        } else if (data.status === 'CANCELLED') {
          toast.error('Thanh toán đã bị hủy hoặc hết hạn.');
        }
      }
    },
    {
      paymentLinkId: paymentInfo?.paymentLinkId,
      onFallback: () => {
        setIsCheckingPayment(false);
      }
    }
  );

  // Manual check payment status
  const checkPaymentStatus = async () => {
    setIsCheckingPayment(true);
    setTimeout(() => setIsCheckingPayment(false), 2000);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Đang tạo liên kết thanh toán...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl p-6">
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lỗi tạo thanh toán</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={onClose} variant="outline">
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left side - Payment Info */}
          <div className="w-full lg:w-[50%] bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-background p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán PayOS</h2>
              <p className="text-gray-600">Quét QR hoặc chuyển khoản để hoàn tất đăng ký</p>
            </div>

            {/* Plan Info */}
            <div className="bg-white rounded-lg p-4 border">
              <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
              <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Thời hạn:</span>
                <span className="font-medium">{plan.durationInMonths} tháng</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">Chi nhánh:</span>
                <span className="font-medium">{branch.branchName}</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Tổng cộng:</span>
                  <span className="text-xl font-bold text-blue-600">{formatPrice(paymentInfo.amount)}</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Cách thanh toán:</h4>

              {/* QR Code */}
              {!!(qrImage || paymentInfo.checkoutUrl) && (
                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Quét QR Code</span>
                    <QrCode className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="text-center">
                    {qrImage ? (
                      <img src={qrImage} alt="QR Code" className="w-32 h-32 mx-auto border rounded object-contain" />
                    ) : (
                      <div className="w-32 h-32 mx-auto border rounded flex items-center justify-center">
                        <a
                          href={paymentInfo.checkoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline text-sm px-2 text-center"
                        >
                          Mở trang thanh toán
                        </a>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Mở app ngân hàng và quét mã QR này</p>
                  </div>
                </div>
              )}

              {/* Payment Link */}
              {!!paymentInfo.checkoutUrl && (
                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Thanh toán online</span>
                    <ExternalLink className="h-5 w-5 text-blue-500" />
                  </div>
                  <Button onClick={openPaymentLink} className="w-full" size="lg">
                    Mở trang thanh toán
                  </Button>
                </div>
              )}

              {/* Bank Transfer Info */}
              {!!paymentInfo.accountNumber && (
                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Chuyển khoản ngân hàng</span>
                    <Copy className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    {!!(bankInfo.name || bankInfo.shortName || bankInfo.bin) && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Ngân hàng:</span>
                        <div className="flex items-center space-x-2">
                          <div className="flex flex-col items-end">
                            <span className="font-medium">{bankInfo.name || bankInfo.shortName || bankInfo.bin}</span>
                            {!!(bankInfo.shortName && bankInfo.name) && (
                              <span className="text-xs text-gray-500">{bankInfo.shortName}</span>
                            )}
                            {!!(bankInfo.bin && (bankInfo.name || bankInfo.shortName)) && (
                              <span className="text-xs text-gray-400">{bankInfo.bin}</span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              copyToClipboard(bankInfo.name || bankInfo.shortName || bankInfo.bin || '', 'Ngân hàng')
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Số tài khoản:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-medium">{paymentInfo.accountNumber}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(paymentInfo.accountNumber!, 'Số tài khoản')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {!!paymentInfo.accountName && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Tên tài khoản:</span>
                        <span className="font-medium">{paymentInfo.accountName}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Nội dung:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm text-right whitespace-pre-wrap break-words max-w-[180px]">
                          {transferContent}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(transferContent, 'Nội dung chuyển khoản')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {!!paymentInfo.orderCode && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Mã đơn PayOS:</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm">{paymentInfo.orderCode}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(paymentInfo.orderCode.toString(), 'Mã đơn PayOS')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Số tiền:</span>
                      <span className="font-bold text-blue-600">{formatPrice(paymentInfo.amount)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Status */}
          <div className="w-full lg:w-[50%] bg-white p-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Đang chờ thanh toán</h3>
              <p className="text-gray-600 text-sm">Vui lòng hoàn tất thanh toán để kích hoạt gói membership</p>
            </div>

            {/* Payment Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Trạng thái:</span>
                <span
                  className={`text-sm font-medium ${
                    paymentStatus === 'PAID'
                      ? 'text-green-600'
                      : paymentStatus === 'CANCELLED' || paymentStatus === 'EXPIRED'
                        ? 'text-red-600'
                        : 'text-orange-600'
                  }`}
                >
                  {paymentStatus === 'PAID'
                    ? 'Đã thanh toán'
                    : paymentStatus === 'CANCELLED'
                      ? 'Đã hủy'
                      : paymentStatus === 'EXPIRED'
                        ? 'Hết hạn'
                        : 'Chờ thanh toán'}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Mã giao dịch:</span>
                <span className="text-sm font-mono">{paymentInfo.orderCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Số tiền:</span>
                <span className="text-sm font-bold text-blue-600">{formatPrice(paymentInfo.amount)}</span>
              </div>
            </div>

            {/* Auto-check status */}
            <div className="text-center">
              <Button
                onClick={checkPaymentStatus}
                disabled={isCheckingPayment || isPaymentCompleted}
                variant="outline"
                className="w-full"
              >
                {isCheckingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang kiểm tra...
                  </>
                ) : isPaymentCompleted ? (
                  'Đã thanh toán'
                ) : (
                  'Kiểm tra thanh toán'
                )}
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                {isPaymentCompleted
                  ? 'Thanh toán đã hoàn tất thành công'
                  : 'Hệ thống sẽ tự động kiểm tra trạng thái thanh toán'}
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Hướng dẫn thanh toán:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Quét QR code bằng app ngân hàng</li>
                <li>• Hoặc chuyển khoản với nội dung chính xác</li>
                <li>• Hoặc click "Thanh toán online" để mở trang PayOS</li>
                <li>• Sau khi thanh toán, gói sẽ được kích hoạt tự động</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <Button onClick={onClose} variant="outline" className="flex-1">
                {isPaymentCompleted ? 'Hoàn tất' : 'Đóng'}
              </Button>
              {!isPaymentCompleted && (
                <Button onClick={checkPaymentStatus} className="flex-1" disabled={isCheckingPayment}>
                  {isCheckingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Đang kiểm tra...
                    </>
                  ) : (
                    'Tôi đã thanh toán'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
