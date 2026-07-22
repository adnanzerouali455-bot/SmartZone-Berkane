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

const computeScore = (scores: Quartier['scores']) => {
  return Math.round(
    scores.securite * 0.20 +
    scores.hopital * 0.15 +
    scores.ecole * 0.10 +
    scores.espacesVerts * 0.10 +
    scores.routeNationale * 0.15 +
    scores.commerces * 0.10 +
    scores.centreville * 0.10 +
    scores.mosquees * 0.05 +
    scores.transport * 0.05
  );
};

// ── Score pour un point cliqué sur la carte ─────────────────────────────────
// Interpolation par distance inverse pondérée (IDW, puissance 2)
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface PointScore {
  lat: number;
  lng: number;
  scoreGlobal: number;
  scores: Quartier['scores'];
  nearestQuartier: Quartier;
  distanceToNearest: number; // mètres
}

export function computePointScore(lat: number, lng: number, quartiers: Quartier[]): PointScore {
  // Distances en mètres de chaque quartier
  const dists = quartiers.map(q => ({
    q,
    d: Math.max(haversineMeters(lat, lng, q.lat, q.lng), 10), // évite division/0
  }));

  // Poids = 1/d²
  const weights = dists.map(({ d }) => 1 / (d * d));
  const totalW = weights.reduce((s, w) => s + w, 0);

  // Interpolation IDW pour chaque critère
  const criterions = [
    'securite', 'hopital', 'ecole', 'espacesVerts',
    'routeNationale', 'commerces', 'centreville', 'mosquees', 'transport',
  ] as const;

  const interpolated = {} as Quartier['scores'];
  for (const c of criterions) {
    interpolated[c] = Math.round(
      dists.reduce((sum, { q }, i) => sum + weights[i] * q.scores[c], 0) / totalW
    );
  }

  const scoreGlobal = computeScore(interpolated);

  // Quartier le plus proche
  const nearest = dists.reduce((best, cur) => (cur.d < best.d ? cur : best));

  return {
    lat,
    lng,
    scoreGlobal,
    scores: interpolated,
    nearestQuartier: nearest.q,
    distanceToNearest: Math.round(nearest.d),
  };
}

