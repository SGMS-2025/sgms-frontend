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
import { toast } from 'sonner';
import type { ServiceContractResponse } from '@/types/api/Package';
import type { ContractDocument } from '@/types/api/ContractDocument';
import type { PayOSPaymentData } from '@/services/api/paymentApi';

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

  // Form data
  const { formData, setFormData, priceCalculation, handlePackageChange, handlePromotionChange } =
    useServiceRegistration(currentBranch?._id || '');

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
    // For BANK_TRANSFER, always show payment step to display QR code
    skipPayment: formData.paymentMethod === 'CASH',
    skipTemplate: false,
    skipSendContract: false
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

    // Add payment step if BANK_TRANSFER (to show QR code and payment info)
    if (formData.paymentMethod === 'BANK_TRANSFER') {
      steps.push({
        id: 'payment',
        title: t('wizard.step_payment', 'Thanh toán'),
        description: t('wizard.step_payment_desc', 'Thanh toán qua PayOS')
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
    toast.success(t('payos_payment.payment_success', 'Thanh toán thành công!'));
    wizard.goToNext();
  }, [wizard, t]);

  // Submit handler
  const { loading: submitLoading, handleSubmit: handleFormSubmit } = useServiceRegistrationSubmit({
    customerId,
    packageTypeName: t(`${packageType.toLowerCase()}_registration.package_type_name`),
    onSuccess: (response) => {
      if (response?.success && response?.data) {
        setContractResponse(response);

        // If BANK_TRANSFER, go to payment step to show QR code
        if (formData.paymentMethod === 'BANK_TRANSFER') {
          const contractId = response.data._id;
          if (contractId) {
            handlePayOSPayment(contractId);
          }
          wizard.goToStep('payment');
        } else {
          // CASH payment, skip payment step and go to template
          wizard.goToStep('template');
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

  // Handle final success
  const handleSuccess = () => {
    wizard.reset();
    setContractResponse(null);
    setContractDocument(null);
    onSuccess?.();
    onClose();
  };

  // Reset wizard when dialog closes
  useEffect(() => {
    if (!isOpen) {
      wizard.reset();
      setContractResponse(null);
      setContractDocument(null);
      setIsCreatingContract(false);
      setPayOSData(null);
    }
  }, [isOpen, wizard]);

  // Trigger payment creation when entering payment step
  useEffect(() => {
    if (wizard.currentStep === 'payment' && contractResponse?.data?._id && !payOSData) {
      handlePayOSPayment(contractResponse.data._id);
    }
  }, [wizard.currentStep, contractResponse?.data?._id, payOSData, handlePayOSPayment]);

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
          />
        );

      case 'payment':
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
            contractType={packageType === 'PT' ? 'service_pt' : 'service_class'}
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
