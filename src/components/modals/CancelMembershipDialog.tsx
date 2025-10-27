import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { membershipApi } from '@/services/api/membershipApi';
import { formatCurrency, getMembershipStatusLabel, getMembershipStatusColor } from '@/utils/membership';
import type { MembershipContract, RefundSuggestion, CancelMembershipPayload } from '@/types/api/Membership';

interface CancelMembershipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contract: MembershipContract;
}

const calculateFallbackRefund = (contract: MembershipContract) => {
  const now = new Date();
  const totalPaid = contract.paidAmount || 0;
  let suggestedAmount = 0;
  let daysUsed = 0;
  let daysRemaining = 0;
  let calculation = '';

  switch (contract.status) {
    case 'PENDING_ACTIVATION':
      suggestedAmount = Math.floor(totalPaid * 0.9);
      calculation = '90% of paid amount (unactivated contract)';
      break;

    case 'ACTIVE':
      if (contract.activationDate) {
        const activationDate = new Date(contract.activationDate);
        const endDate = new Date(contract.endDate);
        const totalDays = Math.ceil((endDate.getTime() - activationDate.getTime()) / (1000 * 60 * 60 * 24));
        const usedDays = Math.ceil((now.getTime() - activationDate.getTime()) / (1000 * 60 * 60 * 24));
        daysUsed = Math.max(0, usedDays);
        daysRemaining = Math.max(0, totalDays - usedDays);

        if (totalDays > 0) {
          const remainingRatio = daysRemaining / totalDays;
          suggestedAmount = Math.floor(totalPaid * remainingRatio);
          calculation = `Pro-rata: ${daysRemaining}/${totalDays} days remaining (${Math.round(remainingRatio * 100)}%)`;
        } else {
          suggestedAmount = 0;
          calculation = 'Contract expired';
        }
      } else {
        suggestedAmount = totalPaid;
        calculation = 'Full refund (no activation date)';
      }
      break;

    case 'EXPIRED':
    case 'CANCELED':
      suggestedAmount = 0;
      calculation = 'No refund (expired/canceled)';
      break;

    default:
      suggestedAmount = 0;
      calculation = 'No refund (invalid status)';
  }

  return {
    suggestedAmount,
    totalPaid,
    daysUsed,
    daysRemaining,
    calculation
  };
};

