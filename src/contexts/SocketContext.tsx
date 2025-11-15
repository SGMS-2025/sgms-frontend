import { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { socketService } from '@/services/socket/socketService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { notificationApi } from '@/services/api/notificationApi';
import { translateNotificationTitle, translateNotificationMessage } from '@/utils/notificationTranslator';
import type {
  WorkShiftNotificationData,
  TimeOffNotificationData,
  RescheduleNotificationData,
  NotificationData
} from '@/types/api/Socket';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high';
  category: string;
  actions: string[];
  timestamp: Date;
  read: boolean;
}

export interface SocketState {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
}

export type SocketAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONNECTION_STATUS'; payload: 'connecting' | 'connected' | 'disconnected' | 'error' }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'CLEAR_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' }
  | { type: 'RESET_STATE' };

const initialState: SocketState = {
  isConnected: false,
  connectionStatus: 'disconnected',
  notifications: [],
  unreadCount: 0,
  isLoading: false
};

function socketReducer(state: SocketState, action: SocketAction): SocketState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        connectionStatus: action.payload
      };
    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: action.payload
      };
    case 'ADD_NOTIFICATION': {
      // Check if notification already exists to prevent duplicates
      const existingNotification = state.notifications.find((notification) => notification.id === action.payload.id);

      if (existingNotification) {
        return state;
      }

      // Also check for duplicate based on content (same title, message, and data within 5 seconds)
      const fiveSecondsAgo = new Date(Date.now() - 5000);
      const duplicateByContent = state.notifications.find((notification) => {
        const isSameTitle = notification.title === action.payload.title;
        const isSameMessage = notification.message === action.payload.message;
        const isRecent = new Date(notification.timestamp) > fiveSecondsAgo;
        const isSameType = notification.type === action.payload.type;

        return isSameTitle && isSameMessage && isRecent && isSameType;
      });

      if (duplicateByContent) {
        return state;
      }

      const newState = {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };

      return newState;
    }
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.id === action.payload ? { ...notification, read: true } : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
        unreadCount: 0
      };
    case 'CLEAR_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter((notification) => notification.id !== action.payload),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    case 'CLEAR_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
        unreadCount: 0
      };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

interface SocketContextType {
  state: SocketState;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  reconnect: () => Promise<boolean>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  ping: () => void;
  checkPendingNotifications: () => Promise<void>;
  forceDeliverNotifications: () => Promise<void>;
  testNotificationSystem: () => Promise<void>;
  setToken: (token: string) => void;
  fetchExistingNotifications: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(socketReducer, initialState);
  const { state: authState } = useAuth();
  const { t } = useTranslation();

