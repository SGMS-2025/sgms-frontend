import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { walletApi } from '@/services/api/walletApi';
import { useUser } from '@/hooks/useAuth';
import { WalletNotLinkedDialog } from './WalletNotLinkedDialog';

interface PaymentMethodSelectorProps {
  value: 'CASH' | 'BANK_TRANSFER' | 'QR_BANK';
  onChange: (value: 'CASH' | 'BANK_TRANSFER' | 'QR_BANK') => void;
  branchId?: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ value, onChange, branchId }) => {
  const { t } = useTranslation();
  const currentUser = useUser();
  const [hasBankAccount, setHasBankAccount] = useState<boolean | null>(null);
  const [isWalletEnabled, setIsWalletEnabled] = useState<boolean | null>(null);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [checkingWallet, setCheckingWallet] = useState(false);

  // Check if branch has bank account and wallet enabled when component mounts or branchId changes
  useEffect(() => {
    if (branchId) {
      checkBankAccount();
      checkWalletEnabled();
    }
  }, [branchId]);

  // Auto-switch payment method if BANK_TRANSFER is selected but wallet is disabled
  useEffect(() => {
    if (value === 'BANK_TRANSFER' && isWalletEnabled === false) {
      // Switch to CASH as default when BANK_TRANSFER becomes unavailable
      onChange('CASH');
    }
  }, [isWalletEnabled, value, onChange]);

  const checkBankAccount = async () => {
    if (!branchId) {
      setHasBankAccount(false);
      return;
    }

    try {
      setCheckingWallet(true);
      const bankAccount = await walletApi.getBankAccount(branchId);
      setHasBankAccount(!!bankAccount);
    } catch (error) {
      console.error('Error checking bank account:', error);
      setHasBankAccount(false);
    } finally {
      setCheckingWallet(false);
    }
  };

  const checkWalletEnabled = async () => {
    if (!branchId) {
      setIsWalletEnabled(null);
      return;
    }

    // Only OWNERs have permission to view wallets; avoid forbidden errors for STAFF / other roles
    if (currentUser?.role !== 'OWNER') {
      setIsWalletEnabled(true);
      return;
    }

    try {
      const wallet = await walletApi.getWalletByBranchId(branchId);
      setIsWalletEnabled(wallet?.enabled !== false);
    } catch (error) {
      console.error('Error checking wallet enabled:', error);
      // If check fails (e.g., no permission), assume wallet is enabled for backward compatibility
      setIsWalletEnabled(true);
    }
  };

  const handlePaymentMethodChange = async (newValue: 'CASH' | 'BANK_TRANSFER' | 'QR_BANK') => {
    // If selecting BANK_TRANSFER, check if wallet is enabled
    if (newValue === 'BANK_TRANSFER') {
      if (isWalletEnabled === null) {
        await checkWalletEnabled();
      }
      if (isWalletEnabled === false) {
        toast.error(t('wallet.bank_transfer_unavailable'));
        return; // Don't change payment method
      }
    }

    // If selecting QR_BANK, check if bank account exists
    if (newValue === 'QR_BANK') {
      // If we haven't checked yet or need to re-check, do it now
      if (hasBankAccount === null || !hasBankAccount) {
        if (!branchId) {
          setShowWalletDialog(true);
          return; // Don't change payment method
        }

        try {
          setCheckingWallet(true);
          const bankAccount = await walletApi.getBankAccount(branchId);
          if (!bankAccount) {
            setShowWalletDialog(true);
            setHasBankAccount(false);
            return; // Don't change payment method
          }
          setHasBankAccount(true);
        } catch (error) {
          console.error('Error checking bank account:', error);
          setShowWalletDialog(true);
          setHasBankAccount(false);
          return; // Don't change payment method
        } finally {
          setCheckingWallet(false);
        }
      }

      // If we know there's no bank account, show dialog
      if (hasBankAccount === false) {
        setShowWalletDialog(true);
        return; // Don't change payment method
      }
    }

    // Allow change if all checks pass
    onChange(newValue);
  };

  return (
    <>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('shared_form.payment_method_label')}</Label>
        <Select value={value} onValueChange={handlePaymentMethodChange} disabled={checkingWallet}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CASH">{t('shared_form.payment_cash')}</SelectItem>
            {isWalletEnabled !== false && (
              <SelectItem value="BANK_TRANSFER">{t('shared_form.payment_transfer')}</SelectItem>
            )}
            <SelectItem value="QR_BANK">{t('shared_form.payment_qr_bank')}</SelectItem>
          </SelectContent>
        </Select>
        {value === 'BANK_TRANSFER' && (
          <p className="text-xs text-blue-600">{t('shared_form.payment_transfer_description')}</p>
        )}
        {value === 'QR_BANK' && <p className="text-xs text-blue-600">{t('shared_form.payment_qr_bank_description')}</p>}
      </div>

      <WalletNotLinkedDialog isOpen={showWalletDialog} onClose={() => setShowWalletDialog(false)} branchId={branchId} />
    </>
  );
};
