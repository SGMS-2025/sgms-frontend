import React from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface PaymentAmountInputProps {
  value: number;
  onChange: (value: number) => void;
}

export const PaymentAmountInput: React.FC<PaymentAmountInputProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        <DollarSign className="inline h-4 w-4" /> {t('shared_form.payment_amount_label')}
      </Label>
      <Input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder={t('shared_form.payment_amount_placeholder')}
      />
    </div>
  );
};
