import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, CheckCircle, AlertCircle, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { walletApi } from '@/services/api/walletApi';
import { membershipApi } from '@/services/api/membershipApi';
import { serviceContractApi } from '@/services/api/serviceContractApi';
import { formatCurrency } from '@/utils/currency';
import { getBankName } from '@/constants/bankList';

// Sanitize file names coming from the browser to avoid any chance of HTML/meta-characters
// being interpreted in the DOM if they are ever rendered in a non-React context.
const sanitizeFileName = (name: string): string => {
  // Remove angle brackets and control characters
  const withoutAngles = name.replace(/[<>]/g, '');
  let sanitized = '';
  for (const char of withoutAngles) {
    const codePoint = char.codePointAt(0) ?? 0;
    if (codePoint >= 0x20 && codePoint !== 0x7f) sanitized += char;
  }
  return sanitized;
};

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
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
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
  }, [branchId, t]);

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
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">{t('bank_qr_payment.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  if (!bankAccount || !bankAccount.qrCodeUrl) {
    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t('bank_qr_payment.title')}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{t('bank_qr_payment.subtitle')}</p>
        </div>

        <Alert className="border-border bg-card">
          <AlertCircle className="text-muted-foreground" />
          <AlertTitle>{t('bank_qr_payment.unavailable_title')}</AlertTitle>
          <AlertDescription>
            <p>{t('bank_qr_payment.unavailable_message')}</p>
            <p>{t('bank_qr_payment.unavailable_contact')}</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
              onClick={() => copyToClipboard(copyText, t('bank_qr_payment.copied'), t)}
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
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('bank_qr_payment.title')}</h2>
          </div>
          <Badge variant="secondary" className="rounded-full">
            QR Bank
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{t('bank_qr_payment.subtitle')}</p>
      </div>

      {requiresApproval && (
        <Alert className="border-amber-200/70 bg-amber-50 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          <AlertCircle className="text-amber-700 dark:text-amber-300" />
          <AlertTitle className="text-amber-950 dark:text-amber-100">
            {t('bank_qr_payment.requires_approval_title')}
          </AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-200/90">
            <p>{t('bank_qr_payment.requires_approval_message')}</p>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <Card className="h-fit lg:col-span-5">
          <CardHeader className="border-b">
            <CardTitle className="text-base">{t('bank_qr_payment.scan_qr_title')}</CardTitle>
            <CardDescription>{t('bank_qr_payment.scan_qr_instruction')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mx-auto w-full max-w-[340px]">
              <div className="rounded-2xl border bg-background p-4 shadow-sm">
                <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                  <img src={bankAccount.qrCodeUrl} alt="QR Code" className="h-full w-full object-contain" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit lg:col-span-7">
          <CardHeader className="border-b">
            <CardTitle className="text-base">{t('bank_qr_payment.account_info_title')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow
              label={t('bank_qr_payment.bank_label')}
              value={getBankName(bankAccount.bankBin)}
              copyText={getBankName(bankAccount.bankBin)}
            />
            <Separator />
            <InfoRow
              label={t('bank_qr_payment.account_number_label')}
              value={<span className="font-mono">{bankAccount.accountNumber}</span>}
              copyText={bankAccount.accountNumber}
            />
            <Separator />
            <InfoRow
              label={t('bank_qr_payment.account_name_label')}
              value={<span className="truncate">{bankAccount.accountName}</span>}
              copyText={bankAccount.accountName}
            />
            <Separator />
            <InfoRow
              label={t('bank_qr_payment.amount_label')}
              value={formatCurrency(amount)}
              copyText={amount.toString()}
              valueClassName="text-base font-semibold text-primary"
            />
            <Separator />
            <InfoRow
              label={t('bank_qr_payment.transfer_content_label')}
              value={<span className="font-mono break-words">{finalTransferContent}</span>}
              copyText={finalTransferContent}
            />
            <div className="mt-4">
              <Alert className="border-red-200/70 bg-red-50 text-red-950 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
                <AlertCircle className="text-red-700 dark:text-red-300" />
                <AlertDescription className="text-red-800 dark:text-red-200/90">
                  <p>{t('bank_qr_payment.transfer_warning')}</p>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-12 py-4">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              {t('bank_qr_payment.receipt_upload_title')}
            </CardTitle>
            <CardDescription>{t('bank_qr_payment.receipt_upload_instruction')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {!transferReceiptFile ? (
              <div className="mx-auto w-full max-w-[720px]">
                <div className="h-[180px] rounded-xl border border-dashed bg-muted/20 px-5 py-4 text-center transition-colors hover:bg-muted/30 flex items-center justify-center">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    id="transfer-receipt-upload"
                  />
                  <label
                    htmlFor="transfer-receipt-upload"
                    className="cursor-pointer flex flex-col items-center gap-1.5"
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background border">
                      <Upload className="h-4.5 w-4.5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{t('bank_qr_payment.receipt_upload_click')}</p>
                      <p className="text-xs text-muted-foreground">{t('bank_qr_payment.receipt_upload_formats')}</p>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-[720px]">
                <div className="rounded-xl border bg-muted/10 p-3">
                  <div className="flex items-center gap-4">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Transfer receipt preview"
                        className="h-16 w-16 shrink-0 rounded-lg object-cover border"
                      />
                    ) : (
                      <div className="h-16 w-16 shrink-0 rounded-lg bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{sanitizeFileName(transferReceiptFile.name)}</p>
                      <p className="text-xs text-muted-foreground">
                        {(transferReceiptFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={handleRemoveFile} className="h-9 w-9">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {!paymentSubmitted ? (
            <CardFooter className="border-t pt-4">
              <Button
                onClick={handlePaymentSubmitted}
                className="w-full max-w-[720px] mx-auto"
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
            </CardFooter>
          ) : null}
        </Card>

        {paymentSubmitted && (
          <Alert className="lg:col-span-12 border-green-200/70 bg-green-50 text-green-950 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-100">
            <CheckCircle className="text-green-700 dark:text-green-300" />
            <AlertTitle className="text-green-950 dark:text-green-100">
              {t('bank_qr_payment.submitted_title')}
            </AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-200/90">
              {requiresApproval ? <p>{t('bank_qr_payment.submitted_message')}</p> : null}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};
