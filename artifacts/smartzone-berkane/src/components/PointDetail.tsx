import React, { useMemo } from 'react';
import { PointScore, haversineMeters } from '../data/quartiers';
import { BerkanePOIs, POI } from '../lib/overpassService';
import { X, MapPin, Info, Stethoscope, GraduationCap, TreePine, ShoppingBag, Bus, ShieldCheck, CarFront } from 'lucide-react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface PointDetailProps {
  point: PointScore;
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

const RADAR_LABELS = [
  'Sécurité','Hôpital','École','Espaces verts',
  'Route (inv.)','Commerces','Centre-ville','Mosquées','Transport',
];

export const PointDetail: React.FC<PointDetailProps> = ({ point, onClose, pois }) => {
  const sc = point.scoreGlobal;
  const col = scoreColor(sc);
  const barCls = sc >= 75 ? 'bg-green-600' : sc >= 50 ? 'bg-amber-500' : 'bg-red-600';
  const txtCls = sc >= 75 ? 'text-green-600' : sc >= 50 ? 'text-amber-500' : 'text-red-600';

  // Real distances from POI data
  const realDist = useMemo(() => {
    if (!pois) return null;
    const { lat, lng } = point;
    return {
      hopital:        nearestDist(pois.hopital,        lat, lng),
      ecole:          nearestDist(pois.ecole,           lat, lng),
      parc:           nearestDist(pois.espacesVerts,    lat, lng),
      commerce:       nearestDist(pois.commerce,        lat, lng),
      mosquee:        nearestDist(pois.mosquee,         lat, lng),
      transport:      nearestDist(pois.transport,       lat, lng),
      police:         nearestDist(pois.police,          lat, lng),
      routeNationale: nearestDist(pois.routeNationale,  lat, lng),
    };
  }, [pois, point]);

  const distCards = [
    { icon: <Stethoscope size={15} />, bg: 'bg-red-50 text-red-600',    label: 'Hôpital',    dist: realDist?.hopital,        score: point.scores.hopital },
    { icon: <GraduationCap size={15}/>, bg: 'bg-blue-50 text-blue-600', label: 'École',      dist: realDist?.ecole,          score: point.scores.ecole },
    { icon: <TreePine size={15} />,    bg: 'bg-green-50 text-green-600', label: 'Parc',       dist: realDist?.parc,           score: point.scores.espacesVerts },
    { icon: <ShoppingBag size={15} />, bg: 'bg-amber-50 text-amber-600',label: 'Commerces',  dist: realDist?.commerce,       score: point.scores.commerces },
    { icon: <MapPin size={15} />,      bg: 'bg-purple-50 text-purple-600',label: 'Mosquée',  dist: realDist?.mosquee,        score: point.scores.mosquees },
    { icon: <Bus size={15} />,         bg: 'bg-orange-50 text-orange-600',label: 'Transport', dist: realDist?.transport,      score: point.scores.transport },
    { icon: <ShieldCheck size={15} />, bg: 'bg-indigo-50 text-indigo-600',label: 'Police',   dist: realDist?.police,         score: point.scores.securite },
    { icon: <CarFront size={15} />,    bg: 'bg-gray-100 text-gray-600', label: 'Route nat.', dist: realDist?.routeNationale, score: point.scores.routeNationale },
  ];

  const radarData = {
    labels: RADAR_LABELS,
    datasets: [{
      label: 'Score',
      data: [
        point.scores.securite, point.scores.hopital, point.scores.ecole,
        point.scores.espacesVerts, point.scores.routeNationale, point.scores.commerces,
        point.scores.centreville, point.scores.mosquees, point.scores.transport,
      ],
      backgroundColor: `${col}22`,
      borderColor: col,
      borderWidth: 2,
      pointBackgroundColor: col,
      pointRadius: 3,
    }],
  };

  const radarOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: { r: { min: 0, max: 100, ticks: { display: false, stepSize: 25 }, grid: { color: 'rgba(0,0,0,0.06)' }, pointLabels: { font: { size: 9 } } } },
    plugins: { legend: { display: false } },
  };

  return (
    <div className="p-4 relative max-h-[55vh] overflow-y-auto">
      <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-gray-500 z-10">
        <X size={20} />
      </button>

      {/* En-tête */}
      <div className="flex items-start gap-3 mb-3">
        <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mt-0.5"><MapPin size={20} /></div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900">Point personnalisé</h2>
          <p className="text-xs text-gray-400 font-mono">
            {point.lat.toFixed(5)}°N, {Math.abs(point.lng).toFixed(5)}°O
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Info size={11} />
            À <b className="mx-1">{fmtDist(point.distanceToNearest)}</b> de{' '}
            <span className="text-blue-600 font-semibold ml-1">{point.nearestQuartier.nom}</span>
          </p>
          {pois && (
            <p className="text-[10px] text-emerald-600 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Distances calculées depuis données OSM réelles
            </p>
          )}
        </div>
        {/* Score global */}
        <div className="text-right flex-shrink-0">
          <div className="text-[10px] text-gray-500 mb-1">Score global</div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full ${barCls}`} style={{ width: `${sc}%` }} />
            </div>
            <span className={`text-xl font-bold ${txtCls}`}>
              {sc}<span className="text-xs font-normal text-gray-400">/100</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Distance cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-2">
          {distCards.map(card => {
            const d = card.dist;
            const distStr = d != null ? fmtDist(d) : '—';
            const c = scoreColor(card.score);
            return (
              <div key={card.label} className="bg-gray-50 border rounded-lg p-2 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`p-1 rounded ${card.bg}`}>{card.icon}</span>
                  <span className="text-[10px] text-gray-500">{card.label}</span>
                </div>
                <div className="font-bold text-sm text-gray-800">{distStr}</div>
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${card.score}%`, background: c }} />
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: c }}>{card.score}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Radar */}
        <div className="border rounded-lg p-2 bg-white h-[220px]">
          <Radar data={radarData} options={radarOptions} />
        </div>
      </div>

      <p className="text-[10px] text-gray-400 mt-2 italic">
        Distances exactes (vol d'oiseau) vers les POI OpenStreetMap les plus proches.
      </p>
    </div>
  );
};
