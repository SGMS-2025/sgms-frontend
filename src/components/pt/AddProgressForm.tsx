/**
 * AddProgressForm - Wrapper component for backward compatibility
 *
 * This component wraps the unified ProgressForm with mode='add'
 * to maintain backward compatibility with existing code.
 */

import React from 'react';
import { ProgressForm } from './ProgressForm';
import type { AddProgressFormProps } from '@/types/forms/Progress';

export const AddProgressForm: React.FC<AddProgressFormProps> = ({
  customerId,
  serviceContractId,
  trainerId,
  onSubmit,
  onCancel
}) => {
  return (
    <ProgressForm
      mode="add"
      customerId={customerId}
      serviceContractId={serviceContractId}
      trainerId={trainerId}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
};

export default AddProgressForm;
