import { useState, useEffect, useCallback } from 'react';
import { GeminiService } from '../services/gemini';
import { Message, MemoryState } from '../types';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [chatSession, setChatSession] = useState<any>(null);
  const [memory, setMemory] = useState<MemoryState>({
    dati_personali: "",
    esperienze: "",
    formazione: "",
    competenze: "",
    extra: ""
  });

  const geminiService = new GeminiService(import.meta.env.VITE_GEMINI_API_KEY);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    try {
      const chat = await geminiService.createChat();
      setChatSession(chat);

      const data = await geminiService.sendMessage(chat, "Ciao! Vorrei iniziare a creare il mio CV.");
      
      if (data.progress !== undefined) setProgress(data.progress);
      if (data.memory) setMemory(data.memory);

      setMessages([{
        id: Date.now().toString(),
        role: 'model',
        text: data.answer || "Ciao! Sono il tuo career coach. Iniziamo a costruire il tuo CV perfetto.",
      }]);
    } catch (error) {
      console.error("Failed to initialize chat:", error);
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
    if (!text.trim() || !chatSession || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim() };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setIsLoading(true);

    try {
      const data = await geminiService.sendMessage(chatSession, text.trim());
      
      if (data.progress !== undefined) setProgress(data.progress);
      if (data.memory) setMemory(data.memory);

      setMessages([
        ...currentMessages,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: data.answer || "Mi dispiace, non ho capito. Puoi ripetere?",
        }
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages([
        ...currentMessages,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: "Scusa, ho riscontrato un errore di connessione. Riprova.",
        }
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
    initialize
  };
}
