import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, Package, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/utils/currency';
import type { ServiceRegistrationFormData, PriceCalculation } from '@/hooks/useServiceRegistration';
import type { ServicePackage } from '@/types/api/Package';
import type { DiscountCampaign } from '@/types/api/Discount';
import type { Staff } from '@/types/api/Staff';
import { PromotionSelector } from '../shared/PromotionSelector';
import { PriceSummaryCard } from '../shared/PriceSummaryCard';
import { PaymentMethodSelector } from '../shared/PaymentMethodSelector';
import { NotesField } from '../shared/NotesField';

interface RegistrationFormStepProps {
  formData: ServiceRegistrationFormData;
  setFormData: React.Dispatch<React.SetStateAction<ServiceRegistrationFormData>>;
  packages: ServicePackage[];
  promotions: DiscountCampaign[];
  trainers: Staff[];
  priceCalculation: PriceCalculation;
  handlePackageChange: (packageId: string, packages: ServicePackage[]) => void;
  handlePromotionChange: (promotionId: string | undefined, promotions: DiscountCampaign[]) => void;
  packageType: 'PT' | 'CLASS';
}

export const RegistrationFormStep: React.FC<RegistrationFormStepProps> = ({
  formData,
  setFormData,
  packages,
  promotions,
  trainers,
  priceCalculation,
  handlePackageChange,
  handlePromotionChange,
  packageType
}) => {
  const { t } = useTranslation();

  return (
    <Card className="rounded-3xl border border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-5 w-5 text-primary" />
          {t(`${packageType.toLowerCase()}_registration.registration_info`)}
        </CardTitle>
        <CardDescription>{t(`${packageType.toLowerCase()}_registration.description`)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4">
            {/* Package Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t(`${packageType.toLowerCase()}_registration.package_label`)}
              </Label>
              <Select value={formData.servicePackageId} onValueChange={(value) => handlePackageChange(value, packages)}>
                <SelectTrigger>
                  <SelectValue placeholder={t(`${packageType.toLowerCase()}_registration.package_placeholder`)} />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg._id} value={pkg._id}>
                      {packageType === 'PT' ? (
                        <>
                          {pkg.name} - {formatCurrency(pkg.defaultPriceVND || 0)} ({pkg.defaultDurationMonths}{' '}
                          {t('pt_registration.month')})
                        </>
                      ) : (
                        <div className="flex flex-col">
                          <span>
                            {pkg.name} - {formatCurrency(pkg.defaultPriceVND || 0)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {pkg.defaultDurationMonths} {t('class_registration.month')} | {pkg.minParticipants}-
                            {pkg.maxParticipants || t('class_registration.many')} {t('class_registration.people')}
                          </span>
                        </div>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Session Count - PT only */}
            {packageType === 'PT' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('pt_registration.session_count_label')}</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.sessionCount || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sessionCount: Number.parseInt(e.target.value, 10) || undefined }))
                  }
                  placeholder={t('pt_registration.session_count_placeholder')}
                />
              </div>
            )}

            {/* Duration */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t(`${packageType.toLowerCase()}_registration.duration_label`)}
              </Label>
              <Input
                type="number"
                min="1"
                value={formData.customMonths || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, customMonths: Number.parseInt(e.target.value, 10) || undefined }))
                }
                placeholder={t(`${packageType.toLowerCase()}_registration.duration_placeholder`)}
              />
            </div>

            {/* Trainer Selection - PT only */}
            {packageType === 'PT' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('pt_registration.trainer_label')}</Label>
                <Select
                  value={formData.primaryTrainerId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, primaryTrainerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('pt_registration.trainer_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {trainers.map((trainer) => (
                      <SelectItem key={trainer._id} value={trainer.userId._id}>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          {trainer.userId.fullName || t('pt_registration.unknown')}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Start Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <Calendar className="inline h-4 w-4" />{' '}
                {t(`${packageType.toLowerCase()}_registration.start_date_label`)}
              </Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            {/* Promotion Selector */}
            <PromotionSelector
              promotions={promotions}
              selectedId={formData.discountCampaignId}
              onChange={(value) => handlePromotionChange(value === 'none' ? undefined : value, promotions)}
            />

            {/* Price Summary */}
            <PriceSummaryCard
              basePrice={priceCalculation.basePrice}
              discountAmount={priceCalculation.discountAmount}
              totalPrice={priceCalculation.totalPrice}
            />

            {/* Payment Method */}
            <PaymentMethodSelector
              value={formData.paymentMethod}
              onChange={(value) => setFormData((prev) => ({ ...prev, paymentMethod: value }))}
            />
          </div>
        </div>

        {/* Notes */}
        <NotesField
          value={formData.notes || ''}
          onChange={(value) => setFormData((prev) => ({ ...prev, notes: value }))}
        />
      </CardContent>
    </Card>
  );
};
