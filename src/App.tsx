import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { Send, User, Bot, Loader2, FileText, Database, X, ChevronRight } from 'lucide-react';
import { cn } from './lib/utils';

const SYSTEM_PROMPT = `Sei Cloto, un career coach, consulente esperto e recruiter HR.

STILE: Estremamente sintetico, diretto e preciso. NESSUN testo lungo. Massimo 2-3 frasi per messaggio.

COMPITO: Guidare l'utente nella creazione di un CV perfetto, raccogliendo informazioni blocco per blocco. Agisci da VERO CONSULENTE: estrapola dalle parole dell'utente il valore reale da inserire nel CV.

REGOLE DI INTERAZIONE:
- Fai UNA SOLA domanda alla volta.
- Sii telegrafico: 1 breve feedback + 1 domanda diretta.
- Se l'utente è vago, fai una domanda mirata per ottenere il dettaglio mancante.
- ESPERIENZE LAVORATIVE: Chiedi SEMPRE dettagli specifici su mansioni e risultati (metriche, impatto).
- Non passare al blocco successivo finché quello corrente non è completo.

STRUTTURA MEMORIA:
1. Dati Personali
2. Esperienze Lavorative
3. Formazione
4. Competenze
5. Extra

GENERAZIONE CV:
Solo quando l'utente dice 'genera CV' o tutti i blocchi sono al 100%, la tua 'answer' deve contenere il CV completo in Markdown.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    progress: { type: 'number', description: 'Percentuale di completamento totale (0-100)' },
    memory: {
      type: 'object',
      properties: {
        dati_personali: { type: 'string' },
        esperienze: { type: 'string' },
        formazione: { type: 'string' },
        competenze: { type: 'string' },
        extra: { type: 'string' }
      },
      required: ['dati_personali', 'esperienze', 'formazione', 'competenze', 'extra']
    },
    answer: { type: 'string', description: 'La tua risposta testuale per l\'utente' },
    is_cv_complete: { type: 'boolean', description: 'True se il CV è pronto per la generazione' }
  },
  required: ['progress', 'memory', 'answer', 'is_cv_complete']
};

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

type MemoryState = {
  dati_personali: string;
  esperienze: string;
  formazione: string;
  competenze: string;
  extra: string;
};


// Utility for exponential backoff retries
const withRetry = async <T,>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw lastError;
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // New state for progress and memory
  const [progress, setProgress] = useState(0);
  const [memory, setMemory] = useState<MemoryState>({
    dati_personali: "",
    esperienze: "",
    formazione: "",
    competenze: "",
    extra: ""
  });
  const [showMemory, setShowMemory] = useState(false);

  // Logic moved to direct JSON parsing


  // Initialize Gemini Chat
  useEffect(() => {
    const initChat = async () => {
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const ai = new GoogleGenAI({ apiKey });
        const chat = ai.chats.create({
          model: 'gemini-1.5-flash',
          config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.7,
            responseMimeType: 'application/json',
            responseJsonSchema: RESPONSE_SCHEMA as any,
          },
        });
        setChatSession(chat);

        // Start the conversation
        setIsLoading(true);
        const result = await withRetry(() => chat.sendMessage({ message: "<user_input>Ciao! Vorrei iniziare a creare il mio CV.</user_input>" })) as any;
        
        const data = JSON.parse(result.text);
        
        if (data.progress !== undefined) setProgress(data.progress);
        if (data.memory) setMemory(data.memory);

        setMessages([
          {
            id: Date.now().toString(),
            role: 'model',
            text: data.answer || "Ciao! Sono il tuo career coach. Iniziamo a costruire il tuo CV perfetto.",
          }
        ]);
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        setMessages([
          {
            id: Date.now().toString(),
            role: 'model',
            text: "Si è verificato un errore durante l'inizializzazione. Ricarica la pagina per riprovare.",
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    
    // Reset textarea height
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.style.height = '44px';
    }
    
    // Add user message to UI immediately
    const newMessages = [
      ...messages,
      { id: Date.now().toString(), role: 'user' as const, text: userMsg }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await withRetry(() => chatSession.sendMessage({ message: `<user_input>${userMsg}</user_input>` })) as any;
      
      const data = JSON.parse(response.text);
      
      if (data) {
        if (data.progress !== undefined) setProgress(data.progress);
        if (data.memory) setMemory(data.memory);
      }

      setMessages([
        ...newMessages,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: data.answer || "Mi dispiace, non ho capito. Puoi ripetere?",
        }
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages([
        ...newMessages,
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto relative shadow-xl overflow-hidden sm:border-x sm:border-gray-200">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 z-10 sticky top-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 leading-tight">Cloto</h1>
              <p className="text-xs text-gray-500">Recruiter HR & Career Coach</p>
            </div>
          </div>
          <button 
            onClick={() => setShowMemory(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-medium transition-colors"
          >
            <Database size={14} />
            Memoria
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-1.5">
          <div 
            className="bg-blue-600 h-1.5 transition-all duration-500 ease-out"
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>
        <div className="px-4 py-1.5 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center text-[10px] font-medium text-blue-800 uppercase tracking-wider">
          <span>Progresso CV</span>
          <span>{progress}%</span>
        </div>
      </header>

      {/* Memory Slide-over Panel */}
      <div className={cn(
        "absolute inset-0 bg-black/20 z-40 transition-opacity duration-300",
        showMemory ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )} onClick={() => setShowMemory(false)} />
      
      <div className={cn(
        "absolute top-0 right-0 bottom-0 w-4/5 max-w-sm bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col",
        showMemory ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 text-gray-800 font-semibold">
            <Database size={18} className="text-blue-600" />
            Memoria Agente
          </div>
          <button onClick={() => setShowMemory(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-xs text-gray-500 mb-4">Ecco cosa l'agente ha memorizzato finora per il tuo CV:</p>
          
          {Object.entries(memory).map(([key, value]) => (
            <div key={key} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <ChevronRight size={12} className="text-blue-500" />
                {key.replace('_', ' ')}
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {value ? value : <span className="text-gray-400 italic">In attesa di informazioni...</span>}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
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
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            {/* Avatar */}
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto",
              msg.role === 'user' ? "bg-gray-200 text-gray-600" : "bg-blue-600 text-white"
            )}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            {/* Message Bubble */}
            <div className={cn(
              "px-4 py-3 rounded-2xl text-[15px] leading-relaxed",
              msg.role === 'user' 
                ? "bg-blue-600 text-white rounded-br-sm" 
                : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
            )}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              ) : (
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
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

      {/* Input Area */}
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
            disabled={isLoading || !chatSession}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !chatSession}
            className="w-10 h-10 mb-1 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:bg-gray-400 transition-colors hover:bg-blue-700"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          L'AI può commettere errori. Controlla sempre le informazioni.
        </p>
      </footer>
    </div>
  );
}
