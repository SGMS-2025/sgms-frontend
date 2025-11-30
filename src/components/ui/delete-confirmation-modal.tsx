import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  description
}) => {
  const { t } = useTranslation();

  const defaultTitle = title || t('common.delete_confirmation_title');
  const defaultDescription = description || t('common.delete_confirmation_description');
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">{defaultTitle}</DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-1">{defaultDescription}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="flex gap-3 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 sm:flex-none cursor-pointer hover:bg-gray-50 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 sm:flex-none cursor-pointer hover:bg-red-700 hover:brightness-90 hover:shadow-md transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('common.deleting')}
              </>
            ) : (
              t('common.delete')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
