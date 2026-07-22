import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Quartier } from '../data/quartiers';

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
  centerOn?: { lat: number; lng: number; zoom: number };
}

export const Map: React.FC<MapProps> = ({ quartiers, highlightedIds, onQuartierClick, centerOn }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [id: string]: { marker: L.Marker; circle: L.Circle } }>({});

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(containerRef.current).setView([34.9218, -2.3200], 14);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    // Add markers and circles
    quartiers.forEach((q) => {
      const color = q.scoreGlobal >= 75 ? '#16a34a' : q.scoreGlobal >= 50 ? '#f59e0b' : '#dc2626';
      
      const circle = L.circle([q.lat, q.lng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.08,
        radius: 600,
        weight: 1
      }).addTo(map);

      const html = `<div style="background:${color};color:white;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${q.scoreGlobal}</div>`;
      
      const icon = L.divIcon({
        html,
        className: '', // we add marker-highlighted dynamically
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([q.lat, q.lng], { icon }).addTo(map);
      
      marker.bindTooltip(`<b>${q.nom}</b><br/>Score: ${q.scoreGlobal}/100`, { direction: 'top', offset: [0, -20] });
      
      marker.on('click', () => {
        onQuartierClick(q);
      });

      markersRef.current[q.id] = { marker, circle };
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [quartiers, onQuartierClick]);

  // Handle highlights
  useEffect(() => {
    quartiers.forEach(q => {
      const el = markersRef.current[q.id]?.marker.getElement();
      if (el) {
        if (highlightedIds.includes(q.id)) {
          el.classList.add('marker-highlighted');
        } else {
          el.classList.remove('marker-highlighted');
        }
      }
    });
  }, [highlightedIds, quartiers]);

  // Handle centerOn
  useEffect(() => {
    if (centerOn && mapRef.current) {
      mapRef.current.flyTo([centerOn.lat, centerOn.lng], centerOn.zoom, { duration: 1.5 });
    }
  }, [centerOn]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};
