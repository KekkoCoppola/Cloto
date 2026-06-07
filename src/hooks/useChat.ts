import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatService } from '../services/gemini';
import { Message, MemoryState } from '../types';

const SESSION_STORAGE_KEY = 'cloto.sessionId';

const EMPTY_MEMORY: MemoryState = {
  dati_personali: '',
  esperienze: '',
  formazione: '',
  competenze_tecniche: '',
  competenze_trasversali: '',
  lingue: '',
  certificazioni: '',
  progetti: '',
  extra: '',
  lacune_domande: '',
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [memory, setMemory] = useState<MemoryState>(EMPTY_MEMORY);

  const chatServiceRef = useRef(new ChatService());
  const sessionIdRef = useRef<string | null>(null);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      const { sessionId, data } = await chatServiceRef.current.createSession(storedSessionId);
      sessionIdRef.current = sessionId;
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);

      setProgress(data.progress);
      setMemory(data.memory);

      setMessages([{
        id: Date.now().toString(),
        role: 'model',
        text: data.answer || 'Ciao! Sono il tuo career coach. Iniziamo a costruire il tuo CV.',
      }]);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      sessionIdRef.current = null;
      setMessages([{
        id: Date.now().toString(),
        role: 'model',
        text: "Si e verificato un errore durante l'inizializzazione. Ricarica la pagina per riprovare.",
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

      setProgress(data.progress);
      setMemory(data.memory);

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
      const errorText = error instanceof Error && error.message.includes('404')
        ? 'La sessione non e piu valida. Ricarica la pagina per crearne una nuova.'
        : 'Scusa, ho riscontrato un errore di connessione. Riprova.';

      if (errorText.includes('sessione')) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        sessionIdRef.current = null;
      }

      setMessages([
        ...currentMessages,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: errorText,
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
