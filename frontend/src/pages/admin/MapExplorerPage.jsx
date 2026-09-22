import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Map, Users, Megaphone, ClipboardList,
  AlertTriangle, Layers, Loader2, Navigation
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
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

// Custom colored dot icons for each layer
const createCustomIcon = (color, size = 14) =>
  L.divIcon({
    className: '',
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 2.5px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.45);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

const icons = {
  volunteers:  createCustomIcon('#0d9488'),
  campaigns:   createCustomIcon('#2563eb'),
  submissions: createCustomIcon('#10b981'),
  emergencies: createCustomIcon('#dc2626', 16),
};

const LAYER_CONFIG = [
  { key: 'volunteers',  color: 'teal',    Icon: Users,         labelKey: 'map.volunteers' },
  { key: 'campaigns',   color: 'blue',    Icon: Megaphone,     labelKey: 'map.campaigns' },
  { key: 'submissions', color: 'emerald', Icon: ClipboardList, labelKey: 'map.submissions' },
  { key: 'emergencies', color: 'red',     Icon: AlertTriangle, labelKey: 'map.emergencies' },
];

const DOT_COLORS = {
  teal:    'bg-teal-500',
  blue:    'bg-blue-500',
  emerald: 'bg-emerald-500',
  red:     'bg-red-500',
};

const ACTIVE_CLASSES = {
  teal:    'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300',
  blue:    'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300',
  red:     'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300',
};

const STAT_CARD_COLORS = {
  teal:    { bg: 'bg-teal-50 dark:bg-teal-950/40',    border: 'border-teal-200 dark:border-teal-800',    icon: 'text-teal-600 dark:text-teal-400',    num: 'text-teal-700 dark:text-teal-300' },
  blue:    { bg: 'bg-blue-50 dark:bg-blue-950/40',    border: 'border-blue-200 dark:border-blue-800',    icon: 'text-blue-600 dark:text-blue-400',    num: 'text-blue-700 dark:text-blue-300' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800', icon: 'text-emerald-600 dark:text-emerald-400', num: 'text-emerald-700 dark:text-emerald-300' },
  red:     { bg: 'bg-red-50 dark:bg-red-950/40',      border: 'border-red-200 dark:border-red-800',      icon: 'text-red-600 dark:text-red-400',      num: 'text-red-700 dark:text-red-300' },
};

export default function MapExplorerPage() {
  const { t } = useLanguage();
  const [layersData, setLayersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeLayers, setActiveLayers] = useState({
    volunteers: true,
    campaigns: true,
    submissions: true,
    emergencies: true,
  });

  useEffect(() => { fetchMapData(); }, []);

  const fetchMapData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/maps/layers');
      if (res.success) setLayersData(res.data);
      else setError('Failed to load map data.');
    } catch (err) {
      console.error(err);
      setError('Network error loading map data.');
    } finally {
      setLoading(false);
    }
  };

  const toggleLayer = (key) =>
    setActiveLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  const counts = {
    volunteers:  layersData?.volunteers?.length  ?? 0,
    campaigns:   layersData?.campaigns?.length   ?? 0,
    submissions: layersData?.submissions?.length ?? 0,
    emergencies: layersData?.emergencies?.length ?? 0,
  };

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Map className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            {t('nav.maps')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('map.subtitle')}
          </p>
        </div>

        {/* Layer Toggle Pills */}
        <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-semibold">
          <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1 select-none">
            <Layers className="w-3.5 h-3.5" /> {t('map.layers')}
          </span>
          {LAYER_CONFIG.map(({ key, color, labelKey }) => (
            <button
              key={key}
              onClick={() => toggleLayer(key)}
              className={`px-2.5 py-1 rounded-lg border transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                activeLayers[key]
                  ? ACTIVE_CLASSES[color]
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${DOT_COLORS[color]} ${!activeLayers[key] ? 'opacity-30' : ''}`} />
              {t(labelKey)}
            </button>
          ))}
          <button
            onClick={fetchMapData}
            className="ml-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Refresh"
          >
            <Navigation className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Map Container ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
           style={{ height: '580px', position: 'relative' }}>

        {loading && (
          <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading map data…</p>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-3 text-center px-8">
            <AlertTriangle className="w-10 h-10 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            <button onClick={fetchMapData}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <MapContainer
            center={[5.1521, 46.1996]}
            zoom={6}
            zoomControl={false}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%' }}
          >
            <ZoomControl position="bottomright" />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Volunteers */}
            {activeLayers.volunteers && layersData?.volunteers?.map((v) => (
              <Marker key={`v-${v.id}`} position={[v.latitude, v.longitude]} icon={icons.volunteers}>
                <Popup>
                  <div className="p-1 space-y-1 text-xs min-w-[140px]">
                    <div className="flex items-center gap-1 font-bold text-teal-800">
                      <Users className="w-3.5 h-3.5" /> {v.full_name}
                    </div>
                    <p className="text-slate-500 font-mono text-[10px]">{v.volunteer_id}</p>
                    <p className="text-slate-700">{t('map.region')} <strong>{v.region_name || 'Somalia'}</strong></p>
                    <Badge status={v.status}>{v.status}</Badge>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Campaigns */}
            {activeLayers.campaigns && layersData?.campaigns?.map((c) => (
              <Marker key={`c-${c.id}`} position={[c.latitude, c.longitude]} icon={icons.campaigns}>
                <Popup>
                  <div className="p-1 space-y-1 text-xs min-w-[160px]">
                    <div className="flex items-center gap-1 font-bold text-blue-800">
                      <Megaphone className="w-3.5 h-3.5" /> {c.name}
                    </div>
                    <p className="text-slate-600 text-[10px]">{c.code} · {c.type}</p>
                    <p className="text-slate-500">{t('map.region')} <strong>{c.target_region}</strong></p>
                    <Badge status={c.status}>{c.status}</Badge>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Field Submissions */}
            {activeLayers.submissions && layersData?.submissions?.map((s) => (
              <Marker key={`s-${s.id}`} position={[s.latitude, s.longitude]} icon={icons.submissions}>
                <Popup>
                  <div className="p-1 space-y-1 text-xs min-w-[150px]">
                    <div className="flex items-center gap-1 font-bold text-emerald-800">
                      <ClipboardList className="w-3.5 h-3.5" /> {s.form_name || t('map.field_assessment')}
                    </div>
                    <p className="text-slate-600">Volunteer: {s.volunteer_name}</p>
                    <p className="text-slate-400 font-mono text-[10px]">
                      {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Emergencies */}
            {activeLayers.emergencies && layersData?.emergencies?.map((e) => (
              <Marker key={`e-${e.id}`} position={[e.latitude, e.longitude]} icon={icons.emergencies}>
                <Popup>
                  <div className="p-1 space-y-1 text-xs min-w-[160px]">
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

      {/* ── Summary Stats Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {LAYER_CONFIG.map(({ key, color, Icon, labelKey }) => {
          const c = STAT_CARD_COLORS[color];
          return (
            <div key={key}
              className={`rounded-2xl border p-4 flex items-center gap-4 ${c.bg} ${c.border}`}>
              <div className={`p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 ${c.icon}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-none mb-1">
                  {t(labelKey)}
                </p>
                <p className={`text-2xl font-black leading-none ${c.num}`}>
                  {loading ? '—' : counts[key]}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
