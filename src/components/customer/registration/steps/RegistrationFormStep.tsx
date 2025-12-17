import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { User, Package, Calendar, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
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
  branchId?: string;
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
  packageType,
  branchId
}) => {
  const { t } = useTranslation();
  const [trainerPopoverOpen, setTrainerPopoverOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);

  const selectedStartDate = useMemo(() => {
    if (!formData.startDate) return undefined;
    const date = new Date(`${formData.startDate}T00:00:00`);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }, [formData.startDate]);

  const handleStartDateChange = (date?: Date) => {
    if (date) {
      setFormData((prev) => ({ ...prev, startDate: format(date, 'yyyy-MM-dd') }));
      setStartDateOpen(false);
    }
  };

  // Get selected trainer name for display
  const selectedTrainer = trainers.find((trainer) => trainer.userId._id === formData.primaryTrainerId);

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
                          {pkg.name} - {formatCurrency(pkg.defaultPriceVND || 0)} ({pkg.sessionCount || 0}{' '}
                          {t('pt_registration.sessions')})
                        </>
                      ) : (
                        <div className="flex flex-col">
                          <span>
                            {pkg.name} - {formatCurrency(pkg.defaultPriceVND || 0)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {pkg.sessionCount || 0} {t('class_registration.sessions')} | {pkg.minParticipants}-
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

            {/* Trainer Selection - PT only */}
            {packageType === 'PT' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('pt_registration.trainer_label')}</Label>
                <Popover open={trainerPopoverOpen} onOpenChange={setTrainerPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={trainerPopoverOpen}
                      className="w-full justify-between font-normal"
                      type="button"
                    >
                      {selectedTrainer ? (
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span>{selectedTrainer.userId.fullName || t('pt_registration.unknown')}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{t('pt_registration.trainer_placeholder')}</span>
                      )}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 z-[200]" align="start" sideOffset={4}>
                    <Command>
                      <CommandInput placeholder={t('class.form.search_trainers')} />
                      <CommandList>
                        <CommandEmpty>{t('class.form.no_trainers_found')}</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                          {trainers
                            .filter((trainer) => trainer.userId)
                            .map((trainer) => (
                              <CommandItem
                                key={trainer._id}
                                value={trainer.userId.fullName || ''}
                                onSelect={() => {
                                  setFormData((prev) => ({ ...prev, primaryTrainerId: trainer.userId._id }));
                                  setTrainerPopoverOpen(false);
                                }}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3" />
                                  <span>{trainer.userId.fullName || t('pt_registration.unknown')}</span>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Start Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <Calendar className="inline h-4 w-4" />{' '}
                {t(`${packageType.toLowerCase()}_registration.start_date_label`)}
              </Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen} modal={false}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between text-left font-normal">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {selectedStartDate
                        ? format(selectedStartDate, 'dd/MM/yyyy', { locale: vi })
                        : t('membership_registration.activation_date_placeholder', {
                            defaultValue: 'Chọn ngày bắt đầu'
                          })}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto rounded-2xl border border-border bg-white p-0 shadow-lg z-[9999]"
                  align="start"
                  side="bottom"
                  sideOffset={8}
                  collisionPadding={8}
                >
                  <CalendarComponent
                    mode="single"
                    selected={selectedStartDate}
                    onSelect={handleStartDateChange}
                    initialFocus
                    locale={vi}
                    className="bg-white"
                  />
                </PopoverContent>
              </Popover>
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
              branchId={branchId}
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
