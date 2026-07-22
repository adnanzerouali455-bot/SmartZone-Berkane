import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Quartier, computePointScore, PointScore } from '../data/quartiers';

// Fix leaflet default icon bug
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapProps {
  quartiers: Quartier[];
  highlightedIds: string[];
  onQuartierClick: (q: Quartier) => void;
  onMapClick?: (point: PointScore) => void;
  centerOn?: { lat: number; lng: number; zoom: number };
}

export const Map: React.FC<MapProps> = ({
  quartiers,
  highlightedIds,
  onQuartierClick,
  onMapClick,
  centerOn,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [id: string]: { marker: L.Marker; circle: L.Circle } }>({});
  // Marqueur temporaire pour le point cliqué
  const clickMarkerRef = useRef<L.Marker | null>(null);

  // Réf mutable pour onMapClick (évite de recréer le handler à chaque render)
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);

  const quartiersRef = useRef(quartiers);
  useEffect(() => { quartiersRef.current = quartiers; }, [quartiers]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([34.9218, -2.3200], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    // ── Marqueurs de quartiers ──────────────────────────────────────────────
    quartiers.forEach((q) => {
      const color = q.scoreGlobal >= 75 ? '#16a34a' : q.scoreGlobal >= 50 ? '#f59e0b' : '#dc2626';

      const circle = L.circle([q.lat, q.lng], {
        color,
        fillColor: color,
        fillOpacity: 0.08,
        radius: 600,
        weight: 1,
      }).addTo(map);

      const html = `<div style="background:${color};color:white;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${q.scoreGlobal}</div>`;

      const icon = L.divIcon({ html, className: '', iconSize: [40, 40], iconAnchor: [20, 20] });
      const marker = L.marker([q.lat, q.lng], { icon }).addTo(map);

      marker.bindTooltip(`<b>${q.nom}</b><br/>Score: ${q.scoreGlobal}/100`, {
        direction: 'top',
        offset: [0, -20],
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onQuartierClick(q);
      });

      markersRef.current[q.id] = { marker, circle };
    });

    // ── Clic sur la carte (hors marqueurs) ─────────────────────────────────
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const point = computePointScore(lat, lng, quartiersRef.current);

      // Retire l'ancien marqueur temporaire
      if (clickMarkerRef.current) {
        clickMarkerRef.current.remove();
        clickMarkerRef.current = null;
      }

      const scoreColor =
        point.scoreGlobal >= 75 ? '#16a34a' : point.scoreGlobal >= 50 ? '#f59e0b' : '#dc2626';

      // Icône épingle avec score
      const pinHtml = `
        <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer">
          <div style="
            background:${scoreColor};
            color:white;
            border-radius:12px;
            padding:4px 9px;
            font-weight:bold;
            font-size:14px;
            border:3px solid white;
            box-shadow:0 3px 12px rgba(0,0,0,0.35);
            white-space:nowrap;
          ">${point.scoreGlobal}/100</div>
          <div style="
            width:0;height:0;
            border-left:7px solid transparent;
            border-right:7px solid transparent;
            border-top:10px solid ${scoreColor};
            margin-top:-1px;
          "></div>
          <div style="
            width:6px;height:6px;border-radius:50%;
            background:#1e3a5f;margin-top:1px;
          "></div>
        </div>`;

      const pinIcon = L.divIcon({
        html: pinHtml,
        className: 'custom-pin-icon',
        iconSize: [70, 60],
        iconAnchor: [35, 58],
      });

      const marker = L.marker([lat, lng], { icon: pinIcon, zIndexOffset: 1000 }).addTo(map);
      marker.bindTooltip(
        `📍 Point personnalisé<br/>Score : <b>${point.scoreGlobal}/100</b><br/>À ${point.distanceToNearest} m de ${point.nearestQuartier.nom}`,
        { direction: 'top', offset: [0, -60] }
      );
      clickMarkerRef.current = marker;

      onMapClickRef.current?.(point);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Highlights ─────────────────────────────────────────────────────────
  useEffect(() => {
    quartiers.forEach(q => {
      const el = markersRef.current[q.id]?.marker.getElement();
      if (el) {
        el.classList.toggle('marker-highlighted', highlightedIds.includes(q.id));
      }
    });
  }, [highlightedIds, quartiers]);

  // ── FlyTo ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (centerOn && mapRef.current) {
      mapRef.current.flyTo([centerOn.lat, centerOn.lng], centerOn.zoom, { duration: 1.5 });
    }
  }, [centerOn]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};
