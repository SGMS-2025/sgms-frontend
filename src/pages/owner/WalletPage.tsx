import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { walletApi } from '@/services/api/walletApi';
import { useBranch } from '@/contexts/BranchContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  ChevronsUpDown,
  Check,
  RefreshCcw,
  Wallet as WalletIcon,
  Banknote,
  Lock,
  Unlock,
  History,
  CreditCard,
  Clock3,
  Loader2,
  ShieldCheck,
  Building2,
  ArrowUpRight,
  Sparkles,
  LineChart,
  AlertCircle,
  Upload,
  X,
  Link2,
  Copy,
  Download
} from 'lucide-react';
import { cn } from '@/utils/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BANK_LIST, getBankName } from '@/constants/bankList';

type Wallet = {
  _id: string;
  branchId: string;
  balance: number;
  availableBalance: number;
  lockedBalance: number;
  currency?: string;
  enabled?: boolean;
};

type Withdrawal = {
  _id: string;
  branchId: string;
  amount: number;
  status: 'PENDING_PAYOUT' | 'SUCCESS' | 'FAILED' | 'CANCELED';
  description?: string;
  toBin: string;
  toAccountNumber: string;
  toAccountName?: string;
  createdAt: string;
  updatedAt: string;
};

type BankAccount = {
  _id?: string;
  branchId: string;
  accountNumber: string;
  accountName: string;
  bankBin: string;
  bankName?: string;
  qrCodeUrl?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
};

const WalletPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentBranch, branches } = useBranch();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [bankPopoverOpen, setBankPopoverOpen] = useState(false);
  const [bankSearchValue, setBankSearchValue] = useState('');
  const [form, setForm] = useState({
    branchId: '',
    amount: '',
    toBin: '',
    selectedBank: '',
    toAccountNumber: '',
    toAccountName: '',
    description: '',
    useLinkedBank: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);

  // Bank account linking state
  const [bankAccountForm, setBankAccountForm] = useState({
    branchId: '',
    accountNumber: '',
    accountName: '',
    bankBin: '',
    selectedBank: '',
    note: ''
  });
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);
  const [removeQrCode, setRemoveQrCode] = useState(false);
  const [bankAccountPopoverOpen, setBankAccountPopoverOpen] = useState(false);
  const [bankAccountSearchValue, setBankAccountSearchValue] = useState('');
  const [bankLinkDialogOpen, setBankLinkDialogOpen] = useState(false);
  const [savingBankAccount, setSavingBankAccount] = useState(false);
  const [linkedBankAccount, setLinkedBankAccount] = useState<BankAccount | null>(null);
  const [loadingBankAccount, setLoadingBankAccount] = useState(false);
  const [togglingWallet, setTogglingWallet] = useState(false);

  // Helper function to get branch name from branchId
  const getBranchName = (branchId: string): string => {
    const branch = branches.find((b) => b._id === branchId);
    return branch?.branchName || branchId;
  };

  const getBankShortName = (bin: string): string => {
    const bank = BANK_LIST.find((item) => item.bin === bin);
    if (!bank) return bin;
    const shortNameMatch = bank.name.match(/\(([^)]+)\)/);
    return shortNameMatch ? shortNameMatch[1] : bank.name;
  };

  // Filter wallets by current branch
  const filteredWallets = useMemo(() => {
    if (!currentBranch) return wallets;
    return wallets.filter((w) => w.branchId === currentBranch._id);
  }, [wallets, currentBranch]);

  const selectedWallet = useMemo(() => wallets.find((w) => w._id === selectedWalletId), [wallets, selectedWalletId]);

  // Filter banks by search - tìm trong tên đầy đủ và phần trong ngoặc (short name)
  // Ưu tiên hiển thị các ngân hàng có short name khớp trước
  const filteredBanks = useMemo(() => {
    if (!bankSearchValue.trim()) return BANK_LIST;
    const searchTerm = bankSearchValue.toLowerCase().trim();

    const banksWithShortNameMatch: typeof BANK_LIST = [];
    const banksWithFullNameMatch: typeof BANK_LIST = [];

    BANK_LIST.forEach((bank) => {
      const nameLower = bank.name.toLowerCase();
      // Extract phần trong ngoặc (short name)
      const shortNameMatch = bank.name.match(/\(([^)]+)\)/);
      const shortName = shortNameMatch ? shortNameMatch[1].toLowerCase() : '';

      // Kiểm tra khớp với short name trước
      if (shortName.includes(searchTerm)) {
        banksWithShortNameMatch.push(bank);
      } else if (nameLower.includes(searchTerm)) {
        // Chỉ thêm vào full name match nếu không khớp với short name
        banksWithFullNameMatch.push(bank);
      }
    });

    // Ưu tiên hiển thị short name match trước, sau đó mới đến full name match
    return [...banksWithShortNameMatch, ...banksWithFullNameMatch];
  }, [bankSearchValue]);

  const loadWallets = async () => {
    setLoading(true);
    try {
      const data = await walletApi.getWallets();
      setWallets(data || []);
      // Auto-select will be handled by useEffect when currentBranch or wallets change
    } catch (_error) {
      toast.error(t('wallet.error.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  const loadWithdrawals = async (branchId?: string) => {
    if (!branchId) {
      setWithdrawals([]);
      return;
    }
    setWithdrawalsLoading(true);
    try {
      const data = await walletApi.listWithdrawals(branchId);
      setWithdrawals(data || []);
    } catch (_error) {
      toast.error(t('wallet.error.load_withdrawals_failed'));
    } finally {
      setWithdrawalsLoading(false);
    }
  };

  useEffect(() => {
    void loadWallets();
  }, []);

  // Auto-select wallet when branch changes
  useEffect(() => {
    if (wallets.length > 0) {
      if (currentBranch) {
        // If branch is selected, find and select wallet for that branch
        const branchWallet = wallets.find((w) => w.branchId === currentBranch._id);
        if (branchWallet && branchWallet._id !== selectedWalletId) {
          setSelectedWalletId(branchWallet._id);
          setForm((prev) => ({ ...prev, branchId: branchWallet.branchId }));
        } else if (!branchWallet && selectedWalletId) {
          // Branch selected but no wallet found, clear selection
          setSelectedWalletId('');
          setForm((prev) => ({ ...prev, branchId: '' }));
        }
      } else {
        // No branch selected, select first wallet if none selected
        const currentWalletExists = wallets.find((w) => w._id === selectedWalletId);
        if (!currentWalletExists) {
          setSelectedWalletId(wallets[0]._id);
          setForm((prev) => ({ ...prev, branchId: wallets[0].branchId }));
        }
      }
    }
  }, [currentBranch, wallets, selectedWalletId]);

  useEffect(() => {
    if (!selectedWallet?.branchId) {
      setWithdrawals([]);
      return;
    }
    void loadWithdrawals(selectedWallet.branchId);
    void loadBankAccount(selectedWallet.branchId);
  }, [selectedWallet?.branchId]);

  // Filter banks for bank account linking
  const filteredBanksForAccount = useMemo(() => {
    if (!bankAccountSearchValue.trim()) return BANK_LIST;
    const searchTerm = bankAccountSearchValue.toLowerCase().trim();

    const banksWithShortNameMatch: typeof BANK_LIST = [];
    const banksWithFullNameMatch: typeof BANK_LIST = [];

    BANK_LIST.forEach((bank) => {
      const nameLower = bank.name.toLowerCase();
      const shortNameMatch = bank.name.match(/\(([^)]+)\)/);
      const shortName = shortNameMatch ? shortNameMatch[1].toLowerCase() : '';

      if (shortName.includes(searchTerm)) {
        banksWithShortNameMatch.push(bank);
      } else if (nameLower.includes(searchTerm)) {
        banksWithFullNameMatch.push(bank);
      }
    });

    return [...banksWithShortNameMatch, ...banksWithFullNameMatch];
  }, [bankAccountSearchValue]);

  const handleOpenWithdrawalDialog = () => {
    if (!selectedWallet) {
      toast.error(t('wallet.error.select_wallet'));
      return;
    }
    // Reset form and check if we should use linked bank account
    const shouldUseLinked = !!linkedBankAccount && linkedBankAccount.branchId === selectedWallet.branchId;
    setForm({
      branchId: selectedWallet.branchId,
      amount: '',
      toBin: shouldUseLinked ? linkedBankAccount.bankBin : '',
      selectedBank: shouldUseLinked ? linkedBankAccount.bankBin : '',
      toAccountNumber: shouldUseLinked ? linkedBankAccount.accountNumber : '',
      toAccountName: shouldUseLinked ? linkedBankAccount.accountName : '',
      description: '',
      useLinkedBank: shouldUseLinked
    });
    setWithdrawalDialogOpen(true);
  };

  const handleCreateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-get branchId from selected wallet
    const branchIdToUse = selectedWallet?.branchId || form.branchId;
    if (!branchIdToUse) {
      toast.error(t('wallet.error.select_wallet'));
      return;
    }
    const amountNumber = Number(form.amount);
    if (!amountNumber || amountNumber <= 0) {
      toast.error(t('wallet.error.invalid_amount'));
      return;
    }
    if (!form.toBin) {
      toast.error(t('wallet.error.select_bank'));
      return;
    }
    if (!form.toAccountNumber.trim()) {
      toast.error(t('wallet.error.enter_account_number'));
      return;
    }

    try {
      setSubmitting(true);
      await walletApi.createWithdrawal(branchIdToUse, {
        amount: amountNumber,
        toBin: form.toBin,
        toAccountNumber: form.toAccountNumber,
        toAccountName: form.toAccountName || undefined,
        description: form.description || undefined
      });
      toast.success(t('wallet.success.create_withdrawal'));
      setForm({
        branchId: branchIdToUse,
        amount: '',
        description: '',
        selectedBank: '',
        toBin: '',
        toAccountNumber: '',
        toAccountName: '',
        useLinkedBank: false
      });
      setWithdrawalDialogOpen(false);
      setBankPopoverOpen(false);
      setBankSearchValue('');
      await loadWallets();
      await loadWithdrawals(branchIdToUse);
    } catch (_error) {
      toast.error(t('wallet.error.create_withdrawal_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const loadBankAccount = async (branchId: string) => {
    setLoadingBankAccount(true);
    try {
      const data = await walletApi.getBankAccount(branchId);
      setLinkedBankAccount(data || null);
      setRemoveQrCode(false);
      if (data) {
        setBankAccountForm({
          branchId: data.branchId,
          accountNumber: data.accountNumber,
          accountName: data.accountName,
          bankBin: data.bankBin,
          selectedBank: data.bankBin,
          note: data.note || ''
        });
        if (data.qrCodeUrl) {
          setQrCodePreview(data.qrCodeUrl);
        }
      } else {
        // Reset form if no linked account
        setBankAccountForm({
          branchId: branchId,
          accountNumber: '',
          accountName: '',
          bankBin: '',
          selectedBank: '',
          note: ''
        });
        setQrCodePreview(null);
        setQrCodeFile(null);
      }
    } catch (_error) {
      // If no bank account found, that's okay - just reset form
      setLinkedBankAccount(null);
      setRemoveQrCode(false);
      setBankAccountForm({
        branchId: branchId,
        accountNumber: '',
        accountName: '',
        bankBin: '',
        selectedBank: '',
        note: ''
      });
      setQrCodePreview(null);
      setQrCodeFile(null);
    } finally {
      setLoadingBankAccount(false);
    }
  };

  const handleQrCodeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(t('wallet.error.select_image_file'));
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('wallet.error.file_size_exceeded'));
        return;
      }
      setQrCodeFile(file);
      setRemoveQrCode(false);
      const reader = new FileReader();
      reader.onload = (e) => {
        setQrCodePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveQrCode = () => {
    if (qrCodeFile) {
      setQrCodeFile(null);
      setQrCodePreview(linkedBankAccount?.qrCodeUrl || null);
      setRemoveQrCode(false);
      return;
    }
    if (linkedBankAccount?.qrCodeUrl) {
      setRemoveQrCode(true);
    }
    setQrCodeFile(null);
    setQrCodePreview(null);
  };

  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet) {
      toast.error(t('wallet.error.select_wallet_to_link'));
      return;
    }

    if (!bankAccountForm.accountNumber.trim()) {
      toast.error(t('wallet.error.enter_account_number'));
      return;
    }
    if (!bankAccountForm.accountName.trim()) {
      toast.error(t('wallet.error.enter_account_name'));
      return;
    }
    if (!bankAccountForm.bankBin) {
      toast.error(t('wallet.error.select_bank'));
      return;
    }

    try {
      setSavingBankAccount(true);
      const formData = new FormData();
      formData.append('branchId', selectedWallet.branchId);
      formData.append('accountNumber', bankAccountForm.accountNumber);
      formData.append('accountName', bankAccountForm.accountName);
      formData.append('bankBin', bankAccountForm.bankBin);
      if (bankAccountForm.note) {
        formData.append('note', bankAccountForm.note);
      }
      if (removeQrCode && !qrCodeFile) {
        formData.append('removeQrCode', 'true');
      }
      if (qrCodeFile) {
        formData.append('qrCode', qrCodeFile);
      }

      await walletApi.saveBankAccount(formData);
      toast.success(t('wallet.success.link_bank_account'));
      await loadBankAccount(selectedWallet.branchId);
    } catch (_error) {
      toast.error(t('wallet.error.link_bank_account_failed'));
    } finally {
      setSavingBankAccount(false);
    }
  };

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      hour12: false
    });

  const handleCopyAccountNumber = async () => {
    if (!linkedBankAccount?.accountNumber) return;
    try {
      await navigator.clipboard.writeText(linkedBankAccount.accountNumber);
      toast.success(t('wallet.success.copy_account_number'));
    } catch (_error) {
      toast.error(t('wallet.error.copy_failed'));
    }
  };

  const handleDownloadQr = () => {
    if (!linkedBankAccount?.qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = linkedBankAccount.qrCodeUrl;
    link.download = `qr-${linkedBankAccount.branchId}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openBankLinkDialog = () => {
    if (!selectedWallet) {
      toast.error(t('wallet.error.select_wallet_to_link'));
      return;
    }
    setBankLinkDialogOpen(true);
  };

  const handleToggleWallet = async (wallet: Wallet, enabled: boolean) => {
    try {
      setTogglingWallet(true);
      await walletApi.toggleWallet(wallet.branchId, enabled);
      toast.success(enabled ? t('wallet.enabled_success') : t('wallet.disabled_success'));
      await loadWallets();
    } catch (_error) {
      toast.error(t('wallet.toggle_failed'));
    } finally {
      setTogglingWallet(false);
    }
  };

  const withdrawalStatuses: Record<Withdrawal['status'], { label: string; className: string; dotClass: string }> = {
    PENDING_PAYOUT: {
      label: t('wallet.status.pending_payout'),
      className: 'bg-amber-50 text-amber-700 border border-amber-100',
      dotClass: 'bg-amber-500 shadow-amber-300/60'
    },
    SUCCESS: {
      label: t('wallet.status.success'),
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      dotClass: 'bg-emerald-500 shadow-emerald-300/70'
    },
    FAILED: {
      label: t('wallet.status.failed'),
      className: 'bg-rose-50 text-rose-700 border border-rose-100',
      dotClass: 'bg-rose-500 shadow-rose-300/70'
    },
    CANCELED: {
      label: t('wallet.status.canceled'),
      className: 'bg-slate-100 text-slate-600 border border-slate-200',
      dotClass: 'bg-slate-400 shadow-slate-200/80'
    }
  };

  const activeBranchName = selectedWallet ? getBranchName(selectedWallet.branchId) : currentBranch?.branchName || '';
  const currencyLabel = selectedWallet?.currency || 'VND';
  const activeBalances = {
    total: selectedWallet?.balance ?? 0,
    available: selectedWallet?.availableBalance ?? 0,
    locked: selectedWallet?.lockedBalance ?? 0
  };
  const availableRatio = activeBalances.total ? Math.min(activeBalances.available / activeBalances.total, 1) : 0;
  const lockedRatio = activeBalances.total ? Math.min(activeBalances.locked / activeBalances.total, 1) : 0;

  return (
    <>
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#fbbf24,transparent_35%)] opacity-40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#22d3ee,transparent_35%)] opacity-30" />
          <div className="absolute inset-0 bg-grid-white/10 bg-[size:18px_18px] opacity-15" />
          <div className="relative p-6 md:p-8 space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.1em] text-amber-100">
                  <ShieldCheck className="h-4 w-4" />
                  {t('wallet.title.operation_center')}
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
                    {t('wallet.title.balance_management')}
                  </h1>
                  <p className="text-sm text-slate-100/80 max-w-2xl">{t('wallet.description.main')}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-slate-100/80">
                  <Badge className="bg-white/10 text-white border-white/20">
                    <Building2 className="h-4 w-4 mr-1" />
                    {activeBranchName || t('wallet.no_branch_selected')}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/5 text-white border-white/10">
                    <Sparkles className="h-4 w-4 mr-1" />
                    {t('wallet.real_time_status')}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                  onClick={loadWallets}
                  disabled={loading}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  {loading ? t('wallet.loading') : t('wallet.refresh_data')}
                </Button>
                <Button className="bg-white text-slate-900 hover:bg-slate-100" onClick={handleOpenWithdrawalDialog}>
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  {t('wallet.create_withdrawal')}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between text-xs uppercase text-amber-100">
                  <span>{t('wallet.total_balance')}</span>
                  <LineChart className="h-4 w-4" />
                </div>
                <div className="text-2xl font-semibold mt-2">
                  {activeBalances.total.toLocaleString()} {currencyLabel}
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-300 to-white rounded-full"
                    style={{ width: `${availableRatio ? availableRatio * 100 : 12}%` }}
                  />
                </div>
                <div className="text-xs text-slate-100/80 mt-2">
                  {activeBranchName
                    ? t('wallet.branch_name', { name: activeBranchName })
                    : t('wallet.select_wallet_to_view')}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between text-xs uppercase text-amber-100">
                  <div className="flex items-center gap-2">
                    <Unlock className="h-4 w-4" />
                    {t('wallet.available')}
                  </div>
                  <Badge className="bg-white/10 text-white border-white/20">{Math.round(availableRatio * 100)}%</Badge>
                </div>
                <div className="text-2xl font-semibold mt-2">{activeBalances.available.toLocaleString()}</div>
                <p className="text-xs text-slate-100/80 mt-1">{t('wallet.ready_to_withdraw')}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between text-xs uppercase text-amber-100">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {t('wallet.processing_payout')}
                  </div>
                  <Badge className="bg-white/10 text-white border-white/20">{Math.round(lockedRatio * 100)}%</Badge>
                </div>
                <div className="text-2xl font-semibold mt-2">{activeBalances.locked.toLocaleString()}</div>
                <p className="text-xs text-slate-100/80 mt-1">{t('wallet.pending_payos')}</p>
              </div>
            </div>
          </div>
        </div>

        {selectedWallet && (
          <Card className="border border-slate-200 shadow-sm rounded-2xl">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xs uppercase text-slate-500">{t('wallet.wallet_status')}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{getBranchName(selectedWallet.branchId)}</p>
                    <Badge
                      variant="outline"
                      className={
                        selectedWallet.enabled !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }
                    >
                      {selectedWallet.enabled !== false ? t('wallet.enabled') : t('wallet.disabled')}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    {selectedWallet.enabled !== false ? t('wallet.wallet_enabled') : t('wallet.wallet_disabled')}
                  </p>
                </div>
                <Button
                  variant={selectedWallet.enabled !== false ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleToggleWallet(selectedWallet, !selectedWallet.enabled)}
                  disabled={togglingWallet || !selectedWallet}
                  className={selectedWallet.enabled !== false ? 'bg-amber-500 hover:bg-amber-600' : ''}
                >
                  {togglingWallet ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('wallet.toggling')}
                    </>
                  ) : selectedWallet.enabled !== false ? (
                    t('wallet.disable')
                  ) : (
                    t('wallet.enable')
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-500">{t('wallet.branch_wallet')}</p>
              <div className="flex flex-wrap items-center gap-2 text-slate-700">
                <span className="text-lg font-semibold">{t('wallet.quick_navigation')}</span>
                <Badge variant="secondary" className="inline-flex items-center gap-1 bg-slate-100 text-slate-700">
                  <WalletIcon className="h-4 w-4" />
                  {t('wallet.active_wallets', { count: filteredWallets.length })}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">{t('wallet.select_wallet_description')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={openBankLinkDialog} disabled={!selectedWallet}>
                {t('wallet.link_edit_account')}
              </Button>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={handleOpenWithdrawalDialog}>
                <ArrowUpRight className="h-4 w-4 mr-2" />
                {t('wallet.quick_withdraw')}
              </Button>
            </div>
          </div>

          <Card className="border border-slate-200 shadow-sm h-full rounded-2xl bg-gradient-to-b from-white to-slate-50">
            <CardHeader className="space-y-2 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-slate-500">{t('wallet.bank_link')}</p>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-amber-600" />
                    {t('wallet.bank_profile')}
                  </CardTitle>
                </div>
                {selectedWallet && (
                  <Button variant="outline" size="sm" onClick={openBankLinkDialog}>
                    {linkedBankAccount ? t('wallet.edit_link') : t('wallet.link_now')}
                  </Button>
                )}
              </div>
              <p className="text-sm text-slate-500">{t('wallet.link_status_description')}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selectedWallet ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-600 text-center">
                  {t('wallet.select_wallet_to_view_bank')}
                </div>
              ) : loadingBankAccount ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('wallet.loading_bank_link')}
                </div>
              ) : !linkedBankAccount ? (
                <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-800 space-y-2">
                  <div>{t('wallet.no_bank_link', { branch: getBranchName(selectedWallet.branchId) })}</div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-amber-700">
                    {t('wallet.click_to_link')}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase text-slate-500">{t('wallet.branch')}</p>
                      <div className="font-semibold text-slate-900">{getBranchName(selectedWallet.branchId)}</div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                      {t('wallet.linked')}
                    </Badge>
                  </div>
                  <div
                    className={cn(
                      'space-y-3',
                      linkedBankAccount.qrCodeUrl &&
                        'md:grid md:grid-cols-[1.1fr_minmax(240px,0.95fr)] md:gap-3 md:space-y-0'
                    )}
                  >
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-3 md:p-4 space-y-3 h-full">
                      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center">
                            <Banknote className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{linkedBankAccount.accountName}</div>
                            <div className="text-sm text-slate-600">{getBankShortName(linkedBankAccount.bankBin)}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={handleCopyAccountNumber} className="gap-1">
                            <Copy className="h-4 w-4" />
                            {t('wallet.copy')}
                          </Button>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-slate-500" />
                          <span className="font-medium text-slate-800">{linkedBankAccount.accountNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-slate-500" />
                          <span>{getBankName(linkedBankAccount.bankBin)}</span>
                        </div>
                      </div>
                      {linkedBankAccount.note && (
                        <div className="text-xs text-slate-500 border-t border-slate-100 pt-2">
                          {linkedBankAccount.note}
                        </div>
                      )}
                    </div>

                    {linkedBankAccount.qrCodeUrl && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:p-4 space-y-3 h-full">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <p className="text-xs uppercase text-slate-500">{t('wallet.qr_transfer_code')}</p>
                            <span className="text-xs text-slate-500">{t('wallet.scan_to_receive')}</span>
                            {linkedBankAccount.updatedAt && (
                              <p className="text-xs text-slate-500">
                                {t('wallet.updated')}: {new Date(linkedBankAccount.updatedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" onClick={handleDownloadQr} className="gap-1 text-amber-700">
                            <Download className="h-4 w-4" />
                            {t('wallet.save_qr')}
                          </Button>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-center shadow-sm">
                          <img
                            src={linkedBankAccount.qrCodeUrl}
                            alt="QR Code"
                            className="w-36 h-36 sm:w-40 sm:h-40 object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <div className="flex justify-end pb-4 px-6">
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600"
                onClick={openBankLinkDialog}
                disabled={!selectedWallet}
              >
                {t('wallet.link_now')}
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid gap-5 xl:gap-6">
          <Card className="border border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-amber-600" />
                  {t('wallet.withdrawal_timeline')}
                </CardTitle>
                <p className="text-sm text-slate-500">
                  {activeBranchName
                    ? t('wallet.show_transactions', { branch: activeBranchName })
                    : t('wallet.select_wallet_to_view_history')}
                </p>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Banknote className="h-4 w-4" />
                {activeBranchName || t('wallet.no_branch_selected')}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {withdrawalsLoading ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('wallet.loading_withdrawal_history')}
                </div>
              ) : !selectedWallet ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-600">
                  {t('wallet.select_wallet_to_view_withdrawal_history')}
                </div>
              ) : withdrawals.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-600">
                  {t('wallet.no_withdrawals')}
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((withdrawal, index) => {
                    const status = withdrawalStatuses[withdrawal.status] || withdrawalStatuses.PENDING_PAYOUT;
                    const isLast = index === withdrawals.length - 1;
                    return (
                      <div key={withdrawal._id} className="relative pl-5">
                        <span
                          className={cn(
                            'absolute left-0 top-5 h-2.5 w-2.5 rounded-full shadow-[0_0_0_4px_rgba(0,0,0,0.03)]',
                            status.dotClass
                          )}
                        />
                        {!isLast && <span className="absolute left-[5px] top-7 h-full w-px bg-slate-200" />}
                        <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center">
                                <Banknote className="h-5 w-5" />
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs uppercase text-slate-500">
                                  {t('wallet.withdraw_to_account')}
                                </div>
                                <div className="text-xl font-semibold text-slate-900">
                                  {withdrawal.amount?.toLocaleString()} {currencyLabel}
                                </div>
                                <div className="text-sm text-slate-500 flex items-center gap-2">
                                  <Clock3 className="h-4 w-4 text-slate-400" />
                                  {formatDateTime(withdrawal.createdAt)}
                                </div>
                              </div>
                            </div>
                            <Badge className={cn('w-fit', status.className)} variant="outline">
                              {status.label}
                            </Badge>
                          </div>
                          <div className="mt-3 grid gap-2 md:grid-cols-3 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-slate-500" />
                              <span className="font-medium text-slate-700">{withdrawal.toAccountNumber}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Banknote className="h-4 w-4 text-slate-500" />
                              <span>{getBankName(withdrawal.toBin)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock3 className="h-4 w-4 text-slate-500" />
                              <span>{withdrawal.description || t('wallet.no_note')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={withdrawalDialogOpen}
        onOpenChange={(open) => {
          setWithdrawalDialogOpen(open);
          if (!open) {
            setBankPopoverOpen(false);
            setBankSearchValue('');
            // Reset form when closing
            setForm({
              branchId: '',
              amount: '',
              toBin: '',
              selectedBank: '',
              toAccountNumber: '',
              toAccountName: '',
              description: '',
              useLinkedBank: false
            });
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-xl">{t('wallet.create_withdrawal')}</DialogTitle>
            <DialogDescription>{t('wallet.withdrawal_description')}</DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase text-slate-500">{t('wallet.selected_wallet')}</p>
                <div className="font-semibold text-slate-900">{activeBranchName || t('wallet.no_wallet_selected')}</div>
                <p className="text-sm text-slate-600">
                  {t('wallet.available')}:{' '}
                  <span className="font-semibold">
                    {activeBalances.available.toLocaleString()} {currencyLabel}
                  </span>
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full sm:w-auto">
                <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                  <div className="text-[11px] uppercase text-slate-500">{t('wallet.total')}</div>
                  <div className="font-semibold">
                    {activeBalances.total.toLocaleString()} {currencyLabel}
                  </div>
                </div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
                  <div className="text-[11px] uppercase text-emerald-700">{t('wallet.available')}</div>
                  <div className="font-semibold text-emerald-800">{activeBalances.available.toLocaleString()}</div>
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                  <div className="text-[11px] uppercase text-amber-700">{t('wallet.processing')}</div>
                  <div className="font-semibold text-amber-800">{activeBalances.locked.toLocaleString()}</div>
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              {t('wallet.payos_processing_note')}
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleCreateWithdrawal}>
            {/* Linked Bank Account Selection */}
            {linkedBankAccount && linkedBankAccount.branchId === selectedWallet?.branchId && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-emerald-700" />
                    <Label className="text-sm font-medium text-emerald-900">{t('wallet.use_linked_bank')}</Label>
                  </div>
                  <Button
                    type="button"
                    variant={form.useLinkedBank ? 'default' : 'outline'}
                    size="sm"
                    className={cn(form.useLinkedBank && 'bg-emerald-600 hover:bg-emerald-700', 'h-8')}
                    onClick={() => {
                      if (form.useLinkedBank) {
                        // Unselect linked bank
                        setForm({
                          ...form,
                          useLinkedBank: false,
                          selectedBank: '',
                          toBin: '',
                          toAccountNumber: '',
                          toAccountName: ''
                        });
                      } else {
                        // Use linked bank
                        setForm({
                          ...form,
                          useLinkedBank: true,
                          selectedBank: linkedBankAccount.bankBin,
                          toBin: linkedBankAccount.bankBin,
                          toAccountNumber: linkedBankAccount.accountNumber,
                          toAccountName: linkedBankAccount.accountName
                        });
                      }
                    }}
                  >
                    {form.useLinkedBank ? t('wallet.using') : t('wallet.select')}
                  </Button>
                </div>
                {form.useLinkedBank && (
                  <div className="text-sm text-emerald-800 space-y-1 pt-2 border-t border-emerald-200">
                    <div className="font-medium">{linkedBankAccount.accountName}</div>
                    <div className="text-xs text-emerald-700">
                      {linkedBankAccount.accountNumber} - {getBankName(linkedBankAccount.bankBin)}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">{t('wallet.amount')}</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  min={0}
                  placeholder={t('wallet.enter_amount')}
                  className="mt-1"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('wallet.select_bank')}</Label>
                <Popover
                  open={bankPopoverOpen}
                  onOpenChange={(open) => {
                    setBankPopoverOpen(open);
                    if (!open) {
                      setBankSearchValue('');
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn('w-full justify-between h-11', !form.selectedBank && 'text-muted-foreground')}
                      disabled={form.useLinkedBank}
                    >
                      {form.selectedBank ? getBankName(form.selectedBank) : t('wallet.select_bank')}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 z-[102]" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Tìm: MBBank, TPBank, Vietcom..."
                        value={bankSearchValue}
                        onValueChange={setBankSearchValue}
                      />
                      <CommandEmpty>Không tìm thấy ngân hàng.</CommandEmpty>
                      <CommandGroup>
                        <CommandList>
                          {filteredBanks.map((bank) => {
                            const isSelected = form.selectedBank === bank.bin;
                            return (
                              <CommandItem
                                key={bank.bin}
                                value={bank.name}
                                onSelect={() => {
                                  if (isSelected) {
                                    setForm({
                                      ...form,
                                      selectedBank: '',
                                      toBin: '',
                                      useLinkedBank: false
                                    });
                                  } else {
                                    setForm({
                                      ...form,
                                      selectedBank: bank.bin,
                                      toBin: bank.bin,
                                      useLinkedBank: false
                                    });
                                  }
                                  setBankPopoverOpen(false);
                                  setBankSearchValue('');
                                }}
                              >
                                <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                                {bank.name}
                              </CommandItem>
                            );
                          })}
                        </CommandList>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>{t('wallet.account_number')}</Label>
                <Input
                  value={form.toAccountNumber}
                  onChange={(e) => setForm({ ...form, toAccountNumber: e.target.value, useLinkedBank: false })}
                  placeholder={t('wallet.enter_account_number_placeholder')}
                  className="mt-1"
                  disabled={form.useLinkedBank}
                />
              </div>
              <div>
                <Label>{t('wallet.account_name_optional')}</Label>
                <Input
                  value={form.toAccountName}
                  onChange={(e) => setForm({ ...form, toAccountName: e.target.value, useLinkedBank: false })}
                  placeholder={t('wallet.recipient_name')}
                  className="mt-1"
                  disabled={form.useLinkedBank}
                />
              </div>
            </div>
            <div>
              <Label>{t('wallet.note_max_chars')}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('wallet.note_example')}
                className="mt-1"
                maxLength={25}
              />
              <div className="text-xs text-slate-500 text-right mt-1">{form.description.length}/25</div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  {t('common.cancel')}
                </Button>
              </DialogClose>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600" disabled={submitting}>
                {submitting ? t('wallet.creating') : t('wallet.create_withdrawal')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={bankLinkDialogOpen}
        onOpenChange={(open) => {
          setBankLinkDialogOpen(open);
          if (!open) {
            setBankAccountPopoverOpen(false);
            setBankAccountSearchValue('');
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-xl">{t('wallet.link_bank_account_title')}</DialogTitle>
            <DialogDescription>
              {t('wallet.link_bank_account_description', {
                branch: activeBranchName || selectedWallet?.branchId || t('wallet.selected')
              })}
            </DialogDescription>
          </DialogHeader>

          {loadingBankAccount ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('wallet.loading_info')}
            </div>
          ) : !selectedWallet ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-600 text-center">
              {t('wallet.select_wallet_to_link_bank')}
            </div>
          ) : (
            <form id="bank-link-form" onSubmit={handleSaveBankAccount} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-[1.05fr_1fr]">
                <div className="space-y-2">
                  <Label className="text-sm">{t('wallet.bank_qr_code')}</Label>
                  <div className="mt-1">
                    {qrCodePreview ? (
                      <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                          <img
                            src={qrCodePreview}
                            alt="QR Code"
                            className="w-full max-w-[220px] h-auto mx-auto rounded"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-8 w-8 p-0"
                          onClick={handleRemoveQrCode}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-slate-400" />
                          <p className="mb-2 text-sm text-slate-500">
                            <span className="font-semibold">{t('wallet.click_to_upload')}</span>{' '}
                            {t('wallet.or_drag_drop')}
                          </p>
                          <p className="text-xs text-slate-500">{t('wallet.image_formats')}</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleQrCodeUpload} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>{t('wallet.bank')}</Label>
                    <Popover
                      open={bankAccountPopoverOpen}
                      onOpenChange={(open) => {
                        setBankAccountPopoverOpen(open);
                        if (!open) {
                          setBankAccountSearchValue('');
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-full justify-between h-11 mt-1',
                            !bankAccountForm.selectedBank && 'text-muted-foreground'
                          )}
                        >
                          {bankAccountForm.selectedBank
                            ? getBankName(bankAccountForm.selectedBank)
                            : t('wallet.select_bank')}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 z-[102]" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder={t('wallet.search_bank_placeholder')}
                            value={bankAccountSearchValue}
                            onValueChange={setBankAccountSearchValue}
                          />
                          <CommandEmpty>{t('wallet.bank_not_found')}</CommandEmpty>
                          <CommandGroup>
                            <CommandList>
                              {filteredBanksForAccount.map((bank) => {
                                const isSelected = bankAccountForm.selectedBank === bank.bin;
                                return (
                                  <CommandItem
                                    key={bank.bin}
                                    value={bank.name}
                                    onSelect={() => {
                                      setBankAccountForm({
                                        ...bankAccountForm,
                                        selectedBank: bank.bin,
                                        bankBin: bank.bin
                                      });
                                      setBankAccountPopoverOpen(false);
                                      setBankAccountSearchValue('');
                                    }}
                                  >
                                    <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                                    {bank.name}
                                  </CommandItem>
                                );
                              })}
                            </CommandList>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label>{t('wallet.account_number')}</Label>
                      <Input
                        value={bankAccountForm.accountNumber}
                        onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountNumber: e.target.value })}
                        placeholder={t('wallet.enter_account_number_placeholder')}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label>{t('wallet.account_name')}</Label>
                      <Input
                        value={bankAccountForm.accountName}
                        onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountName: e.target.value })}
                        placeholder={t('wallet.enter_account_owner_name')}
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label>{t('wallet.note_optional')}</Label>
                <Textarea
                  value={bankAccountForm.note}
                  onChange={(e) => setBankAccountForm({ ...bankAccountForm, note: e.target.value })}
                  placeholder={t('wallet.bank_account_note_placeholder')}
                  className="mt-1"
                  rows={2}
                />
              </div>

              {linkedBankAccount && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
                  <div className="text-xs uppercase text-emerald-700 mb-1">{t('wallet.linked')}</div>
                  <div className="text-sm text-emerald-900">
                    <div className="font-medium">{linkedBankAccount.accountName}</div>
                    <div className="text-xs text-emerald-700 mt-1">
                      {linkedBankAccount.accountNumber} - {getBankName(linkedBankAccount.bankBin)}
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="justify-end">
                <Button type="submit" className="bg-amber-500 hover:bg-amber-600" disabled={savingBankAccount}>
                  {savingBankAccount ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('wallet.saving')}
                    </>
                  ) : linkedBankAccount ? (
                    t('wallet.update_link')
                  ) : (
                    t('wallet.link_account')
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WalletPage;
