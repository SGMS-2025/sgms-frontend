import { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { socketService } from '@/services/socket/socketService';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { WorkShiftNotificationData } from '@/types/api/Socket';

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
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
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
  checkTokenFromHeaders: () => Promise<void>;
  fetchExistingNotifications: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(socketReducer, initialState);
  const { state: authState } = useAuth();
  const { t } = useTranslation();

  // Connect to socket when user is authenticated
  const connect = useCallback(async (): Promise<boolean> => {
    // For HTTP-only cookies, we don't need to check localStorage
    // The browser will automatically send cookies with socket connection
    console.log('🔌 Using HTTP-only cookies for socket connection');

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });

    try {
      console.log('🔌 Calling socketService.connect with HTTP-only cookies...');
      // For HTTP-only cookies, we don't need to pass token
      // The browser will automatically send cookies
      const success = await socketService.connect();
      console.log('🔌 SocketService.connect result:', success);

      if (success) {
        dispatch({ type: 'SET_CONNECTED', payload: true });
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
        console.log('✅ Socket connected successfully');
        return true;
      } else {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
        console.error('❌ Socket connection failed - success was false');
        return false;
      }
    } catch (error) {
      console.error('❌ Socket connection failed with error:', error);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
      toast.error(t('socket.connection_failed'));
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
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

    try {
      const success = await socketService.reconnect();
      if (success) {
        dispatch({ type: 'SET_CONNECTED', payload: true });
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
        toast.success(t('socket.reconnected'));
        return true;
      } else {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
        toast.error(t('socket.reconnect_failed'));
        return false;
      }
    } catch (error) {
      console.error('❌ Socket reconnection failed:', error);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
      toast.error(t('socket.reconnect_failed'));
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [t]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      // Update local state
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });

      // Also update in database if user is authenticated
      if (authState.user?._id) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/${notificationId}/read`, {
            method: 'PATCH',
            credentials: 'include'
          });

          if (response.ok) {
            console.log('✅ Marked notification as read in database');
          } else {
            console.error('❌ Failed to mark notification as read in database:', response.status);
          }
        } catch (error) {
          console.error('❌ Error marking notification as read in database:', error);
        }
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
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/notifications/user/${authState.user._id}/mark-all-read`,
          {
            method: 'PATCH',
            credentials: 'include'
          }
        );

        if (response.ok) {
          console.log('✅ Marked all notifications as read in database');
        } else {
          console.error('❌ Failed to mark all notifications as read in database:', response.status);
        }
      } catch (error) {
        console.error('❌ Error marking all notifications as read in database:', error);
      }
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
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/user/${authState.user._id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          console.log('🗑️ Cleared all notifications from database');
        } else {
          console.error('❌ Failed to clear notifications from database:', response.status);
        }
      } catch (error) {
        console.error('❌ Error clearing notifications from database:', error);
      }
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
    console.log('🧪 Testing notification system...');
    await socketService.testNotificationSystem();
  }, []);

  // Manually set token (for debugging)
  const setToken = useCallback(
    (token: string) => {
      console.log('🔑 Manually setting token:', token.substring(0, 20) + '...');
      localStorage.setItem('token', token);
      // Try to reconnect with new token
      void connect();
    },
    [connect]
  );

  // Check for token in API response headers
  const checkTokenFromHeaders = useCallback(async () => {
    try {
      console.log('🔍 Checking for token in API response headers...');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/profile`, {
        method: 'GET',
        credentials: 'include' // Include cookies
      });

      console.log('🔍 Profile response headers:', response.headers);

      // Check for token in response headers
      const authHeader = response.headers.get('authorization');
      const setCookieHeader = response.headers.get('set-cookie');

      if (authHeader) {
        console.log('🔑 Found token in Authorization header:', authHeader.substring(0, 20) + '...');
        const token = authHeader.replace('Bearer ', '');
        localStorage.setItem('token', token);
      } else if (setCookieHeader) {
        console.log('🔑 Found token in Set-Cookie header:', setCookieHeader);
      } else {
        console.warn('⚠️ No token found in response headers');
      }
    } catch (error) {
      console.error('❌ Error checking token from headers:', error);
    }
  }, []);

  // Fetch existing notifications from database
  const fetchExistingNotifications = useCallback(async () => {
    if (!authState.user?._id) {
      console.log('🔍 No user ID available for fetching notifications');
      return;
    }

    try {
      console.log('🔍 Fetching existing notifications for user:', authState.user._id);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/user/${authState.user._id}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Fetched notifications:', data);

        if (data.success && data.data?.notifications) {
          // Convert database notifications to frontend format
          const notifications = data.data.notifications.map((dbNotification: Record<string, unknown>) => ({
            id: dbNotification._id as string,
            type: (dbNotification.type as string) || 'general',
            title: dbNotification.title as string,
            message: dbNotification.content as string, // Database uses 'content', frontend uses 'message'
            data: (dbNotification.data as Record<string, unknown>) || {},
            priority: (dbNotification.priority as 'low' | 'medium' | 'high') || 'medium',
            category: (dbNotification.category as string) || 'general',
            actions: (dbNotification.actions as string[]) || [],
            timestamp: new Date(dbNotification.createdAt as string),
            read: (dbNotification.read as boolean) || false
          }));

          // Add notifications to state
          notifications.forEach((notification: Notification) => {
            dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
          });

          console.log(`🔍 Loaded ${notifications.length} existing notifications`);
        }
      } else {
        console.error('❌ Failed to fetch notifications:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching existing notifications:', error);
    }
  }, [authState.user?._id]);

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      // Pass user ID to socket service for notification handling
      if (authState.user._id) {
        console.log('🔍 Setting user ID for socket service:', authState.user._id);
        // Store user ID in a way that socket service can access it
        localStorage.setItem('currentUserId', authState.user._id);
      }

      // For HTTP-only cookies, we don't need to check localStorage
      // The browser automatically sends cookies with requests
      console.log('🔍 Using HTTP-only cookies for authentication');

      console.log('🔌 Attempting to connect socket...');
      connect();

      // Fetch existing notifications from database
      fetchExistingNotifications();
    } else {
      console.log('🔌 Disconnecting socket - user not authenticated');
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [authState.isAuthenticated, authState.user, connect, disconnect, fetchExistingNotifications]);

  // Listen for work shift notifications
  useEffect(() => {
    const handleWorkShiftNotification = (data: Record<string, unknown>) => {
      console.log('🔔 Received notification in context:', data);
      const notification: Notification = {
        id: `notification-${Date.now()}-${Math.random()}`,
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

      // Toast notification is handled in socketService to avoid duplicates
    };

    // Listen for custom events from socket service
    const handleCustomEvent = (event: CustomEvent) => {
      handleWorkShiftNotification(event.detail);
    };

    // Listen for fetched notifications from socketService
    const handleFetchedNotification = (event: CustomEvent) => {
      console.log('🔔 Received fetched notification:', event.detail);
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
    };

    // Listen for socket events directly
    const handleSocketNotification = (data: WorkShiftNotificationData) => {
      handleWorkShiftNotification(data as unknown as Record<string, unknown>);
    };

    // Register socket event listeners
    if (socketService.getSocket()) {
      socketService.on('notification:workshift:created', handleSocketNotification);
      socketService.on('notification:workshift:updated', handleSocketNotification);
      socketService.on('notification:workshift:branch_update', handleSocketNotification);
    }

    // Also listen for custom events
    window.addEventListener('workshift-notification', handleCustomEvent as EventListener);
    window.addEventListener('notification-received', handleFetchedNotification as EventListener);

    // Listen for test notifications
    const handleTestNotification = (event: CustomEvent) => {
      console.log('🧪 Test notification received:', event.detail);
      const notification: Notification = event.detail;
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    };
    window.addEventListener('test-notification', handleTestNotification as EventListener);

    return () => {
      // Clean up socket listeners
      if (socketService.getSocket()) {
        socketService.off('notification:workshift:created', handleSocketNotification);
        socketService.off('notification:workshift:updated', handleSocketNotification);
        socketService.off('notification:workshift:branch_update', handleSocketNotification);
      }

      window.removeEventListener('workshift-notification', handleCustomEvent as EventListener);
      window.removeEventListener('notification-received', handleFetchedNotification as EventListener);
      window.removeEventListener('test-notification', handleTestNotification as EventListener);
    };
  }, []);

  // Socket listeners are registered in the main useEffect above
  // No need for duplicate registration

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
      checkTokenFromHeaders,
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
      checkTokenFromHeaders,
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
