import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FeatureFormFieldsProps {
  translationKey: string;
  name: string;
  error: string;
  onNameChange: (value: string) => void;
  onBlur: () => void;
  disabled?: boolean;
}

export const FeatureFormFields: React.FC<FeatureFormFieldsProps> = ({
  translationKey,
  name,
  error,
  onNameChange,
  onBlur,
  disabled = false
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="name">
          {t(`${translationKey}.feature_name`)} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={onBlur}
          placeholder={t(`${translationKey}.feature_name_placeholder`)}
          disabled={disabled}
          className={error ? 'border-red-500' : ''}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
};
