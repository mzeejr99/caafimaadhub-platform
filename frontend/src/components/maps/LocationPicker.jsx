import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin, Navigation, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../common/Button';
import { createPinIcon } from './InteractiveLeafletMap';

function LocationMarker({ position, setPosition, onSelect }) {
  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      if (onSelect) {
        onSelect({
          latitude: parseFloat(e.latlng.lat.toFixed(6)),
          longitude: parseFloat(e.latlng.lng.toFixed(6))
        });
      }
    }
  });

  return position ? <Marker position={position} icon={createPinIcon('#0d9488', 18)} /> : null;
}

export default function LocationPicker({
  initialLat = 2.0469,
  initialLng = 45.3182,
  onLocationSelect,
  height = '240px'
}) {
  const { t } = useLanguage();
  const [position, setPosition] = useState([initialLat, initialLng]);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition([initialLat, initialLng]);
    }
  }, [initialLat, initialLng]);

  const handleGetCurrentGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        setGpsLoading(false);
        if (onLocationSelect) {
          onLocationSelect({
            latitude: parseFloat(pos.coords.latitude.toFixed(6)),
            longitude: parseFloat(pos.coords.longitude.toFixed(6)),
            accuracy: pos.coords.accuracy
          });
        }
      },
      () => {
        setGpsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-teal-700" /> {t('location.click_map')}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleGetCurrentGPS}
          loading={gpsLoading}
          icon={Navigation}
        >
          {t('location.detect_gps')}
        </Button>
      </div>

      <div style={{ height }} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm relative">
        <MapContainer
          center={position}
          zoom={12}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} onSelect={onLocationSelect} />
        </MapContainer>
      </div>

      {position && (
        <div className="text-[11px] font-mono text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 flex items-center justify-between">
          <span>Lat: {position[0].toFixed(5)}, Lng: {position[1].toFixed(5)}</span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {t('location.pin_dropped')}
          </span>
        </div>
      )}
    </div>
  );
}
