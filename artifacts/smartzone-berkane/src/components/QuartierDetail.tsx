import React from 'react';
import { Quartier } from '../data/quartiers';
import { RadarChart } from './RadarChart';
import { X, Building2, Stethoscope, GraduationCap, TreePine, ShoppingBag, MapPin, Bus, CarFront } from 'lucide-react';

interface QuartierDetailProps {
  quartier: Quartier | null;
  onClose: () => void;
}

export const QuartierDetail: React.FC<QuartierDetailProps> = ({ quartier, onClose }) => {
  if (!quartier) return null;

  const scoreColor = quartier.scoreGlobal >= 75 ? 'bg-green-600' : quartier.scoreGlobal >= 50 ? 'bg-amber-500' : 'bg-red-600';

  return (
    <div className="p-4 relative">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-gray-500"
      >
        <X size={20} />
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-blue-600" />
            {quartier.nom}
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Prix estimé : {quartier.prixEstime}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 mb-1">Score global</div>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full ${scoreColor}`} style={{ width: `${quartier.scoreGlobal}%` }} />
            </div>
            <span className={`text-xl font-bold ${
              quartier.scoreGlobal >= 75 ? 'text-green-600' : quartier.scoreGlobal >= 50 ? 'text-amber-500' : 'text-red-600'
            }`}>
              {quartier.scoreGlobal}/100
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Distances & Info */}
        <div className="col-span-1 lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg border flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-md text-blue-600"><Stethoscope size={18} /></div>
            <div>
              <div className="text-xs text-gray-500">Hôpital / Santé</div>
              <div className="font-semibold text-sm">{quartier.distances.hopital}</div>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-md text-blue-600"><GraduationCap size={18} /></div>
            <div>
              <div className="text-xs text-gray-500">École / Éducation</div>
              <div className="font-semibold text-sm">{quartier.distances.ecole}</div>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-md text-green-600"><TreePine size={18} /></div>
            <div>
              <div className="text-xs text-gray-500">Parc / Nature</div>
              <div className="font-semibold text-sm">{quartier.distances.parc}</div>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-md text-orange-600"><ShoppingBag size={18} /></div>
            <div>
              <div className="text-xs text-gray-500">Commerces</div>
              <div className="font-semibold text-sm">{quartier.distances.supermarche}</div>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-md text-purple-600"><MapPin size={18} /></div>
            <div>
              <div className="text-xs text-gray-500">Mosquée</div>
              <div className="font-semibold text-sm">{quartier.distances.mosquee}</div>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border flex items-center gap-3">
            <div className="bg-gray-200 p-2 rounded-md text-gray-700"><CarFront size={18} /></div>
            <div>
              <div className="text-xs text-gray-500">Route nationale (Bruit)</div>
              <div className="font-semibold text-sm">{quartier.distances.routeNationale} — {quartier.bruit}</div>
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="col-span-1 border rounded-lg p-2 bg-white h-[250px]">
          <RadarChart quartier={quartier} />
        </div>
      </div>
    </div>
  );
};
