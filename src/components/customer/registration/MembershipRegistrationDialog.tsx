import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Calendar, CreditCard, FileText, MapPin, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useBranch } from '@/contexts/BranchContext';
import { membershipApi } from '@/services/api/membershipApi';
import { discountCampaignApi } from '@/services/api/discountApi';
import { paymentApi, type PayOSPaymentData } from '@/services/api/paymentApi';
import { contractDocumentApi } from '@/services/api/contractDocumentApi';
import { PayOSPaymentModal } from '@/components/modals/PayOSPaymentModal';
import PostPurchaseContractDialog from '@/components/contracts/PostPurchaseContractDialog';
import EmbeddedDocumentViewer from '@/components/contracts/EmbeddedDocumentViewer';
import type { MembershipPlan } from '@/types/api/Membership';
import type { MembershipRegistrationFormData, MembershipContractResponse } from '@/types/api/Customer';
import type { DiscountCampaign } from '@/types/api/Discount';
import type { ContractDocument } from '@/types/api/ContractDocument';
import { staffApi } from '@/services/api/staffApi';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import type { Staff } from '@/types/api/Staff';

interface MembershipRegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  onSuccess?: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value);
};

export const MembershipRegistrationDialog: React.FC<MembershipRegistrationDialogProps> = ({
  isOpen,
  onClose,
  customerId,
  onSuccess
}) => {
  const { t } = useTranslation();
  const { currentBranch, branches } = useBranch();
  const { currentStaff } = useCurrentUserStaff(); // CASE 2: Get current staff if logged in as staff
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [promotions, setPromotions] = useState<DiscountCampaign[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]); // CASE 2: Staff list for selector
  const [loadingStaff, setLoadingStaff] = useState(false);

  // PayOS states
  const [showPayOSModal, setShowPayOSModal] = useState(false);
  const [payOSData, setPayOSData] = useState<PayOSPaymentData | null>(null);
  const [createdContractId, setCreatedContractId] = useState<string | null>(null);

  // Post-purchase contract states
  const [showPostPurchaseDialog, setShowPostPurchaseDialog] = useState(false);
  const [createdContractDocument, setCreatedContractDocument] = useState<ContractDocument | null>(null);
  const [showSendingViewer, setShowSendingViewer] = useState(false);
  const [sendingIframeUrl, setSendingIframeUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<MembershipRegistrationFormData>({
    membershipPlanId: '',
    branchId: currentBranch?._id || '',
    cardCode: '',
    startDate: new Date().toISOString().split('T')[0],
    discountCampaignId: undefined,
    paymentMethod: 'CASH',
    referrerStaffId: undefined,
    notes: ''
  });

  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<DiscountCampaign | null>(null);

  const basePrice = selectedPlan?.price || 0;
  const discountPercent = selectedPromotion?.discountPercentage || 0;
  const discountAmount = (basePrice * discountPercent) / 100;
  const totalPrice = basePrice - discountAmount;

  useEffect(() => {
    // No need to set initialPaidAmount anymore
  }, [totalPrice, selectedPlan]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      if (!currentBranch?._id) return;

      const [plansRes, promotionsRes] = await Promise.all([
        membershipApi.getMembershipPlans({ page: 1, limit: 100, status: 'ACTIVE' }, [currentBranch._id]),
        discountCampaignApi.getActiveCampaignsByBranch(currentBranch._id)
      ]);

      if (plansRes.success && plansRes.data) {
        setPlans(plansRes.data.plans || []);
      }

      if (promotionsRes.success && promotionsRes.data) {
        setPromotions(promotionsRes.data);
      }
    };

    fetchData();
  }, [isOpen, currentBranch?._id]);

  // CASE 2: Fetch staff list when branch changes
  useEffect(() => {
    if (!isOpen || !formData.branchId) return;

    const fetchStaffList = async () => {
      setLoadingStaff(true);
      try {
        const response = await staffApi.getStaffListByBranch(formData.branchId, {
          limit: 100,
          jobTitle: 'Personal Trainer' // Only show PT for KPI
        });
        if (response.success && response.data) {
          setStaffList(response.data);
        }
      } catch (error) {
        console.error('Error fetching staff list:', error);
      } finally {
        setLoadingStaff(false);
      }
    };

    fetchStaffList();
  }, [isOpen, formData.branchId]);

  // CASE 2: Auto-set referrerStaffId if current user is PT (Personal Trainer)
  // Only PT can receive KPI attribution, so only auto-select if current staff is PT
  useEffect(() => {
    if (currentStaff && currentStaff.userId?._id && currentStaff.jobTitle === 'Personal Trainer') {
      setFormData((prev) => ({
        ...prev,
        referrerStaffId: currentStaff.userId._id
      }));
    }
  }, [currentStaff]);

  const handlePayOSPayment = (contractId: string) => {
    const paymentAmount = Math.max(totalPrice, 1000);

    paymentApi
      .createPayOSPaymentLink({
        customerId: customerId,
        branchId: formData.branchId,
        contractId: contractId,
        contractType: 'membership',
        amount: paymentAmount,
        description: t('membership_registration.package_description')
      })
      .then((paymentResponse) => {
        if (paymentResponse.success) {
          setCreatedContractId(contractId);
          setPayOSData(paymentResponse.data);
          setShowPayOSModal(true);
          toast.success(t('membership_registration.success_with_payment'));
        } else {
          handleRegistrationSuccess();
        }
      })
      .catch((paymentError) => {
        console.error('Error creating PayOS payment:', paymentError);
        toast.warning(t('membership_registration.warning_payos_failed'));
        handleRegistrationSuccess();
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleRegistrationSuccess = () => {
    toast.success(t('membership_registration.success'));
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 500);
  };

  const handleContractCreated = (response: MembershipContractResponse) => {
    if (!response.success) {
      toast.error(response.message || t('membership_registration.error_register_failed'));
      setLoading(false);
      return;
    }

    const contract = response.data?.contract;
    const contractDocument = response.data?.contractDocument;
    const contractId = contract?._id;

    // Store contract document for post-purchase flow
    if (contractDocument) {
      setCreatedContractDocument(contractDocument);
    } else {
      // Warn if no template was found
      toast.info('Hợp đồng đã tạo nhưng chưa có template. Vui lòng tạo hợp đồng thủ công sau.');
    }

    // Note: KPI update will be triggered automatically by backend via Socket.IO
    // when transaction attribution is created and KPI is recalculated

    if (formData.paymentMethod === 'BANK_TRANSFER' && contractId) {
      handlePayOSPayment(contractId);
    } else {
      // Show post-purchase dialog if contract document exists
      if (contractDocument) {
        setLoading(false);
        setShowPostPurchaseDialog(true);
      } else {
        handleRegistrationSuccess();
        setLoading(false);
      }
    }
  };

  const handleSubmit = () => {
    if (!formData.membershipPlanId) {
      toast.error(t('membership_registration.error_select_plan'));
      return;
    }

    if (!formData.branchId) {
      toast.error(t('membership_registration.error_select_branch'));
      return;
    }

    setLoading(true);

    membershipApi
      .createMembershipContract(customerId, formData)
      .then(handleContractCreated)
      .catch(() => {
        toast.error(t('membership_registration.error_register'));
        setLoading(false);
      });
  };

  const handlePaymentSuccess = () => {
    setShowPayOSModal(false);
    toast.success(t('membership_registration.payment_success'));

    // Show post-purchase dialog if contract document exists
    if (createdContractDocument) {
      setShowPostPurchaseDialog(true);
    } else {
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    }
  };

  const handleSendNow = async () => {
    if (!createdContractDocument) return;

    // Use callback page to handle redirect and prevent nested dashboard
    // Use 'document' type to allow editing fields before sending (same as ContractDocumentsTab)
    const redirectUrl = `${window.location.origin}/signnow/callback`;
    const response = await contractDocumentApi.createEmbeddedSending(createdContractDocument._id, {
      type: 'document', // 'document' allows editing fields before sending, 'invite' opens invite page directly
      redirectUrl,
      linkExpiration: 45, // Max 45 minutes (SignNow API limit for embedded-sending)
      redirectTarget: 'self' // Redirect in same iframe, but callback page will handle closing
    });

    if (response.success && response.data?.link) {
      setSendingIframeUrl(response.data.link);
      setShowSendingViewer(true);
    } else {
      toast.error('Không thể tạo link gửi hợp đồng');
    }
  };

  const handleSendLater = () => {
    toast.info('Bạn có thể gửi hợp đồng sau trong trang Quản lý hợp đồng');
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 500);
  };

  const handleSendingViewerClose = () => {
    // Prevent multiple calls (onSave and onClose both call this)
    if (!showSendingViewer) {
      return; // Already handled
    }

    // Close the viewer first
    setShowSendingViewer(false);
    setSendingIframeUrl(null);

    // Show success message immediately
    toast.success('Hợp đồng đã được gửi đi!');

    // Refresh document in background (non-blocking) to update signers info
    if (createdContractDocument) {
      // Fire and forget - refresh in background without blocking UI
      contractDocumentApi.refreshDocument(createdContractDocument._id).catch((error) => {
        console.error('Failed to refresh document:', error);
        // Silently fail - user already sees success
      });
    }

    // Close dialog and call success callback immediately (only once)
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('membership_registration.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="rounded-3xl border border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5 text-primary" />
                {t('membership_registration.registration_info')}
              </CardTitle>
              <CardDescription>{t('membership_registration.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('membership_registration.plan_label')}</Label>
                    <Select
                      value={formData.membershipPlanId}
                      onValueChange={(value) => {
                        const plan = plans.find((p) => p._id === value);
                        setSelectedPlan(plan || null);
                        setFormData((prev) => ({
                          ...prev,
                          membershipPlanId: value
                        }));
                      }}
                    >
                      <SelectTrigger>
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
                    {selectedPlan?.description && (
                      <p className="text-xs text-muted-foreground">{selectedPlan.description}</p>
                    )}
                    {selectedPlan?.benefits && selectedPlan.benefits.length > 0 && (
                      <div className="rounded-xl border border-border bg-muted/30 p-3">
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
                      <MapPin className="inline h-4 w-4" /> {t('membership_registration.branch_label')}
                    </Label>
                    <Select
                      value={formData.branchId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, branchId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('membership_registration.branch_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch._id} value={branch._id}>
                            {branch.branchName} - {branch.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('membership_registration.promotion_label')}</Label>
                    <Select
                      value={formData.discountCampaignId || 'none'}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          setSelectedPromotion(null);
                          setFormData((prev) => ({ ...prev, discountCampaignId: undefined }));
                        } else {
                          const promo = promotions.find((p) => p._id === value);
                          setSelectedPromotion(promo || null);
                          setFormData((prev) => ({ ...prev, discountCampaignId: value }));
                        }
                      }}
                    >
                      <SelectTrigger>
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
                  </div>

                  {/* CASE 2: Staff/PT Selector */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" /> PT/Staff hỗ trợ (tùy chọn)
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
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn PT/Staff" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không có</SelectItem>
                        {staffList
                          .filter((staff) => staff.userId?._id) // Only show staff with valid userId
                          .map((staff) => (
                            <SelectItem key={staff._id} value={staff.userId._id}>
                              {staff.userId?.fullName || staff.userId?.username} ({staff.jobTitle})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {currentStaff && currentStaff.jobTitle === 'Personal Trainer' && (
                      <p className="text-xs text-blue-600">Đã tự động chọn bạn (PT): {currentStaff.userId?.fullName}</p>
                    )}
                    {currentStaff && currentStaff.jobTitle !== 'Personal Trainer' && (
                      <p className="text-xs text-muted-foreground">
                        Bạn đang đăng nhập với tư cách: {currentStaff.jobTitle}. Vui lòng chọn PT để attribute KPI.
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Chọn PT/Staff hỗ trợ khách hàng mua để họ nhận được hoa hồng
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phương thức thanh toán</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value: 'CASH' | 'BANK_TRANSFER') =>
                        setFormData((prev) => ({ ...prev, paymentMethod: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">{t('membership_registration.payment_cash')}</SelectItem>
                        <SelectItem value="BANK_TRANSFER">{t('membership_registration.payment_transfer')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.paymentMethod === 'BANK_TRANSFER' && (
                      <p className="text-xs text-blue-600">{t('membership_registration.payment_transfer_note')}</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t('membership_registration.base_price')}</span>
                      <span className="text-sm font-semibold">{formatCurrency(basePrice)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <span className="text-sm">{t('membership_registration.discount')}</span>
                        <span className="text-sm font-semibold">-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-t border-border pt-3">
                      <span className="text-sm font-semibold">{t('membership_registration.total')}</span>
                      <span className="text-lg font-bold text-primary">{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center text-blue-600 text-xs">
                      <span>{t('membership_registration.duration')}</span>
                      <span className="font-semibold">
                        {selectedPlan?.durationInMonths || 0} {t('membership_registration.month')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  <FileText className="inline h-4 w-4" /> {t('membership_registration.notes_label')}
                </Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder={t('membership_registration.notes_placeholder')}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  {t('membership_registration.cancel')}
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? t('membership_registration.processing') : t('membership_registration.register')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>

      {/* PayOS Payment Modal */}
      {showPayOSModal && payOSData && createdContractId && (
        <PayOSPaymentModal
          isOpen={showPayOSModal}
          onClose={() => {
            setShowPayOSModal(false);
            setTimeout(() => {
              onSuccess?.();
              onClose();
            }, 500);
          }}
          paymentData={payOSData}
          onPaymentSuccess={handlePaymentSuccess}
          customerId={customerId}
          branchId={formData.branchId}
          contractId={createdContractId}
          contractType="membership"
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
        onSave={handleSendingViewerClose}
        // Don't pass onClose - onSave will handle everything to avoid double call
      />
    </Dialog>
  );
};
