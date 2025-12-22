import React from 'react';
import type { TFunction } from 'i18next';
import { MessageSquare, Plus, Trash2, Loader2, MoreVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils/utils';
import type { ChatRoom } from '@/types/api/Chat';

type PendingRoomState = { sessionId: string; title: string; isTemp: boolean } | null;

export interface ChatSidebarProps {
  t: TFunction;
  roomsLoading: boolean;
  visibleRooms: ChatRoom[];
  pendingRoom: PendingRoomState;
  showPendingRoom: boolean;
  selectedSessionId: string | null;
  onSelectRoom: (sessionId: string) => void;
  onNewChat: () => void;
  onRequestClear: (sessionId: string, e: React.MouseEvent) => void;
  resolveRoomTitle: (title?: string | null, sessionId?: string) => string | undefined | null;
  isMobileSidebarOpen?: boolean;
  onMobileToggle?: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  t,
  roomsLoading,
  visibleRooms,
  pendingRoom,
  showPendingRoom,
  selectedSessionId,
  onSelectRoom,
  onNewChat,
  onRequestClear,
  resolveRoomTitle,
  isMobileSidebarOpen: _isMobileSidebarOpen,
  onMobileToggle
}) => {
  const renderRoomContent = () => {
    if (roomsLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (visibleRooms.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-4">{t('chat.no_conversations') || 'No conversations yet'}</p>
          <Button variant="outline" size="sm" className="relative z-10" onClick={onNewChat}>
            <Plus className="h-4 w-4 mr-2" />
            {t('chat.start_new') || 'Start New Chat'}
          </Button>
        </div>
      );
    }

    return (
      <div className="pl-2 pr-3 py-1">
        {showPendingRoom && pendingRoom && (
          <SidebarRoomItem
            title={resolveRoomTitle(pendingRoom.title, pendingRoom.sessionId)}
            isSelected={selectedSessionId === pendingRoom.sessionId}
            isTemp={pendingRoom.isTemp}
            onClick={() => onSelectRoom(pendingRoom.sessionId)}
            statusLabel={pendingRoom.isTemp ? t('chat.pending') || 'Pending...' : undefined}
          />
        )}
        {visibleRooms.map((roomItem) => (
          <SidebarRoomItem
            key={roomItem._id}
            title={resolveRoomTitle(roomItem.title, roomItem.sessionId)}
            isSelected={selectedSessionId === roomItem.sessionId}
            onClick={() => onSelectRoom(roomItem.sessionId)}
            action={
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                onClick={(e) => onRequestClear(roomItem.sessionId, e)}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full lg:w-60 flex-shrink-0 flex flex-col rounded-xl border bg-card text-card-foreground shadow-lg lg:shadow-sm min-h-0">
      <div className="border-b px-3 py-2 md:py-3">
        <div className="flex items-center justify-between gap-2">
          {onMobileToggle && (
            <Button variant="ghost" size="icon" onClick={onMobileToggle} className="h-8 w-8" title="Close sidebar">
              <MoreVertical className="h-4 w-4" />
            </Button>
          )}
          <h3 className="text-base md:text-lg font-semibold flex-1 min-w-0 overflow-x-auto whitespace-nowrap pr-2">
            {t('chat.conversations') || 'Conversations'}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onNewChat();
            }}
            className="h-8 w-8 md:h-9 md:w-9 relative z-10"
            title={t('chat.new_chat') || 'New Chat'}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 p-0 overflow-hidden min-h-0">
        <ScrollArea className="h-full min-h-0">{renderRoomContent()}</ScrollArea>
      </div>
    </div>
  );
};

interface SidebarRoomItemProps {
  title?: string | null;
  isSelected: boolean;
  isTemp?: boolean;
  onClick: () => void;
  statusLabel?: string;
  action?: React.ReactNode;
}

const SidebarRoomItem: React.FC<SidebarRoomItemProps> = ({
  title,
  isSelected,
  isTemp = false,
  onClick,
  statusLabel,
  action
}) => {
  const resolveStatusClass = () => {
    if (isTemp) {
      return 'bg-primary/5';
    }

    if (isSelected) {
      return 'bg-primary/10';
    }

    return 'hover:bg-accent';
  };

  return (
    <button
      type="button"
      className={cn(
        'group relative flex flex-col gap-1 rounded-lg px-3 py-2 cursor-pointer transition-colors mb-2 w-full text-left',
        resolveStatusClass()
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" title={title ?? undefined}>
            {title}
          </p>
        </div>
        {action}
      </div>
      {statusLabel && <div className="text-xs text-muted-foreground">{statusLabel}</div>}
    </button>
  );
};

export default ChatSidebar;
