import React, { useState, useEffect } from 'react';
import { Copy, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { walletApi } from '@/services/api/walletApi';
import { membershipApi } from '@/services/api/membershipApi';
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

interface BankQRPaymentContentProps {
  branchId: string;
  amount: number;
  contractId?: string; // Optional: only available after contract is created
  contractType: 'service' | 'membership';
  contractPaymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'QR_BANK';
  contractStatus?: string;
  transferContent?: string; // Optional: will be generated from contractId or temporary ID
  requiresApproval: boolean;
  formData?: {
    paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'QR_BANK';
  };
  onCreateContract?: () => Promise<string | null>; // Callback to create contract, returns contractId
  onPaymentSubmitted?: (contractId: string) => void;
  packageType?: 'PT' | 'CLASS'; // For generating transfer content
}

const copyToClipboard = async (text: string, successMessage: string) => {
  await navigator.clipboard
    .writeText(text)
    .then(() => toast.success(successMessage))
    .catch(() => toast.error('Không thể sao chép'));
};

export const BankQRPaymentContent: React.FC<BankQRPaymentContentProps> = ({
  branchId,
  amount,
  contractId,
  contractType,
  contractPaymentMethod,
  contractStatus,
  transferContent,
  requiresApproval,
  formData,
  onCreateContract,
  onPaymentSubmitted,
  packageType
}) => {
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [creatingContract, setCreatingContract] = useState(false);
  const [currentContractId, setCurrentContractId] = useState<string | undefined>(contractId);

  // Keep internal contract id in sync with prop updates
  useEffect(() => {
    setCurrentContractId(contractId);
    setPaymentSubmitted(false);
  }, [contractId]);

  // Generate temporary ID for transfer content if contractId not available
  const tempId = React.useMemo(() => {
    if (currentContractId) {
      return currentContractId.slice(-8);
    }
    // Generate temporary ID from timestamp
    return Date.now().toString().slice(-8);
  }, [currentContractId]);

  // Generate transfer content
  const finalTransferContent = React.useMemo(() => {
    if (transferContent) {
      return transferContent;
    }
    if (currentContractId) {
      if (contractType === 'membership') {
        return `MEMBERSHIP_${currentContractId.slice(-8)}`;
      }
      return `${packageType?.toUpperCase() || 'SERVICE'}_${currentContractId.slice(-8)}`;
    }
    // Use temporary ID
    if (contractType === 'membership') {
      return `MEMBERSHIP_PENDING_${tempId}`;
    }
    return `${packageType?.toUpperCase() || 'SERVICE'}_PENDING_${tempId}`;
  }, [transferContent, currentContractId, contractType, packageType, tempId]);

  useEffect(() => {
    if (!branchId) return;

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
  }, [branchId]);

  const handlePaymentSubmitted = async () => {
    const effectivePaymentMethod = contractPaymentMethod || formData?.paymentMethod;
    // Only allow confirming when we explicitly know this is a QR_BANK contract
    if (effectivePaymentMethod !== 'QR_BANK') {
      toast.error('Hợp đồng không sử dụng phương thức QR ngân hàng, không thể xác nhận.');
      return;
    }
    if (contractStatus && contractStatus !== 'PENDING_PAYMENT') {
      toast.error('Hợp đồng không ở trạng thái chờ thanh toán.');
      return;
    }

    // If contract not created yet, create it first
    if (!currentContractId && onCreateContract && formData) {
      setCreatingContract(true);
      try {
        const newContractId = await onCreateContract();
        if (newContractId) {
          setCurrentContractId(newContractId);
          // For customer self-service, contract is created with PENDING_PAYMENT
          // For owner/staff, contract is also created with PENDING_PAYMENT now
          // So we need to confirm payment
          if (contractType === 'membership') {
            try {
              await membershipApi.confirmQRBankPayment(newContractId);
              setPaymentSubmitted(true);
              onPaymentSubmitted?.(newContractId);
              if (requiresApproval) {
                toast.info('Đã ghi nhận yêu cầu thanh toán. Vui lòng chờ xác nhận từ quản lý.');
              } else {
                toast.success('Thanh toán đã được xác nhận thành công.');
              }
            } catch (error) {
              console.error('Error confirming payment:', error);
              toast.error('Không thể xác nhận thanh toán. Vui lòng thử lại.');
            }
          } else {
            // For service contracts, handle similarly if needed
            setPaymentSubmitted(true);
            onPaymentSubmitted?.(newContractId);
            if (requiresApproval) {
              toast.info('Đã ghi nhận yêu cầu thanh toán. Vui lòng chờ xác nhận từ quản lý.');
            } else {
              toast.success('Thanh toán đã được ghi nhận.');
            }
          }
        } else {
          toast.error('Không thể tạo hợp đồng. Vui lòng thử lại.');
        }
      } catch (error) {
        console.error('Error creating contract:', error);
        toast.error('Không thể tạo hợp đồng. Vui lòng thử lại.');
      } finally {
        setCreatingContract(false);
      }
    } else if (currentContractId) {
      // Contract already exists, confirm payment
      setCreatingContract(true);
      try {
        if (contractType === 'membership') {
          await membershipApi.confirmQRBankPayment(currentContractId);
          setPaymentSubmitted(true);
          onPaymentSubmitted?.(currentContractId);
          if (requiresApproval) {
            toast.info('Đã ghi nhận yêu cầu thanh toán. Vui lòng chờ xác nhận từ quản lý.');
          } else {
            toast.success('Thanh toán đã được xác nhận thành công.');
          }
        } else {
          // For service contracts, handle similarly if needed
          setPaymentSubmitted(true);
          onPaymentSubmitted?.(currentContractId);
          if (requiresApproval) {
            toast.info('Đã ghi nhận yêu cầu thanh toán. Vui lòng chờ xác nhận từ quản lý.');
          } else {
            toast.success('Thanh toán đã được ghi nhận.');
          }
        }
      } catch (error) {
        console.error('Error confirming payment:', error);
        toast.error('Không thể xác nhận thanh toán. Vui lòng thử lại.');
      } finally {
        setCreatingContract(false);
      }
    } else {
      toast.error('Thiếu thông tin để tạo hợp đồng.');
    }
  };

  if (loading) {
    return (
      <Card className="rounded-3xl border border-border bg-card shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Đang tải thông tin ngân hàng...</p>
        </CardContent>
      </Card>
    );
  }

  if (!bankAccount || !bankAccount.qrCodeUrl) {
    return (
      <Card className="rounded-3xl border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Thông tin ngân hàng không khả dụng</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Chi nhánh chưa liên kết tài khoản ngân hàng hoặc chưa có QR code.
          </p>
          <p className="text-sm text-muted-foreground mt-2">Vui lòng liên hệ quản lý để được hỗ trợ.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          Thanh toán qua QR Ngân hàng
        </CardTitle>
        <CardDescription>Vui lòng quét mã QR hoặc chuyển khoản theo thông tin dưới đây</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
                  {finalTransferContent}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(finalTransferContent, 'Đã sao chép')}
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

        {/* Action Button */}
        {!paymentSubmitted && (
          <div className="flex justify-center">
            <Button
              onClick={handlePaymentSubmitted}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={creatingContract}
            >
              {creatingContract ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo hợp đồng...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Tôi đã chuyển khoản
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
