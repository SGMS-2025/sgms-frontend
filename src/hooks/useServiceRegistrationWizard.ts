import { useState, useCallback, useMemo } from 'react';

export type WizardStep = 'form' | 'payment' | 'template' | 'send-contract' | 'success';

export interface UseServiceRegistrationWizardOptions {
  paymentMethod?: 'CASH' | 'BANK_TRANSFER';
  skipPayment?: boolean;
  skipTemplate?: boolean;
  skipSendContract?: boolean;
}

export interface UseServiceRegistrationWizardReturn {
  currentStep: WizardStep;
  stepIndex: number;
  steps: WizardStep[];
  canGoBack: boolean;
  canGoNext: boolean;
  goToStep: (step: WizardStep) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  reset: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  totalSteps: number;
}

export function useServiceRegistrationWizard(
  options: UseServiceRegistrationWizardOptions = {}
): UseServiceRegistrationWizardReturn {
  const { paymentMethod, skipPayment, skipTemplate, skipSendContract } = options;

  // Determine which steps to show
  const steps = useMemo((): WizardStep[] => {
    const stepList: WizardStep[] = ['form'];

    // Add payment step only if BANK_TRANSFER and not skipped
    if (paymentMethod === 'BANK_TRANSFER' && !skipPayment) {
      stepList.push('payment');
    }

    // Add template step if not skipped
    if (!skipTemplate) {
      stepList.push('template');
    }

    // Add send contract step if not skipped
    if (!skipSendContract) {
      stepList.push('send-contract');
    }

    stepList.push('success');
    return stepList;
  }, [paymentMethod, skipPayment, skipTemplate, skipSendContract]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = steps[currentStepIndex];
  const stepIndex = currentStepIndex;
  const canGoBack = currentStepIndex > 0;
  const canGoNext = currentStepIndex < steps.length - 1;

  const goToStep = useCallback(
    (step: WizardStep) => {
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
