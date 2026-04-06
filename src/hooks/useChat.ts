import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatService } from '../services/gemini';
import { Message, MemoryState } from '../types';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [memory, setMemory] = useState<MemoryState>({
    dati_personali: '',
    esperienze: '',
    formazione: '',
    competenze: '',
    extra: '',
  });

  // CRITICA-01 fix: refs prevent re-instantiation on every render.
  const chatServiceRef = useRef(new ChatService());
  const sessionIdRef = useRef<string | null>(null);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    try {
      const { sessionId, data } = await chatServiceRef.current.createSession();
      sessionIdRef.current = sessionId;

      if (data.progress !== undefined) setProgress(data.progress);
      if (data.memory) setMemory(data.memory);

      setMessages([{
        id: Date.now().toString(),
        role: 'model',
        text: data.answer || 'Ciao! Sono il tuo career coach. Iniziamo a costruire il tuo CV perfetto.',
      }]);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setMessages([{
        id: Date.now().toString(),
        role: 'model',
        text: "Si è verificato un errore durante l'inizializzazione. Ricarica la pagina per riprovare.",
      }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = async (text: string) => {
    const sessionId = sessionIdRef.current;
    if (!text.trim() || !sessionId || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim() };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setIsLoading(true);

    try {
      const data = await chatServiceRef.current.sendMessage(sessionId, text.trim());

      if (data.progress !== undefined) setProgress(data.progress);
      if (data.memory) setMemory(data.memory);

      setMessages([
        ...currentMessages,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: data.answer || 'Mi dispiace, non ho capito. Puoi ripetere?',
        },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([
        ...currentMessages,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: 'Scusa, ho riscontrato un errore di connessione. Riprova.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    messages,
    isLoading,
    progress,
    memory,
    sendMessage,
    initialize,
  };
}
