import { useSocket as useSocketContext } from '@/contexts/SocketContext';

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
    setToken
  } = useSocket();
  return {
    connect,
    disconnect,
    reconnect,
    ping,
    checkPendingNotifications,
    forceDeliverNotifications,
    testNotificationSystem,
    setToken
  };
};
