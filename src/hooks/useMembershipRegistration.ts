import { useState, useMemo, useCallback } from 'react';
import type { MembershipRegistrationFormData } from '@/types/api/Customer';

export interface PriceCalculation {
  basePrice: number;
  discountPercent: number;
  discountAmount: number;
  totalPrice: number;
}

export interface UseMembershipRegistrationReturn {
  formData: MembershipRegistrationFormData;
  setFormData: React.Dispatch<React.SetStateAction<MembershipRegistrationFormData>>;
  priceCalculation: PriceCalculation;
  handlePlanChange: (planId: string) => void;
  handlePromotionChange: (promotionId: string | undefined) => void;
}

export function useMembershipRegistration(branchId: string): UseMembershipRegistrationReturn {
  const [formData, setFormData] = useState<MembershipRegistrationFormData>({
    membershipPlanId: '',
    branchId: branchId,
    cardCode: '',
    startDate: new Date().toISOString().split('T')[0],
    discountCampaignId: undefined,
    paymentMethod: 'CASH' as 'CASH' | 'BANK_TRANSFER' | 'QR_BANK',
    referrerStaffId: undefined,
    notes: ''
  });

  // Price calculation - will be computed based on selected plan and promotion
  // This is a placeholder - actual calculation should be done in the component with selected plan data
  const priceCalculation = useMemo<PriceCalculation>(() => {
    // This will be calculated in the component where we have access to the selected plan
    return {
      basePrice: 0,
      discountPercent: 0,
      discountAmount: 0,
      totalPrice: 0
    };
  }, []);

  const handlePlanChange = useCallback((planId: string) => {
    setFormData((prev) => ({
      ...prev,
      membershipPlanId: planId
    }));
  }, []);

  const handlePromotionChange = useCallback((promotionId: string | undefined) => {
    if (promotionId) {
      setFormData((prev) => ({
        ...prev,
        discountCampaignId: promotionId
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        discountCampaignId: undefined
      }));
    }
  }, []);

  return {
    formData,
    setFormData,
    priceCalculation,
    handlePlanChange,
    handlePromotionChange
  };
}
