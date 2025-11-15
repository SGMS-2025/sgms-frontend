import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { membershipApi } from '@/services/api/membershipApi';
import { formatCurrency, getMembershipStatusLabel, getMembershipStatusColor } from '@/utils/membership';
import type { MembershipContract, CancelMembershipPayload } from '@/types/api/Membership';

interface CancelMembershipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contract: MembershipContract;
}

export const CancelMembershipDialog: React.FC<CancelMembershipDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contract
}) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const [formData, setFormData] = useState<CancelMembershipPayload>({
    cancelReason: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        toast.success(t('cancel_membership.success'));
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
          <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('cancel_membership.confirm_button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
