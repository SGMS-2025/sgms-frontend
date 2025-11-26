import type { BaseEntity, PaginationParams, PaginationResponse } from '@/types/common/BaseTypes';

export type ChatSenderType = 'PT' | 'AI';
export type ChatMessageRole = 'user' | 'assistant';

export interface ChatRoom extends BaseEntity {
  staffId: {
    _id: string;
    jobTitle: string;
    userId: {
      _id: string;
      fullName: string;
      email: string;
    };
  };
  staffUserId: {
    _id: string;
    fullName: string;
    email: string;
  };
  sessionId: string;
  title: string | null;
  lastMessageSnippet: string | null;
  lastMessageAt: string | null;
  userProfile: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

export interface ChatMessage extends BaseEntity {
  chatRoomId: string;
  senderType: ChatSenderType;
  senderId?: {
    _id: string;
    fullName: string;
    email: string;
  };
  role: ChatMessageRole;
  content: string;
  error: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ChatRoomListParams extends PaginationParams {
  sortBy?: 'createdAt' | 'updatedAt' | 'lastMessageAt';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface ChatMessagesParams extends PaginationParams {
  sortBy?: 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ChatMessagesResponse {
  room: ChatRoom;
  messages: ChatMessage[];
  pagination: PaginationResponse;
}

export interface SendMessageRequest {
  sessionId?: string;
  title?: string;
  message: string;
  userProfile?: {
    name?: string;
    height?: number;
    weight?: number;
    goals?: string[];
    injuries?: string[];
    [key: string]: unknown;
  };
}

export interface SendMessageResponse {
  room: ChatRoom;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  sessionId: string;
}
