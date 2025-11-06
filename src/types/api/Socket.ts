import type { ApiResponse } from './Api';
import type { Socket } from 'socket.io-client';

// ===== SOCKET CONNECTION TYPES =====

export type SocketConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export interface SocketConfig {
  serverUrl: string;
  token: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  timeout: number;
}

// ===== NOTIFICATION TYPES =====

export type NotificationPriority = 'low' | 'medium' | 'high';
export type NotificationCategory = 'workshift' | 'staff' | 'branch' | 'system' | 'general' | 'timeoff' | 'reschedule';

export interface NotificationData {
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  priority: NotificationPriority;
  category: NotificationCategory;
  actions: string[];
  wasStored?: boolean;
  deliveredAt?: string;
  storedAt?: string;
}

export interface WorkShiftNotificationData extends NotificationData {
  category: 'workshift';
  data: {
    workShiftId: string;
    branchId: string;
    staffId: string;
    startTime: string;
    endTime: string;
    date: string;
    status: string;
  };
}

export interface TimeOffNotificationData extends NotificationData {
  category: 'timeoff';
  data: {
    timeOffRequestId: string;
    staffId: string;
    staffName: string;
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
    actor?: {
      id: string;
      name: string;
      role: string;
    };
  };
}

export interface StaffNotificationData extends NotificationData {
  category: 'staff';
  data: {
    staffId: string;
    staffName: string;
    action: 'created' | 'updated' | 'deleted' | 'status_changed';
    branchId?: string;
  };
}

export interface BranchNotificationData extends NotificationData {
  category: 'branch';
  data: {
    branchId: string;
    branchName: string;
    action: 'created' | 'updated' | 'deleted' | 'status_changed';
    managerId?: string;
  };
}

export interface RescheduleNotificationData extends NotificationData {
  category: 'reschedule';
  data: {
    requestId: string;
    requesterName: string;
    originalShiftTime: string;
    swapType: string;
    priority: string;
    branchId: string;
    branchName: string;
    status: string;
    actor?: {
      id: string;
      name: string;
      role: string;
    };
  };
}

// ===== SOCKET EVENT TYPES =====

export interface SocketEvents {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
  reconnect: (attemptNumber: number) => void;
  reconnect_error: (error: Error) => void;
  reconnect_failed: () => void;

  // Server events
  connected: (data: { message: string; userId: string }) => void;
  pong: (data: { timestamp: number }) => void;

  // Notification events
  'notification:workshift:created': (data: WorkShiftNotificationData) => void;
  'notification:workshift:updated': (data: WorkShiftNotificationData) => void;
  'notification:workshift:branch_update': (data: WorkShiftNotificationData) => void;
  'notification:workshift:batch_created': (data: WorkShiftNotificationData) => void;
  'notification:workshift:batch_assigned': (data: WorkShiftNotificationData) => void;
  'notification:timeoff:created': (data: TimeOffNotificationData) => void;
  'notification:timeoff:approved': (data: TimeOffNotificationData) => void;
  'notification:timeoff:rejected': (data: TimeOffNotificationData) => void;
  'notification:timeoff:cancelled': (data: TimeOffNotificationData) => void;
  'notification:timeoff:branch_update': (data: TimeOffNotificationData) => void;
  'notification:timeoff:owner_update': (data: TimeOffNotificationData) => void;
  'notification:reschedule:created': (data: RescheduleNotificationData) => void;
  'notification:reschedule:accepted': (data: RescheduleNotificationData) => void;
  'notification:reschedule:approved': (data: RescheduleNotificationData) => void;
  'notification:reschedule:rejected': (data: RescheduleNotificationData) => void;
  'notification:reschedule:cancelled': (data: RescheduleNotificationData) => void;
  'notification:reschedule:expired': (data: RescheduleNotificationData) => void;
  'notification:reschedule:completed': (data: RescheduleNotificationData) => void;
  'notification:reschedule:branch_update': (data: RescheduleNotificationData) => void;
  'notification:reschedule:owner_update': (data: RescheduleNotificationData) => void;
  'notification:reschedule:manager_update': (data: RescheduleNotificationData) => void;
  'notification:reschedule:staff_update': (data: RescheduleNotificationData) => void;
  'notification:staff:created': (data: StaffNotificationData) => void;
  'notification:staff:updated': (data: StaffNotificationData) => void;
  'notification:staff:deleted': (data: StaffNotificationData) => void;
  'notification:branch:created': (data: BranchNotificationData) => void;
  'notification:branch:updated': (data: BranchNotificationData) => void;
  'notification:branch:deleted': (data: BranchNotificationData) => void;

