import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { MatrixDisplayData } from '@/types/api/Matrix';
import { useFeatureForm } from './useFeatureForm';
import { FeatureFormFields } from './FeatureFormFields';

type MatrixFeature = MatrixDisplayData['features'][0];

interface EditFeatureDialogProps {
  readonly feature: MatrixFeature | null;
  readonly onSubmit: (id: string, v: { name: string }) => void;
  readonly onClose?: () => void;
  readonly loading: boolean;
  readonly serviceType: 'CLASS' | 'PT';
}

export function EditFeatureDialog({ feature, onSubmit, onClose, loading, serviceType }: EditFeatureDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const form = useFeatureForm({
    serviceType,
    validateOnBlur: false // EditFeatureDialog's validation timing
  });

  useEffect(() => {
    if (feature) {
      form.setFormValues({ name: feature.name });
      setOpen(true);
      form.setIsClosing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature?.id]);

  const handleUpdate = () => {
    const isValid = form.validate();
    if (!isValid || !feature) {
      return;
    }

    onSubmit(feature.id, { name: form.name.trim() });
    setOpen(false);
    // Notify parent to reset feature state
    if (onClose) {
      onClose();
    }
  };

  const handleClose = () => {
    form.setIsClosing(true);
    form.resetForm();
    setOpen(false);
    // Notify parent to reset feature state
    if (onClose) {
      onClose();
    }
    setTimeout(() => form.setIsClosing(false), 100);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        } else {
          setOpen(isOpen);
          form.setIsClosing(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto hide-scrollbar">
        <DialogHeader>
          <DialogTitle>{t(`${form.translationKey}.edit_feature_dialog_title`)}</DialogTitle>
        </DialogHeader>
        <FeatureFormFields
          translationKey={form.translationKey}
          name={form.name}
          error={form.error}
          onNameChange={form.handleNameChange}
          onBlur={form.handleBlur}
          disabled={loading}
        />
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t(`${form.translationKey}.cancel`)}
          </Button>
          <Button onClick={handleUpdate} className="bg-orange-500 hover:bg-orange-600 text-white" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t(`${form.translationKey}.update_feature`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
