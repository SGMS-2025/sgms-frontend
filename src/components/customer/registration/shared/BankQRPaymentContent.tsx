import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, CheckCircle, AlertCircle, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { walletApi } from '@/services/api/walletApi';
import { membershipApi } from '@/services/api/membershipApi';
import { serviceContractApi } from '@/services/api/serviceContractApi';
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
  onCreateContract?: (transferReceiptFile?: File | null) => Promise<string | null>; // Callback to create contract, returns contractId
  onPaymentSubmitted?: (contractId: string) => void;
  packageType?: 'PT' | 'CLASS'; // For generating transfer content
}

const copyToClipboard = async (text: string, successMessage: string, t: (key: string) => string) => {
  await navigator.clipboard
    .writeText(text)
    .then(() => toast.success(successMessage))
    .catch(() => toast.error(t('bank_qr_payment.error.copy_failed')));
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
  const { t } = useTranslation();
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [creatingContract, setCreatingContract] = useState(false);
  const [currentContractId, setCurrentContractId] = useState<string | undefined>(contractId);
  const [transferReceiptFile, setTransferReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Keep internal contract id in sync with prop updates
  useEffect(() => {
    setCurrentContractId(contractId);
    setPaymentSubmitted(false);
  }, [contractId]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error(t('bank_qr_payment.error.invalid_file_type'));
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('bank_qr_payment.error.file_too_large'));
        return;
      }
      setTransferReceiptFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = () => {
    setTransferReceiptFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

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
          toast.error(t('bank_qr_payment.error.branch_no_account'));
        }
      } catch (error) {
        console.error('Error loading bank account:', error);
        toast.error(t('bank_qr_payment.error.load_failed'));
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
      toast.error(t('bank_qr_payment.error.invalid_method'));
      return;
    }
    if (contractStatus && contractStatus !== 'PENDING_PAYMENT') {
      toast.error(t('bank_qr_payment.error.invalid_status'));
      return;
    }

    // Validate transfer receipt file
    if (!transferReceiptFile) {
      toast.error(t('bank_qr_payment.error.receipt_required'));
      return;
    }

    // If contract not created yet, create it first
    if (!currentContractId && onCreateContract && formData) {
      setCreatingContract(true);
      try {
        const newContractId = await onCreateContract(transferReceiptFile);
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
                toast.info(t('bank_qr_payment.info.payment_recorded'));
              } else {
                toast.success(t('bank_qr_payment.success.payment_confirmed'));
              }
            } catch (error) {
              console.error('Error confirming payment:', error);
              toast.error(t('bank_qr_payment.error.confirm_payment_failed'));
            }
          } else {
            try {
              await serviceContractApi.confirmQRBankPayment(newContractId);
              setPaymentSubmitted(true);
              onPaymentSubmitted?.(newContractId);
              if (requiresApproval) {
                toast.info(t('bank_qr_payment.info.payment_recorded'));
              } else {
                toast.success(t('bank_qr_payment.success.payment_confirmed'));
              }
            } catch (error) {
              console.error('Error confirming payment:', error);
              toast.error(t('bank_qr_payment.error.confirm_payment_failed'));
            }
          }
        } else {
          toast.error(t('bank_qr_payment.error.create_contract_failed'));
        }
      } catch (error) {
        console.error('Error creating contract:', error);
        toast.error(t('bank_qr_payment.error.create_contract_failed'));
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
            toast.info(t('bank_qr_payment.info.payment_recorded'));
          } else {
            toast.success(t('bank_qr_payment.success.payment_confirmed'));
          }
        } else {
          await serviceContractApi.confirmQRBankPayment(currentContractId);
          setPaymentSubmitted(true);
          onPaymentSubmitted?.(currentContractId);
          if (requiresApproval) {
            toast.info(t('bank_qr_payment.info.payment_recorded'));
          } else {
            toast.success(t('bank_qr_payment.success.payment_confirmed'));
          }
        }
      } catch (error) {
        console.error('Error confirming payment:', error);
        toast.error(t('bank_qr_payment.error.confirm_payment_failed'));
      } finally {
        setCreatingContract(false);
      }
    } else {
      toast.error(t('bank_qr_payment.error.missing_info'));
    }
  };

  if (loading) {
    return (
      <Card className="rounded-3xl border border-border bg-card shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">{t('bank_qr_payment.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  if (!bankAccount || !bankAccount.qrCodeUrl) {
    return (
      <Card className="rounded-3xl border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>{t('bank_qr_payment.unavailable_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('bank_qr_payment.unavailable_message')}</p>
          <p className="text-sm text-muted-foreground mt-2">{t('bank_qr_payment.unavailable_contact')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          {t('bank_qr_payment.title')}
        </CardTitle>
        <CardDescription>{t('bank_qr_payment.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning if requires approval */}
        {requiresApproval && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">{t('bank_qr_payment.requires_approval_title')}</p>
                <p className="text-xs text-amber-700 mt-1">{t('bank_qr_payment.requires_approval_message')}</p>
              </div>
            </div>
          </div>
        )}

        {/* QR Code */}
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">{t('bank_qr_payment.scan_qr_title')}</h3>
            <p className="text-sm text-gray-600">{t('bank_qr_payment.scan_qr_instruction')}</p>
          </div>

          <div className="border-4 border-gray-200 rounded-lg p-4 bg-white">
            <img src={bankAccount.qrCodeUrl} alt="QR Code" className="w-64 h-64 object-contain" />
          </div>
        </div>

        {/* Bank Account Information */}
        <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold text-gray-800">{t('bank_qr_payment.account_info_title')}</h3>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('bank_qr_payment.bank_label')}</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{getBankName(bankAccount.bankBin)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(getBankName(bankAccount.bankBin), t('bank_qr_payment.copied'), t)}
                  className="h-6 w-6"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('bank_qr_payment.account_number_label')}</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{bankAccount.accountNumber}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(bankAccount.accountNumber, t('bank_qr_payment.copied'), t)}
                  className="h-6 w-6"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('bank_qr_payment.account_name_label')}</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{bankAccount.accountName}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(bankAccount.accountName, t('bank_qr_payment.copied'), t)}
                  className="h-6 w-6"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('bank_qr_payment.amount_label')}</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-blue-600">{formatCurrency(amount)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(amount.toString(), t('bank_qr_payment.copied'), t)}
                  className="h-6 w-6"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-600">{t('bank_qr_payment.transfer_content_label')}</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-right whitespace-pre-wrap break-words max-w-[220px]">
                  {finalTransferContent}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(finalTransferContent, t('bank_qr_payment.copied'), t)}
                  className="h-6 w-6"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <p className="text-xs text-red-600 mt-3">{t('bank_qr_payment.transfer_warning')}</p>
        </div>

        {/* Transfer Receipt Upload */}
        <div className="space-y-2 p-4 border rounded-lg bg-white">
          <Label className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            {t('bank_qr_payment.receipt_upload_title')}
          </Label>
          {!transferReceiptFile ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="transfer-receipt-upload"
              />
              <label htmlFor="transfer-receipt-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-600">{t('bank_qr_payment.receipt_upload_click')}</span>
                <span className="text-xs text-gray-500">{t('bank_qr_payment.receipt_upload_formats')}</span>
              </label>
            </div>
          ) : (
            <div className="relative border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-4">
                {previewUrl && (
                  <img src={previewUrl} alt="Transfer receipt preview" className="w-24 h-24 object-cover rounded-lg" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{transferReceiptFile.name}</p>
                  <p className="text-xs text-gray-500">{(transferReceiptFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={handleRemoveFile} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{t('bank_qr_payment.receipt_upload_instruction')}</p>
        </div>

        {/* Payment Submitted Status */}
        {paymentSubmitted && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900">{t('bank_qr_payment.submitted_title')}</p>
                {requiresApproval && (
                  <p className="text-xs text-green-700 mt-1">{t('bank_qr_payment.submitted_message')}</p>
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
                  {t('bank_qr_payment.creating_contract')}
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {t('bank_qr_payment.confirm_button')}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
