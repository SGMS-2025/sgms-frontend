import React from 'react';
import { ServiceRegistrationWizard } from './ServiceRegistrationWizard';

interface PTRegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  onSuccess?: () => void;
}

/**
 * PT Registration Dialog - Wrapper around ServiceRegistrationWizard
 * This maintains backward compatibility while using the new wizard flow
 */
export const PTRegistrationDialog: React.FC<PTRegistrationDialogProps> = ({
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
      packageType="PT"
      onSuccess={onSuccess}
    />
  );
};
