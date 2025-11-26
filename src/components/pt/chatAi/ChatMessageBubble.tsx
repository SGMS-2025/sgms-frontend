import React from 'react';
import { Bot, User } from 'lucide-react';

import { cn } from '@/utils/utils';
import type { ChatMessage } from '@/types/api/Chat';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  formatMessageTime: (dateString: string) => string;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, formatMessageTime }) => (
  <div className={cn('flex gap-3', message.senderType === 'PT' ? 'justify-end' : 'justify-start')}>
    {message.senderType === 'AI' && (
      <div className="flex-shrink-0">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      </div>
    )}
    <div className={cn('flex flex-col gap-1 max-w-[70%]', message.senderType === 'PT' && 'items-end')}>
      <div
        className={cn(
          'rounded-lg px-4 py-2',
          message.senderType === 'PT' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
        )}
      >
        {message.senderType === 'AI' ? (
          <MarkdownRenderer
            content={message.content}
            className="prose prose-sm max-w-none text-foreground prose-p:mb-2 last:prose-p:mb-0 prose-ul:mb-2 prose-ol:mb-2 prose-li:mb-0 prose-pre:rounded-md prose-pre:p-3 prose-pre:bg-background"
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}
      </div>
      <p className="text-xs text-muted-foreground px-1">{formatMessageTime(message.createdAt)}</p>
    </div>
    {message.senderType === 'PT' && (
      <div className="flex-shrink-0">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
      </div>
    )}
  </div>
);

export default ChatMessageBubble;
