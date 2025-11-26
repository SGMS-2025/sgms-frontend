import type { ApiResponse, PaginatedApiResponse } from '@/types/api/Api';
import { api } from './api';
import type {
  ChatRoom,
  ChatRoomListParams,
  ChatMessagesParams,
  ChatMessagesResponse,
  SendMessageRequest,
  SendMessageResponse
} from '@/types/api/Chat';

export const chatApi = {
  // Get list of chat rooms
  getChatRooms: async (params: ChatRoomListParams = {}): Promise<PaginatedApiResponse<ChatRoom[]>> => {
    const response = await api.get('/chat/rooms', { params });
    return response.data;
  },

  // Get chat room detail by sessionId
  getChatRoom: async (sessionId: string): Promise<ApiResponse<ChatRoom>> => {
    const response = await api.get(`/chat/rooms/${sessionId}`);
    return response.data;
  },

  // Get messages for a chat room
  getMessages: async (
    sessionId: string,
    params: ChatMessagesParams = {}
  ): Promise<ApiResponse<ChatMessagesResponse>> => {
    const response = await api.get(`/chat/rooms/${sessionId}/messages`, { params });
    return response.data;
  },

  // Send a message
  sendMessage: async (data: SendMessageRequest): Promise<ApiResponse<SendMessageResponse>> => {
    const response = await api.post('/chat/messages', data);
    return response.data;
  },

  // Clear/delete a chat room session
  clearRoom: async (sessionId: string): Promise<ApiResponse<ChatRoom>> => {
    const response = await api.delete(`/chat/rooms/${sessionId}`);
    return response.data;
  }
};
