import React, { useMemo } from 'react';
import { Quartier, haversineMeters } from '../data/quartiers';
import { BerkanePOIs, POI } from '../lib/overpassService';
import { RadarChart } from './RadarChart';
import {
  X, Building2, Stethoscope, GraduationCap,
  TreePine, ShoppingBag, MapPin, Bus, CarFront, ShieldCheck,
} from 'lucide-react';

interface QuartierDetailProps {
  quartier: Quartier | null;
  onClose: () => void;
  pois?: BerkanePOIs | null;
}

function fmtDist(m: number): string {
  if (!isFinite(m)) return '—';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

function nearestDist(list: POI[], lat: number, lng: number): number {
  if (!list?.length) return Infinity;
  return Math.min(...list.map(p => haversineMeters(lat, lng, p.lat, p.lng)));
}

function scoreColor(s: number) {
  return s >= 75 ? '#16a34a' : s >= 50 ? '#f59e0b' : '#dc2626';
}

export const QuartierDetail: React.FC<QuartierDetailProps> = ({ quartier, onClose, pois }) => {
  if (!quartier) return null;

  // Compute real distances from Overpass data
  const realDist = useMemo(() => {
    if (!pois) return null;
    const { lat, lng } = quartier;
    return {
      hopital:        nearestDist(pois.hopital,       lat, lng),
      ecole:          nearestDist(pois.ecole,          lat, lng),
      parc:           nearestDist(pois.espacesVerts,   lat, lng),
      commerce:       nearestDist(pois.commerce,       lat, lng),
      mosquee:        nearestDist(pois.mosquee,        lat, lng),
      transport:      nearestDist(pois.transport,      lat, lng),
      police:         nearestDist(pois.police,         lat, lng),
      routeNationale: nearestDist(pois.routeNationale, lat, lng),
    };
  }, [pois, quartier]);

  const barColor = quartier.scoreGlobal >= 75 ? 'bg-green-600' : quartier.scoreGlobal >= 50 ? 'bg-amber-500' : 'bg-red-600';
  const textCol  = quartier.scoreGlobal >= 75 ? 'text-green-600' : quartier.scoreGlobal >= 50 ? 'text-amber-500' : 'text-red-600';

  const distCards = [
    {
      icon: <Stethoscope size={18} />, bg: 'bg-red-50 text-red-600',
      label: 'Hôpital / Santé',
      dist: realDist ? realDist.hopital : null,
      static: quartier.distances.hopital,
      score: quartier.scores.hopital,
    },
    {
      icon: <GraduationCap size={18} />, bg: 'bg-blue-50 text-blue-600',
      label: 'École / Éducation',
      dist: realDist ? realDist.ecole : null,
      static: quartier.distances.ecole,
      score: quartier.scores.ecole,
    },
    {
      icon: <TreePine size={18} />, bg: 'bg-green-50 text-green-600',
      label: 'Parc / Espaces verts',
      dist: realDist ? realDist.parc : null,
      static: quartier.distances.parc,
      score: quartier.scores.espacesVerts,
    },
    {
      icon: <ShoppingBag size={18} />, bg: 'bg-amber-50 text-amber-600',
      label: 'Commerces',
      dist: realDist ? realDist.commerce : null,
      static: quartier.distances.supermarche,
      score: quartier.scores.commerces,
    },
    {
      icon: <MapPin size={18} />, bg: 'bg-purple-50 text-purple-600',
      label: 'Mosquée',
      dist: realDist ? realDist.mosquee : null,
      static: quartier.distances.mosquee,
      score: quartier.scores.mosquees,
    },
    {
      icon: <Bus size={18} />, bg: 'bg-orange-50 text-orange-600',
      label: 'Transport',
      dist: realDist ? realDist.transport : null,
      static: '—',
      score: quartier.scores.transport,
    },
    {
      icon: <ShieldCheck size={18} />, bg: 'bg-indigo-50 text-indigo-600',
      label: 'Police / Sécurité',
      dist: realDist ? realDist.police : null,
      static: '—',
      score: quartier.scores.securite,
    },
    {
      icon: <CarFront size={18} />, bg: 'bg-gray-100 text-gray-600',
      label: 'Route nationale',
      dist: realDist ? realDist.routeNationale : null,
      static: quartier.distances.routeNationale,
      score: quartier.scores.routeNationale,
      note: quartier.bruit,
    },
  ];

  return (
    <div className="p-4 relative max-h-[55vh] overflow-y-auto">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-gray-500 z-10"
      >
        <X size={20} />
      </button>

      {/* En-tête */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-blue-600" size={20} />
            {quartier.nom}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Prix estimé : {quartier.prixEstime}</p>
          {pois && (
            <p className="text-[10px] text-emerald-600 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Distances calculées depuis données OSM réelles
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <div className="text-xs text-gray-500 mb-1">Score global</div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full ${barColor}`} style={{ width: `${quartier.scoreGlobal}%` }} />
            </div>
            <span className={`text-xl font-bold ${textCol}`}>
              {quartier.scoreGlobal}<span className="text-xs font-normal text-gray-400">/100</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Distance cards */}
        <div className="col-span-1 lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {distCards.map(card => {
            const distStr = card.dist != null ? fmtDist(card.dist) : card.static;
            const sc = card.score;
            const col = scoreColor(sc);
            return (
              <div key={card.label} className="bg-gray-50 border rounded-lg p-2.5 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`p-1 rounded ${card.bg}`}>{card.icon}</span>
                  <span className="text-[10px] text-gray-500 leading-tight">{card.label}</span>
                </div>
                {/* Exact distance */}
                <div className="font-bold text-sm text-gray-800">
                  {distStr}
                  {card.note && (
                    <span className="ml-1 text-[10px] font-normal text-gray-400">· bruit {card.note}</span>
                  )}
                </div>
                {/* Score bar */}
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${sc}%`, background: col }} />
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: col }}>{sc}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Radar */}
        <div className="col-span-1 border rounded-lg p-2 bg-white h-[220px]">
          <RadarChart quartier={quartier} />
        </div>
      </div>
    </div>
  );
};
