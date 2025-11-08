import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { membershipApi } from '@/services/api/membershipApi';
import { formatCurrency, getMembershipStatusLabel, getMembershipStatusColor } from '@/utils/membership';
import type { MembershipContract, RefundSuggestion, CancelMembershipPayload } from '@/types/api/Membership';

interface CancelMembershipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contract: MembershipContract;
}

const calculateFallbackRefund = (contract: MembershipContract, t: TFunction) => {
  const now = new Date();
  const totalPaid = contract.paidAmount || 0;
  let suggestedAmount = 0;
  let daysUsed = 0;
  let daysRemaining = 0;
  let calculation = '';

  switch (contract.status) {
    case 'PENDING_ACTIVATION':
      suggestedAmount = Math.floor(totalPaid * 0.9);
      calculation = t('cancel_membership.calculation.unactivated');
      break;

    case 'ACTIVE':
      if (contract.activationDate) {
        const activationDate = new Date(contract.activationDate);
        const endDate = new Date(contract.endDate);
        const totalDays = Math.ceil((endDate.getTime() - activationDate.getTime()) / (1000 * 60 * 60 * 24));
        const usedDays = Math.ceil((now.getTime() - activationDate.getTime()) / (1000 * 60 * 60 * 24));
        daysUsed = Math.max(0, usedDays);
        daysRemaining = Math.max(0, totalDays - usedDays);

        if (totalDays > 0) {
          const remainingRatio = daysRemaining / totalDays;
          suggestedAmount = Math.floor(totalPaid * remainingRatio);
          calculation = t('cancel_membership.calculation.pro_rata', {
            daysRemaining,
            totalDays,
            percentage: Math.round(remainingRatio * 100)
          });
        } else {
          suggestedAmount = 0;
          calculation = t('cancel_membership.calculation.expired');
        }
      } else {
        suggestedAmount = totalPaid;
        calculation = t('cancel_membership.calculation.full_refund');
      }
      break;

    case 'EXPIRED':
    case 'CANCELED':
      suggestedAmount = 0;
      calculation = t('cancel_membership.calculation.no_refund_expired');
      break;

    default:
      suggestedAmount = 0;
      calculation = t('cancel_membership.calculation.no_refund_invalid');
  }

  return {
    suggestedAmount,
    totalPaid,
    daysUsed,
    daysRemaining,
    calculation
  };
};

