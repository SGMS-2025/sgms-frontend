import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { serviceContractApi } from '@/services/api/serviceContractApi';
import type { ServiceContractResponse } from '@/types/api/Package';
import type { ServiceRegistrationFormData } from './useServiceRegistration';

export interface UseServiceRegistrationSubmitOptions {
  customerId: string;
  packageTypeName: string; // 'gói PT' or 'gói lớp học'
  onSuccess?: (response?: ServiceContractResponse) => void;
  onClose: () => void;
  onPaymentRequired?: (contractId: string, response: ServiceContractResponse) => void;
}

export interface UseServiceRegistrationSubmitReturn {
  loading: boolean;
  handleSubmit: (formData: ServiceRegistrationFormData, transferReceiptFile?: File | null) => void;
}

export const useServiceRegistrationSubmit = ({
  customerId,
  packageTypeName,
  onSuccess,
  onClose,
  onPaymentRequired
}: UseServiceRegistrationSubmitOptions): UseServiceRegistrationSubmitReturn => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleRegistrationSuccess = (response: ServiceContractResponse) => {
    toast.success(
      t('service_registration.registration_success', {
        packageType: packageTypeName,
        defaultValue: `Registration for ${packageTypeName} successful!`
      })
    );

    // Call onSuccess with response data to allow custom handling
    if (onSuccess) {
      onSuccess(response);
    } else {
      // Fallback to default behavior
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  const handleContractCreated = (response: ServiceContractResponse, formData: ServiceRegistrationFormData) => {
    if (!response.success) {
      toast.error(
        response.message ||
          t('service_registration.registration_failed', {
            packageType: packageTypeName,
            defaultValue: `Unable to register ${packageTypeName}`
          })
      );
      setLoading(false);
      return;
    }

    const contractData = response.data;
    const contractId = contractData?._id;

    // Note: KPI update will be triggered automatically by backend via Socket.IO
    // when transaction attribution is created and KPI is recalculated

    // If payment method is BANK_TRANSFER and we have a contractId, trigger PayOS payment
    if (formData.paymentMethod === 'BANK_TRANSFER' && contractId && onPaymentRequired) {
      onPaymentRequired(contractId, response);
      setLoading(false);
    } else {
      handleRegistrationSuccess(response);
      setLoading(false);
    }
  };

  const handleSubmit = (formData: ServiceRegistrationFormData, transferReceiptFile?: File | null) => {
    if (!formData.servicePackageId) {
      toast.error(
        t('service_registration.please_select_package', {
          packageType: packageTypeName,
          defaultValue: `Please select ${packageTypeName}`
        })
      );
      return;
    }

    setLoading(true);

    serviceContractApi
      .createServiceContract(customerId, formData, transferReceiptFile)
      .then((response) => handleContractCreated(response, formData))
      .catch(() => {
        toast.error(
          t('service_registration.registration_error', {
            packageType: packageTypeName,
            defaultValue: `An error occurred while registering ${packageTypeName}`
          })
        );
        setLoading(false);
      });
  };

  return {
    loading,
    handleSubmit
  };
};
