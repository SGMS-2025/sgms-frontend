import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { User, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useBranch } from '@/contexts/BranchContext';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
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
import SelectTemplateDialog from '@/components/contracts/SelectTemplateDialog';
import PostPurchaseContractDialog from '@/components/contracts/PostPurchaseContractDialog';
import EmbeddedDocumentViewer from '@/components/contracts/EmbeddedDocumentViewer';
import { contractDocumentApi } from '@/services/api/contractDocumentApi';
import type { ContractDocument } from '@/types/api/ContractDocument';
import type { ServiceContractResponse } from '@/types/api/Package';

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
  const { currentStaff } = useCurrentUserStaff(); // Get current staff if logged in as staff

  // Contract workflow states
  const [showSelectTemplateDialog, setShowSelectTemplateDialog] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [showPostPurchaseDialog, setShowPostPurchaseDialog] = useState(false);
  const [createdContractDocument, setCreatedContractDocument] = useState<ContractDocument | null>(null);
  const [showSendingViewer, setShowSendingViewer] = useState(false);
  const [sendingIframeUrl, setSendingIframeUrl] = useState<string | null>(null);
  const [pendingContractResponse, setPendingContractResponse] = useState<ServiceContractResponse | null>(null);

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

  // Custom onSuccess handler to show template selection dialog
  const handleRegistrationSuccess = (response?: ServiceContractResponse) => {
    if (!response?.success || !response?.data) {
      toast.error('Có lỗi khi tạo hợp đồng');
      return;
    }

    const contract = response.data;
    const contractId = contract._id;

    if (contractId) {
      // Show template selection dialog after successful contract creation
      setSelectedContractId(contractId);
      setShowSelectTemplateDialog(true);
    } else {
      toast.error('Không thể lấy ID hợp đồng');
    }
  };

  // PayOS payment handling with post-purchase flow
  const handlePaymentSuccessWithContract = () => {
    toast.success('Thanh toán thành công!');

    // After successful payment, show template selection dialog if we have pending contract
    if (pendingContractResponse) {
      handleRegistrationSuccess(pendingContractResponse);
      setPendingContractResponse(null);
    } else if (createdContractDocument) {
      setShowPostPurchaseDialog(true);
    } else {
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    }
  };

  // Auto-set referrerStaffId if current user is PT (Personal Trainer)
  // Only PT can receive KPI attribution, so only auto-select if current staff is PT
  useEffect(() => {
    if (currentStaff && currentStaff.userId?._id && currentStaff.jobTitle === 'Personal Trainer') {
      setFormData((prev) => ({
        ...prev,
        referrerStaffId: currentStaff.userId._id
      }));
    }
  }, [currentStaff, setFormData]);

  // PayOS payment handling
  const { showPayOSModal, payOSData, createdContractId, handlePayOSPayment, handlePaymentSuccess, handleModalClose } =
    usePayOSPayment({
      customerId,
      branchId: formData.branchId,
      totalPrice: priceCalculation.totalPrice,
      initialPaidAmount: formData.initialPaidAmount,
      packageDescription: t('pt_registration.package_description'),
      onSuccess: handlePaymentSuccessWithContract,
      onClose
    });

  // Wrapper to handle payment required with contract response
  const handlePaymentRequiredWithResponse = (contractId: string, response: ServiceContractResponse) => {
    // Save the contract response for after payment
    setPendingContractResponse(response);
    // Trigger PayOS payment flow
    handlePayOSPayment(contractId);
  };

  // Submit handling with contract document capture
  const { loading, handleSubmit } = useServiceRegistrationSubmit({
    customerId,
    packageTypeName: t('pt_registration.package_type_name'),
    onSuccess: handleRegistrationSuccess,
    onClose,
    onPaymentRequired: handlePaymentRequiredWithResponse
  });

  const handleSendNow = async () => {
    if (!createdContractDocument) return;

    const response = await contractDocumentApi.createEmbeddedSending(createdContractDocument._id, {
      type: 'invite',
      redirectUrl: `${window.location.origin}/manage/contracts`
    });

    if (response.success && response.data?.link) {
      setSendingIframeUrl(response.data.link);
      setShowSendingViewer(true);
    } else {
      toast.error('Không thể tạo link gửi hợp đồng');
    }
  };

  const handleTemplateSelected = (contractDocument: ContractDocument) => {
    setCreatedContractDocument(contractDocument);
    setShowSelectTemplateDialog(false);
    setShowPostPurchaseDialog(true);
  };

  const handleSkipTemplateSelection = () => {
    setShowSelectTemplateDialog(false);
    toast.info('Bạn có thể tạo hợp đồng sau trong trang Quản lý hợp đồng');
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 500);
  };

  const handleSendLater = () => {
    toast.info('Bạn có thể gửi hợp đồng sau trong trang Quản lý hợp đồng');
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 500);
  };

  const handleSendingViewerClose = () => {
    setShowSendingViewer(false);
    setSendingIframeUrl(null);
    toast.success('Hợp đồng đã được gửi đi!');
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 500);
  };

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

      {/* Template Selection Dialog */}
      {selectedContractId && currentBranch?._id && (
        <SelectTemplateDialog
          open={showSelectTemplateDialog}
          onOpenChange={setShowSelectTemplateDialog}
          contractType="service_pt"
          branchId={currentBranch._id}
          customerId={customerId}
          contractId={selectedContractId}
          onTemplateSelected={handleTemplateSelected}
          onSkip={handleSkipTemplateSelection}
        />
      )}

      {/* Post-Purchase Contract Dialog */}
      <PostPurchaseContractDialog
        open={showPostPurchaseDialog}
        onOpenChange={setShowPostPurchaseDialog}
        contractDocument={createdContractDocument}
        onSendNow={handleSendNow}
        onSendLater={handleSendLater}
      />

      {/* Embedded Sending Viewer */}
      <EmbeddedDocumentViewer
        open={showSendingViewer}
        onOpenChange={setShowSendingViewer}
        documentTitle={createdContractDocument?.title || 'Contract Document'}
        mode="sending"
        iframeUrl={sendingIframeUrl}
        onClose={handleSendingViewerClose}
      />
    </Dialog>
  );
};
