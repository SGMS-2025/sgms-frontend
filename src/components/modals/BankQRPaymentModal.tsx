import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { walletApi } from '@/services/api/walletApi';
import { formatCurrency } from '@/utils/currency';
import { getBankName } from '@/constants/bankList';

interface BankAccount {
  _id?: string;
  branchId: string;
  accountNumber: string;
  accountName: string;
  bankBin: string;
  bankName?: string;
  qrCodeUrl?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface BankQRPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  amount: number;
  transferContent: string; // Nội dung chuyển khoản (có thể dùng contract ID)
  requiresApproval: boolean; // true nếu customer self-service, false nếu staff/owner
  onPaymentSubmitted?: () => void; // Callback khi khách đã chuyển khoản
}

const copyToClipboard = async (text: string, successMessage: string) => {
  await navigator.clipboard
    .writeText(text)
    .then(() => toast.success(successMessage))
    .catch(() => toast.error('Không thể sao chép'));
};

export const BankQRPaymentModal: React.FC<BankQRPaymentModalProps> = ({
  isOpen,
  onClose,
  branchId,
  amount,
  transferContent,
  requiresApproval,
  onPaymentSubmitted
}) => {
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen || !branchId) return;

    const loadBankAccount = async () => {
      setLoading(true);
      try {
        const data = await walletApi.getBankAccount(branchId);
        setBankAccount(data || null);
        if (!data) {
          toast.error('Chi nhánh chưa liên kết tài khoản ngân hàng');
        }
      } catch (error) {
        console.error('Error loading bank account:', error);
        toast.error('Không thể tải thông tin ngân hàng');
      } finally {
        setLoading(false);
      }
    };

    loadBankAccount();
  }, [isOpen, branchId]);

  const handlePaymentSubmitted = () => {
    setPaymentSubmitted(true);
    onPaymentSubmitted?.();
    if (requiresApproval) {
      toast.info('Đã gửi yêu cầu thanh toán. Vui lòng chờ xác nhận từ quản lý.');
    } else {
      toast.success('Thanh toán đã được ghi nhận.');
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Đang tải thông tin ngân hàng...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!bankAccount || !bankAccount.qrCodeUrl) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thông tin ngân hàng không khả dụng</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Chi nhánh chưa liên kết tài khoản ngân hàng hoặc chưa có QR code.
            </p>
            <p className="text-sm text-muted-foreground mt-2">Vui lòng liên hệ quản lý để được hỗ trợ.</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Đóng</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Thanh toán qua QR Ngân hàng</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning if requires approval */}
          {requiresApproval && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">Yêu cầu xác nhận từ quản lý</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Sau khi chuyển khoản, giao dịch của bạn sẽ cần được quản lý xác nhận. Vui lòng chờ thông báo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* QR Code */}
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Quét mã QR để chuyển khoản</h3>
              <p className="text-sm text-gray-600">Mở ứng dụng ngân hàng và quét mã QR bên dưới</p>
            </div>

            <div className="border-4 border-gray-200 rounded-lg p-4 bg-white">
              <img src={bankAccount.qrCodeUrl} alt="QR Code" className="w-64 h-64 object-contain" />
            </div>
          </div>

          {/* Bank Account Information */}
          <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold text-gray-800">Thông tin tài khoản nhận</h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ngân hàng:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{getBankName(bankAccount.bankBin)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(getBankName(bankAccount.bankBin), 'Đã sao chép')}
                    className="h-6 w-6"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Số tài khoản:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{bankAccount.accountNumber}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(bankAccount.accountNumber, 'Đã sao chép')}
                    className="h-6 w-6"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tên tài khoản:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{bankAccount.accountName}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(bankAccount.accountName, 'Đã sao chép')}
                    className="h-6 w-6"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Số tiền:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg text-blue-600">{formatCurrency(amount)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(amount.toString(), 'Đã sao chép')}
                    className="h-6 w-6"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-600">Nội dung chuyển khoản:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-right whitespace-pre-wrap break-words max-w-[220px]">
                    {transferContent}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(transferContent, 'Đã sao chép')}
                    className="h-6 w-6"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-xs text-red-600 mt-3">
              ⚠️ Vui lòng chuyển đúng số tiền và nội dung chuyển khoản để giao dịch được xử lý nhanh chóng.
            </p>
          </div>

          {/* Payment Submitted Status */}
          {paymentSubmitted && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900">Đã ghi nhận yêu cầu thanh toán</p>
                  {requiresApproval && (
                    <p className="text-xs text-green-700 mt-1">
                      Quản lý sẽ xác nhận giao dịch của bạn trong thời gian sớm nhất.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            {!paymentSubmitted ? (
              <>
                <Button variant="outline" onClick={onClose}>
                  Hủy
                </Button>
                <Button onClick={handlePaymentSubmitted} className="bg-blue-600 hover:bg-blue-700">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Tôi đã chuyển khoản
                </Button>
              </>
            ) : (
              <Button onClick={onClose}>Đóng</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
