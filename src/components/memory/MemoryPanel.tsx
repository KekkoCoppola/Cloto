import { Database, X, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MemoryState } from '../../types';

interface MemoryPanelProps {
  show: boolean;
  memory: MemoryState;
  onClose: () => void;
}

export function MemoryPanel({ show, memory, onClose }: MemoryPanelProps) {
  return (
    <>
      <div className={cn(
        "absolute inset-0 bg-black/20 z-40 transition-opacity duration-300",
        show ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )} onClick={onClose} />
      
      <div className={cn(
        "absolute top-0 right-0 bottom-0 w-4/5 max-w-sm bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col",
        show ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 text-gray-800 font-semibold">
            <Database size={18} className="text-blue-600" />
            Memoria Agente
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
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
    </>
  );
}
