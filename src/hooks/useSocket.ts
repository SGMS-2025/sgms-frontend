import { useEffect, useCallback } from 'react';
import { useSocket as useSocketContext } from '@/contexts/SocketContext';
import { socketService } from '@/services/socket/socketService';
import { paymentApi } from '@/services/api/paymentApi';
import type { PaymentUpdateEvent } from '@/types/api/Socket';

// Re-export the useSocket hook from context for convenience
export const useSocket = useSocketContext;

// Additional helper hooks for specific use cases
export const useSocketConnection = () => {
  const { state } = useSocket();
  return {
    isConnected: state.isConnected,
    connectionStatus: state.connectionStatus,
    isLoading: state.isLoading
  };
};

export const useSocketNotifications = () => {
  const { state, markAsRead, markAllAsRead, clearNotification, clearAllNotifications } = useSocket();
  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications
  };
};

export const useSocketActions = () => {
  const {
    connect,
    disconnect,
    reconnect,
    ping,
    checkPendingNotifications,
    forceDeliverNotifications,
    testNotificationSystem,
    setToken,
    checkTokenFromHeaders
  } = useSocket();
  return {
    connect,
    disconnect,
    reconnect,
    ping,
    checkPendingNotifications,
    forceDeliverNotifications,
    testNotificationSystem,
    setToken,
    checkTokenFromHeaders
  };
};

/**
 * Payment update data from WebSocket
 */
export type PaymentUpdateData = PaymentUpdateEvent;

const PAYMENT_STATUS_VALUES: Array<NonNullable<PaymentUpdateEvent['status']>> = [
  'PENDING',
  'PROCESSING',
  'PAID',
  'CANCELLED'
];

const normalizePaymentStatus = (rawStatus?: string): PaymentUpdateEvent['status'] | undefined => {
  if (!rawStatus) {
    return undefined;
  }
  const upperStatus = rawStatus.toUpperCase();
  return PAYMENT_STATUS_VALUES.includes(upperStatus as NonNullable<PaymentUpdateEvent['status']>)
    ? (upperStatus as PaymentUpdateEvent['status'])
    : undefined;
};

/**
 * Hook for subscribing to payment status updates via WebSocket
 * Uses socketService directly to listen to payment events
 * @param orderCode PayOS order code to listen for
 * @param onPaymentUpdate Callback when payment status changes
 */
export const usePaymentSocket = (
  orderCode: number | null,
  onPaymentUpdate: (data: PaymentUpdateData) => void,
  options: { paymentLinkId?: string; onFallback?: () => void } = {}
) => {
  const { state } = useSocket();

  const fetchLatestStatus = useCallback(async () => {
    if (!options.paymentLinkId) return;

    await paymentApi
      .getPayOSPaymentStatus(options.paymentLinkId, orderCode || undefined)
      .then((response) => {
        const status = response?.data?.status ?? (response as { status?: string })?.status;
        const normalizedStatus = normalizePaymentStatus(status);
        if (status) {
          const payload: PaymentUpdateData = {
            orderCode: orderCode ?? undefined,
            metadata: {
              payos: {
                orderCode,
                rawStatus: status
              }
            }
          };

          if (normalizedStatus) {
            payload.status = normalizedStatus;
          }

          onPaymentUpdate(payload);
        }
      })
      .catch((error) => {
        console.error('[usePaymentSocket] Failed to fetch PayOS status fallback:', error);
      })
      .finally(() => {
        options.onFallback?.();
      });
  }, [options, orderCode, onPaymentUpdate]);

  useEffect(() => {
    if (!orderCode || !state.isConnected) {
      if (!state.isConnected) {
        void fetchLatestStatus();
      }
      return;
    }

    const handlePaymentUpdate = (data: PaymentUpdateData) => {
      const meta = data?.metadata;
      const payosMeta =
        meta && typeof (meta as { payos?: unknown }).payos === 'object'
          ? ((meta as { payos?: unknown }).payos as Record<string, unknown>)
          : undefined;
      const metaOrderCode = payosMeta?.orderCode;

      const matchesOrder =
        data?.orderCode === orderCode ||
        (typeof metaOrderCode === 'number' && metaOrderCode === orderCode) ||
        (typeof metaOrderCode === 'string' && Number(metaOrderCode) === orderCode);

      if (matchesOrder) {
        console.log('[PaymentSocket] Payment update received:', data);
        onPaymentUpdate(data);
      }
    };

    socketService.on('payment:updated', handlePaymentUpdate);

    return () => {
      socketService.off('payment:updated', handlePaymentUpdate);
    };
  }, [orderCode, onPaymentUpdate, state.isConnected, fetchLatestStatus]);
};
