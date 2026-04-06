import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export function InputArea({ onSendMessage, isLoading }: InputAreaProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
    
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.style.height = '44px';
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <footer className="bg-white border-t border-gray-200 p-3 z-10">
      <div className="flex items-end gap-2 bg-gray-100 rounded-3xl p-1 pr-2 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi un messaggio..."
          className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-4 text-[15px] text-gray-800 placeholder-gray-500 outline-none"
          rows={1}
          style={{ 
            height: '44px',
            minHeight: '44px',
            maxHeight: '128px'
          }}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="w-10 h-10 mb-1 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:bg-gray-400 transition-colors hover:bg-blue-700"
        >
          <Send size={18} className="ml-0.5" />
        </button>
      </div>
      <p className="text-center text-[10px] text-gray-400 mt-2">
        L'AI può commettere errori. Controlla sempre le informazioni.
      </p>
    </footer>
  );
}
