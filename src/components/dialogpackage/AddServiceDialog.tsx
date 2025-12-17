import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { parsePriceInput } from '@/utils/currency';
import { useServiceForm } from './useServiceForm';
import { ServiceFormFields } from './ServiceFormFields';

interface AddServiceDialogProps {
  readonly onSubmit: (v: {
    name: string;
    price?: number;
    durationInMonths?: number;
    minParticipants?: number;
    maxParticipants?: number;
    sessionCount?: number;
  }) => void;
  readonly loading: boolean;
  readonly serviceType: 'CLASS' | 'PT';
  readonly defaultMinParticipants?: number;
  readonly defaultMaxParticipants?: number;
  readonly iconOnly?: boolean;
}

export function AddServiceDialog({
  onSubmit,
  loading,
  serviceType,
  defaultMinParticipants = 5,
  defaultMaxParticipants = 20,
  iconOnly = false
}: AddServiceDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const form = useServiceForm({
    serviceType,
    defaultMinParticipants,
    defaultMaxParticipants,
    validateOnBlur: true // AddServiceDialog's special validation timing
  });

  const handleCreate = () => {
    const isValid = form.validateAll();
    if (!isValid) {
      return;
    }

    onSubmit({
      name: form.name.trim(),
      price: form.price ? parsePriceInput(form.price) : undefined,
      sessionCount: form.sessionCount ? Number(form.sessionCount) : undefined,
      // PT 1-1: min and max participants are always 1
      // CLASS: use form values or defaults
      minParticipants:
        serviceType === 'PT' ? 1 : form.minParticipants ? Number(form.minParticipants) : defaultMinParticipants,
      maxParticipants:
        serviceType === 'PT' ? 1 : form.maxParticipants ? Number(form.maxParticipants) : defaultMaxParticipants
    });

    // Reset form and close
    setOpen(false);
    form.resetForm();
  };

  const handleClose = () => {
    form.setIsClosing(true);
    form.resetForm();
    setOpen(false);
    // Reset isClosing after a short delay to allow modal to close
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
            <p>{t(`${form.translationKey}.add_${serviceType.toLowerCase()}`)}</p>
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
                ? 'pt-add-package-button'
                : serviceType === 'CLASS'
                  ? 'class-add-class-button'
                  : undefined
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            {t(`${form.translationKey}.add_${serviceType.toLowerCase()}`)}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto hide-scrollbar">
        <DialogHeader>
          <DialogTitle>{t(`${form.translationKey}.add_${serviceType.toLowerCase()}_dialog_title`)}</DialogTitle>
        </DialogHeader>
        <ServiceFormFields
          translationKey={form.translationKey}
          serviceType={serviceType}
          name={form.name}
          price={form.price}
          sessionCount={form.sessionCount}
          minParticipants={form.minParticipants}
          maxParticipants={form.maxParticipants}
          errors={form.errors}
          onNameChange={form.handleNameChange}
          onPriceChange={form.handlePriceChange}
          onSessionCountChange={form.handleSessionCountChange}
          onMinParticipantsChange={form.handleMinParticipantsChange}
          onMaxParticipantsChange={form.handleMaxParticipantsChange}
          onBlur={form.handleBlur}
          disabled={loading}
        />
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t(`${form.translationKey}.cancel`)}
          </Button>
          <Button onClick={handleCreate} className="bg-black hover:bg-gray-800 text-white" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t(`${form.translationKey}.create_${serviceType.toLowerCase()}`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
