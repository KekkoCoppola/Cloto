import ReactMarkdown from 'react-markdown';
import { User, Bot } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Message } from '../../types';

interface MessageBubbleProps {
  msg: Message;
}

export function MessageBubble({ msg }: MessageBubbleProps) {
  const isUser = msg.role === 'user';

  return (
    <div
      className={cn(
        "flex gap-3 max-w-[85%]",
        isUser ? "ml-auto flex-row-reverse" : ""
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto",
        isUser ? "bg-gray-200 text-gray-600" : "bg-blue-600 text-white"
      )}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Message Bubble */}
      <div className={cn(
        "px-4 py-3 rounded-2xl text-[15px] leading-relaxed",
        isUser 
          ? "bg-blue-600 text-white rounded-br-sm" 
          : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.text}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
