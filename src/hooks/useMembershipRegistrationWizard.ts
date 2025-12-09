import { useState, useCallback, useMemo } from 'react';

export type MembershipWizardStep = 'form' | 'payment' | 'success';

export interface UseMembershipRegistrationWizardOptions {
  paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'QR_BANK';
  skipPayment?: boolean;
}

export interface UseMembershipRegistrationWizardReturn {
  currentStep: MembershipWizardStep;
  stepIndex: number;
  steps: MembershipWizardStep[];
  canGoBack: boolean;
  canGoNext: boolean;
  goToStep: (step: MembershipWizardStep) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  reset: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  totalSteps: number;
}

export function useMembershipRegistrationWizard(
  options: UseMembershipRegistrationWizardOptions = {}
): UseMembershipRegistrationWizardReturn {
  const { paymentMethod, skipPayment } = options;

  // Determine which steps to show
  const steps = useMemo((): MembershipWizardStep[] => {
    const stepList: MembershipWizardStep[] = ['form'];

    // Add payment step if BANK_TRANSFER or QR_BANK and not skipped
    if ((paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'QR_BANK') && !skipPayment) {
      stepList.push('payment');
    }

    stepList.push('success');
    return stepList;
  }, [paymentMethod, skipPayment]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = steps[currentStepIndex];
  const stepIndex = currentStepIndex;
  const canGoBack = currentStepIndex > 0;
  const canGoNext = currentStepIndex < steps.length - 1;

  const goToStep = useCallback(
    (step: MembershipWizardStep) => {
      const index = steps.indexOf(step);
      if (index !== -1) {
        setCurrentStepIndex(index);
      }
    },
    [steps]
  );

  const goToNext = useCallback(() => {
    if (canGoNext) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [canGoNext]);

  const goToPrevious = useCallback(() => {
    if (canGoBack) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [canGoBack]);

  const reset = useCallback(() => {
    setCurrentStepIndex(0);
  }, []);

  return {
    currentStep,
    stepIndex,
    steps,
    canGoBack,
    canGoNext,
    goToStep,
    goToNext,
    goToPrevious,
    reset,
    isFirstStep: stepIndex === 0,
    isLastStep: stepIndex === steps.length - 1,
    totalSteps: steps.length
  };
}
