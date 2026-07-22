import React from 'react';
import { MapPin } from 'lucide-react';

export const Header: React.FC = () => {
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
      <div className="flex items-center gap-2 text-xs font-medium bg-gray-100 px-3 py-1.5 rounded-full text-gray-600">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        Données en direct — Berkane, Maroc
      </div>
    </header>
  );
};
