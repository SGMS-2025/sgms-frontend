import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreditCard, Loader2 } from 'lucide-react';
import type { PayOSPaymentData } from '@/services/api/paymentApi';
import { PaymentInfo } from '../shared/PaymentInfo';
import { usePaymentSocket, type PaymentUpdateData } from '@/hooks/useSocket';
import { paymentApi } from '@/services/api/paymentApi';
import { toast } from 'sonner';

interface PaymentStepProps {
  contractId: string | null;
  paymentData: PayOSPaymentData | null;
  onPaymentSuccess: () => void;
  onPaymentInit?: (contractId: string) => void;
  isLoading?: boolean;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({
  contractId,
  paymentData,
  onPaymentSuccess,
  onPaymentInit,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED'>('PENDING');
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasShownPaidToast, setHasShownPaidToast] = useState(false);
  const paidNotifiedRef = React.useRef(false);
  const cancelledNotifiedRef = React.useRef(false);

  // Helper function to handle status updates
  const handleStatusUpdate = useCallback(
    (remoteStatus: string, showToast = false) => {
      if (remoteStatus === 'PAID') {
        if (showToast) toast.success(t('payment.payment_successful_prompt'));
        setPaymentStatus('PAID');
        setTimeout(() => {
          onPaymentSuccess();
        }, 1500);
      } else if (remoteStatus === 'CANCELLED') {
        if (showToast) toast.error(t('payment.payment_cancelled'));
        setPaymentStatus('CANCELLED');
      } else if (remoteStatus === 'PROCESSING') {
        if (showToast) toast.info(t('payment.status_processing'));
        setPaymentStatus('PROCESSING');
      } else if (remoteStatus === 'PENDING') {
        if (showToast) toast.info(t('payment.status_pending'));
        setPaymentStatus('PENDING');
      } else if (showToast) {
        toast.warning(t('payment.status_unknown'));
      }
    },
    [onPaymentSuccess, t]
  );

  // If payment data is not available, show loading or trigger payment creation
  React.useEffect(() => {
    if (contractId && !paymentData && onPaymentInit && !isLoading) {
      onPaymentInit(contractId);
    }
  }, [contractId, paymentData, onPaymentInit, isLoading]);

  // Initialize payment status from payment data
  useEffect(() => {
    if (paymentData) {
      const initialStatus = (paymentData?.payment as { status?: string } | undefined)?.status;
      const status =
        initialStatus && ['PENDING', 'PROCESSING', 'PAID', 'CANCELLED'].includes(initialStatus)
          ? (initialStatus as 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED')
          : 'PENDING';
      setPaymentStatus(status);
      setTimeRemaining(900);
      // Reset toast flags when payment data changes
      const isPaid = status === 'PAID';
      const isCancelled = status === 'CANCELLED';
      setHasShownPaidToast(isPaid);
      setHasShownCancelledToast(isCancelled);
      paidNotifiedRef.current = isPaid;
      cancelledNotifiedRef.current = isCancelled;
    }
  }, [paymentData]);

  // Subscribe to payment updates via WebSocket
  usePaymentSocket(
    paymentData?.orderCode || 0,
    (data: PaymentUpdateData) => {
      if (!data.status) {
        return;
      }

      // Ignore duplicate status notifications (except first PAID or CANCELLED)
      if (data.status === paymentStatus && data.status !== 'PAID' && data.status !== 'CANCELLED') {
        return;
      }

      setPaymentStatus(data.status);

      if (data.status === 'PAID') {
        if (!paidNotifiedRef.current) {
          paidNotifiedRef.current = true;
          toast.success(t('payment.payment_successful_prompt'));
          setHasShownPaidToast(true);
        }
        // Do not auto-advance; let user proceed manually to the next step
      } else if (data.status === 'CANCELLED') {
        // Only show toast if we haven't shown it yet to prevent duplicates
        if (!cancelledNotifiedRef.current) {
          cancelledNotifiedRef.current = true;
          toast.error(t('payment.payment_cancelled'));
          setHasShownCancelledToast(true);
        }
      }
    },
    {
      paymentLinkId: paymentData?.paymentLinkId,
      onFallback: () => setIsRefreshing(false)
    }
  );

  // Fallback polling in case WebSocket updates are not received
  useEffect(() => {
    if (!paymentData?.paymentLinkId || paymentStatus === 'PAID' || paymentStatus === 'CANCELLED') {
      return;
    }

    const checkPaymentStatus = () => {
      if (!paymentData.orderCode || !paymentData.paymentLinkId) return;

      paymentApi
        .getPayOSPaymentStatus(paymentData.paymentLinkId, paymentData.orderCode)
        .then((response) => {
          const apiData = response?.data;
          const remoteStatusRaw = apiData?.status;
          const remoteStatus = typeof remoteStatusRaw === 'string' ? remoteStatusRaw.toUpperCase() : null;

          if (!remoteStatus || remoteStatus === paymentStatus) return;

          // Only show toast for PAID status if not already shown
          if (remoteStatus === 'PAID' && !hasShownPaidToast) {
            handleStatusUpdate(remoteStatus, true);
            setHasShownPaidToast(true);
            paidNotifiedRef.current = true;
          } else {
            handleStatusUpdate(remoteStatus, false);
          }
        })
        .catch(() => {
          // Silently handle polling errors
        });
    };

    const pollInterval = setInterval(checkPaymentStatus, 5000);
    return () => clearInterval(pollInterval);
  }, [paymentData?.paymentLinkId, paymentData?.orderCode, paymentStatus, handleStatusUpdate, hasShownPaidToast]);

  // Countdown timer
  useEffect(() => {
    if (paymentStatus !== 'PENDING' && paymentStatus !== 'PROCESSING') {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPaymentStatus('CANCELLED');
          toast.error(t('payment.payment_expired'));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentStatus, t]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    if (!paymentData?.paymentLinkId || !paymentData?.orderCode) return;

    setIsRefreshing(true);

    paymentApi
      .getPayOSPaymentStatus(paymentData.paymentLinkId, paymentData.orderCode)
      .then((response) => {
        const apiData = response?.data;
        const remoteStatusRaw = apiData?.status;
        const remoteStatus = typeof remoteStatusRaw === 'string' ? remoteStatusRaw.toUpperCase() : null;

        if (remoteStatus) {
          handleStatusUpdate(remoteStatus, true);
        } else {
          toast.warning(t('payment.status_unknown'));
        }
      })
      .catch(() => {
        toast.error(t('payment.status_refresh_failed'));
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, [paymentData, handleStatusUpdate, t]);

  if (isLoading || !paymentData) {
    return (
      <Card className="rounded-3xl border border-border bg-card shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">
            {t('payment.creating_payment_link', 'Đang tạo link thanh toán...')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          {t('payment.title', 'Thanh toán')}
        </CardTitle>
        <CardDescription>
          {t('payment.description', 'Vui lòng quét mã QR hoặc chuyển khoản theo thông tin dưới đây')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PaymentInfo
          paymentData={paymentData}
          paymentStatus={paymentStatus}
          timeRemaining={timeRemaining}
          showActions={true}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      </CardContent>
    </Card>
  );
};
