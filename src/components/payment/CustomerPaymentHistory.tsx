import React from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PaymentSummaryCard } from './PaymentComponents';
import PaymentTransactionRow from './PaymentTransactionRow';
import PendingTransferRow from './PendingTransferRow';
import { formatCurrency } from '@/utils/currency';
import type { CustomerPaymentHistoryResponse } from '@/types/api/Payment';

interface CustomerPaymentHistoryProps {
  data: CustomerPaymentHistoryResponse | null;
  loading: boolean;
  error: string | null;
  onRefetch: () => void;
}

const CustomerPaymentHistory: React.FC<CustomerPaymentHistoryProps> = ({ data, loading, error, onRefetch }) => {
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang tải lịch sử thanh toán...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="rounded-2xl border border-destructive/40 bg-destructive/10">
        <AlertTitle>Không thể tải lịch sử thanh toán</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button size="sm" className="mt-3" onClick={onRefetch}>
          Thử tải lại
        </Button>
      </Alert>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
          <CreditCard className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">Chưa có dữ liệu</p>
          <p className="text-sm text-muted-foreground">Không thể tải thông tin thanh toán</p>
        </div>
      </div>
    );
  }

  // Debug: Log the entire payment data to see structure
  console.log('Payment data:', data);
  console.log('Transactions:', data.transactions);
  if (data.transactions.length > 0) {
    console.log('First transaction:', data.transactions[0]);
    console.log('First transaction recordedBy:', data.transactions[0].recordedBy);
  }

  // Calculate refunded amount from transactions with REFUNDED status
  const refundedAmount = data.transactions
    .filter((transaction) => transaction.status === 'REFUNDED')
    .reduce((total, transaction) => total + transaction.amount, 0);

  const refundedCount = data.transactions.filter((transaction) => transaction.status === 'REFUNDED').length;

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PaymentSummaryCard
          title="Tổng giao dịch"
          value={formatCurrency(data.summary.totalAmount)}
          caption={`${data.summary.totalTransactions} giao dịch`}
          tone="default"
        />
        <PaymentSummaryCard
          title="Đã thanh toán"
          value={formatCurrency(data.summary.totalAmount - data.summary.pendingAmount)}
          caption="Giao dịch hoàn tất"
          tone="success"
        />
        <PaymentSummaryCard
          title="Đang chờ xử lý"
          value={formatCurrency(data.summary.pendingAmount)}
          caption={`${data.pendingTransfers.length} giao dịch`}
          tone="warning"
        />
        <PaymentSummaryCard
          title="Đã hoàn tiền"
          value={formatCurrency(refundedAmount)}
          caption={`${refundedCount} giao dịch`}
          tone="danger"
        />
      </div>

      {/* Payment History Table */}
      <Card className="rounded-3xl border border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5 text-primary" />
            Lịch sử thanh toán
          </CardTitle>
          <p className="text-sm text-muted-foreground">Chi tiết các giao dịch và thanh toán của khách hàng</p>
        </CardHeader>
        <CardContent>
          {data.transactions.length === 0 && data.pendingTransfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">Chưa có giao dịch</p>
                <p className="text-sm text-muted-foreground">Khách hàng chưa có giao dịch thanh toán nào</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px] rounded-2xl border border-border/50">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-b border-border/50">
                    <TableHead className="w-40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Thời gian
                    </TableHead>
                    <TableHead className="w-52 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Dịch vụ
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Số tiền
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Phương thức
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Trạng thái
                    </TableHead>
                    <TableHead className="w-48 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Người thực hiện
                    </TableHead>
                    <TableHead className="w-56 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Mã giao dịch
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Pending Transfers */}
                  {data.pendingTransfers.map((transfer) => (
                    <PendingTransferRow key={transfer.paymentTransactionId} transfer={transfer} />
                  ))}

                  {/* Completed Transactions */}
                  {data.transactions.map((transaction) => (
                    <PaymentTransactionRow key={transaction.transactionId} transaction={transaction} />
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerPaymentHistory;
