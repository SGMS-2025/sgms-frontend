import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Wallet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface WalletNotLinkedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  branchId?: string;
}

export const WalletNotLinkedDialog: React.FC<WalletNotLinkedDialogProps> = ({
  isOpen,
  onClose,
  branchId: _branchId
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGoToWallet = () => {
    onClose();
    navigate('/manage/wallets');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle>{t('wallet.wallet_not_linked.title')}</DialogTitle>
              <DialogDescription className="mt-1">{t('wallet.wallet_not_linked.description')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
            <Wallet className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-orange-900">{t('wallet.wallet_not_linked.please_link')}</p>
              <p className="text-xs text-orange-700">{t('wallet.wallet_not_linked.redirect_message')}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('wallet.wallet_not_linked.cancel')}
          </Button>
          <Button onClick={handleGoToWallet} className="gap-2">
            <Wallet className="h-4 w-4" />
            {t('wallet.wallet_not_linked.go_to_wallet')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
