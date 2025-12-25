import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, CreditCard, User } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatCurrency } from '@/utils/currency';
import type { MembershipRegistrationFormData } from '@/types/api/Customer';
import type { MembershipPlan } from '@/types/api/Membership';
import type { DiscountCampaign } from '@/types/api/Discount';
import type { Staff } from '@/types/api/Staff';
import { PriceSummaryCard } from '../shared/PriceSummaryCard';
import { PaymentMethodSelector } from '../shared/PaymentMethodSelector';
import { NotesField } from '../shared/NotesField';

interface MembershipFormStepProps {
  formData: MembershipRegistrationFormData;
  setFormData: React.Dispatch<React.SetStateAction<MembershipRegistrationFormData>>;
  plans: MembershipPlan[];
  promotions: DiscountCampaign[];
  staffList: Staff[];
  selectedPlan: MembershipPlan | null;
  priceCalculation: {
    basePrice: number;
    discountPercent: number;
    discountAmount: number;
    totalPrice: number;
  };
  handlePlanChange: (planId: string) => void;
  handlePromotionChange: (promotionId: string | undefined) => void;
  currentStaff?: Staff | null;
  loadingStaff?: boolean;
  branchId?: string;
}

export const MembershipFormStep: React.FC<MembershipFormStepProps> = ({
  formData,
  setFormData,
  plans,
  staffList,
  selectedPlan,
  priceCalculation,
  handlePlanChange,
  currentStaff,
  loadingStaff = false,
  branchId
}) => {
  const { t } = useTranslation();
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);

  const selectedActivationDate = React.useMemo(
    () => (formData.startDate ? new Date(`${formData.startDate}T00:00:00`) : undefined),
    [formData.startDate]
  );

  const handleActivationDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, startDate: format(date, 'yyyy-MM-dd') }));
      setDatePickerOpen(false);
    } else {
      setFormData((prev) => ({ ...prev, startDate: '' }));
    }
  };

  return (
    <Card className="w-full rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-5 w-5 text-primary" />
          {t('membership_registration.registration_info')}
        </CardTitle>
        <CardDescription>{t('membership_registration.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('membership_registration.plan_label')}</Label>
              <Select
                value={formData.membershipPlanId}
                onValueChange={(value) => {
                  handlePlanChange(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('membership_registration.plan_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan._id} value={plan._id}>
                      <div className="flex flex-col">
                        <span>
                          {plan.name} - {formatCurrency(plan.price)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {plan.durationInMonths} {t('membership_registration.month')}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPlan?.description && <p className="text-xs text-muted-foreground">{selectedPlan.description}</p>}
              {selectedPlan?.benefits && selectedPlan.benefits.length > 0 && (
                <div className="rounded-2xl border border-border bg-muted/20 p-3">
                  <p className="text-xs font-semibold mb-2">{t('membership_registration.benefits_label')}</p>
                  <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                    {selectedPlan.benefits.map((benefit, idx) => (
                      <li key={idx}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <CreditCard className="inline h-4 w-4" /> {t('membership_registration.card_code_label')}
              </Label>
              <Input
                value={formData.cardCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, cardCode: e.target.value }))}
                placeholder={t('membership_registration.card_code_placeholder')}
              />
              <p className="text-xs text-muted-foreground">{t('membership_registration.card_code_helper')}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <Calendar className="inline h-4 w-4" /> {t('membership_registration.activation_date_label')}
              </Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen} modal={false}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between text-left font-normal">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {selectedActivationDate
                        ? format(selectedActivationDate, 'dd/MM/yyyy', { locale: vi })
                        : t('membership_registration.activation_date_placeholder', {
                            defaultValue: 'Chọn ngày kích hoạt'
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
                    selected={selectedActivationDate}
                    onSelect={handleActivationDateChange}
                    initialFocus
                    locale={vi}
                    className="bg-white"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-4">
            {/* Promotion field hidden for membership */}
            {/* <div className="space-y-2">
              <Label className="text-sm font-medium">{t('membership_registration.promotion_label')}</Label>
              <Select
                value={formData.discountCampaignId || 'none'}
                onValueChange={(value) => {
                  if (value === 'none') {
                    handlePromotionChange(undefined);
                  } else {
                    handlePromotionChange(value);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('membership_registration.promotion_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('membership_registration.promotion_none')}</SelectItem>
                  {promotions.map((promo) => (
                    <SelectItem key={promo._id} value={promo._id}>
                      {promo.campaignName} (-{promo.discountPercentage}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            {/* Staff/PT Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" /> {t('membership_registration.referrer_staff_label')}
              </Label>
              <Select
                value={formData.referrerStaffId || 'none'}
                onValueChange={(value) => {
                  if (value === 'none') {
                    setFormData((prev) => ({ ...prev, referrerStaffId: undefined }));
                  } else {
                    setFormData((prev) => ({ ...prev, referrerStaffId: value }));
                  }
                }}
                disabled={loadingStaff}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('membership_registration.referrer_staff_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('membership_registration.referrer_staff_none')}</SelectItem>
                  {staffList
                    .filter((staff) => staff.userId?._id)
                    .map((staff) => (
                      <SelectItem key={staff._id} value={staff.userId._id}>
                        {staff.userId?.fullName || staff.userId?.username} ({staff.jobTitle})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {currentStaff && currentStaff.jobTitle === 'Personal Trainer' && (
                <p className="text-xs text-blue-600">
                  {t('membership_registration.referrer_staff_auto_selected', {
                    name: currentStaff.userId?.fullName
                  })}
                </p>
              )}
              {currentStaff && currentStaff.jobTitle !== 'Personal Trainer' && (
                <p className="text-xs text-muted-foreground">
                  {t('membership_registration.referrer_staff_not_pt', {
                    jobTitle: currentStaff.jobTitle
                  })}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{t('membership_registration.referrer_staff_helper')}</p>
            </div>

            <PaymentMethodSelector
              value={formData.paymentMethod}
              onChange={(value) => setFormData((prev) => ({ ...prev, paymentMethod: value }))}
              branchId={branchId}
            />

            {selectedPlan && (
              <div className="flex justify-between items-center text-blue-600 text-xs">
                <span>{t('membership_registration.duration')}</span>
                <span className="font-semibold">
                  {selectedPlan.durationInMonths} {t('membership_registration.month')}
                </span>
              </div>
            )}
          </div>
        </div>

        <NotesField
          value={formData.notes || ''}
          onChange={(value) => setFormData((prev) => ({ ...prev, notes: value }))}
        />

        <PriceSummaryCard
          basePrice={priceCalculation.basePrice}
          discountAmount={priceCalculation.discountAmount}
          totalPrice={priceCalculation.totalPrice}
        />
      </CardContent>
    </Card>
  );
};
