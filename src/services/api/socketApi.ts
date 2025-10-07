import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type {
  PendingNotificationsResponse,
  NotificationListResponse,
  DeliverNotificationsResponse,
  SocketApiInterface
} from '@/types/api/Socket';

export const socketApi: SocketApiInterface = {
  /**
   * Check for pending notifications for a user
   */
  checkPendingNotifications: async (userId: string): Promise<ApiResponse<PendingNotificationsResponse>> => {
    const response = await api.get(`/notifications/check/${userId}`);
    return response.data;
  },

  /**
   * Get user notifications
   */
  getUserNotifications: async (userId: string): Promise<ApiResponse<NotificationListResponse>> => {
    const response = await api.get(`/notifications/user/${userId}`);
    return response.data;
  },

  /**
   * Deliver stored notifications to user
   */
  deliverNotifications: async (userId: string): Promise<ApiResponse<DeliverNotificationsResponse>> => {
    const response = await api.post(`/notifications/deliver/${userId}`);
    return response.data;
  },

  /**
   * Health check for socket connection
   */
  healthCheck: async (): Promise<ApiResponse<{ status: string; timestamp: number }>> => {
    const response = await api.get('/socket/health');
    return response.data;
  }
};
