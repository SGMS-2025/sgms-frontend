import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { serviceContractApi } from '@/services/api/serviceContractApi';

interface CancelServiceContractDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contractId: string;
  contractType: 'PT' | 'CLASS';
  serviceName?: string;
  paidAmount?: number;
  startDate?: string;
  endDate?: string;
  sessionCount?: number;
  sessionsUsed?: number;
  sessionsRemaining?: number;
}

export const CancelServiceContractDialog: React.FC<CancelServiceContractDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contractId,
  contractType,
  serviceName,
  paidAmount = 0,
  startDate,
  endDate,
  sessionCount,
  sessionsUsed,
  sessionsRemaining
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formData, setFormData] = useState({
    cancelReason: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

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
      newErrors.cancelReason = t('cancel_service.error.reason_required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    setShowConfirmDialog(true);
  };

  const handleConfirmCancel = () => {
    setLoading(true);
    setShowConfirmDialog(false);

    // API call - Note: Backend endpoint not yet implemented
    serviceContractApi
      .cancelServiceContract(contractId, formData)
      .then(() => {
        const packageType =
          contractType === 'PT' ? t('cancel_service.package_type.pt') : t('cancel_service.package_type.class');
        toast.success(t('cancel_service.success', { packageType }));

        onSuccess();
        handleClose();
      })
      .catch((error) => {
        console.error('Error canceling service contract:', error);
        toast.error(t('cancel_service.error.failed'), {
          description: error instanceof Error ? error.message : t('cancel_service.error.try_again')
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        cancelReason: ''
      });
      setErrors({});
      setShowConfirmDialog(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {t('cancel_service.title', {
              packageType:
                contractType === 'PT'
                  ? t('cancel_service.package_type.pt_full')
                  : t('cancel_service.package_type.class')
            })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Information */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="font-medium mb-3">{t('cancel_service.contract_info')}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('cancel_service.package_name')}:</span>
                <span className="ml-2 font-medium">{serviceName || t('cancel_service.not_available')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('cancel_service.package_type_label')}:</span>
                <span className="ml-2 font-medium">
                  {contractType === 'PT'
                    ? t('cancel_service.package_type.personal_training')
                    : t('cancel_service.package_type.group_class')}
                </span>
              </div>
              {startDate && (
                <div>
                  <span className="text-muted-foreground">{t('cancel_service.start_date')}:</span>
                  <span className="ml-2">{new Date(startDate).toLocaleDateString()}</span>
                </div>
              )}
              {endDate && (
                <div>
                  <span className="text-muted-foreground">{t('cancel_service.end_date')}:</span>
                  <span className="ml-2">{new Date(endDate).toLocaleDateString()}</span>
                </div>
              )}
              {sessionCount !== undefined && sessionsUsed !== undefined && (
                <div>
                  <span className="text-muted-foreground">{t('cancel_service.sessions_used')}:</span>
                  <span className="ml-2 font-medium">
                    {sessionsUsed} / {sessionCount} {t('cancel_service.sessions_unit')}
                  </span>
                </div>
              )}
              {sessionsRemaining !== undefined && sessionCount !== undefined && (
                <div>
                  <span className="text-muted-foreground">{t('cancel_service.sessions_remaining')}:</span>
                  <span className="ml-2 font-medium">
                    {sessionsRemaining} / {sessionCount} {t('cancel_service.sessions_unit')}
                  </span>
                </div>
              )}
              <div className="col-span-2">
                <span className="text-muted-foreground">{t('cancel_service.paid_amount')}:</span>
                <span className="ml-2 font-medium">{formatCurrency(paidAmount)}</span>
              </div>
            </div>
          </div>

          {/* Cancel Reason */}
          <div className="space-y-2">
            <Label htmlFor="cancelReason">
              {t('cancel_service.cancel_reason_label')} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="cancelReason"
              rows={3}
              value={formData.cancelReason}
              onChange={(e) => handleInputChange('cancelReason', e.target.value)}
              placeholder={t('cancel_service.cancel_reason_placeholder')}
              disabled={loading}
            />
            {errors.cancelReason && <p className="text-sm text-red-500">{errors.cancelReason}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('cancel_service.confirm_cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {t('cancel_service.confirm_title')}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {(() => {
                const packageName = serviceName || t('cancel_service.this_package');
                const message = t('cancel_service.confirm_message', { packageName });
                const parts = message.split(`<strong>${packageName}</strong>`);
                if (parts.length === 2) {
                  return (
                    <>
                      {parts[0]}
                      <strong>{packageName}</strong>
                      {parts[1]}
                    </>
                  );
                }
                return message.replace(/<strong>(.*?)<\/strong>/g, '$1');
              })()}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
