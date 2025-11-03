import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Calendar, DollarSign, CreditCard, FileText, MapPin } from 'lucide-react';
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
import { PayOSPaymentModal } from '@/components/modals/PayOSPaymentModal';
import type { MembershipPlan } from '@/types/api/Membership';
import type { MembershipRegistrationFormData, MembershipContractResponse } from '@/types/api/Customer';
import type { DiscountCampaign } from '@/types/api/Discount';

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
  const { currentBranch, branches } = useBranch();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [promotions, setPromotions] = useState<DiscountCampaign[]>([]);

  // PayOS states
  const [showPayOSModal, setShowPayOSModal] = useState(false);
  const [payOSData, setPayOSData] = useState<PayOSPaymentData | null>(null);
  const [createdContractId, setCreatedContractId] = useState<string | null>(null);

  const [formData, setFormData] = useState<MembershipRegistrationFormData>({
    membershipPlanId: '',
    branchId: currentBranch?._id || '',
    cardCode: '',
    startDate: new Date().toISOString().split('T')[0],
    discountCampaignId: undefined,
    initialPaidAmount: 0,
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
  const remainingDebt = Math.max(0, totalPrice - formData.initialPaidAmount);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      if (!currentBranch?._id) return;

      try {
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
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [isOpen, currentBranch?._id]);

  const handlePayOSPayment = (contractId: string) => {
    const amountToPayment = totalPrice - formData.initialPaidAmount;
    const paymentAmount = amountToPayment > 0 ? amountToPayment : Math.max(totalPrice, 1000);

    paymentApi
      .createPayOSPaymentLink({
        customerId: customerId,
        branchId: formData.branchId,
        contractId: contractId,
        contractType: 'membership',
        amount: paymentAmount,
        description: `Goi hoi vien`
      })
      .then((paymentResponse) => {
        if (paymentResponse.success) {
          setCreatedContractId(contractId);
          setPayOSData(paymentResponse.data);
          setShowPayOSModal(true);
          toast.success('Đăng ký gói hội viên thành công! Vui lòng thanh toán.');
        } else {
          handleRegistrationSuccess();
        }
      })
      .catch((paymentError) => {
        console.error('Error creating PayOS payment:', paymentError);
        toast.warning('Đăng ký thành công nhưng không thể tạo link thanh toán PayOS');
        handleRegistrationSuccess();
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleRegistrationSuccess = () => {
    toast.success('Đăng ký gói hội viên thành công!');
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 500);
  };

  const handleContractCreated = (response: MembershipContractResponse) => {
    if (!response.success) {
      toast.error(response.message || 'Không thể đăng ký gói hội viên');
      setLoading(false);
      return;
    }

    const contractId = response.data?.contract._id;

    if (formData.paymentMethod === 'BANK_TRANSFER' && contractId) {
      handlePayOSPayment(contractId);
    } else {
      handleRegistrationSuccess();
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.membershipPlanId) {
      toast.error('Vui lòng chọn gói hội viên');
      return;
    }

    if (!formData.branchId) {
      toast.error('Vui lòng chọn chi nhánh');
      return;
    }

    setLoading(true);

    membershipApi
      .createMembershipContract(customerId, formData)
      .then(handleContractCreated)
      .catch(() => {
        toast.error('Có lỗi xảy ra khi đăng ký gói hội viên');
        setLoading(false);
      });
  };

  const handlePaymentSuccess = () => {
    setShowPayOSModal(false);
    toast.success('Thanh toán thành công!');
    // Delay to ensure backend has saved
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đăng ký gói hội viên (Membership)</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="rounded-3xl border border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5 text-primary" />
                Thông tin đăng ký
              </CardTitle>
              <CardDescription>Chọn gói hội viên, chi nhánh và thông tin thanh toán</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Gói hội viên *</Label>
                    <Select
                      value={formData.membershipPlanId}
                      onValueChange={(value) => {
                        const plan = plans.find((p) => p._id === value);
                        setSelectedPlan(plan || null);
                        setFormData((prev) => ({
                          ...prev,
                          membershipPlanId: value,
                          initialPaidAmount: plan?.price || 0
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn gói hội viên" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan._id} value={plan._id}>
                            <div className="flex flex-col">
                              <span>
                                {plan.name} - {formatCurrency(plan.price)}
                              </span>
                              <span className="text-xs text-muted-foreground">{plan.durationInMonths} tháng</span>
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
                        <p className="text-xs font-semibold mb-2">Quyền lợi:</p>
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
                      <MapPin className="inline h-4 w-4" /> Chi nhánh *
                    </Label>
                    <Select
                      value={formData.branchId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, branchId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn chi nhánh" />
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
                      <CreditCard className="inline h-4 w-4" /> Mã thẻ hội viên
                    </Label>
                    <Input
                      value={formData.cardCode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, cardCode: e.target.value }))}
                      placeholder="Nhập mã thẻ (tùy chọn)"
                    />
                    <p className="text-xs text-muted-foreground">Mã thẻ vật lý để truy cập vào phòng tập</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      <Calendar className="inline h-4 w-4" /> Ngày kích hoạt *
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
                    <Label className="text-sm font-medium">Khuyến mãi</Label>
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
                        <SelectValue placeholder="Chọn khuyến mãi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không áp dụng</SelectItem>
                        {promotions.map((promo) => (
                          <SelectItem key={promo._id} value={promo._id}>
                            {promo.campaignName} (-{promo.discountPercentage}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Giá gốc:</span>
                      <span className="text-sm font-semibold">{formatCurrency(basePrice)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <span className="text-sm">Giảm giá:</span>
                        <span className="text-sm font-semibold">-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-t border-border pt-3">
                      <span className="text-sm font-semibold">Tổng cộng:</span>
                      <span className="text-lg font-bold text-primary">{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center text-blue-600 text-xs">
                      <span>Thời hạn:</span>
                      <span className="font-semibold">{selectedPlan?.durationInMonths || 0} tháng</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      <DollarSign className="inline h-4 w-4" /> Số tiền thanh toán
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.initialPaidAmount}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, initialPaidAmount: parseFloat(e.target.value) || 0 }))
                      }
                      placeholder="Nhập số tiền"
                    />
                    <p className="text-xs text-muted-foreground">Gói hội viên thường yêu cầu thanh toán toàn bộ</p>
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
                        <SelectItem value="CASH">Tiền mặt</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Chuyển khoản (PayOS)</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.paymentMethod === 'BANK_TRANSFER' && (
                      <p className="text-xs text-blue-600">
                        {remainingDebt > 0
                          ? `Bạn sẽ thanh toán ${formatCurrency(remainingDebt)} qua QR Code sau khi đăng ký`
                          : 'Bạn sẽ thanh toán toàn bộ gói qua QR Code sau khi đăng ký'}
                      </p>
                    )}
                  </div>

                  {remainingDebt > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-amber-900">Công nợ:</span>
                        <span className="text-lg font-bold text-amber-600">{formatCurrency(remainingDebt)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  <FileText className="inline h-4 w-4" /> Ghi chú
                </Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ghi chú..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Hủy
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Đăng ký'}
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
            // Delay to ensure backend has saved
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
    </Dialog>
  );
};
