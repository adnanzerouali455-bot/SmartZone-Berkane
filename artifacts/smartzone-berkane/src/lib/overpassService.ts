// ── Overpass API Service ─────────────────────────────────────────────────────
// Fetches real OSM POIs for Berkane and caches them in localStorage (24 h TTL).

export type POICategory =
  | 'hopital'
  | 'ecole'
  | 'espacesVerts'
  | 'mosquee'
  | 'transport'
  | 'commerce'
  | 'police'
  | 'routeNationale';

export interface POI {
  id: number;
  lat: number;
  lng: number;
  category: POICategory;
  name?: string;
}

export interface BerkanePOIs {
  hopital: POI[];
  ecole: POI[];
  espacesVerts: POI[];
  mosquee: POI[];
  transport: POI[];
  commerce: POI[];
  police: POI[];
  routeNationale: POI[];
  fetchedAt: number;
}

export const POI_META: Record<POICategory, { label: string; color: string; symbol: string }> = {
  hopital:        { label: 'Hôpitaux',    color: '#ef4444', symbol: '✚' },
  ecole:          { label: 'Écoles',      color: '#3b82f6', symbol: '📚' },
  espacesVerts:   { label: 'Parcs',       color: '#22c55e', symbol: '🌿' },
  mosquee:        { label: 'Mosquées',    color: '#a855f7', symbol: '☪' },
  transport:      { label: 'Transport',   color: '#f97316', symbol: '🚌' },
  commerce:       { label: 'Commerces',   color: '#ca8a04', symbol: '🛒' },
  police:         { label: 'Police',      color: '#1d4ed8', symbol: '🚔' },
  routeNationale: { label: 'Routes',      color: '#78716c', symbol: '🛣' },
};

const CACHE_KEY = 'smartzone_pois_v3';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 h
const BBOX = '34.88,-2.38,34.96,-2.27';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Single comprehensive Overpass query
const QUERY = `
[out:json][timeout:30];
(
  node["amenity"~"^(hospital|clinic|doctors)$"](${BBOX});
  way["amenity"~"^(hospital|clinic)$"](${BBOX});
  node["amenity"~"^(school|university|college)$"](${BBOX});
  way["amenity"~"^(school|university|college)$"](${BBOX});
  node["leisure"~"^(park|garden|playground|pitch)$"](${BBOX});
  way["leisure"~"^(park|garden|pitch)$"](${BBOX});
  node["amenity"="place_of_worship"]["religion"="muslim"](${BBOX});
  way["amenity"="place_of_worship"]["religion"="muslim"](${BBOX});
  node["highway"="bus_stop"](${BBOX});
  node["amenity"="bus_station"](${BBOX});
  node["shop"~"^(supermarket|mall|convenience|general|grocery|department_store)$"](${BBOX});
  way["shop"~"^(supermarket|mall|department_store)$"](${BBOX});
  node["amenity"~"^(marketplace|pharmacy|bank)$"](${BBOX});
  way["amenity"="marketplace"](${BBOX});
  node["amenity"="police"](${BBOX});
  way["highway"~"^(trunk|primary|trunk_link|primary_link)$"](${BBOX});
);
out center qt;
`.trim();

function categorize(tags: Record<string, string>): POICategory | null {
  const am  = tags.amenity  || '';
  const lei = tags.leisure  || '';
  const sh  = tags.shop     || '';
  const hw  = tags.highway  || '';

  if (['hospital', 'clinic', 'doctors'].includes(am)) return 'hopital';
  if (['school', 'university', 'college'].includes(am)) return 'ecole';
  if (['park', 'garden', 'playground', 'pitch'].includes(lei)) return 'espacesVerts';
  if (am === 'place_of_worship' && tags.religion === 'muslim') return 'mosquee';
  if (am === 'bus_station' || hw === 'bus_stop') return 'transport';
  if (['supermarket', 'mall', 'convenience', 'general', 'grocery', 'department_store'].includes(sh)) return 'commerce';
  if (['marketplace', 'pharmacy', 'bank'].includes(am)) return 'commerce';
  if (am === 'police') return 'police';
  if (['trunk', 'primary', 'trunk_link', 'primary_link'].includes(hw)) return 'routeNationale';
  return null;
}

export async function fetchBerkanePOIs(): Promise<BerkanePOIs> {
  // Check localStorage cache
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached: BerkanePOIs = JSON.parse(raw);
      if (Date.now() - cached.fetchedAt < CACHE_TTL) return cached;
    }
  } catch { /* ignore */ }

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(QUERY),
  });

  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);

  const json = await res.json();

  const result: BerkanePOIs = {
    hopital: [], ecole: [], espacesVerts: [], mosquee: [],
    transport: [], commerce: [], police: [], routeNationale: [],
    fetchedAt: Date.now(),
  };

  for (const el of json.elements as any[]) {
    const tags: Record<string, string> = el.tags || {};
    const cat = categorize(tags);
    if (!cat) continue;

    let lat: number, lng: number;
    if (el.type === 'node') {
      lat = el.lat; lng = el.lon;
    } else if (el.type === 'way' && el.center) {
      lat = el.center.lat; lng = el.center.lon;
    } else continue;

    result[cat].push({
      id: el.id, lat, lng: lng, category: cat,
      name: tags['name:fr'] || tags.name || tags['name:ar'] || undefined,
    });
  }

  try { localStorage.setItem(CACHE_KEY, JSON.stringify(result)); } catch { /* ignore */ }
  return result;
}
