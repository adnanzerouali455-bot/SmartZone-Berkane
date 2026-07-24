import React from 'react';
import { MapPin, Brain } from 'lucide-react';

interface HeaderProps {
  onOpenAnalysis?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAnalysis }) => {
  return (
    <header className="h-14 bg-white border-b shadow-sm flex items-center justify-between px-6 shrink-0 relative z-50">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 text-white p-1.5 rounded-lg">
          <MapPin size={20} />
        </div>
        <div>
          <h1 className="font-bold text-blue-900 leading-none">SmartZone Berkane</h1>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">Trouvez votre quartier idéal, guidé par l'IA</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenAnalysis}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
        >
          <Brain size={16} />
          Analyse IA personnalisée
        </button>

        <div className="flex items-center gap-2 text-xs font-medium bg-gray-100 px-3 py-1.5 rounded-full text-gray-600">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Données en direct — Berkane, Maroc
        </div>
      </div>
    </header>
  );
};
