import React from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaymentMethodSelectorProps {
  value: 'CASH' | 'BANK_TRANSFER' | 'QR_BANK';
  onChange: (value: 'CASH' | 'BANK_TRANSFER' | 'QR_BANK') => void;
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
          <SelectItem value="BANK_TRANSFER">Chuyển khoản (PayOS)</SelectItem>
          <SelectItem value="QR_BANK">QR Ngân hàng (Thủ công)</SelectItem>
        </SelectContent>
      </Select>
      {value === 'BANK_TRANSFER' && <p className="text-xs text-blue-600">Thanh toán qua PayOS - Tự động xác nhận</p>}
      {value === 'QR_BANK' && (
        <p className="text-xs text-blue-600">
          Chuyển khoản thủ công qua QR code ngân hàng của chi nhánh. Nếu bạn là khách hàng, giao dịch sẽ cần được quản
          lý xác nhận.
        </p>
      )}
    </div>
  );
};
