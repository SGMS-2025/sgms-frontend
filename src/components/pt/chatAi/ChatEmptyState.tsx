import React from 'react';
import type { TFunction } from 'i18next';
import { Send } from 'lucide-react';

import { cn } from '@/utils/utils';

interface ChatEmptyStateProps {
  t: TFunction;
  heroInputRef: React.RefObject<HTMLInputElement | null>;
  messageInput: string;
  onMessageInputChange: (value: string) => void;
  onHeroKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  sending: boolean;
}

const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  t,
  heroInputRef,
  messageInput,
  onMessageInputChange,
  onHeroKeyPress,
  onSendMessage,
  sending
}) => (
  <div className="flex-1 flex items-center justify-center p-6">
    <div className="text-center w-full max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t('chat.empty_state.title') || 'Chúng ta nên bắt đầu từ đâu?'}
        </h2>
      </div>
      <div className="bg-muted/60 dark:bg-muted/20 rounded-full pl-6 pr-2 py-0 flex items-center gap-2 text-left shadow-inner w-full max-w-5xl mx-auto border border-border/50">
        <input
          ref={heroInputRef}
          value={messageInput}
          onChange={(e) => onMessageInputChange(e.target.value)}
          onKeyDown={onHeroKeyPress}
          placeholder={t('chat.empty_state.placeholder') || 'Hỏi bất kỳ điều gì'}
          className="flex-1 bg-transparent text-base focus:outline-none"
        />
        <button
          type="button"
          onClick={onSendMessage}
          disabled={!messageInput.trim() || sending}
          className={cn(
            'h-12 w-12 flex items-center justify-center rounded-full text-primary transition',
            !messageInput.trim() || sending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/10'
          )}
          aria-label={t('chat.send_message') || 'Send message'}
        >
          <Send className="h-6 w-6" />
        </button>
      </div>
    </div>
  </div>
);

export default ChatEmptyState;
