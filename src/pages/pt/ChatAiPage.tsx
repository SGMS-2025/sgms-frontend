import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatRooms, useChatMessages, useChatOperations } from '@/hooks/useChat';
import { format } from 'date-fns';
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal';
import ChatSidebar from '../../components/pt/chatAi/ChatSidebar';
import ChatConversationPanel from '../../components/pt/chatAi/ChatConversationPanel';
import type { SendMessageRequest } from '@/types/api/Chat';

const SINGLE_LINE_TEXTAREA_HEIGHT = 32;
type PendingRoomState = { sessionId: string; title: string; isTemp: boolean } | null;

const ChatAiPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [roomToClear, setRoomToClear] = useState<string | null>(null);
  const [pendingRoom, setPendingRoom] = useState<PendingRoomState>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const [isTextareaExpanded, setIsTextareaExpanded] = useState(false);

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
    if (messagesEndRef.current && messages && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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

  const handleSelectRoom = (sessionId: string) => setSelectedSessionId(sessionId);

  const getNewChatTitle = () => {
    const label = t('chat.new_chat_room');
    return label === 'chat.new_chat_room' ? 'New Chat Room' : label;
  };

  const handleNewChat = () => {
    const tempSessionId = `temp-${globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Date.now().toString()}`;
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
    setMessageInput('');

    const payload: SendMessageRequest = {
      sessionId: selectedSessionId || undefined,
      message: messageText
    };

    const result = await sendMessage(payload);
    if (result) {
      if (!selectedSessionId && result.sessionId) {
        setSelectedSessionId(result.sessionId);
        if (pendingRoom?.isTemp) {
          setPendingRoom({
            sessionId: result.sessionId,
            title: result.room?.title || pendingRoom.title,
            isTemp: false
          });
        }
      }
      await refetchRooms();
      await refetchMessages();
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
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      if (diffInHours < 24) {
        return format(date, 'HH:mm');
      } else if (diffInHours < 48) {
        return t('chat.yesterday') || 'Yesterday';
      }
      return format(date, 'MMM dd, yyyy');
    } catch {
      return '';
    }
  };

  const clearDialogRoomName = roomBeingClearedTitle || t('chat.conversation') || 'this conversation';
  const isSelectedRoomTemp = Boolean(pendingRoom?.isTemp && pendingRoom.sessionId === selectedSessionId);
  const showPendingRoom =
    Boolean(pendingRoom) && !rooms.some((existingRoom) => existingRoom.sessionId === pendingRoom?.sessionId);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 p-2 overflow-hidden">
      <ChatSidebar
        t={t}
        roomsLoading={roomsLoading}
        visibleRooms={visibleRooms}
        pendingRoom={pendingRoom}
        showPendingRoom={showPendingRoom}
        selectedSessionId={selectedSessionId}
        onSelectRoom={handleSelectRoom}
        onNewChat={handleNewChat}
        onRequestClear={handleRequestClear}
        resolveRoomTitle={resolveRoomTitle}
      />

      <ChatConversationPanel
        t={t}
        selectedSessionId={selectedSessionId}
        room={room}
        messages={messages}
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
