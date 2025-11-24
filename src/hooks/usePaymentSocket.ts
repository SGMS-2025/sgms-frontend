import { useEffect, useCallback, useRef } from 'react';
import { socket } from '@/lib/socket';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface PaymentUpdatePayload {
  _id: string;
  paymentCode: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  amount: number;
  [key: string]: unknown;
}

interface PaymentSocketOptions {
  paymentTransactionId?: string;
  onPaymentUpdated?: (payment: PaymentUpdatePayload) => void;
  onPaymentPaid?: (payment: PaymentUpdatePayload) => void;
  enabled?: boolean;
}

/**
 * Custom hook to handle real-time payment updates via Socket.IO
 * Listens for payment:updated events from backend
 */
export const usePaymentSocket = (options: PaymentSocketOptions) => {
  const { t } = useTranslation();
  const { paymentTransactionId, onPaymentUpdated, onPaymentPaid, enabled = true } = options;

  const handlersRef = useRef({ onPaymentUpdated, onPaymentPaid });

  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = { onPaymentUpdated, onPaymentPaid };
  }, [onPaymentUpdated, onPaymentPaid]);

  const handlePaymentUpdate = useCallback(
    (payment: PaymentUpdatePayload) => {
      console.log('[Socket] Payment updated:', payment);

      // Only process if it's the payment we're watching
      if (paymentTransactionId && payment._id === paymentTransactionId) {
        handlersRef.current.onPaymentUpdated?.(payment);

        // If payment is paid, trigger onPaymentPaid
        if (payment.status === 'PAID') {
          console.log('[Socket] Payment paid detected:', payment.paymentCode);
          toast.success(t('subscription.payment.success'), {
            description: t('subscription.payment.successDesc')
          });
          handlersRef.current.onPaymentPaid?.(payment);
        }
      }
    },
    [paymentTransactionId, t]
  );

  useEffect(() => {
    if (!enabled || !paymentTransactionId || !socket) {
      return;
    }

    console.log('[Socket] Subscribing to payment updates:', paymentTransactionId);

    // Connect socket if not connected
    if (!socket.connected) {
      socket.connect();
    }

    // Listen for payment:updated events
    socket.on('payment:updated', handlePaymentUpdate);

    // Cleanup
    return () => {
      console.log('[Socket] Unsubscribing from payment updates');
      socket?.off('payment:updated', handlePaymentUpdate);
    };
  }, [enabled, paymentTransactionId, handlePaymentUpdate]);

  return {
    isConnected: socket?.connected || false
  };
};
