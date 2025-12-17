import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Stepper, type StepperStep } from '@/components/ui/stepper';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useServiceRegistrationWizard, type WizardStep } from '@/hooks/useServiceRegistrationWizard';
import { useServiceRegistration } from '@/hooks/useServiceRegistration';
import { useServiceRegistrationSubmit } from '@/hooks/useServiceRegistrationSubmit';
import { useFetchRegistrationData } from '@/hooks/useFetchRegistrationData';
import { useBranch } from '@/contexts/BranchContext';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { useUser } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { ServiceContractResponse } from '@/types/api/Package';
import type { ContractDocument } from '@/types/api/ContractDocument';
import type { PayOSPaymentData } from '@/services/api/paymentApi';
import { BankQRPaymentContent } from './shared/BankQRPaymentContent';

// Import step components
import { RegistrationFormStep } from './steps/RegistrationFormStep';
import { PaymentStep } from './steps/PaymentStep';
import { TemplateSelectionStep } from './steps/TemplateSelectionStep';
import { SendContractStep } from './steps/SendContractStep';
import { SuccessStep } from './steps/SuccessStep';

interface ServiceRegistrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  packageType: 'PT' | 'CLASS';
  onSuccess?: () => void;
}

export const ServiceRegistrationWizard: React.FC<ServiceRegistrationWizardProps> = ({
  isOpen,
  onClose,
  customerId,
  packageType,
  onSuccess
}) => {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();
  const { currentStaff } = useCurrentUserStaff();
  const currentUser = useUser();

  // Form data
  const {
    formData,
    setFormData,
    priceCalculation,
    handlePackageChange,
    handlePromotionChange,
    selectedPackage: _selectedPackage,
    setSelectedPackage,
    selectedPromotion: _selectedPromotion,
    setSelectedPromotion
  } = useServiceRegistration(currentBranch?._id || '');

  // Fetch data
  const { packages, promotions, trainers } = useFetchRegistrationData({
    isOpen,
    branchId: currentBranch?._id,
    packageType,
    fetchTrainers: packageType === 'PT'
  });

  // Contract creation state
  const [contractResponse, setContractResponse] = useState<ServiceContractResponse | null>(null);
  const [contractDocument, setContractDocument] = useState<ContractDocument | null>(null);
  const [isCreatingContract, setIsCreatingContract] = useState(false);

  // Wizard state management - update when payment method changes
  const wizard = useServiceRegistrationWizard({
    paymentMethod: formData.paymentMethod,
    // Only skip payment step if paying with CASH (no PayOS needed)
    // For BANK_TRANSFER and QR_BANK, show payment step to display QR code
    skipPayment: formData.paymentMethod === 'CASH',
    // Skip template and send contract steps for CLASS
    skipTemplate: packageType === 'CLASS',
    skipSendContract: packageType === 'CLASS'
  });

  // Auto-set referrerStaffId if current user is PT
  useEffect(() => {
    if (currentStaff?.userId?._id && currentStaff.jobTitle === 'Personal Trainer') {
      setFormData((prev) => ({
        ...prev,
        referrerStaffId: currentStaff.userId._id
      }));
    }
  }, [currentStaff, setFormData]);

  // Step definitions for stepper
  const stepperSteps: StepperStep[] = React.useMemo(() => {
    const steps: StepperStep[] = [
      {
        id: 'form',
        title: t('wizard.step_form', 'Thông tin đăng ký'),
        description: t('wizard.step_form_desc', 'Chọn gói và điền thông tin')
      }
    ];

    // Add payment step if BANK_TRANSFER or QR_BANK (to show QR code and payment info)
    if (formData.paymentMethod === 'BANK_TRANSFER' || formData.paymentMethod === 'QR_BANK') {
      steps.push({
        id: 'payment',
        title: t('wizard.step_payment', 'Thanh toán'),
        description:
          formData.paymentMethod === 'QR_BANK'
            ? t('wizard.step_payment_desc_qr', 'Thanh toán qua QR ngân hàng')
            : t('wizard.step_payment_desc', 'Thanh toán qua PayOS')
      });
    }

    steps.push(
      {
        id: 'template',
        title: t('wizard.step_template', 'Chọn mẫu hợp đồng'),
        description: t('wizard.step_template_desc', 'Tùy chọn'),
        optional: true
      },
      {
        id: 'send-contract',
        title: t('wizard.step_send', 'Gửi hợp đồng'),
        description: t('wizard.step_send_desc', 'Tùy chọn'),
        optional: true
      },
      {
        id: 'success',
        title: t('wizard.step_success', 'Hoàn tất'),
        description: t('wizard.step_success_desc', 'Đăng ký thành công')
      }
    );

    return steps;
  }, [formData.paymentMethod, t]);

  // PayOS payment state
  const [payOSData, setPayOSData] = React.useState<PayOSPaymentData | null>(null);

  // Bank QR payment state
  const [bankQRContractId, setBankQRContractId] = React.useState<string | null>(null);

  // Handle PayOS payment creation
  const handlePayOSPayment = React.useCallback(
    async (contractId: string) => {
      const { paymentApi } = await import('@/services/api/paymentApi');
      const paymentAmount = Math.max(priceCalculation.totalPrice, 1000);

      try {
        const paymentResponse = await paymentApi.createPayOSPaymentLink({
          customerId: customerId,
          branchId: formData.branchId,
          contractId: contractId,
          contractType: 'service',
          amount: paymentAmount,
          description: t(`${packageType.toLowerCase()}_registration.package_description`)
        });

        if (paymentResponse.success) {
          setPayOSData(paymentResponse.data);
        }
      } catch (error) {
        console.error('Error creating PayOS payment:', error);
        toast.error(
          t('payos_payment.registration_success_payos_failed', 'Đăng ký thành công nhưng không thể tạo link thanh toán')
        );
      }
    },
    [customerId, formData.branchId, priceCalculation.totalPrice, packageType, t]
  );

  // Handle payment success
  const handlePaymentSuccess = React.useCallback(() => {
    wizard.goToNext();
  }, [wizard, t]);

  // Create contract function for QR_BANK (returns Promise)
  const createContractForQRBank = React.useCallback(async (): Promise<ServiceContractResponse | null> => {
    if (!formData.servicePackageId) {
      toast.error(t('service_registration.please_select_package', 'Vui lòng chọn gói dịch vụ'));
      return null;
    }

    try {
      const { serviceContractApi } = await import('@/services/api/serviceContractApi');
      const response = await serviceContractApi.createServiceContract(customerId, formData);
      return response;
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error(t('service_registration.registration_error', 'Có lỗi xảy ra khi đăng ký dịch vụ'));
      return null;
    }
  }, [customerId, formData, t]);

  // Submit handler
  const { loading: submitLoading, handleSubmit: handleFormSubmit } = useServiceRegistrationSubmit({
    customerId,
    packageTypeName: t(`${packageType.toLowerCase()}_registration.package_type_name`),
    onSuccess: (response) => {
      if (response?.success && response?.data) {
        setContractResponse(response);

        // If BANK_TRANSFER, go to payment step to show PayOS QR code
        if (formData.paymentMethod === 'BANK_TRANSFER') {
          const contractId = response.data._id;
          if (contractId) {
            handlePayOSPayment(contractId);
          }
          wizard.goToStep('payment');
        } else if (formData.paymentMethod === 'QR_BANK') {
          // If QR_BANK, go to payment step to show Bank QR content
          const contractId = response.data._id;
          if (contractId) {
            setBankQRContractId(contractId);
          }
          // Ensure payment step exists in wizard steps before navigating
          if (wizard.steps.includes('payment')) {
            wizard.goToStep('payment');
          } else {
            // If payment step doesn't exist, log error and proceed to next available step
            console.error('Payment step not found in wizard steps:', wizard.steps);
            // Fallback: go to template or success
            if (packageType === 'CLASS') {
              wizard.goToStep('success');
            } else {
              wizard.goToStep('template');
            }
          }
        } else {
          // CASH payment, skip payment step
          // For CLASS, skip template and go to success
          // For PT, go to template step
          if (packageType === 'CLASS') {
            wizard.goToStep('success');
          } else {
            wizard.goToStep('template');
          }
        }
      }
      setIsCreatingContract(false);
    },
    onClose: () => {
      // Don't close on submit
    },
    onPaymentRequired: (contractId, response) => {
      setContractResponse(response);
      handlePayOSPayment(contractId);
      wizard.goToStep('payment');
    }
  });

  // Handle step navigation
  const handleNext = () => {
    if (wizard.currentStep === 'form') {
      // Validate form before submitting
      if (!formData.servicePackageId) {
        toast.error(t('service_registration.please_select_package', 'Vui lòng chọn gói dịch vụ'));
        return;
      }

      // For QR_BANK, don't create contract yet, just go to payment step
      if (formData.paymentMethod === 'QR_BANK') {
        wizard.goToStep('payment');
        return;
      }

      // For other payment methods, create contract immediately
      setIsCreatingContract(true);
      handleFormSubmit(formData);
    } else if (wizard.currentStep === 'payment') {
      // Payment is handled by PayOSPaymentModal, auto-advance on success
      // User can manually proceed if needed
      wizard.goToNext();
    } else if (wizard.currentStep === 'template' && !contractDocument) {
      // Skip template if not selected
      wizard.goToNext();
    } else {
      wizard.goToNext();
    }
  };

  const handleBack = () => {
    wizard.goToPrevious();
  };

  // Handle template selection
  const handleTemplateSelected = (doc: ContractDocument) => {
    setContractDocument(doc);
    wizard.goToNext();
  };

  // Handle send contract
  const handleSendNow = () => {
    wizard.goToNext();
  };

  const handleSendLater = () => {
    wizard.goToNext();
  };

  // Reset form data to initial state
  const resetFormData = React.useCallback(() => {
    setFormData({
      servicePackageId: '',
      startDate: new Date().toISOString().split('T')[0],
      branchId: currentBranch?._id || '',
      discountCampaignId: undefined,
      paymentMethod: 'CASH' as 'CASH' | 'BANK_TRANSFER' | 'QR_BANK',
      referrerStaffId: undefined,
      notes: ''
    });
    setSelectedPackage(null);
    setSelectedPromotion(null);
  }, [currentBranch?._id, setFormData, setSelectedPackage, setSelectedPromotion]);

  // Handle final success
  const handleSuccess = () => {
    wizard.reset();
    setContractResponse(null);
    setContractDocument(null);
    setPayOSData(null);
    setBankQRContractId(null);
    resetFormData();
    onSuccess?.();
    onClose();
  };

  // Reset wizard when dialog closes
  const prevIsOpenRef = React.useRef<boolean>(false);
  useEffect(() => {
    // When closing: reset all state if safe to reset
    if (!isOpen && prevIsOpenRef.current) {
      const safeToReset =
        formData.paymentMethod !== 'QR_BANK' ||
        (wizard.currentStep === 'form' && !bankQRContractId && !contractResponse?.data?._id);
      if (safeToReset) {
        wizard.reset();
        setContractResponse(null);
        setContractDocument(null);
        setIsCreatingContract(false);
        setPayOSData(null);
        setBankQRContractId(null);
        resetFormData();
      }
    }

    // When opening: reset form data if no QR contract exists (fresh start)
    if (isOpen && !prevIsOpenRef.current) {
      const hasQRContract = bankQRContractId || contractResponse?.data?._id;
      // Only reset if no QR contract exists (fresh registration)
      if (!hasQRContract) {
        resetFormData();
        wizard.reset();
        setContractResponse(null);
        setContractDocument(null);
        setIsCreatingContract(false);
        setPayOSData(null);
        setBankQRContractId(null);
      }
    }

    prevIsOpenRef.current = isOpen;
  }, [isOpen, wizard, formData.paymentMethod, bankQRContractId, contractResponse, resetFormData]);

  // Trigger payment creation when entering payment step (only for BANK_TRANSFER)
  useEffect(() => {
    if (
      wizard.currentStep === 'payment' &&
      formData.paymentMethod === 'BANK_TRANSFER' &&
      contractResponse?.data?._id &&
      !payOSData
    ) {
      handlePayOSPayment(contractResponse.data._id);
    }
  }, [wizard.currentStep, contractResponse?.data?._id, payOSData, handlePayOSPayment, formData.paymentMethod]);

  // Render step content
  const renderStepContent = () => {
    switch (wizard.currentStep) {
      case 'form':
        return (
          <RegistrationFormStep
            formData={formData}
            setFormData={setFormData}
            packages={packages}
            promotions={promotions}
            trainers={trainers}
            priceCalculation={priceCalculation}
            handlePackageChange={handlePackageChange}
            handlePromotionChange={handlePromotionChange}
            packageType={packageType}
            branchId={currentBranch?._id}
          />
        );

      case 'payment':
        // If QR_BANK, show QR content directly in the step
        if (formData.paymentMethod === 'QR_BANK') {
          // Create contract callback
          const handleCreateContract = async (): Promise<string | null> => {
            try {
              setIsCreatingContract(true);
              const response = await createContractForQRBank();
              if (response?.success && response?.data?._id) {
                const newContractId = response.data._id;
                setContractResponse(response);
                setBankQRContractId(newContractId);
                setIsCreatingContract(false);
                return newContractId;
              }
              setIsCreatingContract(false);
              return null;
            } catch (error) {
              console.error('Error creating contract:', error);
              setIsCreatingContract(false);
              return null;
            }
          };

          return (
            <BankQRPaymentContent
              branchId={currentBranch?._id || ''}
              amount={priceCalculation.totalPrice}
              contractId={bankQRContractId || contractResponse?.data?._id}
              contractType="service"
              contractPaymentMethod={formData.paymentMethod}
              contractStatus={contractResponse?.data?.status}
              requiresApproval={currentUser?.role === 'CUSTOMER'}
              formData={formData}
              onCreateContract={!bankQRContractId && !contractResponse?.data?._id ? handleCreateContract : undefined}
              packageType={packageType}
              onPaymentSubmitted={(contractId) => {
                setBankQRContractId(contractId);
                // If staff/owner, auto proceed to next step
                if (currentUser?.role !== 'CUSTOMER') {
                  handlePaymentSuccess();
                }
              }}
            />
          );
        }
        // BANK_TRANSFER (PayOS)
        return (
          <PaymentStep
            contractId={contractResponse?.data?._id || null}
            paymentData={payOSData}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentInit={handlePayOSPayment}
            isLoading={!contractResponse?.data?._id || !payOSData}
          />
        );

      case 'template':
        return (
          <TemplateSelectionStep
            contractId={contractResponse?.data?._id || null}
            branchId={currentBranch?._id}
            customerId={customerId}
            onTemplateSelected={handleTemplateSelected}
            onSkip={() => wizard.goToNext()}
          />
        );

      case 'send-contract':
        return (
          <SendContractStep
            contractDocument={contractDocument}
            onSendNow={handleSendNow}
            onSendLater={handleSendLater}
          />
        );

      case 'success':
        return (
          <SuccessStep
            onClose={handleSuccess}
            message={t('registration.success_message', 'Đã đăng ký dịch vụ thành công.')}
          />
        );

      default:
        return null;
    }
  };

  // Filter steps to show only active ones
  const activeSteps = stepperSteps.filter((step) => wizard.steps.includes(step.id as WizardStep));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(`${packageType.toLowerCase()}_registration.title`, `Đăng ký ${packageType}`)}</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="mb-6">
          <Stepper
            steps={activeSteps}
            currentStep={wizard.stepIndex}
            completedSteps={Array.from({ length: wizard.stepIndex }, (_, i) => i)}
          />
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">{renderStepContent()}</div>

        {/* Navigation Buttons */}
        {wizard.currentStep !== 'success' && (
          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={wizard.canGoBack ? handleBack : onClose}
              disabled={isCreatingContract || submitLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {wizard.canGoBack ? t('wizard.back', 'Quay lại') : t('wizard.cancel', 'Hủy')}
            </Button>

            <Button
              onClick={handleNext}
              disabled={
                isCreatingContract || submitLoading || (wizard.currentStep === 'form' && !formData.servicePackageId)
              }
            >
              {wizard.isLastStep ? t('wizard.finish', 'Hoàn tất') : t('wizard.next', 'Tiếp theo')}
              {!wizard.isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
