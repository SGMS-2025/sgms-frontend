import type { ApiResponse } from '@/types/api/Customer';
import { api } from './api';
import type { NotificationListResponse, NotificationListParams, NotificationStats } from '@/types/api/Notification';

export const notificationApi = {
  // Get notifications for current user
  getUserNotifications: async (params: NotificationListParams = {}): Promise<ApiResponse<NotificationListResponse>> => {
    const response = await api.get('/notifications/user', { params });
    return response.data;
  },

  // Get notifications by user ID
  getNotificationsByUserId: async (
    userId: string,
    params: NotificationListParams = {}
  ): Promise<ApiResponse<NotificationListResponse>> => {
    const response = await api.get(`/notifications/user/${userId}`, { params });
    return response.data;
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read for current user
  markAllNotificationsAsRead: async (): Promise<ApiResponse<{ message: string; updatedCount: number }>> => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Clear all notifications for current user
  clearAllNotifications: async (): Promise<ApiResponse<{ message: string; deletedCount: number }>> => {
    const response = await api.delete('/notifications/clear-all');
    return response.data;
  },

  // Get notification stats for current user
  getNotificationStats: async (): Promise<ApiResponse<NotificationStats>> => {
    const response = await api.get('/notifications/stats');
    return response.data;
  }
};
