import { BerkanePOIs, POI } from '../lib/overpassService';

export interface Quartier {
  id: string;
  nom: string;
  lat: number;
  lng: number;
  scores: {
    securite: number;
    hopital: number;
    ecole: number;
    espacesVerts: number;
    routeNationale: number;
    commerces: number;
    centreville: number;
    mosquees: number;
    transport: number;
  };
  scoreGlobal: number;
  distances: {
    hopital: string;
    ecole: string;
    parc: string;
    supermarche: string;
    mosquee: string;
    routeNationale: string;
  };
  bruit: 'faible' | 'moyen' | 'élevé';
  prixEstime: string;
}

export const WEIGHTS = {
  securite: 0.20,
  hopital: 0.15,
  ecole: 0.10,
  espacesVerts: 0.10,
  routeNationale: 0.15,
  commerces: 0.10,
  centreville: 0.10,
  mosquees: 0.05,
  transport: 0.05,
};

export function computeScore(scores: Quartier['scores']): number {
  return Math.round(
    scores.securite      * WEIGHTS.securite +
    scores.hopital       * WEIGHTS.hopital +
    scores.ecole         * WEIGHTS.ecole +
    scores.espacesVerts  * WEIGHTS.espacesVerts +
    scores.routeNationale * WEIGHTS.routeNationale +
    scores.commerces     * WEIGHTS.commerces +
    scores.centreville   * WEIGHTS.centreville +
    scores.mosquees      * WEIGHTS.mosquees +
    scores.transport     * WEIGHTS.transport
  );
}

// ── Haversine distance (metres) ──────────────────────────────────────────────
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Nearest POI distance (metres) ────────────────────────────────────────────
function nearest(list: POI[], lat: number, lng: number): number {
  if (!list.length) return Infinity;
  return Math.min(...list.map(p => haversineMeters(lat, lng, p.lat, p.lng)));
}

// ── Proximity score (closer = better) ───────────────────────────────────────
function proximityScore(d: number, dBest: number, dWorst: number): number {
  if (d <= dBest)  return 100;
  if (d >= dWorst) return 5;
  return Math.round(100 - 95 * (d - dBest) / (dWorst - dBest));
}

// ── Route nationale score (middle distance = best) ───────────────────────────
// < 100m: noisy / dangerous → very low
// 100–800m: getting better with distance
// 800–2500m: optimal range (good access, no noise)
// > 2500m: starts to feel remote
function routeScore(d: number): number {
  if (!isFinite(d)) return 60;           // no road data → neutral
  if (d < 100)  return 10;
  if (d < 800)  return Math.round(10  + 75 * (d - 100)  / 700);   // 10→85
  if (d < 2500) return Math.round(85  + 10 * (d - 800)  / 1700);  // 85→95
  return 95;
}

// ── Compute scores from real Overpass POI data ────────────────────────────────
export function computeScoresFromPOIs(
  lat: number,
  lng: number,
  pois: BerkanePOIs,
): Quartier['scores'] {
  const CENTRE = { lat: 34.9218, lng: -2.3200 };

  const dHopital  = nearest(pois.hopital,      lat, lng);
  const dEcole    = nearest(pois.ecole,         lat, lng);
  const dParc     = nearest(pois.espacesVerts,  lat, lng);
  const dMosquee  = nearest(pois.mosquee,       lat, lng);
  const dBus      = nearest(pois.transport,     lat, lng);
  const dCommerce = nearest(pois.commerce,      lat, lng);
  const dPolice   = nearest(pois.police,        lat, lng);
  const dRoute    = nearest(pois.routeNationale, lat, lng);
  const dCentre   = haversineMeters(lat, lng, CENTRE.lat, CENTRE.lng);

  return {
    hopital:        proximityScore(dHopital,  200, 4000),
    ecole:          proximityScore(dEcole,    200, 2500),
    espacesVerts:   proximityScore(dParc,     150, 2500),
    mosquees:       proximityScore(dMosquee,  150, 1500),
    transport:      proximityScore(dBus,      150, 1500),
    commerces:      proximityScore(dCommerce, 150, 2000),
    centreville:    proximityScore(dCentre,   200, 3500),
    securite:       isFinite(dPolice) ? proximityScore(dPolice, 300, 3000) : 65,
    routeNationale: routeScore(dRoute),
  };
}

// ── Score for an arbitrary map click (IDW fallback OR real POIs) ─────────────
export interface PointScore {
  lat: number;
  lng: number;
  scoreGlobal: number;
  scores: Quartier['scores'];
  nearestQuartier: Quartier;
  distanceToNearest: number; // metres
}

export function computePointScore(
  lat: number,
  lng: number,
  quartiers: Quartier[],
  pois?: BerkanePOIs | null,
): PointScore {
  let scores: Quartier['scores'];

  if (pois) {
    // Real POI-based scoring
    scores = computeScoresFromPOIs(lat, lng, pois);
  } else {
    // Fallback: IDW interpolation from quartier scores
    const dists = quartiers.map(q => ({
      q,
      d: Math.max(haversineMeters(lat, lng, q.lat, q.lng), 10),
    }));
    const weights = dists.map(({ d }) => 1 / (d * d));
    const totalW  = weights.reduce((s, w) => s + w, 0);

    const criterions = [
      'securite', 'hopital', 'ecole', 'espacesVerts',
      'routeNationale', 'commerces', 'centreville', 'mosquees', 'transport',
    ] as const;

    scores = {} as Quartier['scores'];
    for (const c of criterions) {
      scores[c] = Math.round(
        dists.reduce((sum, { q }, i) => sum + weights[i] * q.scores[c], 0) / totalW
      );
    }
  }

  const scoreGlobal = computeScore(scores);
  const dists = quartiers.map(q => ({
    q, d: haversineMeters(lat, lng, q.lat, q.lng),
  }));
  const nearest_ = dists.reduce((best, cur) => (cur.d < best.d ? cur : best));

  return {
    lat, lng, scoreGlobal, scores,
    nearestQuartier: nearest_.q,
    distanceToNearest: Math.round(nearest_.d),
  };
}