  // Custom events
  'workshift-notification': (data: WorkShiftNotificationData) => void;
  'timeoff-notification': (data: TimeOffNotificationData) => void;
  'reschedule-notification': (data: RescheduleNotificationData) => void;
  'payment:updated': (data: PaymentUpdateEvent) => void;

  // Schedule events
  'schedule-created': (data: Record<string, unknown>) => void;
  'schedule-updated': (data: Record<string, unknown>) => void;
  'schedule-deleted': (data: Record<string, unknown>) => void;
  'notification-received': (data: NotificationData) => void;
  'show-notifications': () => void;
}

// ===== API REQUEST/RESPONSE TYPES =====

export interface PendingNotificationsResponse {
  delivered: boolean;
  offlineNotificationCount: number;
  notifications: NotificationData[];
}

export type NotificationListResponse = NotificationData[];

export interface DeliverNotificationsResponse {
  delivered: boolean;
  deliveredCount: number;
  notifications: NotificationData[];
}

// ===== SOCKET SERVICE INTERFACE =====

export interface SocketServiceInterface {
  // Connection methods
  connect(): Promise<boolean>;
  disconnect(): void;
  reconnect(): Promise<boolean>;

  // Event methods
  emit<K extends keyof SocketEvents>(event: K, data?: Parameters<SocketEvents[K]>[0]): void;
  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void;
  off<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]): void;

  // Health check methods
  ping(): void;
  healthCheck(): Promise<boolean>;

  // Notification methods
  checkPendingNotifications(): Promise<void>;
  testNotificationSystem(): Promise<void>;
  forceDeliverNotifications(): Promise<DeliverNotificationsResponse | null>;

  // Status methods
  getConnectionStatus(): boolean;
  getSocket(): Socket | null;
}

// ===== SOCKET CONTEXT TYPES =====

export interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: SocketConnectionStatus;
  notifications: NotificationData[];
  unreadCount: number;

  // Connection methods
  connect: () => Promise<boolean>;
  disconnect: () => void;
  reconnect: () => Promise<boolean>;

  // Notification methods
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  checkPendingNotifications: () => Promise<void>;

  // Event methods
  on: <K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) => void;
  off: <K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]) => void;
  emit: <K extends keyof SocketEvents>(event: K, data?: Parameters<SocketEvents[K]>[0]) => void;
}

// ===== SOCKET API TYPES =====

export interface SocketApiInterface {
  // Notification endpoints
  checkPendingNotifications(userId: string): Promise<ApiResponse<PendingNotificationsResponse>>;
  getUserNotifications(userId: string): Promise<ApiResponse<NotificationListResponse>>;
  deliverNotifications(userId: string): Promise<ApiResponse<DeliverNotificationsResponse>>;

  // Health check
  healthCheck(): Promise<ApiResponse<{ status: string; timestamp: number }>>;
}

// ===== UTILITY TYPES =====

export interface SocketHealthStatus {
  isConnected: boolean;
  lastPing: number;
  reconnectAttempts: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

export interface SocketReconnectOptions {
  maxAttempts: number;
  delay: number;
  backoff: boolean;
  exponentialBackoff: boolean;
}

export interface PaymentUpdateEvent {
  orderCode?: number;
  status?: 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED';
  amount?: number;
  amountPaid?: number;
  amountRemaining?: number;
  transactionId?: string;
  paymentTime?: string;
  customerId?: string;
  contractId?: string;
  contractType?: 'service' | 'membership';
  metadata?: Record<string, unknown>;
}

// ===== ERROR TYPES =====

export interface SocketError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
}

export type SocketErrorCode =
  | 'CONNECTION_FAILED'
  | 'AUTHENTICATION_FAILED'
  | 'RECONNECT_FAILED'
  | 'HEALTH_CHECK_FAILED'
  | 'NOTIFICATION_DELIVERY_FAILED'
  | 'UNKNOWN_ERROR';
