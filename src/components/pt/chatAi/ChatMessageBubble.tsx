import React from 'react';
import { Bot, User } from 'lucide-react';

import { cn } from '@/utils/utils';
import type { ChatMessage } from '@/types/api/Chat';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  formatMessageTime: (dateString: string) => string;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, formatMessageTime }) => {
  const isErrorMessage = (message.metadata as { type?: string } | null)?.type === 'error';

  const baseBubbleClass = 'rounded-lg px-4 py-2 border';
  let visualStateClass = 'bg-muted text-foreground border-transparent';

  if (message.senderType === 'PT') {
    visualStateClass = 'bg-primary text-primary-foreground border-transparent';
  } else if (isErrorMessage) {
    visualStateClass = 'bg-muted text-destructive border-destructive/40';
  }

  return (
    <div className={cn('flex gap-3', message.senderType === 'PT' ? 'justify-end' : 'justify-start')}>
      {message.senderType === 'AI' && (
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
        </div>
      )}
      <div className={cn('flex flex-col gap-1 max-w-[70%]', message.senderType === 'PT' && 'items-end')}>
        <div className={cn(baseBubbleClass, visualStateClass)}>
          {message.senderType === 'AI' ? (
            <MarkdownRenderer
              content={message.content}
              className={cn(
                // Giới hạn chiều ngang và cho phép xuống dòng khi nội dung quá dài
                'prose prose-sm max-w-full break-words text-foreground prose-p:mb-2 last:prose-p:mb-0 prose-ul:mb-2 last:prose-ul:mb-0 prose-ol:mb-2 last:prose-ol:mb-0 prose-li:mb-0 prose-pre:rounded-md prose-pre:p-3 prose-pre:bg-background [&_p:last-child]:mb-0 [&_ul:last-child]:mb-0 [&_ol:last-child]:mb-0',
                isErrorMessage && 'text-destructive'
              )}
            />
          ) : (
            <p className={cn('text-sm whitespace-pre-wrap break-words m-0', isErrorMessage && 'text-destructive')}>
              {message.content}
            </p>
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
};

export default ChatMessageBubble;
