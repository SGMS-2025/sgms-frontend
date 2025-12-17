import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { LegacyService } from '@/types/api/Package';
import { useServiceForm } from './useServiceForm';
import { useEditServiceDialog } from '@/hooks/useEditServiceDialog';
import { ServiceFormFields } from './ServiceFormFields';

interface EditServiceDialogProps {
  readonly service: LegacyService | null;
  readonly onSubmit: (
    id: string,
    v: {
      name: string;
      price?: number;
      durationInMonths?: number;
      minParticipants?: number;
      maxParticipants?: number;
      sessionCount?: number;
    }
  ) => void;
  readonly loading: boolean;
  readonly serviceType: 'CLASS' | 'PT';
  readonly defaultMinParticipants?: number;
  readonly defaultMaxParticipants?: number;
}

export function EditServiceDialog({
  service,
  onSubmit,
  loading,
  serviceType,
  defaultMinParticipants = 5,
  defaultMaxParticipants = 20
}: EditServiceDialogProps) {
  const { t } = useTranslation();

  const form = useServiceForm({
    serviceType,
    defaultMinParticipants,
    defaultMaxParticipants,
    validateOnBlur: false // EditServiceDialog's validation timing
  });

  const { open, setOpen, loadingPackage, handleUpdate, handleClose } = useEditServiceDialog({
    service,
    form,
    defaultMinParticipants,
    defaultMaxParticipants,
    onSubmit
  });

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
          <DialogTitle>{t(`${form.translationKey}.edit_${serviceType.toLowerCase()}_dialog_title`)}</DialogTitle>
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
          disabled={loading || loadingPackage}
        />
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading || loadingPackage}>
            {t(`${form.translationKey}.cancel`)}
          </Button>
          <Button
            onClick={handleUpdate}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={loading || loadingPackage}
          >
            {(loading || loadingPackage) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t(`${form.translationKey}.update_${serviceType.toLowerCase()}`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
