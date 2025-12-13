import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Stepper, type StepperStep } from '@/components/ui/stepper';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useMembershipRegistrationWizard, type MembershipWizardStep } from '@/hooks/useMembershipRegistrationWizard';
import { useMembershipRegistration } from '@/hooks/useMembershipRegistration';
import { useBranch } from '@/contexts/BranchContext';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { useUser } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { membershipApi } from '@/services/api/membershipApi';
import { discountCampaignApi } from '@/services/api/discountApi';
import { paymentApi, type PayOSPaymentData } from '@/services/api/paymentApi';
import { staffApi } from '@/services/api/staffApi';
import type { MembershipPlan } from '@/types/api/Membership';
import type { MembershipContractResponse } from '@/types/api/Customer';
import type { DiscountCampaign } from '@/types/api/Discount';
import type { Staff } from '@/types/api/Staff';
import { BankQRPaymentContent } from './shared/BankQRPaymentContent';
import { MembershipFormStep } from './steps/MembershipFormStep';
import { PaymentStep } from './steps/PaymentStep';
import { SuccessStep } from './steps/SuccessStep';

interface MembershipRegistrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  onSuccess?: () => void;
  onPaymentStepActiveChange?: (active: boolean) => void;
  onStepChange?: (step: MembershipWizardStep) => void;
}

