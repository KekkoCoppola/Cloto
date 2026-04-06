import { useRef, useEffect } from 'react';
import { Loader2, Bot } from 'lucide-react';
import { Message } from '../../types';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <main className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
      {messages.length === 0 && isLoading && (
        <div className="flex justify-center items-center h-full">
          <div className="flex flex-col items-center text-gray-400 gap-2">
            <Loader2 className="animate-spin" size={24} />
            <p className="text-sm">Inizializzazione coach...</p>
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} msg={msg} />
      ))}
      
      {isLoading && messages.length > 0 && (
        <div className="flex gap-3 max-w-[85%]">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-auto">
            <Bot size={16} />
          </div>
          <div className="px-4 py-3 rounded-2xl bg-white shadow-sm border border-gray-100 rounded-bl-sm flex items-center gap-1">
            <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} className="h-1" />
    </main>
  );
}
