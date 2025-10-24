import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, Power } from 'lucide-react';
import type { BranchDisplay } from '@/types/api/Branch';

interface DisableBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: BranchDisplay | null;
  onConfirm: () => Promise<void>;
  isProcessing?: boolean;
}

const DisableBranchModal: React.FC<DisableBranchModalProps> = ({
  isOpen,
  onClose,
  branch,
  onConfirm,
  isProcessing = false
}) => {
  const { t } = useTranslation();

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                {t('branch_detail.disable_branch_title', { defaultValue: 'Tắt chi nhánh' })}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                {t('branch_detail.disable_branch_description', {
                  defaultValue: 'Bạn có chắc chắn muốn tắt chi nhánh này không?'
                })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {branch && (
          <div className="bg-gray-50 rounded-lg p-4 my-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-semibold text-sm">
                  {branch.branchName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{branch.branchName}</h4>
                <p className="text-sm text-gray-600">{branch.location}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 mb-1">
                {t('branch_detail.warning_title', { defaultValue: 'Lưu ý quan trọng' })}
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>
                  • {t('branch_detail.warning_1', { defaultValue: 'Chi nhánh sẽ không thể nhận khách hàng mới' })}
                </li>
                <li>• {t('branch_detail.warning_2', { defaultValue: 'Các ca làm việc hiện tại sẽ bị ảnh hưởng' })}</li>
                <li>
                  •{' '}
                  {t('branch_detail.warning_3', { defaultValue: 'Nhân viên sẽ không thể đăng nhập vào chi nhánh này' })}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {t('common.cancel', { defaultValue: 'Hủy' })}
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing} className="bg-red-600 hover:bg-red-700 text-white">
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('branch_detail.processing', { defaultValue: 'Đang xử lý...' })}
              </>
            ) : (
              <>
                <Power className="w-4 h-4 mr-2" />
                {t('branch_detail.confirm_disable', { defaultValue: 'Xác nhận tắt' })}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisableBranchModal;