export const MembershipRegistrationWizard: React.FC<MembershipRegistrationWizardProps> = ({
  isOpen,
  onClose,
  customerId,
  onSuccess,
  onPaymentStepActiveChange,
  onStepChange
}) => {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();
  const { currentStaff } = useCurrentUserStaff();
  const currentUser = useUser();

  const getContractId = useCallback(
    (response?: MembershipContractResponse | null) => response?.data?._id || response?.data?.contract?._id || null,
    []
  );

  const getContractStatus = useCallback(
    (response?: MembershipContractResponse | null) =>
      response?.data?.status || response?.data?.contract?.status || undefined,
    []
  );

  const getContractPaymentMethod = useCallback(
    (response?: MembershipContractResponse | null) =>
      response?.data?.paymentMethod || response?.data?.contract?.paymentMethod || null,
    []
  );

  // Form data
  const { formData, setFormData, handlePlanChange, handlePromotionChange } = useMembershipRegistration(
    currentBranch?._id || ''
  );

  // Fetch data
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [promotions, setPromotions] = useState<DiscountCampaign[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<DiscountCampaign | null>(null);

  // Price calculation
  const priceCalculation = useMemo(() => {
    const basePrice = selectedPlan?.price || 0;
    const discountPercent = selectedPromotion?.discountPercentage || 0;
    const discountAmount = (basePrice * discountPercent) / 100;
    const totalPrice = basePrice - discountAmount;
    return {
      basePrice,
      discountPercent,
      discountAmount,
      totalPrice
    };
  }, [selectedPlan, selectedPromotion]);

  // Contract creation state
  const [contractResponse, setContractResponse] = useState<MembershipContractResponse | null>(null);
  const [isCreatingContract, setIsCreatingContract] = useState(false);

  // PayOS payment state
  const [payOSData, setPayOSData] = useState<PayOSPaymentData | null>(null);

  // Bank QR payment state
  const [bankQRContractId, setBankQRContractId] = useState<string | null>(null);
  const previousPaymentMethodRef = useRef(formData.paymentMethod);
  const contractPaymentMethodRef = useRef<'CASH' | 'BANK_TRANSFER' | 'QR_BANK' | null>(null);
  const lastStepRef = useRef<MembershipWizardStep>('form');

  // Wizard state management
  // Keep a stable payment method if a contract was already created, so steps don't drop the payment step on re-render
  const effectivePaymentMethod =
    contractPaymentMethodRef.current ||
    (bankQRContractId || contractResponse?.data
      ? getContractPaymentMethod(contractResponse) || formData.paymentMethod
      : formData.paymentMethod);

  const wizard = useMembershipRegistrationWizard({
    paymentMethod: effectivePaymentMethod,
    skipPayment: effectivePaymentMethod === 'CASH'
  });

  // If we already have a QR contract, ensure paymentMethod stays QR_BANK so steps include payment
  useEffect(() => {
    const existingContractId = bankQRContractId || getContractId(contractResponse) || undefined;
    if (existingContractId && formData.paymentMethod !== 'QR_BANK') {
      setFormData((prev) => ({ ...prev, paymentMethod: 'QR_BANK' }));
    }
  }, [bankQRContractId, contractResponse, formData.paymentMethod, setFormData, getContractId]);

  // Reset contract/payment state when payment method changes to avoid reusing old contracts
  useEffect(() => {
    const prevMethod = previousPaymentMethodRef.current;
    // Do not reset if we already have a QR contract and paymentMethod toggled by parent
    const hasQRContract = bankQRContractId || getContractId(contractResponse);
    if (prevMethod && prevMethod !== formData.paymentMethod) {
      if (hasQRContract && formData.paymentMethod === 'QR_BANK') {
        previousPaymentMethodRef.current = formData.paymentMethod;
        contractPaymentMethodRef.current = 'QR_BANK';
        return;
      }

      setContractResponse(null);
      setPayOSData(null);
      setBankQRContractId(null);
      setIsCreatingContract(false);
      contractPaymentMethodRef.current = null;

      if (wizard.currentStep !== 'form') {
        wizard.goToStep('form');
      }
    }

    previousPaymentMethodRef.current = formData.paymentMethod;
  }, [formData.paymentMethod, wizard, bankQRContractId, contractResponse, getContractId]);

  // Track last step to restore when dialog reopens (e.g., parent refresh)
  useEffect(() => {
    if (wizard.currentStep) {
      lastStepRef.current = wizard.currentStep;
    }
  }, [wizard.currentStep]);

  // Fetch plans and promotions (only when dialog opens and on form step)
  useEffect(() => {
    if (!isOpen || !currentBranch?._id) return;
    // Don't refetch if we're already past the form step (e.g., on payment step)
    if (wizard.currentStep !== 'form' && plans.length > 0) return;

    const fetchData = async () => {
      const [plansRes, promotionsRes] = await Promise.all([
        membershipApi.getMembershipPlans({ page: 1, limit: 100, status: 'ACTIVE' }, [currentBranch._id]),
        discountCampaignApi.getActiveCampaignsByBranch(currentBranch._id)
      ]);

      if (plansRes.success && plansRes.data) {
        setPlans(plansRes.data.plans || []);
      }

      if (promotionsRes.success && promotionsRes.data) {
        setPromotions(promotionsRes.data);
      }
    };

    fetchData();
  }, [isOpen, currentBranch?._id, wizard.currentStep, plans.length]);

  // Fetch staff list (only when dialog opens and on form step)
  useEffect(() => {
    if (!isOpen || !currentBranch?._id) return;
    // Don't refetch if we're already past the form step (e.g., on payment step)
    if (wizard.currentStep !== 'form' && staffList.length > 0) return;

    const fetchStaffList = async () => {
      setLoadingStaff(true);
      try {
        const response = await staffApi.getStaffListByBranch(currentBranch._id, {
          limit: 100,
          jobTitle: 'Personal Trainer'
        });
        if (response.success && response.data) {
          setStaffList(response.data);
        }
      } catch (error) {
        console.error('Error fetching staff list:', error);
      } finally {
        setLoadingStaff(false);
      }
    };

    fetchStaffList();
  }, [isOpen, currentBranch?._id, wizard.currentStep, staffList.length]);

  // Auto-set referrerStaffId if current user is PT
  useEffect(() => {
    if (currentStaff?.userId?._id && currentStaff.jobTitle === 'Personal Trainer') {
      setFormData((prev) => ({
        ...prev,
        referrerStaffId: currentStaff.userId._id
      }));
    }
  }, [currentStaff, setFormData]);

  // Update selected plan when formData.membershipPlanId changes
  useEffect(() => {
    if (formData.membershipPlanId) {
      const plan = plans.find((p) => p._id === formData.membershipPlanId);
      setSelectedPlan(plan || null);
    } else {
      setSelectedPlan(null);
    }
  }, [formData.membershipPlanId, plans]);

  // Update selected promotion when formData.discountCampaignId changes
  useEffect(() => {
    if (formData.discountCampaignId) {
      const promo = promotions.find((p) => p._id === formData.discountCampaignId);
      setSelectedPromotion(promo || null);
    } else {
      setSelectedPromotion(null);
    }
  }, [formData.discountCampaignId, promotions]);

  // Handle plan change
  const handlePlanChangeWrapper = useCallback(
    (planId: string) => {
      const plan = plans.find((p) => p._id === planId);
      setSelectedPlan(plan || null);
      handlePlanChange(planId);
    },
    [plans, handlePlanChange]
  );

  // Handle promotion change
  const handlePromotionChangeWrapper = useCallback(
    (promotionId: string | undefined) => {
      if (promotionId) {
        const promo = promotions.find((p) => p._id === promotionId);
        setSelectedPromotion(promo || null);
      } else {
        setSelectedPromotion(null);
      }
      handlePromotionChange(promotionId);
    },
    [promotions, handlePromotionChange]
  );

  // Handle PayOS payment creation
  const handlePayOSPayment = useCallback(
    async (contractId: string) => {
      const paymentAmount = Math.max(priceCalculation.totalPrice, 1000);

      try {
        const paymentResponse = await paymentApi.createPayOSPaymentLink({
          customerId: customerId,
          branchId: formData.branchId,
          contractId: contractId,
          contractType: 'membership',
          amount: paymentAmount,
          description: t('membership_registration.package_description')
        });

        if (paymentResponse.success) {
          setPayOSData(paymentResponse.data);
        }
      } catch (error) {
        console.error('Error creating PayOS payment:', error);
        toast.error(t('membership_registration.warning_payos_failed'));
      }
    },
    [customerId, formData.branchId, priceCalculation.totalPrice, t]
  );

  // Handle payment success
  const handlePaymentSuccess = useCallback(() => {
    wizard.goToNext();
  }, [wizard]);

  // Create contract function for QR_BANK
  const createContractForQRBank = useCallback(async (): Promise<MembershipContractResponse | null> => {
    if (!formData.membershipPlanId) {
      toast.error(t('membership_registration.error_select_plan'));
      return null;
    }

    try {
      const response = await membershipApi.createMembershipContract(customerId, formData);
      if (response?.data) {
        contractPaymentMethodRef.current = getContractPaymentMethod(response) || 'QR_BANK';
      }
      return response;
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error(t('membership_registration.error_register'));
      return null;
    }
  }, [customerId, formData, t]);

  // Handle step navigation
  const handleNext = () => {
    if (wizard.currentStep === 'form') {
      // Validate form before submitting
      if (!formData.membershipPlanId) {
        toast.error(t('membership_registration.error_select_plan'));
        return;
      }

      if (!currentBranch?._id) {
        toast.error(t('membership_registration.error_select_branch'));
        return;
      }

      // For QR_BANK, always go to payment step; contract will be created when user confirms transfer
      if (formData.paymentMethod === 'QR_BANK') {
        wizard.goToStep('payment');
        return;
      }

      // For BANK_TRANSFER, create contract and go to payment step
      if (formData.paymentMethod === 'BANK_TRANSFER') {
        setIsCreatingContract(true);
        const submitData = {
          ...formData,
          branchId: currentBranch._id
        };
        membershipApi
          .createMembershipContract(customerId, submitData)
          .then((response) => {
            if (response?.success && response?.data) {
              setContractResponse(response);
              contractPaymentMethodRef.current = getContractPaymentMethod(response) || formData.paymentMethod || null;
              const contractId = getContractId(response);
              if (contractId) {
                handlePayOSPayment(contractId);
              }
              wizard.goToStep('payment');
            } else {
              toast.error(response?.message || t('membership_registration.error_register_failed'));
            }
            setIsCreatingContract(false);
          })
          .catch(() => {
            toast.error(t('membership_registration.error_register'));
            setIsCreatingContract(false);
          });
        return;
      }

      // For CASH, create contract and go to success
      setIsCreatingContract(true);
      const submitData = {
        ...formData,
        branchId: currentBranch._id
      };
      membershipApi
        .createMembershipContract(customerId, submitData)
        .then((response) => {
          if (response?.success && response?.data) {
            setContractResponse(response);
            contractPaymentMethodRef.current = getContractPaymentMethod(response) || formData.paymentMethod || null;
            wizard.goToStep('success');
          } else {
            toast.error(response?.message || t('membership_registration.error_register_failed'));
          }
          setIsCreatingContract(false);
        })
        .catch(() => {
          toast.error(t('membership_registration.error_register'));
          setIsCreatingContract(false);
        });
    } else if (wizard.currentStep === 'payment') {
      // Payment is handled by PaymentStep or BankQRPaymentContent
      // For QR_BANK, don't allow manual proceed - user must click "Tôi đã chuyển khoản" button
      if (formData.paymentMethod === 'QR_BANK') {
        // Don't allow manual proceed for QR_BANK - user must confirm payment
        toast.info('Vui lòng xác nhận đã chuyển khoản bằng cách bấm nút "Tôi đã chuyển khoản"');
        return;
      }
      // For BANK_TRANSFER (PayOS), allow manual proceed if needed
      wizard.goToNext();
    } else {
      wizard.goToNext();
    }
  };

  const handleBack = () => {
    wizard.goToPrevious();
  };

  // Reset form data to initial state
  const resetFormData = useCallback(() => {
    setFormData({
      membershipPlanId: '',
      branchId: currentBranch?._id || '',
      cardCode: '',
      startDate: new Date().toISOString().split('T')[0],
      discountCampaignId: undefined,
      paymentMethod: 'CASH' as 'CASH' | 'BANK_TRANSFER' | 'QR_BANK',
      referrerStaffId: undefined,
      notes: ''
    });
    setSelectedPlan(null);
    setSelectedPromotion(null);
  }, [currentBranch?._id, setFormData]);

  // Handle final success
  const handleSuccess = () => {
    wizard.reset();
    setContractResponse(null);
    setPayOSData(null);
    setBankQRContractId(null);
    contractPaymentMethodRef.current = null;
    previousPaymentMethodRef.current = undefined;
    lastStepRef.current = 'form';
    setIsCreatingContract(false);
    resetFormData();
    onSuccess?.();
    onClose();
  };

  // Reset wizard when dialog closes
  const prevIsOpenRef = useRef<boolean>(false);
  useEffect(() => {
    // When closing: reset all state if safe to reset
    if (!isOpen && prevIsOpenRef.current) {
      const safeToReset =
        formData.paymentMethod !== 'QR_BANK' ||
        (wizard.currentStep === 'form' && !bankQRContractId && !getContractId(contractResponse));
      if (safeToReset) {
        wizard.reset();
        setContractResponse(null);
        setIsCreatingContract(false);
        setPayOSData(null);
        setBankQRContractId(null);
        contractPaymentMethodRef.current = null;
        previousPaymentMethodRef.current = undefined;
        lastStepRef.current = 'form';
        resetFormData();
      }
    }

    // When opening: reset form data if no QR contract exists (fresh start)
    if (isOpen && !prevIsOpenRef.current) {
      const hasQRContract = bankQRContractId || getContractId(contractResponse);
      // Only reset if no QR contract exists (fresh registration)
      if (!hasQRContract) {
        resetFormData();
        wizard.reset();
        setContractResponse(null);
        setIsCreatingContract(false);
        setPayOSData(null);
        setBankQRContractId(null);
        contractPaymentMethodRef.current = null;
        previousPaymentMethodRef.current = undefined;
        lastStepRef.current = 'form';
      }
    }

    // When opening: if we already have a QR contract, jump to payment step
    if (isOpen) {
      const hasQRContract = bankQRContractId || getContractId(contractResponse);
      const paymentStepIndex = wizard.steps.indexOf('payment');
      const isBeforePaymentStep = paymentStepIndex !== -1 && wizard.stepIndex < paymentStepIndex;

      if (formData.paymentMethod === 'QR_BANK' && hasQRContract && isBeforePaymentStep) {
        if (wizard.steps.includes('payment')) {
          wizard.goToStep('payment');
        }
      } else if (
        formData.paymentMethod === 'QR_BANK' &&
        lastStepRef.current === 'payment' &&
        wizard.steps.includes('payment') &&
        isBeforePaymentStep
      ) {
        // No contract yet but user was on payment step before refresh/remount -> restore payment step
        wizard.goToStep('payment');
      }
    }

    prevIsOpenRef.current = isOpen;
  }, [
    isOpen,
    wizard,
    wizard.steps,
    wizard.stepIndex,
    wizard.currentStep,
    formData.paymentMethod,
    bankQRContractId,
    contractResponse,
    resetFormData,
    getContractId
  ]);

  // Force stay on payment step if QR contract exists (guard against re-mount/reset)
  useEffect(() => {
    if (!isOpen || formData.paymentMethod !== 'QR_BANK') return;

    const hasQRContract = bankQRContractId || getContractId(contractResponse);
    if (!hasQRContract) return;

    const paymentStepIndex = wizard.steps.indexOf('payment');
    // Only force navigation when we accidentally fell back before the payment step (e.g. remount), not after success
    if (paymentStepIndex !== -1 && wizard.stepIndex < paymentStepIndex) {
      wizard.goToStep('payment');
    }
  }, [isOpen, formData.paymentMethod, bankQRContractId, contractResponse, wizard, wizard.steps, wizard.stepIndex]);

  // Notify parent when entering/leaving QR payment step (to allow parent to skip refresh)
  useEffect(() => {
    if (!onPaymentStepActiveChange) return;
    const active = isOpen && formData.paymentMethod === 'QR_BANK' && wizard.currentStep === 'payment';
    onPaymentStepActiveChange(active);
  }, [isOpen, formData.paymentMethod, wizard.currentStep, onPaymentStepActiveChange]);

  // Notify parent on any step change
  useEffect(() => {
    if (onStepChange) {
      onStepChange(wizard.currentStep);
    }
  }, [wizard.currentStep, onStepChange]);

  // Trigger payment creation when entering payment step (only for BANK_TRANSFER)
  useEffect(() => {
    if (wizard.currentStep === 'payment' && formData.paymentMethod === 'BANK_TRANSFER' && contractResponse?.data) {
      const contractId = getContractId(contractResponse);
      if (contractId && !payOSData) {
        handlePayOSPayment(contractId);
      }
    }
  }, [wizard.currentStep, contractResponse, payOSData, handlePayOSPayment, formData.paymentMethod, getContractId]);

  // Step definitions for stepper
  const stepperSteps: StepperStep[] = useMemo(() => {
    const steps: StepperStep[] = [
      {
        id: 'form',
        title: t('wizard.step_form', 'Thông tin đăng ký'),
        description: t('wizard.step_form_desc', 'Chọn gói và điền thông tin')
      }
    ];

    // Add payment step if BANK_TRANSFER or QR_BANK
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

    steps.push({
      id: 'success',
      title: t('wizard.step_success', 'Hoàn tất'),
      description: t('wizard.step_success_desc', 'Đăng ký thành công')
    });

    return steps;
  }, [formData.paymentMethod, t]);

  // Render step content
  const renderStepContent = () => {
    switch (wizard.currentStep) {
      case 'form':
        return (
          <MembershipFormStep
            formData={formData}
            setFormData={setFormData}
            plans={plans}
            promotions={promotions}
            staffList={staffList}
            selectedPlan={selectedPlan}
            priceCalculation={priceCalculation}
            handlePlanChange={handlePlanChangeWrapper}
            handlePromotionChange={handlePromotionChangeWrapper}
            currentStaff={currentStaff}
            loadingStaff={loadingStaff}
            branchId={currentBranch?._id}
          />
        );

      case 'payment':
        // If QR_BANK, show QR content directly in the step
        if (formData.paymentMethod === 'QR_BANK') {
          const contractId = bankQRContractId || getContractId(contractResponse) || undefined;
          const contractStatus = getContractStatus(contractResponse);

          return (
            <BankQRPaymentContent
              branchId={currentBranch?._id || ''}
              amount={priceCalculation.totalPrice}
              contractId={contractId || undefined}
              contractType="membership"
              contractPaymentMethod={contractPaymentMethodRef.current || formData.paymentMethod}
              contractStatus={contractStatus}
              transferContent={contractId ? `MEMBERSHIP_${contractId.slice(-8)}` : undefined}
              requiresApproval={currentUser?.role === 'CUSTOMER'}
              formData={formData}
              onCreateContract={
                !contractId
                  ? async () => {
                      const response = await createContractForQRBank();
                      if (response?.success && response?.data) {
                        const newContractId = getContractId(response);
                        if (newContractId) {
                          setContractResponse(response);
                          setBankQRContractId(newContractId);
                          contractPaymentMethodRef.current =
                            getContractPaymentMethod(response) || formData.paymentMethod || 'QR_BANK';
                          return newContractId;
                        }
                      }
                      return null;
                    }
                  : undefined
              }
              onPaymentSubmitted={(newContractId) => {
                if (newContractId) {
                  setBankQRContractId(newContractId);
                  contractPaymentMethodRef.current = 'QR_BANK';
                }
                // Luôn đi tiếp bước hoàn tất để người dùng thấy kết quả (pending hoặc thành công)
                if (currentUser?.role === 'CUSTOMER') {
                  toast.info('Đã ghi nhận yêu cầu thanh toán. Vui lòng chờ xác nhận từ quản lý.');
                }
                handlePaymentSuccess();
              }}
            />
          );
        }
        // BANK_TRANSFER (PayOS)
        {
          const payOSContractId = getContractId(contractResponse);
          return (
            <PaymentStep
              contractId={payOSContractId || null}
              paymentData={payOSData}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentInit={handlePayOSPayment}
              isLoading={!payOSContractId || !payOSData}
            />
          );
        }

      case 'success':
        return (
          <SuccessStep
            onClose={handleSuccess}
            message={t('membership_registration.success', 'Đã đăng ký membership thành công.')}
          />
        );

      default:
        return null;
    }
  };

  // Filter steps to show only active ones
  const activeSteps = stepperSteps.filter((step) => wizard.steps.includes(step.id as MembershipWizardStep));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('membership_registration.title', 'Đăng ký Membership')}</DialogTitle>
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
            <Button variant="outline" onClick={wizard.canGoBack ? handleBack : onClose} disabled={isCreatingContract}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {wizard.canGoBack ? t('wizard.back', 'Quay lại') : t('wizard.cancel', 'Hủy')}
            </Button>

            {/* Hide "Next" button for QR_BANK payment step - user must click "Tôi đã chuyển khoản" button */}
            {!(wizard.currentStep === 'payment' && formData.paymentMethod === 'QR_BANK') && (
              <Button
                onClick={handleNext}
                disabled={isCreatingContract || (wizard.currentStep === 'form' && !formData.membershipPlanId)}
              >
                {isCreatingContract
                  ? t('membership_registration.processing', 'Đang xử lý...')
                  : wizard.isLastStep
                    ? t('wizard.finish', 'Hoàn tất')
                    : t('wizard.next', 'Tiếp theo')}
                {!wizard.isLastStep && !isCreatingContract && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