export const QUARTIERS: Quartier[] = [
  {
    id: "centre-ville",
    nom: "Centre-ville Berkane",
    lat: 34.9218,
    lng: -2.3200,
    scores: {
      securite: 80,
      hopital: 90,
      ecole: 85,
      espacesVerts: 40,
      routeNationale: 30, // Proche donc score faible (inverse)
      commerces: 95,
      centreville: 100,
      mosquees: 90,
      transport: 95,
    },
    get scoreGlobal() { return computeScore(this.scores); },
    distances: {
      hopital: "400 m",
      ecole: "200 m",
      parc: "1.2 km",
      supermarche: "100 m",
      mosquee: "300 m",
      routeNationale: "200 m"
    },
    bruit: "élevé",
    prixEstime: "600 000 - 800 000 MAD"
  },
  {
    id: "al-massira",
    nom: "Al Massira",
    lat: 34.9180,
    lng: -2.3150,
    scores: {
      securite: 85,
      hopital: 60,
      ecole: 90,
      espacesVerts: 60,
      routeNationale: 80, // Loin de la route, calme
      commerces: 70,
      centreville: 70,
      mosquees: 95,
      transport: 65,
    },
    get scoreGlobal() { return computeScore(this.scores); },
    distances: {
      hopital: "1.5 km",
      ecole: "300 m",
      parc: "800 m",
      supermarche: "600 m",
      mosquee: "150 m",
      routeNationale: "1.2 km"
    },
    bruit: "faible",
    prixEstime: "450 000 - 600 000 MAD"
  },
  {
    id: "al-qods",
    nom: "Al Qods",
    lat: 34.9250,
    lng: -2.3250,
    scores: {
      securite: 75,
      hopital: 85,
      ecole: 80,
      espacesVerts: 55,
      routeNationale: 65,
      commerces: 80,
      centreville: 85,
      mosquees: 85,
      transport: 80,
    },
    get scoreGlobal() { return computeScore(this.scores); },
    distances: {
      hopital: "700 m",
      ecole: "400 m",
      parc: "1 km",
      supermarche: "300 m",
      mosquee: "400 m",
      routeNationale: "800 m"
    },
    bruit: "moyen",
    prixEstime: "500 000 - 650 000 MAD"
  },
  {
    id: "quartier-industriel",
    nom: "Quartier Industriel",
    lat: 34.9100,
    lng: -2.3300,
    scores: {
      securite: 50,
      hopital: 40,
      ecole: 45,
      espacesVerts: 20,
      routeNationale: 10, // Très proche
      commerces: 60,
      centreville: 40,
      mosquees: 60,
      transport: 70,
    },
    get scoreGlobal() { return computeScore(this.scores); },
    distances: {
      hopital: "3 km",
      ecole: "1.5 km",
      parc: "2.5 km",
      supermarche: "1 km",
      mosquee: "800 m",
      routeNationale: "50 m"
    },
    bruit: "élevé",
    prixEstime: "250 000 - 350 000 MAD"
  },
  {
    id: "route-saidia",
    nom: "Route de Saïdia",
    lat: 34.9280,
    lng: -2.3100,
    scores: {
      securite: 90,
      hopital: 50,
      ecole: 65,
      espacesVerts: 95,
      routeNationale: 85,
      commerces: 50,
      centreville: 50,
      mosquees: 70,
      transport: 60,
    },
    get scoreGlobal() { return computeScore(this.scores); },
    distances: {
      hopital: "2.5 km",
      ecole: "1.2 km",
      parc: "100 m",
      supermarche: "1.5 km",
      mosquee: "600 m",
      routeNationale: "1.5 km"
    },
    bruit: "faible",
    prixEstime: "550 000 - 750 000 MAD"
  },
  {
    id: "route-oujda",
    nom: "Route d'Oujda",
    lat: 34.9150,
    lng: -2.3350,
    scores: {
      securite: 65,
      hopital: 55,
      ecole: 70,
      espacesVerts: 40,
      routeNationale: 25,
      commerces: 75,
      centreville: 60,
      mosquees: 80,
      transport: 85,
    },
    get scoreGlobal() { return computeScore(this.scores); },
    distances: {
      hopital: "2 km",
      ecole: "600 m",
      parc: "1.8 km",
      supermarche: "400 m",
      mosquee: "300 m",
      routeNationale: "100 m"
    },
    bruit: "élevé",
    prixEstime: "350 000 - 500 000 MAD"
  },
  {
    id: "zerarda",
    nom: "Zerarda",
    lat: 34.9300,
    lng: -2.3200,
    scores: {
      securite: 85,
      hopital: 45,
      ecole: 75,
      espacesVerts: 80,
      routeNationale: 90,
      commerces: 45,
      centreville: 40,
      mosquees: 85,
      transport: 50,
    },
    get scoreGlobal() { return computeScore(this.scores); },
    distances: {
      hopital: "3 km",
      ecole: "800 m",
      parc: "500 m",
      supermarche: "2 km",
      mosquee: "400 m",
      routeNationale: "2 km"
    },
    bruit: "faible",
    prixEstime: "300 000 - 450 000 MAD"
  },
  {
    id: "quartier-administratif",
    nom: "Quartier Administratif",
    lat: 34.9220,
    lng: -2.3220,
    scores: {
      securite: 95,
      hopital: 85,
      ecole: 90,
      espacesVerts: 70,
      routeNationale: 50,
      commerces: 85,
      centreville: 95,
      mosquees: 85,
      transport: 90,
    },
    get scoreGlobal() { return computeScore(this.scores); },
    distances: {
      hopital: "600 m",
      ecole: "300 m",
      parc: "400 m",
      supermarche: "200 m",
      mosquee: "250 m",
      routeNationale: "500 m"
    },
    bruit: "moyen",
    prixEstime: "650 000 - 900 000 MAD"
  }
];
