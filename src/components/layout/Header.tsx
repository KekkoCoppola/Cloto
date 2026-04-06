import { FileText, Database } from 'lucide-react';

interface HeaderProps {
  progress: number;
  onShowMemory: () => void;
}

export function Header({ progress, onShowMemory }: HeaderProps) {
  return (
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
          onClick={onShowMemory}
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
  );
}
