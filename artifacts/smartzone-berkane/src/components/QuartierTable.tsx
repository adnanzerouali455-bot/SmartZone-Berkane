import React, { useState } from 'react';
import { Quartier } from '../data/quartiers';
import { ArrowUpDown } from 'lucide-react';

interface QuartierTableProps {
  quartiers: Quartier[];
  highlightedIds: string[];
  onSelect: (q: Quartier) => void;
}

type SortKey = 'scoreGlobal' | 'nom' | 'securite' | 'hopital' | 'ecole' | 'espacesVerts' | 'prix';

export const QuartierTable: React.FC<QuartierTableProps> = ({ quartiers, highlightedIds, onSelect }) => {
  const [sortKey, setSortKey] = useState<SortKey>('scoreGlobal');
  const [sortDesc, setSortDesc] = useState(true);

  const extractPrice = (priceStr: string) => {
    const match = priceStr.replace(/\s+/g, '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const sortedQuartiers = [...quartiers].sort((a, b) => {
    let valA: number | string = a[sortKey as keyof Quartier] as any;
    let valB: number | string = b[sortKey as keyof Quartier] as any;
    
    if (sortKey === 'securite' || sortKey === 'hopital' || sortKey === 'ecole' || sortKey === 'espacesVerts') {
      valA = a.scores[sortKey];
      valB = b.scores[sortKey];
    } else if (sortKey === 'prix') {
      valA = extractPrice(a.prixEstime);
      valB = extractPrice(b.prixEstime);
    }

    if (valA < valB) return sortDesc ? 1 : -1;
    if (valA > valB) return sortDesc ? -1 : 1;
    return 0;
  });

  const getRankBadge = (index: number) => {
    if (sortKey !== 'scoreGlobal' || !sortDesc) return null;
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return <span className="text-gray-400 text-xs w-4 inline-block text-center">{index + 1}</span>;
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(key !== 'nom' && key !== 'prix'); // default desc for scores, asc for names/price
    }
  };

  const ScoreBar = ({ score }: { score: number }) => (
    <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1">
      <div className={`h-full rounded-full ${score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${score}%` }} />
    </div>
  );

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b">
            <tr>
              <th className="p-3 w-10">#</th>
              <th className="p-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('nom')}>
                <div className="flex items-center gap-1">Quartier <ArrowUpDown size={14} /></div>
              </th>
              <th className="p-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('scoreGlobal')}>
                <div className="flex items-center gap-1">Score <ArrowUpDown size={14} /></div>
              </th>
              <th className="p-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('securite')}>
                <div className="flex items-center gap-1">Sécurité <ArrowUpDown size={14} /></div>
              </th>
              <th className="p-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('hopital')}>
                <div className="flex items-center gap-1">Hôpital <ArrowUpDown size={14} /></div>
              </th>
              <th className="p-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('ecole')}>
                <div className="flex items-center gap-1">École <ArrowUpDown size={14} /></div>
              </th>
              <th className="p-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('espacesVerts')}>
                <div className="flex items-center gap-1">Nature <ArrowUpDown size={14} /></div>
              </th>
              <th className="p-3">Bruit</th>
              <th className="p-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('prix')}>
                <div className="flex items-center gap-1">Prix <ArrowUpDown size={14} /></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedQuartiers.map((q, i) => (
              <tr 
                key={q.id} 
                onClick={() => onSelect(q)}
                className={`border-b last:border-0 hover:bg-blue-50 cursor-pointer transition-colors ${
                  highlightedIds.includes(q.id) ? 'bg-blue-50/50' : ''
                }`}
              >
                <td className="p-3 text-center">{getRankBadge(i)}</td>
                <td className="p-3 font-semibold text-gray-900">{q.nom}</td>
                <td className="p-3">
                  <span className="font-bold text-blue-600">{q.scoreGlobal}</span>
                  <ScoreBar score={q.scoreGlobal} />
                </td>
                <td className="p-3">
                  {q.scores.securite}
                  <ScoreBar score={q.scores.securite} />
                </td>
                <td className="p-3">
                  {q.scores.hopital}
                  <ScoreBar score={q.scores.hopital} />
                </td>
                <td className="p-3">
                  {q.scores.ecole}
                  <ScoreBar score={q.scores.ecole} />
                </td>
                <td className="p-3">
                  {q.scores.espacesVerts}
                  <ScoreBar score={q.scores.espacesVerts} />
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    q.bruit === 'faible' ? 'bg-green-100 text-green-700' : 
                    q.bruit === 'moyen' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {q.bruit}
                  </span>
                </td>
                <td className="p-3 text-gray-600 text-xs whitespace-nowrap">{q.prixEstime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
