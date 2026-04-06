import { useState } from 'react';
import { useChat } from './hooks/useChat';
import { Header } from './components/layout/Header';
import { MemoryPanel } from './components/memory/MemoryPanel';
import { MessageList } from './components/chat/MessageList';
import { InputArea } from './components/chat/InputArea';

export default function App() {
  const { messages, isLoading, progress, memory, sendMessage } = useChat();
  const [showMemory, setShowMemory] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto relative shadow-xl overflow-hidden sm:border-x sm:border-gray-200">
      <Header 
        progress={progress} 
        onShowMemory={() => setShowMemory(true)} 
      />

      <MemoryPanel 
        show={showMemory} 
        memory={memory} 
        onClose={() => setShowMemory(false)} 
      />

      <MessageList 
        messages={messages} 
        isLoading={isLoading} 
      />

      <InputArea 
        onSendMessage={sendMessage} 
        isLoading={isLoading} 
      />
    </div>
  );
}
