import type { NotificationPriority, NotificationCategory } from './Socket';
import type { BackendPaginationResponse } from './Branch';
import type { BaseEntity, PaginationParams } from '../common/BaseTypes';

export interface Notification extends BaseEntity {
  title: string;
  content: string;
  type: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  actions: string[];
  data: Record<string, unknown>;
  read: boolean;
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: BackendPaginationResponse;
}

export interface NotificationListParams extends PaginationParams {
  read?: boolean;
  category?: NotificationCategory;
  priority?: NotificationPriority;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;
}
