"use client";
import React, { useEffect, useRef } from 'react';

// We use Leaflet directly (not react-leaflet) to avoid SSR issues and keep things lean.
export default function MapPicker({ value, onChange }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);

  useEffect(() => {
    if (mapRef.current) return; // already initialized

    // Dynamically import Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id   = 'leaflet-css';
      link.rel  = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      const Leaflet = L.default;

      const map = Leaflet.map(containerRef.current, {
        center: [-1.9706, 30.1044],   // Kigali, Rwanda
        zoom: 12,
        zoomControl: true,
      });

      // Dark-themed tile layer (CartoDB Dark Matter)
      Leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom marker icon
      const icon = Leaflet.divIcon({
        className: '',
        html: `<div style="
          width:36px;height:36px;border-radius:50% 50% 50% 0;
          background:var(--color-primary,#6c63ff);
          border:3px solid #fff;
          transform:rotate(-45deg);
          box-shadow:0 4px 14px rgba(108,99,255,0.6);
        "></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        onChange({ lat, lng });
        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        } else {
          markerRef.current = Leaflet.marker(e.latlng, { icon, draggable: true }).addTo(map);
          markerRef.current.on('dragend', (ev) => {
            const pos = ev.target.getLatLng();
            onChange({ lat: pos.lat, lng: pos.lng });
          });
        }
      });

      mapRef.current = map;

      // If value already set (e.g. form restored), show marker
      if (value) {
        markerRef.current = Leaflet.marker([value.lat, value.lng], { icon, draggable: true }).addTo(map);
        map.setView([value.lat, value.lng], 14);
      }
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="map-container"
      id="map-picker"
      aria-label="Click to pin location on map"
    />
  );
}
