import { api } from './api';

export const walletApi = {
  getWallets: async () => {
    const res = await api.get('/wallets');
    return res.data?.data;
  },
  getLedger: async (walletId: string, limit?: number) => {
    const res = await api.get(`/wallets/${walletId}/ledger`, { params: { limit } });
    return res.data?.data;
  },
  createWithdrawal: async (
    branchId: string,
    payload: {
      amount: number;
      toBin: string;
      toAccountNumber: string;
      toAccountName?: string;
      description?: string;
    }
  ) => {
    const res = await api.post(`/wallets/${branchId}/withdrawals`, payload);
    return res.data?.data;
  },
  cancelWithdrawal: async (withdrawalId: string) => {
    const res = await api.post(`/wallets/withdrawals/${withdrawalId}/cancel`);
    return res.data?.data;
  },
  listWithdrawals: async (branchId?: string) => {
    const res = await api.get('/wallets/withdrawals', { params: { branchId } });
    return res.data?.data;
  }
};
