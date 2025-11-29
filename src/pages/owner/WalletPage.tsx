import React, { useEffect, useMemo, useState } from 'react';
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
  PlusCircle,
  History,
  CreditCard,
  Clock3,
  Loader2
} from 'lucide-react';
import { cn } from '@/utils/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Danh sách ngân hàng với mã BIN
const BANK_LIST = [
  { bin: '422589', name: 'Ngân hàng TNHH MTV CIMB Việt Nam (CIMB)' },
  { bin: '458761', name: 'Ngân hàng TNHH MTV HSBC (Việt Nam) (HSBC)' },
  { bin: '546034', name: 'Ngân hàng số CAKE by VPBank (CAKE)' },
  { bin: '546035', name: 'Ngân hàng số Ubank by VPBank (Ubank)' },
  { bin: '668888', name: 'Ngân hàng Đại chúng TNHH Kasikornbank (KBank)' },
  { bin: '796500', name: 'DBS Bank Ltd - Chi nhánh TP. Hồ Chí Minh (DBSBank)' },
  { bin: '801011', name: 'Ngân hàng Nonghyup - Chi nhánh Hà Nội (Nonghyup)' },
  { bin: '970400', name: 'Ngân hàng TMCP Sài Gòn Công Thương (SaigonBank)' },
  { bin: '970403', name: 'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)' },
  { bin: '970405', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)' },
  { bin: '970406', name: 'Ngân hàng TMCP Đông Á (DongABank)' },
  { bin: '970407', name: 'Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)' },
  { bin: '970408', name: 'Ngân hàng Thương mại TNHH MTV Dầu Khí Toàn Cầu (GPBank)' },
  { bin: '970409', name: 'Ngân hàng TMCP Bắc Á (BacABank)' },
  { bin: '970410', name: 'Ngân hàng Standard Chartered Việt Nam (Standard Chartered)' },
  { bin: '970412', name: 'Ngân hàng TMCP Đại Chúng Việt Nam (PVcomBank)' },
  { bin: '970414', name: 'Ngân hàng Thương mại TNHH MTV Đại Dương (Oceanbank)' },
  { bin: '970415', name: 'Ngân hàng TMCP Công thương Việt Nam (VietinBank)' },
  { bin: '970416', name: 'Ngân hàng TMCP Á Châu (ACB)' },
  { bin: '970418', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)' },
  { bin: '970419', name: 'Ngân hàng TMCP Quốc Dân (NCB)' },
  { bin: '970421', name: 'Ngân hàng Liên doanh Việt - Nga (VRB)' },
  { bin: '970422', name: 'Ngân hàng TMCP Quân đội (MBBank)' },
  { bin: '970423', name: 'Ngân hàng TMCP Tiên Phong (TPBank)' },
  { bin: '970424', name: 'Ngân hàng TNHH MTV Shinhan Việt Nam (ShinhanBank)' },
  { bin: '970425', name: 'Ngân hàng TMCP An Bình (ABBANK)' },
  { bin: '970426', name: 'Ngân hàng TMCP Hàng Hải (MSB)' },
  { bin: '970427', name: 'Ngân hàng TMCP Việt Á (VietABank)' },
  { bin: '970428', name: 'Ngân hàng TMCP Nam Á (NamABank)' },
  { bin: '970429', name: 'Ngân hàng TMCP Sài Gòn (SCB)' },
  { bin: '970430', name: 'Ngân hàng TMCP Xăng dầu Petrolimex (PGBank)' },
  { bin: '970431', name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam (Eximbank)' },
  { bin: '970432', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)' },
  { bin: '970433', name: 'Ngân hàng TMCP Việt Nam Thương Tín (VietBank)' },
  { bin: '970434', name: 'Ngân hàng TNHH Indovina (IndovinaBank)' },
  { bin: '970436', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)' },
  { bin: '970437', name: 'Ngân hàng TMCP PT Thành phố Hồ Chí Minh (HDBank)' },
  { bin: '970438', name: 'Ngân hàng TMCP Bảo Việt (BaoVietBank)' },
  { bin: '970439', name: 'Ngân hàng TNHH MTV Public Việt Nam (PublicBank)' },
  { bin: '970440', name: 'Ngân hàng TMCP Đông Nam Á (SeABank)' },
  { bin: '970441', name: 'Ngân hàng TMCP Quốc tế Việt Nam (VIB)' },
  { bin: '970442', name: 'Ngân hàng TNHH MTV Hong Leong Việt Nam (HongLeong)' },
  { bin: '970443', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)' },
  { bin: '970444', name: 'Ngân hàng TM TNHH MTV Xây dựng Việt Nam (CBBank)' },
  { bin: '970446', name: 'Ngân hàng Hợp tác xã Việt Nam (COOPBANK)' },
  { bin: '970448', name: 'Ngân hàng TMCP Phương Đông (OCB)' },
  { bin: '970449', name: 'Ngân hàng TMCP Bưu Điện Liên Việt (LienVietPostBank)' },
  { bin: '970452', name: 'Ngân hàng TMCP Kiên Long (KienLongBank)' },
  { bin: '970454', name: 'Ngân hàng TMCP Bản Việt (VietCapitalBank)' },
  { bin: '970455', name: 'Ngân hàng Công nghiệp Hàn Quốc - Chi nhánh Hà Nội (IBKHN)' },
  { bin: '970456', name: 'Ngân hàng Công nghiệp Hàn Quốc - Chi nhánh TP. Hồ Chí Minh (IBKHCM)' },
  { bin: '970457', name: 'Ngân hàng TNHH MTV Woori Việt Nam (Woori)' },
  { bin: '970458', name: 'Ngân hàng United Overseas - Chi nhánh TP. Hồ Chí Minh (United Overseas)' },
  { bin: '970462', name: 'Ngân hàng Kookmin - Chi nhánh Hà Nội (KookminHN)' },
  { bin: '970463', name: 'Ngân hàng Kookmin - Chi nhánh Tp. Hồ Chí Minh (KookminHCM)' }
];

type Wallet = {
  _id: string;
  branchId: string;
  balance: number;
  availableBalance: number;
  lockedBalance: number;
  currency?: string;
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

const WalletPage: React.FC = () => {
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
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);

  // Helper function to get branch name from branchId
  const getBranchName = (branchId: string): string => {
    const branch = branches.find((b) => b._id === branchId);
    return branch?.branchName || branchId;
  };

  const getBankName = (bin: string): string => BANK_LIST.find((bank) => bank.bin === bin)?.name || bin;

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
      toast.error('Không thể tải ví');
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
      toast.error('Không thể tải lịch sử rút');
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
  }, [selectedWallet?.branchId]);

  const handleOpenWithdrawalDialog = () => {
    if (!selectedWallet) {
      toast.error('Chọn ví để tạo lệnh rút');
      return;
    }
    setForm((prev) => ({ ...prev, branchId: selectedWallet.branchId }));
    setWithdrawalDialogOpen(true);
  };

  const handleCreateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-get branchId from selected wallet
    const branchIdToUse = selectedWallet?.branchId || form.branchId;
    if (!branchIdToUse) {
      toast.error('Chọn ví để tạo lệnh rút');
      return;
    }
    const amountNumber = Number(form.amount);
    if (!amountNumber || amountNumber <= 0) {
      toast.error('Số tiền không hợp lệ');
      return;
    }
    if (!form.toBin) {
      toast.error('Chọn ngân hàng nhận');
      return;
    }
    if (!form.toAccountNumber.trim()) {
      toast.error('Nhập số tài khoản nhận');
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
      toast.success('Tạo lệnh rút thành công');
      setForm((prev) => ({
        ...prev,
        branchId: branchIdToUse,
        amount: '',
        description: '',
        selectedBank: '',
        toBin: '',
        toAccountNumber: '',
        toAccountName: ''
      }));
      setWithdrawalDialogOpen(false);
      setBankPopoverOpen(false);
      setBankSearchValue('');
      await loadWallets();
      await loadWithdrawals(branchIdToUse);
    } catch (_error) {
      toast.error('Tạo lệnh rút thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      hour12: false
    });

  const withdrawalStatuses: Record<Withdrawal['status'], { label: string; className: string }> = {
    PENDING_PAYOUT: { label: 'Đang xử lý payout', className: 'bg-amber-50 text-amber-700 border border-amber-100' },
    SUCCESS: { label: 'Đã rút thành công', className: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
    FAILED: { label: 'Thất bại', className: 'bg-rose-50 text-rose-700 border border-rose-100' },
    CANCELED: { label: 'Đã huỷ', className: 'bg-slate-100 text-slate-600 border border-slate-200' }
  };

  const activeBranchName = selectedWallet ? getBranchName(selectedWallet.branchId) : currentBranch?.branchName || '';
  const currencyLabel = selectedWallet?.currency || 'VND';
  const activeBalances = {
    total: selectedWallet?.balance ?? 0,
    available: selectedWallet?.availableBalance ?? 0,
    locked: selectedWallet?.lockedBalance ?? 0
  };

  return (
    <>
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-600 text-white shadow-lg">
          <div className="absolute inset-0 bg-grid-white/10 bg-[size:18px_18px] opacity-20" />
          <div className="relative p-6 md:p-8 space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-amber-200">
                  <WalletIcon className="h-4 w-4" />
                  Ví chi nhánh
                </div>
                <h1 className="text-3xl font-semibold">Quản lý số dư & rút tiền</h1>
                <p className="text-sm text-slate-200/80">
                  Layout tương tự các hệ thống lớn: hành động chính đặt nổi, thông tin phụ tách thẻ rõ ràng.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                  onClick={loadWallets}
                  disabled={loading}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  {loading ? 'Đang tải...' : 'Làm mới'}
                </Button>
                <Button className="bg-white text-slate-900 hover:bg-slate-100" onClick={handleOpenWithdrawalDialog}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Tạo lệnh rút
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm">
                <div className="text-xs uppercase text-amber-100">Tổng số dư</div>
                <div className="text-2xl font-semibold mt-1">
                  {activeBalances.total.toLocaleString()} {currencyLabel}
                </div>
                <div className="text-sm text-slate-200/80">
                  {activeBranchName ? `Chi nhánh ${activeBranchName}` : 'Chọn ví để xem chi tiết'}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm">
                <div className="text-xs uppercase text-amber-100 flex items-center gap-2">
                  <Unlock className="h-4 w-4" />
                  Khả dụng
                </div>
                <div className="text-xl font-semibold mt-1">{activeBalances.available.toLocaleString()}</div>
                <div className="text-sm text-slate-200/80">Sẵn sàng rút ngay</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm">
                <div className="text-xs uppercase text-amber-100 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Đang xử lý payout
                </div>
                <div className="text-xl font-semibold mt-1">{activeBalances.locked.toLocaleString()}</div>
                <div className="text-sm text-slate-200/80">Chờ đối soát từ PayOS</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Chọn ví chi nhánh để xem số dư, mở dialog rút tiền và theo dõi lịch sử theo chi nhánh.
            </div>
            <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1">
              <WalletIcon className="h-4 w-4" />
              {filteredWallets.length} ví
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
            {filteredWallets.map((wallet) => {
              const isActive = selectedWalletId === wallet._id;
              return (
                <Card
                  key={wallet._id}
                  className={cn(
                    'cursor-pointer transition-all h-full border-2 rounded-xl',
                    isActive
                      ? 'border-amber-500 shadow-lg shadow-amber-500/15 ring-2 ring-amber-100'
                      : 'border-slate-200 hover:border-amber-200 hover:shadow-sm'
                  )}
                  onClick={() => {
                    setSelectedWalletId(wallet._id);
                    setForm((prev) => ({ ...prev, branchId: wallet.branchId }));
                  }}
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'h-10 w-10 rounded-full flex items-center justify-center',
                            isActive ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                          )}
                        >
                          <WalletIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs uppercase text-slate-500">Chi nhánh</p>
                          <CardTitle className="text-lg leading-tight">{getBranchName(wallet.branchId)}</CardTitle>
                        </div>
                      </div>
                      <Badge variant={isActive ? 'default' : 'secondary'} className="capitalize">
                        {isActive ? 'Đang xem' : 'Chọn ví'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white border border-slate-100 p-3 shadow-sm">
                        <div className="text-xs text-slate-500">Tổng số dư</div>
                        <div className="text-xl font-semibold">
                          {wallet.balance?.toLocaleString()} {wallet.currency || 'VND'}
                        </div>
                      </div>
                      <div className="rounded-lg bg-amber-50/70 border border-amber-100 p-3">
                        <div className="text-xs text-amber-700 flex items-center gap-1">
                          <Unlock className="h-3.5 w-3.5" />
                          Khả dụng
                        </div>
                        <div className="text-lg font-semibold text-amber-800">
                          {wallet.availableBalance?.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-amber-600" />
                        <div>
                          <div className="uppercase text-[11px] text-slate-500">Đang xử lý payout</div>
                          <div className="font-semibold text-slate-800">{wallet.lockedBalance?.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-amber-700">
                        <History className="h-4 w-4" />
                        Nhấn để mở rút tiền
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
            {!filteredWallets.length && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-slate-500">
                  {currentBranch
                    ? `Chưa có ví cho chi nhánh ${currentBranch.branchName || currentBranch._id}`
                    : 'Chưa có ví nào.'}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-amber-600" />
                  Lịch sử rút theo chi nhánh
                </CardTitle>
                <p className="text-sm text-slate-500">
                  {activeBranchName ? `Hiển thị giao dịch của ${activeBranchName}.` : 'Chọn ví để xem lịch sử rút.'}
                </p>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Banknote className="h-4 w-4" />
                {activeBranchName || 'Chưa chọn chi nhánh'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {withdrawalsLoading ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải lịch sử rút...
                </div>
              ) : !selectedWallet ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-600">
                  Chọn một ví chi nhánh để xem lịch sử rút tiền.
                </div>
              ) : withdrawals.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-600">
                  Chưa có lệnh rút cho chi nhánh này. Nhấn "Tạo lệnh rút" để bắt đầu.
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((withdrawal) => {
                    const status = withdrawalStatuses[withdrawal.status] || withdrawalStatuses.PENDING_PAYOUT;
                    return (
                      <div
                        key={withdrawal._id}
                        className="rounded-xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center">
                              <Banknote className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-xs uppercase text-slate-500">Rút về tài khoản</div>
                              <div className="text-lg font-semibold">
                                {withdrawal.amount?.toLocaleString()} {currencyLabel}
                              </div>
                              <div className="text-sm text-slate-500">{formatDateTime(withdrawal.createdAt)}</div>
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
                            <span>{withdrawal.description || 'Không có ghi chú'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quy trình rút tiền an toàn</CardTitle>
              <p className="text-sm text-slate-500">
                Tách dialog rút tiền, thẻ số dư to vừa màn hình và lịch sử lọc theo chi nhánh.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div className="rounded-lg border border-amber-100 bg-amber-50/70 p-3">
                <div className="font-medium text-amber-900">Rút tiền qua dialog</div>
                <p className="text-amber-800">Nhấn "Tạo lệnh rút" hoặc card ví để mở form rút tiền nhanh.</p>
              </div>
              <ul className="space-y-2 list-disc list-inside">
                <li>Ưu tiên chọn đúng chi nhánh để lịch sử hiển thị chính xác.</li>
                <li>Kiểm tra kỹ số tài khoản, ngân hàng và nội dung chuyển.</li>
                <li>Khả dụng giảm ngay khi tạo lệnh, khoản chờ xử lý nằm ở mục "Đang xử lý payout".</li>
                <li>Sử dụng nút "Làm mới" để đồng bộ số dư với PayOS trước khi tạo lệnh mới.</li>
              </ul>
              <Button variant="outline" className="w-full" onClick={handleOpenWithdrawalDialog}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Mở dialog rút tiền
              </Button>
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
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-xl">Tạo lệnh rút</DialogTitle>
            <DialogDescription>Tiền sẽ được trừ/khóa từ ví đang chọn và xử lý qua PayOS Payout.</DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase text-slate-500">Ví đang chọn</p>
              <div className="font-semibold text-slate-900">{activeBranchName || 'Chưa chọn ví'}</div>
              <p className="text-sm text-slate-600">
                Khả dụng:{' '}
                <span className="font-semibold">
                  {activeBalances.available.toLocaleString()} {currencyLabel}
                </span>
              </p>
            </div>
            <div className="text-right text-sm text-slate-600">
              <div>
                Tổng số dư:{' '}
                <span className="font-semibold text-slate-900">
                  {activeBalances.total.toLocaleString()} {currencyLabel}
                </span>
              </div>
              <div className="text-xs text-slate-500">Đang xử lý payout: {activeBalances.locked.toLocaleString()}</div>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleCreateWithdrawal}>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Số tiền</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  min={0}
                  placeholder="Nhập số tiền muốn rút"
                  className="mt-1"
                />
              </div>
              <div className="space-y-2">
                <Label>Chọn ngân hàng</Label>
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
                    >
                      {form.selectedBank ? getBankName(form.selectedBank) : 'Chọn ngân hàng'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
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
                                      toBin: ''
                                    });
                                  } else {
                                    setForm({
                                      ...form,
                                      selectedBank: bank.bin,
                                      toBin: bank.bin
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
                <Label>Số tài khoản</Label>
                <Input
                  value={form.toAccountNumber}
                  onChange={(e) => setForm({ ...form, toAccountNumber: e.target.value })}
                  placeholder="Nhập số tài khoản"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Tên tài khoản (tuỳ chọn)</Label>
                <Input
                  value={form.toAccountName}
                  onChange={(e) => setForm({ ...form, toAccountName: e.target.value })}
                  placeholder="Tên người nhận"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Ghi chú (tối đa 25 ký tự)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ví dụ: Rút về MB chi nhánh HN"
                className="mt-1"
                maxLength={25}
              />
              <div className="text-xs text-slate-500 text-right mt-1">{form.description.length}/25</div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Hủy
                </Button>
              </DialogClose>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600" disabled={submitting}>
                {submitting ? 'Đang tạo...' : 'Tạo lệnh rút'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WalletPage;
