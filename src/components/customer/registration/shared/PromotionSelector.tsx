import React from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DiscountCampaign } from '@/types/api/Discount';

interface PromotionSelectorProps {
  promotions: DiscountCampaign[];
  selectedId: string | undefined;
  onChange: (value: string) => void;
}

export const PromotionSelector: React.FC<PromotionSelectorProps> = ({ promotions, selectedId, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{t('shared_form.promotion_label')}</Label>
      <Select value={selectedId || 'none'} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('shared_form.promotion_placeholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t('shared_form.promotion_none')}</SelectItem>
          {promotions.map((promo) => (
            <SelectItem key={promo._id} value={promo._id}>
              {promo.campaignName} (-{promo.discountPercentage}%)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
