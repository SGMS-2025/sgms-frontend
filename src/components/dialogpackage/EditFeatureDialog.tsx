import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { MatrixDisplayData } from '@/types/api/Matrix';

type MatrixFeature = MatrixDisplayData['features'][0];

interface EditFeatureDialogProps {
  readonly feature: MatrixFeature | null;
  readonly onSubmit: (id: string, v: { name: string }) => void;
  readonly loading: boolean;
  readonly serviceType: 'CLASS' | 'PT';
}

export function EditFeatureDialog({ feature, onSubmit, loading, serviceType }: EditFeatureDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  React.useEffect(() => {
    if (feature) {
      setName(feature.name);
      setOpen(true);
    }
  }, [feature]);

  const handleUpdate = () => {
    if (!name.trim() || !feature) return;
    onSubmit(feature.id, { name: name.trim() });
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
    setName('');
  };

  const translationKey = serviceType === 'CLASS' ? 'class_service' : 'pt_service';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t(`${translationKey}.edit_feature_dialog_title`)}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">{t(`${translationKey}.feature_name`)}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(`${translationKey}.feature_name_placeholder`)}
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t(`${translationKey}.cancel`)}
          </Button>
          <Button onClick={handleUpdate} className="bg-orange-500 hover:bg-orange-600 text-white" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t(`${translationKey}.update_feature`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
