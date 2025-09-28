import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { LegacyService } from '@/types/api/Package';

interface ConfirmDeleteServiceDialogProps {
  readonly service: LegacyService | null;
  readonly onConfirm: () => void;
  readonly loading: boolean;
  readonly serviceType: 'CLASS' | 'PT';
}

export function ConfirmDeleteServiceDialog({
  service,
  onConfirm,
  loading,
  serviceType
}: ConfirmDeleteServiceDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  React.useEffect(() => {
    setOpen(!!service);
  }, [service]);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  if (!service) return null;

  const translationKey = serviceType === 'CLASS' ? 'class_service' : 'pt_service';
  const serviceTypeLower = serviceType.toLowerCase();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {t(`${translationKey}.confirm_delete_${serviceTypeLower}_title`)}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            {t(`${translationKey}.confirm_delete_${serviceTypeLower}_message`, { name: service.name })}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {t(`${translationKey}.confirm_delete_${serviceTypeLower}_warning`)}
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            {t(`${translationKey}.cancel`)}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t(`${translationKey}.delete_${serviceTypeLower}`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
