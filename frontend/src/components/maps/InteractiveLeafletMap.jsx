import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export const createPinIcon = (color = '#0d9488', size = 14) => {
  return L.divIcon({
    className: 'custom-pin-icon',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

export default function InteractiveLeafletMap({
  center = [5.1521, 46.1996],
  zoom = 6,
  markers = [],
  circles = [],
  height = '400px',
  onMapClick,
  className = ''
}) {
  return (
    <div style={{ height, width: '100%' }} className={`relative rounded-xl overflow-hidden shadow-sm border border-slate-200 ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Circles (e.g. Disease Outbreak Radius Zones) */}
        {circles.map((c, idx) => (
          <Circle
            key={idx}
            center={[c.latitude, c.longitude]}
            radius={c.radiusMeters || 5000}
            pathOptions={{
              color: c.color || '#dc2626',
              fillColor: c.fillColor || '#ef4444',
              fillOpacity: 0.2,
              weight: 2
            }}
          >
            {c.popup && <Popup>{c.popup}</Popup>}
          </Circle>
        ))}

        {/* Markers */}
        {markers.map((m, idx) => (
          <Marker
            key={idx}
            position={[m.latitude, m.longitude]}
            icon={m.icon || createPinIcon(m.color || '#0d9488')}
          >
            {m.popup && <Popup>{m.popup}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
