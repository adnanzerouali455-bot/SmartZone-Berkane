import React, { useState, useMemo } from 'react';
import {
  X, ChevronRight, ChevronLeft, User, Sliders, Heart, Brain,
  MapPin, Stethoscope, GraduationCap, TreePine, ShoppingCart,
  Bus, Coffee, Utensils, Waves, Building2, Pill, Landmark,
  Shield, Volume2, Users, Star, Briefcase, Globe, Leaf, Wifi,
  CheckCircle2, AlertCircle, Clock, Wallet, TrendingUp, Home,
  Phone, Building, Loader2, ThumbsUp,
} from 'lucide-react';
import { Quartier } from '../data/quartiers';
import { BerkanePOIs } from '../lib/overpassService';
import {
  UserPreferences, DEFAULT_PREFS, AIAnalysisResult,
  analyzePreferences,
} from '../lib/aiAnalysis';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  quartiers: Quartier[];
  pois: BerkanePOIs | null;
  onClose: () => void;
  onSelectQuartier: (q: Quartier) => void;
}

// ── Config ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Profil',    icon: <User size={16} /> },
  { id: 2, label: 'Distances', icon: <Sliders size={16} /> },
  { id: 3, label: 'Style',     icon: <Heart size={16} /> },
  { id: 4, label: 'Analyse',   icon: <Brain size={16} /> },
];

const DISTANCE_GROUPS = [
  {
    title: 'Santé & Sécurité',
    items: [
      { key: 'hospital',    label: 'Hôpital',        icon: <Stethoscope size={15} />, color: 'text-red-500' },
      { key: 'pharmacy',    label: 'Pharmacie',      icon: <Pill size={15} />,        color: 'text-rose-500' },
    ],
  },
  {
    title: 'Éducation',
    items: [
      { key: 'school',      label: 'École',          icon: <GraduationCap size={15} />, color: 'text-blue-500' },
      { key: 'university',  label: 'Université',     icon: <Landmark size={15} />,    color: 'text-blue-600' },
    ],
  },
  {
    title: 'Quotidien',
    items: [
      { key: 'supermarket', label: 'Supermarché',    icon: <ShoppingCart size={15} />, color: 'text-amber-500' },
      { key: 'restaurant',  label: 'Restaurant',     icon: <Utensils size={15} />,    color: 'text-orange-500' },
      { key: 'cafe',        label: 'Café',           icon: <Coffee size={15} />,      color: 'text-yellow-700' },
      { key: 'mosque',      label: 'Mosquée',        icon: <Building size={15} />,    color: 'text-purple-500' },
    ],
  },
  {
    title: 'Mobilité & Loisirs',
    items: [
      { key: 'transport',   label: 'Transport public', icon: <Bus size={15} />,       color: 'text-emerald-500' },
      { key: 'park',        label: 'Parc',             icon: <TreePine size={15} />,  color: 'text-green-600' },
      { key: 'beach',       label: 'Plage (Saïdia)',   icon: <Waves size={15} />,     color: 'text-cyan-500' },
      { key: 'cityCenter',  label: 'Centre-ville',     icon: <Building2 size={15} />, color: 'text-indigo-500' },
    ],
  },
];

