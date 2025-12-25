import { useState, useEffect, useCallback } from 'react';
import type { LegacyService } from '@/types/api/Package';
import { packageApi } from '@/services/api/packageApi';
import { formatPriceForDisplay, parsePriceInput } from '@/utils/currency';
import type { useServiceForm } from '@/components/dialogpackage/useServiceForm';

interface UseEditServiceDialogOptions {
  service: LegacyService | null;
  form: ReturnType<typeof useServiceForm>;
  defaultMinParticipants: number;
  defaultMaxParticipants: number;
  onSubmit: (
    id: string,
    v: {
      name: string;
      price?: number;
      durationInMonths?: number;
      minParticipants?: number;
      maxParticipants?: number;
      sessionCount?: number;
    }
  ) => void | Promise<void>;
  onClose?: () => void;
}

interface UseEditServiceDialogReturn {
  open: boolean;
  setOpen: (open: boolean) => void;
  loadingPackage: boolean;
  handleUpdate: () => Promise<void>;
  handleClose: () => void;
}

export function useEditServiceDialog({
  service,
  form,
  defaultMinParticipants,
  defaultMaxParticipants,
  onSubmit,
  onClose
}: UseEditServiceDialogOptions): UseEditServiceDialogReturn {
  const [open, setOpen] = useState(false);
  const [loadingPackage, setLoadingPackage] = useState(false);

  // Helper function to map package/service data to form values
  const mapServiceToFormValues = useCallback(
    (
      packageData: {
        name?: string;
        defaultPriceVND?: number;
        defaultDurationMonths?: number;
        sessionCount?: number;
        minParticipants?: number;
        maxParticipants?: number;
      } | null,
      serviceData: LegacyService
    ) => {
      return {
        name: packageData?.name || serviceData.name,
        price: packageData?.defaultPriceVND
          ? formatPriceForDisplay(packageData.defaultPriceVND)
          : serviceData.price
            ? formatPriceForDisplay(serviceData.price)
            : '',
        duration: packageData?.defaultDurationMonths
          ? packageData.defaultDurationMonths.toString()
          : serviceData.durationInMonths
            ? serviceData.durationInMonths.toString()
            : '1',
        sessionCount: packageData?.sessionCount
          ? packageData.sessionCount.toString()
          : serviceData.sessionCount
            ? serviceData.sessionCount.toString()
            : '',
        minParticipants: packageData?.minParticipants
          ? packageData.minParticipants.toString()
          : (serviceData as { minParticipants?: number }).minParticipants
            ? (serviceData as { minParticipants?: number }).minParticipants!.toString()
            : defaultMinParticipants.toString(),
        maxParticipants: packageData?.maxParticipants
          ? packageData.maxParticipants.toString()
          : (serviceData as { maxParticipants?: number }).maxParticipants
            ? (serviceData as { maxParticipants?: number }).maxParticipants!.toString()
            : defaultMaxParticipants.toString()
      };
    },
    [defaultMinParticipants, defaultMaxParticipants]
  );

  // Fetch package data and populate form when service changes
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
            const formValues = mapServiceToFormValues(response.data, service);
            form.setFormValues(formValues);
          } else {
            // Fallback to service prop data if API fails
            const formValues = mapServiceToFormValues(null, service);
            form.setFormValues(formValues);
          }
        })
        .catch((error) => {
          // Fallback to service prop data if API fails
          console.error('Failed to fetch package details:', error);
          const formValues = mapServiceToFormValues(null, service);
          form.setFormValues(formValues);
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
  }, [service?.id, defaultMinParticipants, defaultMaxParticipants, mapServiceToFormValues]);

  const handleUpdate = useCallback(async () => {
    if (!form.validateAll() || !service) return;

    await onSubmit(service.id, {
      name: form.name.trim(),
      price: form.price ? parsePriceInput(form.price) : undefined,
      durationInMonths: form.duration ? Number(form.duration) : undefined,
      sessionCount: form.sessionCount ? Number(form.sessionCount) : undefined,
      minParticipants: form.minParticipants ? Number(form.minParticipants) : defaultMinParticipants,
      maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : defaultMaxParticipants
    });

    setOpen(false);
    // Notify parent to reset service state
    if (onClose) {
      onClose();
    }
  }, [form, service, onSubmit, defaultMinParticipants, defaultMaxParticipants, onClose]);

  const handleClose = useCallback(() => {
    form.setIsClosing(true);
    form.resetForm();
    setOpen(false);
    // Notify parent to reset service state
    if (onClose) {
      onClose();
    }
    // Reset isClosing after a short delay to allow modal to close
    setTimeout(() => form.setIsClosing(false), 100);
  }, [form, onClose]);

  return {
    open,
    setOpen,
    loadingPackage,
    handleUpdate,
    handleClose
  };
}
