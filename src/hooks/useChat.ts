import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { chatApi } from '@/services/api/chatApi';
import type {
  ChatRoom,
  ChatMessage,
  ChatRoomListParams,
  ChatMessagesParams,
  SendMessageRequest,
  SendMessageResponse
} from '@/types/api/Chat';
import type { PaginationResponse } from '@/types/common/BaseTypes';

export interface UseChatRoomsReturn {
  rooms: ChatRoom[];
  loading: boolean;
  error: string | null;
  pagination: PaginationResponse | null;
  refetch: () => Promise<void>;
  updateFilters: (filters: Partial<ChatRoomListParams>) => void;
  goToPage: (page: number) => void;
}

export interface UseChatMessagesReturn {
  room: ChatRoom | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  pagination: PaginationResponse | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export interface SendMessageOperationResult {
  data: SendMessageResponse | null;
  errorMessage: string | null;
}

export interface UseChatOperationsReturn {
  sending: boolean;
  error: string | null;
  sendMessage: (data: SendMessageRequest) => Promise<SendMessageOperationResult>;
  clearRoom: (sessionId: string) => Promise<boolean>;
}

// Hook for managing chat rooms list
export const useChatRooms = (initialParams: ChatRoomListParams = {}): UseChatRoomsReturn => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [params, setParams] = useState<ChatRoomListParams>(initialParams);
  const { t } = useTranslation();

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);

    const requestParams: ChatRoomListParams = {
      limit: params.limit ?? 20,
      page: params.page ?? 1
    };

    const response = await chatApi.getChatRooms(requestParams);

    if (response.success) {
      setRooms(response.data || []);
      setPagination(response.pagination || null);
    } else {
      setError(response.message || 'Failed to fetch chat rooms');
      toast.error(t('chat.fetch_rooms_error') || 'Failed to fetch chat rooms');
    }

    setLoading(false);
  }, [params, t]);

  const refetch = useCallback(async () => {
    await fetchRooms();
  }, [fetchRooms]);

  const updateFilters = useCallback((newFilters: Partial<ChatRoomListParams>) => {
    setParams((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return {
    rooms,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    goToPage
  };
};

// Hook for managing messages in a chat room
export const useChatMessages = (sessionId: string | null): UseChatMessagesReturn => {
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const { t } = useTranslation();

  const fetchMessages = useCallback(
    async (page = 1, append = false) => {
      if (!sessionId) {
        setRoom(null);
        setMessages([]);
        setPagination(null);
        setHasMore(false);
        return;
      }

      setLoading(true);
      setError(null);

      const params: ChatMessagesParams = {
        page,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'asc'
      };

      const response = await chatApi.getMessages(sessionId, params);

      if (response.success) {
        setRoom(response.data?.room || null);
        const newMessages = response.data?.messages || [];
        if (append) {
          setMessages((prev) => [...newMessages, ...prev]);
        } else {
          setMessages(newMessages);
        }
        setPagination(response.data?.pagination || null);
        setHasMore(response.data?.pagination?.hasNext || false);
      } else {
        setError(response.message || 'Failed to fetch messages');
        toast.error(t('chat.fetch_messages_error') || 'Failed to fetch messages');
      }

      setLoading(false);
    },
    [sessionId, t]
  );

  const refetch = useCallback(async () => {
    await fetchMessages(1, false);
  }, [fetchMessages]);

  const loadMore = useCallback(async () => {
    if (pagination && hasMore && !loading) {
      await fetchMessages(pagination.page + 1, true);
    }
  }, [pagination, hasMore, loading, fetchMessages]);

  useEffect(() => {
    fetchMessages(1, false);
  }, [fetchMessages]);

  return {
    room,
    messages,
    loading,
    error,
    pagination,
    refetch,
    loadMore,
    hasMore
  };
};

// Hook for chat operations (send message, clear room)
export const useChatOperations = (): UseChatOperationsReturn => {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const sendMessage = useCallback(
    async (data: SendMessageRequest): Promise<SendMessageOperationResult> => {
      setSending(true);
      setError(null);
      const defaultErrorMessage = t('chat.send_message_error') || 'Failed to send message';
      const translateErrorMessage = (rawMessage?: string | null) => {
        if (!rawMessage) {
          return defaultErrorMessage;
        }
        if (rawMessage === 'CHAT_AI_UNAVAILABLE') {
          return (
            t('chat.errors.chat_ai_unavailable') ||
            'Sgms AI is temporarily unavailable. Please try again later. / Sgms AI tạm thời không khả dụng. Vui lòng thử lại sau.'
          );
        }
        return rawMessage;
      };

      try {
        const response = await chatApi.sendMessage(data);

        if (response.success) {
          return { data: response.data, errorMessage: null };
        }

        const failureMessage = translateErrorMessage(response.message);
        setError(failureMessage);
        return { data: null, errorMessage: failureMessage };
      } catch (err) {
        const failureMessage = translateErrorMessage((err as Error).message);
        setError(failureMessage);
        return { data: null, errorMessage: failureMessage };
      } finally {
        setSending(false);
      }
    },
    [t]
  );

  const clearRoom = useCallback(
    async (sessionId: string): Promise<boolean> => {
      setError(null);

      const response = await chatApi.clearRoom(sessionId);

      if (response.success) {
        toast.success(t('chat.room_cleared') || 'Chat session cleared');
        return true;
      } else {
        setError(response.message || 'Failed to clear room');
        toast.error(t('chat.clear_room_error') || 'Failed to clear room');
        return false;
      }
    },
    [t]
  );

  return {
    sending,
    error,
    sendMessage,
    clearRoom
  };
};