const LIFESTYLE_OPTIONS = [
  { key: 'quiet',    label: 'Zone calme',        icon: <Volume2 size={18} />,  color: 'bg-sky-50 text-sky-700 border-sky-200',     active: 'bg-sky-500 text-white border-sky-500' },
  { key: 'safe',     label: 'Quartier sûr',      icon: <Shield size={18} />,   color: 'bg-green-50 text-green-700 border-green-200', active: 'bg-green-500 text-white border-green-500' },
  { key: 'family',   label: 'Familial',          icon: <Users size={18} />,    color: 'bg-orange-50 text-orange-700 border-orange-200', active: 'bg-orange-500 text-white border-orange-500' },
  { key: 'luxury',   label: 'Haut standing',     icon: <Star size={18} />,     color: 'bg-yellow-50 text-yellow-700 border-yellow-200', active: 'bg-yellow-500 text-white border-yellow-500' },
  { key: 'student',  label: 'Étudiant',          icon: <GraduationCap size={18} />, color: 'bg-blue-50 text-blue-700 border-blue-200', active: 'bg-blue-500 text-white border-blue-500' },
  { key: 'business', label: 'Affaires',          icon: <Briefcase size={18} />, color: 'bg-gray-50 text-gray-700 border-gray-300',  active: 'bg-gray-700 text-white border-gray-700' },
  { key: 'tourist',  label: 'Touristique',       icon: <Globe size={18} />,    color: 'bg-teal-50 text-teal-700 border-teal-200',   active: 'bg-teal-500 text-white border-teal-500' },
  { key: 'rural',    label: 'Zone rurale',       icon: <MapPin size={18} />,   color: 'bg-lime-50 text-lime-700 border-lime-200',   active: 'bg-lime-500 text-white border-lime-500' },
  { key: 'smart',    label: 'Smart city',        icon: <Wifi size={18} />,     color: 'bg-violet-50 text-violet-700 border-violet-200', active: 'bg-violet-500 text-white border-violet-500' },
  { key: 'green',    label: 'Espaces verts',     icon: <Leaf size={18} />,     color: 'bg-emerald-50 text-emerald-700 border-emerald-200', active: 'bg-emerald-500 text-white border-emerald-500' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const fill = circ * (1 - score / 100);
  const color = score >= 75 ? '#16a34a' : score >= 50 ? '#f59e0b' : '#dc2626';
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={10} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={fill} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px`, fontSize: 22, fontWeight: 700, fill: color }}>
        {score}
      </text>
      <text x={size / 2} y={size / 2 + 18} textAnchor="middle"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px`, fontSize: 10, fill: '#6b7280' }}>
        /100
      </text>
    </svg>
  );
}

function ScoreBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const color = score >= 75 ? '#16a34a' : score >= 50 ? '#f59e0b' : '#dc2626';
  return (
    <div className="flex items-center gap-2">
      <div className="text-gray-400 flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-0.5">
          <span className="text-gray-600 font-medium">{label}</span>
          <span className="font-bold" style={{ color }}>{score}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export const PreferencesDashboard: React.FC<Props> = ({ quartiers, pois, onClose, onSelectQuartier }) => {
  const [step, setStep]       = useState(1);
  const [prefs, setPrefs]     = useState<UserPreferences>(DEFAULT_PREFS);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult]   = useState<AIAnalysisResult | null>(null);

  const setPref = <K extends keyof UserPreferences>(k: K, v: UserPreferences[K]) =>
    setPrefs(p => ({ ...p, [k]: v }));

  const setDist = (k: keyof UserPreferences['distances'], v: number) =>
    setPrefs(p => ({ ...p, distances: { ...p.distances, [k]: v } }));

  const toggleLifestyle = (key: string) =>
    setPrefs(p => ({
      ...p,
      lifestyle: p.lifestyle.includes(key)
        ? p.lifestyle.filter(l => l !== key)
        : [...p.lifestyle, key],
    }));

  const runAnalysis = () => {
    setAnalyzing(true);
    // Simulate brief analysis time
    setTimeout(() => {
      setResult(analyzePreferences(prefs, quartiers, pois));
      setAnalyzing(false);
      setStep(4);
    }, 1400);
  };

  const handleViewOnMap = (q: Quartier) => {
    onSelectQuartier(q);
    onClose();
  };

  // ── Step 1 — Personal Info ──────────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Informations personnelles</h3>
        <p className="text-sm text-gray-500">Aidez l'IA à mieux vous connaître pour affiner ses recommandations.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Nom complet</label>
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={prefs.fullName} onChange={e => setPref('fullName', e.target.value)}
              placeholder="Ex : Ahmed Benali"
              className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Âge</label>
          <input type="number" min={18} max={90} value={prefs.age}
            onChange={e => setPref('age', +e.target.value)}
            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Profession</label>
          <div className="relative">
            <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={prefs.profession} onChange={e => setPref('profession', e.target.value)}
              placeholder="Enseignant, Médecin…"
              className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            Budget mensuel : <span className="text-blue-600 font-bold">{prefs.monthlyBudget.toLocaleString()} MAD</span>
          </label>
          <input type="range" min={2000} max={30000} step={500} value={prefs.monthlyBudget}
            onChange={e => setPref('monthlyBudget', +e.target.value)}
            className="w-full accent-blue-600" />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>2 000 MAD</span><span>30 000 MAD</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Membres de la famille</label>
          <div className="flex items-center gap-3 border rounded-lg p-2.5">
            <button onClick={() => setPref('familySize', Math.max(1, prefs.familySize - 1))}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700">−</button>
            <span className="flex-1 text-center font-bold text-gray-900">{prefs.familySize}</span>
            <button onClick={() => setPref('familySize', Math.min(12, prefs.familySize + 1))}
              className="w-7 h-7 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center font-bold text-blue-700">+</button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Téléphone <span className="text-gray-400 font-normal">(optionnel)</span></label>
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="tel" value={prefs.phone} onChange={e => setPref('phone', e.target.value)}
              placeholder="+212 6XX XXX XXX"
              className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>

        <div className="col-span-2 bg-blue-50 rounded-lg p-3 flex items-center gap-3">
          <MapPin className="text-blue-500 flex-shrink-0" size={18} />
          <div>
            <p className="text-xs font-semibold text-blue-800">Lieu cible : Berkane, Maroc</p>
            <p className="text-xs text-blue-600">L'analyse porte sur les 8 quartiers de Berkane avec données OSM en temps réel.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 2 — Distance Preferences ──────────────────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Préférences de distance</h3>
        <p className="text-sm text-gray-500">Définissez la distance maximale acceptable pour chaque service. Laissez à 0 si sans importance.</p>
      </div>

      {DISTANCE_GROUPS.map(group => (
        <div key={group.title}>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{group.title}</h4>
          <div className="space-y-3">
            {group.items.map(item => {
              const val = prefs.distances[item.key as keyof UserPreferences['distances']];
              return (
                <div key={item.key} className="bg-gray-50 rounded-lg p-3 border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={item.color}>{item.icon}</span>
                      <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${val === 0 ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>
                      {val === 0 ? 'Sans préférence' : `≤ ${val} km`}
                    </span>
                  </div>
                  <input type="range" min={0} max={5} step={0.5} value={val}
                    onChange={e => setDist(item.key as keyof UserPreferences['distances'], +e.target.value)}
                    className="w-full accent-blue-600" />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>Peu importe</span><span>5 km</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // ── Step 3 — Lifestyle ──────────────────────────────────────────────────────
  const renderStep3 = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Style de vie souhaité</h3>
        <p className="text-sm text-gray-500">Sélectionnez un ou plusieurs styles de vie. L'IA pondèrera les quartiers en conséquence.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {LIFESTYLE_OPTIONS.map(opt => {
          const isActive = prefs.lifestyle.includes(opt.key);
          return (
            <button key={opt.key} onClick={() => toggleLifestyle(opt.key)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${isActive ? opt.active : opt.color} hover:opacity-90`}>
              <span className="flex-shrink-0">{opt.icon}</span>
              <span className="text-sm font-semibold">{opt.label}</span>
              {isActive && <CheckCircle2 size={14} className="ml-auto flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {prefs.lifestyle.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
          <span className="font-semibold">{prefs.lifestyle.length} critère{prefs.lifestyle.length > 1 ? 's' : ''} sélectionné{prefs.lifestyle.length > 1 ? 's' : ''} :</span>{' '}
          {prefs.lifestyle.map(k => LIFESTYLE_OPTIONS.find(o => o.key === k)?.label).filter(Boolean).join(', ')}
        </div>
      )}
    </div>
  );

  // ── Step 4 — Results ────────────────────────────────────────────────────────
  const renderStep4 = () => {
    if (analyzing) return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={48} className="animate-spin text-blue-500" />
        <p className="text-gray-600 font-semibold">Analyse IA en cours…</p>
        <p className="text-xs text-gray-400">Calcul des scores de compatibilité sur les données OSM de Berkane</p>
      </div>
    );
    if (!result) return null;

    const { recommendation: rec, alternatives, userProfile } = result;
    const q = rec.quartier;

    const subScores = [
      { label: 'Accessibilité',    score: rec.accessibilityScore,  icon: <MapPin size={14} /> },
      { label: 'Sécurité',         score: rec.safetyScore,         icon: <Shield size={14} /> },
      { label: 'Trafic / Bruit',   score: rec.trafficScore,        icon: <Volume2 size={14} /> },
      { label: 'Environnement',    score: rec.environmentalScore,  icon: <Leaf size={14} /> },
      { label: 'Coût de vie',      score: rec.costScore,           icon: <Wallet size={14} /> },
      { label: 'Services',         score: rec.servicesScore,       icon: <TrendingUp size={14} /> },
    ];

    const mainColor = rec.compatibilityScore >= 75 ? 'text-green-600' : rec.compatibilityScore >= 50 ? 'text-amber-500' : 'text-red-600';

    return (
      <div className="space-y-5">
        {/* Profile banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white">
          <p className="text-xs font-semibold opacity-80 mb-0.5">Votre profil analysé</p>
          <p className="font-bold">{prefs.fullName || 'Utilisateur'}</p>
          <p className="text-xs opacity-80 mt-0.5">{userProfile}</p>
        </div>

        {/* Top recommendation */}
        <div className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50/40">
          <div className="flex items-start gap-4">
            {/* Score ring */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <ScoreRing score={rec.compatibilityScore} size={110} />
              <p className="text-[10px] text-gray-500 mt-1 text-center">Compatibilité IA</p>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">🏆 #1 Recommandé</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{q.nom}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{rec.whySelected}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                <span><Home size={11} className="inline mr-1" />{rec.estimatedMonthlyRent.toLocaleString()} MAD/mois</span>
                <span className="text-gray-300">|</span>
                <span className={`font-bold ${mainColor}`}>{q.bruit} bruit</span>
              </div>
              <button onClick={() => handleViewOnMap(q)}
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                <MapPin size={12} /> Voir sur la carte
              </button>
            </div>
          </div>

          {/* Sub-scores */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {subScores.map(s => <ScoreBar key={s.label} {...s} />)}
          </div>
        </div>

        {/* Pros / Cons */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-xl p-3 border border-green-100">
            <p className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1">
              <CheckCircle2 size={13} /> Avantages
            </p>
            <ul className="space-y-1">
              {rec.pros.map((p, i) => (
                <li key={i} className="text-xs text-green-800 flex gap-1.5 items-start">
                  <span className="text-green-500 mt-0.5">✓</span>{p}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-red-50 rounded-xl p-3 border border-red-100">
            <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1">
              <AlertCircle size={13} /> Inconvénients
            </p>
            <ul className="space-y-1">
              {rec.cons.map((c, i) => (
                <li key={i} className="text-xs text-red-800 flex gap-1.5 items-start">
                  <span className="text-red-400 mt-0.5">×</span>{c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="border rounded-xl p-4">
          <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Wallet size={16} className="text-blue-600" /> Estimation des dépenses mensuelles
          </p>
          <div className="space-y-2">
            {[
              { label: 'Loyer estimé',           val: rec.estimatedMonthlyRent,  color: 'text-blue-600' },
              { label: `Alimentation (×${prefs.familySize})`, val: 1800 * prefs.familySize, color: 'text-amber-600' },
              { label: 'Transport',              val: q.scores.transport > 70 ? 400 : 800, color: 'text-emerald-600' },
              { label: 'Charges / Utilities',    val: 600, color: 'text-purple-600' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{row.label}</span>
                <span className={`font-bold ${row.color}`}>{row.val.toLocaleString()} MAD</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold text-base">
              <span className="text-gray-900">Total estimé</span>
              <span className={rec.estimatedTotalCost <= prefs.monthlyBudget ? 'text-green-600' : 'text-red-600'}>
                {rec.estimatedTotalCost.toLocaleString()} MAD
              </span>
            </div>
            {prefs.monthlyBudget > 0 && (
              <div className={`text-xs text-center mt-1 px-3 py-1 rounded-full ${
                rec.estimatedTotalCost <= prefs.monthlyBudget
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {rec.estimatedTotalCost <= prefs.monthlyBudget
                  ? `✓ Dans votre budget (${(prefs.monthlyBudget - rec.estimatedTotalCost).toLocaleString()} MAD restants)`
                  : `⚠ Dépassement de ${(rec.estimatedTotalCost - prefs.monthlyBudget).toLocaleString()} MAD`
                }
              </div>
            )}
          </div>
        </div>

        {/* Travel times */}
        {rec.travelTimes.length > 0 && (
          <div className="border rounded-xl p-4">
            <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Clock size={16} className="text-blue-600" /> Temps de trajet estimés
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b">
                  <th className="text-left pb-1.5 font-medium">Destination</th>
                  <th className="text-right pb-1.5 font-medium">🚶 À pied</th>
                  <th className="text-right pb-1.5 font-medium">🚗 En voiture</th>
                </tr>
              </thead>
              <tbody>
                {rec.travelTimes.map(t => (
                  <tr key={t.label} className="border-b last:border-0">
                    <td className="py-1.5 text-gray-700">{t.label}</td>
                    <td className="py-1.5 text-right text-gray-500">{t.walk}</td>
                    <td className="py-1.5 text-right font-semibold text-blue-700">{t.car}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <div>
            <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <ThumbsUp size={16} className="text-blue-600" /> Autres quartiers compatibles
            </p>
            <div className="space-y-2">
              {alternatives.map(alt => {
                const altColor = alt.compatibilityScore >= 75 ? 'text-green-600' : alt.compatibilityScore >= 50 ? 'text-amber-500' : 'text-red-600';
                const altBg    = alt.compatibilityScore >= 75 ? 'bg-green-600' : alt.compatibilityScore >= 50 ? 'bg-amber-500' : 'bg-red-600';
                return (
                  <div key={alt.quartier.id}
                    className="flex items-center gap-3 border rounded-xl p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleViewOnMap(alt.quartier)}>
                    <div className={`${altBg} text-white text-xs font-bold w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0`}>
                      #{alt.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{alt.quartier.nom}</p>
                      <p className="text-xs text-gray-500 truncate">{alt.pros[0]}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-lg font-bold ${altColor}`}>{alt.compatibilityScore}<span className="text-xs font-normal text-gray-400">/100</span></div>
                      <div className="text-[10px] text-gray-400">{alt.estimatedMonthlyRent.toLocaleString()} MAD/mois</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button onClick={() => { setStep(1); setResult(null); }}
          className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors">
          ↺ Refaire l'analyse
        </button>
      </div>
    );
  };

  const canProceed = () => {
    if (step === 1) return prefs.fullName.trim().length > 0 && prefs.monthlyBudget > 0;
    return true;
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-stretch" style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="ml-auto w-full max-w-xl bg-white h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-700 to-indigo-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-lg"><Brain size={18} className="text-white" /></div>
            <div>
              <h2 className="font-bold text-white text-base">Analyse IA personnalisée</h2>
              <p className="text-blue-200 text-xs">Trouvez votre quartier idéal à Berkane</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex border-b bg-gray-50 flex-shrink-0">
          {STEPS.map((s, i) => {
            const isActive   = step === s.id;
            const isComplete = step > s.id;
            return (
              <button key={s.id}
                onClick={() => { if (isComplete) setStep(s.id); }}
                className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-semibold transition-colors border-b-2 ${
                  isActive   ? 'border-blue-600 text-blue-700 bg-white' :
                  isComplete ? 'border-green-500 text-green-600 cursor-pointer hover:bg-gray-100' :
                               'border-transparent text-gray-400 cursor-default'
                }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                  isActive   ? 'bg-blue-600 text-white' :
                  isComplete ? 'bg-green-500 text-white' :
                               'bg-gray-200 text-gray-400'
                }`}>
                  {isComplete ? '✓' : s.id}
                </div>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        {/* Footer nav */}
        {step < 4 && (
          <div className="border-t px-6 py-4 flex justify-between items-center bg-gray-50 flex-shrink-0">
            <button onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 disabled:opacity-30 hover:text-gray-900 transition-colors">
              <ChevronLeft size={16} /> Précédent
            </button>

            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
                Suivant <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={runAnalysis}
                className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold px-5 py-2 rounded-lg shadow-md transition-all">
                <Brain size={16} /> Analyser mon profil
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