export const CancelMembershipDialog: React.FC<CancelMembershipDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contract
}) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const [refundSuggestion, setRefundSuggestion] = useState<RefundSuggestion | null>(null);
  const [formData, setFormData] = useState<CancelMembershipPayload>({
    cancelReason: '',
    refundAmount: 0,
    refundMethod: 'CASH',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch refund suggestion when dialog opens
  const fetchRefundSuggestion = useCallback(async () => {
    try {
      setLoading(true);
      const suggestion = await membershipApi.getRefundSuggestion(contract._id);
      setRefundSuggestion(suggestion);
      setFormData((prev) => ({
        ...prev,
        refundAmount: suggestion.suggestedAmount || 0
      }));
    } catch (error) {
      console.error('Failed to fetch refund suggestion:', error);
      // Fallback calculation if API fails
      const fallbackSuggestion = calculateFallbackRefund(contract, t);
      setRefundSuggestion(fallbackSuggestion);
      setFormData((prev) => ({
        ...prev,
        refundAmount: fallbackSuggestion.suggestedAmount
      }));
    } finally {
      setLoading(false);
    }
  }, [contract, t]);

  useEffect(() => {
    if (isOpen && contract._id) {
      fetchRefundSuggestion();
    }
  }, [contract._id, fetchRefundSuggestion, isOpen]);

  const handleInputChange = <K extends keyof CancelMembershipPayload>(field: K, value: CancelMembershipPayload[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.cancelReason.trim()) {
      newErrors.cancelReason = t('cancel_membership.error.reason_required');
    } else if (formData.cancelReason.trim().length < 10) {
      newErrors.cancelReason = t('cancel_membership.error.reason_min_length');
    }

    if (formData.refundAmount < 0) {
      newErrors.refundAmount = t('cancel_membership.error.refund_negative');
    }

    if (formData.refundAmount > contract.paidAmount) {
      newErrors.refundAmount = t('cancel_membership.error.refund_exceeds_paid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    membershipApi
      .cancelMembership(contract._id, formData)
      .then(() => {
        toast.success(t('cancel_membership.success'), {
          description:
            formData.refundAmount > 0
              ? t('cancel_membership.success_refund', { amount: formatCurrency(formData.refundAmount) })
              : t('cancel_membership.no_refund')
        });
        onSuccess();
        onClose();
      })
      .catch((error) => {
        console.error('Failed to cancel membership:', error);
        toast.error(t('cancel_membership.error.failed'), {
          description: error instanceof Error ? error.message : t('cancel_membership.error.try_again')
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const refundExceedsPaid = formData.refundAmount > contract.paidAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {t('cancel_membership.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Information */}
          <div className="rounded-lg border p-4 bg-gray-50">
            <h4 className="font-medium mb-3">{t('cancel_membership.contract_info')}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">{t('cancel_membership.status')}</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getMembershipStatusColor(contract.status)}`}>
                  {t(`membership.status.${contract.status.toLowerCase()}`, {
                    defaultValue: getMembershipStatusLabel(contract.status)
                  })}
                </span>
              </div>
              <div>
                <span className="text-gray-600">{t('cancel_membership.start_date')}</span>
                <span className="ml-2">{new Date(contract.startDate).toLocaleDateString(dateLocale)}</span>
              </div>
              <div>
                <span className="text-gray-600">{t('cancel_membership.end_date')}</span>
                <span className="ml-2">{new Date(contract.endDate).toLocaleDateString(dateLocale)}</span>
              </div>
              <div>
                <span className="text-gray-600">{t('cancel_membership.paid_amount')}</span>
                <span className="ml-2 font-medium">{formatCurrency(contract.paidAmount)}</span>
              </div>
            </div>
          </div>

          {/* Refund Suggestion */}
          {refundSuggestion && (
            <div className="rounded-lg border p-4 bg-blue-50">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                {t('cancel_membership.refund_suggestion')}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t('cancel_membership.total_paid')}</span>
                  <span className="font-medium">{formatCurrency(refundSuggestion.totalPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('cancel_membership.days_used')}</span>
                  <span>
                    {refundSuggestion.daysUsed} {t('cancel_membership.days')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('cancel_membership.days_remaining')}</span>
                  <span>
                    {refundSuggestion.daysRemaining} {t('cancel_membership.days')}
                  </span>
                </div>
                <div className="flex justify-between font-medium text-blue-600">
                  <span>{t('cancel_membership.suggested_refund')}</span>
                  <span>{formatCurrency(refundSuggestion.suggestedAmount)}</span>
                </div>
                <div className="text-xs text-gray-600 mt-2">{refundSuggestion.calculation}</div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancelReason">{t('cancel_membership.cancel_reason_label')}</Label>
              <Textarea
                id="cancelReason"
                value={formData.cancelReason}
                onChange={(e) => handleInputChange('cancelReason', e.target.value)}
                placeholder={t('cancel_membership.cancel_reason_placeholder')}
                className="mt-1"
                rows={3}
              />
              {errors.cancelReason && <p className="text-red-500 text-sm mt-1">{errors.cancelReason}</p>}
            </div>

            <div>
              <Label htmlFor="refundAmount">{t('cancel_membership.refund_amount_label')}</Label>
              <Input
                id="refundAmount"
                type="number"
                value={formData.refundAmount}
                onChange={(e) => handleInputChange('refundAmount', Number(e.target.value))}
                className="mt-1"
                min="0"
                step="1000"
              />
              {errors.refundAmount && <p className="text-red-500 text-sm mt-1">{errors.refundAmount}</p>}
              {refundExceedsPaid && (
                <Alert className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{t('cancel_membership.refund_exceeds_warning')}</AlertDescription>
                </Alert>
              )}
            </div>

            <div>
              <Label htmlFor="refundMethod">{t('cancel_membership.refund_method_label')}</Label>
              <Select
                value={formData.refundMethod}
                onValueChange={(value) =>
                  handleInputChange('refundMethod', value as CancelMembershipPayload['refundMethod'])
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">{t('cancel_membership.refund_cash')}</SelectItem>
                  <SelectItem value="BANK_TRANSFER">{t('cancel_membership.refund_transfer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">{t('cancel_membership.notes_label')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder={t('cancel_membership.notes_placeholder')}
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t('cancel_membership.cancel_button')}
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={loading || refundExceedsPaid}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('cancel_membership.confirm_button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
