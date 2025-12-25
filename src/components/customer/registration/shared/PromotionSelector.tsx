import React from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DiscountCampaign } from '@/types/api/Discount';

interface PromotionSelectorProps {
  promotions: DiscountCampaign[];
  selectedId: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  selectedPackageId?: string;
}

export const PromotionSelector: React.FC<PromotionSelectorProps> = ({
  promotions,
  selectedId,
  onChange,
  disabled = false,
  selectedPackageId
}) => {
  const { t } = useTranslation();

  // Filter promotions applicable to the selected package
  const applicablePromotions = React.useMemo(() => {
    if (!selectedPackageId) return [];

    return promotions.filter((promo) => {
      // If promotion has no packageId array, it applies to all
      if (!promo.packageId || promo.packageId.length === 0) {
        return true;
      }
      // Check if selected package is in the promotion's applicable packages
      return promo.packageId.some((pkgId) => {
        // Handle both string and object format
        const id = typeof pkgId === 'string' ? pkgId : pkgId._id;
        return id === selectedPackageId;
      });
    });
  }, [promotions, selectedPackageId]);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{t('shared_form.promotion_label')}</Label>
      <Select value={selectedId || 'none'} onValueChange={onChange} disabled={disabled || !selectedPackageId}>
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={
              disabled || !selectedPackageId
                ? t('shared_form.promotion_select_package_first') || 'Chọn gói dịch vụ trước'
                : t('shared_form.promotion_placeholder')
            }
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t('shared_form.promotion_none')}</SelectItem>
          {applicablePromotions.map((promo) => (
            <SelectItem key={promo._id} value={promo._id}>
              {promo.campaignName} (-{promo.discountPercentage}%)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
