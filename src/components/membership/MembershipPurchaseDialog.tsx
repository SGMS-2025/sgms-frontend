import React, { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { staffApi } from '@/services/api/staffApi';
import type { MembershipPaymentMethod, MembershipPlan } from '@/types/api/Membership';
import type { Branch } from '@/types/api/Branch';

interface MembershipPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch;
  plan: MembershipPlan;
  loading: boolean;
  error?: string | null;
  onSubmit: (payload: {
    transactionCode?: string;
    note?: string;
    startDate?: string;
    referralCode?: string;
  }) => Promise<void>;
  onPayOSSubmit?: (payload: { note?: string; startDate?: string; referralCode?: string }) => Promise<void>;
}

export const MembershipPurchaseDialog: React.FC<MembershipPurchaseDialogProps> = ({
  isOpen,
  onClose,
  branch,
  plan,
  loading,
  error,
  onSubmit,
  onPayOSSubmit
}) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [transactionCode, setTransactionCode] = useState('');
  const [note, setNote] = useState('');
  const [startDate, setStartDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [acknowledged, setAcknowledged] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'PAYOS'>('BANK_TRANSFER');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // CASE 1: Referral code state
  const [referralCode, setReferralCode] = useState('');
  const [referralCodeValidating, setReferralCodeValidating] = useState(false);
  const [referralCodeValid, setReferralCodeValid] = useState<boolean | null>(null);
  const [referralStaffName, setReferralStaffName] = useState<string | null>(null);

  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: plan.currency || 'VND',
      maximumFractionDigits: 0
    }).format(plan.price);
  }, [plan.currency, plan.price]);

  const paymentInstruction = useMemo(() => {
    if (branch.hotline) {
      return t('gymDetail.membership.purchase.bankFallback', { hotline: branch.hotline });
    }
    return t('gymDetail.membership.purchase.bankFallbackNoHotline');
  }, [branch.hotline, t]);

  const acknowledgementLabel = t('gymDetail.membership.purchase.transferAcknowledgement');
  const acknowledgementRequiredMessage = t('gymDetail.membership.purchase.transferConfirmationRequired');
  const notePlaceholder = t('gymDetail.membership.purchase.notePlaceholderBank');

  // Validate referral code
  const validateReferralCode = async (code: string) => {
    if (!code || code.trim() === '') {
      setReferralCodeValid(null);
      setReferralStaffName(null);
      return;
    }

    const normalizedCode = code.trim().toUpperCase();
    setReferralCodeValidating(true);
    setReferralCodeValid(null);
    setReferralStaffName(null);

    try {
      const response = await staffApi.getStaffByReferralCode(normalizedCode);
      if (response.success && response.data) {
        setReferralCodeValid(true);
        setReferralStaffName(response.data.userId?.fullName || 'PT');
      } else {
        setReferralCodeValid(false);
      }
    } catch (_error) {
      setReferralCodeValid(false);
    } finally {
      setReferralCodeValidating(false);
    }
  };

  const handleReferralCodeChange = (value: string) => {
    const normalizedValue = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setReferralCode(normalizedValue);

    if (normalizedValue.length >= 3) {
      validateReferralCode(normalizedValue);
    } else {
      setReferralCodeValid(null);
      setReferralStaffName(null);
    }
  };

  const resetForm = () => {
    setTransactionCode('');
    setNote('');
    setReferralCode('');
    setReferralCodeValid(null);
    setReferralStaffName(null);
    setSubmitError(null);
    setAcknowledged(false);
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
  };

  // Get referral code from URL params if exists
  useEffect(() => {
    if (isOpen) {
      const refFromUrl = searchParams.get('ref');
      if (refFromUrl) {
        const normalizedRef = refFromUrl.toUpperCase();
        setReferralCode(normalizedRef);
        // Only validate if code is long enough
        if (normalizedRef.length >= 3) {
          validateReferralCode(normalizedRef);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    handleClose();
  };

  const handleSubmit = async () => {
    if (!acknowledged) {
      setSubmitError(acknowledgementRequiredMessage);
      return;
    }

    try {
      setSubmitError(null);

      if (paymentMethod === 'PAYOS' && onPayOSSubmit) {
        const payload = {
          note: note.trim() || undefined,
          startDate,
          referralCode: referralCode.trim() || undefined
        };
        await onPayOSSubmit(payload);
      } else {
        const payload = {
          paymentMethod: 'BANK_TRANSFER' as MembershipPaymentMethod,
          transactionCode: transactionCode.trim() || undefined,
          note: note.trim() || undefined,
          startDate,
          referralCode: referralCode.trim() || undefined
        };
        await onSubmit(payload);
      }

      resetForm();
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : t('gymDetail.membership.purchase.error');
      setSubmitError(message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl p-0 md:p-0 overflow-hidden bg-background">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-[45%] bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-background p-6 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {branch.branchName} • {branch.location}
              </p>
              <h2 className="text-2xl font-semibold text-foreground mt-1">
                {t('gymDetail.membership.purchase.title')}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {t('gymDetail.membership.purchase.subtitle', { planName: plan.name })}
              </p>
            </div>

            <div className="rounded-xl bg-background/80 p-4 shadow-sm border border-border/80 space-y-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                {t('gymDetail.membership.purchase.planInfo')}
              </h3>
              <div>
                <p className="text-lg font-semibold text-foreground">{plan.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formattedPrice} / {t('gymDetail.membership.intervals.monthShort')}
                </p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  {t('gymDetail.membership.purchase.duration', {
                    months: plan.durationInMonths
                  })}
                </p>
                {plan.description && <p className="line-clamp-3">{plan.description}</p>}
              </div>
            </div>

            <div className="rounded-xl bg-background/60 p-4 border border-dashed border-border/60 space-y-2 text-sm text-muted-foreground">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                {t('gymDetail.membership.purchase.branchInfo')}
              </h3>
              <p>{paymentInstruction}</p>
            </div>
          </div>

          <div className="w-full md:w-[55%] p-6 space-y-6">
            {/* Payment Method Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">Phương thức thanh toán</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`p-4 border rounded-lg cursor-pointer transition-colors w-full text-left ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        paymentMethod === 'BANK_TRANSFER' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}
                    >
                      {paymentMethod === 'BANK_TRANSFER' && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">Chuyển khoản thủ công</p>
                      <p className="text-xs text-gray-500">Nhập mã giao dịch</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  className={`p-4 border rounded-lg cursor-pointer transition-colors w-full text-left ${
                    paymentMethod === 'PAYOS' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('PAYOS')}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        paymentMethod === 'PAYOS' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}
                    >
                      {paymentMethod === 'PAYOS' && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">PayOS QR</p>
                      <p className="text-xs text-gray-500">Quét QR thanh toán</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium text-foreground">
                {t('gymDetail.membership.purchase.startDate')}
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full"
              />
            </div>

            {/* CASE 1: Referral Code Input */}
            <div className="space-y-2">
              <Label htmlFor="referralCode" className="text-sm font-medium text-foreground">
                Mã giới thiệu PT (tùy chọn)
              </Label>
              <div className="relative">
                <Input
                  id="referralCode"
                  value={referralCode}
                  onChange={(e) => handleReferralCodeChange(e.target.value)}
                  placeholder="VD: PT-A1B2"
                  className="w-full uppercase"
                  maxLength={20}
                />
                {referralCodeValidating && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!referralCodeValidating && referralCodeValid === true && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                )}
                {!referralCodeValidating && referralCodeValid === false && referralCode.length >= 3 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                )}
              </div>
              {referralCodeValid === true && referralStaffName && (
                <p className="text-xs text-green-600">✓ Mã hợp lệ - PT: {referralStaffName}</p>
              )}
              {referralCodeValid === false && referralCode.length >= 3 && (
                <p className="text-xs text-red-600">✗ Mã giới thiệu không hợp lệ hoặc không tìm thấy PT</p>
              )}
              <p className="text-xs text-muted-foreground">Nhập mã giới thiệu từ PT để họ nhận được hoa hồng</p>
            </div>

            {paymentMethod === 'BANK_TRANSFER' && (
              <div className="space-y-2">
                <Label htmlFor="transactionCode" className="text-sm font-medium text-foreground">
                  {t('gymDetail.membership.purchase.transactionCode')}
                </Label>
                <Input
                  id="transactionCode"
                  value={transactionCode}
                  onChange={(event) => setTransactionCode(event.target.value)}
                  placeholder="VD: 123ABC456"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="note" className="text-sm font-medium text-foreground">
                {t('gymDetail.membership.purchase.note')}
              </Label>
              <Textarea
                id="note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                placeholder={notePlaceholder || ''}
              />
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border/70 p-3 bg-muted/40">
              <Checkbox
                id="acknowledged"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(Boolean(checked))}
                className="mt-1"
              />
              <Label htmlFor="acknowledged" className="text-sm text-muted-foreground">
                {acknowledgementLabel}
              </Label>
            </div>

            {(submitError || error) && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {submitError || error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                {t('gymDetail.membership.purchase.cancel')}
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={loading || !acknowledged}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('gymDetail.membership.purchase.submit')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