// ── Static quartier definitions (positions + metadata) ───────────────────────
// Scores are overridden at runtime from Overpass POI data.
// scoreGlobal is a plain number here (overridden by App.tsx after POI load).
const makeQuartier = (data: Omit<Quartier, 'scoreGlobal'>): Quartier => ({
  ...data,
  scoreGlobal: computeScore(data.scores),
});

export const QUARTIERS: Quartier[] = [
  makeQuartier({
    id: "centre-ville",
    nom: "Centre-ville Berkane",
    lat: 34.9218, lng: -2.3200,
    scores: { securite:80, hopital:90, ecole:85, espacesVerts:40, routeNationale:30, commerces:95, centreville:100, mosquees:90, transport:95 },
    distances: { hopital:"400 m", ecole:"200 m", parc:"1.2 km", supermarche:"100 m", mosquee:"300 m", routeNationale:"200 m" },
    bruit:"élevé", prixEstime:"600 000 - 800 000 MAD",
  }),
  makeQuartier({
    id: "al-massira",
    nom: "Al Massira",
    lat: 34.9180, lng: -2.3150,
    scores: { securite:85, hopital:60, ecole:90, espacesVerts:60, routeNationale:80, commerces:70, centreville:70, mosquees:95, transport:65 },
    distances: { hopital:"1.5 km", ecole:"300 m", parc:"800 m", supermarche:"600 m", mosquee:"150 m", routeNationale:"1.2 km" },
    bruit:"faible", prixEstime:"450 000 - 600 000 MAD",
  }),
  makeQuartier({
    id: "al-qods",
    nom: "Al Qods",
    lat: 34.9250, lng: -2.3250,
    scores: { securite:75, hopital:85, ecole:80, espacesVerts:55, routeNationale:65, commerces:80, centreville:85, mosquees:85, transport:80 },
    distances: { hopital:"700 m", ecole:"400 m", parc:"1 km", supermarche:"300 m", mosquee:"400 m", routeNationale:"800 m" },
    bruit:"moyen", prixEstime:"500 000 - 650 000 MAD",
  }),
  makeQuartier({
    id: "quartier-industriel",
    nom: "Quartier Industriel",
    lat: 34.9100, lng: -2.3300,
    scores: { securite:50, hopital:40, ecole:45, espacesVerts:20, routeNationale:10, commerces:60, centreville:40, mosquees:60, transport:70 },
    distances: { hopital:"3 km", ecole:"1.5 km", parc:"2.5 km", supermarche:"1 km", mosquee:"800 m", routeNationale:"50 m" },
    bruit:"élevé", prixEstime:"250 000 - 350 000 MAD",
  }),
  makeQuartier({
    id: "route-saidia",
    nom: "Route de Saïdia",
    lat: 34.9280, lng: -2.3100,
    scores: { securite:90, hopital:50, ecole:65, espacesVerts:95, routeNationale:85, commerces:50, centreville:50, mosquees:70, transport:60 },
    distances: { hopital:"2.5 km", ecole:"1.2 km", parc:"100 m", supermarche:"1.5 km", mosquee:"600 m", routeNationale:"1.5 km" },
    bruit:"faible", prixEstime:"550 000 - 750 000 MAD",
  }),
  makeQuartier({
    id: "route-oujda",
    nom: "Route d'Oujda",
    lat: 34.9150, lng: -2.3350,
    scores: { securite:65, hopital:55, ecole:70, espacesVerts:40, routeNationale:25, commerces:75, centreville:60, mosquees:80, transport:85 },
    distances: { hopital:"2 km", ecole:"600 m", parc:"1.8 km", supermarche:"400 m", mosquee:"300 m", routeNationale:"100 m" },
    bruit:"élevé", prixEstime:"350 000 - 500 000 MAD",
  }),
  makeQuartier({
    id: "zerarda",
    nom: "Zerarda",
    lat: 34.9300, lng: -2.3200,
    scores: { securite:85, hopital:45, ecole:75, espacesVerts:80, routeNationale:90, commerces:45, centreville:40, mosquees:85, transport:50 },
    distances: { hopital:"3 km", ecole:"800 m", parc:"500 m", supermarche:"2 km", mosquee:"400 m", routeNationale:"2 km" },
    bruit:"faible", prixEstime:"300 000 - 450 000 MAD",
  }),
  makeQuartier({
    id: "quartier-administratif",
    nom: "Quartier Administratif",
    lat: 34.9220, lng: -2.3220,
    scores: { securite:95, hopital:85, ecole:90, espacesVerts:70, routeNationale:50, commerces:85, centreville:95, mosquees:85, transport:90 },
    distances: { hopital:"600 m", ecole:"300 m", parc:"400 m", supermarche:"200 m", mosquee:"250 m", routeNationale:"500 m" },
    bruit:"moyen", prixEstime:"650 000 - 900 000 MAD",
  }),
];
