import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { LegacyService } from '@/types/api/Package';
import { packageApi } from '@/services/api/packageApi';
import { parsePriceInput, formatPriceForDisplay } from '@/utils/currency';
import { useServiceForm } from './useServiceForm';
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
  const [open, setOpen] = useState(false);
  const [loadingPackage, setLoadingPackage] = useState(false);

  const form = useServiceForm({
    serviceType,
    defaultMinParticipants,
    defaultMaxParticipants,
    validateOnBlur: false // EditServiceDialog's validation timing
  });

  useEffect(() => {
    if (service) {
      setOpen(true);
      setLoadingPackage(true);
      form.resetForm();
      form.setIsClosing(false);

      // Fetch full package details to get sessionCount, minParticipants, maxParticipants
      packageApi
        .getPackageById(service.id)
        .then((response) => {
          if (response.success && response.data) {
            const packageData = response.data;
            form.setFormValues({
              name: packageData.name || service.name,
              price: packageData.defaultPriceVND
                ? formatPriceForDisplay(packageData.defaultPriceVND)
                : service.price
                  ? formatPriceForDisplay(service.price)
                  : '',
              duration: packageData.defaultDurationMonths
                ? packageData.defaultDurationMonths.toString()
                : service.durationInMonths
                  ? service.durationInMonths.toString()
                  : '1',
              sessionCount: packageData.sessionCount ? packageData.sessionCount.toString() : '',
              minParticipants: packageData.minParticipants
                ? packageData.minParticipants.toString()
                : defaultMinParticipants.toString(),
              maxParticipants: packageData.maxParticipants
                ? packageData.maxParticipants.toString()
                : defaultMaxParticipants.toString()
            });
          } else {
            // Fallback to service prop data if API fails
            form.setFormValues({
              name: service.name,
              price: service.price ? formatPriceForDisplay(service.price) : '',
              duration: service.durationInMonths ? service.durationInMonths.toString() : '1',
              sessionCount: service.sessionCount ? service.sessionCount.toString() : '',
              minParticipants: (service as { minParticipants?: number }).minParticipants
                ? (service as { minParticipants?: number }).minParticipants!.toString()
                : defaultMinParticipants.toString(),
              maxParticipants: (service as { maxParticipants?: number }).maxParticipants
                ? (service as { maxParticipants?: number }).maxParticipants!.toString()
                : defaultMaxParticipants.toString()
            });
          }
        })
        .catch((error) => {
          // Fallback to service prop data if API fails
          console.error('Failed to fetch package details:', error);
          form.setFormValues({
            name: service.name,
            price: service.price ? formatPriceForDisplay(service.price) : '',
            duration: service.durationInMonths ? service.durationInMonths.toString() : '1',
            sessionCount: service.sessionCount ? service.sessionCount.toString() : '',
            minParticipants: (service as { minParticipants?: number }).minParticipants
              ? (service as { minParticipants?: number }).minParticipants!.toString()
              : defaultMinParticipants.toString(),
            maxParticipants: (service as { maxParticipants?: number }).maxParticipants
              ? (service as { maxParticipants?: number }).maxParticipants!.toString()
              : defaultMaxParticipants.toString()
          });
        })
        .finally(() => {
          setLoadingPackage(false);
        });
    } else {
      // Reset state when service is null
      setOpen(false);
      setLoadingPackage(false);
      form.resetForm();
      form.setIsClosing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service?.id, defaultMinParticipants, defaultMaxParticipants]);

  const handleUpdate = () => {
    if (!form.validateAll() || !service) return;

    onSubmit(service.id, {
      name: form.name.trim(),
      price: form.price ? parsePriceInput(form.price) : undefined,
      durationInMonths: form.duration ? Number(form.duration) : undefined,
      sessionCount: form.sessionCount ? Number(form.sessionCount) : undefined,
      minParticipants: form.minParticipants ? Number(form.minParticipants) : defaultMinParticipants,
      maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : defaultMaxParticipants
    });
    setOpen(false);
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto hide-scrollbar">
        <DialogHeader>
          <DialogTitle>{t(`${form.translationKey}.edit_${serviceType.toLowerCase()}_dialog_title`)}</DialogTitle>
        </DialogHeader>
        <ServiceFormFields
          translationKey={form.translationKey}
          serviceType={serviceType}
          name={form.name}
          price={form.price}
          duration={form.duration}
          sessionCount={form.sessionCount}
          minParticipants={form.minParticipants}
          maxParticipants={form.maxParticipants}
          errors={form.errors}
          onNameChange={form.handleNameChange}
          onPriceChange={form.handlePriceChange}
          onDurationChange={form.handleDurationChange}
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