  // Connect to socket when user is authenticated
  const connect = useCallback(async (): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });

    const success = await socketService.connect();

    if (success) {
      dispatch({ type: 'SET_CONNECTED', payload: true });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return true;
    } else {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return false;
    }
  }, [t]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    socketService.disconnect();
    dispatch({ type: 'SET_CONNECTED', payload: false });
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // Manual reconnect
  const reconnect = useCallback(async (): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });

    const success = await socketService.reconnect();
    if (success) {
      dispatch({ type: 'SET_CONNECTED', payload: true });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
      toast.success(t('socket.reconnected'));
      dispatch({ type: 'SET_LOADING', payload: false });
      return true;
    } else {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
      toast.error(t('socket.reconnect_failed'));
      dispatch({ type: 'SET_LOADING', payload: false });
      return false;
    }
  }, [t]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      // Update local state
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });

      // Also update in database if user is authenticated
      if (authState.user?._id) {
        await notificationApi.markNotificationAsRead(notificationId);
      }
    },
    [authState.user?._id]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // Update local state
    dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });

    // Also update in database if user is authenticated
    if (authState.user?._id) {
      await notificationApi.markAllNotificationsAsRead();
    }
  }, [authState.user?._id]);

  // Clear notification
  const clearNotification = useCallback((notificationId: string) => {
    dispatch({ type: 'CLEAR_NOTIFICATION', payload: notificationId });
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    // Clear from local state
    dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });

    // Also clear from database if user is authenticated
    if (authState.user?._id) {
      await notificationApi.clearAllNotifications(authState.user._id);
    }
  }, [authState.user?._id]);

  // Send ping
  const ping = useCallback(() => {
    socketService.ping();
  }, []);

  // Check pending notifications
  const checkPendingNotifications = useCallback(async () => {
    await socketService.checkPendingNotifications();
  }, []);

  // Force deliver stored notifications
  const forceDeliverNotifications = useCallback(async () => {
    await socketService.forceDeliverNotifications();
  }, []);

  // Test notification system
  const testNotificationSystem = useCallback(async () => {
    await socketService.testNotificationSystem();
  }, []);

  // Manually set token (for debugging)
  const setToken = useCallback(
    (token: string) => {
      localStorage.setItem('token', token);
      // Try to reconnect with new token
      void connect();
    },
    [connect]
  );

  // Fetch existing notifications from database
  const fetchExistingNotifications = useCallback(async () => {
    if (!authState.user?._id) {
      return;
    }

    const response = await notificationApi.getNotificationsByUserId(authState.user._id);

    if (response.success && response.data?.notifications) {
      // Convert database notifications to frontend format
      const notifications = response.data.notifications.map((dbNotification) => ({
        id: dbNotification._id,
        type: dbNotification.type || 'general',
        title: dbNotification.title,
        message: dbNotification.content, // Database uses 'content', frontend uses 'message'
        data: dbNotification.data || {},
        priority: dbNotification.priority || 'medium',
        category: dbNotification.category || 'general',
        actions: dbNotification.actions || [],
        timestamp: new Date(dbNotification.createdAt),
        read: dbNotification.read || false
      }));

      // Add notifications to state
      for (const notification of notifications) {
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      }
    }
  }, [authState.user?._id]);

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      // Pass user ID to socket service for notification handling
      if (authState.user._id) {
        localStorage.setItem('currentUserId', authState.user._id);
      }

      connect();
      fetchExistingNotifications();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [authState.isAuthenticated, authState.user]);

  // Track displayed toast IDs to prevent duplicates
  const displayedToastIds = useRef<Set<string>>(new Set());

  // Memoize notification handler to prevent stale closures
  const handleWorkShiftNotification = useCallback(
    (data: Record<string, unknown>) => {
      // Use the actual MongoDB ObjectId from the database if available
      const notificationId =
        (data.id as string) ||
        (data._id as string) ||
        // Fallback to a simple timestamp-based ID if no database ID is available
        `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const notification: Notification = {
        id: notificationId,
        type: data.type as string,
        title: data.title as string,
        message: data.message as string,
        data: data.data as Record<string, unknown>,
        priority: data.priority as 'low' | 'medium' | 'high',
        category: data.category as string,
        actions: data.actions as string[],
        timestamp: new Date(),
        read: false
      };

      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });

      // Show toast for membership and service contract notifications (realtime feedback)
      // Use notification ID to prevent duplicate toasts
      if (
        notification.category === 'membership' ||
        notification.type?.includes('membership') ||
        notification.type?.includes('servicecontract')
      ) {
        // Check if we've already shown a toast for this notification
        if (!displayedToastIds.current.has(notificationId)) {
          displayedToastIds.current.add(notificationId);

          // Clean up old IDs after 10 seconds to prevent memory leak
          setTimeout(() => {
            displayedToastIds.current.delete(notificationId);
          }, 10000);

          const priority = notification.priority || 'medium';

          // Translate notification title and message for toast display
          const translatedTitle = translateNotificationTitle(notification, t);
          const translatedMessage = translateNotificationMessage(notification, t);

          if (priority === 'high') {
            toast.success(translatedTitle, {
              description: translatedMessage,
              duration: 5000,
              id: notificationId // Use notification ID as toast ID to prevent duplicates
            });
          } else {
            toast.info(translatedTitle, {
              description: translatedMessage,
              duration: 4000,
              id: notificationId // Use notification ID as toast ID to prevent duplicates
            });
          }
        }
      }

      globalThis.dispatchEvent(
        new CustomEvent('realtime-notification', {
          detail: notification
        })
      );
    },
    [dispatch, t]
  );

  useEffect(() => {}, [dispatch]);

  // Memoize fetched notification handler
  const handleFetchedNotification = useCallback(
    (event: CustomEvent) => {
      const data = event.detail as Record<string, unknown>;
      const notification: Notification = {
        id: (data._id as string) || `notification-${Date.now()}-${Math.random()}`,
        type: data.type as string,
        title: data.title as string,
        message: data.message as string,
        data: data.data as Record<string, unknown>,
        priority: data.priority as 'low' | 'medium' | 'high',
        category: data.category as string,
        actions: data.actions as string[],
        timestamp: new Date((data.timestamp as string) || (data.createdAt as string)),
        read: (data.read as boolean) || false
      };

      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });

      // Don't show toast for fetched notifications (already stored)
      // They will be displayed in the notification panel
    },
    [dispatch]
  );

  // Memoize socket notification handlers
  const handleSocketNotification = useCallback(
    (data: WorkShiftNotificationData) => {
      handleWorkShiftNotification(data as unknown as Record<string, unknown>);
    },
    [handleWorkShiftNotification]
  );

  const handleTimeOffSocketNotification = useCallback(
    (data: TimeOffNotificationData) => {
      handleWorkShiftNotification(data as unknown as Record<string, unknown>);
    },
    [handleWorkShiftNotification]
  );

  const handleRescheduleSocketNotification = useCallback(
    (data: RescheduleNotificationData) => {
      handleWorkShiftNotification(data as unknown as Record<string, unknown>);
    },
    [handleWorkShiftNotification]
  );

  // Handle membership notifications
  const handleMembershipSocketNotification = useCallback(
    (data: NotificationData) => {
      handleWorkShiftNotification(data as unknown as Record<string, unknown>);
    },
    [handleWorkShiftNotification]
  );

  const handleTestNotification = useCallback(
    (event: CustomEvent) => {
      const notification: Notification = event.detail;
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    },
    [dispatch]
  );

  useEffect(() => {
    const handleSocketAuthenticated = () => {
      registerSocketListeners();
    };

    const registerSocketListeners = () => {
      const socket = socketService.getSocket();
      if (!socket || !socket.connected) {
        return;
      }

      // Clean up existing listeners before registering new ones to prevent duplicates
      socketService.off('notification:workshift:created', handleSocketNotification);
      socketService.off('notification:workshift:updated', handleSocketNotification);
      socketService.off('notification:workshift:branch_update', handleSocketNotification);
      socketService.off('notification:workshift:batch_created', handleSocketNotification);
      socketService.off('notification:workshift:batch_assigned', handleSocketNotification);
      socketService.off('notification:timeoff:created', handleTimeOffSocketNotification);
      socketService.off('notification:timeoff:approved', handleTimeOffSocketNotification);
      socketService.off('notification:timeoff:rejected', handleTimeOffSocketNotification);
      socketService.off('notification:timeoff:cancelled', handleTimeOffSocketNotification);
      socketService.off('notification:timeoff:branch_update', handleTimeOffSocketNotification);
      socketService.off('notification:timeoff:owner_update', handleTimeOffSocketNotification);
      socketService.off('notification:reschedule:created', handleRescheduleSocketNotification);
      socketService.off('notification:reschedule:accepted', handleRescheduleSocketNotification);
      socketService.off('notification:reschedule:approved', handleRescheduleSocketNotification);
      socketService.off('notification:reschedule:rejected', handleRescheduleSocketNotification);
      socketService.off('notification:reschedule:cancelled', handleRescheduleSocketNotification);
      socketService.off('notification:reschedule:expired', handleRescheduleSocketNotification);
      socketService.off('notification:reschedule:completed', handleRescheduleSocketNotification);
      socketService.off('notification:reschedule:branch_update', handleRescheduleSocketNotification);
      socketService.off('notification:reschedule:owner_update', handleRescheduleSocketNotification);
      socketService.off('notification:reschedule:manager_update', handleRescheduleSocketNotification);
      socketService.off('notification:reschedule:staff_update', handleRescheduleSocketNotification);
      socketService.off('notification:membership:registered', handleMembershipSocketNotification);
      socketService.off('notification:membership:purchased', handleMembershipSocketNotification);
      socketService.off('notification:membership:owner_update', handleMembershipSocketNotification);
      socketService.off('notification:membership:manager_update', handleMembershipSocketNotification);
      socketService.off('notification:servicecontract:registered', handleMembershipSocketNotification);
      socketService.off('notification:servicecontract:purchased', handleMembershipSocketNotification);
      socketService.off('notification:servicecontract:assigned', handleMembershipSocketNotification);
      socketService.off('notification:servicecontract:owner_update', handleMembershipSocketNotification);
      socketService.off('notification:servicecontract:manager_update', handleMembershipSocketNotification);

      // WorkShift notifications
      socketService.on('notification:workshift:created', handleSocketNotification);
      socketService.on('notification:workshift:updated', handleSocketNotification);
      socketService.on('notification:workshift:branch_update', handleSocketNotification);
      socketService.on('notification:workshift:batch_created', handleSocketNotification);
      socketService.on('notification:workshift:batch_assigned', handleSocketNotification);

      // TimeOff notifications
      socketService.on('notification:timeoff:created', handleTimeOffSocketNotification);
      socketService.on('notification:timeoff:approved', handleTimeOffSocketNotification);
      socketService.on('notification:timeoff:rejected', handleTimeOffSocketNotification);
      socketService.on('notification:timeoff:cancelled', handleTimeOffSocketNotification);
      socketService.on('notification:timeoff:branch_update', handleTimeOffSocketNotification);
      socketService.on('notification:timeoff:owner_update', handleTimeOffSocketNotification);

      // Reschedule notifications
      socketService.on('notification:reschedule:created', handleRescheduleSocketNotification);
      socketService.on('notification:reschedule:accepted', handleRescheduleSocketNotification);
      socketService.on('notification:reschedule:approved', handleRescheduleSocketNotification);
      socketService.on('notification:reschedule:rejected', handleRescheduleSocketNotification);
      socketService.on('notification:reschedule:cancelled', handleRescheduleSocketNotification);
      socketService.on('notification:reschedule:expired', handleRescheduleSocketNotification);
      socketService.on('notification:reschedule:completed', handleRescheduleSocketNotification);
      socketService.on('notification:reschedule:branch_update', handleRescheduleSocketNotification);
      socketService.on('notification:reschedule:owner_update', handleRescheduleSocketNotification);
      socketService.on('notification:reschedule:manager_update', handleRescheduleSocketNotification);
      socketService.on('notification:reschedule:staff_update', handleRescheduleSocketNotification);

      // Membership notifications
      socketService.on('notification:membership:registered', handleMembershipSocketNotification);
      socketService.on('notification:membership:purchased', handleMembershipSocketNotification);
      socketService.on('notification:membership:owner_update', handleMembershipSocketNotification);
      socketService.on('notification:membership:manager_update', handleMembershipSocketNotification);

      // Service contract notifications
      socketService.on('notification:servicecontract:registered', handleMembershipSocketNotification);
      socketService.on('notification:servicecontract:purchased', handleMembershipSocketNotification);
      socketService.on('notification:servicecontract:assigned', handleMembershipSocketNotification);
      socketService.on('notification:servicecontract:owner_update', handleMembershipSocketNotification);
      socketService.on('notification:servicecontract:manager_update', handleMembershipSocketNotification);

      // ✅ REMOVED: Membership contract update events are now handled directly by components
      // Components listen to 'membership:contract:updated' socket event directly
      // This removes the need for custom event dispatching
    };

    if (!state.isConnected) {
      return;
    }

    globalThis.addEventListener('socket-authenticated', handleSocketAuthenticated);

    registerSocketListeners();

    globalThis.addEventListener('notification-received', handleFetchedNotification as EventListener);

    // Listen for test notifications
    globalThis.addEventListener('test-notification', handleTestNotification as EventListener);

    return () => {
      globalThis.removeEventListener('socket-authenticated', handleSocketAuthenticated);

      // Clean up socket listeners
      if (socketService.getSocket()) {
        socketService.off('notification:workshift:created', handleSocketNotification);
        socketService.off('notification:workshift:updated', handleSocketNotification);
        socketService.off('notification:workshift:branch_update', handleSocketNotification);
        socketService.off('notification:timeoff:created', handleTimeOffSocketNotification);
        socketService.off('notification:timeoff:approved', handleTimeOffSocketNotification);
        socketService.off('notification:timeoff:rejected', handleTimeOffSocketNotification);
        socketService.off('notification:timeoff:cancelled', handleTimeOffSocketNotification);
        socketService.off('notification:timeoff:branch_update', handleTimeOffSocketNotification);
        socketService.off('notification:timeoff:owner_update', handleTimeOffSocketNotification);

        // Reschedule notifications
        socketService.off('notification:reschedule:created', handleRescheduleSocketNotification);
        socketService.off('notification:reschedule:accepted', handleRescheduleSocketNotification);
        socketService.off('notification:reschedule:approved', handleRescheduleSocketNotification);
        socketService.off('notification:reschedule:rejected', handleRescheduleSocketNotification);
        socketService.off('notification:reschedule:cancelled', handleRescheduleSocketNotification);
        socketService.off('notification:reschedule:expired', handleRescheduleSocketNotification);
        socketService.off('notification:reschedule:completed', handleRescheduleSocketNotification);
        socketService.off('notification:reschedule:branch_update', handleRescheduleSocketNotification);
        socketService.off('notification:reschedule:owner_update', handleRescheduleSocketNotification);
        socketService.off('notification:reschedule:manager_update', handleRescheduleSocketNotification);
        socketService.off('notification:reschedule:staff_update', handleRescheduleSocketNotification);

        // Membership notifications
        socketService.off('notification:membership:registered', handleMembershipSocketNotification);
        socketService.off('notification:membership:purchased', handleMembershipSocketNotification);
        socketService.off('notification:membership:owner_update', handleMembershipSocketNotification);
        socketService.off('notification:membership:manager_update', handleMembershipSocketNotification);

        // Service contract notifications
        socketService.off('notification:servicecontract:registered', handleMembershipSocketNotification);
        socketService.off('notification:servicecontract:purchased', handleMembershipSocketNotification);
        socketService.off('notification:servicecontract:assigned', handleMembershipSocketNotification);
        socketService.off('notification:servicecontract:owner_update', handleMembershipSocketNotification);
        socketService.off('notification:servicecontract:manager_update', handleMembershipSocketNotification);
      }

      // Only clean up the remaining event listeners
      globalThis.removeEventListener('notification-received', handleFetchedNotification as EventListener);
      globalThis.removeEventListener('test-notification', handleTestNotification as EventListener);
    };
  }, [
    state.isConnected, // Re-run when connection state changes
    handleSocketNotification,
    handleTimeOffSocketNotification,
    handleRescheduleSocketNotification,
    handleMembershipSocketNotification,
    handleFetchedNotification,
    handleTestNotification
  ]);

  const value: SocketContextType = useMemo(
    () => ({
      state,
      connect,
      disconnect,
      reconnect,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAllNotifications,
      ping,
      checkPendingNotifications,
      forceDeliverNotifications,
      testNotificationSystem,
      setToken,
      fetchExistingNotifications
    }),
    [
      state,
      connect,
      disconnect,
      reconnect,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAllNotifications,
      ping,
      checkPendingNotifications,
      forceDeliverNotifications,
      testNotificationSystem,
      setToken,
      fetchExistingNotifications
    ]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Export types separately to avoid fast refresh issues
// Types are already exported above, no need to re-export
