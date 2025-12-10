import React from 'react';
import { MembershipRegistrationWizard } from './MembershipRegistrationWizard';

interface MembershipRegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  onSuccess?: () => void;
  onPaymentStepActiveChange?: (active: boolean) => void;
  onStepChange?: (step: 'form' | 'payment' | 'success') => void;
}

export const MembershipRegistrationDialog: React.FC<MembershipRegistrationDialogProps> = ({
  isOpen,
  onClose,
  customerId,
  onSuccess,
  onPaymentStepActiveChange,
  onStepChange
}) => {
  return (
    <MembershipRegistrationWizard
      isOpen={isOpen}
      onClose={onClose}
      customerId={customerId}
      onSuccess={onSuccess}
      onPaymentStepActiveChange={onPaymentStepActiveChange}
      onStepChange={onStepChange}
    />
  );
};
