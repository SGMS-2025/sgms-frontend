import React from 'react';
import type { TFunction } from 'i18next';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, RefreshCw, Trash2, Send, Bot } from 'lucide-react';

import { cn } from '@/utils/utils';
import type { ChatMessage, ChatRoom } from '@/types/api/Chat';
import ChatMessageBubble from './ChatMessageBubble';
import ChatEmptyState from './ChatEmptyState';

type PendingRoomState = { sessionId: string; title: string; isTemp: boolean } | null;

export interface ChatConversationPanelProps {
  t: TFunction;
  selectedSessionId: string | null;
  room?: ChatRoom | null;
  messages: ChatMessage[];
  showBotTyping: boolean;
  messagesLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  formatMessageTime: (dateString: string) => string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messageInput: string;
  onMessageInputChange: (value: string) => void;
  onSendMessage: () => void;
  onTextareaKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onHeroKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  messageInputRef: React.RefObject<HTMLTextAreaElement | null>;
  heroInputRef: React.RefObject<HTMLInputElement | null>;
  sending: boolean;
  onRefreshMessages: () => Promise<unknown> | void;
  onRequestClear: (sessionId: string, e: React.MouseEvent) => void;
  isSelectedRoomTemp: boolean;
  isTextareaExpanded: boolean;
  resolveRoomTitle: (title?: string | null, sessionId?: string) => string | undefined | null;
  pendingRoom: PendingRoomState;
}

const ChatConversationPanel: React.FC<ChatConversationPanelProps> = ({
  t,
  selectedSessionId,
  room,
  messages,
  showBotTyping,
  messagesLoading,
  hasMore,
  loadMore,
  formatMessageTime,
  messagesEndRef,
  messageInput,
  onMessageInputChange,
  onSendMessage,
  onTextareaKeyPress,
  onHeroKeyPress,
  messageInputRef,
  heroInputRef,
  sending,
  onRefreshMessages,
  onRequestClear,
  isSelectedRoomTemp,
  isTextareaExpanded,
  resolveRoomTitle,
  pendingRoom
}) => {
  const renderMessagesContent = () => {
    if (messagesLoading && messages.length === 0) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            {t('chat.no_messages') || 'No messages yet. Start the conversation!'}
          </p>
        </div>
      );
    }
    return messages.map((message) => (
      <ChatMessageBubble key={message._id} message={message} formatMessageTime={formatMessageTime} />
    ));
  };

  return (
    <div className="flex-1 flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm min-h-0">
      {selectedSessionId ? (
        <>
          <div className="border-b px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-mb font-semibold flex-1 min-w-0 overflow-x-auto whitespace-nowrap pr-4">
                {room?.title ||
                  resolveRoomTitle(
                    pendingRoom?.sessionId === selectedSessionId ? pendingRoom?.title : room?.title,
                    selectedSessionId
                  ) ||
                  t('chat.conversation') ||
                  'Conversation'}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRefreshMessages}
                  disabled={messagesLoading}
                  className="h-8 w-8"
                >
                  <RefreshCw className={cn('h-4 w-4', messagesLoading && 'animate-spin')} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => onRequestClear(selectedSessionId, e)}
                  disabled={isSelectedRoomTemp}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col p-0 min-h-0">
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 space-y-4">
                {hasMore && (
                  <div className="flex justify-center">
                    <Button variant="ghost" size="sm" onClick={loadMore} disabled={messagesLoading}>
                      {messagesLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {t('chat.load_more') || 'Load More'}
                    </Button>
                  </div>
                )}
                {renderMessagesContent()}
                {showBotTyping && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 max-w-[70%]">
                      <div className="rounded-lg px-4 py-2 bg-muted text-foreground w-fit">
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                          <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                          <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground px-1">
                        {t('chat.thinking_indicator') || 'Sgms AI is thinking...'}
                      </p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="px-4 py-1.5">
              <div
                className={cn(
                  'flex gap-2 border bg-background shadow-sm px-3 py-1 transition-all',
                  isTextareaExpanded ? 'items-end rounded-lg' : 'items-center rounded-full'
                )}
              >
                <Textarea
                  ref={messageInputRef}
                  value={messageInput}
                  onChange={(e) => onMessageInputChange(e.target.value)}
                  onKeyDown={onTextareaKeyPress}
                  placeholder={t('chat.type_message') || 'Type your message...'}
                  rows={1}
                  className="min-h-[32px] max-h-48 resize-none border-0 bg-transparent pl-2 pr-0 py-0 shadow-none leading-[32px] break-all focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={sending}
                />
                <Button
                  onClick={onSendMessage}
                  disabled={!messageInput.trim() || sending}
                  size="icon"
                  className="h-8 w-8 rounded-full"
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <ChatEmptyState
          t={t}
          heroInputRef={heroInputRef}
          messageInput={messageInput}
          onMessageInputChange={onMessageInputChange}
          onHeroKeyPress={onHeroKeyPress}
          onSendMessage={onSendMessage}
          sending={sending}
        />
      )}
    </div>
  );
};

export default ChatConversationPanel;
