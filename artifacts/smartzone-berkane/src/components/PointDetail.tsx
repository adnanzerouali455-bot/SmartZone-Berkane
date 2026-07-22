import React from 'react';
import { PointScore } from '../data/quartiers';
import { X, MapPin, Info } from 'lucide-react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface PointDetailProps {
  point: PointScore;
  onClose: () => void;
}

const LABELS = [
  'Sécurité', 'Hôpital', 'École', 'Espaces verts',
  'Route (inverse)', 'Commerces', 'Centre-ville', 'Mosquées', 'Transport',
];

function formatCoord(v: number) {
  return v.toFixed(5);
}

export const PointDetail: React.FC<PointDetailProps> = ({ point, onClose }) => {
  const scoreColor =
    point.scoreGlobal >= 75 ? '#16a34a' : point.scoreGlobal >= 50 ? '#f59e0b' : '#dc2626';
  const scoreTailwind =
    point.scoreGlobal >= 75
      ? 'text-green-600'
      : point.scoreGlobal >= 50
      ? 'text-amber-500'
      : 'text-red-600';
  const barColor =
    point.scoreGlobal >= 75 ? 'bg-green-600' : point.scoreGlobal >= 50 ? 'bg-amber-500' : 'bg-red-600';

  const scoreValues = [
    point.scores.securite,
    point.scores.hopital,
    point.scores.ecole,
    point.scores.espacesVerts,
    point.scores.routeNationale,
    point.scores.commerces,
    point.scores.centreville,
    point.scores.mosquees,
    point.scores.transport,
  ];

  const radarData = {
    labels: LABELS,
    datasets: [
      {
        label: 'Score du point',
        data: scoreValues,
        backgroundColor: `${scoreColor}22`,
        borderColor: scoreColor,
        borderWidth: 2,
        pointBackgroundColor: scoreColor,
        pointRadius: 3,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { display: false, stepSize: 25 },
        grid: { color: 'rgba(0,0,0,0.06)' },
        pointLabels: { font: { size: 10 } },
      },
    },
    plugins: { legend: { display: false } },
  };

  const criterionRows = [
    { label: 'Sécurité', value: point.scores.securite },
    { label: 'Hôpital', value: point.scores.hopital },
    { label: 'École', value: point.scores.ecole },
    { label: 'Espaces verts', value: point.scores.espacesVerts },
    { label: 'Route nationale', value: point.scores.routeNationale },
    { label: 'Commerces', value: point.scores.commerces },
    { label: 'Centre-ville', value: point.scores.centreville },
    { label: 'Mosquées', value: point.scores.mosquees },
    { label: 'Transport', value: point.scores.transport },
  ];

  return (
    <div className="p-4 relative">
      {/* Bouton fermer */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-gray-500"
        data-testid="button-close-point"
      >
        <X size={20} />
      </button>

      {/* En-tête */}
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mt-0.5">
          <MapPin size={22} />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">Point personnalisé</h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            {formatCoord(point.lat)}°N, {formatCoord(Math.abs(point.lng))}°O
          </p>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Info size={12} />
            À <span className="font-semibold text-gray-700 mx-1">
              {point.distanceToNearest >= 1000
                ? `${(point.distanceToNearest / 1000).toFixed(1)} km`
                : `${point.distanceToNearest} m`}
            </span>
            du quartier le plus proche :{' '}
            <span className="font-semibold text-blue-600 ml-1">{point.nearestQuartier.nom}</span>
          </p>
        </div>
        {/* Score global */}
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-gray-500 mb-1">Score global</div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full ${barColor}`} style={{ width: `${point.scoreGlobal}%` }} />
            </div>
            <span className={`text-2xl font-bold ${scoreTailwind}`}>
              {point.scoreGlobal}
              <span className="text-sm font-normal text-gray-400">/100</span>
            </span>
          </div>
        </div>
      </div>

      {/* Grille scores + radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Critères sous forme de barres */}
        <div className="space-y-2">
          {criterionRows.map(({ label, value }) => {
            const c = value >= 75 ? '#16a34a' : value >= 50 ? '#f59e0b' : '#dc2626';
            return (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-28 flex-shrink-0">{label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${value}%`, background: c }}
                  />
                </div>
                <span className="text-xs font-bold w-8 text-right" style={{ color: c }}>
                  {value}
                </span>
              </div>
            );
          })}
        </div>

        {/* Radar */}
        <div className="border rounded-lg p-2 bg-white h-[220px]">
          <Radar data={radarData} options={radarOptions} />
        </div>
      </div>

      <p className="text-[10px] text-gray-400 mt-3 italic">
        Score calculé par interpolation pondérée (IDW) à partir des 8 quartiers de Berkane.
      </p>
    </div>
  );
};
