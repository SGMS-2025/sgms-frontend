import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useBranch } from '@/contexts/BranchContext';
import { PayOSPaymentModal } from '@/components/modals/PayOSPaymentModal';
import { formatCurrency } from '@/utils/currency';
import { useServiceRegistration } from '@/hooks/useServiceRegistration';
import { useServiceRegistrationSubmit } from '@/hooks/useServiceRegistrationSubmit';
import { usePayOSPayment } from '@/hooks/usePayOSPayment';
import { useFetchRegistrationData } from '@/hooks/useFetchRegistrationData';
import { PriceSummaryCard } from './shared/PriceSummaryCard';
import { PromotionSelector } from './shared/PromotionSelector';
import { PaymentAmountInput } from './shared/PaymentAmountInput';
import { PaymentMethodSelector } from './shared/PaymentMethodSelector';
import { NotesField } from './shared/NotesField';
import { FormActions } from './shared/FormActions';

interface PTRegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  onSuccess?: () => void;
}

export const PTRegistrationDialog: React.FC<PTRegistrationDialogProps> = ({
  isOpen,
  onClose,
  customerId,
  onSuccess
}) => {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();

  // Fetch registration data (including trainers for PT)
  const { packages, promotions, trainers } = useFetchRegistrationData({
    isOpen,
    branchId: currentBranch?._id,
    packageType: 'PT',
    fetchTrainers: true
  });

  // Form state management
  const {
    formData,
    setFormData,
    selectedPackage: _selectedPackage,
    selectedPromotion: _selectedPromotion,
    priceCalculation,
    handlePackageChange,
    handlePromotionChange
  } = useServiceRegistration(currentBranch?._id || '');

  // PayOS payment handling
  const { showPayOSModal, payOSData, createdContractId, handlePayOSPayment, handlePaymentSuccess, handleModalClose } =
    usePayOSPayment({
      customerId,
      branchId: formData.branchId,
      totalPrice: priceCalculation.totalPrice,
      initialPaidAmount: formData.initialPaidAmount,
      packageDescription: t('pt_registration.package_description'),
      onSuccess,
      onClose
    });

  // Submit handling
  const { loading, handleSubmit } = useServiceRegistrationSubmit({
    customerId,
    packageTypeName: t('pt_registration.package_type_name'),
    onSuccess,
    onClose,
    onPaymentRequired: handlePayOSPayment
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('pt_registration.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="rounded-3xl border border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5 text-primary" />
                {t('pt_registration.registration_info')}
              </CardTitle>
              <CardDescription>{t('pt_registration.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-4">
                  {/* Package Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('pt_registration.package_label')}</Label>
                    <Select
                      value={formData.servicePackageId}
                      onValueChange={(value) => handlePackageChange(value, packages)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('pt_registration.package_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.map((pkg) => (
                          <SelectItem key={pkg._id} value={pkg._id}>
                            {pkg.name} - {formatCurrency(pkg.defaultPriceVND || 0)} ({pkg.defaultDurationMonths}{' '}
                            {t('pt_registration.month')})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Session Count */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('pt_registration.session_count_label')}</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.sessionCount || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, sessionCount: parseInt(e.target.value) || undefined }))
                      }
                      placeholder={t('pt_registration.session_count_placeholder')}
                    />
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('pt_registration.duration_label')}</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.customMonths || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, customMonths: parseInt(e.target.value) || undefined }))
                      }
                      placeholder={t('pt_registration.duration_placeholder')}
                    />
                  </div>

                  {/* Trainer Selection */}
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

                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('pt_registration.start_date_label')}</Label>
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

                  {/* Payment Amount */}
                  <PaymentAmountInput
                    value={formData.initialPaidAmount}
                    onChange={(value) => setFormData((prev) => ({ ...prev, initialPaidAmount: value }))}
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

              {/* Form Actions */}
              <FormActions onCancel={onClose} onSubmit={() => handleSubmit(formData)} loading={loading} />
            </CardContent>
          </Card>
        </div>
      </DialogContent>

      {/* PayOS Payment Modal */}
      {showPayOSModal && payOSData && createdContractId && (
        <PayOSPaymentModal
          isOpen={showPayOSModal}
          onClose={handleModalClose}
          paymentData={payOSData}
          onPaymentSuccess={handlePaymentSuccess}
          customerId={customerId}
          branchId={formData.branchId}
          contractId={createdContractId}
          contractType="service"
        />
      )}
    </Dialog>
  );
};
