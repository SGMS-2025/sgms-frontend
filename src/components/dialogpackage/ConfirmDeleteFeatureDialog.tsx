import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { MatrixDisplayData } from '@/types/api/Matrix';

type MatrixFeature = MatrixDisplayData['features'][0];

interface ConfirmDeleteFeatureDialogProps {
  readonly feature: MatrixFeature | null;
  readonly onConfirm: () => void;
  readonly loading: boolean;
  readonly serviceType: 'CLASS' | 'PT';
}

export function ConfirmDeleteFeatureDialog({
  feature,
  onConfirm,
  loading,
  serviceType
}: ConfirmDeleteFeatureDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  React.useEffect(() => {
    setOpen(!!feature);
  }, [feature]);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  if (!feature) return null;

  const translationKey = serviceType === 'CLASS' ? 'class_service' : 'pt_service';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {t(`${translationKey}.confirm_delete_feature_title`)}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            {t(`${translationKey}.confirm_delete_feature_message`, { name: feature.name })}
          </p>
          <p className="text-sm text-muted-foreground mt-2">{t(`${translationKey}.confirm_delete_feature_warning`)}</p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            {t(`${translationKey}.cancel`)}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t(`${translationKey}.delete_feature`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
