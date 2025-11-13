import React from 'react';
import { ServiceRegistrationWizard } from './ServiceRegistrationWizard';

interface ClassRegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  onSuccess?: () => void;
}

/**
 * Class Registration Dialog - Wrapper around ServiceRegistrationWizard
 * This maintains backward compatibility while using the new wizard flow
 */
export const ClassRegistrationDialog: React.FC<ClassRegistrationDialogProps> = ({
  isOpen,
  onClose,
  customerId,
  onSuccess
}) => {
  return (
    <ServiceRegistrationWizard
      isOpen={isOpen}
      onClose={onClose}
      customerId={customerId}
      packageType="CLASS"
      onSuccess={onSuccess}
    />
  );
};
