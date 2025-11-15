import React from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaymentMethodSelectorProps {
  value: 'CASH' | 'BANK_TRANSFER';
  onChange: (value: 'CASH' | 'BANK_TRANSFER') => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{t('shared_form.payment_method_label')}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="CASH">{t('shared_form.payment_cash')}</SelectItem>
          <SelectItem value="BANK_TRANSFER">{t('shared_form.payment_transfer')}</SelectItem>
        </SelectContent>
      </Select>
      {value === 'BANK_TRANSFER' && <p className="text-xs text-blue-600">{t('shared_form.payment_transfer_note')}</p>}
    </div>
  );
};
