import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar, Info } from 'lucide-react';
import { toast } from 'sonner';
import { membershipApi } from '@/services/api/membershipApi';

interface ExtendMembershipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contractId: string;
  currentEndDate?: string;
  planName?: string;
}

export const ExtendMembershipDialog: React.FC<ExtendMembershipDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contractId,
  currentEndDate,
  planName
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    extensionMonths: 1,
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.extensionMonths < 1) {
      newErrors.extensionMonths = 'Thời gian gia hạn phải ít nhất 1 tháng';
    }

    if (formData.extensionMonths > 24) {
      newErrors.extensionMonths = 'Thời gian gia hạn không được vượt quá 24 tháng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateNewEndDate = () => {
    if (!currentEndDate) return 'N/A';
    const current = new Date(currentEndDate);
    const newDate = new Date(current);
    newDate.setMonth(newDate.getMonth() + formData.extensionMonths);
    return newDate.toLocaleDateString('vi-VN');
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    setLoading(true);

    // API call - Note: Backend endpoint not yet implemented
    membershipApi
      .extendMembership(contractId, {
        extensionMonths: formData.extensionMonths,
        notes: formData.notes
      })
      .then(() => {
        toast.success('Gia hạn gói membership thành công!', {
          description: `Đã gia hạn thêm ${formData.extensionMonths} tháng`
        });

        onSuccess();
        handleClose();
      })
      .catch((error) => {
        console.error('Error extending membership:', error);
        toast.error('Không thể gia hạn gói membership', {
          description: error instanceof Error ? error.message : 'Vui lòng thử lại sau'
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        extensionMonths: 1,
        notes: ''
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Gia hạn gói Membership
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Information */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="font-medium mb-3">Thông tin gói hiện tại</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tên gói:</span>
                <span className="ml-2 font-medium">{planName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Ngày hết hạn hiện tại:</span>
                <span className="ml-2 font-medium">
                  {currentEndDate ? new Date(currentEndDate).toLocaleDateString('vi-VN') : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Extension Duration */}
          <div className="space-y-2">
            <Label htmlFor="extensionMonths">
              Thời gian gia hạn (tháng) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="extensionMonths"
              type="number"
              min={1}
              max={24}
              value={formData.extensionMonths}
              onChange={(e) => handleInputChange('extensionMonths', Number.parseInt(e.target.value, 10) || 1)}
              disabled={loading}
            />
            {errors.extensionMonths && <p className="text-sm text-red-500">{errors.extensionMonths}</p>}
          </div>

          {/* New End Date Preview */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Ngày hết hạn mới:</strong> {calculateNewEndDate()}
            </AlertDescription>
          </Alert>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Thêm ghi chú về việc gia hạn..."
              disabled={loading}
            />
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              <strong>Lưu ý:</strong> Tính năng này đang trong giai đoạn phát triển. Vui lòng liên hệ quản trị viên để
              hoàn tất việc gia hạn.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xác nhận gia hạn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
