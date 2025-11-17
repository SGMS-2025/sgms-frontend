import { useState, useMemo, useEffect } from 'react';
import type { ServicePackage } from '@/types/api/Package';
import type { DiscountCampaign } from '@/types/api/Discount';

export interface ServiceRegistrationFormData {
  servicePackageId: string;
  customMonths?: number;
  startDate: string;
  branchId: string;
  discountCampaignId?: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  referrerStaffId?: string;
  notes?: string;
  // PT specific fields (optional)
  sessionCount?: number;
  primaryTrainerId?: string;
}

export interface PriceCalculation {
  basePrice: number;
  discountPercent: number;
  discountAmount: number;
  totalPrice: number;
}

export interface UseServiceRegistrationReturn {
  formData: ServiceRegistrationFormData;
  setFormData: React.Dispatch<React.SetStateAction<ServiceRegistrationFormData>>;
  selectedPackage: ServicePackage | null;
  setSelectedPackage: React.Dispatch<React.SetStateAction<ServicePackage | null>>;
  selectedPromotion: DiscountCampaign | null;
  setSelectedPromotion: React.Dispatch<React.SetStateAction<DiscountCampaign | null>>;
  priceCalculation: PriceCalculation;
  handlePackageChange: (packageId: string, packages: ServicePackage[]) => void;
  handlePromotionChange: (promotionId: string | undefined, promotions: DiscountCampaign[]) => void;
}

export const useServiceRegistration = (
  initialBranchId: string,
  initialFormData?: Partial<ServiceRegistrationFormData>
): UseServiceRegistrationReturn => {
  const [formData, setFormData] = useState<ServiceRegistrationFormData>({
    servicePackageId: '',
    customMonths: undefined,
    startDate: new Date().toISOString().split('T')[0],
    branchId: initialBranchId,
    discountCampaignId: undefined,
    paymentMethod: 'CASH',
    referrerStaffId: undefined,
    notes: '',
    ...initialFormData
  });

  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<DiscountCampaign | null>(null);

  // Price calculation
  const priceCalculation = useMemo((): PriceCalculation => {
    const basePrice = selectedPackage?.defaultPriceVND || 0;
    const discountPercent = selectedPromotion?.discountPercentage || 0;
    const discountAmount = (basePrice * discountPercent) / 100;
    const totalPrice = basePrice - discountAmount;

    return {
      basePrice,
      discountPercent,
      discountAmount,
      totalPrice
    };
  }, [selectedPackage, selectedPromotion]);

  // Automatically sync initialPaidAmount with totalPrice when totalPrice changes
  // Only update when a package is selected to avoid setting 0 on initial load
  useEffect(() => {
    if (selectedPackage) {
      setFormData((prev) => ({
        ...prev,
        initialPaidAmount: priceCalculation.totalPrice
      }));
    }
  }, [priceCalculation.totalPrice, selectedPackage]);

  // Handle package selection
  const handlePackageChange = (packageId: string, packages: ServicePackage[]) => {
    const pkg = packages.find((p) => p._id === packageId);
    setSelectedPackage(pkg || null);
    setFormData((prev) => ({
      ...prev,
      servicePackageId: packageId,
      customMonths: pkg?.defaultDurationMonths,
      sessionCount: pkg?.sessionCount
    }));
  };

  // Handle promotion selection
  const handlePromotionChange = (promotionId: string | undefined, promotions: DiscountCampaign[]) => {
    if (!promotionId || promotionId === 'none') {
      setSelectedPromotion(null);
      setFormData((prev) => ({ ...prev, discountCampaignId: undefined }));
    } else {
      const promo = promotions.find((p) => p._id === promotionId);
      setSelectedPromotion(promo || null);
      setFormData((prev) => ({ ...prev, discountCampaignId: promotionId }));
    }
  };

  return {
    formData,
    setFormData,
    selectedPackage,
    setSelectedPackage,
    selectedPromotion,
    setSelectedPromotion,
    priceCalculation,
    handlePackageChange,
    handlePromotionChange
  };
};
