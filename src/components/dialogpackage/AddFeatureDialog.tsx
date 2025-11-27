import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useFeatureForm } from './useFeatureForm';
import { FeatureFormFields } from './FeatureFormFields';

interface AddFeatureDialogProps {
  readonly onSubmit: (v: { name: string }) => void;
  readonly loading: boolean;
  readonly serviceType: 'CLASS' | 'PT';
  readonly iconOnly?: boolean;
}

export function AddFeatureDialog({ onSubmit, loading, serviceType, iconOnly = false }: AddFeatureDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const form = useFeatureForm({
    serviceType,
    validateOnBlur: true // AddFeatureDialog's special validation timing
  });

  const handleCreate = () => {
    const isValid = form.validate();
    if (!isValid) {
      return;
    }

    onSubmit({ name: form.name.trim() });
    setOpen(false);
    form.resetForm();
  };

  const handleClose = () => {
    form.setIsClosing(true);
    form.resetForm();
    setOpen(false);
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
      {iconOnly ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white border border-orange-500 hover:border-orange-600 transition-colors shadow-sm"
                disabled={loading}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t(`${form.translationKey}.add_feature`)}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="px-4 py-2 text-sm text-white border border-orange-500 rounded-full bg-orange-500 hover:bg-orange-600 hover:border-orange-600 transition-colors flex items-center leading-none"
            disabled={loading}
            data-tour={
              serviceType === 'PT'
                ? 'pt-add-feature-button'
                : serviceType === 'CLASS'
                  ? 'class-add-feature-button'
                  : undefined
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            {t(`${form.translationKey}.add_feature`)}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto hide-scrollbar">
        <DialogHeader>
          <DialogTitle>{t(`${form.translationKey}.add_feature_dialog_title`)}</DialogTitle>
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
          <Button onClick={handleCreate} className="bg-black hover:bg-gray-800 text-white" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t(`${form.translationKey}.create_feature`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
