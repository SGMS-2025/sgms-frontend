import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { socketApi } from '../api/socketApi';
import i18n from '@/configs/i18n';
import type {
  SocketConfig,
  WorkShiftNotificationData,
  TimeOffNotificationData,
  RescheduleNotificationData,
  ContractSignerSignedEvent,
  ContractCompletedEvent,
  SocketEvents,
  SocketServiceInterface,
  SocketConnectionStatus,
  PendingNotificationsResponse,
  NotificationListResponse,
  DeliverNotificationsResponse,
  NotificationData
} from '@/types/api/Socket';

class SocketService implements SocketServiceInterface {
  private socket: Socket | null = null;
  private isConnected = false;
  private connectionStatus: SocketConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 1000;
  private config: SocketConfig | null = null;
  private readonly listeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.emit = this.emit.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
  }

  async connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // Prevent multiple connections
        if (this.socket && this.isConnected) {
          resolve(true);
          return;
        }

        const serverUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'https://gymsmart.site';

        this.config = {
          serverUrl,
          token: '', // Not needed for cookie-based auth
          reconnectAttempts: 0,
          reconnectDelay: 1000,
          timeout: 20000
        };

        // Simplified: Use only cookies for authentication (no separate token needed)
        this.socket = io(serverUrl, {
          transports: ['websocket', 'polling'],
          timeout: this.config.timeout,
          forceNew: true,
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          withCredentials: true // This sends HTTP-only cookies for authentication
        });

        this.setupEventHandlers(resolve, reject);
      } catch (error) {
        console.error('❌ Failed to create socket connection:', error);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private setupEventHandlers(resolve: (value: boolean) => void, reject: (reason?: unknown) => void) {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      this.startHealthCheck();
      resolve(true);
    });

    this.socket.on('connected', (_data: unknown) => {
      // Emit event to signal SocketContext that socket is ready
      globalThis.dispatchEvent(new CustomEvent('socket-authenticated'));
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      console.error('❌ Error details:', error);
      this.connectionStatus = 'error';
      this.handleReconnect();
      reject(error);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ Socket disconnected. Reason:', reason);
      this.isConnected = false;
      this.connectionStatus = 'disconnected';
      this.stopHealthCheck();
      this.handleReconnect();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Socket reconnected after ${attemptNumber} attempt(s)`);
      this.isConnected = true;
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      this.startHealthCheck();
      toast.success(i18n.t('socket.reconnected'), {
        id: 'socket-reconnected'
      });
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error);
      this.connectionStatus = 'error';
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed after all attempts');
      this.connectionStatus = 'error';
      toast.error(i18n.t('socket.reconnect_failed'), {
        id: 'socket-reconnect-failed'
      });
    });

    this.socket.on('connect', () => {
      // Small delay to ensure connection is fully established
      setTimeout(() => {
        this.requestPendingNotifications();
      }, 1000);
    });

    // Work shift notifications
    this.socket.on('notification:workshift:created', (data: WorkShiftNotificationData) => {
      this.handleWorkShiftNotification(data);
    });

    this.socket.on('notification:workshift:updated', (data: WorkShiftNotificationData) => {
      this.handleWorkShiftNotification(data);
    });

    this.socket.on('notification:workshift:branch_update', (data: WorkShiftNotificationData) => {
      this.handleWorkShiftNotification(data);
    });

    // Batch work shift notifications
    this.socket.on('notification:workshift:batch_created', (data: WorkShiftNotificationData) => {
      this.handleWorkShiftNotification(data);
    });

    this.socket.on('notification:workshift:batch_assigned', (data: WorkShiftNotificationData) => {
      this.handleWorkShiftNotification(data);
    });

    // Time off notifications
    this.socket.on('notification:timeoff:created', (data: TimeOffNotificationData) => {
      this.handleTimeOffNotification(data);
    });

    this.socket.on('notification:timeoff:approved', (data: TimeOffNotificationData) => {
      this.handleTimeOffNotification(data);
    });

    this.socket.on('notification:timeoff:rejected', (data: TimeOffNotificationData) => {
      this.handleTimeOffNotification(data);
    });

    this.socket.on('notification:timeoff:cancelled', (data: TimeOffNotificationData) => {
      this.handleTimeOffNotification(data);
    });

    this.socket.on('notification:timeoff:branch_update', (data: TimeOffNotificationData) => {
      this.handleTimeOffNotification(data);
    });

    this.socket.on('notification:timeoff:owner_update', (data: TimeOffNotificationData) => {
      this.handleTimeOffNotification(data);
    });

    // Reschedule notifications
    this.socket.on('notification:reschedule:created', (data: RescheduleNotificationData) => {
      this.handleRescheduleNotification(data);
    });

    this.socket.on('notification:reschedule:accepted', (data: RescheduleNotificationData) => {
      this.handleRescheduleNotification(data);
    });

    this.socket.on('notification:reschedule:approved', (data: RescheduleNotificationData) => {
      this.handleRescheduleNotification(data);
    });

    this.socket.on('notification:reschedule:rejected', (data: RescheduleNotificationData) => {
      this.handleRescheduleNotification(data);
    });

    this.socket.on('notification:reschedule:cancelled', (data: RescheduleNotificationData) => {
      this.handleRescheduleNotification(data);
    });

    this.socket.on('notification:reschedule:expired', (data: RescheduleNotificationData) => {
      this.handleRescheduleNotification(data);
    });

    this.socket.on('notification:reschedule:completed', (data: RescheduleNotificationData) => {
      this.handleRescheduleNotification(data);
    });

    this.socket.on('notification:reschedule:branch_update', (data: RescheduleNotificationData) => {
      this.handleRescheduleNotification(data);
    });

    this.socket.on('notification:reschedule:owner_update', (data: RescheduleNotificationData) => {
      this.handleRescheduleNotification(data);
    });

    this.socket.on('notification:reschedule:manager_update', (data: RescheduleNotificationData) => {
      this.handleRescheduleNotification(data);
    });

    this.socket.on('notification:reschedule:staff_update', (data: RescheduleNotificationData) => {
      this.handleRescheduleNotification(data);
    });

    // Branch working config notifications
    this.socket.on('notification:branch-working-config:updated', (data: NotificationData) => {
      this.handleBranchWorkingConfigNotification(data);
    });

    // Contract signing notifications
    this.socket.on('contract:signer:signed', (data: ContractSignerSignedEvent) => {
      this.handleContractSignerSigned(data);
    });

    this.socket.on('contract:completed', (data: ContractCompletedEvent) => {
      this.handleContractCompleted(data);
    });

    // Ping/pong for connection health
    this.socket.on('pong', () => {});

    // Set connection timeout
    setTimeout(() => {
      if (!this.isConnected) {
        reject(new Error('Connection timeout'));
      }
    }, this.config?.timeout || 20000);
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.connectionStatus = 'reconnecting';

      setTimeout(() => {
        if (this.socket && !this.isConnected) {
          this.socket.connect();
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      this.connectionStatus = 'error';
      toast.error(i18n.t('socket.connection_lost'), {
        id: 'socket-connection-lost'
      });
    }
  }

  private startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.healthCheck();
      if (!isHealthy && this.isConnected) {
        toast.warning(i18n.t('socket.connection_unstable'), {
          id: 'socket-connection-unstable'
        });
      }
    }, 30000); // Check every 30 seconds
  }

  private stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  private handleWorkShiftNotification(data: WorkShiftNotificationData) {
    // Don't show toast here - let the notification panel handle display
    // SocketContext will handle the notification directly from socket events
    console.log('🔔 WorkShift notification received in socketService:', data);
  }

  private handleTimeOffNotification(data: TimeOffNotificationData) {
    // Don't show toast here - let the notification panel handle display
    // SocketContext will handle the notification directly from socket events
    console.log('🔔 TimeOff notification received in socketService:', data);
  }

  private handleRescheduleNotification(data: RescheduleNotificationData) {
    // Don't show toast here - let the notification panel handle display
    // SocketContext will handle the notification directly from socket events
    console.log('🔔 Reschedule notification received in socketService:', data);
  }

  private handleBranchWorkingConfigNotification(data: NotificationData) {
    // Don't show toast here - let the notification panel handle display
    // SocketContext will handle the notification directly from socket events
    console.log('🔔 Branch Working Config notification received in socketService:', data);
  }

  private handleContractSignerSigned(data: ContractSignerSignedEvent) {
    // Show toast notification immediately
    toast.success(data.message, {
      id: `contract-signer-signed-${data.data.documentId}-${data.data.signerEmail}`,
      duration: 5000
    });

    // Dispatch custom event for components to listen and refresh data
    // Use a small delay to ensure backend has fully updated
    setTimeout(() => {
      globalThis.dispatchEvent(
        new CustomEvent('contract:signer:signed', {
          detail: data
        })
      );
    }, 300);

    console.log('🔔 Contract signer signed notification received:', data);
  }

  private handleContractCompleted(data: ContractCompletedEvent) {
    // Show toast notification immediately
    toast.success(data.message, {
      id: `contract-completed-${data.data.documentId}`,
      duration: 5000
    });

    // Dispatch custom event for components to listen and refresh data
    // Use a small delay to ensure backend has fully updated
    setTimeout(() => {
      globalThis.dispatchEvent(
        new CustomEvent('contract:completed', {
          detail: data
        })
      );
    }, 300);

    console.log('🔔 Contract completed notification received:', data);
  }

  // Removed emitCustomEvent to prevent duplicate notifications

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      this.stopHealthCheck();
    }
  }

  emit<K extends keyof SocketEvents>(event: K, data?: Parameters<SocketEvents[K]>[0]) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    if (!this.socket) {
      console.warn(`[SocketService] ⚠️ Cannot listen to event "${String(event)}" - socket not initialized`);
      return;
    }

    // Wrap callback to add logging
    const wrappedCallback = ((...args: unknown[]) => {
      (callback as (...args: unknown[]) => void)(...args);
    }) as SocketEvents[K];

    // Register with socket
    this.socket.on(event as string, wrappedCallback as (...args: unknown[]) => void);

    // Also register for custom events
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(wrappedCallback as (...args: unknown[]) => void);
  }

  off<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]) {
    if (this.socket) {
      this.socket.off(event as string, callback as (...args: unknown[]) => void);
    }

    if (callback) {
      const listeners = this.listeners.get(event) || [];
      const index = listeners.indexOf(callback as (...args: unknown[]) => void);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  ping() {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping');
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.isConnected) {
        resolve(false);
        return;
      }

      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);

      this.socket?.once('pong', () => {
        clearTimeout(timeout);
        resolve(true);
      });

      this.ping();
    });
  }

  // Manual reconnect
  async reconnect(): Promise<boolean> {
    this.disconnect();
    return this.connect();
  }

  // Request pending notifications from server
  private async requestPendingNotifications(): Promise<PendingNotificationsResponse | null> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return null;
    }

    const response = await socketApi.checkPendingNotifications(userId);

    if (response.success && response.data) {
      const data = response.data;

      if (data.offlineNotificationCount > 0) {
        // Show a single toast to inform user about stored notifications
        // Get the current language to determine the correct fallback text
        const currentLang = i18n.language || 'en';

        // Ensure i18n is ready before using it
        if (!i18n.isInitialized) {
          console.log('i18n not initialized, using fallback');
          const description =
            currentLang === 'vi'
              ? `${data.offlineNotificationCount} thông báo đã được lưu trữ khi bạn ngoại tuyến`
              : `${data.offlineNotificationCount} notifications were stored while you were offline`;

          toast.info(currentLang === 'vi' ? 'Bạn có thông báo ngoại tuyến' : 'You have offline notifications', {
            id: 'offline-notifications',
            description: description,
            duration: 5000,
            action: {
              label: currentLang === 'vi' ? 'Xem' : 'View',
              onClick: () => {
                globalThis.dispatchEvent(new CustomEvent('show-notifications'));
              }
            }
          });
          return data;
        }

        // Try to get the translated text with interpolation
        let description = i18n.t('socket.offline_notifications_description', { count: data.offlineNotificationCount });

        // Debug: Log the translation result
        console.log('Translation result:', description);
        console.log('Count value:', data.offlineNotificationCount);
        console.log('Current language:', currentLang);
        console.log('i18n is ready:', i18n.isInitialized);

        // If translation failed or returned the key, use fallback
        if (
          description === 'socket.offline_notifications_description' ||
          !description ||
          description.includes('{count}')
        ) {
          console.log('Using fallback text');
          description =
            currentLang === 'vi'
              ? `${data.offlineNotificationCount} thông báo đã được lưu trữ khi bạn ngoại tuyến`
              : `${data.offlineNotificationCount} notifications were stored while you were offline`;
        }

        toast.info(i18n.t('socket.offline_notifications'), {
          id: 'offline-notifications', // Unique ID to prevent duplicates
          description: description,
          duration: 5000,
          action: {
            label: i18n.t('socket.view_notifications') || (currentLang === 'vi' ? 'Xem' : 'View'),
            onClick: () => {
              // Trigger a custom event to show notifications
              globalThis.dispatchEvent(new CustomEvent('show-notifications'));
            }
          }
        });
      }
      return data;
    }
    return null;
  }

  // Fetch actual notifications from server
  private async fetchNotifications(): Promise<NotificationListResponse | null> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return null;
    }

    const response = await socketApi.getUserNotifications(userId);

    if (response.success && response.data && response.data.length > 0) {
      // Dispatch notifications to frontend
      for (const notification of response.data) {
        // Emit a custom event that SocketContext can listen to
        globalThis.dispatchEvent(
          new CustomEvent('notification-received', {
            detail: notification as unknown as Record<string, unknown>
          })
        );
      }
    }
    return response.data;
  }

  // Note: Socket authentication is now handled automatically via cookies
  // No need for separate authentication check

  // Get current user ID from token
  private getCurrentUserId(): string {
    // First try to get from localStorage (set by SocketContext)
    const currentUserId = localStorage.getItem('currentUserId');
    if (currentUserId) {
      return currentUserId;
    }

    // Try to get from stored user object
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.id || user._id) {
        return user.id || user._id;
      }
    }

    if (!this.config?.token) {
      return '';
    }

    // Try to decode JWT token to get user ID
    const parts = this.config.token.split('.');
    if (parts.length !== 3) {
      return '';
    }

    const payload = JSON.parse(atob(parts[1]));

    // Try different possible user ID fields
    const userId = payload.id || payload.userId || payload.sub || payload._id;
    if (userId) {
      return userId;
    }

    return '';
  }

  // Public method to manually check for pending notifications
  async checkPendingNotifications(): Promise<void> {
    await this.requestPendingNotifications();
  }

  // Test notification system
  async testNotificationSystem(): Promise<void> {
    const userId = this.getCurrentUserId();

    if (userId) {
      await this.checkPendingNotifications();
    }
  }

  // Force check and deliver stored notifications
  async forceDeliverNotifications(): Promise<DeliverNotificationsResponse | null> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return null;
    }

    const response = await socketApi.deliverNotifications(userId);

    if (response.success && response.data) {
      const data = response.data;

      if (data.delivered) {
        // After delivering notifications, fetch the actual notifications
        await this.fetchNotifications();
      }
      return data;
    }
    return null;
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Get connection status with detailed info
  getConnectionStatusDetailed(): SocketConnectionStatus {
    return this.connectionStatus;
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
