import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface FormActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  loading: boolean;
  submitText?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({ onCancel, onSubmit, loading, submitText }) => {
  const { t } = useTranslation();
  return (
    <div className="flex justify-end gap-3">
      <Button variant="outline" onClick={onCancel}>
        {t('shared_form.cancel')}
      </Button>
      <Button onClick={onSubmit} disabled={loading}>
        {loading ? t('shared_form.processing') : submitText || t('shared_form.register')}
      </Button>
    </div>
  );
};
