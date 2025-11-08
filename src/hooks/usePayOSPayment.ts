import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { paymentApi, type PayOSPaymentData } from '@/services/api/paymentApi';

export interface UsePayOSPaymentOptions {
  customerId: string;
  branchId: string;
  totalPrice: number;
  initialPaidAmount: number;
  packageDescription: string; // e.g., 'Goi PT 1-1' or 'Goi lop hoc'
  onSuccess?: () => void;
  onClose: () => void;
}

export interface UsePayOSPaymentReturn {
  showPayOSModal: boolean;
  setShowPayOSModal: React.Dispatch<React.SetStateAction<boolean>>;
  payOSData: PayOSPaymentData | null;
  createdContractId: string | null;
  handlePayOSPayment: (contractId: string) => void;
  handlePaymentSuccess: () => void;
  handleModalClose: () => void;
}

export const usePayOSPayment = ({
  customerId,
  branchId,
  totalPrice,
  initialPaidAmount,
  packageDescription,
  onSuccess,
  onClose
}: UsePayOSPaymentOptions): UsePayOSPaymentReturn => {
  const { t } = useTranslation();
  const [showPayOSModal, setShowPayOSModal] = useState(false);
  const [payOSData, setPayOSData] = useState<PayOSPaymentData | null>(null);
  const [createdContractId, setCreatedContractId] = useState<string | null>(null);

  const handlePayOSPayment = (contractId: string) => {
    const amountToPayment = totalPrice - initialPaidAmount;
    const paymentAmount = amountToPayment > 0 ? amountToPayment : Math.max(totalPrice, 1000);

    paymentApi
      .createPayOSPaymentLink({
        customerId: customerId,
        branchId: branchId,
        contractId: contractId,
        contractType: 'service',
        amount: paymentAmount,
        description: packageDescription
      })
      .then((paymentResponse) => {
        if (paymentResponse.success) {
          setCreatedContractId(contractId);
          setPayOSData(paymentResponse.data);
          setShowPayOSModal(true);
          toast.success(t('payos_payment.registration_success'));
        } else {
          // If PayOS fails, still consider registration successful
          handleRegistrationSuccess();
        }
      })
      .catch((paymentError) => {
        console.error('Error creating PayOS payment:', paymentError);
        toast.warning(t('payos_payment.registration_success_payos_failed'));
        handleRegistrationSuccess();
      });
  };

  const handleRegistrationSuccess = () => {
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 500);
  };

  const handlePaymentSuccess = () => {
    setShowPayOSModal(false);
    toast.success(t('payos_payment.payment_success'));
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 500);
  };

  const handleModalClose = () => {
    setShowPayOSModal(false);
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 500);
  };

  return {
    showPayOSModal,
    setShowPayOSModal,
    payOSData,
    createdContractId,
    handlePayOSPayment,
    handlePaymentSuccess,
    handleModalClose
  };
};
