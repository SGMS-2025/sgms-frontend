/**
 * EditProgressForm - Wrapper component for backward compatibility
 *
 * This component wraps the unified ProgressForm with mode='edit'
 * to maintain backward compatibility with existing code.
 */

import React from 'react';
import { ProgressForm } from './ProgressForm';
import type { EditProgressFormProps } from '@/types/forms/Progress';

export const EditProgressForm: React.FC<EditProgressFormProps> = ({ progressId, initialData, onSubmit, onCancel }) => {
  return (
    <ProgressForm
      mode="edit"
      progressId={progressId}
      initialData={initialData}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
};

export default EditProgressForm;
