import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Quartier, computePointScore, PointScore } from '../data/quartiers';
import { BerkanePOIs, POICategory, POI_META } from '../lib/overpassService';

// Fix leaflet default icon bug
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapProps {
  quartiers: Quartier[];
  highlightedIds: string[];
  onQuartierClick: (q: Quartier) => void;
  onMapClick?: (point: PointScore) => void;
  centerOn?: { lat: number; lng: number; zoom: number };
  pois?: BerkanePOIs | null;
}

const ALL_CATEGORIES = Object.keys(POI_META) as POICategory[];

export const Map: React.FC<MapProps> = ({
  quartiers,
  highlightedIds,
  onQuartierClick,
  onMapClick,
  centerOn,
  pois,
}) => {
  const mapRef         = useRef<L.Map | null>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const markersRef     = useRef<Record<string, L.Marker>>({});
  const clickMarkerRef = useRef<L.Marker | null>(null);
  const poiLayersRef   = useRef<Record<POICategory, L.LayerGroup>>({} as any);

  // Category visibility toggle (stored in component state for the legend)
  const [visible, setVisible] = useState<Record<POICategory, boolean>>(
    () => Object.fromEntries(ALL_CATEGORIES.map(c => [c, true])) as Record<POICategory, boolean>
  );
  const visibleRef = useRef(visible);
  useEffect(() => { visibleRef.current = visible; }, [visible]);

  // Mutable refs for callbacks
  const onMapClickRef   = useRef(onMapClick);
  const quartiersRef    = useRef(quartiers);
  const poisRef         = useRef(pois);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { quartiersRef.current = quartiers; }, [quartiers]);
  useEffect(() => { poisRef.current = pois; }, [pois]);

  // ── Initialise map (once) ─────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: true }).setView([34.9218, -2.3200], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Pre-create one LayerGroup per POI category
    for (const cat of ALL_CATEGORIES) {
      poiLayersRef.current[cat] = L.layerGroup().addTo(map);
    }

    // ── Quartier markers (no circles) ───────────────────────────────────────
    quartiers.forEach(q => {
      const color = q.scoreGlobal >= 75 ? '#16a34a' : q.scoreGlobal >= 50 ? '#f59e0b' : '#dc2626';
      const html = `
        <div style="
          background:${color};color:white;border-radius:50%;
          width:40px;height:40px;display:flex;align-items:center;
          justify-content:center;font-weight:bold;font-size:13px;
          border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)
        ">${q.scoreGlobal}</div>`;

      const icon = L.divIcon({ html, className: '', iconSize: [40, 40], iconAnchor: [20, 20] });
      const marker = L.marker([q.lat, q.lng], { icon, zIndexOffset: 500 }).addTo(map);
      marker.bindTooltip(`<b>${q.nom}</b><br/>Score: ${q.scoreGlobal}/100`, { direction: 'top', offset: [0, -22] });
      marker.on('click', e => { L.DomEvent.stopPropagation(e); onQuartierClick(q); });
      markersRef.current[q.id] = marker;
    });

    // ── Map click → compute score for that exact point ───────────────────────
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const point = computePointScore(lat, lng, quartiersRef.current, poisRef.current);

      if (clickMarkerRef.current) { clickMarkerRef.current.remove(); clickMarkerRef.current = null; }

      const sc = point.scoreGlobal >= 75 ? '#16a34a' : point.scoreGlobal >= 50 ? '#f59e0b' : '#dc2626';
      const pinHtml = `
        <div style="position:relative;display:flex;flex-direction:column;align-items:center">
          <div style="
            background:${sc};color:white;border-radius:10px;padding:4px 9px;
            font-weight:bold;font-size:14px;border:3px solid white;
            box-shadow:0 3px 12px rgba(0,0,0,0.35);white-space:nowrap;
          ">${point.scoreGlobal}/100</div>
          <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid ${sc};margin-top:-1px"></div>
          <div style="width:6px;height:6px;border-radius:50%;background:#1e3a5f;margin-top:1px"></div>
        </div>`;

      const m = L.marker([lat, lng], {
        icon: L.divIcon({ html: pinHtml, className: 'custom-pin-icon', iconSize: [70, 60], iconAnchor: [35, 58] }),
        zIndexOffset: 1000,
      }).addTo(map);
      m.bindTooltip(
        `📍 Point personnalisé<br/>Score : <b>${point.scoreGlobal}/100</b><br/>À ${point.distanceToNearest} m de ${point.nearestQuartier.nom}`,
        { direction: 'top', offset: [0, -60] }
      );
      clickMarkerRef.current = m;
      onMapClickRef.current?.(point);
    });

    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update quartier marker icons when scores change (after POI load) ───────
  useEffect(() => {
    quartiers.forEach(q => {
      const marker = markersRef.current[q.id];
      if (!marker) return;
      const color = q.scoreGlobal >= 75 ? '#16a34a' : q.scoreGlobal >= 50 ? '#f59e0b' : '#dc2626';
      const html = `
        <div style="
          background:${color};color:white;border-radius:50%;
          width:40px;height:40px;display:flex;align-items:center;
          justify-content:center;font-weight:bold;font-size:13px;
          border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)
        ">${q.scoreGlobal}</div>`;
      marker.setIcon(L.divIcon({ html, className: '', iconSize: [40, 40], iconAnchor: [20, 20] }));
      marker.setTooltipContent(`<b>${q.nom}</b><br/>Score: ${q.scoreGlobal}/100`);
    });
  }, [quartiers]);

  // ── Populate POI layer groups when pois arrive ────────────────────────────
  useEffect(() => {
    if (!pois || !mapRef.current) return;

    for (const cat of ALL_CATEGORIES) {
      poiLayersRef.current[cat]?.clearLayers();
      const meta = POI_META[cat];

      const items: POI[] = (pois as any)[cat] ?? [];
      items.forEach((poi: POI) => {
        // Skip route nationale — too many nodes, shown via OSM basemap
        if (cat === 'routeNationale') return;

        const html = `
          <div title="${poi.name || meta.label}" style="
            background:${meta.color};color:white;
            border-radius:50%;width:22px;height:22px;
            display:flex;align-items:center;justify-content:center;
            font-size:11px;border:2px solid white;
            box-shadow:0 1px 4px rgba(0,0,0,0.4);cursor:default;
          ">${meta.symbol}</div>`;

        const icon = L.divIcon({ html, className: '', iconSize: [22, 22], iconAnchor: [11, 11] });
        const m = L.marker([poi.lat, poi.lng], { icon, zIndexOffset: 100 });
        if (poi.name) m.bindTooltip(`${meta.symbol} ${poi.name}`, { direction: 'top', offset: [0, -13] });
        poiLayersRef.current[cat].addLayer(m);
      });
    }
  }, [pois]);

  // ── Show/hide POI layers when legend is toggled ───────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    for (const cat of ALL_CATEGORIES) {
      const layer = poiLayersRef.current[cat];
      if (!layer) continue;
      if (visible[cat]) {
        if (!mapRef.current.hasLayer(layer)) mapRef.current.addLayer(layer);
      } else {
        if (mapRef.current.hasLayer(layer)) mapRef.current.removeLayer(layer);
      }
    }
  }, [visible]);

  // ── Highlights ────────────────────────────────────────────────────────────
  useEffect(() => {
    quartiers.forEach(q => {
      const el = markersRef.current[q.id]?.getElement();
      if (el) el.classList.toggle('marker-highlighted', highlightedIds.includes(q.id));
    });
  }, [highlightedIds, quartiers]);

  // ── FlyTo ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (centerOn && mapRef.current) {
      mapRef.current.flyTo([centerOn.lat, centerOn.lng], centerOn.zoom, { duration: 1.5 });
    }
  }, [centerOn]);

  const toggleCat = (cat: POICategory) =>
    setVisible(prev => ({ ...prev, [cat]: !prev[cat] }));

  // Categories shown in legend (exclude routeNationale — shown via OSM basemap)
  const legendCats = ALL_CATEGORIES.filter(c => c !== 'routeNationale');

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* POI Legend — bottom right, above Leaflet attribution */}
      {pois && (
        <div style={{
          position: 'absolute',
          bottom: '28px',
          right: '10px',
          zIndex: 1000,
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          fontSize: '11px',
          minWidth: '130px',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontWeight: 700, color: '#374151', marginBottom: '2px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Couches POI
          </div>
          {legendCats.map(cat => {
            const meta = POI_META[cat];
            const count = ((pois as any)[cat] as POI[])?.length ?? 0;
            return (
              <button
                key={cat}
                onClick={() => toggleCat(cat)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '2px 0', textAlign: 'left',
                  opacity: visible[cat] ? 1 : 0.35,
                  transition: 'opacity 0.15s',
                }}
              >
                <span style={{
                  background: meta.color, color: 'white',
                  borderRadius: '50%', width: '18px', height: '18px',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', flexShrink: 0,
                }}>
                  {meta.symbol}
                </span>
                <span style={{ color: '#374151', fontWeight: visible[cat] ? 600 : 400 }}>
                  {meta.label}
                  <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: 3 }}>({count})</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
