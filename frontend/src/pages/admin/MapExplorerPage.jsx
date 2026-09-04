import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Map, Users, Megaphone, ClipboardList, AlertTriangle, Layers, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import Badge from '../../components/common/Badge';

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.4);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const icons = {
  volunteers: createCustomIcon('#0d9488'),
  campaigns: createCustomIcon('#2563eb'),
  submissions: createCustomIcon('#10b981'),
  emergencies: createCustomIcon('#dc2626')
};

export default function MapExplorerPage() {
  const { t } = useLanguage();
  const [layersData, setLayersData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeLayers, setActiveLayers] = useState({
    volunteers: true,
    campaigns: true,
    submissions: true,
    emergencies: true
  });

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      const res = await api.get('/maps/layers');
      if (res.success) {
        setLayersData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLayer = (layerKey) => {
    setActiveLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Map className="w-7 h-7 text-teal-700 dark:text-teal-400" /> {t('nav.maps')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Geographic Information System (GIS) visualization of volunteers, campaign zones, and outbreak alerts across Somalia
          </p>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-semibold">
          <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5" /> {t('map.layers')}
          </span>
          <button
            onClick={() => toggleLayer('volunteers')}
            className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeLayers.volunteers
                ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-teal-600"></span> {t('map.volunteers')}
          </button>
          <button
            onClick={() => toggleLayer('campaigns')}
            className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeLayers.campaigns
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-600"></span> {t('map.campaigns')}
          </button>
          <button
            onClick={() => toggleLayer('submissions')}
            className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeLayers.submissions
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span> {t('map.submissions')}
          </button>
          <button
            onClick={() => toggleLayer('emergencies')}
            className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeLayers.emergencies
                ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-600"></span> {t('map.emergencies')}
          </button>
        </div>
      </div>

      {/* Interactive Map Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-[620px] relative">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <MapContainer
            center={[5.1521, 46.1996]}
            zoom={6}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Volunteers Layer */}
            {activeLayers.volunteers &&
              layersData?.volunteers?.map((v) => (
                <Marker key={`v-${v.id}`} position={[v.latitude, v.longitude]} icon={icons.volunteers}>
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <div className="flex items-center gap-1 font-bold text-teal-800">
                        <Users className="w-3.5 h-3.5" /> {v.full_name}
                      </div>
                      <p className="text-slate-500 font-mono">{v.volunteer_id}</p>
                      <p className="text-slate-700">{t('map.region')} <strong>{v.region_name || 'Somalia'}</strong></p>
                      <Badge status={v.status}>{v.status}</Badge>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Campaigns Layer */}
            {activeLayers.campaigns &&
              layersData?.campaigns?.map((c) => (
                <Marker key={`c-${c.id}`} position={[c.latitude, c.longitude]} icon={icons.campaigns}>
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <div className="flex items-center gap-1 font-bold text-blue-800">
                        <Megaphone className="w-3.5 h-3.5" /> {c.name}
                      </div>
                      <p className="text-slate-600">{c.code} • {c.type}</p>
                      <p className="text-slate-500">{t('map.region')} <strong>{c.target_region}</strong></p>
                      <Badge status={c.status}>{c.status}</Badge>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Field Submissions Layer */}
            {activeLayers.submissions &&
              layersData?.submissions?.map((s) => (
                <Marker key={`s-${s.id}`} position={[s.latitude, s.longitude]} icon={icons.submissions}>
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <div className="flex items-center gap-1 font-bold text-emerald-800">
                        <ClipboardList className="w-3.5 h-3.5" /> {s.form_name || t('map.field_assessment')}
                      </div>
                      <p className="text-slate-600">Volunteer: {s.volunteer_name}</p>
                      <p className="text-slate-400 font-mono">{new Date(s.created_at).toLocaleDateString()}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Emergencies Layer */}
            {activeLayers.emergencies &&
              layersData?.emergencies?.map((e) => (
                <Marker key={`e-${e.id}`} position={[e.latitude, e.longitude]} icon={icons.emergencies}>
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <div className="flex items-center gap-1 font-bold text-red-800">
                        <AlertTriangle className="w-3.5 h-3.5" /> {e.report_code}: {e.emergency_type}
                      </div>
                      <p className="text-slate-700">{t('map.cases')} <strong>{e.suspected_cases}</strong></p>
                      <p className="text-slate-600">{e.location_name}</p>
                      <Badge status={e.severity}>{e.severity}</Badge>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
