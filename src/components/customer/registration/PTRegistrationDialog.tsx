import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DollarSign, User, Package, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useBranch } from '@/contexts/BranchContext';
import { packageApi } from '@/services/api/packageApi';
import { staffApi } from '@/services/api/staffApi';
import { discountCampaignApi } from '@/services/api/discountApi';
import { serviceContractApi } from '@/services/api/serviceContractApi';
import { paymentApi, type PayOSPaymentData } from '@/services/api/paymentApi';
import { PayOSPaymentModal } from '@/components/modals/PayOSPaymentModal';
import type { ServicePackage, PTRegistrationFormData, ServiceContractResponse } from '@/types/api/Package';
import type { Staff } from '@/types/api/Staff';
import type { DiscountCampaign } from '@/types/api/Discount';

interface PTRegistrationDialogProps {
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

export const PTRegistrationDialog: React.FC<PTRegistrationDialogProps> = ({
  isOpen,
  onClose,
  customerId,
  onSuccess
}) => {
  const { currentBranch } = useBranch();
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [trainers, setTrainers] = useState<Staff[]>([]);
  const [promotions, setPromotions] = useState<DiscountCampaign[]>([]);

  // PayOS states
  const [showPayOSModal, setShowPayOSModal] = useState(false);
  const [payOSData, setPayOSData] = useState<PayOSPaymentData | null>(null);
  const [createdContractId, setCreatedContractId] = useState<string | null>(null);

  const [formData, setFormData] = useState<PTRegistrationFormData>({
    servicePackageId: '',
    sessionCount: undefined,
    primaryTrainerId: undefined,
    customMonths: undefined,
    startDate: new Date().toISOString().split('T')[0],
    branchId: currentBranch?._id || '',
    discountCampaignId: undefined,
    initialPaidAmount: 0,
    paymentMethod: 'CASH',
    referrerStaffId: undefined,
    notes: ''
  });

  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<DiscountCampaign | null>(null);

  const basePrice = selectedPackage?.defaultPriceVND || 0;
  const discountPercent = selectedPromotion?.discountPercentage || 0;
  const discountAmount = (basePrice * discountPercent) / 100;
  const totalPrice = basePrice - discountAmount;
  const remainingDebt = Math.max(0, totalPrice - formData.initialPaidAmount);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      if (!currentBranch?._id) return;

      try {
        const [packagesRes, trainersRes, promotionsRes] = await Promise.all([
          packageApi.getActivePackagesByBranch(currentBranch._id),
          staffApi.getStaffList({ branchId: currentBranch._id }),
          discountCampaignApi.getActiveCampaignsByBranch(currentBranch._id)
        ]);

        if (packagesRes.success && packagesRes.data) {
          setPackages(packagesRes.data.filter((pkg) => pkg.type === 'PT'));
        }

        if (trainersRes.success && trainersRes.data) {
          setTrainers(trainersRes.data.staffList.filter((staff) => staff.jobTitle === 'Personal Trainer'));
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
        contractType: 'service',
        amount: paymentAmount,
        description: `Goi PT 1-1`
      })
      .then((paymentResponse) => {
        if (paymentResponse.success) {
          setCreatedContractId(contractId);
          setPayOSData(paymentResponse.data);
          setShowPayOSModal(true);
          toast.success('Đăng ký gói PT thành công! Vui lòng thanh toán.');
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
    toast.success('Đăng ký gói PT thành công!');
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 500);
  };

  const handleContractCreated = (response: ServiceContractResponse) => {
    if (!response.success) {
      toast.error(response.message || 'Không thể đăng ký gói PT');
      setLoading(false);
      return;
    }

    const contractData = response.data;
    const contractId = contractData?._id;

    if (formData.paymentMethod === 'BANK_TRANSFER' && contractId) {
      handlePayOSPayment(contractId);
    } else {
      handleRegistrationSuccess();
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.servicePackageId) {
      toast.error('Vui lòng chọn gói PT');
      return;
    }

    setLoading(true);

    serviceContractApi
      .createServiceContract(customerId, formData)
      .then(handleContractCreated)
      .catch(() => {
        toast.error('Có lỗi xảy ra khi đăng ký gói PT');
        setLoading(false);
      });
  };

  const handlePaymentSuccess = () => {
    setShowPayOSModal(false);
    toast.success('Thanh toán thành công!');
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đăng ký gói Personal Training (PT 1-1)</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="rounded-3xl border border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5 text-primary" />
                Thông tin đăng ký
              </CardTitle>
              <CardDescription>Chọn gói tập PT, huấn luyện viên và thông tin thanh toán</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Gói PT *</Label>
                    <Select
                      value={formData.servicePackageId}
                      onValueChange={(value) => {
                        const pkg = packages.find((p) => p._id === value);
                        setSelectedPackage(pkg || null);
                        setFormData((prev) => ({
                          ...prev,
                          servicePackageId: value,
                          customMonths: pkg?.defaultDurationMonths
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn gói PT" />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.map((pkg) => (
                          <SelectItem key={pkg._id} value={pkg._id}>
                            {pkg.name} - {formatCurrency(pkg.defaultPriceVND || 0)} ({pkg.defaultDurationMonths} tháng)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Số buổi tập</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.sessionCount || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, sessionCount: parseInt(e.target.value) || undefined }))
                      }
                      placeholder="Nhập số buổi tập"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Thời hạn (tháng)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.customMonths || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, customMonths: parseInt(e.target.value) || undefined }))
                      }
                      placeholder="Số tháng"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Huấn luyện viên</Label>
                    <Select
                      value={formData.primaryTrainerId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, primaryTrainerId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn huấn luyện viên" />
                      </SelectTrigger>
                      <SelectContent>
                        {trainers.map((trainer) => (
                          <SelectItem key={trainer._id} value={trainer.userId._id}>
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              {trainer.userId.fullName || 'Unknown'}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ngày bắt đầu *</Label>
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

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-amber-900">Công nợ:</span>
                      <span className="text-lg font-bold text-amber-600">{formatCurrency(remainingDebt)}</span>
                    </div>
                  </div>
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
          contractType="service"
        />
      )}
    </Dialog>
  );
};
