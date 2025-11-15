import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { serviceContractApi } from '@/services/api/serviceContractApi';

interface CancelServiceContractDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contractId: string;
  contractType: 'PT' | 'CLASS';
  serviceName?: string;
  paidAmount?: number;
  startDate?: string;
  endDate?: string;
}

export const CancelServiceContractDialog: React.FC<CancelServiceContractDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contractId,
  contractType,
  serviceName,
  paidAmount = 0,
  startDate,
  endDate
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cancelReason: '',
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

    if (!formData.cancelReason.trim()) {
      newErrors.cancelReason = 'Vui lòng nhập lý do hủy gói';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    setLoading(true);

    // API call - Note: Backend endpoint not yet implemented
    serviceContractApi
      .cancelServiceContract(contractId, formData)
      .then(() => {
        toast.success(`Hủy gói ${contractType === 'PT' ? 'PT' : 'lớp học'} thành công!`);

        onSuccess();
        handleClose();
      })
      .catch((error) => {
        console.error('Error canceling service contract:', error);
        toast.error('Không thể hủy gói dịch vụ', {
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
        cancelReason: '',
        notes: ''
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Hủy gói {contractType === 'PT' ? 'PT 1-1' : 'lớp học'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Information */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="font-medium mb-3">Thông tin gói dịch vụ</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tên gói:</span>
                <span className="ml-2 font-medium">{serviceName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Loại:</span>
                <span className="ml-2 font-medium">{contractType === 'PT' ? 'Personal Training' : 'Lớp học nhóm'}</span>
              </div>
              {startDate && (
                <div>
                  <span className="text-muted-foreground">Ngày bắt đầu:</span>
                  <span className="ml-2">{new Date(startDate).toLocaleDateString('vi-VN')}</span>
                </div>
              )}
              {endDate && (
                <div>
                  <span className="text-muted-foreground">Ngày kết thúc:</span>
                  <span className="ml-2">{new Date(endDate).toLocaleDateString('vi-VN')}</span>
                </div>
              )}
              <div className="col-span-2">
                <span className="text-muted-foreground">Đã thanh toán:</span>
                <span className="ml-2 font-medium">{formatCurrency(paidAmount)}</span>
              </div>
            </div>
          </div>

          {/* Cancel Reason */}
          <div className="space-y-2">
            <Label htmlFor="cancelReason">
              Lý do hủy <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="cancelReason"
              rows={3}
              value={formData.cancelReason}
              onChange={(e) => handleInputChange('cancelReason', e.target.value)}
              placeholder="Nhập lý do hủy gói dịch vụ..."
              disabled={loading}
            />
            {errors.cancelReason && <p className="text-sm text-red-500">{errors.cancelReason}</p>}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú thêm (tùy chọn)</Label>
            <Textarea
              id="notes"
              rows={2}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Thêm ghi chú nếu cần..."
              disabled={loading}
            />
          </div>

          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800">
              <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác. Gói dịch vụ sẽ bị hủy ngay lập tức và khách
              hàng sẽ không thể sử dụng các buổi tập còn lại.
            </AlertDescription>
          </Alert>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              <strong>Lưu ý:</strong> Tính năng này đang trong giai đoạn phát triển. Vui lòng liên hệ quản trị viên để
              hoàn tất việc hủy gói.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Hủy bỏ
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xác nhận hủy gói
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
