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
export type NotificationCategory =
  | 'workshift'
  | 'staff'
  | 'branch'
  | 'system'
  | 'general'
  | 'timeoff'
  | 'reschedule'
  | 'membership'
  | 'contract'
  | 'pt_availability';

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

export interface PTAvailabilityNotificationData extends NotificationData {
  category: 'pt_availability';
  data: {
    requestId: string;
    staffId: string;
    staffName: string;
    branchId: string;
    branchName: string;
    slotsCount: number;
    status: string;
    actor?: {
      id: string;
      name: string;
      role: string;
    };
    approvedBy?: {
      id: string;
      name: string;
      role: string;
    };
    approvedAt?: string;
    rejectionReason?: string;
    rejectedBy?: {
      id: string;
      name: string;
      role: string;
    };
    rejectedAt?: string;
  };
}

export interface PTProgressReminderNotificationData extends NotificationData {
  category: 'general';
  data: {
    customerId: string;
    serviceContractId: string;
    trainerId?: string;
    customerName: string;
    action: 'add-progress';
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
  'notification:branch-working-config:updated': (data: NotificationData) => void;
  'notification:kpi:achieved': (data: NotificationData) => void;
  'notification:staff:created': (data: StaffNotificationData) => void;
  'notification:staff:updated': (data: StaffNotificationData) => void;
  'notification:staff:deleted': (data: StaffNotificationData) => void;
  'notification:branch:created': (data: BranchNotificationData) => void;
  'notification:branch:updated': (data: BranchNotificationData) => void;
  'notification:branch:deleted': (data: BranchNotificationData) => void;
  'notification:membership:registered': (data: NotificationData) => void;
  'notification:membership:purchased': (data: NotificationData) => void;
  'notification:membership:owner_update': (data: NotificationData) => void;
  'notification:membership:manager_update': (data: NotificationData) => void;
  'notification:servicecontract:registered': (data: NotificationData) => void;
  'notification:servicecontract:purchased': (data: NotificationData) => void;
  'notification:servicecontract:assigned': (data: NotificationData) => void;
  'notification:servicecontract:owner_update': (data: NotificationData) => void;
  'notification:servicecontract:manager_update': (data: NotificationData) => void;
  'notification:pt-availability:created': (data: PTAvailabilityNotificationData) => void;
  'notification:pt-availability:approved': (data: PTAvailabilityNotificationData) => void;
  'notification:pt-availability:rejected': (data: PTAvailabilityNotificationData) => void;
  'notification:pt-progress-reminder:add-progress': (data: PTProgressReminderNotificationData) => void;

  // Custom events
  'workshift-notification': (data: WorkShiftNotificationData) => void;
  'timeoff-notification': (data: TimeOffNotificationData) => void;
  'reschedule-notification': (data: RescheduleNotificationData) => void;
  'pt-availability-notification': (data: PTAvailabilityNotificationData) => void;
  'payment:updated': (data: PaymentUpdateEvent) => void;
  'membership:contract:updated': (data: MembershipContractUpdateEvent) => void;

  // Contract signing events
  'contract:signer:signed': (data: ContractSignerSignedEvent) => void;
  'contract:completed': (data: ContractCompletedEvent) => void;

  // Schedule events
  'schedule-created': (data: Record<string, unknown>) => void;
  'schedule-updated': (data: Record<string, unknown>) => void;
  'schedule-deleted': (data: Record<string, unknown>) => void;
  'notification-received': (data: NotificationData) => void;
  'show-notifications': () => void;

  // KPI events
  'kpi:created': (data: KPIUpdateEvent) => void;
  'kpi:updated': (data: KPIUpdateEvent) => void;

  // Branch working config events
  'branch:working-config:updated': (data: {
    branchId: string;
    configId: string;
    version: number;
    updatedBy: string;
    timestamp: string;
  }) => void;

  // Business verification events
  'business-verification:submitted': (data: BusinessVerificationUpdateEvent) => void;
  'business-verification:approved': (data: BusinessVerificationUpdateEvent) => void;
  'business-verification:rejected': (data: BusinessVerificationUpdateEvent) => void;
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

export interface MembershipContractUpdateEvent {
  contractId: string;
  customerId: string;
  branchId: string;
  updateType: 'extended' | 'canceled' | 'updated' | 'activated';
  contract: {
    _id: string;
    status: string;
    startDate: string;
    endDate: string;
    activationDate?: string;
    paidAmount: number;
    debtAmount: number;
    total: number;
    canceledAt?: string;
    canceledBy?: string;
  };
  membershipPlan: {
    _id: string;
    name: string;
  };
  branch: {
    _id: string;
    branchName: string;
  };
  timestamp: string;
}

export interface ContractSignerSignedEvent {
  id?: string;
  title: string;
  message: string;
  type: string;
  priority: NotificationPriority;
  category: string;
  data: {
    documentId: string;
    documentTitle: string;
    signerEmail: string;
    signerName: string;
    signerStatus: string;
    totalSigners: number;
    signedCount: number;
  };
  timestamp: string;
}

export interface ContractCompletedEvent {
  id?: string;
  title: string;
  message: string;
  type: string;
  priority: NotificationPriority;
  category: string;
  data: {
    documentId: string;
    documentTitle: string;
    totalSigners: number;
    signedSigners: Array<{
      email: string;
      name: string;
      status: string;
    }>;
    completedAt: string;
  };
  timestamp: string;
}

export interface BusinessVerificationUpdateEvent {
  verificationId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  businessName: string;
  approvedAt?: string;
  rejectedAt?: string;
  submittedAt?: string;
  rejectionReason?: string;
  adminNotes?: string | null;
  skipToast?: boolean; // Flag to skip toast notification (for submit/resubmit)
  verification?: {
    _id: string;
    businessName: string;
    status: string;
    approvedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    adminNotes?: string;
    [key: string]: unknown;
  };
}

export interface KPIUpdateEvent {
  kpiConfigId: string;
  staffId?: string;
  branchId: string;
  ownerId: string;
  achievement: {
    actual: {
      revenue: {
        total: number;
        newMember: number;
        ptSession: number;
        vipRevenue: number;
      };
      members: {
        newMembers: number;
        vipNewMembers: number;
      };
      sessions: {
        ptSessions: number;
        vipPtSessions: number;
      };
    };
    commission: {
      baseRate: number;
      applicableRate: number;
      amount: number;
      breakdown: {
        newMember: number;
        ptSession: number;
        vipBonus: number;
      };
    };
    bonus: {
      qualified: boolean;
      amount: number;
      reason?: string;
    };
    rankings: {
      branch?: number;
      owner?: number;
    };
  };
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
