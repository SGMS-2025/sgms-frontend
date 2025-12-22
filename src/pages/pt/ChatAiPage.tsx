import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatRooms, useChatMessages, useChatOperations } from '@/hooks/useChat';
import { format } from 'date-fns';
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal';
import ChatSidebar from '../../components/pt/chatAi/ChatSidebar';
import ChatConversationPanel from '../../components/pt/chatAi/ChatConversationPanel';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import type { ChatMessage, SendMessageRequest } from '@/types/api/Chat';

const SINGLE_LINE_TEXTAREA_HEIGHT = 32;
const createTempSessionId = () =>
  `temp-${globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Date.now().toString()}`;
type PendingRoomState = { sessionId: string; title: string; isTemp: boolean } | null;

const ChatAiPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [roomToClear, setRoomToClear] = useState<string | null>(null);
  const [pendingRoom, setPendingRoom] = useState<PendingRoomState>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const [isTextareaExpanded, setIsTextareaExpanded] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const autoResizeTextarea = useCallback(() => {
    const textarea = messageInputRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const nextHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${nextHeight}px`;
    setIsTextareaExpanded(nextHeight > SINGLE_LINE_TEXTAREA_HEIGHT + 4);
  }, []);

  const { rooms = [], loading: roomsLoading, refetch: refetchRooms } = useChatRooms();
  const visibleRooms = useMemo(() => rooms.filter((room) => Boolean(room.lastMessageAt)), [rooms]);
  const isPendingTempSession = pendingRoom?.isTemp && pendingRoom.sessionId === selectedSessionId;
  const {
    room,
    messages = [],
    loading: messagesLoading,
    refetch: refetchMessages,
    hasMore,
    loadMore
  } = useChatMessages(isPendingTempSession ? null : selectedSessionId);
  const { sending, sendMessage, clearRoom } = useChatOperations();

  useEffect(() => {
    if (messagesEndRef.current && (messages.length > 0 || optimisticMessages.length > 0)) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, optimisticMessages]);

  useEffect(() => {
    if (pendingRoom && rooms.some((r) => r.sessionId === pendingRoom.sessionId)) {
      setPendingRoom(null);
    }
  }, [pendingRoom, rooms]);

  useEffect(() => {
    setPendingRoom(null);
  }, []);

  useEffect(() => {
    autoResizeTextarea();
  }, [messageInput, autoResizeTextarea]);

  useEffect(() => {
    if (!selectedSessionId) {
      heroInputRef.current?.focus();
    }
  }, [selectedSessionId]);

  const handleSelectRoom = (sessionId: string | null) => setSelectedSessionId(sessionId);

  const getNewChatTitle = () => {
    const label = t('chat.new_chat_room');
    return label === 'chat.new_chat_room' ? 'New Chat Room' : label;
  };

  const handleNewChat = () => {
    const tempSessionId = createTempSessionId();
    const placeholderTitle = getNewChatTitle();
    setPendingRoom({ sessionId: tempSessionId, title: placeholderTitle, isTemp: true });
    setSelectedSessionId(tempSessionId);
    setMessageInput('');
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || sending) return;
    const messageText = messageInput.trim();
    const wasTempSession = !selectedSessionId || isPendingTempSession;
    const activeSessionId = selectedSessionId ?? pendingRoom?.sessionId ?? createTempSessionId();

    if (!selectedSessionId) {
      const placeholderTitle = pendingRoom?.title || getNewChatTitle();
      if (pendingRoom?.sessionId !== activeSessionId) {
        setPendingRoom({ sessionId: activeSessionId, title: placeholderTitle, isTemp: true });
      }
      setSelectedSessionId(activeSessionId);
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 0);
    }

    setMessageInput('');

    const nowIso = new Date().toISOString();
    const optimisticMessage: ChatMessage = {
      _id: `optimistic-${Date.now()}`,
      chatRoomId: activeSessionId,
      senderType: 'PT',
      role: 'user',
      content: messageText,
      error: null,
      metadata: null,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    setOptimisticMessages((prev) => [...prev, optimisticMessage]);

    const payload: SendMessageRequest = {
      sessionId: wasTempSession ? undefined : selectedSessionId || undefined,
      message: messageText
    };

    const { data: sendResult, errorMessage } = await sendMessage(payload);
    if (sendResult) {
      if (sendResult.sessionId && wasTempSession) {
        setSelectedSessionId(sendResult.sessionId);
      }
      if (sendResult.sessionId && sendResult.sessionId !== activeSessionId) {
        setOptimisticMessages((prev) =>
          prev.map((msg) => (msg.chatRoomId === activeSessionId ? { ...msg, chatRoomId: sendResult.sessionId } : msg))
        );
      }
      if (sendResult.sessionId) {
        setPendingRoom((prev) => {
          if (prev?.sessionId !== activeSessionId) {
            return prev;
          }
          return {
            sessionId: sendResult.sessionId,
            title: sendResult.room?.title || prev.title,
            isTemp: false
          };
        });
      }
      await refetchRooms();
      await refetchMessages();
      setOptimisticMessages((prev) => prev.filter((msg) => msg._id !== optimisticMessage._id));
    } else {
      setOptimisticMessages((prev) => {
        const updatedMessages = prev.map((msg) =>
          msg._id === optimisticMessage._id ? { ...msg, error: errorMessage || msg.error } : msg
        );

        if (!errorMessage) {
          return updatedMessages;
        }

        const errorTimestamp = new Date().toISOString();
        const errorResponseMessage: ChatMessage = {
          _id: `error-${Date.now()}`,
          chatRoomId: activeSessionId,
          senderType: 'AI',
          role: 'assistant',
          content: errorMessage,
          error: errorMessage,
          metadata: { type: 'error' },
          createdAt: errorTimestamp,
          updatedAt: errorTimestamp
        };

        return [...updatedMessages, errorResponseMessage];
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleHeroKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearRoom = async () => {
    if (roomToClear) {
      const success = await clearRoom(roomToClear);
      if (success) {
        if (roomToClear === selectedSessionId) {
          setSelectedSessionId(null);
        }
        await refetchRooms();
        setRoomToClear(null);
      }
    }
    setShowClearDialog(false);
  };

  const handleRequestClear = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRoomToClear(sessionId);
    setShowClearDialog(true);
  };

  const resolveRoomTitle = useCallback(
    (title?: string | null, sessionId?: string) => {
      if (!title || title === 'chat.new_chat_room') {
        if (sessionId) {
          return `Sgms AI #${sessionId.slice(-8)}`;
        }
        const label = t('chat.new_conversation');
        return label === 'chat.new_conversation' ? 'New Conversation' : label;
      }
      return title;
    },
    [t]
  );

  const roomBeingCleared = useMemo(() => {
    if (!roomToClear) return undefined;
    const matchedRoom = rooms.find((r) => r.sessionId === roomToClear);
    if (matchedRoom) return matchedRoom;
    if (pendingRoom?.sessionId === roomToClear) return pendingRoom;
    return undefined;
  }, [roomToClear, rooms, pendingRoom]);

  const roomBeingClearedTitle = useMemo(
    () => resolveRoomTitle(roomBeingCleared?.title, roomToClear || roomBeingCleared?.sessionId || undefined),
    [roomBeingCleared, roomToClear, resolveRoomTitle]
  );

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const timeLabel = format(date, 'HH:mm');

      const isSameDay = date.toDateString() === now.toDateString();
      if (isSameDay) {
        return timeLabel;
      }

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = date.toDateString() === yesterday.toDateString();
      const yesterdayLabel = t('chat.yesterday') || 'Yesterday';
      if (isYesterday) {
        return `${timeLabel}, ${yesterdayLabel}`;
      }

      const weekdayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
      const weekdayKey = weekdayKeys[date.getDay()];
      const weekdayLabel = t(`common.days.${weekdayKey}`) || weekdayKey.charAt(0).toUpperCase() + weekdayKey.slice(1);
      return `${timeLabel}, ${weekdayLabel}`;
    } catch {
      return '';
    }
  };

  const clearDialogRoomName = roomBeingClearedTitle || t('chat.conversation') || 'this conversation';
  const isSelectedRoomTemp = Boolean(pendingRoom?.isTemp && pendingRoom.sessionId === selectedSessionId);
  const showPendingRoom =
    Boolean(pendingRoom) && !rooms.some((existingRoom) => existingRoom.sessionId === pendingRoom?.sessionId);
  const displayedMessages = useMemo(() => {
    if (!selectedSessionId) {
      return messages;
    }
    const optimisticForRoom = optimisticMessages.filter((msg) => msg.chatRoomId === selectedSessionId);
    return [...messages, ...optimisticForRoom];
  }, [messages, optimisticMessages, selectedSessionId]);
  const showBotTyping = useMemo(() => {
    if (!selectedSessionId || !sending) {
      return false;
    }
    return optimisticMessages.some((msg) => msg.chatRoomId === selectedSessionId && msg.senderType === 'PT');
  }, [selectedSessionId, sending, optimisticMessages]);

  return (
    <div className="relative flex h-[calc(100vh-8rem)] gap-2 md:gap-4 p-1 md:p-2 overflow-hidden">
      {/* Mobile Menu Button - Only show when sidebar is closed */}
      {!isMobileSidebarOpen && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="fixed top-[5.5rem] left-2 z-[110] lg:hidden h-10 w-10 shadow-lg bg-background"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      )}

      {/* Overlay for mobile */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      <div
        className={`
        fixed lg:relative
        inset-y-0 left-0
        z-[101]
        w-60 lg:w-60
        transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <ChatSidebar
          t={t}
          roomsLoading={roomsLoading}
          visibleRooms={visibleRooms}
          pendingRoom={pendingRoom}
          showPendingRoom={showPendingRoom}
          selectedSessionId={selectedSessionId}
          onSelectRoom={(sessionId: string | null) => {
            handleSelectRoom(sessionId);
            setIsMobileSidebarOpen(false);
          }}
          onNewChat={() => {
            handleNewChat();
            setIsMobileSidebarOpen(false);
          }}
          onRequestClear={handleRequestClear}
          resolveRoomTitle={resolveRoomTitle}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onMobileToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />
      </div>

      <ChatConversationPanel
        t={t}
        selectedSessionId={selectedSessionId}
        room={room}
        messages={displayedMessages}
        showBotTyping={showBotTyping}
        messagesLoading={messagesLoading}
        hasMore={hasMore}
        loadMore={loadMore}
        formatMessageTime={formatMessageTime}
        messagesEndRef={messagesEndRef}
        messageInput={messageInput}
        onMessageInputChange={setMessageInput}
        onSendMessage={handleSendMessage}
        onTextareaKeyPress={handleKeyPress}
        onHeroKeyPress={handleHeroKeyPress}
        messageInputRef={messageInputRef}
        heroInputRef={heroInputRef}
        sending={sending}
        onRefreshMessages={refetchMessages}
        onRequestClear={handleRequestClear}
        isSelectedRoomTemp={isSelectedRoomTemp}
        isTextareaExpanded={isTextareaExpanded}
        resolveRoomTitle={resolveRoomTitle}
        pendingRoom={pendingRoom}
      />

      <DeleteConfirmationModal
        isOpen={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        onConfirm={handleClearRoom}
        title={t('chat.clear_conversation') || 'Clear Conversation'}
        description={
          t('chat.clear_conversation_description', { roomName: clearDialogRoomName }) ||
          `Are you sure you want to delete ${clearDialogRoomName}? This action cannot be undone.`
        }
      />
    </div>
  );
};

export default ChatAiPage;
