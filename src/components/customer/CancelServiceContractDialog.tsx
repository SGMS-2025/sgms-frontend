import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle } from 'lucide-react';
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formData, setFormData] = useState({
    cancelReason: ''
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
    setShowConfirmDialog(true);
  };

  const handleConfirmCancel = () => {
    setLoading(true);
    setShowConfirmDialog(false);

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
        cancelReason: ''
      });
      setErrors({});
      setShowConfirmDialog(false);
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

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Xác nhận hủy gói
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Bạn có chắc chắn muốn hủy gói <strong>{serviceName || 'này'}</strong> không? Hành động này không thể hoàn
              tác.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={loading}>
              Hủy bỏ
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