export const CancelMembershipDialog: React.FC<CancelMembershipDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contract
}) => {
  const [loading, setLoading] = useState(false);
  const [refundSuggestion, setRefundSuggestion] = useState<RefundSuggestion | null>(null);
  const [formData, setFormData] = useState<CancelMembershipPayload>({
    cancelReason: '',
    refundAmount: 0,
    refundMethod: 'CASH',
    notes: '',
    clearDebt: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch refund suggestion when dialog opens
  const fetchRefundSuggestion = useCallback(async () => {
    try {
      setLoading(true);
      const suggestion = await membershipApi.getRefundSuggestion(contract._id);
      setRefundSuggestion(suggestion);
      setFormData((prev) => ({
        ...prev,
        refundAmount: suggestion.suggestedAmount || 0
      }));
    } catch (error) {
      console.error('Failed to fetch refund suggestion:', error);
      // Fallback calculation if API fails
      const fallbackSuggestion = calculateFallbackRefund(contract);
      setRefundSuggestion(fallbackSuggestion);
      setFormData((prev) => ({
        ...prev,
        refundAmount: fallbackSuggestion.suggestedAmount
      }));
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    if (isOpen && contract._id) {
      fetchRefundSuggestion();
    }
  }, [contract._id, fetchRefundSuggestion, isOpen]);

  const handleInputChange = <K extends keyof CancelMembershipPayload>(field: K, value: CancelMembershipPayload[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.cancelReason.trim()) {
      newErrors.cancelReason = 'Lý do huỷ là bắt buộc';
    } else if (formData.cancelReason.trim().length < 10) {
      newErrors.cancelReason = 'Lý do huỷ phải có ít nhất 10 ký tự';
    }

    if (formData.refundAmount < 0) {
      newErrors.refundAmount = 'Số tiền hoàn không được âm';
    }

    if (formData.refundAmount > contract.paidAmount) {
      newErrors.refundAmount = 'Số tiền hoàn không được vượt quá số tiền đã trả';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    membershipApi
      .cancelMembership(contract._id, formData)
      .then(() => {
        toast.success('Hủy gói membership thành công!', {
          description:
            formData.refundAmount > 0 ? `Sẽ hoàn trả ${formatCurrency(formData.refundAmount)}` : 'Không có hoàn trả'
        });
        onSuccess();
        onClose();
      })
      .catch((error) => {
        console.error('Failed to cancel membership:', error);
        toast.error('Không thể hủy gói membership', {
          description: error instanceof Error ? error.message : 'Vui lòng thử lại sau'
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const hasDebt = contract.debtAmount > 0;
  const refundExceedsPaid = formData.refundAmount > contract.paidAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Huỷ gói membership
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Information */}
          <div className="rounded-lg border p-4 bg-gray-50">
            <h4 className="font-medium mb-3">Thông tin gói membership</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Trạng thái:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getMembershipStatusColor(contract.status)}`}>
                  {getMembershipStatusLabel(contract.status)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Ngày bắt đầu:</span>
                <span className="ml-2">{new Date(contract.startDate).toLocaleDateString('vi-VN')}</span>
              </div>
              <div>
                <span className="text-gray-600">Ngày kết thúc:</span>
                <span className="ml-2">{new Date(contract.endDate).toLocaleDateString('vi-VN')}</span>
              </div>
              <div>
                <span className="text-gray-600">Đã thanh toán:</span>
                <span className="ml-2 font-medium">{formatCurrency(contract.paidAmount)}</span>
              </div>
              {hasDebt && (
                <div className="col-span-2">
                  <span className="text-gray-600">Còn nợ:</span>
                  <span className="ml-2 font-medium text-red-600">{formatCurrency(contract.debtAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Refund Suggestion */}
          {refundSuggestion && (
            <div className="rounded-lg border p-4 bg-blue-50">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                Gợi ý hoàn tiền
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Số tiền đã trả:</span>
                  <span className="font-medium">{formatCurrency(refundSuggestion.totalPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Đã sử dụng:</span>
                  <span>{refundSuggestion.daysUsed} ngày</span>
                </div>
                <div className="flex justify-between">
                  <span>Còn lại:</span>
                  <span>{refundSuggestion.daysRemaining} ngày</span>
                </div>
                <div className="flex justify-between font-medium text-blue-600">
                  <span>Gợi ý hoàn:</span>
                  <span>{formatCurrency(refundSuggestion.suggestedAmount)}</span>
                </div>
                <div className="text-xs text-gray-600 mt-2">{refundSuggestion.calculation}</div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancelReason">Lý do huỷ *</Label>
              <Textarea
                id="cancelReason"
                value={formData.cancelReason}
                onChange={(e) => handleInputChange('cancelReason', e.target.value)}
                placeholder="Nhập lý do huỷ gói membership..."
                className="mt-1"
                rows={3}
              />
              {errors.cancelReason && <p className="text-red-500 text-sm mt-1">{errors.cancelReason}</p>}
            </div>

            <div>
              <Label htmlFor="refundAmount">Số tiền hoàn *</Label>
              <Input
                id="refundAmount"
                type="number"
                value={formData.refundAmount}
                onChange={(e) => handleInputChange('refundAmount', Number(e.target.value))}
                className="mt-1"
                min="0"
                step="1000"
              />
              {errors.refundAmount && <p className="text-red-500 text-sm mt-1">{errors.refundAmount}</p>}
              {refundExceedsPaid && (
                <Alert className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>Số tiền hoàn vượt quá số tiền đã trả. Vui lòng kiểm tra lại.</AlertDescription>
                </Alert>
              )}
            </div>

            <div>
              <Label htmlFor="refundMethod">Phương thức hoàn tiền *</Label>
              <Select
                value={formData.refundMethod}
                onValueChange={(value) =>
                  handleInputChange('refundMethod', value as CancelMembershipPayload['refundMethod'])
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Tiền mặt</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Ghi chú thêm</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Ghi chú bổ sung (tùy chọn)..."
                className="mt-1"
                rows={2}
              />
            </div>

            {hasDebt && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="clearDebt"
                  checked={formData.clearDebt}
                  onCheckedChange={(checked) => handleInputChange('clearDebt', checked === true)}
                />
                <Label htmlFor="clearDebt" className="text-sm">
                  Xoá công nợ còn lại ({formatCurrency(contract.debtAmount)})
                </Label>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={loading || refundExceedsPaid}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xác nhận huỷ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
