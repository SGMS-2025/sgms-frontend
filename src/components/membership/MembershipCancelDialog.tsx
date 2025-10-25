import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface MembershipCancelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
  loading?: boolean;
}

export const MembershipCancelDialog: React.FC<MembershipCancelDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false
}) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (loading) return;
    setReason('');
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm(reason.trim() || undefined);
      setReason('');
    } catch (confirmError) {
      const message = confirmError instanceof Error ? confirmError.message : t('gymDetail.membership.cancel.error');
      setError(message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? handleClose() : undefined)}>
      <DialogContent className="max-w-md space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t('gymDetail.membership.cancel.title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('gymDetail.membership.cancel.description')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cancel-reason" className="text-sm font-medium text-foreground">
            {t('gymDetail.membership.cancel.reasonLabel')}
            <span className="ml-1 text-xs text-muted-foreground">
              {t('gymDetail.membership.cancel.reasonOptional')}
            </span>
          </Label>
          <Textarea
            id="cancel-reason"
            rows={4}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t('gymDetail.membership.cancel.reasonPlaceholder') || ''}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            {t('gymDetail.membership.cancel.back')}
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('gymDetail.membership.cancel.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
